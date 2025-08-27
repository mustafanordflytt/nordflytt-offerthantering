import requests
import time

BASE_URL = "http://localhost:3000"
TIMEOUT = 30
HEADERS = {
    "Content-Type": "application/json",
    # Add authentication headers here if required, e.g.:
    # "Authorization": "Bearer <token>"
}

def test_recruitment_ai_candidate_screening():
    """
    Verify that the recruitment AI completes candidate screening conversations
    with professional Swedish language quality and ML prediction accuracy above 80%.
    """
    # Step 1: Create a candidate screening session (simulate starting a conversation)
    create_session_payload = {
        "language": "sv",  # Swedish language
        "candidate_profile": {
            "name": "Test Kandidat",
            "email": "test.kandidat@example.com",
            "resume": "Erfaren mjukvaruutvecklare med fokus på AI och maskininlärning."
        }
    }

    session_id = None
    try:
        create_resp = requests.post(
            f"{BASE_URL}/api/recruitment/ai/screenings",
            json=create_session_payload,
            headers=HEADERS,
            timeout=TIMEOUT,
        )
        assert create_resp.status_code == 201, f"Expected 201 Created, got {create_resp.status_code}"
        session_data = create_resp.json()
        session_id = session_data.get("id")
        assert session_id, "No session ID returned from creation"

        # Step 2: Simulate conversation exchanges with the AI screening endpoint
        # We'll send a series of candidate answers and receive AI screening responses
        conversation_turns = [
            {"question": "Berätta om din erfarenhet inom AI och maskininlärning.", "answer": "Jag har arbetat 5 år med TensorFlow och AWS SageMaker."},
            {"question": "Hur bedömer du din svenska språkkunskap?", "answer": "Jag talar flytande svenska och har arbetat i svenska företag."},
            {"question": "Kan du beskriva ett projekt där du använde ML för att lösa ett problem?", "answer": "Jag utvecklade en modell för prediktiv analys av kundbeteenden."}
        ]

        for turn in conversation_turns:
            payload = {
                "session_id": session_id,
                "candidate_answer": turn["answer"]
            }
            resp = requests.post(
                f"{BASE_URL}/api/recruitment/ai/screenings/{session_id}/converse",
                json=payload,
                headers=HEADERS,
                timeout=TIMEOUT,
            )
            assert resp.status_code == 200, f"Expected 200 OK on conversation turn, got {resp.status_code}"
            resp_json = resp.json()

            # Validate response contains Swedish language quality indicator and ML prediction score
            swedish_quality = resp_json.get("swedish_language_quality_score")
            ml_accuracy = resp_json.get("ml_prediction_accuracy")
            assert swedish_quality is not None, "Missing swedish_language_quality_score in response"
            assert ml_accuracy is not None, "Missing ml_prediction_accuracy in response"

            # Swedish language quality should be professional (assume threshold 85%)
            assert swedish_quality >= 85, f"Swedish language quality below expected threshold: {swedish_quality}"

            # ML prediction accuracy should be above 80%
            assert ml_accuracy >= 80, f"ML prediction accuracy below expected threshold: {ml_accuracy}"

            # Optional: small delay to simulate realistic conversation pacing
            time.sleep(0.5)

        # Step 3: Complete the screening session and verify final summary
        complete_resp = requests.post(
            f"{BASE_URL}/api/recruitment/ai/screenings/{session_id}/complete",
            headers=HEADERS,
            timeout=TIMEOUT,
        )
        assert complete_resp.status_code == 200, f"Expected 200 OK on screening completion, got {complete_resp.status_code}"
        complete_data = complete_resp.json()

        final_swedish_quality = complete_data.get("final_swedish_language_quality_score")
        final_ml_accuracy = complete_data.get("final_ml_prediction_accuracy")
        screening_passed = complete_data.get("screening_passed")

        assert final_swedish_quality is not None, "Missing final_swedish_language_quality_score in completion response"
        assert final_ml_accuracy is not None, "Missing final_ml_prediction_accuracy in completion response"
        assert screening_passed is not None, "Missing screening_passed flag in completion response"

        assert final_swedish_quality >= 85, f"Final Swedish language quality below expected threshold: {final_swedish_quality}"
        assert final_ml_accuracy >= 80, f"Final ML prediction accuracy below expected threshold: {final_ml_accuracy}"
        assert screening_passed is True, "Screening did not pass as expected"

    finally:
        # Cleanup: delete the created screening session if it exists
        if session_id:
            try:
                del_resp = requests.delete(
                    f"{BASE_URL}/api/recruitment/ai/screenings/{session_id}",
                    headers=HEADERS,
                    timeout=TIMEOUT,
                )
                # Accept 200 or 204 as successful deletion
                assert del_resp.status_code in (200, 204), f"Failed to delete session {session_id}"
            except Exception:
                pass

test_recruitment_ai_candidate_screening()