"""Tests for ITU amateur radio callsign validation on register + callsigns update."""
import os
import time
import requests
import pytest

BASE_URL = os.environ.get("REACT_APP_BACKEND_URL", "").rstrip("/")
if not BASE_URL:
    # Fallback to frontend .env
    with open("/app/frontend/.env") as f:
        for line in f:
            if line.startswith("REACT_APP_BACKEND_URL="):
                BASE_URL = line.split("=", 1)[1].strip().rstrip("/")

API = f"{BASE_URL}/api"
TS = int(time.time())


def _register(email, callsign, user_type="radioamateur", no_callsign=False, password="test1234"):
    payload = {
        "email": email,
        "password": password,
        "callsign": callsign,
        "user_type": user_type,
        "no_callsign": no_callsign,
    }
    return requests.post(f"{API}/auth/register", json=payload, timeout=15)


# --- Invalid amateur callsigns should be rejected ---

@pytest.mark.parametrize("cs", ["F12FDR", "ABC123", "12345"])
def test_register_invalid_amateur_callsign_rejected(cs):
    r = _register(f"t_{cs.lower()}_{TS}@t.com", cs, "radioamateur")
    assert r.status_code == 400, f"Expected 400 for {cs} got {r.status_code}: {r.text}"
    body = r.json()
    detail = str(body.get("detail", "")).lower()
    assert "format" in detail or "invalid" in detail or "invalide" in detail


# --- Valid amateur callsigns should be accepted ---

@pytest.mark.parametrize("cs", ["F4ABC", "W1AX", "9A1CCC", "VE3ABC", "DL1ZZ"])
def test_register_valid_amateur_callsigns_accepted(cs):
    # Use unique callsign suffix to avoid collision with previous runs
    unique_cs = cs  # rely on test-run uniqueness; if exists, fall back to alt
    r = _register(f"t_{cs.lower()}_{TS}@t.com", unique_cs, "radioamateur")
    if r.status_code == 400 and "déjà" in r.text.lower():
        pytest.skip(f"Callsign {cs} already exists from previous run")
    assert r.status_code == 200, f"Expected 200 for {cs} got {r.status_code}: {r.text}"
    data = r.json()
    assert data.get("callsign") == cs
    assert data.get("user_type") == "radioamateur"


def test_register_fresh_valid_amateur_callsign():
    """Register with a guaranteed-unique valid callsign to confirm regex accepts new callsigns."""
    # Convert TS to letters A-Z (base 26) to make a valid suffix
    n = TS
    letters = ""
    for _ in range(3):
        letters = chr(ord("A") + (n % 26)) + letters
        n //= 26
    cs = f"F4{letters}"  # e.g., F4XYZ - valid French format
    r = _register(f"t_fresh_{TS}@t.com", cs, "radioamateur")
    assert r.status_code == 200, f"Expected 200 for {cs}, got {r.status_code}: {r.text}"
    assert r.json().get("callsign") == cs


# --- CB (cibiste) has no ITU restriction ---

def test_register_cibiste_any_format_accepted():
    cs = f"14FRA{TS % 1000}"
    r = _register(f"t_cb_{TS}@t.com", cs, "cibiste")
    assert r.status_code == 200, r.text
    assert r.json().get("user_type") == "cibiste"


# --- SWL auto-generation ---

def test_register_swl_auto_generation():
    r = _register(f"t_swl_{TS}@t.com", "", "swl", no_callsign=True)
    assert r.status_code == 200, r.text
    data = r.json()
    assert data.get("user_type") == "swl"
    assert data.get("callsign", "").startswith("SWL")


# --- PUT /api/auth/callsigns validation for radioamateur ---

def test_update_callsigns_invalid_amateur_rejected():
    # Register a fresh user first (CB user, so we can then set radioamateur field)
    email = f"t_upd_{TS}@t.com"
    reg = _register(email, f"11ABC{TS % 1000}", "cibiste")
    assert reg.status_code == 200, reg.text
    # Login to get cookie
    login = requests.post(f"{API}/auth/login", json={"email": email, "password": "test1234"}, timeout=15)
    assert login.status_code == 200, login.text
    token = login.json().get("access_token")
    assert token, f"No access_token in login response: {login.text}"
    headers = {"Authorization": f"Bearer {token}"}
    # Attempt to set invalid radioamateur callsign
    r = requests.put(f"{API}/auth/callsigns", json={"radioamateur": "F99ABCDE"}, headers=headers, cookies=login.cookies, timeout=15)
    assert r.status_code == 400, f"Expected 400, got {r.status_code}: {r.text}"
    assert "format" in r.text.lower() or "invalide" in r.text.lower()


# --- Admin login still works ---

def test_admin_login_still_works():
    r = requests.post(f"{API}/auth/login", json={"email": "admin@example.com", "password": "admin123"}, timeout=15)
    assert r.status_code == 200, r.text
    data = r.json()
    assert data.get("callsign") == "F0ADMIN" or data.get("user", {}).get("callsign") == "F0ADMIN"
