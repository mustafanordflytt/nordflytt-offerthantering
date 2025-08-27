import requests
import time

BASE_URL = "http://localhost:3001"
TIMEOUT = 30

# Dummy staff authentication to retrieve a JWT token for authorization
def staff_login(phone="+1234567890", otp="123456"):
    login_url = f"{BASE_URL}/api/staff/login"
    resp = requests.post(login_url, json={"phone": phone, "otp": otp}, timeout=TIMEOUT)
    resp.raise_for_status()
    token = resp.json().get("token")
    if not token:
        raise Exception("Failed to retrieve staff auth token")
    return token

def test_staff_job_management_features():
    token = staff_login()
    headers = {"Authorization": f"Bearer {token}", "Content-Type": "application/json"}

    # Step 1: Create a new job resource for testing
    create_job_payload = {
        "customer_id": 1,  # Assuming customer with ID 1 exists for testing
        "service_type": "standard_moving",
        "scheduled_start": "2025-09-01T08:00:00Z",
        "volume_estimate": 10,
        "address_pickup": "123 Origin St, City A",
        "address_destination": "456 Destination Rd, City B",
        "status": "scheduled"
    }
    job_create_resp = requests.post(f"{BASE_URL}/api/jobs", headers=headers, json=create_job_payload, timeout=TIMEOUT)
    assert job_create_resp.status_code == 201, f"Job creation failed: {job_create_resp.text}"
    job = job_create_resp.json()
    job_id = job["id"]

    try:
        # Step 2: Update job status
        status_update_payload = {"status": "in_progress"}
        resp_status = requests.put(f"{BASE_URL}/api/jobs/{job_id}/status", headers=headers, json=status_update_payload, timeout=TIMEOUT)
        assert resp_status.status_code == 200
        assert resp_status.json().get("status") == "in_progress"

        # Step 3: Complete pre-start checklist
        checklist_payload = {
            "completed_items": [
                "vehicle_checked",
                "equipment_ready",
                "safety_gear_worn"
            ]
        }
        resp_checklist = requests.post(f"{BASE_URL}/api/jobs/{job_id}/prestart-checklist", headers=headers, json=checklist_payload, timeout=TIMEOUT)
        assert resp_checklist.status_code == 200
        checklist_resp_json = resp_checklist.json()
        assert checklist_resp_json.get("checklist_completed") is True or len(checklist_resp_json.get("completed_items", [])) == 3

        # Step 4: Log GPS location
        gps_payload = {"latitude": 59.3293, "longitude": 18.0686, "timestamp": time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime())}
        resp_gps = requests.post(f"{BASE_URL}/api/jobs/{job_id}/gps-log", headers=headers, json=gps_payload, timeout=TIMEOUT)
        assert resp_gps.status_code == 201
        gps_log = resp_gps.json()
        assert gps_log.get("latitude") == gps_payload["latitude"]
        assert gps_log.get("longitude") == gps_payload["longitude"]

        # Step 5: Start time tracking
        resp_start_time = requests.post(f"{BASE_URL}/api/jobs/{job_id}/time-tracking/start", headers=headers, timeout=TIMEOUT)
        assert resp_start_time.status_code == 200
        assert resp_start_time.json().get("tracking") is True

        # Wait for 1 second to simulate some elapsed time
        time.sleep(1)

        # Step 6: Stop time tracking
        resp_stop_time = requests.post(f"{BASE_URL}/api/jobs/{job_id}/time-tracking/stop", headers=headers, timeout=TIMEOUT)
        assert resp_stop_time.status_code == 200
        elapsed = resp_stop_time.json().get("elapsed_seconds")
        assert isinstance(elapsed, int) and elapsed >= 1

        # Step 7: Upload photo documentation
        photo_upload_url = f"{BASE_URL}/api/jobs/{job_id}/photo"
        # For test purposes, upload dummy bytes as photo (simulate jpeg)
        photo_files = {"file": ("photo.jpg", b"\xff\xd8\xff\xe0\x00\x10JFIF", "image/jpeg")}
        resp_photo = requests.post(photo_upload_url, headers={"Authorization": f"Bearer {token}"}, files=photo_files, timeout=TIMEOUT)
        assert resp_photo.status_code == 201
        photo_data = resp_photo.json()
        assert "photo_url" in photo_data

        # Step 8: Request additional services
        additional_service_payload = {
            "service_name": "packing_help",
            "quantity": 2,
            "notes": "Need assistance with packing fragile items."
        }
        resp_add_service = requests.post(f"{BASE_URL}/api/jobs/{job_id}/additional-services", headers=headers, json=additional_service_payload, timeout=TIMEOUT)
        assert resp_add_service.status_code == 201
        added_service = resp_add_service.json()
        assert added_service.get("service_name") == "packing_help"
        assert added_service.get("quantity") == 2

        # Step 9: Adjust volumes
        volume_adjust_payload = {"volume_estimate": 12}
        resp_volume = requests.put(f"{BASE_URL}/api/jobs/{job_id}/volume", headers=headers, json=volume_adjust_payload, timeout=TIMEOUT)
        assert resp_volume.status_code == 200
        assert resp_volume.json().get("volume_estimate") == 12

        # Step 10: Use smart pricing engine to get updated price
        resp_smart_price = requests.get(f"{BASE_URL}/api/jobs/{job_id}/smart-price", headers=headers, timeout=TIMEOUT)
        assert resp_smart_price.status_code == 200
        smart_price_resp = resp_smart_price.json()
        assert "price" in smart_price_resp
        assert isinstance(smart_price_resp["price"], (int, float))
        assert smart_price_resp["price"] > 0

    finally:
        # Clean up: delete the test job
        delete_resp = requests.delete(f"{BASE_URL}/api/jobs/{job_id}", headers=headers, timeout=TIMEOUT)
        # Allow 404 in case the job was already deleted
        assert delete_resp.status_code in (200, 204, 404)


test_staff_job_management_features()