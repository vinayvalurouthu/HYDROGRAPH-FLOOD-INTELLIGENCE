import requests

BASE_URL = "http://127.0.0.1:8000"

def test_rbac_jwt():
    print("=" * 60)
    print("TESTING FASTAPI JWT & ROLE-BASED ACCESS CONTROL (RBAC)")
    print("=" * 60)

    # 1. Login as Operator
    res_op = requests.post(f"{BASE_URL}/api/login", json={"username": "operator@hydrograph.gov.in", "password": "password123"})
    assert res_op.status_code == 200, f"Operator login failed: {res_op.text}"
    op_token = res_op.json()["access_token"]
    print("[1] Operator Login SUCCESS -> Token generated. Role:", res_op.json()["role"])

    # 2. Login as Citizen
    res_cit = requests.post(f"{BASE_URL}/api/login", json={"username": "citizen.sos@patna.gov.in", "password": "password123"})
    assert res_cit.status_code == 200, f"Citizen login failed: {res_cit.text}"
    cit_token = res_cit.json()["access_token"]
    print("[2] Citizen Login SUCCESS  -> Token generated. Role:", res_cit.json()["role"])

    # 3. Login as Rescuer
    res_res = requests.post(f"{BASE_URL}/api/login", json={"username": "ndrf.taskforce04@rescue.in", "password": "password123"})
    assert res_res.status_code == 200, f"Rescuer login failed: {res_res.text}"
    res_token = res_res.json()["access_token"]
    print("[3] Rescuer Login SUCCESS  -> Token generated. Role:", res_res.json()["role"])

    print("-" * 60)
    print("TESTING PROTECTED ENDPOINTS WITH ROLE CHECKER DEPENDENCY")
    print("-" * 60)

    # Test /api/operator/data (Allowed: OPERATOR)
    h_op = {"Authorization": f"Bearer {op_token}"}
    h_cit = {"Authorization": f"Bearer {cit_token}"}
    h_res = {"Authorization": f"Bearer {res_token}"}

    res = requests.get(f"{BASE_URL}/api/operator/data", headers=h_op)
    print(f"Operator accessing /api/operator/data : HTTP {res.status_code} [ALLOWED]")
    assert res.status_code == 200

    res = requests.get(f"{BASE_URL}/api/operator/data", headers=h_cit)
    print(f"Citizen  accessing /api/operator/data : HTTP {res.status_code} [403 FORBIDDEN - CORRECT]")
    assert res.status_code == 403

    # Test /api/rescue/mission (Allowed: OPERATOR, RESCUER)
    res = requests.get(f"{BASE_URL}/api/rescue/mission", headers=h_res)
    print(f"Rescuer  accessing /api/rescue/mission : HTTP {res.status_code} [ALLOWED]")
    assert res.status_code == 200

    res = requests.get(f"{BASE_URL}/api/rescue/mission", headers=h_cit)
    print(f"Citizen  accessing /api/rescue/mission : HTTP {res.status_code} [403 FORBIDDEN - CORRECT]")
    assert res.status_code == 403

    # Test /api/citizen/status (Allowed: CITIZEN, OPERATOR)
    res = requests.get(f"{BASE_URL}/api/citizen/status", headers=h_cit)
    print(f"Citizen  accessing /api/citizen/status : HTTP {res.status_code} [ALLOWED]")
    assert res.status_code == 200

    print("=" * 60)
    print("ALL FASTAPI RBAC & JWT SECURITY TESTS PASSED PERFECTLY!")
    print("=" * 60)

if __name__ == "__main__":
    test_rbac_jwt()
