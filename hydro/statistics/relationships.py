"""Statistical relationship and seasonal response analysis engine."""

from typing import Any

import numpy as np
import pandas as pd
from scipy import stats


def compute_bivariate_relationship(
    df: pd.DataFrame,
    x_var: str,
    y_var: str,
    log_x: bool = False,
    log_y: bool = False,
    group_by: str | None = None,
) -> dict[str, Any]:
    """Compute regression and correlation statistics between two hydrological variables.

    Parameters
    ----------
    df : pd.DataFrame
    x_var : str
    y_var : str
    log_x : bool
    log_y : bool
    group_by : Optional[str]

    Returns
    -------
    Dict[str, Any]
    """
    if x_var not in df.columns or y_var not in df.columns:
        raise ValueError(f"Variables {x_var} or {y_var} not found in dataframe.")

    valid_mask = ~df[x_var].isna() & ~df[y_var].isna()
    if log_x:
        valid_mask &= (df[x_var] > 0)
    if log_y:
        valid_mask &= (df[y_var] > 0)

    clean_df = df[valid_mask].copy()
    n = len(clean_df)

    if n < 3:
        return {
            "n": n,
            "x_var": x_var,
            "y_var": y_var,
            "is_valid": False,
            "reason": f"Insufficient valid pairs ({n} < 3)",
        }

    x_vals = np.log10(clean_df[x_var].to_numpy()) if log_x else clean_df[x_var].to_numpy(dtype=float)
    y_vals = np.log10(clean_df[y_var].to_numpy()) if log_y else clean_df[y_var].to_numpy(dtype=float)

    # Pearson correlation
    pearson_r, pearson_p = stats.pearsonr(x_vals, y_vals)
    # Spearman rank correlation
    spearman_rho, spearman_p = stats.spearmanr(x_vals, y_vals)

    # Linear regression
    slope, intercept, r_val, p_val, std_err = stats.linregress(x_vals, y_vals)

    # Quantile bins (deciles) for binned trend visualization
    quantiles = np.linspace(0, 1, 11)
    bin_edges = np.quantile(x_vals, quantiles)
    bin_centers = 0.5 * (bin_edges[:-1] + bin_edges[1:])

    binned_summary: list[dict[str, Any]] = []
    for i in range(len(bin_edges) - 1):
        if i == len(bin_edges) - 2:
            in_bin = (x_vals >= bin_edges[i]) & (x_vals <= bin_edges[i + 1])
        else:
            in_bin = (x_vals >= bin_edges[i]) & (x_vals < bin_edges[i + 1])
        y_in_bin = y_vals[in_bin]
        if len(y_in_bin) > 0:
            binned_summary.append({
                "x_center": round(float(bin_centers[i]), 3),
                "y_median": round(float(np.median(y_in_bin)), 3),
                "y_q25": round(float(np.percentile(y_in_bin, 25)), 3),
                "y_q75": round(float(np.percentile(y_in_bin, 75)), 3),
                "count": len(y_in_bin),
            })

    # Group-level breakdown if requested
    grouped_stats: list[dict[str, Any]] = []
    if group_by and group_by in clean_df.columns:
        for grp_val, grp_sub in clean_df.groupby(group_by):
            gx = np.log10(grp_sub[x_var].to_numpy()) if log_x else grp_sub[x_var].to_numpy(dtype=float)
            gy = np.log10(grp_sub[y_var].to_numpy()) if log_y else grp_sub[y_var].to_numpy(dtype=float)
            if len(gx) >= 3:
                gr_val, gp_val = stats.pearsonr(gx, gy)
                grouped_stats.append({
                    "group": str(grp_val),
                    "n": len(gx),
                    "pearson_r": round(float(gr_val), 3),
                    "p_value": float(gp_val),
                })

    # Individual data points for scatter visualization
    points = []
    # Include up to 500 sample points for scatter rendering
    sample_indices = clean_df.index[:500] if len(clean_df) > 500 else clean_df.index
    for idx in sample_indices:
        row = clean_df.loc[idx]
        points.append({
            "event_id": row.get("event_id", ""),
            "catchment_id": row.get("catchment_id", ""),
            "catchment_name": row.get("catchment_name", row.get("catchment_id", "")),
            "x": round(float(np.log10(row[x_var])) if log_x else float(row[x_var]), 4),
            "y": round(float(np.log10(row[y_var])) if log_y else float(row[y_var]), 4),
            "climate_zone": row.get("climate_zone", ""),
        })

    return {
        "n": n,
        "x_var": x_var,
        "y_var": y_var,
        "log_x": log_x,
        "log_y": log_y,
        "points": points,
        "pearson_r": round(float(pearson_r), 4) if not np.isnan(pearson_r) else None,
        "pearson_p": float(pearson_p) if not np.isnan(pearson_p) else None,
        "spearman_rho": round(float(spearman_rho), 4) if not np.isnan(spearman_rho) else None,
        "spearman_p": float(spearman_p) if not np.isnan(spearman_p) else None,
        "linear_fit": {
            "slope": round(float(slope), 4),
            "intercept": round(float(intercept), 4),
            "r_squared": round(float(r_val ** 2), 4),
            "std_err": round(float(std_err), 4),
        },
        "binned_summary": binned_summary,
        "grouped_stats": grouped_stats,
        "is_valid": True,
    }


