"""
Phase 2 REST API & Role-Based Access Control (RBAC) Integration Tests.

Validates:
1. Authentication Router (/api/login): 200 OK on valid credentials, 401 Unauthorized on invalid.
2. Role Enforcer Dependency (RoleChecker):
   - GET /api/operator/data with CITIZEN token -> 403 Forbidden
   - GET /api/operator/data with OPERATOR token -> 200 OK
   - POST /api/sos/ with CITIZEN token -> 201 Created
   - POST /api/rescue/mission with RESCUER token -> 200 OK
   - Missing Authorization header -> 401 Unauthorized
3. Domain Routers Functional Check:
   - GET /api/hotspots?lat=25.5941&lng=85.1376 -> FeatureCollection with risk/severity
   - GET /api/shelters -> List with capacity, coordinates, and status
"""

import pytest
from fastapi.testclient import TestClient
from main import app

client = TestClient(app)


# ─── 1. Authentication Router Tests ──────────────────────────────────────────

def test_login_valid_operator_credentials():
    """POST /api/login with valid operator credentials returns 200 OK & OPERATOR JWT."""
    response = client.post(
        "/api/login",
        json={"username": "operator@hydrograph.gov", "password": "admin123"}
    )
    assert response.status_code == 200
    data = response.json()
    assert "access_token" in data
    assert data["role"] == "OPERATOR"
    assert data["token_type"] == "bearer"


def test_login_invalid_password():
    """POST /api/login with invalid password returns 401 Unauthorized."""
    response = client.post(
        "/api/login",
        json={"username": "operator@hydrograph.gov", "password": "wrongpassword"}
    )
    assert response.status_code == 401
    assert "Invalid username or password" in response.json()["detail"]


# ─── 2. Role Enforcer & RBAC Tests ───────────────────────────────────────────

@pytest.fixture
def operator_token():
    res = client.post("/api/login", json={"username": "operator@hydrograph.gov", "password": "admin123"})
    return res.json()["access_token"]


@pytest.fixture
def citizen_token():
    res = client.post("/api/login", json={"username": "citizen@hydrograph.gov", "password": "sos123"})
    return res.json()["access_token"]


@pytest.fixture
def rescuer_token():
    res = client.post("/api/login", json={"username": "rescue04@hydrograph.gov", "password": "rescue123"})
    return res.json()["access_token"]


def test_rbac_citizen_accessing_operator_data_forbidden(citizen_token):
    """Requesting GET /api/operator/data with a CITIZEN token returns 403 Forbidden."""
    headers = {"Authorization": f"Bearer {citizen_token}"}
    response = client.get("/api/operator/data", headers=headers)
    assert response.status_code == 403
    assert "Access forbidden" in response.json()["detail"]


def test_rbac_operator_accessing_operator_data_allowed(operator_token):
    """Requesting GET /api/operator/data with an OPERATOR token returns 200 OK."""
    headers = {"Authorization": f"Bearer {operator_token}"}
    response = client.get("/api/operator/data", headers=headers)
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "SUCCESS"
    assert "critical_hotspots" in data["data"]


def test_rbac_citizen_creating_sos_created(citizen_token):
    """Requesting POST /api/sos/ with a CITIZEN token returns 201 Created."""
    headers = {"Authorization": f"Bearer {citizen_token}"}
    payload = {
        "location": "Boring Road Junction",
        "lat": 25.6160,
        "lng": 85.1150,
        "people": 3,
        "elderly": 1,
        "water_depth_m": 0.9,
        "contact_phone": "+91-9876543210"
    }
    response = client.post("/api/sos/", json=payload, headers=headers)
    assert response.status_code in [200, 201]
    data = response.json()
    assert data["status"] == "RECEIVED"
    assert data["people"] == 3


def test_rbac_rescuer_accessing_rescue_mission_allowed(rescuer_token):
    """Requesting POST /api/rescue/mission with a RESCUER token returns 200 OK."""
    headers = {"Authorization": f"Bearer {rescuer_token}"}
    response = client.post("/api/rescue/mission", headers=headers)
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "SUCCESS"
    assert "mission" in data


def test_rbac_unauthenticated_request_unauthorized():
    """Requesting protected endpoint without Authorization header returns 401 Unauthorized."""
    response = client.get("/api/operator/data")
    assert response.status_code == 401
    assert "Authentication credentials missing" in response.json()["detail"]


# ─── 3. Domain Routers Functional Checks ─────────────────────────────────────

def test_hotspots_endpoint_returns_geojson():
    """GET /api/hotspots?lat=25.5941&lng=85.1376 returns valid GeoJSON FeatureCollection."""
    response = client.get("/api/hotspots?lat=25.5941&lng=85.1376")
    assert response.status_code == 200
    data = response.json()
    assert data.get("type") == "FeatureCollection"
    assert isinstance(data.get("features"), list)
    assert len(data["features"]) > 0
    
    first_feature = data["features"][0]
    props = first_feature.get("properties", {})
    assert "severity" in props or "risk" in props or "depth_cm" in props


def test_shelters_endpoint_returns_shelters_list():
    """GET /api/shelters returns active shelters list containing capacity, coordinates, and status."""
    response = client.get("/api/shelters")
    assert response.status_code == 200
    shelters = response.json()
    assert isinstance(shelters, list)
    assert len(shelters) > 0
    
    shelter = shelters[0]
    assert "capacity" in shelter
    assert "lat" in shelter and "lng" in shelter
    assert "status" in shelter or "isOpen" in shelter
