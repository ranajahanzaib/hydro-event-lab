"""Hydrological metrics engine for rainfall-runoff events.

Calculates scientifically rigorous metrics from daily observations.
All timing metrics are strictly reported in whole or decimal days.
"""

from dataclasses import dataclass
from typing import Any

import numpy as np


@dataclass
class RecessionResult:
    k: float  # Recession constant (day⁻¹)
    q0: float  # Initial discharge at start of recession (mm/day or m³/s)
    e_folding_time_days: float  # tau = 1 / k (days)
    r_squared: float  # Coefficient of determination
    rmse: float
    n_days: int
    is_valid: bool
    reason: str = ""

    def to_dict(self) -> dict[str, Any]:
        return {
            "k": round(self.k, 4) if not np.isnan(self.k) else None,
            "q0": round(self.q0, 3) if not np.isnan(self.q0) else None,
            "e_folding_time_days": round(self.e_folding_time_days, 2) if not np.isnan(self.e_folding_time_days) else None,
            "r_squared": round(self.r_squared, 4) if not np.isnan(self.r_squared) else None,
            "rmse": round(self.rmse, 4) if not np.isnan(self.rmse) else None,
            "n_days": self.n_days,
            "is_valid": self.is_valid,
            "reason": self.reason,
        }


def convert_runoff_to_volumetric(
    runoff_mm_per_day: float | np.ndarray,
    catchment_area_km2: float,
) -> float | np.ndarray:
    """Convert normalized runoff (mm/day) to mean volumetric streamflow (m³/s).

    Q(m³/s) = runoff(mm/day) * area(km²) / 86.4
    """
    if catchment_area_km2 <= 0 or np.isnan(catchment_area_km2):
        raise ValueError(f"Catchment area must be positive, got {catchment_area_km2}")
    return np.asarray(runoff_mm_per_day) * catchment_area_km2 / 86.4


def convert_volumetric_to_runoff(
    discharge_m3_s: float | np.ndarray,
    catchment_area_km2: float,
) -> float | np.ndarray:
    """Convert volumetric streamflow (m³/s) to normalized runoff depth (mm/day).

    runoff(mm/day) = Q(m³/s) * 86.4 / area(km²)
    """
    if catchment_area_km2 <= 0 or np.isnan(catchment_area_km2):
        raise ValueError(f"Catchment area must be positive, got {catchment_area_km2}")
    return np.asarray(discharge_m3_s) * 86.4 / catchment_area_km2


def calculate_daily_volume_m3(
    discharge_m3_s: float | np.ndarray,
) -> float | np.ndarray:
    """Convert volumetric flow rate (m³/s) to daily volume in m³.

    V(m³) = Q(m³/s) * 86,400 seconds/day
    """
    return np.asarray(discharge_m3_s) * 86400.0


def fit_exponential_recession(
    discharge: np.ndarray,
    min_days: int = 3,
) -> RecessionResult:
    """Fit single exponential recession model Q(t) = Q₀ * exp(-k * t).

    Parameters
    ----------
    discharge : np.ndarray
        Falling limb discharge observations starting at or immediately after peak.
    min_days : int
        Minimum number of valid recession days required.

    Returns
    -------
    RecessionResult
    """
    q = np.asarray(discharge, dtype=float)
    valid_idx = np.where(~np.isnan(q) & (q > 0))[0]

    if len(valid_idx) < min_days:
        return RecessionResult(
            k=np.nan,
            q0=np.nan,
            e_folding_time_days=np.nan,
            r_squared=np.nan,
            rmse=np.nan,
            n_days=len(valid_idx),
            is_valid=False,
            reason=f"Insufficient positive recession observations ({len(valid_idx)} < {min_days})",
        )

    t = valid_idx.astype(float)
    q_vals = q[valid_idx]
    ln_q = np.log(q_vals)

    # Linear regression: ln(Q) = ln(Q0) - k * t
    # Using np.polyfit (slope = -k, intercept = ln(Q0))
    poly, cov = np.polyfit(t, ln_q, deg=1, cov=True)
    slope = poly[0]
    intercept = poly[1]

    k = -slope
    q0 = np.exp(intercept)

    # Compute R² on actual Q values or log space
    q_pred = q0 * np.exp(-k * t)
    ss_tot = np.sum((q_vals - np.mean(q_vals)) ** 2)
    ss_res = np.sum((q_vals - q_pred) ** 2)
    r2 = 1.0 - (ss_res / ss_tot) if ss_tot > 0 else 0.0
    rmse = float(np.sqrt(np.mean((q_vals - q_pred) ** 2)))

    # Hydrological validity: k must be positive (decaying flow)
    is_valid = (k > 0.0) and (r2 >= 0.50)
    reason = "Valid recession" if is_valid else ("Non-decaying recession (k <= 0)" if k <= 0 else "Low R² (< 0.50)")
    tau = (1.0 / k) if k > 0 else np.nan

    return RecessionResult(
        k=float(k),
        q0=float(q0),
        e_folding_time_days=float(tau),
        r_squared=float(r2),
        rmse=rmse,
        n_days=len(valid_idx),
        is_valid=is_valid,
        reason=reason,
    )


