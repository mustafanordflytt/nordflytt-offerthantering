import requests
import time

BASE_URL = "http://localhost:3000"
TIMEOUT = 30
HEADERS = {"Content-Type": "application/json"}

def test_staff_mobile_app_job_management_features():
    # Step 1: Create a new job to test job dashboard, checklist, photo upload, and offline sync
    job_payload = {
        "title": "Test Job for Mobile App Features",
        "description": "Job created for testing staff mobile app features including dashboard, photo uploads, checklists, and offline sync.",
        "status": "pending",
        "assigned_to": "staff_mobile_app_test_user",
        "job_type": "moving",
        "scheduled_date": "2025-08-01T10:00:00Z"
    }

    job_id = None
    photo_id = None
    checklist_id = None

    try:
        # Create job
        resp = requests.post(f"{BASE_URL}/api/jobs", json=job_payload, headers=HEADERS, timeout=TIMEOUT)
        assert resp.status_code == 201, f"Job creation failed: {resp.text}"
        job = resp.json()
        job_id = job.get("id")
        assert job_id is not None, "Job ID not returned"

        # Step 2: Verify job appears in job dashboard (GET job by ID)
        resp = requests.get(f"{BASE_URL}/api/jobs/{job_id}", headers=HEADERS, timeout=TIMEOUT)
        assert resp.status_code == 200, f"Failed to get job dashboard info: {resp.text}"
        job_data = resp.json()
        assert job_data["id"] == job_id, "Job ID mismatch in dashboard"
        assert "title" in job_data and job_data["title"] == job_payload["title"], "Job title mismatch"

        # Step 3: Upload photo documentation for the job
        # Simulate photo upload with a small dummy file content
        photo_files = {
            "photo": ("test_photo.jpg", b"dummyimagecontent", "image/jpeg")
        }
        resp = requests.post(f"{BASE_URL}/api/jobs/{job_id}/photos", files=photo_files, timeout=TIMEOUT)
        assert resp.status_code == 201, f"Photo upload failed: {resp.text}"
        photo_resp = resp.json()
        photo_id = photo_resp.get("id")
        assert photo_id is not None, "Photo ID not returned"

        # Step 4: Create and update dynamic checklist for the job
        checklist_payload = {
            "job_id": job_id,
            "items": [
                {"task": "Pack boxes", "completed": False},
                {"task": "Load truck", "completed": False},
                {"task": "Unload truck", "completed": False}
            ]
        }
        resp = requests.post(f"{BASE_URL}/api/jobs/{job_id}/checklists", json=checklist_payload, headers=HEADERS, timeout=TIMEOUT)
        assert resp.status_code == 201, f"Checklist creation failed: {resp.text}"
        checklist = resp.json()
        checklist_id = checklist.get("id")
        assert checklist_id is not None, "Checklist ID not returned"

        # Update checklist item to completed
        update_payload = {
            "items": [
                {"task": "Pack boxes", "completed": True},
                {"task": "Load truck", "completed": False},
                {"task": "Unload truck", "completed": False}
            ]
        }
        resp = requests.put(f"{BASE_URL}/api/jobs/{job_id}/checklists/{checklist_id}", json=update_payload, headers=HEADERS, timeout=TIMEOUT)
        assert resp.status_code == 200, f"Checklist update failed: {resp.text}"
        updated_checklist = resp.json()
        assert any(item["completed"] for item in updated_checklist.get("items", [])), "Checklist item not marked completed"

        # Step 5: Simulate offline mode by creating local changes and then syncing
        # For backend test, simulate by updating job status offline and then syncing
        offline_update_payload = {"status": "in_progress"}
        # Simulate offline update (no request)
        # Then sync update to backend
        resp = requests.patch(f"{BASE_URL}/api/jobs/{job_id}", json=offline_update_payload, headers=HEADERS, timeout=TIMEOUT)
        assert resp.status_code == 200, f"Sync after offline update failed: {resp.text}"
        synced_job = resp.json()
        assert synced_job["status"] == "in_progress", "Job status not updated after sync"

        # Step 6: Verify data synchronization by fetching job and related data again
        resp = requests.get(f"{BASE_URL}/api/jobs/{job_id}", headers=HEADERS, timeout=TIMEOUT)
        assert resp.status_code == 200, f"Failed to get job after sync: {resp.text}"
        job_after_sync = resp.json()
        assert job_after_sync["status"] == "in_progress", "Job status mismatch after sync"

        resp = requests.get(f"{BASE_URL}/api/jobs/{job_id}/photos/{photo_id}", headers=HEADERS, timeout=TIMEOUT)
        assert resp.status_code == 200, f"Failed to get uploaded photo after sync: {resp.text}"

        resp = requests.get(f"{BASE_URL}/api/jobs/{job_id}/checklists/{checklist_id}", headers=HEADERS, timeout=TIMEOUT)
        assert resp.status_code == 200, f"Failed to get checklist after sync: {resp.text}"
        checklist_after_sync = resp.json()
        assert any(item["completed"] for item in checklist_after_sync.get("items", [])), "Checklist item completion lost after sync"

    finally:
        # Cleanup: delete created checklist, photo, and job if they exist
        if checklist_id:
            try:
                requests.delete(f"{BASE_URL}/api/jobs/{job_id}/checklists/{checklist_id}", headers=HEADERS, timeout=TIMEOUT)
            except Exception:
                pass
        if photo_id:
            try:
                requests.delete(f"{BASE_URL}/api/jobs/{job_id}/photos/{photo_id}", headers=HEADERS, timeout=TIMEOUT)
            except Exception:
                pass
        if job_id:
            try:
                requests.delete(f"{BASE_URL}/api/jobs/{job_id}", headers=HEADERS, timeout=TIMEOUT)
            except Exception:
                pass

test_staff_mobile_app_job_management_features()
