"""Comparison, similarity search, statistical relationships, and seasonality endpoints."""

import pandas as pd
from fastapi import APIRouter, HTTPException, Query
from pydantic import BaseModel

from apps.api.services.db import db_service
from hydro.similarity.search import find_similar_events
from hydro.statistics.relationships import (
    compute_bivariate_relationship,
    compute_seasonal_breakdown,
)

router = APIRouter(tags=["Analysis"])


class CompareRequest(BaseModel):
    event_ids: list[str]
    alignment_mode: str = "days_since_rainfall_onset"  # "calendar_date", "days_since_rainfall_onset", "days_since_peak_precip", "days_relative_to_peak_q"
    normalization_mode: str = "runoff_depth_mm"  # "runoff_depth_mm", "volumetric_m3_s", "normalized_peak_fraction"


class SimilaritySearchRequest(BaseModel):
    target_event_id: str | None = None
    target_precip_total_mm: float | None = None
    target_precip_max_daily_mm: float | None = None
    target_duration_days: int | None = 3
    target_antecedent_precip_7d_mm: float | None = 0.0
    discovery_mode: str = "contrasting_response"  # "contrasting_response", "similar_response", "all"
    min_similarity_score: float = 60.0
    top_k: int = 10


class StatisticsQueryRequest(BaseModel):
    x_var: str = "precip_total_mm"
    y_var: str = "direct_runoff_ratio"
    log_x: bool = False
    log_y: bool = False
    country: str | None = None
    climate: str | None = None


@router.post("/compare")
def compare_events(req: CompareRequest):
    """Compare 2 to 6 rainfall-runoff events with synchronized alignment and metrics."""
    if len(req.event_ids) < 2 or len(req.event_ids) > 6:
        raise HTTPException(status_code=400, detail="Event comparison requires between 2 and 6 events.")

    events_data = []
    catchments_map = {}

    for eid in req.event_ids:
        ev = db_service.get_event(eid)
        if not ev:
            raise HTTPException(status_code=404, detail=f"Event {eid} not found.")
        events_data.append(ev)
        cid = ev.get("catchment_id")
        if cid and cid not in catchments_map:
            c = db_service.get_catchment(cid)
            if c:
                catchments_map[cid] = c

    # Process alignment for small multiples or overlay
    aligned_series = []
    for ev in events_data:
        h = ev.get("hydrograph", [])
        peak_p_date = ev.get("peak_precip_date")
        peak_q_date = ev.get("peak_discharge_date")
        start_date = ev.get("precip_start_date")

        peak_q_val = float(ev.get("peak_discharge_mm_day", 1.0))
        area_km2 = float(ev.get("area_km2", 100.0))

        series_points = []
        for pt in h:
            d_str = pt["date"]
            # Alignment calculations
            if req.alignment_mode == "days_since_peak_precip":
                offset = (pd.to_datetime(d_str) - pd.to_datetime(peak_p_date)).days
            elif req.alignment_mode == "days_relative_to_peak_q":
                offset = (pd.to_datetime(d_str) - pd.to_datetime(peak_q_date)).days
            elif req.alignment_mode == "calendar_date":
                offset = d_str
            else:  # "days_since_rainfall_onset"
                offset = (pd.to_datetime(d_str) - pd.to_datetime(start_date)).days

            # Streamflow normalization
            q_mm = float(pt["streamflow"]) if pt.get("streamflow") is not None else 0.0
            if req.normalization_mode == "volumetric_m3_s":
                val = q_mm * area_km2 / 86.4
            elif req.normalization_mode == "normalized_peak_fraction":
                val = (q_mm / peak_q_val) if peak_q_val > 0 else 0.0
            else:  # "runoff_depth_mm"
                val = q_mm

            series_points.append({
                "aligned_x": offset,
                "date": d_str,
                "precipitation": pt.get("precipitation"),
                "streamflow": round(val, 4),
                "baseflow": pt.get("baseflow"),
                "direct_runoff": pt.get("direct_runoff"),
            })

        aligned_series.append({
            "event_id": ev["event_id"],
            "catchment_id": ev["catchment_id"],
            "catchment_name": ev.get("catchment_name"),
            "country": ev.get("country"),
            "climate_zone": ev.get("climate_zone"),
            "area_km2": ev.get("area_km2"),
            "precip_total_mm": ev.get("precip_total_mm"),
            "direct_runoff_ratio": ev.get("direct_runoff_ratio"),
            "lag_peak_to_peak_days": ev.get("lag_peak_to_peak_days"),
            "peak_discharge_mm_day": ev.get("peak_discharge_mm_day"),
            "series": series_points,
        })

    # Metric contrast comparison
    rrs = [float(e.get("direct_runoff_ratio", 0.0)) for e in events_data]
    lags = [int(e.get("lag_peak_to_peak_days", 0)) for e in events_data]
    precips = [float(e.get("precip_total_mm", 0.0)) for e in events_data]

    contrast_summary = {
        "runoff_ratio_range": round(max(rrs) - min(rrs), 4),
        "lag_days_range": max(lags) - min(lags),
        "precip_range_mm": round(max(precips) - min(precips), 2),
        "scientific_observation": (
            "Divergent hydrological response under comparable meteorological forcing."
            if (max(precips) - min(precips) <= 20.0 and max(rrs) - min(rrs) >= 0.15)
            else "Contrasting catchment rainfall-runoff dynamics."
        ),
    }

    return {
        "event_ids": req.event_ids,
        "alignment_mode": req.alignment_mode,
        "normalization_mode": req.normalization_mode,
        "aligned_events": aligned_series,
        "catchments": catchments_map,
        "contrast_summary": contrast_summary,
    }


