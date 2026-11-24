"""Similar Rainfall-Runoff Event Discovery Engine.

Implements:
1. Multidimensional standardized precipitation similarity
2. Signature discovery mode: 'Similar rainfall. Different response.'
   Matching meteorological forcing characteristics while highlighting contrasting streamflow responses.
"""

from dataclasses import dataclass
from typing import Any

import numpy as np
import pandas as pd


@dataclass
class SimilarityWeights:
    precip_total: float = 0.35
    precip_max_daily: float = 0.25
    precip_duration: float = 0.15
    antecedent_precip: float = 0.15
    centroid_timing: float = 0.10


@dataclass
class SimilarEventMatch:
    event_id: str
    catchment_id: str
    dataset: str
    similarity_score: float  # 0 to 100%
    precipitation_distance: float

    # Precipitation comparison
    target_precip_total_mm: float
    matched_precip_total_mm: float
    target_precip_max_mm: float
    matched_precip_max_mm: float
    target_duration_days: int
    matched_duration_days: int

    # Response divergence (The central scientific discovery)
    target_runoff_ratio: float
    matched_runoff_ratio: float
    runoff_ratio_delta: float  # matched - target
    target_lag_days: int
    matched_lag_days: int
    lag_delta_days: int
    target_peak_q_mm_day: float
    matched_peak_q_mm_day: float
    peak_q_ratio: float

    # Metadata & dates
    matched_date: str
    matched_catchment_name: str | None = None
    matched_climate: str | None = None
    matched_area_km2: float | None = None
    is_contrasting_response: bool = False

    def to_dict(self) -> dict[str, Any]:
        return {
            "event_id": self.event_id,
            "catchment_id": self.catchment_id,
            "dataset": self.dataset,
            "similarity_score": round(self.similarity_score, 1),
            "precipitation_distance": round(self.precipitation_distance, 3),
            "precipitation": {
                "target_total_mm": round(self.target_precip_total_mm, 2),
                "matched_total_mm": round(self.matched_precip_total_mm, 2),
                "target_max_mm": round(self.target_precip_max_mm, 2),
                "matched_max_mm": round(self.matched_precip_max_mm, 2),
                "target_duration_days": self.target_duration_days,
                "matched_duration_days": self.matched_duration_days,
            },
            "response_divergence": {
                "target_runoff_ratio": round(self.target_runoff_ratio, 4),
                "matched_runoff_ratio": round(self.matched_runoff_ratio, 4),
                "runoff_ratio_delta": round(self.runoff_ratio_delta, 4),
                "target_lag_days": self.target_lag_days,
                "matched_lag_days": self.matched_lag_days,
                "lag_delta_days": self.lag_delta_days,
                "target_peak_q_mm_day": round(self.target_peak_q_mm_day, 3),
                "matched_peak_q_mm_day": round(self.matched_peak_q_mm_day, 3),
                "peak_q_ratio": round(self.peak_q_ratio, 2),
                "is_contrasting": self.is_contrasting_response,
            },
            "matched_date": self.matched_date,
            "matched_catchment_name": self.matched_catchment_name,
            "matched_climate": self.matched_climate,
            "matched_area_km2": round(self.matched_area_km2, 1) if self.matched_area_km2 else None,
        }


