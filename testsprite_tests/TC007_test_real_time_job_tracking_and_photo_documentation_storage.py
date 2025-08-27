import requests
import uuid
import time

BASE_URL = "http://localhost:3000"
TIMEOUT = 30
HEADERS = {
    "Content-Type": "application/json"
}

def test_real_time_job_tracking_and_photo_documentation_storage():
    job_id = None
    photo_id = None
    try:
        # Step 1: Create a new job to track
        job_payload = {
            "customer_name": "Test Customer",
            "address": "123 Test St",
            "scheduled_date": "2025-08-15T09:00:00Z"
        }
        create_job_resp = requests.post(f"{BASE_URL}/jobs", json=job_payload, headers=HEADERS, timeout=TIMEOUT)
        assert create_job_resp.status_code == 201, f"Job creation failed: {create_job_resp.text}"
        job_data = create_job_resp.json()
        job_id = job_data.get("id")
        assert job_id is not None, "Job ID not returned after creation"

        # Step 2: Send a real-time job tracking update (e.g. status update)
        tracking_update_payload = {
            "status": "in_progress",
            "location": {"lat": 59.3293, "lng": 18.0686},
            "timestamp": time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime())
        }
        update_resp = requests.put(f"{BASE_URL}/jobs/{job_id}/tracking", json=tracking_update_payload, headers=HEADERS, timeout=TIMEOUT)
        assert update_resp.status_code == 200, f"Job tracking update failed: {update_resp.text}"
        update_data = update_resp.json()
        assert update_data.get("status") == "in_progress", "Job status not updated correctly"

        # Step 3: Upload photo documentation for the job
        photo_content = b"fake-image-bytes-for-testing"
        files = {
            "photo": ("test_photo.jpg", photo_content, "image/jpeg")
        }
        photo_upload_resp = requests.post(f"{BASE_URL}/jobs/{job_id}/photos", files=files, timeout=TIMEOUT)
        assert photo_upload_resp.status_code == 201, f"Photo upload failed: {photo_upload_resp.text}"
        photo_data = photo_upload_resp.json()
        photo_id = photo_data.get("id")
        assert photo_id is not None, "Photo ID not returned after upload"

        # Step 4: Retrieve job tracking info and verify update is recorded
        get_tracking_resp = requests.get(f"{BASE_URL}/jobs/{job_id}/tracking", headers=HEADERS, timeout=TIMEOUT)
        assert get_tracking_resp.status_code == 200, f"Failed to get job tracking info: {get_tracking_resp.text}"
        tracking_records = get_tracking_resp.json()
        assert any(rec.get("status") == "in_progress" for rec in tracking_records), "Tracking update not found in records"

        # Step 5: Retrieve photo documentation and verify photo is accessible
        get_photos_resp = requests.get(f"{BASE_URL}/jobs/{job_id}/photos", headers=HEADERS, timeout=TIMEOUT)
        assert get_photos_resp.status_code == 200, f"Failed to get job photos: {get_photos_resp.text}"
        photos = get_photos_resp.json()
        assert any(photo.get("id") == photo_id for photo in photos), "Uploaded photo not found in photo list"

    finally:
        # Cleanup: Delete uploaded photo and job if created
        if photo_id and job_id:
            requests.delete(f"{BASE_URL}/jobs/{job_id}/photos/{photo_id}", timeout=TIMEOUT)
        if job_id:
            requests.delete(f"{BASE_URL}/jobs/{job_id}", timeout=TIMEOUT)

test_real_time_job_tracking_and_photo_documentation_storage()
