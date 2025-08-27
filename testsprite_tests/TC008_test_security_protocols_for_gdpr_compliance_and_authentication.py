import requests
import time

BASE_URL = "http://localhost:3000"
TIMEOUT = 30

def test_security_protocols_gdpr_authentication():
    """
    Verify that security protocols ensure GDPR compliance, encrypted storage,
    and safe authentication workflows including Supabase Auth with localStorage fallback.
    """

    # 1. Test GDPR compliance endpoint (assuming an endpoint exists to verify compliance status)
    try:
        gdpr_resp = requests.get(f"{BASE_URL}/api/security/gdpr-status", timeout=TIMEOUT)
        assert gdpr_resp.status_code == 200, f"Expected 200 OK for GDPR status, got {gdpr_resp.status_code}"
        gdpr_data = gdpr_resp.json()
        assert gdpr_data.get("gdpr_compliant") is True, "GDPR compliance flag should be True"
        assert "encrypted_storage" in gdpr_data, "Response must include encrypted_storage info"
        assert gdpr_data["encrypted_storage"] is True, "Storage must be encrypted for GDPR compliance"
    except requests.RequestException as e:
        assert False, f"Request to GDPR status endpoint failed: {e}"

    # 2. Test authentication workflow with Supabase Auth simulation
    # Simulate sign-up, sign-in, token validation, and localStorage fallback behavior

    # Sign-up payload (minimal user info)
    signup_payload = {
        "email": "testuser@example.com",
        "password": "StrongP@ssw0rd!"
    }
    headers = {"Content-Type": "application/json"}

    user_id = None
    access_token = None

    try:
        # Sign up user
        signup_resp = requests.post(f"{BASE_URL}/api/auth/signup", json=signup_payload, headers=headers, timeout=TIMEOUT)
        assert signup_resp.status_code == 201, f"Expected 201 Created on signup, got {signup_resp.status_code}"
        signup_data = signup_resp.json()
        user_id = signup_data.get("user_id")
        assert user_id is not None, "Signup response must include user_id"

        # Sign in user
        signin_payload = {
            "email": signup_payload["email"],
            "password": signup_payload["password"]
        }
        signin_resp = requests.post(f"{BASE_URL}/api/auth/signin", json=signin_payload, headers=headers, timeout=TIMEOUT)
        assert signin_resp.status_code == 200, f"Expected 200 OK on signin, got {signin_resp.status_code}"
        signin_data = signin_resp.json()
        access_token = signin_data.get("access_token")
        assert access_token is not None, "Signin response must include access_token"

        # Validate token usage on a protected endpoint
        auth_headers = {
            "Authorization": f"Bearer {access_token}"
        }
        protected_resp = requests.get(f"{BASE_URL}/api/auth/protected-resource", headers=auth_headers, timeout=TIMEOUT)
        assert protected_resp.status_code == 200, f"Expected 200 OK on protected resource access, got {protected_resp.status_code}"

        # Simulate localStorage fallback by requesting a token refresh endpoint
        refresh_resp = requests.post(f"{BASE_URL}/api/auth/token-refresh", headers=auth_headers, timeout=TIMEOUT)
        assert refresh_resp.status_code == 200, f"Expected 200 OK on token refresh, got {refresh_resp.status_code}"
        refresh_data = refresh_resp.json()
        refreshed_token = refresh_data.get("access_token")
        assert refreshed_token is not None and refreshed_token != access_token, "Token refresh must return a new access_token"

    except requests.RequestException as e:
        assert False, f"Authentication workflow request failed: {e}"

    finally:
        # Cleanup: delete the created user to maintain test isolation
        if user_id and access_token:
            try:
                del_headers = {
                    "Authorization": f"Bearer {access_token}"
                }
                del_resp = requests.delete(f"{BASE_URL}/api/auth/users/{user_id}", headers=del_headers, timeout=TIMEOUT)
                assert del_resp.status_code in (200, 204), f"Expected 200 or 204 on user deletion, got {del_resp.status_code}"
            except requests.RequestException:
                pass  # best effort cleanup

test_security_protocols_gdpr_authentication()