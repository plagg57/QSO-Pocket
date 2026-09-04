"""Tests for DELETE /api/qso/clear/{logbook} (clear logbook feature)."""
import os
import random
import string

import pytest
import requests
from dotenv import dotenv_values

frontend_env = dotenv_values("/app/frontend/.env")
base_url = os.environ.get("REACT_APP_BACKEND_URL") or frontend_env.get("REACT_APP_BACKEND_URL")
if not base_url:
    raise RuntimeError("REACT_APP_BACKEND_URL missing")
BASE_URL = base_url.rstrip("/")
API = f"{BASE_URL}/api"


def rand(n=4):
    return "".join(random.choice(string.ascii_uppercase) for _ in range(n))


@pytest.fixture(scope="module")
def client():
    s = requests.Session()
    s.headers.update({"Content-Type": "application/json"})
    return s


@pytest.fixture(scope="module")
def user_token(client):
    """Register a dedicated throwaway user so we never wipe admin data."""
    suffix = rand(5).lower()
    payload = {
        "email": f"test_clear_{suffix}@test.com",
        "password": "test1234",
        "callsign": f"F4{rand(3)}",
    }
    r = client.post(f"{API}/auth/register", json=payload)
    assert r.status_code in (200, 201), r.text
    data = r.json()
    token = data.get("access_token") or data.get("token")
    assert token, f"no token in register response: {data}"
    return token


@pytest.fixture(scope="module")
def auth(user_token):
    return {"Authorization": f"Bearer {user_token}", "Content-Type": "application/json"}


def create_qso(client, auth, logbook, callsign=None):
    payload = {
        "callsign": callsign or f"TEST{rand(2)}",
        "date": "2026-01-15",
        "time_utc": "12:30",
        "frequency": 14.250,
        "mode": "SSB",
        "name": "TEST_User",
        "logbook": logbook,
    }
    r = client.post(f"{API}/qso", json=payload, headers=auth)
    assert r.status_code in (200, 201), r.text
    body = r.json()
    assert body["logbook"] == logbook
    assert "_id" not in body
    return body


class TestClearLogbook:
    def test_clear_swl_returns_deleted_count(self, client, auth):
        create_qso(client, auth, "swl")
        create_qso(client, auth, "swl")
        # sanity: 2 QSOs in swl
        stats = client.get(f"{API}/qso/stats/total?logbook=swl", headers=auth).json()
        assert stats["total_qsos"] == 2

        r = client.delete(f"{API}/qso/clear/swl", headers=auth)
        assert r.status_code == 200, r.text
        body = r.json()
        assert body["deleted"] == 2
        assert "message" in body

        # verify persistence of deletion
        stats = client.get(f"{API}/qso/stats/total?logbook=swl", headers=auth).json()
        assert stats["total_qsos"] == 0

    def test_clear_radioamateur(self, client, auth):
        create_qso(client, auth, "radioamateur")
        r = client.delete(f"{API}/qso/clear/radioamateur", headers=auth)
        assert r.status_code == 200, r.text
        assert r.json()["deleted"] == 1
        stats = client.get(f"{API}/qso/stats/total?logbook=radioamateur", headers=auth).json()
        assert stats["total_qsos"] == 0

    def test_clear_does_not_touch_other_logbooks(self, client, auth):
        create_qso(client, auth, "cb")
        create_qso(client, auth, "swl")
        r = client.delete(f"{API}/qso/clear/swl", headers=auth)
        assert r.status_code == 200
        assert r.json()["deleted"] == 1
        cb_stats = client.get(f"{API}/qso/stats/total?logbook=cb", headers=auth).json()
        assert cb_stats["total_qsos"] == 1
        # cleanup
        client.delete(f"{API}/qso/clear/cb", headers=auth)

    def test_clear_empty_logbook_returns_zero(self, client, auth):
        r = client.delete(f"{API}/qso/clear/swl", headers=auth)
        assert r.status_code == 200
        assert r.json()["deleted"] == 0

    def test_clear_invalid_logbook_returns_400(self, client, auth):
        r = client.delete(f"{API}/qso/clear/invalid", headers=auth)
        assert r.status_code == 400, r.text
        assert "detail" in r.json()

    def test_clear_requires_auth(self, client):
        r = client.delete(f"{API}/qso/clear/swl")
        assert r.status_code in (401, 403), r.text


class TestAdminDataIntact:
    """Ensure admin login works and admin logbook still has data for UI testing."""

    def test_admin_login_and_data(self, client):
        r = client.post(f"{API}/auth/login", json={"email": "admin@example.com", "password": "admin123"})
        assert r.status_code == 200, r.text
        data = r.json()
        token = data.get("access_token") or data.get("token")
        assert token
        h = {"Authorization": f"Bearer {token}"}
        stats = client.get(f"{API}/qso/stats/total?logbook=radioamateur", headers=h)
        assert stats.status_code == 200
        assert stats.json()["total_qsos"] >= 0
        grouped = client.get(f"{API}/qso/grouped?logbook=radioamateur", headers=h)
        assert grouped.status_code == 200
        assert isinstance(grouped.json(), list)
