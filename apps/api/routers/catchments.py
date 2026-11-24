"""Catchment catalog, profiles, geometry, and observation time series endpoints."""

import numpy as np
import pandas as pd
from fastapi import APIRouter, HTTPException, Query

from apps.api.services.db import db_service

router = APIRouter(prefix="/catchments", tags=["Catchments"])


@router.get("")
def list_catchments(
    country: str | None = None,
    climate: str | None = None,
    search: str | None = None,
    limit: int = Query(default=100, ge=1, le=500),
    offset: int = Query(default=0, ge=0),
):
    """Retrieve indexed catchments with optional search and filters."""
    catchments = db_service.list_catchments(
        country=country,
        climate=climate,
        search=search,
        limit=limit,
        offset=offset,
    )
    return {
        "count": len(catchments),
        "catchments": catchments,
    }


@router.get("/{catchment_id}")
def get_catchment_profile(catchment_id: str):
    """Retrieve comprehensive research profile for a specific catchment."""
    catchment = db_service.get_catchment(catchment_id)
    if not catchment:
        raise HTTPException(status_code=404, detail=f"Catchment {catchment_id} not found.")

    # Structure nested sub-objects for rich frontend presentation
    catchment["climate"] = {
        "mean_precipitation_mm_day": catchment.get("mean_precipitation_mm_day"),
        "mean_pet_mm_day": catchment.get("mean_pet_mm_day"),
        "aridity_index": catchment.get("aridity_index"),
        "snow_fraction": catchment.get("snow_fraction"),
        "climate_zone": catchment.get("climate_zone"),
    }
    catchment["land_cover"] = {
        "forest_fraction": catchment.get("forest_fraction"),
        "crop_fraction": catchment.get("crop_fraction"),
        "urban_fraction": catchment.get("urban_fraction"),
    }
    return catchment


@router.get("/{catchment_id}/geometry")
def get_catchment_geometry(catchment_id: str):
    """Retrieve GeoJSON boundary polygon for a catchment."""
    catchment = db_service.get_catchment(catchment_id)
    if not catchment or "geometry" not in catchment:
        raise HTTPException(status_code=404, detail=f"Geometry for catchment {catchment_id} not found.")
    return {
        "type": "Feature",
        "id": catchment_id,
        "geometry": catchment["geometry"],
        "properties": {
            "catchment_id": catchment_id,
            "gauge_name": catchment.get("gauge_name"),
            "area_km2": catchment.get("area_km2"),
        },
    }


@router.get("/{catchment_id}/observations")
def get_catchment_observations(
    catchment_id: str,
    start_date: str | None = None,
    end_date: str | None = None,
    limit: int = Query(default=2000, ge=1, le=5000),
):
    """Retrieve daily observation time series (precipitation, streamflow, temp, pet)."""
    ts = db_service.get_catchment_timeseries(
        catchment_id=catchment_id,
        start_date=start_date,
        end_date=end_date,
        limit=limit,
    )
    if not ts:
        raise HTTPException(status_code=404, detail=f"No time series records found for {catchment_id}.")
    return {
        "catchment_id": catchment_id,
        "count": len(ts),
        "observations": ts,
    }


@router.get("/{catchment_id}/statistics")
def get_catchment_hydrological_statistics(catchment_id: str):
    """Compute flow duration curve (FDC) and monthly climatology."""
    ts = db_service.get_catchment_timeseries(catchment_id=catchment_id, limit=5000)
    if not ts:
        raise HTTPException(status_code=404, detail=f"No observations for {catchment_id}")

    df = pd.DataFrame(ts)
    df["date"] = pd.to_datetime(df["date"])
    df["month"] = df["date"].dt.month

    # Flow Duration Curve (FDC): exceedance probabilities
    q_vals = df["streamflow"].dropna().sort_values(ascending=False).to_numpy()
    n_q = len(q_vals)
    exceedance_probs = (np.arange(1, n_q + 1) / (n_q + 1)) * 100.0

    # Sample FDC at standard percentiles (e.g. Q5, Q10, Q20, ... Q95, Q99)
    percentiles = [1, 5, 10, 20, 30, 40, 50, 60, 70, 80, 90, 95, 99]
    fdc_points = []
    for p in percentiles:
        idx = int(np.clip(np.searchsorted(exceedance_probs, p), 0, n_q - 1))
        fdc_points.append({
            "exceedance_probability": p,
            "streamflow_mm_day": round(float(q_vals[idx]), 3),
        })

    # Monthly precipitation and runoff climatology
    monthly_clim = []
    for m in range(1, 13):
        m_sub = df[df["month"] == m]
        monthly_clim.append({
            "month": m,
            "mean_precipitation_mm_day": round(float(m_sub["precipitation"].mean()), 2),
            "mean_streamflow_mm_day": round(float(m_sub["streamflow"].mean()), 3),
            "median_streamflow_mm_day": round(float(m_sub["streamflow"].median()), 3),
            "max_precipitation_mm_day": round(float(m_sub["precipitation"].max()), 2),
            "max_streamflow_mm_day": round(float(m_sub["streamflow"].max()), 3),
        })

    return {
        "catchment_id": catchment_id,
        "fdc": fdc_points,
        "monthly_climatology": monthly_clim,
    }


@router.get("/{catchment_id}/events")
def get_catchment_events(
    catchment_id: str,
    limit: int = Query(default=100, ge=1, le=500),
    offset: int = Query(default=0, ge=0),
):
    """Retrieve all detected historical events for this catchment."""
    events, total = db_service.list_events(
        catchment_id=catchment_id,
        limit=limit,
        offset=offset,
    )
    return {
        "catchment_id": catchment_id,
        "total_events": total,
        "events": events,
    }
