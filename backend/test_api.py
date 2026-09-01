"""
Comprehensive Automated Test Suite for HydroGraph Backend API.
Tests all endpoints across all 9 domain routers.
"""

import asyncio
import urllib.parse
from httpx import AsyncClient, ASGITransport
from main import app


async def run_all_tests():
    print("[TEST] Starting HydroGraph Backend API Test Suite...")
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://testserver") as client:
        # 1. Health check
        res = await client.get("/")
        assert res.status_code == 200, f"Root failed: {res.text}"
        print("  [PASS] GET / (Health Check)")

        # 2. Map Config
        res = await client.get("/api/map/config")
        assert res.status_code == 200
        data = res.json()
        assert "center_lat" in data and "center_lng" in data
        print("  [PASS] GET /api/map/config")

        # 3. Roads & Closure
        res = await client.get("/api/roads")
        assert res.status_code == 200
        roads = res.json()
        assert len(roads) > 0
        road_id = roads[0]["id"]
        print(f"  [PASS] GET /api/roads ({len(roads)} roads)")

        res = await client.get(f"/api/roads/{road_id}")
        assert res.status_code == 200
        print(f"  [PASS] GET /api/roads/{road_id}")

        res = await client.patch(f"/api/roads/{road_id}", json={"is_closed": True, "reason": "Test closure"})
        assert res.status_code == 200
        assert res.json()["is_closed"] is True
        print(f"  [PASS] PATCH /api/roads/{road_id} (Close Road)")

        # Reopen road
        res = await client.patch(f"/api/roads/{road_id}", json={"is_closed": False})
        assert res.status_code == 200
        print(f"  [PASS] PATCH /api/roads/{road_id} (Reopen Road)")

        # 4. Hotspots
        res = await client.get("/api/v1/hotspots")
        assert res.status_code == 200
        assert "hotspots" in res.json()
        print(f"  [PASS] GET /api/v1/hotspots ({res.json()['count']} hotspots)")

        # 5. Forecast Timeline
        res = await client.get("/api/forecast/timeline")
        assert res.status_code == 200
        assert len(res.json()) > 0
        print(f"  [PASS] GET /api/forecast/timeline ({len(res.json())} points)")

        # 6. Flood Zones
        res = await client.get("/api/flood/zones?step=0")
        assert res.status_code == 200
        print(f"  [PASS] GET /api/flood/zones?step=0 ({len(res.json())} zones)")

        # 7. Live Weather
        res = await client.get("/api/weather/current")
        assert res.status_code == 200
        print("  [PASS] GET /api/weather/current")

        # 8. SOS Incidents
        res = await client.get("/api/v1/sos")
        assert res.status_code == 200
        assert len(res.json()) > 0
        print(f"  [PASS] GET /api/v1/sos ({len(res.json())} incidents)")

        res = await client.get("/api/v1/sos/priority")
        assert res.status_code == 200
        print(f"  [PASS] GET /api/v1/sos/priority ({len(res.json())} prioritized)")

        # Create SOS
        res = await client.post("/api/v1/sos", json={
            "location": "Test Location, Gandhi Maidan",
            "lat": 25.6180,
            "lng": 85.1430,
            "people": 5,
            "children": 1,
            "elderly": 1,
            "medical": True,
            "water_depth_m": 0.9,
            "contact_phone": "+91 99999 88888",
        })
        assert res.status_code == 200
        new_sos = res.json()
        created_id = new_sos["id"]
        assert new_sos["priority"] == "CRITICAL"
        print(f"  [PASS] POST /api/v1/sos (Created {created_id} as CRITICAL)")

        # Update SOS Status
        encoded_id = urllib.parse.quote(created_id)
        res = await client.patch(f"/api/v1/sos/{encoded_id}", json={"status": "VERIFIED"})
        assert res.status_code == 200, f"Failed updating SOS status: {res.text}"
        assert res.json()["status"] == "VERIFIED"
        print(f"  [PASS] PATCH /api/v1/sos/{created_id} (Transitioned to VERIFIED)")

        # 9. Rescue Teams & Assignment
        res = await client.get("/api/v1/rescue/teams")
        assert res.status_code == 200
        teams = res.json()
        assert len(teams) > 0
        team_id = teams[0]["id"]
        print(f"  [PASS] GET /api/v1/rescue/teams ({len(teams)} units)")

        res = await client.post("/api/v1/rescue/assign", json={
            "incident_id": created_id,
            "team_id": team_id,
        })
        assert res.status_code == 200
        assert res.json()["success"] is True
        print(f"  [PASS] POST /api/v1/rescue/assign (Assigned {team_id} to {created_id})")

        # 10. Shelters
        res = await client.get("/api/v1/shelters")
        assert res.status_code == 200
        shelters = res.json()
        assert len(shelters) > 0
        print(f"  [PASS] GET /api/v1/shelters ({len(shelters)} shelters)")

        res = await client.get("/api/v1/shelters/safe")
        assert res.status_code == 200
        print(f"  [PASS] GET /api/v1/shelters/safe ({len(res.json())} safe shelters)")

        sh_id = shelters[0]["id"]
        res = await client.patch(f"/api/v1/shelters/{sh_id}/occupancy", json={"occupancy": 350})
        assert res.status_code == 200
        print(f"  [PASS] PATCH /api/v1/shelters/{sh_id}/occupancy")

        # 11. Drainage
        res = await client.get("/api/v1/drainage/status")
        assert res.status_code == 200
        assert res.json()["total_nodes"] > 0
        print(f"  [PASS] GET /api/v1/drainage/status ({res.json()['total_nodes']} nodes)")

        res = await client.get("/api/v1/drainage/anomalies")
        assert res.status_code == 200
        print(f"  [PASS] GET /api/v1/drainage/anomalies ({len(res.json())} anomalies)")

        # 12. Flood-Aware Routing
        res = await client.post("/api/v1/route", json={
            "origin": {"lat": 25.6020, "lng": 85.1376},
            "destination": {"lat": 25.5990, "lng": 85.1600},
            "vehicle_type": "Rescue Van",
            "avoid_flooded": True,
        })
        assert res.status_code == 200
        route_data = res.json()
        assert "primary_route" in route_data
        print(f"  [PASS] POST /api/v1/route ({route_data['primary_route']['total_distance_km']} km, ETA: {route_data['primary_route']['eta_min']} min)")

        res = await client.get("/api/v1/routes/presets")
        assert res.status_code == 200
        print(f"  [PASS] GET /api/v1/routes/presets ({len(res.json())} presets)")

        # 13. Scenario Simulation
        res = await client.post("/api/v1/scenario/run", json={
            "rainfall_pct": 140,
            "drainage_pct": 60,
            "river_level": "WARNING",
            "sluice_gate_open_pct": 80,
        })
        assert res.status_code == 200
        scen_data = res.json()
        assert "floodedRoadsDelta" in scen_data
        print(f"  [PASS] POST /api/v1/scenario/run (+{scen_data['floodedRoadsDelta']} flooded roads, Area: {scen_data['floodedAreaPct']}%)")

        res = await client.get("/api/v1/scenario/presets")
        assert res.status_code == 200
        print(f"  [PASS] GET /api/v1/scenario/presets ({len(res.json())} presets)")

        # 14. Historical Replay
        res = await client.get("/api/v1/replay/events")
        assert res.status_code == 200
        events = res.json()
        assert len(events) > 0
        event_id = events[0]["id"]
        print(f"  [PASS] GET /api/v1/replay/events ({len(events)} events)")

        res = await client.get(f"/api/v1/replay/events/{event_id}")
        assert res.status_code == 200
        assert len(res.json()["timeline"]) > 0
        print(f"  [PASS] GET /api/v1/replay/events/{event_id} ({len(res.json()['timeline'])} frames)")

        # 15. System Health, KPIs, Alerts, Analytics
        res = await client.get("/api/v1/system/health")
        assert res.status_code == 200
        print(f"  [PASS] GET /api/v1/system/health ({res.json()['healthy_services']}/{res.json()['total_services']} healthy)")

        res = await client.get("/api/v1/system/metrics")
        assert res.status_code == 200
        print("  [PASS] GET /api/v1/system/metrics")

        res = await client.get("/api/v1/kpis")
        assert res.status_code == 200
        kpis = res.json()
        print(f"  [PASS] GET /api/v1/kpis (Risk: {kpis['floodRisk']}, Critical Roads: {kpis['criticalRoads']})")

        res = await client.get("/api/v1/alerts")
        assert res.status_code == 200
        alerts = res.json()
        assert len(alerts) > 0
        print(f"  [PASS] GET /api/v1/alerts ({len(alerts)} alerts)")

        alert_id = alerts[0]["id"]
        res = await client.patch(f"/api/v1/alerts/{alert_id}/read")
        assert res.status_code == 200
        print(f"  [PASS] PATCH /api/v1/alerts/{alert_id}/read")

        res = await client.get("/api/v1/analytics/overview")
        assert res.status_code == 200
        print(f"  [PASS] GET /api/v1/analytics/overview ({len(res.json()['hourlyFlood'])} hourly points)")

    print("\n[SUCCESS] ALL 24 HYDROGRAPH BACKEND ENDPOINTS PASSED VERIFICATION!")


if __name__ == "__main__":
    asyncio.run(run_all_tests())
