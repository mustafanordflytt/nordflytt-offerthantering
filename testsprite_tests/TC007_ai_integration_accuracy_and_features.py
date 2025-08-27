import requests
import time

BASE_URL = "http://localhost:3001"
HEADERS = {"Content-Type": "application/json"}
TIMEOUT = 30

def test_ai_integration_accuracy_and_features():
    # Since the PRD does not specify explicit AI API request details,
    # test main AI-related endpoints for expected behavior and accuracy indicators.
    try:
        # 1. Test customer service chatbot AI endpoint
        chatbot_payload = {
            "channel": "web",
            "message": "Hello, I need help with my booking."
        }
        resp = requests.post(f"{BASE_URL}/api/ai/chatbot", json=chatbot_payload, headers=HEADERS, timeout=TIMEOUT)
        assert resp.status_code == 200, f"Chatbot API returned status {resp.status_code}"
        chatbot_response = resp.json()
        assert "reply" in chatbot_response, "Chatbot response missing 'reply'"
        assert isinstance(chatbot_response["reply"], str) and len(chatbot_response["reply"]) > 0, "Chatbot reply invalid"

        # 2. Test AI lead scoring endpoint
        lead_data = {
            "lead": {
                "name": "Test Lead",
                "email": "lead@example.com",
                "source": "website",
                "details": "Interested in moving services"
            }
        }
        resp = requests.post(f"{BASE_URL}/api/ai/lead-scoring", json=lead_data, headers=HEADERS, timeout=TIMEOUT)
        assert resp.status_code == 200, f"Lead scoring API returned status {resp.status_code}"
        lead_scoring = resp.json()
        assert "score" in lead_scoring, "Lead scoring missing 'score'"
        score_value = lead_scoring["score"]
        assert isinstance(score_value, (int, float)) and 0 <= score_value <= 1, "Lead score out of expected range 0-1"

        # 3. Test price optimization endpoint
        price_opt_payload = {
            "job": {
                "service_type": "standard_move",
                "distance_km": 15,
                "volume_m3": 20,
                "additional_services": ["packing"]
            }
        }
        resp = requests.post(f"{BASE_URL}/api/ai/price-optimization", json=price_opt_payload, headers=HEADERS, timeout=TIMEOUT)
        assert resp.status_code == 200, f"Price optimization API returned status {resp.status_code}"
        price_opt = resp.json()
        assert "optimized_price" in price_opt, "Price optimization missing 'optimized_price'"
        assert isinstance(price_opt["optimized_price"], (int, float)) and price_opt["optimized_price"] > 0, "Optimized price invalid"

        # 4. Test route optimization endpoint
        route_opt_payload = {
            "jobs": [
                {"job_id": "job1", "address": "123 Main St", "scheduled_time": "2025-09-01T08:00:00Z"},
                {"job_id": "job2", "address": "456 Oak Ave", "scheduled_time": "2025-09-01T09:00:00Z"},
                {"job_id": "job3", "address": "789 Pine Rd", "scheduled_time": "2025-09-01T10:30:00Z"}
            ],
            "start_location": "Depot Address"
        }
        resp = requests.post(f"{BASE_URL}/api/ai/route-optimization", json=route_opt_payload, headers=HEADERS, timeout=TIMEOUT)
        assert resp.status_code == 200, f"Route optimization API returned status {resp.status_code}"
        route_opt = resp.json()
        assert "optimized_route" in route_opt and isinstance(route_opt["optimized_route"], list), "Route optimization missing or invalid 'optimized_route'"
        assert len(route_opt["optimized_route"]) == len(route_opt_payload["jobs"]), "Optimized route length mismatch"

        # 5. Test demand forecasting endpoint
        demand_forecast_payload = {
            "region": "Stockholm",
            "time_horizon_days": 30
        }
        resp = requests.post(f"{BASE_URL}/api/ai/demand-forecasting", json=demand_forecast_payload, headers=HEADERS, timeout=TIMEOUT)
        assert resp.status_code == 200, f"Demand forecasting API returned status {resp.status_code}"
        demand_forecast = resp.json()
        assert "forecast" in demand_forecast and isinstance(demand_forecast["forecast"], list), "Demand forecasting missing or invalid 'forecast'"
        for entry in demand_forecast["forecast"]:
            assert "date" in entry and "expected_demand" in entry, "Forecast entry missing fields"
            assert isinstance(entry["expected_demand"], (int, float)) and entry["expected_demand"] >= 0, "Expected demand invalid"

        # 6. Test recruitment assistant Lowisa endpoint
        lowisa_payload = {
            "candidate_cv": "Experienced mover with 5 years in logistics and excellent customer service skills."
        }
        resp = requests.post(f"{BASE_URL}/api/ai/recruitment/lowisa", json=lowisa_payload, headers=HEADERS, timeout=TIMEOUT)
        assert resp.status_code == 200, f"Lowisa recruitment AI returned status {resp.status_code}"
        lowisa_resp = resp.json()
        assert "screening_score" in lowisa_resp, "Lowisa response missing 'screening_score'"
        score = lowisa_resp["screening_score"]
        assert isinstance(score, (int, float)) and 0 <= score <= 100, "Screening score out of range 0-100"
        assert "recommendation" in lowisa_resp and isinstance(lowisa_resp["recommendation"], str), "Lowisa missing or invalid recommendation"

    except requests.RequestException as e:
        assert False, f"Request failed: {e}"
    except AssertionError:
        raise
    except Exception as e:
        assert False, f"Unexpected error: {e}"

test_ai_integration_accuracy_and_features()