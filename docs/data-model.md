# Data Model & Normalized Schemas

HydroEventLab persists observations and analytical models in columnar Apache Parquet and GeoJSON files.

## Catchment Entity (`catchments.parquet`)

- `catchment_id` (str): Namespaced identifier (e.g. `camels_11532500`).
- `gauge_id` (str): In-situ station code.
- `gauge_name` (str): Station and river name.
- `country` (str): Sovereign nation.
- `dataset` (str): Source release (`caravan` or `grdc_caravan`).
- `sub_dataset` (str): Regional dataset (`camels_us`, `camels_gb`, `lamah_ce`, `camels_aus`).
- `latitude`, `longitude` (float): Gauge WGS84 coordinates.
- `area_km2` (float): Watershed drainage area.
- `elevation_m` (float): Basin mean elevation.
- `slope_m_per_km` (float): Basin mean terrain gradient.
- `mean_precipitation_mm_day` (float): Climatological mean rainfall.
- `mean_pet_mm_day` (float): Climatological mean potential evapotranspiration.
- `aridity_index` (float): PET / P aridity metric.
- `snow_fraction` (float): Fraction of precipitation falling as snow.
- `climate_zone` (str): Koppen-Geiger climate classification.
- `forest_fraction`, `crop_fraction`, `urban_fraction` (float): Land cover composition.
- `median_runoff_ratio` (float): Derived median direct runoff ratio.
- `median_lag_days` (int): Derived median peak-to-peak lag time.
- `geometry` (str): GeoJSON polygon representation.

## Event Entity (`events.parquet`)

- `event_id` (str): Namespaced unique ID (e.g. `caravan_camels_11532500_20181114`).
- `precip_start_date`, `precip_end_date` (str): Rainfall event interval.
- `peak_precip_date` (str): Day of maximum rainfall accumulation.
- `response_start_date`, `response_end_date` (str): Streamflow response hydrograph window.
- `peak_discharge_date` (str): Day of peak flow crest.
- `precip_total_mm` (float): Total storm accumulation.
- `precip_max_daily_mm` (float): Peak 24h rainfall.
- `precip_duration_days` (int): Rainfall duration in days.
- `antecedent_precip_7d_mm`, `antecedent_precip_14d_mm` (float): Antecedent wetness indicators.
- `peak_discharge_mm_day` (float): Peak normalized flow.
- `antecedent_discharge_mm_day` (float): Streamflow baseline prior to event rise.
- `direct_runoff_depth_mm` (float): Integrated direct quickflow depth.
- `baseflow_depth_mm` (float): Integrated baseflow volume depth.
- `direct_runoff_ratio` (float): Direct runoff depth / Total precipitation.
- `total_runoff_ratio` (float): Total runoff depth / Total precipitation.
- `lag_peak_to_peak_days` (int): Integer days from peak rainfall to peak streamflow.
- `recession_k` (float): Exponential recession rate constant ($day^{-1}$).
- `recession_tau_days` (float): E-folding time ($\tau = 1/k$).
- `recession_r2` (float): Goodness of fit ($R^2$).
- `quality_flags` (str): JSON list of quality and diagnostic indicators.
- `hydrograph_json` (str): Complete serialized daily time series for the event window.
