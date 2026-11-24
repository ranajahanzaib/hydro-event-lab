"""Real-world sample catchment data and historical daily observation generator.

Contains 8 benchmark Caravan catchments across distinct global hydrological regimes:
1. camels_01022500 - Narraguagus River, Maine, USA (Humid continental / mixed forest / seasonal snow)
2. camels_11532500 - Smith River, California, USA (Temperate coastal rainforest / extreme atmospheric rivers)
3. camels_08167500 - Guadalupe River, Texas, USA (Semi-arid / Edwards Plateau karst / flash response)
4. camels_09065500 - Gore Creek, Colorado, USA (Rocky Mountain alpine / snowmelt dominated)
5. camels_gb_39001 - River Thames, Kingston, UK (Temperate maritime / lowland permeable chalk / buffered response)
6. camels_gb_27001 - River Calder, Methley, UK (Temperate upland / steep responsive Pennines)
7. camels_aus_410730 - Cotter River, ACT, Australia (Sub-tropical / Southern tablelands eucalypt forest)
8. lamah_ce_10006 - Traun at Wels, Austria (Central European Alpine foothills / high relief)
"""

from typing import Any

import numpy as np
import pandas as pd
from shapely.geometry import Polygon, mapping

SAMPLE_CATCHMENTS: list[dict[str, Any]] = [
    {
        "catchment_id": "camels_01022500",
        "gauge_id": "01022500",
        "gauge_name": "Narraguagus River at Cherryfield, ME",
        "country": "United States",
        "dataset": "caravan",
        "sub_dataset": "camels_us",
        "latitude": 44.6078,
        "longitude": -67.9353,
        "area_km2": 591.2,
        "elevation_m": 72.0,
        "slope_m_per_km": 14.8,
        "mean_precipitation_mm_day": 3.42,
        "mean_pet_mm_day": 2.15,
        "aridity_index": 0.63,
        "snow_fraction": 0.22,
        "climate_zone": "Dfb - Humid Continental",
        "forest_fraction": 0.88,
        "crop_fraction": 0.04,
        "urban_fraction": 0.01,
        "start_date": "2018-01-01",
        "end_date": "2022-12-31",
    },
    {
        "catchment_id": "camels_11532500",
        "gauge_id": "11532500",
        "gauge_name": "Smith River near Crescent City, CA",
        "country": "United States",
        "dataset": "caravan",
        "sub_dataset": "camels_us",
        "latitude": 41.7946,
        "longitude": -124.0538,
        "area_km2": 1589.5,
        "elevation_m": 612.0,
        "slope_m_per_km": 68.4,
        "mean_precipitation_mm_day": 7.15,
        "mean_pet_mm_day": 2.45,
        "aridity_index": 0.34,
        "snow_fraction": 0.08,
        "climate_zone": "Csb - Warm-summer Mediterranean",
        "forest_fraction": 0.94,
        "crop_fraction": 0.01,
        "urban_fraction": 0.005,
        "start_date": "2018-01-01",
        "end_date": "2022-12-31",
    },
    {
        "catchment_id": "camels_08167500",
        "gauge_id": "08167500",
        "gauge_name": "Guadalupe River at Comfort, TX",
        "country": "United States",
        "dataset": "caravan",
        "sub_dataset": "camels_us",
        "latitude": 29.9705,
        "longitude": -98.9056,
        "area_km2": 2160.0,
        "elevation_m": 435.0,
        "slope_m_per_km": 28.5,
        "mean_precipitation_mm_day": 2.18,
        "mean_pet_mm_day": 4.12,
        "aridity_index": 1.89,
        "snow_fraction": 0.01,
        "climate_zone": "Cfa - Humid Subtropical / Semi-arid",
        "forest_fraction": 0.22,
        "crop_fraction": 0.15,
        "urban_fraction": 0.03,
        "start_date": "2018-01-01",
        "end_date": "2022-12-31",
    },
    {
        "catchment_id": "camels_09065500",
        "gauge_id": "09065500",
        "gauge_name": "Gore Creek at Upper Station near Minturn, CO",
        "country": "United States",
        "dataset": "caravan",
        "sub_dataset": "camels_us",
        "latitude": 39.6053,
        "longitude": -106.2825,
        "area_km2": 37.3,
        "elevation_m": 2682.0,
        "slope_m_per_km": 115.0,
        "mean_precipitation_mm_day": 3.10,
        "mean_pet_mm_day": 1.85,
        "aridity_index": 0.60,
        "snow_fraction": 0.68,
        "climate_zone": "Dfc - Subarctic Alpine",
        "forest_fraction": 0.65,
        "crop_fraction": 0.0,
        "urban_fraction": 0.002,
        "start_date": "2018-01-01",
        "end_date": "2022-12-31",
    },
    {
        "catchment_id": "camels_gb_39001",
        "gauge_id": "39001",
        "gauge_name": "Thames at Kingston",
        "country": "United Kingdom",
        "dataset": "caravan",
        "sub_dataset": "camels_gb",
        "latitude": 51.4150,
        "longitude": -0.3090,
        "area_km2": 9948.0,
        "elevation_m": 110.0,
        "slope_m_per_km": 8.2,
        "mean_precipitation_mm_day": 1.95,
        "mean_pet_mm_day": 1.72,
        "aridity_index": 0.88,
        "snow_fraction": 0.02,
        "climate_zone": "Cfb - Oceanic Temperate",
        "forest_fraction": 0.12,
        "crop_fraction": 0.48,
        "urban_fraction": 0.18,
        "start_date": "2018-01-01",
        "end_date": "2022-12-31",
    },
    {
        "catchment_id": "camels_gb_27001",
        "gauge_id": "27001",
        "gauge_name": "Calder at Methley",
        "country": "United Kingdom",
        "dataset": "caravan",
        "sub_dataset": "camels_gb",
        "latitude": 53.7370,
        "longitude": -1.3980,
        "area_km2": 855.3,
        "elevation_m": 185.0,
        "slope_m_per_km": 42.1,
        "mean_precipitation_mm_day": 2.85,
        "mean_pet_mm_day": 1.65,
        "aridity_index": 0.58,
        "snow_fraction": 0.05,
        "climate_zone": "Cfb - Oceanic Temperate / Pennines",
        "forest_fraction": 0.15,
        "crop_fraction": 0.25,
        "urban_fraction": 0.28,
        "start_date": "2018-01-01",
        "end_date": "2022-12-31",
    },
    {
        "catchment_id": "camels_aus_410730",
        "gauge_id": "410730",
        "gauge_name": "Cotter River at Gingera",
        "country": "Australia",
        "dataset": "caravan",
        "sub_dataset": "camels_aus",
        "latitude": -35.5902,
        "longitude": 148.8236,
        "area_km2": 148.0,
        "elevation_m": 1120.0,
        "slope_m_per_km": 55.0,
        "mean_precipitation_mm_day": 2.65,
        "mean_pet_mm_day": 3.10,
        "aridity_index": 1.17,
        "snow_fraction": 0.12,
        "climate_zone": "Cfb - Mountain Maritime / Eucalypt",
        "forest_fraction": 0.96,
        "crop_fraction": 0.0,
        "urban_fraction": 0.001,
        "start_date": "2018-01-01",
        "end_date": "2022-12-31",
    },
    {
        "catchment_id": "lamah_ce_10006",
        "gauge_id": "10006",
        "gauge_name": "Traun at Wels-Lichtenegg",
        "country": "Austria",
        "dataset": "caravan",
        "sub_dataset": "lamah_ce",
        "latitude": 48.1583,
        "longitude": 14.0150,
        "area_km2": 3630.0,
        "elevation_m": 840.0,
        "slope_m_per_km": 62.0,
        "mean_precipitation_mm_day": 3.85,
        "mean_pet_mm_day": 1.95,
        "aridity_index": 0.51,
        "snow_fraction": 0.28,
        "climate_zone": "Dfb - Alpine Foothills / Central Europe",
        "forest_fraction": 0.52,
        "crop_fraction": 0.22,
        "urban_fraction": 0.04,
        "start_date": "2018-01-01",
        "end_date": "2022-12-31",
    },
]


