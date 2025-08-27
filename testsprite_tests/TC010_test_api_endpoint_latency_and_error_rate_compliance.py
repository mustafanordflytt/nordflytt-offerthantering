import requests
import time

BASE_URL = "http://localhost:3000"
TIMEOUT = 30
HEADERS = {
    "Accept": "application/json",
    "Content-Type": "application/json",
}

# Define endpoints to test latency and error rate
# Since PRD does not specify exact endpoints for this test,
# we assume a representative set of core API endpoints based on product overview.
ENDPOINTS = [
    {"method": "GET", "path": "/api/bookings"},           # Booking list
    {"method": "POST", "path": "/api/bookings"},          # Create booking (minimal payload)
    {"method": "GET", "path": "/api/jobs"},               # Job dashboard
    {"method": "GET", "path": "/api/crm/customers"},      # CRM customers
    {"method": "GET", "path": "/api/admin/users"},        # Admin users
    {"method": "GET", "path": "/api/ai/estimations"},     # AI time estimations
    {"method": "GET", "path": "/api/recruitment/candidates"}, # Recruitment AI candidates
]

# Minimal payload for POST /api/bookings to create a booking for test
BOOKING_PAYLOAD = {
    "customer_name": "Test User",
    "moving_date": "2025-08-15",
    "origin_address": "123 Test St, Test City",
    "destination_address": "456 Demo Ave, Demo City",
    "volume": 10,
    "parking_adjustment": 0,
    "stairs_adjustment": 0,
    "moving_type": "local"
}

# SLA thresholds
MAX_ACCEPTABLE_LATENCY_SECONDS = 2.0  # Example SLA: max 2 seconds latency per request
MAX_ACCEPTABLE_ERROR_RATE = 0.05      # Max 5% error rate allowed

def test_api_endpoint_latency_and_error_rate_compliance():
    total_requests = 0
    total_errors = 0
    latencies = []

    # For POST booking, we will create one resource and delete it after test
    created_booking_id = None

    try:
        for endpoint in ENDPOINTS:
            method = endpoint["method"]
            url = BASE_URL + endpoint["path"]

            # For POST /api/bookings, do one request with payload
            if method == "POST" and endpoint["path"] == "/api/bookings":
                start = time.time()
                try:
                    resp = requests.post(url, json=BOOKING_PAYLOAD, headers=HEADERS, timeout=TIMEOUT)
                    latency = time.time() - start
                    total_requests += 1
                    latencies.append(latency)
                    if resp.status_code == 201:
                        created_booking_id = resp.json().get("id")
                    else:
                        total_errors += 1
                    assert resp.status_code == 201, f"Expected 201 Created, got {resp.status_code}"
                except Exception as e:
                    total_requests += 1
                    total_errors += 1
                    raise AssertionError(f"POST {url} failed: {e}")

            else:
                # For GET requests, perform 5 requests each to simulate normal and peak load
                for _ in range(5):
                    start = time.time()
                    try:
                        resp = requests.request(method, url, headers=HEADERS, timeout=TIMEOUT)
                        latency = time.time() - start
                        total_requests += 1
                        latencies.append(latency)
                        if resp.status_code >= 400:
                            total_errors += 1
                        assert resp.status_code < 400, f"Expected status < 400, got {resp.status_code} for {url}"
                    except Exception as e:
                        total_requests += 1
                        total_errors += 1
                        raise AssertionError(f"{method} {url} failed: {e}")

        # Calculate error rate and latency compliance
        error_rate = total_errors / total_requests if total_requests > 0 else 1.0
        avg_latency = sum(latencies) / len(latencies) if latencies else float('inf')

        # Assert SLA compliance
        assert error_rate <= MAX_ACCEPTABLE_ERROR_RATE, f"Error rate {error_rate:.2%} exceeds SLA {MAX_ACCEPTABLE_ERROR_RATE:.2%}"
        assert avg_latency <= MAX_ACCEPTABLE_LATENCY_SECONDS, f"Average latency {avg_latency:.2f}s exceeds SLA {MAX_ACCEPTABLE_LATENCY_SECONDS:.2f}s"

    finally:
        # Cleanup created booking if any
        if created_booking_id:
            try:
                del_url = f"{BASE_URL}/api/bookings/{created_booking_id}"
                resp = requests.delete(del_url, headers=HEADERS, timeout=TIMEOUT)
                assert resp.status_code in (200, 204), f"Failed to delete booking {created_booking_id}, status {resp.status_code}"
            except Exception:
                pass

test_api_endpoint_latency_and_error_rate_compliance()
