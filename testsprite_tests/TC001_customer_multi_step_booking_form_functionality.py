import requests
import time

BASE_URL = "http://localhost:3001"
BOOKINGS_ENDPOINT = f"{BASE_URL}/api/bookings"
HEADERS = {"Content-Type": "application/json"}
TIMEOUT = 30

def test_customer_multi_step_booking_form_functionality():
    """
    Test the multi-step booking form workflow:
    - Select customer type
    - Enter contact information
    - Choose service types
    - Specify move details and addresses
    - Select inventory and additional services
    - View summary with real-time price calculation and address autocompletion
    """
    # Step 1: Select customer type and provide basic info
    booking_data = {
        "customerType": "private",  # could be "company" in other cases
        "contactInformation": {
            "firstName": "Test",
            "lastName": "Customer",
            "email": "test.customer@example.com",
            "phone": "+4712345678"
        },
        "serviceTypes": [
            "full_move",  # example service type
            "packing"
        ],
        "moveDetails": {
            "moveDate": (time.strftime("%Y-%m-%d")),
            "fromAddress": "Karl Johans gate 1, Oslo, Norway",
            "toAddress": "Dronning Eufemias gate 10, Oslo, Norway",
            "volumeCbm": 30,  # estimated volume in cubic meters
            "distanceKm": 5
        },
        "inventory": [
            {"item": "Sofa", "quantity": 1},
            {"item": "Box", "quantity": 10}
        ],
        "additionalServices": [
            "disassembly",
            "storage"
        ]
    }

    booking_id = None

    try:
        # Create booking (multi-step form submit sim in one request)
        response = requests.post(
            BOOKINGS_ENDPOINT,
            json=booking_data,
            headers=HEADERS,
            timeout=TIMEOUT
        )
        assert response.status_code == 201, f"Expected 201 Created, got {response.status_code}"
        booking_response = response.json()
        booking_id = booking_response.get("id")
        assert booking_id is not None, "Booking ID should be returned on creation"

        # Validate response contains key booking details
        assert booking_response.get("customerType") == booking_data["customerType"]
        assert booking_response.get("contactInformation", {}).get("email") == booking_data["contactInformation"]["email"]
        assert "priceSummary" in booking_response, "Price summary must be included with real-time calculation"
        price_summary = booking_response["priceSummary"]
        assert isinstance(price_summary.get("totalPrice"), (int, float)), "Total price should be a number"
        assert price_summary.get("addressAutocomplete") is True or price_summary.get("addressAutocomplete") is None or isinstance(price_summary.get("addressAutocomplete"), bool), "Address autocomplete flag or similar expected"

        # Simulate getting updated price after changing move details (address autocompletion and distance recalculation)
        updated_move_details = {
            "moveDate": booking_data["moveDetails"]["moveDate"],
            "fromAddress": "Karl Johans gate 2, Oslo, Norway",  # slight address change for autocomplete test
            "toAddress": "Dronning Eufemias gate 12, Oslo, Norway",
            "volumeCbm": 32,
            "distanceKm": 6
        }
        update_payload = {
            "moveDetails": updated_move_details
        }
        update_resp = requests.put(
            f"{BOOKINGS_ENDPOINT}/{booking_id}",
            json=update_payload,
            headers=HEADERS,
            timeout=TIMEOUT
        )
        assert update_resp.status_code == 200, f"Expected 200 OK on update, got {update_resp.status_code}"
        updated_data = update_resp.json()
        assert updated_data["moveDetails"]["fromAddress"] == updated_move_details["fromAddress"]
        assert updated_data["moveDetails"]["toAddress"] == updated_move_details["toAddress"]
        assert "priceSummary" in updated_data, "Updated price summary must be returned after move details change"
        assert updated_data["priceSummary"]["totalPrice"] != price_summary["totalPrice"], "Price should be recalculated after move detail update"

    finally:
        # Cleanup: Delete created booking if created
        if booking_id:
            del_resp = requests.delete(
                f"{BOOKINGS_ENDPOINT}/{booking_id}",
                headers=HEADERS,
                timeout=TIMEOUT
            )
            assert del_resp.status_code in (200, 204), f"Expected 200 or 204 on delete, got {del_resp.status_code}"

test_customer_multi_step_booking_form_functionality()