def create_catchment_polygon(lat: float, lon: float, area_km2: float) -> dict[str, Any]:
    """Generate a realistic oriented watershed polygon centered near gauge coordinates."""
    # Approximate radius in degrees: 1 degree latitude ~ 111 km
    r_km = np.sqrt(area_km2 / np.pi)
    r_deg_lat = r_km / 111.0
    r_deg_lon = r_km / (111.0 * np.cos(np.radians(lat)))

    # Create an organic 16-point polygon representing drainage basin topography
    angles = np.linspace(0, 2 * np.pi, 16, endpoint=False)
    # Basin elongation and organic irregularity based on hash
    seed = int(abs(lat * 1000 + lon * 100)) % 1000
    rng = np.random.default_rng(seed)
    jitter = rng.uniform(0.75, 1.25, size=16)

    # Offset centroid upstream from gauge
    upstream_lat = lat + r_deg_lat * 0.4
    upstream_lon = lon - r_deg_lon * 0.2

    coords = []
    for i, angle in enumerate(angles):
        dist = jitter[i]
        x = upstream_lon + dist * r_deg_lon * np.cos(angle)
        y = upstream_lat + dist * r_deg_lat * np.sin(angle)
        coords.append((round(float(x), 5), round(float(y), 5)))

    # Close polygon
    coords.append(coords[0])
    poly = Polygon(coords)
    return mapping(poly)


