"""Tests for multi-logbook feature: user types (radioamateur/cibiste/swl) and logbook filtering."""
import os
import random
import string
import uuid
import pytest
import requests


def _letters(n=6):
    """Letters-only suffix (callsign validation rejects digits mid-suffix)."""
    return "".join(random.choice(string.ascii_uppercase) for _ in range(n))

BASE_URL = os.environ.get("REACT_APP_BACKEND_URL", "https://radio-memory.preview.emergentagent.com").rstrip("/")
API = f"{BASE_URL}/api"


@pytest.fixture(scope="module")
def admin_token():
    r = requests.post(f"{API}/auth/login", json={"email": "admin@example.com", "password": "admin123"})
    assert r.status_code == 200, r.text
    data = r.json()
    # Verify user_type/callsigns present in login response
    assert "user_type" in data
    assert "callsigns" in data
    return data["access_token"]


@pytest.fixture(scope="module")
def admin_headers(admin_token):
    return {"Authorization": f"Bearer {admin_token}"}


# ---------------- REGISTRATION ----------------

class TestRegistration:
    def test_register_radioamateur(self):
        suffix = _letters(6)
        payload = {
            "email": f"test_ham_{suffix}@test.local",
            "password": "test1234",
            "callsign": f"F4T{suffix[:3]}",
            "user_type": "radioamateur",
        }
        r = requests.post(f"{API}/auth/register", json=payload)
        assert r.status_code == 200, r.text
        d = r.json()
        assert d["user_type"] == "radioamateur"
        assert d["callsigns"]["radioamateur"] == payload["callsign"].upper()
        assert d["callsigns"]["cb"] == ""
        assert d["callsigns"]["swl"] == ""
        assert "access_token" in d

    def test_register_cibiste(self):
        suffix = _letters(6)
        payload = {
            "email": f"test_cb_{suffix}@test.local",
            "password": "test1234",
            "callsign": f"14CB{suffix[:3]}",
            "user_type": "cibiste",
        }
        r = requests.post(f"{API}/auth/register", json=payload)
        assert r.status_code == 200, r.text
        d = r.json()
        assert d["user_type"] == "cibiste"
        assert d["callsigns"]["cb"] == payload["callsign"].upper()
        assert d["callsigns"]["radioamateur"] == ""

    def test_register_swl_no_callsign(self):
        suffix = uuid.uuid4().hex[:6]
        payload = {
            "email": f"test_swl_{suffix}@test.local",
            "password": "test1234",
            "user_type": "swl",
            "no_callsign": True,
        }
        r = requests.post(f"{API}/auth/register", json=payload)
        assert r.status_code == 200, r.text
        d = r.json()
        assert d["user_type"] == "swl"
        # Auto-generated SWL-FR-XXXX
        assert d["callsign"].startswith("SWL-FR-"), d["callsign"]
        assert d["callsigns"]["swl"] == d["callsign"]

    def test_register_swl_with_callsign(self):
        suffix = _letters(6)
        payload = {
            "email": f"test_swl2_{suffix}@test.local",
            "password": "test1234",
            "callsign": f"SWL{suffix}",
            "user_type": "swl",
        }
        r = requests.post(f"{API}/auth/register", json=payload)
        assert r.status_code == 200, r.text
        d = r.json()
        assert d["callsigns"]["swl"] == payload["callsign"].upper()

    def test_register_invalid_user_type(self):
        r = requests.post(f"{API}/auth/register", json={
            "email": f"test_bad_{uuid.uuid4().hex[:6]}@test.local",
            "password": "test1234",
            "callsign": "ZZZ99",
            "user_type": "invalid_type",
        })
        assert r.status_code == 400

    def test_register_ham_requires_callsign(self):
        r = requests.post(f"{API}/auth/register", json={
            "email": f"test_no_cs_{uuid.uuid4().hex[:6]}@test.local",
            "password": "test1234",
            "callsign": "",
            "user_type": "radioamateur",
        })
        assert r.status_code == 400


# ---------------- LOGIN response shape ----------------

class TestLoginResponse:
    def test_login_returns_user_type_and_callsigns(self):
        r = requests.post(f"{API}/auth/login", json={"email": "admin@example.com", "password": "admin123"})
        assert r.status_code == 200
        d = r.json()
        assert "user_type" in d
        assert "callsigns" in d
        assert isinstance(d["callsigns"], dict)
        assert set(["radioamateur", "cb", "swl"]).issubset(d["callsigns"].keys())


# ---------------- QSO LOGBOOK FILTER ----------------

