"""Research exports in CSV, JSON, and GeoJSON."""

import io
import json

import pandas as pd
from fastapi import APIRouter, HTTPException, Query, Response

from apps.api.services.db import db_service

router = APIRouter(prefix="/exports", tags=["Exports"])


@router.get("/events")
def export_events(
    format: str = Query(default="csv", pattern="^(csv|json)$"),
    catchment_id: str | None = None,
    country: str | None = None,
):
    """Export filtered events to CSV or JSON."""
    events, _ = db_service.list_events(
        catchment_id=catchment_id,
        country=country,
        limit=1000,
    )
    df = pd.DataFrame(events)

    if format == "csv":
        out = io.StringIO()
        df.to_csv(out, index=False)
        return Response(
            content=out.getvalue(),
            media_type="text/csv",
            headers={"Content-Disposition": 'attachment; filename="hydro_events_export.csv"'},
        )
    else:
        return {
            "metadata": {
                "source": "HydroEventLab Research Platform",
                "format": "JSON",
                "count": len(events),
            },
            "events": events,
        }


@router.get("/catchments/geojson")
def export_catchments_geojson():
    """Export all indexed catchment polygons as GeoJSON."""
    geojson_path = db_service.geojson_path
    if not geojson_path.exists():
        raise HTTPException(status_code=404, detail="Catchments GeoJSON not found.")

    with open(geojson_path) as f:
        data = json.load(f)

    return Response(
        content=json.dumps(data),
        media_type="application/geo+json",
        headers={"Content-Disposition": 'attachment; filename="catchments.geojson"'},
    )
