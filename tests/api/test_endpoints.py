"""Integration tests for FastAPI endpoints."""

from fastapi.testclient import TestClient

from apps.api.main import app

client = TestClient(app)


def test_health():
    response = client.get("/api/v1/health")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "healthy"
    assert data["temporal_resolution"] == "Daily"


def test_overview():
    response = client.get("/api/v1/overview")
    assert response.status_code == 200
    data = response.json()
    assert data["catchment_count"] >= 8
    assert data["event_count"] > 100
    assert "hydrology_summary" in data


def test_catchments():
    response = client.get("/api/v1/catchments")
    assert response.status_code == 200
    data = response.json()
    assert data["count"] >= 8

    # Detail
    cid = data["catchments"][0]["catchment_id"]
    detail_res = client.get(f"/api/v1/catchments/{cid}")
    assert detail_res.status_code == 200
    detail = detail_res.json()
    assert detail["catchment_id"] == cid
    assert "climate" in detail


def test_events():
    response = client.get("/api/v1/events?limit=10")
    assert response.status_code == 200
    data = response.json()
    assert data["count"] > 0

    eid = data["events"][0]["event_id"]
    event_res = client.get(f"/api/v1/events/{eid}")
    assert event_res.status_code == 200
    ev = event_res.json()
    assert ev["event_id"] == eid
    assert len(ev["hydrograph"]) > 0


def test_similarity_search():
    # First get an event
    events_res = client.get("/api/v1/events?limit=1")
    eid = events_res.json()["events"][0]["event_id"]

    sim_res = client.get(f"/api/v1/events/{eid}/similar")
    assert sim_res.status_code == 200
    sim_data = sim_res.json()
    assert "matches" in sim_data
