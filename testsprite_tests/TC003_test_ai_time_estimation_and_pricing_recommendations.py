import requests

BASE_URL = "http://localhost:3000"
TIMEOUT = 30

def test_ai_time_estimation_and_pricing_recommendations():
    url = f"{BASE_URL}/api/ai/decision-engine/recommendations"
    headers = {
        "Content-Type": "application/json",
        "Accept": "application/json"
    }
    # Example payload simulating a booking/job data for AI decision engine
    payload = {
        "jobDetails": {
            "origin": "Stockholm",
            "destination": "Gothenburg",
            "volume_m3": 25,
            "stairs": True,
            "parkingDistanceMeters": 30,
            "fragileItems": 5,
            "specialHandling": ["piano"],
            "requestedDate": "2025-08-15T09:00:00Z"
        },
        "customerProfile": {
            "customerType": "business",
            "previousJobs": 3
        }
    }

    try:
        response = requests.post(url, json=payload, headers=headers, timeout=TIMEOUT)
    except requests.RequestException as e:
        assert False, f"Request to AI Decision Engine failed: {e}"

    assert response.status_code == 200, f"Expected status 200, got {response.status_code}"

    try:
        data = response.json()
    except ValueError:
        assert False, "Response is not valid JSON"

    # Validate presence of required fields
    assert "timeEstimation" in data, "Missing 'timeEstimation' in response"
    assert "pricingRecommendation" in data, "Missing 'pricingRecommendation' in response"
    assert "confidence" in data, "Missing 'confidence' in response"
    assert "fallbackUsed" in data, "Missing 'fallbackUsed' in response"

    time_estimation = data["timeEstimation"]
    pricing_recommendation = data["pricingRecommendation"]
    confidence = data["confidence"]
    fallback_used = data["fallbackUsed"]

    # Validate types and values
    assert isinstance(time_estimation, (int, float)) and time_estimation > 0, "Invalid timeEstimation value"
    assert isinstance(pricing_recommendation, (int, float)) and pricing_recommendation > 0, "Invalid pricingRecommendation value"
    assert isinstance(confidence, (int, float)) and 0 <= confidence <= 1, "Confidence must be between 0 and 1"
    assert isinstance(fallback_used, bool), "fallbackUsed must be a boolean"

    # Check confidence threshold logic
    # If confidence is low (<0.7), fallbackUsed should be True
    if confidence < 0.7:
        assert fallback_used is True, "Fallback should be used for low confidence"
    else:
        assert fallback_used is False, "Fallback should not be used for high confidence"

test_ai_time_estimation_and_pricing_recommendations()