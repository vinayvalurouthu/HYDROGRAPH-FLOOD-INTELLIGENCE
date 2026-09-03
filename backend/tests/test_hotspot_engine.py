import pytest
from services.hotspot_engine import (
    compute_hotspot_score,
    classify_risk_tier,
    estimate_trend,
    generate_action_recommendation,
    haversine_km,
    find_nearby_sos,
    DEPTH_DANGER_CM,
    VELOCITY_DANGER_MS,
    EXTREME_RAINFALL_MM,
)
from models import Road, SOSIncident


@pytest.fixture
def base_road():
    return Road(
        id="RD-TEST",
        name="Test Road",
        lat=25.6093,
        lng=85.1376,
        depth_cm=0.0,
        peak_depth_cm=0.0,
        velocity_ms=0.0,
        duration_min=0,
        time_to_flood_min=120,
        confidence_pct=50.0,
        rainfall_mm_hr=0.0,
        drain_util_pct=0.0,
        is_closed=False,
    )


def test_classify_risk_tier():
    assert classify_risk_tier(95.0) == "CRITICAL"
    assert classify_risk_tier(85.0) == "CRITICAL"
    assert classify_risk_tier(75.0) == "SEVERE"
    assert classify_risk_tier(65.0) == "SEVERE"
    assert classify_risk_tier(55.0) == "HIGH"
    assert classify_risk_tier(45.0) == "HIGH"
    assert classify_risk_tier(35.0) == "MODERATE"
    assert classify_risk_tier(25.0) == "MODERATE"
    assert classify_risk_tier(15.0) == "LOW"
    assert classify_risk_tier(0.0) == "LOW"


def test_compute_hotspot_score_zero(base_road):
    # Confidence is 50%, so confidence factor will add a bit of score
    # W_CONFIDENCE = 0.05, 50 * 0.05 = 2.5
    score = compute_hotspot_score(base_road)
    assert score.composite == 2.5
    assert score.risk_tier == "LOW"
    assert score.depth_factor == 0.0
    assert score.urgency_factor == 0.0


def test_compute_hotspot_score_critical(base_road):
    base_road.depth_cm = DEPTH_DANGER_CM * 2       # 200% depth factor
    base_road.velocity_ms = VELOCITY_DANGER_MS * 2 # 200% velocity factor
    base_road.drain_util_pct = 100.0               # 100% drainage factor
    base_road.time_to_flood_min = 0                # 100% urgency factor
    base_road.rainfall_mm_hr = EXTREME_RAINFALL_MM # 100% rainfall factor
    base_road.confidence_pct = 100.0               # 100% confidence factor

    score = compute_hotspot_score(base_road)
    # Total calculation:
    # 0.35 * 200 = 70
    # 0.20 * 200 = 40
    # 0.15 * 100 = 15
    # 0.15 * 100 = 15
    # 0.10 * 100 = 10
    # 0.05 * 100 = 5
    # Total = 155, clamped to 100
    assert score.composite == 100.0
    assert score.risk_tier == "CRITICAL"


def test_compute_hotspot_score_moderate(base_road):
    base_road.depth_cm = DEPTH_DANGER_CM * 0.5     # 50% depth factor
    base_road.velocity_ms = VELOCITY_DANGER_MS * 0.5 # 50% velocity factor
    base_road.drain_util_pct = 50.0                # 50% drainage factor
    base_road.time_to_flood_min = 60               # 50% urgency factor
    base_road.rainfall_mm_hr = EXTREME_RAINFALL_MM * 0.5 # 50% rainfall factor
    base_road.confidence_pct = 50.0                # 50% confidence factor

    score = compute_hotspot_score(base_road)
    # Expected:
    # 0.35 * 50 = 17.5
    # 0.20 * 50 = 10
    # 0.15 * 50 = 7.5
    # 0.15 * 50 = 7.5
    # 0.10 * 50 = 5.0
    # 0.05 * 50 = 2.5
    # Total = 50
    assert score.composite == 50.0
    assert score.risk_tier == "HIGH"


def test_estimate_trend(base_road):
    # Worsening cases
    base_road.depth_cm = 90
    base_road.peak_depth_cm = 100
    base_road.time_to_flood_min = 15
    assert estimate_trend(base_road) == "WORSENING"

    base_road.depth_cm = 75
    base_road.time_to_flood_min = 30
    assert estimate_trend(base_road) == "WORSENING"

    # Improving cases
    base_road.depth_cm = 30
    base_road.peak_depth_cm = 100
    base_road.time_to_flood_min = 60
    assert estimate_trend(base_road) == "IMPROVING"

    # Stable cases
    base_road.depth_cm = 60
    base_road.peak_depth_cm = 100
    base_road.time_to_flood_min = 60
    assert estimate_trend(base_road) == "STABLE"


def test_geospatial_distance():
    # Patna coordinates
    lat1, lng1 = 25.6093, 85.1376
    # Approx 1 km away
    lat2, lng2 = 25.6183, 85.1376

    dist = haversine_km(lat1, lng1, lat2, lng2)
    assert 0.9 <= dist <= 1.1


def test_find_nearby_sos(base_road):
    sos1 = SOSIncident(id="SOS-1", location="Near", lat=25.6100, lng=85.1380, status="ACTIVE", people=5, priority="HIGH")
    sos2 = SOSIncident(id="SOS-2", location="Far", lat=25.6500, lng=85.2000, status="ACTIVE", people=2, priority="LOW")

    nearby = find_nearby_sos(base_road, [sos1, sos2], radius_km=2.0)
    assert len(nearby) == 1
    assert nearby[0].id == "SOS-1"
    assert nearby[0].distance_km < 2.0


def test_generate_action_recommendation(base_road):
    base_road.depth_cm = 40
    base_road.velocity_ms = 0.6
    base_road.drain_util_pct = 95
    base_road.time_to_flood_min = 10
    base_road.is_closed = False

    score = compute_hotspot_score(base_road)
    # Should be critical based on these values
    assert score.risk_tier == "CRITICAL"

    action, priority = generate_action_recommendation(base_road, score)
    assert "CLOSE IMMEDIATELY" in action
    assert priority == "P0 — IMMEDIATE"

    # Test closed variant
    base_road.is_closed = True
    action, priority = generate_action_recommendation(base_road, score)
    assert "MAINTAIN CLOSURE" in action
    assert priority == "P0 — IMMEDIATE"
