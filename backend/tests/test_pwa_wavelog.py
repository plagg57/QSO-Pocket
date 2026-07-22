"""Tests for PWA assets + Wavelog import endpoint."""
import os
import pytest
import requests

BASE_URL = os.environ.get("REACT_APP_BACKEND_URL", "https://radio-memory.preview.emergentagent.com").rstrip("/")


@pytest.fixture(scope="module")
def token():
    r = requests.post(f"{BASE_URL}/api/auth/login",
                      json={"email": "admin@example.com", "password": "admin123"})
    assert r.status_code == 200, r.text
    data = r.json()
    return data.get("token") or data.get("access_token")


def test_manifest_accessible():
    r = requests.get(f"{BASE_URL}/manifest.json")
    assert r.status_code == 200
    j = r.json()
    assert "QSO Pocket" in j.get("name", "") or "QSO Pocket" == j.get("short_name")
    assert j.get("theme_color") == "#09090b"


def test_sw_accessible():
    r = requests.get(f"{BASE_URL}/sw.js")
    assert r.status_code == 200
    assert "serviceWorker" in r.text or "self.addEventListener" in r.text


def test_wavelog_import_requires_auth():
    r = requests.post(f"{BASE_URL}/api/wavelog/import")
    assert r.status_code in (401, 403)


def test_wavelog_import_400_when_not_configured(token):
    r = requests.post(f"{BASE_URL}/api/wavelog/import",
                      headers={"Authorization": f"Bearer {token}"})
    assert r.status_code == 400
    assert "Wavelog" in r.json().get("detail", "")


def test_admin_login_persist(token):
    r = requests.get(f"{BASE_URL}/api/auth/me",
                     headers={"Authorization": f"Bearer {token}"})
    assert r.status_code == 200
    assert r.json().get("email") == "admin@example.com"
