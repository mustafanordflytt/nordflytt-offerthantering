import requests
import uuid

BASE_URL = "http://localhost:3000"
TIMEOUT = 30
HEADERS = {"Content-Type": "application/json"}

def test_crm_system_data_management_and_reporting():
    lead_id = None
    customer_id = None
    booking_id = None
    report_id = None

    try:
        # 1. Create a Lead
        lead_payload = {
            "name": "Test Lead " + str(uuid.uuid4()),
            "email": "lead@example.com",
            "phone": "+46700000000",
            "source": "test_case_TC005"
        }
        lead_resp = requests.post(f"{BASE_URL}/crm/leads", json=lead_payload, headers=HEADERS, timeout=TIMEOUT)
        assert lead_resp.status_code == 201, f"Lead creation failed: {lead_resp.text}"
        lead_data = lead_resp.json()
        lead_id = lead_data.get("id")
        assert lead_id is not None, "Lead ID missing in response"

        # 2. Convert Lead to Customer
        customer_payload = {
            "lead_id": lead_id,
            "company_name": "Test Customer Co",
            "contact_name": lead_payload["name"],
            "email": lead_payload["email"],
            "phone": lead_payload["phone"],
            "address": "Test Address 123"
        }
        customer_resp = requests.post(f"{BASE_URL}/crm/customers", json=customer_payload, headers=HEADERS, timeout=TIMEOUT)
        assert customer_resp.status_code == 201, f"Customer creation failed: {customer_resp.text}"
        customer_data = customer_resp.json()
        customer_id = customer_data.get("id")
        assert customer_id is not None, "Customer ID missing in response"

        # 3. Create a Booking for the Customer
        booking_payload = {
            "customer_id": customer_id,
            "date": "2025-08-15T10:00:00Z",
            "origin": "Test Origin Address",
            "destination": "Test Destination Address",
            "volume_m3": 15,
            "special_requirements": "None",
            "status": "confirmed"
        }
        booking_resp = requests.post(f"{BASE_URL}/crm/bookings", json=booking_payload, headers=HEADERS, timeout=TIMEOUT)
        assert booking_resp.status_code == 201, f"Booking creation failed: {booking_resp.text}"
        booking_data = booking_resp.json()
        booking_id = booking_data.get("id")
        assert booking_id is not None, "Booking ID missing in response"

        # 4. Retrieve CRM Reports
        reports_resp = requests.get(f"{BASE_URL}/crm/reports/summary", headers=HEADERS, timeout=TIMEOUT)
        assert reports_resp.status_code == 200, f"Reports retrieval failed: {reports_resp.text}"
        reports_data = reports_resp.json()
        assert isinstance(reports_data, dict), "Reports data is not a dictionary"
        # Basic checks for expected keys in report summary
        expected_keys = {"total_leads", "total_customers", "total_bookings", "conversion_rate"}
        assert expected_keys.issubset(reports_data.keys()), f"Reports missing keys: {expected_keys - reports_data.keys()}"

        # 5. Verify backend synchronization by fetching created resources
        # Fetch Lead
        lead_get_resp = requests.get(f"{BASE_URL}/crm/leads/{lead_id}", headers=HEADERS, timeout=TIMEOUT)
        assert lead_get_resp.status_code == 200, f"Lead fetch failed: {lead_get_resp.text}"
        lead_get_data = lead_get_resp.json()
        assert lead_get_data.get("email") == lead_payload["email"], "Lead email mismatch"

        # Fetch Customer
        customer_get_resp = requests.get(f"{BASE_URL}/crm/customers/{customer_id}", headers=HEADERS, timeout=TIMEOUT)
        assert customer_get_resp.status_code == 200, f"Customer fetch failed: {customer_get_resp.text}"
        customer_get_data = customer_get_resp.json()
        assert customer_get_data.get("company_name") == customer_payload["company_name"], "Customer company name mismatch"

        # Fetch Booking
        booking_get_resp = requests.get(f"{BASE_URL}/crm/bookings/{booking_id}", headers=HEADERS, timeout=TIMEOUT)
        assert booking_get_resp.status_code == 200, f"Booking fetch failed: {booking_get_resp.text}"
        booking_get_data = booking_get_resp.json()
        assert booking_get_data.get("status") == booking_payload["status"], "Booking status mismatch"

    finally:
        # Cleanup created resources in reverse order
        if booking_id:
            try:
                del_booking_resp = requests.delete(f"{BASE_URL}/crm/bookings/{booking_id}", headers=HEADERS, timeout=TIMEOUT)
                assert del_booking_resp.status_code in (200, 204), f"Booking deletion failed: {del_booking_resp.text}"
            except Exception:
                pass
        if customer_id:
            try:
                del_customer_resp = requests.delete(f"{BASE_URL}/crm/customers/{customer_id}", headers=HEADERS, timeout=TIMEOUT)
                assert del_customer_resp.status_code in (200, 204), f"Customer deletion failed: {del_customer_resp.text}"
            except Exception:
                pass
        if lead_id:
            try:
                del_lead_resp = requests.delete(f"{BASE_URL}/crm/leads/{lead_id}", headers=HEADERS, timeout=TIMEOUT)
                assert del_lead_resp.status_code in (200, 204), f"Lead deletion failed: {del_lead_resp.text}"
            except Exception:
                pass

test_crm_system_data_management_and_reporting()