def find_similar_events(
    target_event: dict[str, Any],
    candidate_events_df: pd.DataFrame,
    weights: SimilarityWeights | None = None,
    discovery_mode: str = "all",  # "all", "contrasting_response", "similar_response"
    min_similarity_score: float = 60.0,
    top_k: int = 10,
) -> list[SimilarEventMatch]:
    """Find rainfall-runoff events with similar precipitation characteristics.

    Parameters
    ----------
    target_event : Dict[str, Any]
        The reference event dictionary containing metrics.
    candidate_events_df : pd.DataFrame
        DataFrame of candidate events with metric columns.
    weights : SimilarityWeights, optional
    discovery_mode : str
        "all": returns closest precipitation matches.
        "contrasting_response": filters for similar precipitation but divergent runoff ratio (|delta RR| >= 0.15).
        "similar_response": filters for similar precipitation AND similar runoff ratio.
    min_similarity_score : float
        Cutoff score (0 to 100).
    top_k : int
        Maximum number of matches to return.

    Returns
    -------
    List[SimilarEventMatch]
    """
    if weights is None:
        weights = SimilarityWeights()

    df = candidate_events_df.copy()
    # Exclude the target event itself
    target_id = target_event.get("event_id")
    if target_id and "event_id" in df.columns:
        df = df[df["event_id"] != target_id]

    if len(df) == 0:
        return []

    t_metrics = target_event.get("metrics", target_event)
    t_p_tot = float(t_metrics.get("precip_total_mm", 0.0))
    t_p_max = float(t_metrics.get("precip_max_daily_mm", 0.0))
    t_dur = float(t_metrics.get("precip_duration_days", 1.0))
    t_ant_p = float(t_metrics.get("antecedent_precip_7d_mm", 0.0))
    _t_centroid = float(t_metrics.get("precip_centroid_day_offset", 0.0))
    t_rr = float(t_metrics.get("direct_runoff_ratio", 0.0))
    t_lag = int(t_metrics.get("lag_peak_to_peak_days", 0))
    t_peak_q = float(t_metrics.get("peak_discharge_mm_day", 0.0))

    # Calculate standardization scales (std dev with fallback to default IQR)
    std_p_tot = max(10.0, float(df["precip_total_mm"].std())) if "precip_total_mm" in df.columns else 25.0
    std_p_max = max(5.0, float(df["precip_max_daily_mm"].std())) if "precip_max_daily_mm" in df.columns else 15.0
    std_dur = max(1.0, float(df["precip_duration_days"].std())) if "precip_duration_days" in df.columns else 2.0
    std_ant = max(5.0, float(df["antecedent_precip_7d_mm"].std())) if "antecedent_precip_7d_mm" in df.columns else 15.0

    # Weighted normalized Euclidean distance in precipitation feature space
    d_ptot = ((df["precip_total_mm"] - t_p_tot) / std_p_tot) ** 2
    d_pmax = ((df["precip_max_daily_mm"] - t_p_max) / std_p_max) ** 2
    d_dur = ((df["precip_duration_days"] - t_dur) / std_dur) ** 2
    d_ant = ((df["antecedent_precip_7d_mm"] - t_ant_p) / std_ant) ** 2

    w_sum = weights.precip_total + weights.precip_max_daily + weights.precip_duration + weights.antecedent_precip
    weighted_dist_sq = (
        weights.precip_total * d_ptot +
        weights.precip_max_daily * d_pmax +
        weights.precip_duration * d_dur +
        weights.antecedent_precip * d_ant
    ) / w_sum

    p_distance = np.sqrt(weighted_dist_sq)

    # Convert distance to similarity score: well-calibrated decay
    df["precip_distance"] = p_distance
    df["similarity_score"] = 100.0 / (1.0 + 0.5 * p_distance)

    # Response divergence metrics
    df["rr_delta"] = df["direct_runoff_ratio"] - t_rr
    df["lag_delta"] = df["lag_peak_to_peak_days"] - t_lag
    df["abs_rr_delta"] = np.abs(df["rr_delta"])
    df["is_contrasting"] = (df["abs_rr_delta"] >= 0.15) | (np.abs(df["lag_delta"]) >= 3)

    # Filter by mode
    filtered_df = df[df["similarity_score"] >= min_similarity_score]
    if discovery_mode == "contrasting_response":
        contrasting = filtered_df[filtered_df["is_contrasting"]]
        if len(contrasting) > 0:
            filtered_df = contrasting.sort_values(by=["abs_rr_delta", "similarity_score"], ascending=[False, False])
        else:
            # Fallback: find candidate events with contrasting response across all similarity scores
            contrasting_all = df[df["is_contrasting"]]
            if len(contrasting_all) > 0:
                filtered_df = contrasting_all.sort_values(by=["similarity_score", "abs_rr_delta"], ascending=[False, False])
            else:
                filtered_df = df.sort_values(by=["abs_rr_delta", "similarity_score"], ascending=[False, False])
    elif discovery_mode == "similar_response":
        similar_resp = filtered_df[~filtered_df["is_contrasting"]]
        if len(similar_resp) > 0:
            filtered_df = similar_resp.sort_values(by="similarity_score", ascending=False)
        else:
            filtered_df = df.sort_values(by="similarity_score", ascending=False)
    else:
        filtered_df = filtered_df.sort_values(by="similarity_score", ascending=False)
        if len(filtered_df) == 0:
            filtered_df = df.sort_values(by="similarity_score", ascending=False)

    top_matches = filtered_df.head(top_k)

    results: list[SimilarEventMatch] = []
    for _, row in top_matches.iterrows():
        m_peak_q = float(row.get("peak_discharge_mm_day", 0.0))
        peak_ratio = (m_peak_q / t_peak_q) if t_peak_q > 0 else (1.0 if m_peak_q == 0 else 999.0)

        match = SimilarEventMatch(
            event_id=str(row["event_id"]),
            catchment_id=str(row["catchment_id"]),
            dataset=str(row.get("dataset", "caravan")),
            similarity_score=float(row["similarity_score"]),
            precipitation_distance=float(row["precip_distance"]),
            target_precip_total_mm=t_p_tot,
            matched_precip_total_mm=float(row["precip_total_mm"]),
            target_precip_max_mm=t_p_max,
            matched_precip_max_mm=float(row["precip_max_daily_mm"]),
            target_duration_days=int(t_dur),
            matched_duration_days=int(row["precip_duration_days"]),
            target_runoff_ratio=t_rr,
            matched_runoff_ratio=float(row["direct_runoff_ratio"]),
            runoff_ratio_delta=float(row["rr_delta"]),
            target_lag_days=t_lag,
            matched_lag_days=int(row["lag_peak_to_peak_days"]),
            lag_delta_days=int(row["lag_delta"]),
            target_peak_q_mm_day=t_peak_q,
            matched_peak_q_mm_day=m_peak_q,
            peak_q_ratio=float(peak_ratio),
            matched_date=str(row.get("precip_start_date", "")),
            matched_catchment_name=str(row.get("catchment_name", row["catchment_id"])),
            matched_climate=str(row.get("climate_zone", "Temperate")),
            matched_area_km2=float(row["area_km2"]) if "area_km2" in row and not pd.isna(row["area_km2"]) else None,
            is_contrasting_response=bool(row["is_contrasting"]),
        )
        results.append(match)

    return results
