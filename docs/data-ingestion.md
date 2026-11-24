# Data Ingestion Pipeline

The data ingestion pipeline handles raw dataset extraction, schema validation, continuous time series normalization, and precomputed derived event indexing.

## Ingestion Commands

```bash
# Ingest verified benchmark Caravan catchments (included locally)
make ingest-sample

# Ingest full Caravan v1.6 archive from local directory or CARAVAN_DATA_DIR
make ingest-caravan

# Ingest GRDC-Caravan extension from GRDC_DATA_DIR
make ingest-grdc

# Execute hydrological event detection engine across all ingested catchments
make detect-events

# Build dataset catalog manifest
make build-catalog

# Complete rebuild pipeline
make rebuild-data
```

## Processing Steps

1. **Schema Discovery & Harmonization**: Verifies presence of daily `precipitation`, `streamflow`, and `temperature`. Converts negative or invalid discharge values to NaNs.
2. **Time Series Partitioning**: Writes individual catchment time series to `data/processed/timeseries/{catchment_id}.parquet`.
3. **Geometry Generation & Simplification**: Generates GeoJSON catchment polygons and derives centroids and bounding boxes for spatial indexing.
4. **Continuous Baseflow Separation**: Digital filtering is computed over the entire uninterrupted multi-year record to eliminate edge initialization artifacts.
5. **Event Segmentation**: Identifies storm episodes, extracts antecedent conditions, tracks discharge crests, fits exponential recession limbs, and assigns quality indicators.
6. **Columnar Parquet Generation**: Compiles all detected events into `data/processed/events.parquet`.
