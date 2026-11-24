# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/), and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [0.1.0] - 2026-11-24

### Added

- **Scientific Hydrological Engine (`hydro/`)**:
  - Continuous baseflow separation implementing Lyne-Hollick (1979) 3-pass digital recursive filter, Eckhardt (2005) two-parameter filter, and constant pre-event baseline.
  - Two-stage rainfall-runoff event detection separating meteorological forcing from hydrological responses.
  - Rigorous hydrological metrics calculation (direct runoff ratio, peak-to-peak lag in days, exponential recession $k, \tau, R^2$, volume conversions).
  - Similar Event Discovery with signature _"Similar rainfall. Different response."_ mode.
  - Bivariate regression, Pearson $r$, Spearman $\rho$, decile trend summaries, and seasonal climatology.
- **FastAPI Columnar Analytical Backend (`apps/api/`)**:
  - DuckDB in-process queries over Apache Parquet and GeoJSON files with predicate pushdown.
  - REST endpoints for catchments, events, comparative analyses, and CSV/JSON data exports.
  - JSON NaN and Infinity sanitizer for strict standards compliance.
- **Next.js 14 Web Application (`apps/web/`)**:
  - MapLibre GL JS dark cartographic atlas with real-time choropleth rendering and polygon selection.
  - Master D3.js hydrograph with inverted precipitation hyetograph, baseflow and direct runoff fills, synchronized crosshair tooltips, and vector SVG export.
  - Interactive Event Detection Workbench allowing dynamic parameter tuning and instantaneous recalculation.
  - Flow duration curves and monthly climatology visualizations.
- **Benchmark Dataset & Ingestion Pipeline**:
  - Sample dataset covering 8 verified global catchments across CAMELS (US, GB, AUS) and LamaH-CE.
  - CLI scripts for data ingestion, event detection, and catalog builds.
- **Documentation & CI/CD**:
  - 14 comprehensive architecture, methodology, dataset attribution, and operational guides.
  - GitHub Actions CI matrix with automated test and lint validation.
