"""Tests to verify cleaned requirements.txt doesn't break server functionality."""
import os
import re
import pytest
import requests

BASE_URL = os.environ.get("REACT_APP_BACKEND_URL", "").rstrip("/")
if not BASE_URL:
    with open("/app/frontend/.env") as f:
        for line in f:
            if line.startswith("REACT_APP_BACKEND_URL="):
                BASE_URL = line.split("=", 1)[1].strip().rstrip("/")

ADMIN_EMAIL = "admin@example.com"
ADMIN_PASSWORD = "admin123"


@pytest.fixture(scope="module")
def token():
    r = requests.post(f"{BASE_URL}/api/auth/login",
                      json={"email": ADMIN_EMAIL, "password": ADMIN_PASSWORD},
                      timeout=15)
    assert r.status_code == 200, f"login failed: {r.status_code} {r.text}"
    data = r.json()
    assert "access_token" in data
    return data["access_token"]


# --- requirements.txt content sanity ---
def test_requirements_no_unwanted_packages():
    with open("/app/backend/requirements.txt") as f:
        content = f.read().lower()
    forbidden = ["emergentintegrations", "boto3", "botocore",
                 "google-ai", "openai", "litellm", "black", "grpcio"]
    for pkg in forbidden:
        assert pkg not in content, f"Forbidden package present: {pkg}"


def test_requirements_has_essentials():
    with open("/app/backend/requirements.txt") as f:
        pkgs = [l.strip().lower() for l in f if l.strip()]
    joined = "\n".join(pkgs)
    for essential in ["fastapi", "uvicorn", "motor", "pymongo",
                      "python-dotenv", "bcrypt", "pyjwt", "httpx",
                      "resend", "dnspython", "pydantic", "python-multipart"]:
        assert essential in joined, f"Missing essential: {essential}"


# --- Auth flows ---
def test_login_returns_token():
    r = requests.post(f"{BASE_URL}/api/auth/login",
                      json={"email": ADMIN_EMAIL, "password": ADMIN_PASSWORD},
                      timeout=15)
    assert r.status_code == 200
    data = r.json()
    assert "access_token" in data
    assert isinstance(data["access_token"], str) and len(data["access_token"]) > 20


def test_auth_me(token):
    r = requests.get(f"{BASE_URL}/api/auth/me",
                     headers={"Authorization": f"Bearer {token}"}, timeout=15)
    assert r.status_code == 200
    data = r.json()
    assert data.get("email") == ADMIN_EMAIL


def test_qso_grouped(token):
    r = requests.get(f"{BASE_URL}/api/qso/grouped",
                     headers={"Authorization": f"Bearer {token}"}, timeout=15)
    assert r.status_code == 200
    # accept list or object shape
    body = r.json()
    assert body is not None


def test_forgot_password_returns_reset_link():
    # Send Origin header (simulate browser) so backend builds full URL
    r = requests.post(f"{BASE_URL}/api/auth/forgot-password",
                      json={"email": ADMIN_EMAIL},
                      headers={"Origin": BASE_URL}, timeout=15)
    assert r.status_code == 200
    data = r.json()
    assert "reset_link" in data
    link = data["reset_link"]
    assert link.startswith("http"), f"reset link should be full URL: {link}"
    assert "localhost" not in link
    assert "127.0.0.1" not in link
    assert "/reset-password?token=" in link


def test_wavelog_import_imports_work(token):
    # Verifies httpx + resend + endpoint loaded OK.
    # Response may be 400 (not configured), 502 (upstream unreachable), or 504 (timeout).
    # Either case proves imports/serialization function correctly.
    r = requests.post(f"{BASE_URL}/api/wavelog/import",
                      headers={"Authorization": f"Bearer {token}"},
                      json={}, timeout=45)
    assert r.status_code in (400, 502, 504), f"unexpected status {r.status_code}: {r.text[:300]}"


def test_admin_stats(token):
    r = requests.get(f"{BASE_URL}/api/admin/stats",
                     headers={"Authorization": f"Bearer {token}"}, timeout=15)
    assert r.status_code == 200
    data = r.json()
    assert isinstance(data, dict)
