"""Scientific rainfall-runoff event detection engine.

Distinguishes:
1. Rainfall episodes (meteorological precipitation events)
2. Candidate response events (precipitation episodes with potential streamflow rises)
3. Accepted response events (hydrologically coherent rainfall-runoff events with validated metrics)
"""

from dataclasses import dataclass, field
from typing import Any

import numpy as np
import pandas as pd

from hydro.baseflow.separation import (
    BaseflowMethod,
    separate_baseflow,
)
from hydro.metrics.calculators import (
    EventHydrologicalMetrics,
    calculate_daily_volume_m3,
    convert_runoff_to_volumetric,
    fit_exponential_recession,
)
from hydro.quality.flags import (
    QualityAssessment,
    QualityFlagCode,
)


@dataclass
class EventDetectionConfig:
    wet_day_threshold_mm: float = 1.0
    min_event_precip_mm: float = 10.0
    max_intervening_dry_gap_days: int = 1
    antecedent_window_days: int = 7
    post_rainfall_window_days: int = 7
    min_peak_prominence_mm_day: float = 0.05
    baseflow_method: BaseflowMethod = BaseflowMethod.LYNE_HOLLICK
    baseflow_alpha: float = 0.925
    baseflow_bfi_max: float = 0.80
    algorithm_version: str = "1.0.0"

    def to_dict(self) -> dict[str, Any]:
        return {
            "wet_day_threshold_mm": self.wet_day_threshold_mm,
            "min_event_precip_mm": self.min_event_precip_mm,
            "max_intervening_dry_gap_days": self.max_intervening_dry_gap_days,
            "antecedent_window_days": self.antecedent_window_days,
            "post_rainfall_window_days": self.post_rainfall_window_days,
            "min_peak_prominence_mm_day": self.min_peak_prominence_mm_day,
            "baseflow_method": self.baseflow_method.value if isinstance(self.baseflow_method, BaseflowMethod) else str(self.baseflow_method),
            "baseflow_alpha": self.baseflow_alpha,
            "baseflow_bfi_max": self.baseflow_bfi_max,
            "algorithm_version": self.algorithm_version,
        }


@dataclass
class DetectedHydrologicalEvent:
    event_id: str
    catchment_id: str
    dataset: str

    # Date intervals (inclusive)
    precip_start_date: str
    precip_end_date: str
    peak_precip_date: str
    response_start_date: str
    peak_discharge_date: str
    response_end_date: str

    # Classification
    status: str  # "accepted", "candidate", "rainfall_only"

    # Scientific metrics
    metrics: EventHydrologicalMetrics

    # Quality assessment
    quality: QualityAssessment

    # Configuration used
    config: EventDetectionConfig

    # Daily hydrograph time series for this event window (including antecedent window)
    hydrograph: list[dict[str, Any]] = field(default_factory=list)

    def to_dict(self) -> dict[str, Any]:
        return {
            "event_id": self.event_id,
            "catchment_id": self.catchment_id,
            "dataset": self.dataset,
            "precip_start_date": self.precip_start_date,
            "precip_end_date": self.precip_end_date,
            "peak_precip_date": self.peak_precip_date,
            "response_start_date": self.response_start_date,
            "peak_discharge_date": self.peak_discharge_date,
            "response_end_date": self.response_end_date,
            "status": self.status,
            "metrics": self.metrics.to_dict(),
            "quality": self.quality.to_dict(),
            "config": self.config.to_dict(),
        }


