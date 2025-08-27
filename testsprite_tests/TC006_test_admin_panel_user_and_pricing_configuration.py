import requests
import uuid

BASE_URL = "http://localhost:3000"
TIMEOUT = 30
HEADERS = {
    "Content-Type": "application/json",
    # Add authentication headers here if required, e.g.:
    # "Authorization": "Bearer <token>"
}

def test_admin_panel_user_and_pricing_configuration():
    # Helper functions
    def create_user():
        user_data = {
            "username": f"testuser_{uuid.uuid4().hex[:8]}",
            "email": f"testuser_{uuid.uuid4().hex[:8]}@example.com",
            "role": "admin",
            "password": "TestPass123!"
        }
        resp = requests.post(f"{BASE_URL}/admin/users", json=user_data, headers=HEADERS, timeout=TIMEOUT)
        resp.raise_for_status()
        return resp.json()

    def delete_user(user_id):
        resp = requests.delete(f"{BASE_URL}/admin/users/{user_id}", headers=HEADERS, timeout=TIMEOUT)
        resp.raise_for_status()

    def get_pricing_config():
        resp = requests.get(f"{BASE_URL}/admin/pricing", headers=HEADERS, timeout=TIMEOUT)
        resp.raise_for_status()
        return resp.json()

    def update_pricing_config(pricing_data):
        resp = requests.put(f"{BASE_URL}/admin/pricing", json=pricing_data, headers=HEADERS, timeout=TIMEOUT)
        resp.raise_for_status()
        return resp.json()

    def get_system_health():
        resp = requests.get(f"{BASE_URL}/admin/system-health", headers=HEADERS, timeout=TIMEOUT)
        resp.raise_for_status()
        return resp.json()

    # Begin test
    user = None
    try:
        # 1. Create a new admin user
        user = create_user()
        user_id = user.get("id")
        assert user_id is not None, "User creation failed: no user ID returned"
        assert user.get("role") == "admin", "Created user does not have admin role"

        # 2. Retrieve current pricing configuration
        pricing_before = get_pricing_config()
        assert isinstance(pricing_before, dict), "Pricing config should be a dictionary"

        # 3. Update pricing configuration with a test modification
        test_pricing_update = pricing_before.copy()
        # Example: toggle a boolean or update a numeric value for testing
        if "base_rate" in test_pricing_update:
            original_base_rate = test_pricing_update["base_rate"]
            test_pricing_update["base_rate"] = original_base_rate + 1
        else:
            test_pricing_update["base_rate"] = 100  # fallback test value

        updated_pricing = update_pricing_config(test_pricing_update)
        assert updated_pricing.get("base_rate") == test_pricing_update["base_rate"], "Pricing update did not persist"

        # 4. Verify system health endpoint returns expected keys and status
        system_health = get_system_health()
        assert isinstance(system_health, dict), "System health response should be a dictionary"
        assert "status" in system_health, "System health missing 'status' field"
        assert system_health["status"] in ["ok", "healthy", "degraded"], "Unexpected system health status value"

        # 5. Verify user list includes the created user
        resp_users = requests.get(f"{BASE_URL}/admin/users", headers=HEADERS, timeout=TIMEOUT)
        resp_users.raise_for_status()
        users_list = resp_users.json()
        assert any(u.get("id") == user_id for u in users_list), "Created user not found in user list"

    finally:
        # Cleanup: delete the created user if exists
        if user and user.get("id"):
            try:
                delete_user(user["id"])
            except Exception:
                pass

test_admin_panel_user_and_pricing_configuration()