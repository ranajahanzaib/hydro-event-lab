"""Data ingestion pipeline and catalog generation."""

import json
import logging
from pathlib import Path
from typing import Any

import numpy as np
import pandas as pd

from hydro.datasets.caravan import CARAVAN_DATASET_SPECS
from hydro.events.detector import EventDetectionConfig, detect_events_for_catchment
from hydro.ingestion.sample_data import (
    SAMPLE_CATCHMENTS,
    create_catchment_polygon,
    generate_catchment_timeseries,
)

logger = logging.getLogger(__name__)


def ingest_sample_dataset(output_dir: str | Path = "./data") -> dict[str, Any]:
    """Ingest and normalize the benchmark Caravan catchments dataset.

    Generates:
    - data/processed/timeseries/{catchment_id}.parquet
    - data/processed/catchments.parquet
    - data/processed/catchments.geojson
    """
    out_path = Path(output_dir)
    processed_dir = out_path / "processed"
    ts_dir = processed_dir / "timeseries"
    ts_dir.mkdir(parents=True, exist_ok=True)

    catchment_records = []
    geojson_features = []

    for meta in SAMPLE_CATCHMENTS:
        cid = meta["catchment_id"]
        # Generate multi-year timeseries
        df_ts = generate_catchment_timeseries(meta)
        ts_file = ts_dir / f"{cid}.parquet"
        df_ts.to_parquet(ts_file, index=False)

        # Generate geometry
        poly_geom = create_catchment_polygon(meta["latitude"], meta["longitude"], meta["area_km2"])

        record = dict(meta)
        record["timeseries_path"] = str(ts_file)
        record["geometry"] = json.dumps(poly_geom)
        record["record_years"] = 5.0
        record["completeness"] = 1.0
        catchment_records.append(record)

        feature = {
            "type": "Feature",
            "id": cid,
            "geometry": poly_geom,
            "properties": {
                "catchment_id": cid,
                "gauge_id": meta["gauge_id"],
                "gauge_name": meta["gauge_name"],
                "country": meta["country"],
                "dataset": meta["dataset"],
                "sub_dataset": meta["sub_dataset"],
                "latitude": meta["latitude"],
                "longitude": meta["longitude"],
                "area_km2": meta["area_km2"],
                "elevation_m": meta["elevation_m"],
                "slope_m_per_km": meta["slope_m_per_km"],
                "mean_precipitation_mm_day": meta["mean_precipitation_mm_day"],
                "mean_pet_mm_day": meta["mean_pet_mm_day"],
                "aridity_index": meta["aridity_index"],
                "snow_fraction": meta["snow_fraction"],
                "climate_zone": meta["climate_zone"],
                "forest_fraction": meta["forest_fraction"],
            },
        }
        geojson_features.append(feature)

    # Save catchments GeoJSON
    geojson_path = processed_dir / "catchments.geojson"
    with open(geojson_path, "w") as f:
        json.dump({
            "type": "FeatureCollection",
            "features": geojson_features,
        }, f, indent=2)

    # Save catchments parquet
    df_catchments = pd.DataFrame(catchment_records)
    df_catchments.to_parquet(processed_dir / "catchments.parquet", index=False)

    return {
        "catchments_ingested": len(catchment_records),
        "geojson_path": str(geojson_path),
        "processed_dir": str(processed_dir),
    }


