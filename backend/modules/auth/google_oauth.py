import base64
import hashlib
import hmac
import os
import time
from urllib.parse import urlencode

import requests

GOOGLE_OAUTH_CLIENT_ID = os.getenv("GOOGLE_OAUTH_CLIENT_ID")
GOOGLE_OAUTH_CLIENT_SECRET = os.getenv("GOOGLE_OAUTH_CLIENT_SECRET")
GOOGLE_OAUTH_REDIRECT_URI = os.getenv("GOOGLE_OAUTH_REDIRECT_URI")
GOOGLE_OAUTH_STATE_SECRET = os.getenv("GOOGLE_OAUTH_STATE_SECRET", "")

SCOPES = "openid email https://www.googleapis.com/auth/business.manage"
STATE_MAX_AGE_SECONDS = 600


def _sign(payload: str) -> str:
    return hmac.new(GOOGLE_OAUTH_STATE_SECRET.encode(), payload.encode(), hashlib.sha256).hexdigest()


def build_state(customer_id: int) -> str:
    payload = f"{customer_id}.{int(time.time())}"
    signature = _sign(payload)
    raw = f"{payload}.{signature}"
    return base64.urlsafe_b64encode(raw.encode()).decode()


def verify_state(state: str):
    """Geçerliyse müşteri id'sini, değilse None döner"""
    try:
        raw = base64.urlsafe_b64decode(state.encode()).decode()
        customer_id, timestamp, signature = raw.split(".")
    except Exception:
        return None

    payload = f"{customer_id}.{timestamp}"
    if not hmac.compare_digest(_sign(payload), signature):
        return None
    if time.time() - int(timestamp) > STATE_MAX_AGE_SECONDS:
        return None
    return int(customer_id)


def get_auth_url(state: str) -> str:
    params = {
        "client_id": GOOGLE_OAUTH_CLIENT_ID,
        "redirect_uri": GOOGLE_OAUTH_REDIRECT_URI,
        "response_type": "code",
        "scope": SCOPES,
        "access_type": "offline",
        "prompt": "consent",
        "include_granted_scopes": "true",
        "state": state,
    }
    return f"https://accounts.google.com/o/oauth2/v2/auth?{urlencode(params)}"


def exchange_code_for_tokens(code: str) -> dict:
    response = requests.post("https://oauth2.googleapis.com/token", data={
        "code": code,
        "client_id": GOOGLE_OAUTH_CLIENT_ID,
        "client_secret": GOOGLE_OAUTH_CLIENT_SECRET,
        "redirect_uri": GOOGLE_OAUTH_REDIRECT_URI,
        "grant_type": "authorization_code",
    }, timeout=10)
    response.raise_for_status()
    return response.json()


def get_userinfo(access_token: str) -> dict:
    response = requests.get(
        "https://www.googleapis.com/oauth2/v3/userinfo",
        headers={"Authorization": f"Bearer {access_token}"},
        timeout=10,
    )
    response.raise_for_status()
    return response.json()


def get_business_account(access_token: str):
    """Onay gerektirmeyen Account Management API ile bağlı hesabın id'sini ve adını çeker.
    Erişim yoksa veya hata olursa (None, None) döner, bağlantı akışını bozmaz."""
    try:
        response = requests.get(
            "https://mybusinessaccountmanagement.googleapis.com/v1/accounts",
            headers={"Authorization": f"Bearer {access_token}"},
            timeout=10,
        )
        response.raise_for_status()
        accounts = response.json().get("accounts", [])
        if not accounts:
            return None, None
        return accounts[0].get("name"), accounts[0].get("accountName")
    except Exception:
        return None, None


def get_locations(access_token: str, account_id: str):
    """Bağlı hesabın gerçek işletme konumlarını (Business Information API) çeker.
    Erişim yoksa veya hata olursa boş liste döner."""
    read_mask = "title,phoneNumbers,storefrontAddress,categories,websiteUri,regularHours"
    try:
        response = requests.get(
            f"https://mybusinessbusinessinformation.googleapis.com/v1/{account_id}/locations",
            headers={"Authorization": f"Bearer {access_token}"},
            params={"readMask": read_mask, "pageSize": 5},
            timeout=10,
        )
        response.raise_for_status()
        return response.json().get("locations", [])
    except Exception:
        return []


def refresh_access_token(refresh_token: str):
    """Süresi dolan access_token'ı refresh_token ile yeniler. Başarısız olursa None döner."""
    try:
        response = requests.post("https://oauth2.googleapis.com/token", data={
            "refresh_token": refresh_token,
            "client_id": GOOGLE_OAUTH_CLIENT_ID,
            "client_secret": GOOGLE_OAUTH_CLIENT_SECRET,
            "grant_type": "refresh_token",
        }, timeout=10)
        response.raise_for_status()
        return response.json()
    except Exception:
        return None
