import requests
import time

BASE_URL = "http://localhost:3001"
TIMEOUT = 30
HEADERS = {"Content-Type": "application/json"}


def create_booking():
    booking_payload = {
        "customerType": "individual",
        "contactInformation": {
            "name": "Test User",
            "email": "testuser@example.com",
            "phone": "+46700000000"
        },
        "serviceType": "standard_move",
        "moveDetails": {
            "fromAddress": "Testgatan 1, Stockholm",
            "toAddress": "Exempelvägen 2, Stockholm",
            "moveDate": "2025-09-10"
        },
        "inventory": [
            {"item": "Box", "quantity": 10},
            {"item": "Chair", "quantity": 2}
        ],
        "additionalServices": ["packing", "disassembly"]
    }
    resp = requests.post(f"{BASE_URL}/api/bookings", json=booking_payload, headers=HEADERS, timeout=TIMEOUT)
    resp.raise_for_status()
    return resp.json()


def confirm_booking(booking_id):
    resp = requests.post(f"{BASE_URL}/api/bookings/{booking_id}/confirm", headers=HEADERS, timeout=TIMEOUT)
    resp.raise_for_status()
    return resp.json()


def create_job(booking_id):
    job_payload = {
        "bookingId": booking_id,
        "assignedStaffId": None,
        "status": "pending"
    }
    resp = requests.post(f"{BASE_URL}/api/jobs", json=job_payload, headers=HEADERS, timeout=TIMEOUT)
    resp.raise_for_status()
    return resp.json()


def update_job_status(job_id, status):
    resp = requests.put(f"{BASE_URL}/api/jobs/{job_id}/status", json={"status": status}, headers=HEADERS, timeout=TIMEOUT)
    resp.raise_for_status()
    return resp.json()


def create_payment(booking_id, amount):
    payment_payload = {
        "bookingId": booking_id,
        "amount": amount,
        "paymentMethod": "swish",
        "status": "pending"
    }
    resp = requests.post(f"{BASE_URL}/api/finance/payments", json=payment_payload, headers=HEADERS, timeout=TIMEOUT)
    resp.raise_for_status()
    return resp.json()


def update_payment_status(payment_id, status):
    resp = requests.put(f"{BASE_URL}/api/finance/payments/{payment_id}/status", json={"status": status}, headers=HEADERS, timeout=TIMEOUT)
    resp.raise_for_status()
    return resp.json()


def create_lead(contact_info):
    lead_payload = {
        "name": contact_info["name"],
        "email": contact_info["email"],
        "phone": contact_info["phone"],
        "source": "test_automation"
    }
    resp = requests.post(f"{BASE_URL}/api/leads", json=lead_payload, headers=HEADERS, timeout=TIMEOUT)
    resp.raise_for_status()
    return resp.json()


def update_booking_status(booking_id, status):
    resp = requests.put(f"{BASE_URL}/api/bookings/{booking_id}/status", json={"status": status}, headers=HEADERS, timeout=TIMEOUT)
    resp.raise_for_status()
    return resp.json()


def get_lead(lead_id):
    resp = requests.get(f"{BASE_URL}/api/leads/{lead_id}", headers=HEADERS, timeout=TIMEOUT)
    resp.raise_for_status()
    return resp.json()


def get_invoice_by_booking(booking_id):
    resp = requests.get(f"{BASE_URL}/api/finance/invoices?bookingId={booking_id}", headers=HEADERS, timeout=TIMEOUT)
    resp.raise_for_status()
    return resp.json()


def get_followups_by_lead(lead_id):
    resp = requests.get(f"{BASE_URL}/api/follow_ups?leadId={lead_id}", headers=HEADERS, timeout=TIMEOUT)
    resp.raise_for_status()
    return resp.json()


def delete_booking(booking_id):
    requests.delete(f"{BASE_URL}/api/bookings/{booking_id}", headers=HEADERS, timeout=TIMEOUT)


def delete_job(job_id):
    requests.delete(f"{BASE_URL}/api/jobs/{job_id}", headers=HEADERS, timeout=TIMEOUT)


