"""End-to-end research workflow test exercising the complete user journey:
1. Open global atlas & query overview
2. Select catchment and retrieve profile, FDC, and observations
3. Discover historical rainfall-runoff events
4. Inspect event anatomy, hydrograph, and baseflow separation
5. Discover comparable events ("Similar rainfall. Different response.")
6. Compare divergent catchment responses
7. Recalculate with Event Detection Workbench
8. Export research datasets
"""

from fastapi.testclient import TestClient

from apps.api.main import app

client = TestClient(app)


def test_complete_research_workflow():
    # Step 1: Open atlas & query overview
    res_overview = client.get("/api/v1/overview")
    assert res_overview.status_code == 200
    overview = res_overview.json()
    assert overview["catchment_count"] >= 8
    assert overview["event_count"] > 100

    # Step 2: Query catchments & select a benchmark catchment (Smith River, CA)
    res_catchments = client.get("/api/v1/catchments")
    assert res_catchments.status_code == 200
    catchments = res_catchments.json()["catchments"]
    assert len(catchments) >= 8

    cid = "camels_11532500"
    res_profile = client.get(f"/api/v1/catchments/{cid}")
    assert res_profile.status_code == 200
    profile = res_profile.json()
    assert profile["catchment_id"] == cid
    assert profile["area_km2"] > 1000

    # Step 3: Retrieve continuous observations and Flow Duration Curve
    res_obs = client.get(f"/api/v1/catchments/{cid}/observations?limit=500")
    assert res_obs.status_code == 200
    assert len(res_obs.json()["observations"]) > 0

    res_stats = client.get(f"/api/v1/catchments/{cid}/statistics")
    assert res_stats.status_code == 200
    assert len(res_stats.json()["fdc"]) > 0
    assert len(res_stats.json()["monthly_climatology"]) == 12

    # Step 4: Discover historical events for this catchment
    res_events = client.get(f"/api/v1/catchments/{cid}/events")
    assert res_events.status_code == 200
    events = res_events.json()["events"]
    assert len(events) > 0
    target_event_id = events[0]["event_id"]

    # Step 5: Inspect event in Event Analysis Studio
    res_ev_detail = client.get(f"/api/v1/events/{target_event_id}")
    assert res_ev_detail.status_code == 200
    ev_detail = res_ev_detail.json()
    assert len(ev_detail["hydrograph"]) > 0
    assert ev_detail["direct_runoff_ratio"] > 0
    assert "quality_flags" in ev_detail

    # Step 6: Signature Similar Event Discovery ("Similar rainfall. Different response.")
    res_similar = client.get(f"/api/v1/events/{target_event_id}/similar?discovery_mode=contrasting_response")
    assert res_similar.status_code == 200
    matches = res_similar.json()["matches"]
    assert len(matches) > 0
    matched_event_id = matches[0]["event_id"]

    # Step 7: Multi-event comparison workspace
    res_compare = client.post(
        "/api/v1/compare",
        json={
            "event_ids": [target_event_id, matched_event_id],
            "alignment_mode": "days_since_rainfall_onset",
            "normalization_mode": "runoff_depth_mm",
        },
    )
    assert res_compare.status_code == 200
    compare_data = res_compare.json()
    assert len(compare_data["aligned_events"]) == 2
    assert "contrast_summary" in compare_data

    # Step 8: Event Detection Workbench dynamic parameter recalculation
    res_detect = client.post(
        "/api/v1/events/detect",
        json={
            "catchment_id": cid,
            "wet_day_threshold_mm": 1.5,
            "min_event_precip_mm": 15.0,
            "max_intervening_dry_gap_days": 1,
            "antecedent_window_days": 7,
            "post_rainfall_window_days": 7,
            "baseflow_method": "lyne_hollick",
            "baseflow_alpha": 0.925,
            "baseflow_bfi_max": 0.80,
        },
    )
    assert res_detect.status_code == 200
    detect_res = res_detect.json()
    assert detect_res["total_detected"] > 0
    assert "accepted_count" in detect_res

    # Step 9: Research exports
    res_csv = client.get(f"/api/v1/exports/events?catchment_id={cid}&format=csv")
    assert res_csv.status_code == 200
    assert "text/csv" in res_csv.headers["content-type"]

    res_geojson = client.get("/api/v1/exports/catchments/geojson")
    assert res_geojson.status_code == 200
    assert "application/geo+json" in res_geojson.headers["content-type"]