def detect_events_for_catchment(
    df_observations: pd.DataFrame,
    catchment_id: str,
    catchment_area_km2: float | None = None,
    dataset_name: str = "caravan",
    config: EventDetectionConfig | None = None,
) -> list[DetectedHydrologicalEvent]:
    """Detect rainfall-runoff events from daily catchment observations.

    Parameters
    ----------
    df_observations : pd.DataFrame
        Must contain columns:
        - 'date' (datetime64 or string YYYY-MM-DD)
        - 'precipitation' (mm/day)
        - 'streamflow' (mm/day normalized runoff)
        Optional: 'temperature' (°C), 'pet' (mm/day), 'snow_depth_water_equivalent' (mm)
    catchment_id : str
    catchment_area_km2 : float, optional
    dataset_name : str
    config : EventDetectionConfig, optional

    Returns
    -------
    List[DetectedHydrologicalEvent]
    """
    if config is None:
        config = EventDetectionConfig()

    df = df_observations.copy()
    if "date" not in df.columns:
        raise ValueError("Observations dataframe must contain 'date' column.")
    df["date"] = pd.to_datetime(df["date"])
    df = df.sort_values("date").reset_index(drop=True)

    n_records = len(df)
    if n_records < (config.antecedent_window_days + config.post_rainfall_window_days + 5):
        return []

    # Calculate continuous baseflow separation across entire record
    streamflow_arr = df["streamflow"].to_numpy(dtype=float)
    baseflow_arr, direct_runoff_arr = separate_baseflow(
        streamflow_arr,
        method=config.baseflow_method,
        alpha=config.baseflow_alpha,
        bfi_max=config.baseflow_bfi_max,
    )
    df["baseflow"] = baseflow_arr
    df["direct_runoff"] = direct_runoff_arr

    precip_arr = df["precipitation"].to_numpy(dtype=float)

    # 1. Identify wet days
    wet_mask = (precip_arr >= config.wet_day_threshold_mm) & (~np.isnan(precip_arr))

    # 2. Group wet days into precipitation episodes allowing dry gap <= max_intervening_dry_gap_days
    episodes: list[tuple[int, int]] = []  # List of (start_idx, end_idx) inclusive
    idx = 0
    while idx < n_records:
        if wet_mask[idx]:
            start_p = idx
            end_p = idx
            search_idx = idx + 1
            while search_idx < n_records:
                if wet_mask[search_idx]:
                    end_p = search_idx
                    search_idx += 1
                elif (search_idx - end_p) <= config.max_intervening_dry_gap_days:
                    # Within dry gap tolerance, keep checking forward
                    search_idx += 1
                else:
                    break
            episodes.append((start_p, end_p))
            idx = end_p + 1
        else:
            idx += 1

    detected_events: list[DetectedHydrologicalEvent] = []

    for ep_idx, (p_start, p_end) in enumerate(episodes):
        ep_precip_slice = precip_arr[p_start : p_end + 1]
        valid_p_count = np.count_nonzero(~np.isnan(ep_precip_slice))
        p_total = float(np.nansum(ep_precip_slice))

        # Filter out episodes that do not reach minimum rainfall threshold
        if p_total < config.min_event_precip_mm:
            continue

        p_duration = p_end - p_start + 1
        p_wet_days = int(np.count_nonzero(ep_precip_slice >= config.wet_day_threshold_mm))
        p_max = float(np.nanmax(ep_precip_slice))
        p_mean_wet = float(p_total / p_wet_days) if p_wet_days > 0 else 0.0

        # Peak precipitation index
        rel_peak_p = int(np.nanargmax(ep_precip_slice))
        peak_p_idx = p_start + rel_peak_p

        # Precipitation centroid offset (days from p_start)
        days_rel = np.arange(p_duration, dtype=float)
        p_clean = np.where(np.isnan(ep_precip_slice), 0.0, ep_precip_slice)
        centroid_offset = float(np.sum(days_rel * p_clean) / p_total) if p_total > 0 else 0.0

        # Antecedent conditions
        ant_7_start = max(0, p_start - 7)
        ant_14_start = max(0, p_start - 14)
        ant_30_start = max(0, p_start - 30)

        ant_precip_7d = float(np.nansum(precip_arr[ant_7_start:p_start]))
        ant_precip_14d = float(np.nansum(precip_arr[ant_14_start:p_start]))
        ant_precip_30d = float(np.nansum(precip_arr[ant_30_start:p_start]))

        # Antecedent streamflow: 3 days before storm onset
        ant_q_slice = streamflow_arr[max(0, p_start - 3) : p_start]
        ant_q = float(np.nanmedian(ant_q_slice)) if len(ant_q_slice) > 0 and not np.all(np.isnan(ant_q_slice)) else float(np.nanmin(streamflow_arr[p_start : p_end + 1]))
        if np.isnan(ant_q):
            ant_q = 0.0

        # Search for streamflow response window:
        # From p_start to p_end + post_rainfall_window_days
        resp_search_start = p_start
        resp_search_end = min(n_records - 1, p_end + config.post_rainfall_window_days)
        resp_q_slice = streamflow_arr[resp_search_start : resp_search_end + 1]

        # Check streamflow observations
        valid_q_count = np.count_nonzero(~np.isnan(resp_q_slice))
        if valid_q_count == 0:
            # Rainfall episode without discharge observations
            continue

        peak_q_local_idx = int(np.nanargmax(resp_q_slice))
        peak_q_idx = resp_search_start + peak_q_local_idx
        peak_q = float(resp_q_slice[peak_q_local_idx])

        # Check peak prominence above antecedent flow
        peak_rise = peak_q - ant_q
        has_response = peak_rise >= config.min_peak_prominence_mm_day

        # Find response onset (rising limb start)
        # Search backward from peak_q_idx towards p_start
        resp_start_idx = p_start
        for back_i in range(peak_q_idx, max(0, p_start - 2), -1):
            if streamflow_arr[back_i] <= ant_q * 1.05 or back_i == p_start:
                resp_start_idx = back_i
                break

        # Find response end (falling limb recession boundary)
        # Search forward from peak_q_idx: when Q returns to within 10% of antecedent baseline,
        # or until next precipitation event onset, or at most 20 days after peak
        max_recession_search = min(n_records - 1, peak_q_idx + 20)
        resp_end_idx = max_recession_search

        # Check if next episode begins soon
        next_ep_start = episodes[ep_idx + 1][0] if (ep_idx + 1 < len(episodes)) else n_records

        recession_interrupted = False
        for fwd_i in range(peak_q_idx + 1, min(max_recession_search + 1, next_ep_start)):
            # If next rain pulse hits before recession reaches baseline
            if precip_arr[fwd_i] >= config.wet_day_threshold_mm * 2.0:
                recession_interrupted = True
                resp_end_idx = fwd_i - 1
                break
            # Flow dropped to near antecedent level
            if streamflow_arr[fwd_i] <= max(ant_q * 1.10, 0.02):
                resp_end_idx = fwd_i
                break

        if resp_end_idx <= peak_q_idx:
            resp_end_idx = min(n_records - 1, peak_q_idx + 2)

        # Durations and lags
        rising_limb_days = max(1, peak_q_idx - resp_start_idx)
        falling_limb_days = max(1, resp_end_idx - peak_q_idx)
        response_duration_days = resp_end_idx - resp_start_idx + 1
        time_to_peak_days = peak_q_idx - p_start
        lag_peak_to_peak_days = peak_q_idx - peak_p_idx

        # Integrate runoff volumes over the response window
        window_streamflow = streamflow_arr[resp_start_idx : resp_end_idx + 1]
        window_baseflow = baseflow_arr[resp_start_idx : resp_end_idx + 1]
        window_direct = direct_runoff_arr[resp_start_idx : resp_end_idx + 1]

        total_runoff_depth = float(np.nansum(window_streamflow))
        direct_runoff_depth = float(np.nansum(window_direct))
        baseflow_depth = float(np.nansum(window_baseflow))
        mean_event_discharge = float(np.nanmean(window_streamflow))

        # Runoff ratios
        direct_rr = float(direct_runoff_depth / p_total) if p_total > 0 else 0.0
        total_rr = float(total_runoff_depth / p_total) if p_total > 0 else 0.0

        # Volumetric calculations
        peak_q_m3_s = None
        total_vol_m3 = None
        direct_vol_m3 = None
        if catchment_area_km2 and catchment_area_km2 > 0:
            peak_q_m3_s = float(convert_runoff_to_volumetric(peak_q, catchment_area_km2))
            total_vol_m3 = float(calculate_daily_volume_m3(
                convert_runoff_to_volumetric(total_runoff_depth, catchment_area_km2)
            ))
            direct_vol_m3 = float(calculate_daily_volume_m3(
                convert_runoff_to_volumetric(direct_runoff_depth, catchment_area_km2)
            ))

        # Fit exponential recession on falling limb
        recession_slice = streamflow_arr[peak_q_idx : resp_end_idx + 1]
        recession_res = fit_exponential_recession(recession_slice, min_days=3)

        # Quality assessment
        flags: list[QualityFlagCode] = []
        completeness_p = float(valid_p_count / p_duration) if p_duration > 0 else 1.0
        completeness_q = float(valid_q_count / len(resp_q_slice)) if len(resp_q_slice) > 0 else 1.0

        if completeness_p < 0.95:
            flags.append(QualityFlagCode.MISSING_PRECIP)
        if completeness_q < 0.90:
            flags.append(QualityFlagCode.MISSING_DISCHARGE)
        if recession_interrupted:
            flags.append(QualityFlagCode.RECESSION_INTERRUPTED)
            flags.append(QualityFlagCode.OVERLAPPING_STORM)
        if p_start < config.antecedent_window_days or resp_end_idx >= (n_records - 2):
            flags.append(QualityFlagCode.TRUNCATED_SERIES)
        if direct_rr > 1.0:
            flags.append(QualityFlagCode.HIGH_RUNOFF_RATIO)
        elif direct_rr < 0.01:
            flags.append(QualityFlagCode.LOW_RUNOFF_RATIO)
        if not has_response:
            flags.append(QualityFlagCode.WEAK_DISCHARGE_RESPONSE)
        if not recession_res.is_valid:
            flags.append(QualityFlagCode.RECESSION_POOR_FIT)

        # Check for potential snowmelt influence if temperature exists
        if "temperature" in df.columns:
            temp_slice = df["temperature"].iloc[resp_start_idx : resp_end_idx + 1].to_numpy()
            if np.any(temp_slice <= 1.0) and np.any(temp_slice > 1.0):
                flags.append(QualityFlagCode.SNOWMELT_INFLUENCED)

        if len(flags) == 0:
            flags.append(QualityFlagCode.COMPLETE)

        is_acceptable = (
            has_response
            and (completeness_p >= 0.85)
            and (completeness_q >= 0.80)
            and (QualityFlagCode.MISSING_DISCHARGE not in flags)
        )

        quality = QualityAssessment(
            flags=flags,
            completeness_precip=completeness_p,
            completeness_discharge=completeness_q,
            recession_r2=recession_res.r_squared if not np.isnan(recession_res.r_squared) else 0.0,
            is_acceptable=is_acceptable,
            details={
                "recession_reason": recession_res.reason,
                "recession_interrupted": recession_interrupted,
            },
        )

        metrics = EventHydrologicalMetrics(
            precip_total_mm=p_total,
            precip_max_daily_mm=p_max,
            precip_duration_days=p_duration,
            precip_wet_days=p_wet_days,
            precip_mean_wet_day_mm=p_mean_wet,
            precip_centroid_day_offset=centroid_offset,
            antecedent_precip_7d_mm=ant_precip_7d,
            antecedent_precip_14d_mm=ant_precip_14d,
            antecedent_precip_30d_mm=ant_precip_30d,
            peak_discharge_mm_day=peak_q,
            antecedent_discharge_mm_day=ant_q,
            mean_event_discharge_mm_day=mean_event_discharge,
            peak_discharge_increase_mm_day=peak_rise,
            total_runoff_depth_mm=total_runoff_depth,
            direct_runoff_depth_mm=direct_runoff_depth,
            baseflow_depth_mm=baseflow_depth,
            peak_discharge_m3_s=peak_q_m3_s,
            total_discharge_volume_m3=total_vol_m3,
            direct_discharge_volume_m3=direct_vol_m3,
            rising_limb_days=rising_limb_days,
            falling_limb_days=falling_limb_days,
            response_duration_days=response_duration_days,
            time_to_peak_from_onset_days=time_to_peak_days,
            lag_peak_to_peak_days=lag_peak_to_peak_days,
            direct_runoff_ratio=direct_rr,
            total_runoff_ratio=total_rr,
            recession_k=recession_res.k if not np.isnan(recession_res.k) else None,
            recession_tau_days=recession_res.e_folding_time_days if not np.isnan(recession_res.e_folding_time_days) else None,
            recession_r2=recession_res.r_squared if not np.isnan(recession_res.r_squared) else None,
        )

        p_start_date_str = str(df["date"].iloc[p_start].date())
        event_id = f"{dataset_name}_{catchment_id}_{p_start_date_str.replace('-', '')}"
        status = "accepted" if is_acceptable else ("candidate" if has_response else "rainfall_only")

        # Extract hydrograph window with 5 days antecedent and 3 days post-event padding
        window_start_idx = max(0, p_start - 5)
        window_end_idx = min(n_records - 1, resp_end_idx + 3)
        hydro_window_df = df.iloc[window_start_idx : window_end_idx + 1]

        hydrograph: list[dict[str, Any]] = []
        for _, row in hydro_window_df.iterrows():
            d_str = str(row["date"].date())
            hydrograph.append({
                "date": d_str,
                "precipitation": round(float(row["precipitation"]), 2) if not pd.isna(row["precipitation"]) else None,
                "streamflow": round(float(row["streamflow"]), 3) if not pd.isna(row["streamflow"]) else None,
                "baseflow": round(float(row["baseflow"]), 3) if not pd.isna(row["baseflow"]) else None,
                "direct_runoff": round(float(row["direct_runoff"]), 3) if not pd.isna(row["direct_runoff"]) else None,
                "temperature": round(float(row["temperature"]), 1) if "temperature" in row and not pd.isna(row["temperature"]) else None,
                "is_precip_event": (p_start <= _ <= p_end),
                "is_response_event": (resp_start_idx <= _ <= resp_end_idx),
                "is_peak_precip": (_ == peak_p_idx),
                "is_peak_discharge": (_ == peak_q_idx),
            })

        event = DetectedHydrologicalEvent(
            event_id=event_id,
            catchment_id=catchment_id,
            dataset=dataset_name,
            precip_start_date=p_start_date_str,
            precip_end_date=str(df["date"].iloc[p_end].date()),
            peak_precip_date=str(df["date"].iloc[peak_p_idx].date()),
            response_start_date=str(df["date"].iloc[resp_start_idx].date()),
            peak_discharge_date=str(df["date"].iloc[peak_q_idx].date()),
            response_end_date=str(df["date"].iloc[resp_end_idx].date()),
            status=status,
            metrics=metrics,
            quality=quality,
            config=config,
            hydrograph=hydrograph,
        )

        detected_events.append(event)

    return detected_events
