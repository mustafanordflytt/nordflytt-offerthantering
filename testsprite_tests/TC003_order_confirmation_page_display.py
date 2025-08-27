import requests

BASE_URL = "http://localhost:3001"
TIMEOUT = 30

# Placeholder auth token for testing; replace with valid token as needed
AUTH_TOKEN = "Bearer test-token"

def test_order_confirmation_page_display():
    headers = {
        "Content-Type": "application/json",
        "Authorization": AUTH_TOKEN
    }
    booking_data = {
        "customerType": "private",
        "contactInfo": {
            "email": "test.customer@example.com",
            "phone": "+46701234567",
            "name": "Test Customer"
        },
        "serviceType": "standard_move",
        "moveDetails": {
            "originAddress": "123 Start St, Stockholm",
            "destinationAddress": "789 End Ave, Gothenburg",
            "moveDate": "2025-09-10"
        },
        "inventory": [
            {"item": "sofa", "quantity": 1},
            {"item": "boxes", "quantity": 10}
        ],
        "additionalServices": [
            "packing_service",
            "assembly_service"
        ],
        "extraServices": [],
        "summary": {
            "totalPrice": 0,
            "priceBreakdown": {}
        },
        "pricing": {
            "basePrice": 0,
            "rutDeduction": 0
        }
    }

    booking_id = None

    try:
        # Create a booking to have an order to confirm
        create_resp = requests.post(
            f"{BASE_URL}/api/bookings",
            json=booking_data,
            headers=headers,
            timeout=TIMEOUT,
        )
        assert create_resp.status_code == 201, f"Expected 201, got {create_resp.status_code}"
        booking_response = create_resp.json()
        booking_id = booking_response.get("id")
        assert booking_id is not None, "Booking ID was not returned in creation response"

        # Retrieve order confirmation details
        confirm_resp = requests.get(
            f"{BASE_URL}/api/bookings/{booking_id}/confirmation",
            headers=headers,
            timeout=TIMEOUT,
        )
        assert confirm_resp.status_code == 200, f"Expected 200, got {confirm_resp.status_code}"
        data = confirm_resp.json()

        # Validate presence and structure of order summary
        summary = data.get("orderSummary")
        assert summary is not None, "Order summary missing in confirmation"
        assert isinstance(summary.get("totalPrice"), (int, float)), "Total price should be a number"

        # Validate service details
        service_details = data.get("serviceDetails")
        assert service_details is not None, "Service details missing"
        assert isinstance(service_details.get("serviceType"), str) and service_details.get("serviceType") != "", "Service type missing or empty"

        # Validate timeline presence and format
        timeline = data.get("timeline")
        assert timeline is not None, "Timeline data missing"
        assert isinstance(timeline, list), "Timeline should be a list"
        assert len(timeline) > 0, "Timeline list is empty"

        # Validate additional services selected
        additional_services = data.get("additionalServices")
        assert additional_services is not None, "Additional services missing"
        assert set(additional_services) >= set(["packing_service", "assembly_service"]), "Additional services do not include expected items"

        # Validate customer support chat access info
        support_chat = data.get("customerSupportChat")
        assert support_chat is not None, "Customer support chat info missing"
        assert "chatUrl" in support_chat or "chatAvailable" in support_chat, "Customer support chat keys missing"

    finally:
        if booking_id:
            # Delete created booking to clean up
            requests.delete(
                f"{BASE_URL}/api/bookings/{booking_id}",
                headers=headers,
                timeout=TIMEOUT,
            )

test_order_confirmation_page_display()
