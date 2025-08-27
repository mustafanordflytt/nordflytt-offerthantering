import requests

BASE_URL = "http://localhost:3001"
TIMEOUT = 30

def test_staff_app_authentication_and_dashboard():
    phone_number = "+4712345678"  # Example test phone number
    headers = {
        "Content-Type": "application/json"
    }

    try:
        # Step 1: Initiate OTP login by submitting phone number
        otp_request_payload = {"phone": phone_number}
        otp_request_resp = requests.post(
            f"{BASE_URL}/api/staff/auth/request-otp",
            json=otp_request_payload,
            headers=headers,
            timeout=TIMEOUT
        )
        assert otp_request_resp.status_code == 200, f"OTP request failed: {otp_request_resp.text}"
        otp_request_data = otp_request_resp.json()
        assert "otpSessionId" in otp_request_data, "otpSessionId missing in OTP request response"

        otp_session_id = otp_request_data["otpSessionId"]

        # NOTE: In real test, OTP would be received on phone.
        # For test, assume OTP code is retrievable or fixed for test environment.
        # Use a test OTP code for this purpose:
        test_otp_code = "123456"

        # Step 2: Verify OTP to authenticate and get JWT token
        otp_verify_payload = {
            "otpSessionId": otp_session_id,
            "otpCode": test_otp_code
        }
        otp_verify_resp = requests.post(
            f"{BASE_URL}/api/staff/auth/verify-otp",
            json=otp_verify_payload,
            headers=headers,
            timeout=TIMEOUT
        )
        assert otp_verify_resp.status_code == 200, f"OTP verify failed: {otp_verify_resp.text}"
        otp_verify_data = otp_verify_resp.json()
        assert "token" in otp_verify_data, "JWT token missing in OTP verify response"
        auth_token = otp_verify_data["token"]
        auth_headers = {
            "Authorization": f"Bearer {auth_token}"
        }

        # Step 3: Fetch staff dashboard for today's jobs with default view (card)
        dashboard_resp = requests.get(
            f"{BASE_URL}/api/staff/dashboard?view=card&date=today",
            headers=auth_headers,
            timeout=TIMEOUT
        )
        assert dashboard_resp.status_code == 200, f"Dashboard fetch failed: {dashboard_resp.text}"
        dashboard_data = dashboard_resp.json()
        assert "jobs" in dashboard_data, "Dashboard response missing jobs key"
        jobs_list = dashboard_data["jobs"]
        # jobs can be empty but should be a list
        assert isinstance(jobs_list, list), "Jobs should be a list"

        # Step 4: Fetch dashboard with list view
        dashboard_list_resp = requests.get(
            f"{BASE_URL}/api/staff/dashboard?view=list&date=today",
            headers=auth_headers,
            timeout=TIMEOUT
        )
        assert dashboard_list_resp.status_code == 200, f"Dashboard list view fetch failed: {dashboard_list_resp.text}"
        dashboard_list_data = dashboard_list_resp.json()
        assert "jobs" in dashboard_list_data, "Dashboard list response missing jobs key"
        assert isinstance(dashboard_list_data["jobs"], list), "Jobs should be a list in list view"

        # Step 5: Test filtering jobs by status - example filter: 'open'
        filter_params = {
            "view": "card",
            "date": "today",
            "status": "open"
        }
        filter_resp = requests.get(
            f"{BASE_URL}/api/staff/dashboard",
            headers=auth_headers,
            params=filter_params,
            timeout=TIMEOUT
        )
        assert filter_resp.status_code == 200, f"Dashboard filter fetch failed: {filter_resp.text}"
        filter_data = filter_resp.json()
        assert "jobs" in filter_data, "Filtered dashboard response missing jobs key"
        assert isinstance(filter_data["jobs"], list), "Jobs should be a list in filtered response"
        # If jobs exist, check all have status 'open'
        for job in filter_data["jobs"]:
            assert job.get("status") == "open", f"Job status mismatch in filter: {job}"

        # Step 6: Test searching jobs by keyword in dashboard
        search_keyword = "move"
        search_params = {
            "view": "list",
            "date": "today",
            "search": search_keyword
        }
        search_resp = requests.get(
            f"{BASE_URL}/api/staff/dashboard",
            headers=auth_headers,
            params=search_params,
            timeout=TIMEOUT
        )
        assert search_resp.status_code == 200, f"Dashboard search fetch failed: {search_resp.text}"
        search_data = search_resp.json()
        assert "jobs" in search_data, "Search dashboard response missing jobs key"
        assert isinstance(search_data["jobs"], list), "Jobs should be a list in search response"
        # If jobs returned, verify keyword presence in job title or description
        for job in search_data["jobs"]:
            title = job.get("title", "").lower()
            desc = job.get("description", "").lower()
            assert search_keyword in title or search_keyword in desc, f"Job does not match search keyword: {job}"

    except requests.RequestException as e:
        assert False, f"Request failed: {str(e)}"


test_staff_app_authentication_and_dashboard()