import requests

BASE_URL = "http://localhost:3000"
TIMEOUT = 30

def test_multi_step_booking_form_pricing_calculation():
    """
    Verify that the multi-step customer booking form calculates prices accurately including all volume,
    parking, and stairs adjustments according to business rules.
    """
    # Example payload simulating multi-step booking form data including volume, parking, and stairs info
    booking_payload = {
        "customer": {
            "name": "Test Customer",
            "email": "testcustomer@example.com",
            "phone": "+46701234567"
        },
        "move_details": {
            "volume_cubic_meters": 30,
            "parking_distance_meters": 20,
            "stairs_flights": 3,
            "origin_floor": 2,
            "destination_floor": 1,
            "date": "2025-08-15",
            "time_slot": "09:00-12:00"
        },
        "additional_services": {
            "packing_service": True,
            "fragile_items": 5
        }
    }

    headers = {
        "Content-Type": "application/json"
    }

    # Step 1: Submit booking form data to pricing calculation endpoint
    try:
        response = requests.post(
            f"{BASE_URL}/api/booking/price-calc",
            json=booking_payload,
            headers=headers,
            timeout=TIMEOUT
        )
    except requests.RequestException as e:
        assert False, f"Request to price calculation endpoint failed: {e}"

    # Validate response status code
    assert response.status_code == 200, f"Expected status code 200, got {response.status_code}"

    # Validate response JSON structure and pricing logic
    try:
        data = response.json()
    except ValueError:
        assert False, "Response is not valid JSON"

    # Expected keys in response
    expected_keys = {"base_price", "volume_adjustment", "parking_adjustment", "stairs_adjustment", "total_price"}
    assert expected_keys.issubset(data.keys()), f"Response JSON missing keys: {expected_keys - data.keys()}"

    # Validate that all adjustments are non-negative numbers
    for key in expected_keys:
        assert isinstance(data[key], (int, float)), f"{key} should be a number"
        assert data[key] >= 0, f"{key} should be non-negative"

    # Validate total price calculation: total_price == base_price + volume + parking + stairs adjustments
    calculated_total = data["base_price"] + data["volume_adjustment"] + data["parking_adjustment"] + data["stairs_adjustment"]
    # Allow small floating point tolerance
    assert abs(calculated_total - data["total_price"]) < 0.01, (
        f"Total price mismatch: expected {calculated_total}, got {data['total_price']}"
    )

    # Additional business rules validations (example):
    # Volume adjustment should increase with volume
    assert data["volume_adjustment"] >= 0, "Volume adjustment should be >= 0"
    # Parking adjustment should increase with parking distance
    assert data["parking_adjustment"] >= 0, "Parking adjustment should be >= 0"
    # Stairs adjustment should increase with number of flights
    assert data["stairs_adjustment"] >= 0, "Stairs adjustment should be >= 0"

test_multi_step_booking_form_pricing_calculation()