@dataclass
class EventHydrologicalMetrics:
    # Precipitation metrics
    precip_total_mm: float
    precip_max_daily_mm: float
    precip_duration_days: int
    precip_wet_days: int
    precip_mean_wet_day_mm: float
    precip_centroid_day_offset: float
    antecedent_precip_7d_mm: float
    antecedent_precip_14d_mm: float
    antecedent_precip_30d_mm: float

    # Streamflow metrics (normalized mm/day)
    peak_discharge_mm_day: float
    antecedent_discharge_mm_day: float
    mean_event_discharge_mm_day: float
    peak_discharge_increase_mm_day: float
    total_runoff_depth_mm: float
    direct_runoff_depth_mm: float
    baseflow_depth_mm: float

    # Volumetric metrics (if catchment area provided)
    peak_discharge_m3_s: float | None
    total_discharge_volume_m3: float | None
    direct_discharge_volume_m3: float | None

    # Timing metrics (strictly in days)
    rising_limb_days: int
    falling_limb_days: int
    response_duration_days: int
    time_to_peak_from_onset_days: int
    lag_peak_to_peak_days: int

    # Response ratios
    direct_runoff_ratio: float  # direct_runoff_depth / precip_total
    total_runoff_ratio: float   # total_runoff_depth / precip_total

    # Recession parameters
    recession_k: float | None
    recession_tau_days: float | None
    recession_r2: float | None

    def to_dict(self) -> dict[str, Any]:
        return {
            "precip_total_mm": round(self.precip_total_mm, 2),
            "precip_max_daily_mm": round(self.precip_max_daily_mm, 2),
            "precip_duration_days": self.precip_duration_days,
            "precip_wet_days": self.precip_wet_days,
            "precip_mean_wet_day_mm": round(self.precip_mean_wet_day_mm, 2),
            "precip_centroid_day_offset": round(self.precip_centroid_day_offset, 2),
            "antecedent_precip_7d_mm": round(self.antecedent_precip_7d_mm, 2),
            "antecedent_precip_14d_mm": round(self.antecedent_precip_14d_mm, 2),
            "antecedent_precip_30d_mm": round(self.antecedent_precip_30d_mm, 2),
            "peak_discharge_mm_day": round(self.peak_discharge_mm_day, 3),
            "antecedent_discharge_mm_day": round(self.antecedent_discharge_mm_day, 3),
            "mean_event_discharge_mm_day": round(self.mean_event_discharge_mm_day, 3),
            "peak_discharge_increase_mm_day": round(self.peak_discharge_increase_mm_day, 3),
            "total_runoff_depth_mm": round(self.total_runoff_depth_mm, 2),
            "direct_runoff_depth_mm": round(self.direct_runoff_depth_mm, 2),
            "baseflow_depth_mm": round(self.baseflow_depth_mm, 2),
            "peak_discharge_m3_s": round(self.peak_discharge_m3_s, 2) if self.peak_discharge_m3_s is not None else None,
            "total_discharge_volume_m3": round(self.total_discharge_volume_m3, 0) if self.total_discharge_volume_m3 is not None else None,
            "direct_discharge_volume_m3": round(self.direct_discharge_volume_m3, 0) if self.direct_discharge_volume_m3 is not None else None,
            "rising_limb_days": self.rising_limb_days,
            "falling_limb_days": self.falling_limb_days,
            "response_duration_days": self.response_duration_days,
            "time_to_peak_from_onset_days": self.time_to_peak_from_onset_days,
            "lag_peak_to_peak_days": self.lag_peak_to_peak_days,
            "direct_runoff_ratio": round(self.direct_runoff_ratio, 4),
            "total_runoff_ratio": round(self.total_runoff_ratio, 4),
            "recession_k": round(self.recession_k, 4) if self.recession_k is not None else None,
            "recession_tau_days": round(self.recession_tau_days, 2) if self.recession_tau_days is not None else None,
            "recession_r2": round(self.recession_r2, 4) if self.recession_r2 is not None else None,
        }
