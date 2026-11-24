"""System, health, datasets, and overview endpoints."""

from fastapi import APIRouter

from apps.api.services.db import db_service
from hydro.datasets.caravan import CARAVAN_DATASET_SPECS, GRDC_CARAVAN_SPECS

router = APIRouter(tags=["System"])


@router.get("/health")
def get_health():
    return {
        "status": "healthy",
        "service": "HydroEventLab Scientific API",
        "version": "1.0.0",
        "temporal_resolution": "Daily",
    }


@router.get("/datasets")
def get_datasets():
    return {
        "datasets": [
            CARAVAN_DATASET_SPECS,
            GRDC_CARAVAN_SPECS,
        ],
        "attribution_notice": "Caravan v1.6 and GRDC-Caravan provide catchment-averaged daily hydrometeorological time series.",
        "scientific_notice": "HydroEventLab is an academic research environment for historical rainfall-runoff event investigation, not an operational flood forecasting or flash-flood warning system.",
    }


@router.get("/overview")
def get_overview():
    stats = db_service.get_overview_stats()
    return stats