def compute_seasonal_breakdown(
    events_df: pd.DataFrame,
    hemisphere: str = "north",  # "north" or "south"
) -> dict[str, Any]:
    """Compute monthly and seasonal hydrological response statistics.

    Parameters
    ----------
    events_df : pd.DataFrame
        Must contain 'precip_start_date', 'precip_total_mm', 'direct_runoff_ratio',
        'lag_peak_to_peak_days', 'peak_discharge_mm_day'
    hemisphere : str

    Returns
    -------
    Dict[str, Any]
    """
    df = events_df.copy()
    if len(df) == 0:
        return {"monthly": [], "seasonal": []}

    df["date"] = pd.to_datetime(df["precip_start_date"])
    df["month"] = df["date"].dt.month
    df["year"] = df["date"].dt.year

    # Map month to season
    def get_season(month: int) -> str:
        if hemisphere == "south":
            if month in [12, 1, 2]:
                return "Summer (DJF)"
            elif month in [3, 4, 5]:
                return "Autumn (MAM)"
            elif month in [6, 7, 8]:
                return "Winter (JJA)"
            else:
                return "Spring (SON)"
        else:
            if month in [12, 1, 2]:
                return "Winter (DJF)"
            elif month in [3, 4, 5]:
                return "Spring (MAM)"
            elif month in [6, 7, 8]:
                return "Summer (JJA)"
            else:
                return "Autumn (SON)"

    df["season"] = df["month"].apply(get_season)

    month_names = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"]
    monthly_data: list[dict[str, Any]] = []

    for m in range(1, 13):
        m_df = df[df["month"] == m]
        n_m = len(m_df)
        if n_m > 0:
            monthly_data.append({
                "month": m,
                "month_name": month_names[m - 1],
                "event_count": n_m,
                "median_precip_mm": round(float(m_df["precip_total_mm"].median()), 2),
                "mean_precip_mm": round(float(m_df["precip_total_mm"].mean()), 2),
                "median_runoff_ratio": round(float(m_df["direct_runoff_ratio"].median()), 4),
                "q25_runoff_ratio": round(float(m_df["direct_runoff_ratio"].quantile(0.25)), 4),
                "q75_runoff_ratio": round(float(m_df["direct_runoff_ratio"].quantile(0.75)), 4),
                "median_lag_days": int(round(float(m_df["lag_peak_to_peak_days"].median()))),
                "median_peak_q_mm_day": round(float(m_df["peak_discharge_mm_day"].median()), 3),
            })
        else:
            monthly_data.append({
                "month": m,
                "month_name": month_names[m - 1],
                "event_count": 0,
                "median_precip_mm": 0.0,
                "mean_precip_mm": 0.0,
                "median_runoff_ratio": 0.0,
                "q25_runoff_ratio": 0.0,
                "q75_runoff_ratio": 0.0,
                "median_lag_days": 0,
                "median_peak_q_mm_day": 0.0,
            })

    seasonal_data: list[dict[str, Any]] = []
    for s_name, s_df in df.groupby("season"):
        seasonal_data.append({
            "season": s_name,
            "event_count": len(s_df),
            "median_precip_mm": round(float(s_df["precip_total_mm"].median()), 2),
            "median_runoff_ratio": round(float(s_df["direct_runoff_ratio"].median()), 4),
            "median_lag_days": int(round(float(s_df["lag_peak_to_peak_days"].median()))),
            "median_peak_q_mm_day": round(float(s_df["peak_discharge_mm_day"].median()), 3),
        })

    return {
        "monthly": monthly_data,
        "seasonal": seasonal_data,
        "total_events": len(df),
    }
