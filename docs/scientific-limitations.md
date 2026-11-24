# Scientific Limitations & Research Boundaries

HydroEventLab is an academic research environment for historical rainfall-runoff event investigation, not an operational flood forecasting or flash-flood warning system.

## 1. Daily Aggregation Interval

Caravan and GRDC-Caravan report observations at daily (24-hour) temporal resolution. Consequently:

- Sub-hourly storm intensity peaks, flash-flood wavefronts, and short concentration times cannot be measured from daily data.
- Lag times are calculated strictly in days; no hourly precision is implied.
- Hydrographs are discrete daily stair-step or line observations. Visual smoothing is for trend perception, not temporal downscaling.

## 2. Catchment-Averaged Forcing

Precipitation and meteorological variables are catchment-wide spatial averages derived from ERA5-Land reanalysis. Spatial variability within large catchments (e.g. localized orographic rain or convective cells) is integrated into a single daily value.

## 3. Baseflow Separation

Baseflow separated by digital recursive filtering (Lyne-Hollick, Eckhardt) represents an analytical index of sustained discharge, not a direct physical measurement of groundwater aquifer flux.

## 4. Runoff Ratio Interpretation

Direct runoff ratios can exceed 1.0 during rain-on-snow events, snowmelt freshets, or releases from upstream storage. HydroEventLab flags these events with `HIGH_RUNOFF_RATIO` or `SNOWMELT_INFLUENCED` rather than artificially clamping the values.

## 5. Statistical Association vs. Causality

Bivariate correlations between catchment descriptors (e.g. forest cover, aridity) and runoff metrics describe statistical associations across basins, not direct mechanical causality.