def delete_payment(payment_id):
    requests.delete(f"{BASE_URL}/api/finance/payments/{payment_id}", headers=HEADERS, timeout=TIMEOUT)


def delete_lead(lead_id):
    requests.delete(f"{BASE_URL}/api/leads/{lead_id}", headers=HEADERS, timeout=TIMEOUT)


def test_automation_workflows_execution():
    booking_id = None
    job_id = None
    payment_id = None
    lead_id = None

    try:
        # Create booking
        booking = create_booking()
        booking_id = booking.get("id")
        assert booking_id is not None

        # Confirm booking triggers booking confirmation workflow including lead assignment etc.
        confirmed = confirm_booking(booking_id)
        assert confirmed.get("status") == "confirmed"

        # Allow some processing time for asynchronous workflows
        time.sleep(3)

        # Check that a lead is created or assigned upon booking confirmation
        resp_leads = requests.get(f"{BASE_URL}/api/leads?bookingId={booking_id}", headers=HEADERS, timeout=TIMEOUT)
        resp_leads.raise_for_status()
        leads = resp_leads.json()
        assert isinstance(leads, list)
        assert len(leads) > 0
        lead_id = leads[0].get("id")
        assert lead_id is not None

        # Create a job linked to the booking to test job completion workflow
        job = create_job(booking_id)
        job_id = job.get("id")
        assert job_id is not None

        # Update job status to completed to trigger job completion automation workflows
        updated_job = update_job_status(job_id, "completed")
        assert updated_job.get("status") == "completed"

        time.sleep(3)

        # Check invoice generation triggered by job completion or booking confirmation
        invoices = get_invoice_by_booking(booking_id)
        assert isinstance(invoices, list)
        assert len(invoices) > 0
        invoice = invoices[0]
        assert invoice.get("status") in ("pending", "paid", "unpaid")

        # Create a payment linked to the booking to test payment received workflow
        payment = create_payment(booking_id, amount=invoice.get("totalAmount", 1000))
        payment_id = payment.get("id")
        assert payment_id is not None

        # Update payment status to 'received' to trigger payment received workflows
        updated_payment = update_payment_status(payment_id, "received")
        assert updated_payment.get("status") == "received"

        time.sleep(3)

        # Check follow-up actions triggered by payment received (e.g. follow-up emails)
        followups = get_followups_by_lead(lead_id)
        assert isinstance(followups, list)
        # Expect at least one follow-up action created
        assert len(followups) > 0

        # Test lead creation and check automation on new lead creation
        new_lead = create_lead({"name": "Automation Lead", "email": "auto_lead@example.com", "phone": "+46701111222"})
        lead_id_new = new_lead.get("id")
        assert lead_id_new is not None

        time.sleep(3)

        # Confirm automation triggered on new lead creation such as assignment or notifications
        lead_fetched = get_lead(lead_id_new)
        assert lead_fetched.get("id") == lead_id_new
        # Check possible assignedStaff or leadScore auto-generated field
        assert "assignedStaffId" in lead_fetched or "leadScore" in lead_fetched

        # Test status change automation on booking
        status_updated = update_booking_status(booking_id, "in_progress")
        assert status_updated.get("status") == "in_progress"

        time.sleep(3)

        # Validate automation effects on status change if any (could be lead re-assignment, notifications etc)
        lead_after_status_change = get_lead(lead_id)
        assert lead_after_status_change is not None

    finally:
        # Cleanup created resources
        if lead_id:
            try:
                delete_lead(lead_id)
            except Exception:
                pass
        if 'lead_id_new' in locals() and lead_id_new:
            try:
                delete_lead(lead_id_new)
            except Exception:
                pass
        if payment_id:
            try:
                delete_payment(payment_id)
            except Exception:
                pass
        if job_id:
            try:
                delete_job(job_id)
            except Exception:
                pass
        if booking_id:
            try:
                delete_booking(booking_id)
            except Exception:
                pass


test_automation_workflows_execution()