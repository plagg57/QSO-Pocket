from fastapi import APIRouter, HTTPException, Request
from pydantic import BaseModel, Field
from typing import Optional
from datetime import datetime, timezone, timedelta
import uuid
import secrets
import asyncio
import os
import logging
import resend

from utils.db import db
from utils.auth import (
    hash_password, verify_password, create_access_token,
    get_current_user, get_jwt_secret, JWT_ALGORITHM
)
from utils.helpers import VALID_USER_TYPES, validate_amateur_callsign

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/auth")

# Resend email setup
resend.api_key = os.environ.get("RESEND_API_KEY", "")
SENDER_EMAIL = os.environ.get("SENDER_EMAIL", "onboarding@resend.dev")

# === Models ===
class RegisterRequest(BaseModel):
    email: str
    password: str = Field(..., min_length=6)
    callsign: str = Field("", max_length=20)
    user_type: str = Field("radioamateur")
    no_callsign: bool = False

class LoginRequest(BaseModel):
    email: str
    password: str

class ForgotPasswordRequest(BaseModel):
    email: str
    frontend_origin: Optional[str] = None

class ResetPasswordRequest(BaseModel):
    token: str
    password: str = Field(..., min_length=6)

class ChangePasswordRequest(BaseModel):
    current_password: str
    new_password: str = Field(..., min_length=6)

class ChangeEmailRequest(BaseModel):
    new_email: str
    password: str

class UpdateCallsignsRequest(BaseModel):
    radioamateur: Optional[str] = None
    cb: Optional[str] = None
    swl: Optional[str] = None

