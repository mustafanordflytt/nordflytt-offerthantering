import requests
import time

BASE_URL = "http://localhost:3001"
TIMEOUT = 30

def test_pwa_features_and_offline_support():
    # As PWA features involve frontend/browser functionalities (service workers, manifest, push notifications, responsive UI),
    # we test the existence and correctness of related assets and API endpoints that support these features.
    # This test will:
    # 1. Check that the service worker file is served correctly with proper headers.
    # 2. Verify the app manifest is available and has expected fields.
    # 3. Check push notification subscription API endpoint responds as expected.
    # 4. Validate responsive metadata via the homepage headers or API response (limited to API testing).
    
    # 1. Check Service Worker script availability and headers
    sw_url = f"{BASE_URL}/service-worker.js"
    try:
        sw_response = requests.get(sw_url, timeout=TIMEOUT)
        assert sw_response.status_code == 200, f"Service Worker file not found at {sw_url}."
        content_type = sw_response.headers.get("Content-Type", "")
        assert "javascript" in content_type.lower(), f"Unexpected Content-Type for service-worker.js: {content_type}"
    except requests.RequestException as e:
        assert False, f"Request to service worker file failed: {e}"

    # 2. Check Web App Manifest availability and contents
    manifest_url = f"{BASE_URL}/manifest.json"
    try:
        manifest_response = requests.get(manifest_url, timeout=TIMEOUT)
        assert manifest_response.status_code == 200, f"Manifest file not found at {manifest_url}."
        manifest_json = manifest_response.json()
        # Validate essential manifest fields for app-like experience
        required_fields = ["name", "short_name", "start_url", "display", "icons"]
        for field in required_fields:
            assert field in manifest_json, f"Manifest missing required field: {field}"
        # Validate display mode supports app-like experience
        assert manifest_json.get("display") in ["standalone", "fullscreen", "minimal-ui"], (
            f"Manifest display mode is not app-like: {manifest_json.get('display')}"
        )
        # Check icons array is not empty
        icons = manifest_json.get("icons")
        assert isinstance(icons, list) and len(icons) > 0, "Manifest icons array is empty or missing"
    except requests.RequestException as e:
        assert False, f"Request to manifest file failed: {e}"
    except ValueError:
        assert False, "Manifest response is not a valid JSON"

    # 3. Test Push Notifications subscription endpoint (simulate a subscribe request)
    # Assuming an endpoint exists: /api/notifications/subscribe accepting POST
    push_subscribe_url = f"{BASE_URL}/api/notifications/subscribe"
    fake_subscription_payload = {
        "endpoint": "https://fcm.googleapis.com/fcm/send/fake-subscription-id",
        "keys": {
            "p256dh": "fake-p256dh-key",
            "auth": "fake-auth-key"
        }
    }
    headers = {"Content-Type": "application/json"}
    try:
        push_response = requests.post(push_subscribe_url, json=fake_subscription_payload, headers=headers, timeout=TIMEOUT)
        # It's possible push subscription API requires auth or may reject fake payload;
        # accept both 200 (or 201) or 400+ with proper JSON error message as valid server handling.
        assert push_response.status_code in [200, 201, 400, 422], (
            f"Unexpected push subscription API response status: {push_response.status_code}"
        )
        # If JSON response, check structure for clarity
        try:
            data = push_response.json()
            assert isinstance(data, dict), "Push subscription response is not a JSON object"
            # If error, check error message exists; if success, expect confirmation field
            if push_response.status_code in [400, 422]:
                assert "error" in data or "message" in data, "Error response lacks error/message field"
            else:
                assert "success" in data or "subscriptionId" in data or data == {}, "Success response missing expected confirmation"
        except ValueError:
            # Non-JSON responses acceptable if status is 200 or 201
            if push_response.status_code in [200, 201]:
                pass
            else:
                assert False, "Push subscription response is not valid JSON"
    except requests.RequestException as e:
        assert False, f"Request to push subscription endpoint failed: {e}"

    # 4. Check homepage headers for responsive and caching controls that help PWA experience
    home_url = f"{BASE_URL}/"
    try:
        home_resp = requests.get(home_url, timeout=TIMEOUT)
        assert home_resp.status_code == 200, "Homepage not accessible"
        # Check cache-control header presence for offline support caching or service worker fallback
        cache_control = home_resp.headers.get("Cache-Control") or home_resp.headers.get("cache-control")
        assert cache_control is not None, "Homepage missing Cache-Control header for offline caching"
        # Validate viewport meta tag presence by fetching html content
        html_text = home_resp.text
        assert 'name="viewport"' in html_text or "viewport" in html_text.lower(), "Homepage missing viewport meta tag for responsive design"
        # Check for touch optimization meta tags or CSS media queries presence is not possible at API level,
        # but at least confirm the document mentions 'touch' or similar (basic heuristic)
        assert "touch" in html_text.lower() or "mobile" in html_text.lower(), "Homepage seems not touch optimized/responsive"
    except requests.RequestException as e:
        assert False, f"Request to homepage failed: {e}"

test_pwa_features_and_offline_support()