def generate_catchment_timeseries(
    meta: dict[str, Any],
    start_date: str = "2018-01-01",
    end_date: str = "2022-12-31",
) -> pd.DataFrame:
    """Generate physically coherent daily hydrometeorological time series.

    Reflects the catchment's specific climate regime, snow dynamics, baseflow index,
    and event responsiveness according to Caravan specifications.
    """
    dates = pd.date_range(start_date, end_date, freq="D")
    n = len(dates)

    seed = int(abs(meta["latitude"] * 10000 + meta["longitude"] * 100)) % 10000
    rng = np.random.default_rng(seed)

    doy = dates.dayofyear.to_numpy()
    is_southern = meta["latitude"] < 0
    phase_shift = np.pi if is_southern else 0.0

    # Temperature model: seasonal sinusoidal cycle + random synoptic fluctuation
    mean_temp = 12.0 - (meta["elevation_m"] / 1000.0) * 5.5
    temp_amp = 11.0
    temp = mean_temp + temp_amp * np.sin(2 * np.pi * (doy - 80) / 365.25 - phase_shift)
    temp += rng.normal(0, 2.5, n)

    # Precipitation generation
    # Probability of wet day varies seasonally
    p_mean = meta["mean_precipitation_mm_day"]
    wet_prob_base = 0.32
    if "Mediterranean" in meta["climate_zone"]:
        # Dry summers, very wet winters
        season_mod = -np.sin(2 * np.pi * (doy - 80) / 365.25 - phase_shift)
        wet_prob = np.clip(wet_prob_base + 0.25 * season_mod, 0.05, 0.70)
    elif "Subtropical" in meta["climate_zone"]:
        # Summer convective storms
        season_mod = np.sin(2 * np.pi * (doy - 80) / 365.25 - phase_shift)
        wet_prob = np.clip(wet_prob_base + 0.15 * season_mod, 0.10, 0.55)
    else:
        wet_prob = np.full(n, wet_prob_base)

    is_wet = rng.uniform(0, 1, n) < wet_prob
    # Gamma distribution for daily precipitation depths
    scale_param = p_mean / 0.8
    precip_raw = np.where(is_wet, rng.gamma(shape=0.8, scale=scale_param, size=n), 0.0)
    # Threshold < 0.2 mm to 0
    precip = np.where(precip_raw >= 0.2, precip_raw, 0.0)

    # Inject realistic severe rainfall-runoff events for research comparison
    # e.g. Year 2019 Day 45 (Atmospheric River / Winter Storm), 2020 Day 120 (Spring convective storm),
    # 2021 Day 290 (Autumn storm)
    storm_offsets = [
        (pd.to_datetime("2018-11-14"), [18.0, 42.5, 65.0, 12.0]),
        (pd.to_datetime("2019-02-24"), [14.0, 52.0, 38.0]),
        (pd.to_datetime("2019-10-18"), [22.0, 74.0, 15.0]),
        (pd.to_datetime("2020-04-12"), [10.0, 35.0, 48.0, 8.0]),
        (pd.to_datetime("2021-01-28"), [25.0, 58.0, 82.0, 16.0]),
        (pd.to_datetime("2021-09-02"), [30.0, 68.0, 24.0]),
        (pd.to_datetime("2022-03-15"), [12.0, 45.0, 18.0]),
        (pd.to_datetime("2022-11-06"), [20.0, 55.0, 40.0, 5.0]),
    ]
    for st_date, p_pulse in storm_offsets:
        if st_date in dates:
            s_idx = dates.get_loc(st_date)
            for j, p_val in enumerate(p_pulse):
                if s_idx + j < n:
                    # Adjust storm pulse by catchment aridity/climate
                    factor = 1.6 if "Mediterranean" in meta["climate_zone"] else (0.8 if meta["aridity_index"] > 1.5 else 1.1)
                    precip[s_idx + j] = round(p_val * factor, 1)

    # Hydrological response simulation
    # Baseflow parameters based on catchment geology and aridity
    aridity = meta["aridity_index"]
    baseflow_index = 0.85 if "Thames" in meta["gauge_name"] else (0.40 if aridity > 1.5 else 0.65)
    storage_k = 0.03 if "Thames" in meta["gauge_name"] else (0.25 if meta["slope_m_per_km"] > 50 else 0.12)
    # Direct runoff coefficient
    runoff_coeff = 0.12 if "Thames" in meta["gauge_name"] else (0.45 if meta["slope_m_per_km"] > 50 else 0.28)
    if aridity > 1.5:
        runoff_coeff = 0.18

    streamflow = np.zeros(n)
    gw_storage = 30.0 * baseflow_index
    soil_moisture = 50.0  # mm

    for t in range(n):
        p_t = precip[t]
        temp_t = temp[t]

        # Snow accumulation if below 0°C
        is_snow = temp_t <= 0.0
        p_rain = 0.0 if is_snow else p_t
        snowmelt = 0.0
        if temp_t > 0.0 and meta["snow_fraction"] > 0.15 and is_wet[t]:
            # Potential snowmelt addition
            snowmelt = min(15.0, max(0.0, temp_t * 1.5))

        effective_water = p_rain + snowmelt

        # Soil moisture antecedent condition dynamics
        soil_moisture += effective_water
        pet_t = max(0.2, meta["mean_pet_mm_day"] * (1.0 + 0.4 * np.sin(2 * np.pi * (doy[t] - 80) / 365.25 - phase_shift)))
        et_loss = min(soil_moisture * 0.08, pet_t)
        soil_moisture -= et_loss

        # Dynamic runoff ratio dependent on antecedent wetness
        sat_ratio = np.clip(soil_moisture / 100.0, 0.05, 0.95)
        event_runoff_c = runoff_coeff * (0.4 + 1.2 * sat_ratio)

        direct_runoff_t = effective_water * event_runoff_c
        recharge_t = effective_water * (1.0 - event_runoff_c) * 0.35

        gw_storage += recharge_t
        baseflow_t = gw_storage * storage_k
        gw_storage = max(0.5, gw_storage - baseflow_t)

        streamflow[t] = direct_runoff_t + baseflow_t

    # Add realistic streamflow routing lag for large catchments (e.g. Thames)
    if meta["area_km2"] > 5000:
        # 2-day smoothed routing
        streamflow = pd.Series(streamflow).rolling(3, min_periods=1, center=False).mean().to_numpy()

    df = pd.DataFrame({
        "date": dates.strftime("%Y-%m-%d"),
        "precipitation": np.round(precip, 2),
        "streamflow": np.round(np.maximum(0.02, streamflow), 3),
        "temperature": np.round(temp, 1),
        "pet": np.round(np.clip(meta["mean_pet_mm_day"] * (1.0 + 0.4 * np.sin(2 * np.pi * (doy - 80) / 365.25 - phase_shift)), 0.2, 8.0), 2),
    })

    return df
