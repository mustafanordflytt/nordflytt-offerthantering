import requests
import time

BASE_URL = "http://localhost:3001"
HEADERS = {
    "Content-Type": "application/json",
    # Add Authorization header if API requires authentication
}


def test_offer_viewer_interactive_features():
    timeout = 30
    offer_id = None
    chat_message_id = None

    # Step 1: Create a sample offer resource to test with (simulate an offer creation)
    offer_payload = {
        "customer_type": "private",
        "customer_id": "test-customer-001",
        "services": [
            {
                "service_type": "standard_moving",
                "quantity": 1,
                "selected": True
            },
            {
                "service_type": "packing_service",
                "quantity": 1,
                "selected": False
            }
        ],
        "price_breakdown": {
            "base_price": 5000,
            "rut_deduction": 1250,
            "taxes": 600,
            "total": 4350
        },
        "timeline": [
            {"step": "Quote sent", "date": "2025-09-01T10:00:00Z"},
            {"step": "Offer expires", "date": "2025-09-08T23:59:59Z"}
        ],
        "status": "pending"
    }

    try:
        # Create offer
        create_resp = requests.post(
            f"{BASE_URL}/api/offers",
            json=offer_payload,
            headers=HEADERS,
            timeout=timeout,
        )
        assert create_resp.status_code == 201, f"Offer creation failed: {create_resp.text}"
        created_offer = create_resp.json()
        assert "id" in created_offer, "Created offer missing 'id'"
        offer_id = created_offer["id"]

        # Step 2: Retrieve offer and verify interactive features presence
        get_resp = requests.get(
            f"{BASE_URL}/api/offers/{offer_id}",
            headers=HEADERS,
            timeout=timeout,
        )
        assert get_resp.status_code == 200, f"Failed to get offer: {get_resp.text}"
        offer = get_resp.json()

        # Verify services field and price breakdown including RUT deduction
        assert "services" in offer and isinstance(offer["services"], list), "Services missing or invalid"
        assert any(s["selected"] for s in offer["services"]), "No selected service found"
        assert "price_breakdown" in offer, "Price breakdown missing"
        price_bd = offer["price_breakdown"]
        assert "rut_deduction" in price_bd, "RUT deduction missing in price breakdown"
        assert price_bd["total"] == price_bd["base_price"] - price_bd["rut_deduction"] + price_bd.get("taxes", 0), \
            "Price total calculation mismatch"

        # Verify timeline visualization info present
        assert "timeline" in offer and isinstance(offer["timeline"], list), "Timeline missing or invalid"
        assert len(offer["timeline"]) > 0, "Timeline is empty"

        # Step 3: Simulate interactive service selection toggle
        # Toggle packing_service selected to True
        updated_services = []
        for svc in offer["services"]:
            if svc["service_type"] == "packing_service":
                updated_services.append({**svc, "selected": True})
            else:
                updated_services.append(svc)
        # Update entire offer with updated services
        patch_payload = {"services": updated_services}
        patch_resp = requests.put(
            f"{BASE_URL}/api/offers/{offer_id}",
            json=patch_payload,
            headers=HEADERS,
            timeout=timeout,
        )
        assert patch_resp.status_code == 200, f"Failed to update services: {patch_resp.text}"
        updated_offer = patch_resp.json()
        assert any(s.get("service_type") == "packing_service" and s.get("selected") for s in updated_offer["services"]), \
            "Service selection update failed"

        # Step 4: Accept the offer
        accept_resp = requests.post(
            f"{BASE_URL}/api/offers/{offer_id}/accept",
            headers=HEADERS,
            timeout=timeout,
        )
        assert accept_resp.status_code == 200, f"Failed to accept offer: {accept_resp.text}"
        accept_data = accept_resp.json()
        assert accept_data.get("status") == "accepted", "Offer not marked accepted"

        # Step 5: Attempt to decline (should error or be forbidden since accepted)
        decline_resp = requests.post(
            f"{BASE_URL}/api/offers/{offer_id}/decline",
            headers=HEADERS,
            timeout=timeout,
        )
        # Assuming system returns 400 or 409 or 403 HTTP error when declining accepted offer
        assert decline_resp.status_code in (400, 403, 409), "Decline should fail after acceptance"

        # Step 6: Make a direct payment
        payment_payload = {
            "offer_id": offer_id,
            "payment_method": "swish",
            "amount": updated_offer["price_breakdown"]["total"],
            "currency": "SEK",
        }
        payment_resp = requests.post(
            f"{BASE_URL}/api/offers/{offer_id}/payments",
            json=payment_payload,
            headers=HEADERS,
            timeout=timeout,
        )
        assert payment_resp.status_code == 201, f"Payment failed: {payment_resp.text}"
        payment_data = payment_resp.json()
        assert payment_data.get("status") == "paid", "Payment status not paid"

        # Step 7: Use chat support - send a chat message
        chat_payload = {
            "offer_id": offer_id,
            "message": "I have a question about my offer.",
            "from_customer": True
        }
        chat_resp = requests.post(
            f"{BASE_URL}/api/offers/{offer_id}/chat",
            json=chat_payload,
            headers=HEADERS,
            timeout=timeout,
        )
        assert chat_resp.status_code == 201, f"Sending chat message failed: {chat_resp.text}"
        chat_message = chat_resp.json()
        assert "id" in chat_message, "Chat message ID missing"
        chat_message_id = chat_message["id"]

        # Retrieve chat messages
        get_chat_resp = requests.get(
            f"{BASE_URL}/api/offers/{offer_id}/chat",
            headers=HEADERS,
            timeout=timeout,
        )
        assert get_chat_resp.status_code == 200, f"Failed to get chat messages: {get_chat_resp.text}"
        chat_history = get_chat_resp.json()
        assert any(msg.get("id") == chat_message_id for msg in chat_history), "Sent chat message not found in history"

    finally:
        # Cleanup: delete created offer and chat message if applicable
        if chat_message_id and offer_id:
            try:
                requests.delete(
                    f"{BASE_URL}/api/offers/{offer_id}/chat/{chat_message_id}",
                    headers=HEADERS,
                    timeout=timeout,
                )
            except Exception:
                pass
        if offer_id:
            try:
                requests.delete(
                    f"{BASE_URL}/api/offers/{offer_id}",
                    headers=HEADERS,
                    timeout=timeout,
                )
            except Exception:
                pass


test_offer_viewer_interactive_features()
