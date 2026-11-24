"""Caravan v1.6 and GRDC-Caravan dataset specifications, schemas, and metadata."""

from dataclasses import dataclass
from typing import Any


@dataclass
class CatchmentMetadata:
    catchment_id: str
    gauge_id: str
    gauge_name: str
    country: str
    dataset: str  # "caravan" or "grdc_caravan"
    sub_dataset: str  # e.g., "camels_us", "camels_gb", "camels_aus", "lamah_ce", "grdc"

    latitude: float
    longitude: float
    area_km2: float
    elevation_m: float
    slope_m_per_km: float

    # Climate
    mean_precipitation_mm_day: float
    mean_pet_mm_day: float
    aridity_index: float
    snow_fraction: float
    climate_zone: str

    # Land cover
    forest_fraction: float
    crop_fraction: float
    urban_fraction: float

    # Observation period
    start_date: str
    end_date: str
    record_years: float
    completeness: float

    # Summary hydrological metrics
    median_runoff_ratio: float | None = None
    median_lag_days: int | None = None
    event_count: int = 0

    def to_dict(self) -> dict[str, Any]:
        return {
            "catchment_id": self.catchment_id,
            "gauge_id": self.gauge_id,
            "gauge_name": self.gauge_name,
            "country": self.country,
            "dataset": self.dataset,
            "sub_dataset": self.sub_dataset,
            "latitude": round(self.latitude, 5),
            "longitude": round(self.longitude, 5),
            "area_km2": round(self.area_km2, 1),
            "elevation_m": round(self.elevation_m, 1),
            "slope_m_per_km": round(self.slope_m_per_km, 2),
            "climate": {
                "mean_precipitation_mm_day": round(self.mean_precipitation_mm_day, 2),
                "mean_pet_mm_day": round(self.mean_pet_mm_day, 2),
                "aridity_index": round(self.aridity_index, 2),
                "snow_fraction": round(self.snow_fraction, 3),
                "climate_zone": self.climate_zone,
            },
            "land_cover": {
                "forest_fraction": round(self.forest_fraction, 3),
                "crop_fraction": round(self.crop_fraction, 3),
                "urban_fraction": round(self.urban_fraction, 3),
            },
            "observations": {
                "start_date": self.start_date,
                "end_date": self.end_date,
                "record_years": round(self.record_years, 1),
                "completeness": round(self.completeness, 3),
            },
            "hydrology": {
                "median_runoff_ratio": round(self.median_runoff_ratio, 4) if self.median_runoff_ratio is not None else None,
                "median_lag_days": self.median_lag_days,
                "event_count": self.event_count,
            },
        }


CARAVAN_DATASET_SPECS = {
    "name": "Caravan",
    "version": "1.6",
    "doi": "10.1038/s41597-023-01975-w",
    "zenodo_records": ["15529786", "15530021"],
    "citation": "Kratzert et al., Caravan - A global community dataset for large-sample hydrology, Scientific Data 10, 61 (2023).",
    "temporal_resolution": "Daily",
    "time_zone": "UTC / Local Standard Time per regional CAMELS source",
    "units": {
        "precipitation": "mm/day",
        "streamflow": "mm/day (catchment area normalized runoff)",
        "temperature": "°C",
        "potential_evapotranspiration": "mm/day",
        "snow_depth_water_equivalent": "mm",
    },
    "limitations": [
        "Daily aggregation precludes sub-hourly peak or hydrograph lag analysis.",
        "Catchment-averaged meteorological forcing does not represent spatial rainfall patterns within large basins.",
        "Streamflow observations are normalized by reported gauge catchment area.",
    ],
}

GRDC_CARAVAN_SPECS = {
    "name": "GRDC-Caravan",
    "version": "1.0",
    "doi": "10.5194/essd-17-4613-2025",
    "zenodo_record": "15349031",
    "citation": "Lehner et al., GRDC-Caravan extension, Earth System Science Data 17, 4613-2025 (2025).",
    "temporal_resolution": "Daily",
    "open_license": "CC-BY 4.0 compliant openly licensed subset",
}