# === Endpoints ===
@router.post("/register")
async def register(data: RegisterRequest):
    email = data.email.lower().strip()
    user_type = data.user_type.lower().strip()
    if user_type not in VALID_USER_TYPES:
        raise HTTPException(status_code=400, detail="Type invalide. Choisir: radioamateur, cibiste, swl")

    if user_type == "swl" and data.no_callsign:
        import random
        while True:
            temp_id = f"SWL-FR-{random.randint(1000, 9999)}"
            if not await db.users.find_one({"callsign": temp_id}):
                break
        callsign = temp_id
    else:
        callsign = data.callsign.upper().strip()
        if len(callsign) < 2:
            raise HTTPException(status_code=400, detail="Indicatif requis (min. 2 caracteres)")
        if user_type == "radioamateur" and not validate_amateur_callsign(callsign):
            raise HTTPException(status_code=400, detail="Format d'indicatif radioamateur invalide. Format attendu : 1-2 lettres + 1 chiffre + 1-4 lettres (ex: F4MVD, VE3XYZ, 9A1A)")

    existing_email = await db.users.find_one({"email": email})
    if existing_email:
        raise HTTPException(status_code=400, detail="Cet email est deja utilise")

    existing_callsign = await db.users.find_one({"$or": [
        {"callsign": callsign},
        {"callsigns.radioamateur": callsign},
        {"callsigns.cb": callsign},
        {"callsigns.swl": callsign}
    ]})
    if existing_callsign:
        raise HTTPException(status_code=400, detail="Cet indicatif est deja utilise")

    user_id = str(uuid.uuid4())
    callsigns = {"radioamateur": "", "cb": "", "swl": ""}
    if user_type == "radioamateur":
        callsigns["radioamateur"] = callsign
    elif user_type == "cibiste":
        callsigns["cb"] = callsign
    elif user_type == "swl":
        callsigns["swl"] = callsign

    user_doc = {
        "id": user_id,
        "email": email,
        "password_hash": hash_password(data.password),
        "callsign": callsign,
        "callsigns": callsigns,
        "user_type": user_type,
        "role": "user",
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    await db.users.insert_one(user_doc)
    access_token = create_access_token(user_id, email)

    return {
        "id": user_id, "email": email, "callsign": callsign,
        "role": "user", "user_type": user_type, "callsigns": callsigns,
        "access_token": access_token
    }

@router.post("/login")
async def login(data: LoginRequest, request: Request):
    identifier = data.email.strip()
    if "@" in identifier:
        user = await db.users.find_one({"email": identifier.lower()})
    else:
        upper_id = identifier.upper()
        user = await db.users.find_one({"$or": [
            {"callsign": upper_id},
            {"callsigns.radioamateur": upper_id},
            {"callsigns.cb": upper_id},
            {"callsigns.swl": upper_id}
        ]})

    ip = request.client.host if request.client else "unknown"
    bf_key = f"{ip}:{identifier.lower()}"
    attempt = await db.login_attempts.find_one({"identifier": bf_key}, {"_id": 0})
    if attempt and attempt.get("count", 0) >= 5:
        lockout_until = attempt.get("lockout_until", "")
        if lockout_until and datetime.fromisoformat(lockout_until) > datetime.now(timezone.utc):
            raise HTTPException(status_code=429, detail="Trop de tentatives. Reessayez dans 15 minutes.")
        else:
            await db.login_attempts.delete_one({"identifier": bf_key})

    if not user or not verify_password(data.password, user["password_hash"]):
        if attempt:
            new_count = attempt.get("count", 0) + 1
            update = {"$set": {"count": new_count}}
            if new_count >= 5:
                update["$set"]["lockout_until"] = (datetime.now(timezone.utc) + timedelta(minutes=15)).isoformat()
            await db.login_attempts.update_one({"identifier": bf_key}, update)
        else:
            await db.login_attempts.insert_one({"identifier": bf_key, "count": 1})
        raise HTTPException(status_code=401, detail="Identifiant ou mot de passe incorrect")

    await db.login_attempts.delete_one({"identifier": bf_key})
    access_token = create_access_token(user["id"], user["email"])

    return {
        "id": user["id"], "email": user["email"], "callsign": user["callsign"],
        "role": user.get("role", "user"), "user_type": user.get("user_type", "radioamateur"),
        "callsigns": user.get("callsigns", {"radioamateur": user["callsign"], "cb": "", "swl": ""}),
        "access_token": access_token
    }

@router.post("/logout")
async def logout():
    return {"message": "Deconnexion reussie"}

@router.get("/me")
async def get_me(request: Request):
    user = await get_current_user(request)
    return user

@router.post("/forgot-password")
async def forgot_password(data: ForgotPasswordRequest, request: Request):
    identifier = data.email.strip()
    if "@" in identifier:
        user = await db.users.find_one({"email": identifier.lower()})
    else:
        user = await db.users.find_one({"callsign": identifier.upper()})

    if not user:
        return {"message": "Si ce compte existe, un email de reinitialisation a ete envoye.", "email_sent": False}

    token = secrets.token_urlsafe(32)
    await db.password_reset_tokens.insert_one({
        "token": token,
        "user_id": user["id"],
        "expires_at": datetime.now(timezone.utc) + timedelta(hours=1),
        "used": False
    })

    frontend_url = ""
    if hasattr(data, "frontend_origin") and data.frontend_origin:
        frontend_url = data.frontend_origin.rstrip("/")
    if not frontend_url:
        frontend_url = os.environ.get("REACT_APP_FRONTEND_URL", "").rstrip("/")
    if not frontend_url:
        origin = request.headers.get("origin", "")
        if origin:
            frontend_url = origin.rstrip("/")

    reset_link = f"{frontend_url}/reset-password?token={token}" if frontend_url else f"/reset-password?token={token}"
    logger.info(f"Password reset link for {user['email']}: {reset_link}")

    callsign = user.get("callsign", "OM")
    user_email = user.get("email", "")

    email_sent = False
    if resend.api_key and user_email:
        try:
            html_content = f"""
            <div style="font-family: 'Courier New', monospace; background: #09090b; color: #fafafa; padding: 32px; max-width: 500px; margin: 0 auto;">
                <div style="text-align: center; margin-bottom: 24px;">
                    <h1 style="color: #f59e0b; font-size: 24px; margin: 0;">QSO POCKET</h1>
                    <p style="color: #71717a; font-size: 12px; text-transform: uppercase; letter-spacing: 2px;">Password Reset</p>
                </div>
                <p style="color: #a1a1aa; font-size: 14px;">Hello <strong style="color: #f59e0b;">{callsign}</strong>,</p>
                <p style="color: #a1a1aa; font-size: 14px;">A password reset was requested for your account. Click the button below to set a new password:</p>
                <div style="text-align: center; margin: 24px 0;">
                    <a href="{reset_link}" style="display: inline-block; background: #f59e0b; color: #000; padding: 12px 32px; text-decoration: none; font-weight: bold; text-transform: uppercase; letter-spacing: 1px; font-size: 14px;">Reset Password</a>
                </div>
                <p style="color: #52525b; font-size: 12px;">This link expires in 1 hour. If you didn't request this, ignore this email.</p>
                <hr style="border: 1px solid #27272a; margin: 24px 0;" />
                <p style="color: #3f3f46; font-size: 11px; text-align: center;">73 — QSO Pocket</p>
            </div>
            """
            params = {
                "from": SENDER_EMAIL,
                "to": [user_email],
                "subject": f"QSO Pocket — Password Reset for {callsign}",
                "html": html_content
            }
            await asyncio.to_thread(resend.Emails.send, params)
            email_sent = True
            logger.info(f"Password reset email sent to {user_email}")
        except Exception as e:
            logger.error(f"Failed to send reset email: {str(e)}")
            email_sent = False

    if email_sent:
        return {
            "message": f"Email de reinitialisation envoye a {user_email}",
            "email_sent": True,
            "callsign": callsign
        }
    else:
        return {
            "message": "Lien de reinitialisation genere",
            "reset_link": reset_link,
            "email_sent": False,
            "callsign": callsign
        }

@router.post("/reset-password")
async def reset_password(data: ResetPasswordRequest):
    token_doc = await db.password_reset_tokens.find_one({"token": data.token, "used": False}, {"_id": 0})
    if not token_doc:
        raise HTTPException(status_code=400, detail="Lien invalide ou deja utilise")

    expires_at = token_doc["expires_at"]
    if isinstance(expires_at, str):
        expires_at = datetime.fromisoformat(expires_at)
    if expires_at.tzinfo is None:
        expires_at = expires_at.replace(tzinfo=timezone.utc)
    if expires_at < datetime.now(timezone.utc):
        raise HTTPException(status_code=400, detail="Lien expire. Veuillez en demander un nouveau.")

    user = await db.users.find_one({"id": token_doc["user_id"]})
    if not user:
        raise HTTPException(status_code=400, detail="Utilisateur non trouve")

    await db.users.update_one({"id": token_doc["user_id"]}, {"$set": {"password_hash": hash_password(data.password)}})
    await db.password_reset_tokens.update_one({"token": data.token}, {"$set": {"used": True}})
    return {"message": "Mot de passe reinitialise avec succes"}

@router.put("/change-password")
async def change_password(data: ChangePasswordRequest, request: Request):
    user_info = await get_current_user(request)
    user = await db.users.find_one({"id": user_info["id"]})
    if not verify_password(data.current_password, user["password_hash"]):
        raise HTTPException(status_code=400, detail="Mot de passe actuel incorrect")
    await db.users.update_one({"id": user_info["id"]}, {"$set": {"password_hash": hash_password(data.new_password)}})
    return {"message": "Mot de passe modifie avec succes"}

@router.put("/change-email")
async def change_email(data: ChangeEmailRequest, request: Request):
    user_info = await get_current_user(request)
    user = await db.users.find_one({"id": user_info["id"]})
    if not verify_password(data.password, user["password_hash"]):
        raise HTTPException(status_code=400, detail="Mot de passe incorrect")
    new_email = data.new_email.lower().strip()
    existing = await db.users.find_one({"email": new_email})
    if existing and existing["id"] != user_info["id"]:
        raise HTTPException(status_code=400, detail="Cet email est deja utilise")
    await db.users.update_one({"id": user_info["id"]}, {"$set": {"email": new_email}})
    return {"message": "Email modifie avec succes", "email": new_email}

@router.put("/callsigns")
async def update_callsigns(data: UpdateCallsignsRequest, request: Request):
    user = await get_current_user(request)
    updates = {}
    for field in ["radioamateur", "cb", "swl"]:
        val = getattr(data, field, None)
        if val is not None:
            val = val.upper().strip()
            if val:
                if field == "radioamateur" and not validate_amateur_callsign(val):
                    raise HTTPException(status_code=400, detail="Format d'indicatif radioamateur invalide. Format attendu : 1-2 lettres + 1 chiffre + 1-4 lettres (ex: F4MVD, VE3XYZ)")
                existing = await db.users.find_one({"$or": [
                    {"callsign": val},
                    {f"callsigns.{field}": val}
                ], "id": {"$ne": user["id"]}})
                if existing:
                    raise HTTPException(status_code=400, detail=f"L'indicatif {val} est deja utilise")
            updates[f"callsigns.{field}"] = val
    if not updates:
        raise HTTPException(status_code=400, detail="Aucun indicatif a modifier")
    await db.users.update_one({"id": user["id"]}, {"$set": updates})
    updated_user = await db.users.find_one({"id": user["id"]})
    callsigns = updated_user.get("callsigns", {})
    primary = callsigns.get("radioamateur") or callsigns.get("cb") or callsigns.get("swl") or updated_user["callsign"]
    if primary != updated_user["callsign"]:
        await db.users.update_one({"id": user["id"]}, {"$set": {"callsign": primary}})
    return {"message": "Indicatifs mis a jour", "callsigns": callsigns}
