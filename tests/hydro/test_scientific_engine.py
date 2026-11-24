"""Scientific tests for baseflow separation, event detection, metrics, and quality assessment."""

import numpy as np
import pandas as pd
import pytest

from hydro.baseflow.separation import (
    separate_constant_baseline,
    separate_eckhardt,
    separate_lyne_hollick,
)
from hydro.events.detector import (
    detect_events_for_catchment,
)
from hydro.metrics.calculators import (
    calculate_daily_volume_m3,
    convert_runoff_to_volumetric,
    convert_volumetric_to_runoff,
    fit_exponential_recession,
)


def test_unit_conversions():
    # 10 mm/day over 86.4 km² should equal exactly 10 m³/s
    # Q = runoff * area / 86.4 = 10 * 86.4 / 86.4 = 10.0 m³/s
    q_vol = convert_runoff_to_volumetric(10.0, 86.4)
    assert pytest.approx(q_vol, 0.001) == 10.0

    # Inverse conversion
    runoff = convert_volumetric_to_runoff(q_vol, 86.4)
    assert pytest.approx(runoff, 0.001) == 10.0

    # Daily volume: 10 m³/s * 86,400 s = 864,000 m³
    vol = calculate_daily_volume_m3(q_vol)
    assert pytest.approx(vol, 0.1) == 864000.0


def test_baseflow_separation_boundaries():
    # Baseflow must be bounded: 0 <= baseflow(t) <= streamflow(t)
    synthetic_q = np.maximum(0.1, np.sin(np.linspace(0, 10, 100)) * 5.0 + 5.0)

    # Constant baseline
    b_const, d_const = separate_constant_baseline(synthetic_q, antecedent_q=2.0)
    assert np.all(b_const <= synthetic_q)
    assert np.all(b_const >= 0)
    assert np.allclose(b_const + d_const, synthetic_q)

    # Lyne-Hollick
    b_lh, d_lh = separate_lyne_hollick(synthetic_q, alpha=0.925)
    assert np.all(b_lh <= synthetic_q + 1e-6)
    assert np.all(b_lh >= 0)
    assert np.allclose(b_lh + d_lh, synthetic_q)

    # Eckhardt
    b_eck, d_eck = separate_eckhardt(synthetic_q, alpha=0.98, bfi_max=0.80)
    assert np.all(b_eck <= synthetic_q + 1e-6)
    assert np.all(b_eck >= 0)
    assert np.allclose(b_eck + d_eck, synthetic_q)


def test_exponential_recession_fit():
    # Synthetic exponential decay: Q(t) = 10.0 * exp(-0.15 * t)
    t = np.arange(10)
    q = 10.0 * np.exp(-0.15 * t)

    res = fit_exponential_recession(q)
    assert res.is_valid
    assert pytest.approx(res.k, 0.01) == 0.15
    assert pytest.approx(res.q0, 0.01) == 10.0
    assert pytest.approx(res.e_folding_time_days, 0.05) == (1.0 / 0.15)
    assert res.r_squared > 0.99


def test_event_detection_synthetic():
    # Build a 60-day synthetic hydrograph with one prominent storm event
    dates = pd.date_range("2020-01-01", periods=60, freq="D")
    precip = np.zeros(60)
    # Day 15-17 has a 45 mm storm: [15, 25, 5]
    precip[15] = 15.0
    precip[16] = 25.0
    precip[17] = 5.0

    # Streamflow baseflow is 0.5 mm/day, rises to peak on Day 18 (6.5 mm/day), then decays
    streamflow = np.full(60, 0.5)
    streamflow[16] = 2.0
    streamflow[17] = 5.0
    streamflow[18] = 6.5  # peak
    streamflow[19] = 4.2
    streamflow[20] = 2.8
    streamflow[21] = 1.6
    streamflow[22] = 1.0
    streamflow[23] = 0.7
    streamflow[24] = 0.5

    df = pd.DataFrame({
        "date": dates,
        "precipitation": precip,
        "streamflow": streamflow,
        "temperature": 15.0,
    })

    events = detect_events_for_catchment(
        df_observations=df,
        catchment_id="test_catchment_01",
        catchment_area_km2=100.0,
        dataset_name="caravan",
    )

    assert len(events) == 1
    ev = events[0]
    assert ev.status == "accepted"
    assert ev.metrics.precip_total_mm == 45.0
    assert ev.metrics.precip_max_daily_mm == 25.0
    assert ev.metrics.precip_duration_days == 3
    assert ev.metrics.peak_discharge_mm_day == 6.5
    assert ev.metrics.rising_limb_days >= 1
    assert ev.metrics.falling_limb_days >= 3
    assert ev.metrics.direct_runoff_ratio > 0.10
    assert ev.metrics.direct_runoff_ratio < 1.0
    assert ev.quality.is_acceptable
