# HydroEventLab — System Architecture

HydroEventLab is an interactive, scientific hydrological research platform engineered to investigate how global drainage basins respond to precipitation events.

## Architectural Principles

1. **Decoupled Scientific Core (`hydro/`)**: Hydrological models, digital filters, event segmentation engines, and metrics calculators are independent of HTTP layers and frontend presentation code.
2. **Local-First Analytical Storage**: Analytical queries are executed over Apache Parquet and GeoJSON files using DuckDB in-process execution, ensuring predicate pushdown, columnar efficiency, and low memory consumption without external distributed database clusters.
3. **Reproducible Provenance**: Every derived event record stores its complete configuration, digital filtering algorithm parameters, and versioning metadata.
4. **Strict Temporal Integrity**: Observations from Caravan v1.6 and GRDC-Caravan are daily. The platform explicitly prohibits artificial sub-hourly downscaling or unverified lag interpolation.

## System Diagram

```
┌─────────────────────────────────────────────────────────────┐
│                       Client Browser                        │
│   Next.js 14 App Router • React • Tailwind CSS • D3.js      │
│   MapLibre GL JS • TanStack Query • TanStack Table • Zustand│
└──────────────────────────────┬──────────────────────────────┘
                               │ JSON / GeoJSON / CSV
                               ▼
┌─────────────────────────────────────────────────────────────┐
│                 Backend Service (FastAPI)                   │
│   apps/api/routers:                                         │
│   - system (health, datasets, overview)                     │
│   - catchments (profiles, geometry, observations, FDC)      │
│   - events (search, detail, studio hydrographs, detect)     │
│   - analysis (compare, similarity, statistics, seasonality) │
│   - exports (CSV, JSON, GeoJSON)                            │
└──────────────────────────────┬──────────────────────────────┘
                               │
            ┌──────────────────┴──────────────────┐
            ▼                                     ▼
┌─────────────────────────────┐       ┌───────────────────────────┐
│   DuckDB Query Engine       │       │ Scientific Engine (hydro/)│
│   - events.parquet          │       │ - Baseflow (Lyne-Hollick, │
│   - catchments.parquet      │       │   Eckhardt, Constant)     │
│   - timeseries/*.parquet    │       │ - Event Detection         │
│   - catchments.geojson      │       │ - Hydrological Metrics    │
│                             │       │ - Similarity Engine       │
└─────────────────────────────┘       └───────────────────────────┘
```
