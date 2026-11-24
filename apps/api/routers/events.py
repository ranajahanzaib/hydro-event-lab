"""Historical rainfall-runoff events, analysis studio, and detection workbench."""

import pandas as pd
from fastapi import APIRouter, HTTPException, Query
from pydantic import BaseModel

from apps.api.services.db import db_service
from hydro.baseflow.separation import BaseflowMethod
from hydro.events.detector import EventDetectionConfig, detect_events_for_catchment
from hydro.similarity.search import find_similar_events

router = APIRouter(prefix="/events", tags=["Events"])


class EventDetectionRequest(BaseModel):
    catchment_id: str
    wet_day_threshold_mm: float = 1.0
    min_event_precip_mm: float = 10.0
    max_intervening_dry_gap_days: int = 1
    antecedent_window_days: int = 7
    post_rainfall_window_days: int = 7
    baseflow_method: str = "lyne_hollick"
    baseflow_alpha: float = 0.925
    baseflow_bfi_max: float = 0.80


@router.get("")
def list_events(
    catchment_id: str | None = None,
    country: str | None = None,
    climate: str | None = None,
    min_precip: float | None = None,
    min_runoff_ratio: float | None = None,
    max_runoff_ratio: float | None = None,
    status: str | None = "accepted",
    order_by: str = Query(default="precip_total_mm DESC"),
    limit: int = Query(default=50, ge=1, le=200),
    offset: int = Query(default=0, ge=0),
):
    """Search and filter historical events."""
    events, total = db_service.list_events(
        catchment_id=catchment_id,
        country=country,
        climate=climate,
        min_precip=min_precip,
        min_runoff_ratio=min_runoff_ratio,
        max_runoff_ratio=max_runoff_ratio,
        status=status,
        order_by=order_by,
        limit=limit,
        offset=offset,
    )
    return {
        "total": total,
        "count": len(events),
        "events": events,
    }


@router.get("/{event_id}")
def get_event(event_id: str):
    """Retrieve full event detail including metadata and hydrograph."""
    event = db_service.get_event(event_id)
    if not event:
        raise HTTPException(status_code=404, detail=f"Event {event_id} not found.")
    return event


@router.get("/{event_id}/hydrograph")
def get_event_hydrograph(event_id: str):
    """Retrieve time series hydrograph points for an event."""
    event = db_service.get_event(event_id)
    if not event:
        raise HTTPException(status_code=404, detail=f"Event {event_id} not found.")
    return {
        "event_id": event_id,
        "catchment_id": event.get("catchment_id"),
        "hydrograph": event.get("hydrograph", []),
    }


@router.get("/{event_id}/metrics")
def get_event_metrics(event_id: str):
    """Retrieve calculated hydrological metrics."""
    event = db_service.get_event(event_id)
    if not event:
        raise HTTPException(status_code=404, detail=f"Event {event_id} not found.")
    # Extract metrics subset
    metric_keys = [
        "precip_total_mm", "precip_max_daily_mm", "precip_duration_days",
        "precip_wet_days", "antecedent_precip_7d_mm", "antecedent_precip_14d_mm",
        "antecedent_precip_30d_mm", "peak_discharge_mm_day", "antecedent_discharge_mm_day",
        "mean_event_discharge_mm_day", "peak_discharge_increase_mm_day",
        "total_runoff_depth_mm", "direct_runoff_depth_mm", "baseflow_depth_mm",
        "peak_discharge_m3_s", "total_discharge_volume_m3", "direct_discharge_volume_m3",
        "rising_limb_days", "falling_limb_days", "response_duration_days",
        "time_to_peak_from_onset_days", "lag_peak_to_peak_days",
        "direct_runoff_ratio", "total_runoff_ratio",
        "recession_k", "recession_tau_days", "recession_r2",
    ]
    return {
        "event_id": event_id,
        "metrics": {k: event.get(k) for k in metric_keys if k in event},
    }


