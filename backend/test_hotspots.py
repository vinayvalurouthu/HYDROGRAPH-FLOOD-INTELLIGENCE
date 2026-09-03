"""Quick smoke test for the new hotspot endpoints."""
import httpx
import json
import sys

BASE = "http://localhost:8000"

def test_endpoint(method, path, label):
    try:
        r = httpx.request(method, f"{BASE}{path}", timeout=10)
        data = r.json()
        print(f"  [{'PASS' if r.status_code == 200 else 'FAIL'}] {label} ({r.status_code})")
        return r.status_code, data
    except Exception as e:
        print(f"  [FAIL] {label} -- {e}")
        return 0, None

print("=" * 60)
print("HOTSPOT INTELLIGENCE API -- Smoke Test")
print("=" * 60)

# 1. Full hotspot list
code, data = test_endpoint("GET", "/api/v1/hotspots", "GET /api/v1/hotspots")
if data:
    print(f"       -> {data['count']} hotspots, {data['critical_count']} critical, {data['severe_count']} severe")
    print(f"       -> Avg urgency: {data['avg_urgency_score']}, Worst: {data['worst_hotspot_id']}")
    if data["hotspots"]:
        h = data["hotspots"][0]
        print(f"       -> #1: {h['id']} ({h['name']}) -- Score: {h['score']['composite']} / Tier: {h['score']['risk_tier']}")
        print(f"         Action: {h['actionPriority']} -- {h['actionRecommendation'][:80]}...")
        print(f"         Trend: {h['trend']} | Nearby SOS: {len(h['nearbySOS'])} | Shelters: {len(h['nearbyShelters'])} | Drainage: {len(h['nearbyDrainage'])}")

# 2. Filtered by risk
code, data = test_endpoint("GET", "/api/v1/hotspots?risk=CRITICAL", "GET /api/v1/hotspots?risk=CRITICAL")
if data:
    print(f"       -> {data['count']} CRITICAL hotspots")

# 3. Summary
code, data = test_endpoint("GET", "/api/v1/hotspots/summary", "GET /api/v1/hotspots/summary")
if data:
    print(f"       -> Distribution: {data['risk_distribution']}")
    print(f"       -> Trends: {data['worsening_count']}W / {data['stable_count']}S / {data['improving_count']}I")
    print(f"       -> Avg depth: {data['avg_depth_cm']} cm, Max: {data['max_depth_cm']} cm")

# 4. Heatmap
code, data = test_endpoint("GET", "/api/v1/hotspots/heatmap", "GET /api/v1/hotspots/heatmap")
if data:
    print(f"       -> {len(data)} heatmap points")
    if data:
        p = data[0]
        print(f"       -> Hottest: {p['id']} ({p['name']}) intensity={p['intensity']}")

# 5. Single detail
code, data = test_endpoint("GET", "/api/v1/hotspots/CR-07", "GET /api/v1/hotspots/CR-07")
if data:
    print(f"       -> {data['id']}: {data['name']} -- Score: {data['score']['composite']}")
    print(f"       -> Score breakdown: depth={data['score']['depth_factor']}, vel={data['score']['velocity_factor']}, drain={data['score']['drainage_factor']}")

# 6. 404 test
code, data = test_endpoint("GET", "/api/v1/hotspots/NONEXISTENT", "GET /api/v1/hotspots/NONEXISTENT (expect 404)")

print("=" * 60)
print("All tests completed.")
