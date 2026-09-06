"""
Phase 1 Unit Test Suite for HydroGraph Computational Engines:
- Spatial & DEM Engine (rasterio, pyproj, calculate_dynamic_city_context)
- Hotspot Intelligence Engine (hotspot_engine composite risk scoring)
- Flood-Aware A* Routing Engine (routing_engine dynamic detour pathfinding)
"""

import os
import math
import pytest
import numpy as np
import rasterio

from models import Road
from services.spatial_utils import calculate_dynamic_city_context, transform_coordinates_wgs84_to_utm
from services.dem_service import get_dem_metadata
from services.hotspot_engine import compute_hotspot_score, classify_risk_tier
from services.routing_engine import compute_evacuation_routes, PATNA_NODES
from schemas import RouteRequest


# ─── 1. Spatial & DEM Engine Tests ──────────────────────────────────────────

def test_dem_raster_loading_and_sampling():
    """Verify loading of patna_dem_30m.tif with rasterio and validate elevation range."""
    dem_path = os.path.join(os.getcwd(), "patna_dem_30m.tif")
    if not os.path.exists(dem_path):
        dem_path = os.path.join(os.path.dirname(os.path.dirname(__file__)), "patna_dem_30m.tif")
    
    assert os.path.exists(dem_path), f"DEM GeoTIFF raster missing at {dem_path}"

    with rasterio.open(dem_path) as src:
        assert src.count >= 1
        assert src.width > 0 and src.height > 0
        data = src.read(1)
        min_elev = float(np.nanmin(data))
        max_elev = float(np.nanmax(data))
        
        # Terrestrial limits for Gangetic flood plain near Patna (approx 45m to 65m MSL)
        assert 30.0 <= min_elev <= 70.0, f"Min elevation {min_elev} outside valid limits"
        assert min_elev <= max_elev <= 100.0, f"Max elevation {max_elev} outside valid limits"


def test_dynamic_utm_epsg_context_calculation():
    """Validate dynamic calculation of bounding box and UTM EPSG zones."""
    # Test Patna (85.1376°E) -> Zone 45 -> EPSG:32645
    patna_ctx = calculate_dynamic_city_context(25.5941, 85.1376, radius_km=10.0)
    assert patna_ctx["utm_zone"] == 45
    assert patna_ctx["epsg_crs"] == "EPSG:32645"
    assert patna_ctx["bbox"]["south"] < 25.5941 < patna_ctx["bbox"]["north"]

    # Test Mumbai (72.8777°E) -> Zone 43 -> EPSG:32643
    mumbai_ctx = calculate_dynamic_city_context(19.0760, 72.8777, radius_km=15.0)
    assert mumbai_ctx["utm_zone"] == 43
    assert mumbai_ctx["epsg_crs"] == "EPSG:32643"

    # Test Chennai (80.2707°E) -> Zone 44 -> EPSG:32644
    chennai_ctx = calculate_dynamic_city_context(13.0827, 80.2707, radius_km=10.0)
    assert chennai_ctx["utm_zone"] == 44
    assert chennai_ctx["epsg_crs"] == "EPSG:32644"


def test_wgs84_to_utm_metric_transformation():
    """Verify Pyproj metric coordinate transformation (meters)."""
    proj = transform_coordinates_wgs84_to_utm(25.5941, 85.1376)
    assert proj["utm_easting_m"] > 100000.0
    assert proj["utm_northing_m"] > 1000000.0
    assert proj["epsg_crs"] == "EPSG:32645"


# ─── 2. Hotspot Intelligence Engine Tests ────────────────────────────────────

def test_hotspot_risk_score_bounds_and_tiers():
    """Test composite risk score calculation and tier classification."""
    road = Road(
        id="R-TEST-01",
        name="Test Corridor",
        depth_cm=45.0,
        velocity_ms=0.8,
        drain_util_pct=75.0,
        time_to_flood_min=30,
        rainfall_mm_hr=60.0,
        confidence_pct=90.0
    )
    score = compute_hotspot_score(road)
    assert 0.0 <= score.composite <= 100.0
    assert score.risk_tier in ["LOW", "MODERATE", "HIGH", "SEVERE", "CRITICAL"]


def test_hotspot_zero_precipitation_edge_case():
    """Zero rainfall + low depth + high time-to-flood returns LOW risk (< 25.0)."""
    dry_road = Road(
        id="R-DRY-01",
        name="Dry Ridge Highway",
        depth_cm=0.0,
        velocity_ms=0.0,
        drain_util_pct=10.0,
        time_to_flood_min=120,
        rainfall_mm_hr=0.0,
        confidence_pct=80.0
    )
    score = compute_hotspot_score(dry_road)
    assert score.composite < 25.0
    assert score.risk_tier == "LOW"


def test_hotspot_extreme_precipitation_and_depth():
    """Heavy rainfall (>100 mm/hr) + high depth (90 cm) flags SEVERE or CRITICAL (>= 75.0)."""
    severe_road = Road(
        id="R-[#10276]",
        name="Canal Road Submerged Basin",
        depth_cm=90.0,
        velocity_ms=1.8,
        drain_util_pct=98.0,
        time_to_flood_min=5,
        rainfall_mm_hr=120.0,
        confidence_pct=95.0
    )
    score = compute_hotspot_score(severe_road)
    assert score.composite >= 75.0
    assert score.risk_tier in ["SEVERE", "CRITICAL"]


# ─── 3. Flood-Aware Routing Engine Tests ─────────────────────────────────────

def test_flood_avoidance_pathfinding_detour():
    """Verify pathfinding detours around closed/flooded road segments while maintaining route safety."""
    req = {
        "origin": "Patna Junction",
        "destination": "Bailey Road West (Saguna More)",
        "avoid_flooded": True,
        "vehicle_type": "Rescue Van"
    }
    
    # Compute route with baseline conditions
    base_response = compute_evacuation_routes(req, closed_road_ids=set())
    assert base_response.primary_route is not None
    base_distance = base_response.primary_route.total_distance_km

    # Simulate closure/flooding on direct corridor (CR-07)
    flooded_response = compute_evacuation_routes(req, closed_road_ids={"CR-07"})
    assert flooded_response.primary_route is not None
    detour_distance = flooded_response.primary_route.total_distance_km

    # Verification: Detour route detours around CR-07, distance increases while route remains safe
    assert detour_distance > base_distance
    assert flooded_response.primary_route.safety_rating in ["SAFE", "CAUTION"]


