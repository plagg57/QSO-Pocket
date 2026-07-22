"""Tests for password reset (Resend integration) and previous auth flows."""
import os
import requests
import pytest

BASE_URL = os.environ.get("REACT_APP_BACKEND_URL", "").rstrip("/")
if not BASE_URL:
    # Fallback: read frontend/.env
    with open("/app/frontend/.env") as f:
        for line in f:
            if line.startswith("REACT_APP_BACKEND_URL"):
                BASE_URL = line.split("=", 1)[1].strip().strip('"').rstrip("/")


@pytest.fixture(scope="module")
def client():
    s = requests.Session()
    s.headers.update({"Content-Type": "application/json"})
    return s


def test_forgot_password_by_email_returns_fallback(client):
    r = client.post(f"{BASE_URL}/api/auth/forgot-password", json={"email": "admin@example.com"})
    assert r.status_code == 200, r.text
    data = r.json()
    assert data["email_sent"] is False
    assert "reset_link" in data and data["reset_link"]
    assert "token=" in data["reset_link"]
    assert data.get("callsign") == "F0ADMIN"


def test_forgot_password_by_callsign(client):
    r = client.post(f"{BASE_URL}/api/auth/forgot-password", json={"email": "F0ADMIN"})
    assert r.status_code == 200
    data = r.json()
    assert "reset_link" in data
    assert "token=" in data["reset_link"]


def test_forgot_password_nonexistent_user_generic_message(client):
    r = client.post(f"{BASE_URL}/api/auth/forgot-password", json={"email": "nobody@nowhere.xyz"})
    assert r.status_code == 200
    data = r.json()
    assert data["email_sent"] is False
    assert "reset_link" not in data  # must not leak
    assert "callsign" not in data
    assert "message" in data


def test_reset_password_flow_and_restore(client):
    # 1. request reset link
    r = client.post(f"{BASE_URL}/api/auth/forgot-password", json={"email": "admin@example.com"})
    reset_link = r.json()["reset_link"]
    token = reset_link.split("token=")[1]

    # 2. reset password to new one
    new_pwd = "temp_pwd_9x"
    r2 = client.post(f"{BASE_URL}/api/auth/reset-password", json={"token": token, "password": new_pwd})
    assert r2.status_code == 200, r2.text

    # 3. token cannot be reused
    r3 = client.post(f"{BASE_URL}/api/auth/reset-password", json={"token": token, "password": "foo123"})
    assert r3.status_code == 400

    # 4. login with new password works
    r4 = client.post(f"{BASE_URL}/api/auth/login", json={"email": "admin@example.com", "password": new_pwd})
    assert r4.status_code == 200, r4.text

    # 5. restore admin password back to admin123 via another reset
    r5 = client.post(f"{BASE_URL}/api/auth/forgot-password", json={"email": "admin@example.com"})
    token2 = r5.json()["reset_link"].split("token=")[1]
    r6 = client.post(f"{BASE_URL}/api/auth/reset-password", json={"token": token2, "password": "admin123"})
    assert r6.status_code == 200

    # 6. Verify final restore
    r7 = client.post(f"{BASE_URL}/api/auth/login", json={"email": "admin@example.com", "password": "admin123"})
    assert r7.status_code == 200


def test_reset_password_invalid_token(client):
    r = client.post(f"{BASE_URL}/api/auth/reset-password", json={"token": "invalid_token_xxx", "password": "abc123"})
    assert r.status_code == 400


def test_login_dashboard_endpoints(client):
    # Login
    r = client.post(f"{BASE_URL}/api/auth/login", json={"email": "admin@example.com", "password": "admin123"})
    assert r.status_code == 200
    token = r.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}

    # /auth/me
    r2 = requests.get(f"{BASE_URL}/api/auth/me", headers=headers)
    assert r2.status_code == 200
    assert r2.json()["email"] == "admin@example.com"

    # QSO endpoints
    r3 = requests.get(f"{BASE_URL}/api/qso", headers=headers)
    assert r3.status_code == 200

    r4 = requests.get(f"{BASE_URL}/api/qso/stats/total", headers=headers)
    assert r4.status_code == 200
    assert "total_qsos" in r4.json()

    # Admin stats
    r5 = requests.get(f"{BASE_URL}/api/admin/stats", headers=headers)
    assert r5.status_code == 200
