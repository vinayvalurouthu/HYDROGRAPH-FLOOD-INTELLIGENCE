import pytest
from httpx import AsyncClient, ASGITransport
from main import app
from database import get_db
from sqlalchemy.ext.asyncio import AsyncSession
from models import Road, SOSIncident, Shelter, DrainageNode


@pytest.fixture
def anyio_backend():
    return "asyncio"


@pytest.fixture
async def async_client():
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as ac:
        yield ac


@pytest.mark.anyio
async def test_get_hotspots_list(async_client: AsyncClient):
    # This will use the seeded data since we didn't mock the DB
    # We should get a 200 response with some hotspots
    response = await async_client.get("/api/v1/hotspots")
    assert response.status_code == 200
    data = response.json()
    assert "count" in data
    assert "hotspots" in data
    assert type(data["hotspots"]) is list


@pytest.mark.anyio
async def test_get_hotspots_filtered(async_client: AsyncClient):
    response = await async_client.get("/api/v1/hotspots?risk=CRITICAL")
    assert response.status_code == 200
    data = response.json()
    if data["hotspots"]:
        for h in data["hotspots"]:
            assert h["score"]["risk_tier"] == "CRITICAL"


@pytest.mark.anyio
async def test_get_hotspots_trend_filtered(async_client: AsyncClient):
    response = await async_client.get("/api/v1/hotspots?trend=WORSENING")
    assert response.status_code == 200
    data = response.json()
    if data["hotspots"]:
        for h in data["hotspots"]:
            assert h["trend"] == "WORSENING"


@pytest.mark.anyio
async def test_get_hotspots_summary(async_client: AsyncClient):
    response = await async_client.get("/api/v1/hotspots/summary")
    assert response.status_code == 200
    data = response.json()
    assert "total_hotspots" in data
    assert "critical_hotspots" in data
    assert "worsening_count" in data


@pytest.mark.anyio
async def test_close_and_reopen_road(async_client: AsyncClient):
    # Get the first hotspot
    r = await async_client.get("/api/v1/hotspots?limit=1")
    hotspots = r.json().get("hotspots", [])
    if not hotspots:
        pytest.skip("No hotspots available in database to test closure")

    hid = hotspots[0]["id"]
    
    # 1. Close road
    r_close = await async_client.post(f"/api/v1/hotspots/{hid}/close")
    assert r_close.status_code == 200
    assert r_close.json()["is_closed"] is True
    
    # Idempotency check
    r_close2 = await async_client.post(f"/api/v1/hotspots/{hid}/close")
    assert r_close2.status_code == 200
    assert r_close2.json()["action"] == "NO_CHANGE"
    
    # 2. Reopen road
    r_open = await async_client.post(f"/api/v1/hotspots/{hid}/reopen")
    assert r_open.status_code == 200
    assert r_open.json()["is_closed"] is False
    
    # Idempotency check
    r_open2 = await async_client.post(f"/api/v1/hotspots/{hid}/reopen")
    assert r_open2.status_code == 200
    assert r_open2.json()["action"] == "NO_CHANGE"


@pytest.mark.anyio
async def test_404_on_nonexistent_road(async_client: AsyncClient):
    r_get = await async_client.get("/api/v1/hotspots/NON_EXISTENT_ID")
    assert r_get.status_code == 404

    r_close = await async_client.post("/api/v1/hotspots/NON_EXISTENT_ID/close")
    assert r_close.status_code == 404