def detect_and_store_all_events(
    processed_dir: str | Path = "./data/processed",
    config: EventDetectionConfig | None = None,
) -> dict[str, Any]:
    """Run event detection over all ingested catchments and store to events.parquet."""
    p_dir = Path(processed_dir)
    ts_dir = p_dir / "timeseries"
    catchments_file = p_dir / "catchments.parquet"

    if not catchments_file.exists():
        raise FileNotFoundError(f"Catchments metadata missing at {catchments_file}")

    df_catchments = pd.read_parquet(catchments_file)
    all_events_records = []
    catchment_updates = {}

    for _, c_row in df_catchments.iterrows():
        cid = c_row["catchment_id"]
        ts_file = ts_dir / f"{cid}.parquet"
        if not ts_file.exists():
            continue

        df_obs = pd.read_parquet(ts_file)
        events = detect_events_for_catchment(
            df_observations=df_obs,
            catchment_id=cid,
            catchment_area_km2=float(c_row["area_km2"]),
            dataset_name=str(c_row["dataset"]),
            config=config,
        )

        rr_list = []
        lag_list = []

        for ev in events:
            ev_dict = ev.to_dict()
            metrics = ev_dict["metrics"]
            quality = ev_dict["quality"]

            # Flatten row for DuckDB / Parquet querying
            rec = {
                "event_id": ev.event_id,
                "catchment_id": cid,
                "catchment_name": c_row["gauge_name"],
                "country": c_row["country"],
                "climate_zone": c_row["climate_zone"],
                "area_km2": float(c_row["area_km2"]),
                "dataset": ev.dataset,
                "status": ev.status,
                "precip_start_date": ev.precip_start_date,
                "precip_end_date": ev.precip_end_date,
                "peak_precip_date": ev.peak_precip_date,
                "response_start_date": ev.response_start_date,
                "peak_discharge_date": ev.peak_discharge_date,
                "response_end_date": ev.response_end_date,
                # Metrics
                "precip_total_mm": metrics["precip_total_mm"],
                "precip_max_daily_mm": metrics["precip_max_daily_mm"],
                "precip_duration_days": metrics["precip_duration_days"],
                "precip_wet_days": metrics["precip_wet_days"],
                "antecedent_precip_7d_mm": metrics["antecedent_precip_7d_mm"],
                "antecedent_precip_14d_mm": metrics["antecedent_precip_14d_mm"],
                "antecedent_precip_30d_mm": metrics["antecedent_precip_30d_mm"],
                "precip_centroid_day_offset": metrics["precip_centroid_day_offset"],
                "peak_discharge_mm_day": metrics["peak_discharge_mm_day"],
                "antecedent_discharge_mm_day": metrics["antecedent_discharge_mm_day"],
                "mean_event_discharge_mm_day": metrics["mean_event_discharge_mm_day"],
                "peak_discharge_increase_mm_day": metrics["peak_discharge_increase_mm_day"],
                "total_runoff_depth_mm": metrics["total_runoff_depth_mm"],
                "direct_runoff_depth_mm": metrics["direct_runoff_depth_mm"],
                "baseflow_depth_mm": metrics["baseflow_depth_mm"],
                "peak_discharge_m3_s": metrics["peak_discharge_m3_s"],
                "total_discharge_volume_m3": metrics["total_discharge_volume_m3"],
                "direct_discharge_volume_m3": metrics["direct_discharge_volume_m3"],
                "rising_limb_days": metrics["rising_limb_days"],
                "falling_limb_days": metrics["falling_limb_days"],
                "response_duration_days": metrics["response_duration_days"],
                "time_to_peak_from_onset_days": metrics["time_to_peak_from_onset_days"],
                "lag_peak_to_peak_days": metrics["lag_peak_to_peak_days"],
                "direct_runoff_ratio": metrics["direct_runoff_ratio"],
                "total_runoff_ratio": metrics["total_runoff_ratio"],
                "recession_k": metrics["recession_k"],
                "recession_tau_days": metrics["recession_tau_days"],
                "recession_r2": metrics["recession_r2"],
                # Quality
                "quality_flags": json.dumps(quality["flags"]),
                "is_acceptable": quality["is_acceptable"],
                "completeness_precip": quality["completeness_precip"],
                "completeness_discharge": quality["completeness_discharge"],
                # Full hydrograph window serialized as JSON
                "hydrograph_json": json.dumps(ev.hydrograph),
            }
            all_events_records.append(rec)
            if ev.status == "accepted":
                rr_list.append(metrics["direct_runoff_ratio"])
                lag_list.append(metrics["lag_peak_to_peak_days"])

        catchment_updates[cid] = {
            "median_runoff_ratio": float(np.median(rr_list)) if rr_list else None,
            "median_lag_days": int(round(float(np.median(lag_list)))) if lag_list else None,
            "event_count": len(events),
        }

    # Save events to Parquet
    df_events = pd.DataFrame(all_events_records)
    events_parquet = p_dir / "events.parquet"
    df_events.to_parquet(events_parquet, index=False)

    # Update catchments with aggregated event metrics
    for cid, updates in catchment_updates.items():
        mask = df_catchments["catchment_id"] == cid
        df_catchments.loc[mask, "median_runoff_ratio"] = updates["median_runoff_ratio"]
        df_catchments.loc[mask, "median_lag_days"] = updates["median_lag_days"]
        df_catchments.loc[mask, "event_count"] = updates["event_count"]

    df_catchments.to_parquet(catchments_file, index=False)

    return {
        "total_events_detected": len(all_events_records),
        "events_file": str(events_parquet),
        "catchments_updated": len(catchment_updates),
    }


def build_catalog_manifest(processed_dir: str | Path = "./data/processed") -> dict[str, Any]:
    """Build dataset manifest and summary catalog."""
    p_dir = Path(processed_dir)
    manifest_dir = p_dir.parent / "manifests"
    manifest_dir.mkdir(parents=True, exist_ok=True)

    c_file = p_dir / "catchments.parquet"
    e_file = p_dir / "events.parquet"

    df_c = pd.read_parquet(c_file) if c_file.exists() else pd.DataFrame()
    df_e = pd.read_parquet(e_file) if e_file.exists() else pd.DataFrame()

    manifest = {
        "name": "HydroEventLab Dataset Catalog",
        "primary_dataset": CARAVAN_DATASET_SPECS,
        "indexed_catchments": len(df_c),
        "indexed_events": len(df_e),
        "countries": sorted(df_c["country"].unique().tolist()) if len(df_c) > 0 else [],
        "climate_zones": sorted(df_c["climate_zone"].unique().tolist()) if len(df_c) > 0 else [],
        "min_date": "2018-01-01",
        "max_date": "2022-12-31",
    }

    with open(manifest_dir / "catalog.json", "w") as f:
        json.dump(manifest, f, indent=2)

    return manifest
