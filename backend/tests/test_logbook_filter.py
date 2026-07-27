"""Tests for logbook_filter backward-compatibility (QSOs w/o 'logbook' field).
Ref: /app/backend/server.py logbook_filter() line ~99
"""
import os
import pytest
import requests

BASE_URL = os.environ.get("REACT_APP_BACKEND_URL", "https://radio-memory.preview.emergentagent.com").rstrip("/")
ADMIN_EMAIL = "admin@example.com"
ADMIN_PASSWORD = "admin123"


@pytest.fixture(scope="module")
def session():
    s = requests.Session()
    r = s.post(f"{BASE_URL}/api/auth/login", json={"email": ADMIN_EMAIL, "password": ADMIN_PASSWORD})
    assert r.status_code == 200, f"login failed: {r.status_code} {r.text}"
    token = r.json().get("access_token")
    assert token, "no access_token in response"
    s.headers.update({"Authorization": f"Bearer {token}"})
    return s


def test_stats_radioamateur_nonzero(session):
    r = session.get(f"{BASE_URL}/api/qso/stats/total?logbook=radioamateur")
    assert r.status_code == 200
    data = r.json()
    print("radioamateur stats:", data)
    total = data.get("total_qsos", data.get("total", data.get("count", 0))) if isinstance(data, dict) else data
    assert total and int(total) > 0, f"expected non-zero radioamateur QSOs, got {data}"


def test_stats_cb_zero(session):
    r = session.get(f"{BASE_URL}/api/qso/stats/total?logbook=cb")
    assert r.status_code == 200
    data = r.json()
    print("cb stats:", data)
    total = data.get("total", data.get("count", 0)) if isinstance(data, dict) else data
    assert int(total) == 0, f"expected zero CB QSOs, got {data}"


def test_stats_swl_zero(session):
    r = session.get(f"{BASE_URL}/api/qso/stats/total?logbook=swl")
    assert r.status_code == 200
    data = r.json()
    total = data.get("total", data.get("count", 0)) if isinstance(data, dict) else data
    assert int(total) == 0, f"expected zero SWL QSOs, got {data}"


def test_grouped_radioamateur_nonempty(session):
    r = session.get(f"{BASE_URL}/api/qso/grouped?logbook=radioamateur")
    assert r.status_code == 200
    data = r.json()
    assert isinstance(data, list) and len(data) > 0, f"expected callsigns, got {data}"
    print(f"radioamateur callsigns count: {len(data)}")


def test_grouped_cb_empty(session):
    r = session.get(f"{BASE_URL}/api/qso/grouped?logbook=cb")
    assert r.status_code == 200
    data = r.json()
    assert isinstance(data, list) and len(data) == 0, f"expected empty CB, got {data}"


def test_grouped_swl_empty(session):
    r = session.get(f"{BASE_URL}/api/qso/grouped?logbook=swl")
    assert r.status_code == 200
    data = r.json()
    assert isinstance(data, list) and len(data) == 0, f"expected empty SWL, got {data}"


def test_qsos_radioamateur_nonempty(session):
    r = session.get(f"{BASE_URL}/api/qso?logbook=radioamateur")
    assert r.status_code == 200
    data = r.json()
    assert isinstance(data, list) and len(data) > 0, f"expected QSOs, got {len(data) if isinstance(data,list) else data}"
    print(f"radioamateur qso count: {len(data)}")


def test_qsos_cb_empty(session):
    r = session.get(f"{BASE_URL}/api/qso?logbook=cb")
    assert r.status_code == 200
    data = r.json()
    assert isinstance(data, list) and len(data) == 0