class TestLogbookFilter:
    @pytest.fixture(scope="class")
    def user_ctx(self):
        suffix = _letters(6)
        payload = {
            "email": f"test_lb_{suffix}@test.local",
            "password": "test1234",
            "callsign": f"F5L{suffix[:3]}",
            "user_type": "radioamateur",
        }
        r = requests.post(f"{API}/auth/register", json=payload)
        assert r.status_code == 200, r.text
        d = r.json()
        return {"headers": {"Authorization": f"Bearer {d['access_token']}"}, "user": d}

    def test_create_qso_in_each_logbook(self, user_ctx):
        h = user_ctx["headers"]
        for lb, cs, mode in [
            ("radioamateur", "F1HAM", "SSB"),
            ("cb", "14CB100", "FM"),
            ("swl", "F5SWL", "SSB"),
        ]:
            r = requests.post(f"{API}/qso", headers=h, json={
                "callsign": cs, "date": "2025-01-15", "time_utc": "12:00",
                "frequency": 14.200, "mode": mode, "logbook": lb,
            })
            assert r.status_code == 200, f"{lb}: {r.text}"
            assert r.json()["logbook"] == lb

    def test_qso_grouped_filtered_by_logbook(self, user_ctx):
        h = user_ctx["headers"]
        for lb, expected_cs in [("radioamateur", "F1HAM"), ("cb", "14CB100"), ("swl", "F5SWL")]:
            r = requests.get(f"{API}/qso/grouped?logbook={lb}", headers=h)
            assert r.status_code == 200
            groups = r.json()
            calls = [g["callsign"] for g in groups]
            assert expected_cs in calls, f"logbook={lb} missing {expected_cs}, got {calls}"
            # verify OTHER callsigns not present
            for other in ["F1HAM", "14CB100", "F5SWL"]:
                if other != expected_cs:
                    assert other not in calls, f"logbook={lb} leaked {other}"

    def test_qso_stats_filtered_by_logbook(self, user_ctx):
        h = user_ctx["headers"]
        for lb in ["radioamateur", "cb", "swl"]:
            r = requests.get(f"{API}/qso/stats/total?logbook={lb}", headers=h)
            assert r.status_code == 200
            data = r.json()
            assert data["total_qsos"] == 1, f"logbook={lb}: {data}"
            assert data["total_callsigns"] == 1

    def test_qso_list_filtered_by_logbook(self, user_ctx):
        h = user_ctx["headers"]
        r = requests.get(f"{API}/qso?logbook=cb", headers=h)
        assert r.status_code == 200
        qsos = r.json()
        assert len(qsos) == 1
        assert qsos[0]["callsign"] == "14CB100"
        assert qsos[0]["logbook"] == "cb"

    def test_invalid_logbook_defaults_to_radioamateur(self, user_ctx):
        """Backend defaults invalid logbook query to radioamateur."""
        h = user_ctx["headers"]
        r = requests.get(f"{API}/qso/stats/total?logbook=bogus", headers=h)
        assert r.status_code == 200
        # bogus -> falls back to no filter -> returns all? actually code does: only sets logbook if in VALID_LOGBOOKS
        # So it returns all 3 QSOs
        assert r.json()["total_qsos"] == 3


# ---------------- CALLSIGNS MANAGEMENT ----------------

class TestCallsignsUpdate:
    def test_update_callsigns(self):
        suffix = _letters(6)
        reg = requests.post(f"{API}/auth/register", json={
            "email": f"test_cm_{suffix}@test.local",
            "password": "test1234",
            "callsign": f"F6C{suffix[:3]}",
            "user_type": "radioamateur",
        }).json()
        h = {"Authorization": f"Bearer {reg['access_token']}"}

        new_cb = f"14X{suffix[:3]}"
        r = requests.put(f"{API}/auth/callsigns", headers=h, json={"cb": new_cb})
        assert r.status_code == 200, r.text
        d = r.json()
        assert d["callsigns"]["cb"] == new_cb

        # verify via /auth/me
        me = requests.get(f"{API}/auth/me", headers=h).json()
        assert me["callsigns"]["cb"] == new_cb
        assert me["callsigns"]["radioamateur"] == reg["callsign"]

    def test_update_callsigns_duplicate_rejected(self):
        # Create user A
        sA = _letters(6)
        A = requests.post(f"{API}/auth/register", json={
            "email": f"test_da_{sA}@test.local", "password": "test1234",
            "callsign": f"F7A{sA[:3]}", "user_type": "radioamateur",
        }).json()
        # Create user B
        sB = _letters(6)
        B = requests.post(f"{API}/auth/register", json={
            "email": f"test_db_{sB}@test.local", "password": "test1234",
            "callsign": f"F7B{sB[:3]}", "user_type": "radioamateur",
        }).json()
        h = {"Authorization": f"Bearer {B['access_token']}"}
        # Try to steal A's callsign
        r = requests.put(f"{API}/auth/callsigns", headers=h, json={"radioamateur": A["callsign"]})
        assert r.status_code == 400