@router.get("/{event_id}/quality")
def get_event_quality(event_id: str):
    """Retrieve quality indicators and diagnostic flags."""
    event = db_service.get_event(event_id)
    if not event:
        raise HTTPException(status_code=404, detail=f"Event {event_id} not found.")
    return {
        "event_id": event_id,
        "is_acceptable": event.get("is_acceptable", True),
        "quality_flags": event.get("quality_flags", []),
        "completeness_precip": event.get("completeness_precip", 1.0),
        "completeness_discharge": event.get("completeness_discharge", 1.0),
    }


@router.get("/{event_id}/similar")
def get_similar_events_for_event(
    event_id: str,
    discovery_mode: str = Query(default="contrasting_response"),  # "contrasting_response", "similar_response", "all"
    min_similarity_score: float = Query(default=25.0, ge=0.0, le=100.0),
    top_k: int = Query(default=10, ge=1, le=50),
):
    """Discover events with similar rainfall forcing characteristics."""
    target_event = db_service.get_event(event_id)
    if not target_event:
        raise HTTPException(status_code=404, detail=f"Event {event_id} not found.")

    # Load all accepted events as candidate search space
    conn = db_service.get_connection()
    df_candidates = conn.execute(f"SELECT * FROM read_parquet('{db_service.events_path}') WHERE status = 'accepted'").df()
    conn.close()

    matches = find_similar_events(
        target_event=target_event,
        candidate_events_df=df_candidates,
        discovery_mode=discovery_mode,
        min_similarity_score=min_similarity_score,
        top_k=top_k,
    )

    return {
        "target_event_id": event_id,
        "target_catchment_id": target_event.get("catchment_id"),
        "target_catchment_name": target_event.get("catchment_name"),
        "discovery_mode": discovery_mode,
        "matches_count": len(matches),
        "matches": [m.to_dict() for m in matches],
    }


@router.post("/detect")
def run_event_detection_workbench(req: EventDetectionRequest):
    """Interactive Event Detection Workbench: recalculate detection parameters dynamically."""
    catchment = db_service.get_catchment(req.catchment_id)
    if not catchment:
        raise HTTPException(status_code=404, detail=f"Catchment {req.catchment_id} not found.")

    obs_records = db_service.get_catchment_timeseries(catchment_id=req.catchment_id, limit=5000)
    if not obs_records:
        raise HTTPException(status_code=404, detail=f"No observations found for {req.catchment_id}.")

    df_obs = pd.DataFrame(obs_records)

    # Map baseflow method string
    bf_method = BaseflowMethod.LYNE_HOLLICK
    if req.baseflow_method == "constant_baseline":
        bf_method = BaseflowMethod.CONSTANT_BASELINE
    elif req.baseflow_method == "eckhardt":
        bf_method = BaseflowMethod.ECKHARDT

    config = EventDetectionConfig(
        wet_day_threshold_mm=req.wet_day_threshold_mm,
        min_event_precip_mm=req.min_event_precip_mm,
        max_intervening_dry_gap_days=req.max_intervening_dry_gap_days,
        antecedent_window_days=req.antecedent_window_days,
        post_rainfall_window_days=req.post_rainfall_window_days,
        baseflow_method=bf_method,
        baseflow_alpha=req.baseflow_alpha,
        baseflow_bfi_max=req.baseflow_bfi_max,
    )

    detected_events = detect_events_for_catchment(
        df_observations=df_obs,
        catchment_id=req.catchment_id,
        catchment_area_km2=float(catchment.get("area_km2", 100.0)),
        dataset_name=str(catchment.get("dataset", "caravan")),
        config=config,
    )

    results = []
    for ev in detected_events:
        d = ev.to_dict()
        # include light summary of hydrograph
        d["hydrograph_summary"] = {
            "start": ev.precip_start_date,
            "peak_p": ev.peak_precip_date,
            "peak_q": ev.peak_discharge_date,
            "end": ev.response_end_date,
        }
        results.append(d)

    return {
        "catchment_id": req.catchment_id,
        "config": config.to_dict(),
        "total_detected": len(detected_events),
        "accepted_count": sum(1 for e in detected_events if e.status == "accepted"),
        "candidate_count": sum(1 for e in detected_events if e.status == "candidate"),
        "rainfall_only_count": sum(1 for e in detected_events if e.status == "rainfall_only"),
        "events": results,
    }
