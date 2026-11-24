# REST API Documentation

The HydroEventLab backend exposes a documented, versioned REST API at `/api/v1`.

## Endpoints

### System & Datasets

- `GET /api/v1/health`: System health and temporal resolution confirmation.
- `GET /api/v1/datasets`: Specifications for Caravan v1.6 and GRDC-Caravan.
- `GET /api/v1/overview`: Aggregated catchment counts, detected event counts, and coverage period.

### Catchments

- `GET /api/v1/catchments`: Query catchments with search, country, and climate filters.
- `GET /api/v1/catchments/{id}`: Detailed research profile and environmental attributes.
- `GET /api/v1/catchments/{id}/geometry`: GeoJSON boundary polygon.
- `GET /api/v1/catchments/{id}/observations`: Continuous daily hydrometeorological time series.
- `GET /api/v1/catchments/{id}/statistics`: Flow duration curve and monthly climatology.
- `GET /api/v1/catchments/{id}/events`: Detected historical events for a specific catchment.

### Historical Events

- `GET /api/v1/events`: Searchable catalog with sorting, pagination, and multi-criteria filtering.
- `GET /api/v1/events/{id}`: Full event details including serialized hydrograph points.
- `GET /api/v1/events/{id}/hydrograph`: Daily observation series for the event window.
- `GET /api/v1/events/{id}/metrics`: Calculated hydrological metrics.
- `GET /api/v1/events/{id}/quality`: Quality flags and completeness metrics.
- `GET /api/v1/events/{id}/similar`: Discover similar precipitation events across catchments.
- `POST /api/v1/events/detect`: Interactive Event Detection Workbench recalculation.

### Comparative & Statistical Analysis

- `POST /api/v1/compare`: Compare 2 to 6 events with synchronized alignment and flow normalization.
- `POST /api/v1/similarity/search`: Multidimensional similar event discovery query.
- `POST /api/v1/statistics/query`: Multivariate regression, Pearson/Spearman correlation, and decile summaries.
- `GET /api/v1/seasonality`: Monthly and seasonal response distributions.

### Exports

- `GET /api/v1/exports/events`: Export filtered event catalog as CSV or JSON.
- `GET /api/v1/exports/catchments/geojson`: Export all indexed catchment polygons as GeoJSON.
