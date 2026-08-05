"""Backend regression tests after modular refactor (iteration 17)."""
import os
import time
import requests
import pytest

BASE = os.environ["REACT_APP_BACKEND_URL"].rstrip("/") + "/api"
ADMIN_EMAIL = "admin@example.com"
ADMIN_PASSWORD = "admin123"


@pytest.fixture(scope="module")
def admin_token():
    r = requests.post(f"{BASE}/auth/login", json={"email": ADMIN_EMAIL, "password": ADMIN_PASSWORD}, timeout=15)
    assert r.status_code == 200, r.text
    data = r.json()
    tok = data.get("access_token") or data.get("token")
    assert tok, f"No token in login response: {data}"
    return tok


@pytest.fixture(scope="module")
def admin_headers(admin_token):
    return {"Authorization": f"Bearer {admin_token}"}


def test_root():
    r = requests.get(f"{BASE}/", timeout=10)
    assert r.status_code == 200


def test_login_ok(admin_token):
    assert admin_token


def test_auth_me(admin_headers):
    r = requests.get(f"{BASE}/auth/me", headers=admin_headers, timeout=10)
    assert r.status_code == 200, r.text
    d = r.json()
    assert d.get("email") == ADMIN_EMAIL
    assert d.get("role") == "admin"


def test_register_new_user():
    import random, string
    unique = f"test_{int(time.time())}"
    suffix = "".join(random.choices(string.ascii_uppercase, k=3))
    payload = {
        "email": f"TEST_{unique}@test.com",
        "password": "test1234",
        "callsign": f"F4{suffix}",
    }
    r = requests.post(f"{BASE}/auth/register", json=payload, timeout=15)
    assert r.status_code in (200, 201), f"{r.status_code}: {r.text}"


@pytest.mark.parametrize("logbook", ["radioamateur", "cb", "swl"])
def test_qso_list_by_logbook(admin_headers, logbook):
    r = requests.get(f"{BASE}/qso?logbook={logbook}", headers=admin_headers, timeout=10)
    assert r.status_code == 200, r.text
    data = r.json()
    assert isinstance(data, list)


def test_qso_grouped(admin_headers):
    r = requests.get(f"{BASE}/qso/grouped?logbook=radioamateur", headers=admin_headers, timeout=10)
    assert r.status_code == 200, r.text
    d = r.json()
    assert isinstance(d, list)
    if d:
        assert "callsign" in d[0]
        assert "total_contacts" in d[0]


def test_qso_stats(admin_headers):
    r = requests.get(f"{BASE}/qso/stats/total?logbook=radioamateur", headers=admin_headers, timeout=10)
    assert r.status_code == 200, r.text
    d = r.json()
    assert "total_qsos" in d and "total_callsigns" in d
    assert isinstance(d["total_qsos"], int)


def test_admin_stats(admin_headers):
    r = requests.get(f"{BASE}/admin/stats", headers=admin_headers, timeout=10)
    assert r.status_code == 200, r.text
    d = r.json()
    assert "total_users" in d and "total_qsos" in d


def test_admin_users(admin_headers):
    r = requests.get(f"{BASE}/admin/users", headers=admin_headers, timeout=10)
    assert r.status_code == 200, r.text
    assert isinstance(r.json(), list)


def test_wavelog_config(admin_headers):
    r = requests.get(f"{BASE}/wavelog/config", headers=admin_headers, timeout=10)
    assert r.status_code == 200, r.text


def test_unauthenticated_qso_rejected():
    r = requests.get(f"{BASE}/qso?logbook=radioamateur", timeout=10)
    assert r.status_code in (401, 403)


def test_export_adif(admin_headers):
    r = requests.get(f"{BASE}/qso/export/adif", headers=admin_headers, timeout=15)
    assert r.status_code == 200, r.text
    assert "ADIF" in r.text or "<EOH>" in r.text