@router.post("/similarity/search")
def search_similar_events(req: SimilaritySearchRequest):
    """Multidimensional Similar Event Discovery."""
    conn = db_service.get_connection()
    df_candidates = conn.execute(f"SELECT * FROM read_parquet('{db_service.events_path}') WHERE status = 'accepted'").df()
    conn.close()

    if req.target_event_id:
        target_event = db_service.get_event(req.target_event_id)
        if not target_event:
            raise HTTPException(status_code=404, detail=f"Target event {req.target_event_id} not found.")
    else:
        # Synthetic reference from user inputs
        target_event = {
            "event_id": "custom_query",
            "metrics": {
                "precip_total_mm": req.target_precip_total_mm or 45.0,
                "precip_max_daily_mm": req.target_precip_max_daily_mm or 25.0,
                "precip_duration_days": req.target_duration_days or 3,
                "antecedent_precip_7d_mm": req.target_antecedent_precip_7d_mm or 5.0,
                "precip_centroid_day_offset": 1.2,
                "direct_runoff_ratio": 0.25,
                "lag_peak_to_peak_days": 1,
                "peak_discharge_mm_day": 3.0,
            },
        }

    matches = find_similar_events(
        target_event=target_event,
        candidate_events_df=df_candidates,
        discovery_mode=req.discovery_mode,
        min_similarity_score=req.min_similarity_score,
        top_k=req.top_k,
    )

    return {
        "target": target_event.get("event_id"),
        "discovery_mode": req.discovery_mode,
        "matches_count": len(matches),
        "matches": [m.to_dict() for m in matches],
    }


@router.post("/statistics/query")
def query_bivariate_statistics(req: StatisticsQueryRequest):
    """Compute regression, correlation, and binned quantiles across all events."""
    conn = db_service.get_connection()
    query = f"SELECT * FROM read_parquet('{db_service.events_path}') WHERE status = 'accepted'"
    params = []
    if req.country:
        query += " AND country = ?"
        params.append(req.country)
    if req.climate:
        query += " AND climate_zone ILIKE ?"
        params.append(f"%{req.climate}%")

    df = conn.execute(query, params).df()
    conn.close()

    result = compute_bivariate_relationship(
        df=df,
        x_var=req.x_var,
        y_var=req.y_var,
        log_x=req.log_x,
        log_y=req.log_y,
        group_by="climate_zone",
    )
    return result


@router.get("/seasonality")
def get_seasonal_hydrology(
    catchment_id: str | None = None,
    hemisphere: str = Query(default="north"),
):
    """Retrieve monthly and seasonal response distributions."""
    conn = db_service.get_connection()
    query = f"SELECT * FROM read_parquet('{db_service.events_path}') WHERE status = 'accepted'"
    params = []
    if catchment_id:
        query += " AND catchment_id = ?"
        params.append(catchment_id)

    df = conn.execute(query, params).df()
    conn.close()

    seasonal_breakdown = compute_seasonal_breakdown(df, hemisphere=hemisphere)
    return seasonal_breakdown
