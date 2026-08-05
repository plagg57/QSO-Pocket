import os
import requests
import pytest

BASE_URL = os.environ.get("REACT_APP_BACKEND_URL", "https://radio-memory.preview.emergentagent.com").rstrip("/")


@pytest.fixture(scope="module")
def auth_session():
    s = requests.Session()
    r = s.post(f"{BASE_URL}/api/auth/login", json={"email": "admin@example.com", "password": "admin123"})
    assert r.status_code == 200, r.text
    token = r.json().get("access_token")
    s.headers.update({"Authorization": f"Bearer {token}"})
    return s


def test_cb_logbook_has_migrated_qso(auth_session):
    r = auth_session.get(f"{BASE_URL}/api/qso/stats/total?logbook=cb")
    assert r.status_code == 200, r.text
    data = r.json()
    print("CB stats:", data)
    total = data.get("total_qsos") if isinstance(data, dict) else data
    assert total >= 1, f"Expected >=1 CB QSO after migration, got {total}"


def test_radioamateur_logbook_count(auth_session):
    r = auth_session.get(f"{BASE_URL}/api/qso/stats/total?logbook=radioamateur")
    assert r.status_code == 200, r.text
    data = r.json()
    print("Ham stats:", data)
    total = data.get("total_qsos") if isinstance(data, dict) else data
    assert total == 10, f"Expected 10 ham QSOs, got {total}"


def test_cb_qso_list_contains_14abc564(auth_session):
    r = auth_session.get(f"{BASE_URL}/api/qso?logbook=cb")
    assert r.status_code == 200, r.text
    data = r.json()
    qsos = data if isinstance(data, list) else data.get("qsos", data.get("items", []))
    callsigns = [q.get("callsign", "").upper() for q in qsos]
    print("CB callsigns:", callsigns)
    assert "14ABC564" in callsigns, f"14ABC564 not in CB logbook: {callsigns}"


def test_ham_qso_list_excludes_14abc564(auth_session):
    r = auth_session.get(f"{BASE_URL}/api/qso?logbook=radioamateur")
    assert r.status_code == 200, r.text
    data = r.json()
    qsos = data if isinstance(data, list) else data.get("qsos", data.get("items", []))
    callsigns = [q.get("callsign", "").upper() for q in qsos]
    print("Ham callsigns:", callsigns)
    assert "14ABC564" not in callsigns, "14ABC564 should not be in radioamateur logbook"
