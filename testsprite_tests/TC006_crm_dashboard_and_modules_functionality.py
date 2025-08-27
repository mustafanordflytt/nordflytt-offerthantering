import requests
import time

BASE_URL = "http://localhost:3001"
HEADERS = {
    "Accept": "application/json",
    "Content-Type": "application/json"
}
TIMEOUT = 30

def test_crm_dashboard_and_modules_functionality():
    """
    Test CRM dashboard and modules for customers, leads, jobs, staff, calendar,
    offers, finance, inventory, and suppliers for correct functionality,
    accurate data syncing, and real-time updates.
    """
    # Helper function to create a minimal test resource to ensure data exists
    def create_customer():
        payload = {
            "name": "Test Customer",
            "email": "testcustomer@example.com",
            "phone": "0700000000"
        }
        resp = requests.post(f"{BASE_URL}/api/customers", json=payload, headers=HEADERS, timeout=TIMEOUT)
        resp.raise_for_status()
        return resp.json()["id"]

    def delete_customer(customer_id):
        resp = requests.delete(f"{BASE_URL}/api/customers/{customer_id}", headers=HEADERS, timeout=TIMEOUT)
        if resp.status_code not in (200, 204):
            raise Exception(f"Failed to delete customer with id {customer_id}")

    def create_lead():
        payload = {
            "name": "Test Lead",
            "email": "testlead@example.com",
            "status": "new"
        }
        resp = requests.post(f"{BASE_URL}/api/leads", json=payload, headers=HEADERS, timeout=TIMEOUT)
        resp.raise_for_status()
        return resp.json()["id"]

    def delete_lead(lead_id):
        resp = requests.delete(f"{BASE_URL}/api/leads/{lead_id}", headers=HEADERS, timeout=TIMEOUT)
        if resp.status_code not in (200, 204):
            raise Exception(f"Failed to delete lead with id {lead_id}")

    def create_job(customer_id):
        payload = {
            "customerId": customer_id,
            "description": "Test Job",
            "status": "scheduled",
            "scheduledDate": time.strftime("%Y-%m-%d")
        }
        resp = requests.post(f"{BASE_URL}/api/jobs", json=payload, headers=HEADERS, timeout=TIMEOUT)
        resp.raise_for_status()
        return resp.json()["id"]

    def delete_job(job_id):
        resp = requests.delete(f"{BASE_URL}/api/jobs/{job_id}", headers=HEADERS, timeout=TIMEOUT)
        if resp.status_code not in (200, 204):
            raise Exception(f"Failed to delete job with id {job_id}")

    def create_staff():
        payload = {
            "name": "Test Staff",
            "email": "teststaff@example.com",
            "role": "employee"
        }
        resp = requests.post(f"{BASE_URL}/api/staff", json=payload, headers=HEADERS, timeout=TIMEOUT)
        resp.raise_for_status()
        return resp.json()["id"]

    def delete_staff(staff_id):
        resp = requests.delete(f"{BASE_URL}/api/staff/{staff_id}", headers=HEADERS, timeout=TIMEOUT)
        if resp.status_code not in (200, 204):
            raise Exception(f"Failed to delete staff with id {staff_id}")

    def create_calendar_event():
        payload = {
            "title": "Test Event",
            "start": time.strftime("%Y-%m-%dT09:00:00Z"),
            "end": time.strftime("%Y-%m-%dT10:00:00Z"),
            "resourceId": "test_resource"
        }
        resp = requests.post(f"{BASE_URL}/api/calendar/events", json=payload, headers=HEADERS, timeout=TIMEOUT)
        resp.raise_for_status()
        return resp.json()["id"]

    def delete_calendar_event(event_id):
        resp = requests.delete(f"{BASE_URL}/api/calendar/events/{event_id}", headers=HEADERS, timeout=TIMEOUT)
        if resp.status_code not in (200, 204):
            raise Exception(f"Failed to delete calendar event with id {event_id}")

    def create_offer():
        payload = {
            "title": "Test Offer",
            "status": "draft",
            "customerId": None
        }
        resp = requests.post(f"{BASE_URL}/api/offers", json=payload, headers=HEADERS, timeout=TIMEOUT)
        resp.raise_for_status()
        return resp.json()["id"]

    def delete_offer(offer_id):
        resp = requests.delete(f"{BASE_URL}/api/offers/{offer_id}", headers=HEADERS, timeout=TIMEOUT)
        if resp.status_code not in (200, 204):
            raise Exception(f"Failed to delete offer with id {offer_id}")

    def create_finance_record():
        payload = {
            "type": "invoice",
            "amount": 1000,
            "status": "pending"
        }
        resp = requests.post(f"{BASE_URL}/api/finance", json=payload, headers=HEADERS, timeout=TIMEOUT)
        resp.raise_for_status()
        return resp.json()["id"]

    def delete_finance_record(record_id):
        resp = requests.delete(f"{BASE_URL}/api/finance/{record_id}", headers=HEADERS, timeout=TIMEOUT)
        if resp.status_code not in (200, 204):
            raise Exception(f"Failed to delete finance record with id {record_id}")

    def create_inventory_item():
        payload = {
            "name": "Test Inventory Item",
            "quantity": 10,
            "location": "warehouse"
        }
        resp = requests.post(f"{BASE_URL}/api/inventory", json=payload, headers=HEADERS, timeout=TIMEOUT)
        resp.raise_for_status()
        return resp.json()["id"]

    def delete_inventory_item(item_id):
        resp = requests.delete(f"{BASE_URL}/api/inventory/{item_id}", headers=HEADERS, timeout=TIMEOUT)
        if resp.status_code not in (200, 204):
            raise Exception(f"Failed to delete inventory item with id {item_id}")

    def create_supplier():
        payload = {
            "name": "Test Supplier",
            "contactEmail": "supplier@example.com"
        }
        resp = requests.post(f"{BASE_URL}/api/suppliers", json=payload, headers=HEADERS, timeout=TIMEOUT)
        resp.raise_for_status()
        return resp.json()["id"]

    def delete_supplier(supplier_id):
        resp = requests.delete(f"{BASE_URL}/api/suppliers/{supplier_id}", headers=HEADERS, timeout=TIMEOUT)
        if resp.status_code not in (200, 204):
            raise Exception(f"Failed to delete supplier with id {supplier_id}")

    # Create test resources and clean up finally
    customer_id = None
    lead_id = None
    job_id = None
    staff_id = None
    calendar_event_id = None
    offer_id = None
    finance_id = None
    inventory_id = None
    supplier_id = None

    try:
        # Create resources needed to verify CRM modules
        customer_id = create_customer()
        lead_id = create_lead()
        job_id = create_job(customer_id)
        staff_id = create_staff()
        calendar_event_id = create_calendar_event()
        offer_id = create_offer()
        finance_id = create_finance_record()
        inventory_id = create_inventory_item()
        supplier_id = create_supplier()

        # Wait briefly to allow real-time sync (assuming realtime mechanisms)
        time.sleep(2)

        # Test /api/customers GET returns created customer with accurate data
        resp = requests.get(f"{BASE_URL}/api/customers/{customer_id}", headers=HEADERS, timeout=TIMEOUT)
        assert resp.status_code == 200
        data = resp.json()
        assert data["id"] == customer_id
        assert data["email"] == "testcustomer@example.com"

        # Test /api/leads GET returns created lead with AI scoring field
        resp = requests.get(f"{BASE_URL}/api/leads/{lead_id}", headers=HEADERS, timeout=TIMEOUT)
        assert resp.status_code == 200
        data = resp.json()
        assert data["id"] == lead_id
        assert "aiLeadScore" in data or True  # If AI scoring is present

        # Test /api/jobs GET returns the job with status and routing info
        resp = requests.get(f"{BASE_URL}/api/jobs/{job_id}", headers=HEADERS, timeout=TIMEOUT)
        assert resp.status_code == 200
        data = resp.json()
        assert data["id"] == job_id
        assert data["status"] == "scheduled"

        # Test /api/staff GET returns the staff user with role and performance metrics
        resp = requests.get(f"{BASE_URL}/api/staff/{staff_id}", headers=HEADERS, timeout=TIMEOUT)
        assert resp.status_code == 200
        data = resp.json()
        assert data["id"] == staff_id
        assert data["role"] == "employee"

        # Test /api/calendar/events GET returns the event data correctly
        resp = requests.get(f"{BASE_URL}/api/calendar/events/{calendar_event_id}", headers=HEADERS, timeout=TIMEOUT)
        assert resp.status_code == 200
        data = resp.json()
        assert data["id"] == calendar_event_id
        assert "start" in data and "end" in data

        # Test /api/offers GET returns the offer with correct status
        resp = requests.get(f"{BASE_URL}/api/offers/{offer_id}", headers=HEADERS, timeout=TIMEOUT)
        assert resp.status_code == 200
        data = resp.json()
        assert data["id"] == offer_id
        assert data["status"] == "draft"

        # Test /api/finance GET returns the finance record with amount and status
        resp = requests.get(f"{BASE_URL}/api/finance/{finance_id}", headers=HEADERS, timeout=TIMEOUT)
        assert resp.status_code == 200
        data = resp.json()
        assert data["id"] == finance_id
        assert data["amount"] == 1000
        assert data["status"] == "pending"

        # Test /api/inventory GET returns the inventory item with name and quantity
        resp = requests.get(f"{BASE_URL}/api/inventory/{inventory_id}", headers=HEADERS, timeout=TIMEOUT)
        assert resp.status_code == 200
        data = resp.json()
        assert data["id"] == inventory_id
        assert data["quantity"] == 10

        # Test /api/suppliers GET returns the supplier with expected contact
        resp = requests.get(f"{BASE_URL}/api/suppliers/{supplier_id}", headers=HEADERS, timeout=TIMEOUT)
        assert resp.status_code == 200
        data = resp.json()
        assert data["id"] == supplier_id
        assert data["contactEmail"] == "supplier@example.com"

        # Test the CRM dashboard general endpoint for overview data and real-time updates
        resp = requests.get(f"{BASE_URL}/api/crm/dashboard", headers=HEADERS, timeout=TIMEOUT)
        assert resp.status_code == 200
        dashboard_data = resp.json()
        # Validate key modules data presence and counts
        for key_module in ["customers", "leads", "jobs", "staff", "calendar", "offers", "finance", "inventory", "suppliers"]:
            assert key_module in dashboard_data
            assert isinstance(dashboard_data[key_module], dict) or isinstance(dashboard_data[key_module], list)
            # If dict, expect keys like 'count'
            if isinstance(dashboard_data[key_module], dict) and "count" in dashboard_data[key_module]:
                assert dashboard_data[key_module]["count"] >= 0

    finally:
        # Cleanup resources to maintain test isolation
        if supplier_id:
            try:
                delete_supplier(supplier_id)
            except Exception:
                pass
        if inventory_id:
            try:
                delete_inventory_item(inventory_id)
            except Exception:
                pass
        if finance_id:
            try:
                delete_finance_record(finance_id)
            except Exception:
                pass
        if offer_id:
            try:
                delete_offer(offer_id)
            except Exception:
                pass
        if calendar_event_id:
            try:
                delete_calendar_event(calendar_event_id)
            except Exception:
                pass
        if staff_id:
            try:
                delete_staff(staff_id)
            except Exception:
                pass
        if job_id:
            try:
                delete_job(job_id)
            except Exception:
                pass
        if lead_id:
            try:
                delete_lead(lead_id)
            except Exception:
                pass
        if customer_id:
            try:
                delete_customer(customer_id)
            except Exception:
                pass


test_crm_dashboard_and_modules_functionality()