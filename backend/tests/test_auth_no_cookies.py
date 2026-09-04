"""Backend auth tests verifying no cookie-based auth (Bearer token only)."""
import os
import pytest
import requests

from dotenv import dotenv_values
_url = os.environ.get('REACT_APP_BACKEND_URL') or dotenv_values('/app/frontend/.env').get('REACT_APP_BACKEND_URL')
if not _url:
    raise RuntimeError('REACT_APP_BACKEND_URL missing')
BASE_URL = _url.rstrip('/')
API = f"{BASE_URL}/api"

ADMIN_EMAIL = "admin@example.com"
ADMIN_PASSWORD = "admin123"


def _app_cookies(resp):
    """Return set-cookie headers likely from the app (not CF/infra)."""
    raw = resp.raw.headers.getlist("set-cookie") if hasattr(resp.raw.headers, "getlist") else resp.headers.get("set-cookie", "").split("\n")
    cf_prefixes = ("__cf", "cf_", "__cflb", "_cf")
    return [c for c in raw if c and not any(c.lower().startswith(p) for p in cf_prefixes)]


class TestAuthNoCookies:
    def test_login_returns_access_token_no_cookies(self):
        r = requests.post(f"{API}/auth/login", json={"email": ADMIN_EMAIL, "password": ADMIN_PASSWORD})
        assert r.status_code == 200, r.text
        data = r.json()
        assert "access_token" in data and isinstance(data["access_token"], str) and len(data["access_token"]) > 10
        app_cookies = _app_cookies(r)
        assert app_cookies == [], f"Unexpected app cookies from login: {app_cookies}"

    def test_register_no_cookies(self):
        import uuid
        suffix = uuid.uuid4().hex[:6]
        payload = {"email": f"TEST_{suffix}@test.com", "password": "test1234", "callsign": f"TST{suffix[:4].upper()}"}
        r = requests.post(f"{API}/auth/register", json=payload)
        # Register may return 200/201 or fail if callsign taken; assert success
        assert r.status_code in (200, 201), r.text
        data = r.json()
        assert "access_token" in data
        app_cookies = _app_cookies(r)
        assert app_cookies == [], f"Unexpected app cookies from register: {app_cookies}"

    def test_me_with_bearer_token(self):
        login = requests.post(f"{API}/auth/login", json={"email": ADMIN_EMAIL, "password": ADMIN_PASSWORD})
        token = login.json()["access_token"]
        r = requests.get(f"{API}/auth/me", headers={"Authorization": f"Bearer {token}"})
        assert r.status_code == 200, r.text
        data = r.json()
        assert data["email"] == ADMIN_EMAIL
        assert data.get("role") == "admin"

    def test_me_without_token_unauthorized(self):
        r = requests.get(f"{API}/auth/me")
        assert r.status_code in (401, 403)

    def test_logout_no_cookies(self):
        login = requests.post(f"{API}/auth/login", json={"email": ADMIN_EMAIL, "password": ADMIN_PASSWORD})
        token = login.json()["access_token"]
        r = requests.post(f"{API}/auth/logout", headers={"Authorization": f"Bearer {token}"})
        assert r.status_code in (200, 204)
        app_cookies = _app_cookies(r)
        assert app_cookies == [], f"Unexpected app cookies from logout: {app_cookies}"

    def test_refresh_uses_bearer(self):
        login = requests.post(f"{API}/auth/login", json={"email": ADMIN_EMAIL, "password": ADMIN_PASSWORD})
        token = login.json()["access_token"]
        r = requests.post(f"{API}/auth/refresh", headers={"Authorization": f"Bearer {token}"})
        # Endpoint may or may not exist; if it exists it must not set cookies
        if r.status_code == 404:
            pytest.skip("No refresh endpoint")
        # After cookie removal, login doesn't return a refresh token — refresh is not usable.
        # Just verify: no set-cookie regardless of outcome.
        app_cookies = _app_cookies(r)
        assert app_cookies == [], f"Unexpected app cookies from refresh: {app_cookies}"
        # Document the design gap
        assert r.status_code in (200, 401), r.text

    def test_cors_preflight_wildcard_no_credentials(self):
        r = requests.options(
            f"{API}/auth/login",
            headers={
                "Origin": "https://qso-pocket.vercel.app",
                "Access-Control-Request-Method": "POST",
                "Access-Control-Request-Headers": "content-type,authorization",
            },
        )
        # Some servers respond 200 or 204
        assert r.status_code in (200, 204), r.text
        allow_origin = r.headers.get("access-control-allow-origin", "")
        allow_creds = r.headers.get("access-control-allow-credentials", "")
        assert allow_origin == "*", f"Expected *, got {allow_origin}"
        assert allow_creds.lower() != "true", f"allow-credentials must not be true, got {allow_creds}"
