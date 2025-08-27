import requests
from requests.exceptions import RequestException, Timeout

BASE_URL = "http://localhost:3000"
TIMEOUT = 30
HEADERS = {
    "Accept": "application/json",
    "Content-Type": "application/json"
}

def test_multi_language_support_and_pwa_capabilities():
    try:
        # 1. Verify core features accessible in Swedish and English with consistent UI/UX
        # Assuming an endpoint /api/features that accepts a language query param and returns core features info
        for lang in ["sv", "en"]:
            resp = requests.get(f"{BASE_URL}/api/features", params={"lang": lang}, headers=HEADERS, timeout=TIMEOUT)
            assert resp.status_code == 200, f"Failed to get features for language {lang}"
            data = resp.json()
            assert "coreFeatures" in data, f"Missing coreFeatures key in response for language {lang}"
            # Check that core features list is not empty and UI/UX consistency keys exist
            core_features = data["coreFeatures"]
            assert isinstance(core_features, list) and len(core_features) > 0, f"No core features returned for {lang}"
            # Check UI/UX consistency keys (e.g. theme, layout)
            assert "uiConsistency" in data, f"Missing uiConsistency info for language {lang}"
            ui_consistency = data["uiConsistency"]
            assert isinstance(ui_consistency, dict), f"uiConsistency should be a dict for language {lang}"
            # Example keys to check for UI/UX consistency
            for key in ["theme", "layout", "responsive"]:
                assert key in ui_consistency, f"Missing UI/UX key '{key}' for language {lang}"

        # 2. Verify PWA supports offline functionality
        # Assuming an endpoint /api/pwa/status that returns PWA capabilities status
        resp = requests.get(f"{BASE_URL}/api/pwa/status", headers=HEADERS, timeout=TIMEOUT)
        assert resp.status_code == 200, "Failed to get PWA status"
        pwa_status = resp.json()
        # Check offline support key
        assert "offlineSupported" in pwa_status, "Missing offlineSupported key in PWA status"
        assert isinstance(pwa_status["offlineSupported"], bool), "offlineSupported should be boolean"
        assert pwa_status["offlineSupported"] is True, "PWA offline support is not enabled"

        # 3. Verify PWA supports push notifications
        assert "pushNotificationsSupported" in pwa_status, "Missing pushNotificationsSupported key in PWA status"
        assert isinstance(pwa_status["pushNotificationsSupported"], bool), "pushNotificationsSupported should be boolean"
        assert pwa_status["pushNotificationsSupported"] is True, "PWA push notifications support is not enabled"

    except (RequestException, Timeout) as e:
        assert False, f"Request failed: {e}"
    except AssertionError as ae:
        raise ae

test_multi_language_support_and_pwa_capabilities()