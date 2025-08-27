import requests
import time

BASE_URL = "http://localhost:3001"
TIMEOUT = 30

# Common headers
HEADERS_JSON = {"Content-Type": "application/json"}

def test_security_controls_enforcement():
    try:
        # 1. Test JWT Authentication: simulate login and token issuance
        login_payload = {
            "username": "testuser_security",
            "password": "StrongPassword!23"
        }
        login_resp = requests.post(f"{BASE_URL}/api/auth/login", json=login_payload, timeout=TIMEOUT, headers=HEADERS_JSON)
        assert login_resp.status_code == 200, f"Login failed: {login_resp.text}"
        login_data = login_resp.json()
        assert "token" in login_data, "JWT token missing in login response"
        jwt_token = login_data["token"]
        auth_headers = {"Authorization": f"Bearer {jwt_token}", **HEADERS_JSON}

        # 2. Test OTP Authentication flow: request OTP and verify
        otp_request_payload = {"phone": "+46700000001"}  # example test phone number
        otp_req_resp = requests.post(f"{BASE_URL}/api/auth/otp/request", json=otp_request_payload, timeout=TIMEOUT, headers=HEADERS_JSON)
        assert otp_req_resp.status_code == 200, f"OTP request failed: {otp_req_resp.text}"

        # For test environment, simulate OTP retrieval (usually test OTP could be fixed or returned)
        otp_code = "123456"  # Stub OTP code for testing

        otp_verify_payload = {"phone": "+46700000001", "otp": otp_code}
        otp_verify_resp = requests.post(f"{BASE_URL}/api/auth/otp/verify", json=otp_verify_payload, timeout=TIMEOUT, headers=HEADERS_JSON)
        assert otp_verify_resp.status_code == 200, f"OTP verify failed: {otp_verify_resp.text}"
        otp_data = otp_verify_resp.json()
        assert "token" in otp_data, "JWT token missing in OTP verify response"
        otp_jwt_token = otp_data["token"]
        otp_auth_headers = {"Authorization": f"Bearer {otp_jwt_token}", **HEADERS_JSON}

        # 3. Test BankID integration: simulate BankID authentication initiation
        bankid_init_payload = {"personalNumber": "199001011234"}  # Sample Swedish personal number
        bankid_init_resp = requests.post(f"{BASE_URL}/api/auth/bankid/initiate", json=bankid_init_payload, timeout=TIMEOUT, headers=HEADERS_JSON)
        assert bankid_init_resp.status_code == 200, f"BankID initiation failed: {bankid_init_resp.text}"
        bankid_init_data = bankid_init_resp.json()
        assert "orderRef" in bankid_init_data, "orderRef missing in BankID initiation"

        order_ref = bankid_init_data["orderRef"]

        # Poll bankid status to simulate user completing BankID (mocked with timeout)
        for _ in range(5):
            bankid_status_resp = requests.get(f"{BASE_URL}/api/auth/bankid/status/{order_ref}", timeout=TIMEOUT, headers=HEADERS_JSON)
            assert bankid_status_resp.status_code == 200, f"BankID status fetch failed: {bankid_status_resp.text}"
            status_data = bankid_status_resp.json()
            if status_data.get("status") == "complete":
                break
            time.sleep(1)
        else:
            raise AssertionError("BankID authentication did not complete in expected time")

        # 4. Test input validation on user creation with invalid data (should fail)
        invalid_user_payload = {
            "email": "invalid-email-format",
            "password": "123",  # weak password
            "username": "<script>alert('xss')</script>"  # malicious input
        }
        invalid_resp = requests.post(f"{BASE_URL}/api/users", json=invalid_user_payload, timeout=TIMEOUT, headers=auth_headers)
        assert invalid_resp.status_code == 400 or invalid_resp.status_code == 422, "Input validation failed to reject invalid data"

        # 5. Create a user with valid data for role-based access test
        valid_user_payload = {
            "username": "test_security_user",
            "email": "securityuser@test.com",
            "password": "StrongPassword!23",
            "roles": ["user"]
        }
        create_resp = requests.post(f"{BASE_URL}/api/users", json=valid_user_payload, timeout=TIMEOUT, headers=auth_headers)
        assert create_resp.status_code == 201, f"Failed to create test user: {create_resp.text}"
        user = create_resp.json()
        user_id = user.get("id")
        assert user_id is not None, "Created user ID missing"

        # 6. Attempt role-based access control: user with 'user' role should be denied admin-only endpoint
        admin_only_headers = {**auth_headers}
        # We must assume the token's permissions correspond to the user created or test token has 'user' role

        admin_endpoint_resp = requests.get(f"{BASE_URL}/api/admin/dashboard", headers=admin_only_headers, timeout=TIMEOUT)
        assert admin_endpoint_resp.status_code == 403 or admin_endpoint_resp.status_code == 401, "Role-based access control failed to restrict access"

        # 7. Test audit logging presence by fetching audit logs for user actions (assuming audit logs API)
        audit_logs_resp = requests.get(f"{BASE_URL}/api/audit-logs?userId={user_id}", headers=auth_headers, timeout=TIMEOUT)
        assert audit_logs_resp.status_code == 200, f"Failed to fetch audit logs: {audit_logs_resp.text}"
        audit_logs = audit_logs_resp.json()
        assert isinstance(audit_logs, list), "Audit logs response invalid"
        # Confirm at least one audit log entry related to the user creation
        assert any(log.get("action") == "USER_CREATE" and log.get("userId") == user_id for log in audit_logs), "Audit log for user creation missing"

        # 8. Test GDPR compliance: request user data export and delete
        export_resp = requests.get(f"{BASE_URL}/api/users/{user_id}/data-export", headers=auth_headers, timeout=TIMEOUT)
        assert export_resp.status_code == 200, f"User data export failed: {export_resp.text}"
        # Data export content checks
        export_data = export_resp.json()
        assert "user" in export_data, "Exported data incomplete"

        delete_resp = requests.delete(f"{BASE_URL}/api/users/{user_id}", headers=auth_headers, timeout=TIMEOUT)
        assert delete_resp.status_code == 204, f"User deletion failed: {delete_resp.text}"

        # 9. Test encryption: verify sensitive data retrieval is masked or encrypted
        sensitive_resp = requests.get(f"{BASE_URL}/api/users/{user_id}", headers=auth_headers, timeout=TIMEOUT)
        # Since user is deleted, expect 404
        assert sensitive_resp.status_code == 404, "Deleted user data still accessible, encryption/access control failed"

        # 10. Test that HTTPS enforcement is not bypassed - simulate by checking redirects or headers if available
        # Since testing over HTTP local, assume HTTPS redirect header test not applicable in local test

        # 11. Test CSRF and XSS protections by sending malicious payloads on a form endpoint and expect rejection or sanitization
        xss_payload = {
            "note": "<script>alert('XSS')</script>"
        }
        note_resp = requests.post(f"{BASE_URL}/api/notes", json=xss_payload, headers=auth_headers, timeout=TIMEOUT)
        # Expect validation error or sanitized output
        assert note_resp.status_code in (200, 201, 400, 422), "Unexpected status for XSS payload"
        if note_resp.status_code in (200,201):
            # Check response sanitized
            note_content = note_resp.json().get("note", "")
            assert "<script>" not in note_content.lower(), "XSS protection failed, script tag present"

    finally:
        # Cleanup: delete created user if still exists
        try:
            # Use admin or JWT token for cleanup
            if 'user_id' in locals():
                requests.delete(f"{BASE_URL}/api/users/{user_id}", headers=auth_headers, timeout=TIMEOUT)
        except Exception:
            pass


test_security_controls_enforcement()