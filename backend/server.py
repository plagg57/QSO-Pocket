from pathlib import Path
from dotenv import load_dotenv
ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

from fastapi import FastAPI, APIRouter, HTTPException, Request, Response, Depends, UploadFile, File
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
from pydantic import BaseModel, Field, ConfigDict
from typing import List, Optional
import uuid
from datetime import datetime, timezone, timedelta
import bcrypt
import jwt
import secrets
import httpx
import asyncio
import resend

# Resend email setup
resend.api_key = os.environ.get("RESEND_API_KEY", "")
SENDER_EMAIL = os.environ.get("SENDER_EMAIL", "onboarding@resend.dev")

# MongoDB connection
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

JWT_ALGORITHM = "HS256"

def get_jwt_secret() -> str:
    return os.environ["JWT_SECRET"]

# Password hashing
def hash_password(password: str) -> str:
    salt = bcrypt.gensalt()
    hashed = bcrypt.hashpw(password.encode("utf-8"), salt)
    return hashed.decode("utf-8")

def verify_password(plain_password: str, hashed_password: str) -> bool:
    return bcrypt.checkpw(plain_password.encode("utf-8"), hashed_password.encode("utf-8"))

# JWT tokens
def create_access_token(user_id: str, email: str) -> str:
    payload = {
        "sub": user_id,
        "email": email,
        "exp": datetime.now(timezone.utc) + timedelta(hours=24),
        "type": "access"
    }
    return jwt.encode(payload, get_jwt_secret(), algorithm=JWT_ALGORITHM)

def create_refresh_token(user_id: str) -> str:
    payload = {
        "sub": user_id,
        "exp": datetime.now(timezone.utc) + timedelta(days=7),
        "type": "refresh"
    }
    return jwt.encode(payload, get_jwt_secret(), algorithm=JWT_ALGORITHM)

# Auth helper
async def get_current_user(request: Request) -> dict:
    auth_header = request.headers.get("Authorization", "")
    token = auth_header[7:] if auth_header.startswith("Bearer ") else None
    if not token:
        raise HTTPException(status_code=401, detail="Not authenticated")
    try:
        payload = jwt.decode(token, get_jwt_secret(), algorithms=[JWT_ALGORITHM])
        if payload.get("type") != "access":
            raise HTTPException(status_code=401, detail="Invalid token type")
        user = await db.users.find_one({"id": payload["sub"]})
        if not user:
            raise HTTPException(status_code=401, detail="User not found")
        return {
            "id": user["id"],
            "email": user["email"],
            "callsign": user["callsign"],
            "name": user.get("name", ""),
            "role": user.get("role", "user"),
            "user_type": user.get("user_type", "radioamateur"),
            "callsigns": user.get("callsigns", {"radioamateur": user["callsign"], "cb": "", "swl": ""})
        }
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="Token expired")
    except jwt.InvalidTokenError:
        raise HTTPException(status_code=401, detail="Invalid token")

# Create the main app
app = FastAPI()
api_router = APIRouter(prefix="/api")

# === Auth Models ===
VALID_USER_TYPES = ["radioamateur", "cibiste", "swl"]
VALID_LOGBOOKS = ["radioamateur", "cb", "swl"]

class RegisterRequest(BaseModel):
    email: str
    password: str = Field(..., min_length=6)
    callsign: str = Field("", max_length=20)
    user_type: str = Field("radioamateur")
    no_callsign: bool = False  # For SWL without callsign

class LoginRequest(BaseModel):
    email: str
    password: str

class UserResponse(BaseModel):
    id: str
    email: str
    callsign: str
    role: str
    user_type: str
    callsigns: dict

# === Auth Endpoints ===
@api_router.post("/auth/register")
async def register(data: RegisterRequest):
    email = data.email.lower().strip()
    user_type = data.user_type.lower().strip()
    if user_type not in VALID_USER_TYPES:
        raise HTTPException(status_code=400, detail="Type invalide. Choisir: radioamateur, cibiste, swl")

    # Handle callsign based on user type
    if user_type == "swl" and data.no_callsign:
        # Generate temporary SWL ID: SWL-FR-XXXX
        import random
        while True:
            temp_id = f"SWL-FR-{random.randint(1000, 9999)}"
            if not await db.users.find_one({"callsign": temp_id}):
                break
        callsign = temp_id
    else:
        callsign = data.callsign.upper().strip()
        if len(callsign) < 2:
            raise HTTPException(status_code=400, detail="Indicatif requis (min. 2 caractères)")

    existing_email = await db.users.find_one({"email": email})
    if existing_email:
        raise HTTPException(status_code=400, detail="Cet email est déjà utilisé")

    # Check callsign uniqueness across all users' callsigns
    existing_callsign = await db.users.find_one({"$or": [
        {"callsign": callsign},
        {"callsigns.radioamateur": callsign},
        {"callsigns.cb": callsign},
        {"callsigns.swl": callsign}
    ]})
    if existing_callsign:
        raise HTTPException(status_code=400, detail="Cet indicatif est déjà utilisé")

    user_id = str(uuid.uuid4())
    # Build callsigns dict with the primary callsign
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
        "callsign": callsign,  # Primary/display callsign
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

@api_router.post("/auth/login")
async def login(data: LoginRequest, request: Request):
    identifier = data.email.strip()
    
    # Detect if login is by email or callsign (search all callsign fields)
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
    
    # Brute force check
    ip = request.client.host if request.client else "unknown"
    bf_key = f"{ip}:{identifier.lower()}"
    attempt = await db.login_attempts.find_one({"identifier": bf_key}, {"_id": 0})
    if attempt and attempt.get("count", 0) >= 5:
        lockout_until = attempt.get("lockout_until", "")
        if lockout_until and datetime.fromisoformat(lockout_until) > datetime.now(timezone.utc):
            raise HTTPException(status_code=429, detail="Trop de tentatives. Réessayez dans 15 minutes.")
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

@api_router.post("/auth/logout")
async def logout():
    return {"message": "Déconnexion réussie"}

@api_router.get("/auth/me")
async def get_me(request: Request):
    user = await get_current_user(request)
    return user

# === Password Reset ===
class ForgotPasswordRequest(BaseModel):
    email: str
    frontend_origin: Optional[str] = None

class ResetPasswordRequest(BaseModel):
    token: str
    password: str = Field(..., min_length=6)

@api_router.post("/auth/forgot-password")
async def forgot_password(data: ForgotPasswordRequest, request: Request):
    identifier = data.email.strip()
    if "@" in identifier:
        user = await db.users.find_one({"email": identifier.lower()})
    else:
        user = await db.users.find_one({"callsign": identifier.upper()})

    if not user:
        return {"message": "Si ce compte existe, un email de réinitialisation a été envoyé.", "email_sent": False}

    token = secrets.token_urlsafe(32)
    await db.password_reset_tokens.insert_one({
        "token": token,
        "user_id": user["id"],
        "expires_at": datetime.now(timezone.utc) + timedelta(hours=1),
        "used": False
    })

    # Build frontend URL: prefer client-supplied origin, then env, then request
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

    # Try sending real email via Resend
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
            "message": f"Email de réinitialisation envoyé à {user_email}",
            "email_sent": True,
            "callsign": callsign
        }
    else:
        # Fallback: return link in response (simulation mode)
        return {
            "message": "Lien de réinitialisation généré",
            "reset_link": reset_link,
            "email_sent": False,
            "callsign": callsign
        }

@api_router.post("/auth/reset-password")
async def reset_password(data: ResetPasswordRequest):
    token_doc = await db.password_reset_tokens.find_one({"token": data.token, "used": False}, {"_id": 0})
    if not token_doc:
        raise HTTPException(status_code=400, detail="Lien invalide ou déjà utilisé")

    expires_at = token_doc["expires_at"]
    if isinstance(expires_at, str):
        expires_at = datetime.fromisoformat(expires_at)
    if expires_at.tzinfo is None:
        expires_at = expires_at.replace(tzinfo=timezone.utc)
    if expires_at < datetime.now(timezone.utc):
        raise HTTPException(status_code=400, detail="Lien expiré. Veuillez en demander un nouveau.")

    user = await db.users.find_one({"id": token_doc["user_id"]})
    if not user:
        raise HTTPException(status_code=400, detail="Utilisateur non trouvé")

    await db.users.update_one({"id": token_doc["user_id"]}, {"$set": {"password_hash": hash_password(data.password)}})
    await db.password_reset_tokens.update_one({"token": data.token}, {"$set": {"used": True}})

    return {"message": "Mot de passe réinitialisé avec succès"}

# === Profile Endpoints ===
class ChangePasswordRequest(BaseModel):
    current_password: str
    new_password: str = Field(..., min_length=6)

class ChangeEmailRequest(BaseModel):
    new_email: str
    password: str

@api_router.put("/auth/change-password")
async def change_password(data: ChangePasswordRequest, request: Request):
    user_info = await get_current_user(request)
    user = await db.users.find_one({"id": user_info["id"]})
    if not verify_password(data.current_password, user["password_hash"]):
        raise HTTPException(status_code=400, detail="Mot de passe actuel incorrect")
    await db.users.update_one({"id": user_info["id"]}, {"$set": {"password_hash": hash_password(data.new_password)}})
    return {"message": "Mot de passe modifié avec succès"}

@api_router.put("/auth/change-email")
async def change_email(data: ChangeEmailRequest, request: Request):
    user_info = await get_current_user(request)
    user = await db.users.find_one({"id": user_info["id"]})
    if not verify_password(data.password, user["password_hash"]):
        raise HTTPException(status_code=400, detail="Mot de passe incorrect")
    new_email = data.new_email.lower().strip()
    existing = await db.users.find_one({"email": new_email})
    if existing and existing["id"] != user_info["id"]:
        raise HTTPException(status_code=400, detail="Cet email est déjà utilisé")
    await db.users.update_one({"id": user_info["id"]}, {"$set": {"email": new_email}})
    return {"message": "Email modifié avec succès", "email": new_email}


# === Callsign Management ===
class UpdateCallsignsRequest(BaseModel):
    radioamateur: Optional[str] = None
    cb: Optional[str] = None
    swl: Optional[str] = None

@api_router.put("/auth/callsigns")
async def update_callsigns(data: UpdateCallsignsRequest, request: Request):
    user = await get_current_user(request)
    updates = {}
    for field in ["radioamateur", "cb", "swl"]:
        val = getattr(data, field, None)
        if val is not None:
            val = val.upper().strip()
            if val:
                # Check uniqueness
                existing = await db.users.find_one({"$or": [
                    {"callsign": val},
                    {f"callsigns.{field}": val}
                ], "id": {"$ne": user["id"]}})
                if existing:
                    raise HTTPException(status_code=400, detail=f"L'indicatif {val} est déjà utilisé")
            updates[f"callsigns.{field}"] = val
    if not updates:
        raise HTTPException(status_code=400, detail="Aucun indicatif à modifier")
    await db.users.update_one({"id": user["id"]}, {"$set": updates})
    # Update primary callsign if needed
    updated_user = await db.users.find_one({"id": user["id"]})
    callsigns = updated_user.get("callsigns", {})
    primary = callsigns.get("radioamateur") or callsigns.get("cb") or callsigns.get("swl") or updated_user["callsign"]
    if primary != updated_user["callsign"]:
        await db.users.update_one({"id": user["id"]}, {"$set": {"callsign": primary}})
    return {"message": "Indicatifs mis à jour", "callsigns": callsigns}

# === QSO Check (anti-doublon) ===
@api_router.get("/qso/check/{callsign}")
async def check_callsign_exists(callsign: str, request: Request):
    user = await get_current_user(request)
    qsos = await db.qsos.find(
        {"callsign": callsign.upper(), "owner_id": user["id"]},
        {"_id": 0, "date": 1, "frequency": 1}
    ).sort("date", -1).to_list(5)
    if qsos:
        return {"exists": True, "last_date": qsos[0]["date"], "count": len(qsos)}
    return {"exists": False}

# === QSO Models ===
class QSOCreate(BaseModel):
    callsign: str = Field(..., min_length=1, max_length=20)
    date: str
    time_utc: str = Field("", max_length=5)
    frequency: float = Field(..., gt=0)
    name: str = Field("", max_length=100)
    mode: str = Field("", max_length=20)
    comment: Optional[str] = ""
    qsl_sent: bool = False
    qsl_received: bool = False
    rst_sent: str = Field("", max_length=10)
    rst_received: str = Field("", max_length=10)
    logbook: str = Field("radioamateur")

class QSOUpdate(BaseModel):
    callsign: Optional[str] = None
    date: Optional[str] = None
    time_utc: Optional[str] = None
    frequency: Optional[float] = None
    name: Optional[str] = None
    mode: Optional[str] = None
    comment: Optional[str] = None
    qsl_sent: Optional[bool] = None
    qsl_received: Optional[bool] = None
    rst_sent: Optional[str] = None
    rst_received: Optional[str] = None

# === QSO Endpoints (Protected) ===
@api_router.post("/qso")
async def create_qso(qso_data: QSOCreate, request: Request):
    user = await get_current_user(request)
    logbook = qso_data.logbook if qso_data.logbook in VALID_LOGBOOKS else "radioamateur"
    
    qso_id = str(uuid.uuid4())
    doc = {
        "id": qso_id,
        "callsign": qso_data.callsign.upper(),
        "date": qso_data.date,
        "time_utc": qso_data.time_utc or "",
        "frequency": qso_data.frequency,
        "name": qso_data.name,
        "mode": qso_data.mode.upper() if qso_data.mode else "",
        "comment": qso_data.comment or "",
        "qsl_sent": qso_data.qsl_sent,
        "qsl_received": qso_data.qsl_received,
        "rst_sent": qso_data.rst_sent or "",
        "rst_received": qso_data.rst_received or "",
        "logbook": logbook,
        "owner_id": user["id"],
        "owner_callsign": user["callsign"],
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    await db.qsos.insert_one(doc)
    doc.pop("_id", None)
    
    # Auto-sync to Wavelog if enabled
    config = await db.wavelog_config.find_one({"user_id": user["id"]}, {"_id": 0})
    if config and config.get("wavelog_auto_sync"):
        await sync_qso_to_wavelog(user["id"], doc, user.get("callsign", ""))
    
    return doc

# Grouped list: one entry per callsign
@api_router.get("/qso/grouped")
async def get_qsos_grouped(request: Request, search: Optional[str] = None, band: Optional[str] = None, logbook: Optional[str] = "radioamateur"):
    user = await get_current_user(request)
    match_stage = {"owner_id": user["id"]}
    if logbook and logbook in VALID_LOGBOOKS:
        match_stage["logbook"] = logbook
    if search:
        match_stage["$or"] = [
            {"callsign": {"$regex": search, "$options": "i"}},
            {"name": {"$regex": search, "$options": "i"}}
        ]
    
    # Band filter: convert band name to frequency range
    if band:
        band_ranges = {
            "2200m": (0.1357, 0.1378), "630m": (0.472, 0.479),
            "160m": (1.8, 2.0), "80m": (3.5, 3.8), "60m": (5.3515, 5.3665),
            "40m": (7.0, 7.2), "30m": (10.1, 10.15), "20m": (14.0, 14.35),
            "17m": (18.068, 18.168), "15m": (21.0, 21.45), "12m": (24.89, 24.99),
            "11m": (26.965, 27.405), "10m": (28.0, 29.7),
            "6m": (50.0, 54.0), "4m": (70.0, 70.5), "2m": (144.0, 148.0),
            "1.25m": (222.0, 225.0), "70cm": (430.0, 440.0),
            "33cm": (902.0, 928.0), "23cm": (1240.0, 1300.0), "13cm": (2300.0, 2450.0),
        }
        if band in band_ranges:
            lo, hi = band_ranges[band]
            match_stage["frequency"] = {"$gte": lo, "$lte": hi}
    
    pipeline = [
        {"$match": match_stage},
        {"$sort": {"date": 1}},
        {"$group": {
            "_id": "$callsign",
            "callsign": {"$first": "$callsign"},
            "name": {"$first": "$name"},
            "first_contact": {"$first": "$date"},
            "last_contact": {"$last": "$date"},
            "total_contacts": {"$sum": 1},
            "last_created_at": {"$last": "$created_at"}
        }},
        {"$sort": {"first_contact": -1}},
        {"$project": {"_id": 0, "callsign": 1, "name": 1, "first_contact": 1, "last_contact": 1, "total_contacts": 1}}
    ]
    
    results = await db.qsos.aggregate(pipeline).to_list(1000)
    return results

# History for a specific callsign
@api_router.get("/qso/history/{callsign}")
async def get_qso_history(callsign: str, request: Request):
    user = await get_current_user(request)
    qsos = await db.qsos.find(
        {"callsign": callsign.upper(), "owner_id": user["id"]},
        {"_id": 0}
    ).sort("date", -1).to_list(1000)
    
    if not qsos:
        raise HTTPException(status_code=404, detail="Aucun QSO trouvé pour cet indicatif")
    
    return {
        "callsign": callsign.upper(),
        "name": next((q.get("name", "") for q in qsos if q.get("name")), ""),
        "first_contact": qsos[-1]["date"],
        "last_contact": qsos[0]["date"],
        "total_contacts": len(qsos),
        "history": qsos
    }

# Update name for all QSOs of a callsign
class UpdateNameRequest(BaseModel):
    name: str = Field("", max_length=100)

@api_router.put("/qso/contact/{callsign}/name")
async def update_contact_name(callsign: str, data: UpdateNameRequest, request: Request):
    user = await get_current_user(request)
    result = await db.qsos.update_many(
        {"callsign": callsign.upper(), "owner_id": user["id"]},
        {"$set": {"name": data.name}}
    )
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Aucun QSO trouvé pour cet indicatif")
    return {"message": "Nom mis à jour", "updated": result.modified_count}

# Export ADIF
@api_router.get("/qso/export/adif")
async def export_adif(request: Request, token: Optional[str] = None):
    from fastapi.responses import Response as RawResponse
    # Support token via query param for direct download on mobile
    if token:
        try:
            payload = jwt.decode(token, get_jwt_secret(), algorithms=[JWT_ALGORITHM])
            user_doc = await db.users.find_one({"id": payload["sub"]})
            if not user_doc:
                raise HTTPException(status_code=401, detail="User not found")
            user = {"id": user_doc["id"], "callsign": user_doc["callsign"]}
        except Exception:
            raise HTTPException(status_code=401, detail="Invalid token")
    else:
        user = await get_current_user(request)
    qsos = await db.qsos.find({"owner_id": user["id"]}, {"_id": 0}).sort("date", 1).to_list(10000)

    def adif_field(name, value):
        if not value:
            return ""
        v = str(value)
        return f"<{name}:{len(v)}>{v}"

    lines = []
    # ADIF header
    lines.append("ADIF Export from QSO LOG")
    lines.append(f"<ADIF_VER:5>3.1.4")
    lines.append(f"<PROGRAMID:7>QSO_LOG")
    lines.append(f"<PROGRAMVERSION:3>1.0")
    lines.append("<EOH>\n")

    for qso in qsos:
        record = ""
        record += adif_field("CALL", qso.get("callsign", ""))

        # Date: convert YYYY-MM-DD to YYYYMMDD
        raw_date = qso.get("date", "")
        if raw_date:
            qso_date = raw_date.replace("-", "")
            record += adif_field("QSO_DATE", qso_date)

        # Time UTC: convert HH:MM to HHMM
        time_utc = qso.get("time_utc", "")
        if time_utc:
            record += adif_field("TIME_ON", time_utc.replace(":", ""))

        freq = qso.get("frequency")
        if freq:
            record += adif_field("FREQ", f"{freq:.6f}")

        # Band from frequency
        band = freq_to_band(freq) if freq else None
        if band:
            record += adif_field("BAND", band)

        mode = qso.get("mode", "")
        if mode:
            record += adif_field("MODE", mode)

        name = qso.get("name", "")
        if name:
            record += adif_field("NAME", name)

        comment = qso.get("comment", "")
        if comment:
            record += adif_field("COMMENT", comment)

        record += adif_field("MY_CALLSIGN", user.get("callsign", ""))
        if qso.get("qsl_sent"): record += adif_field("QSL_SENT", "Y")
        if qso.get("qsl_received"): record += adif_field("QSL_RCVD", "Y")
        if qso.get("rst_sent"): record += adif_field("RST_SENT", qso["rst_sent"])
        if qso.get("rst_received"): record += adif_field("RST_RCVD", qso["rst_received"])
        record += "<EOR>\n"
        lines.append(record)

    content = "\n".join(lines)
    callsign = user.get("callsign", "qso_log").replace("/", "_")
    filename = f"{callsign}_qso_log.adi"
    return RawResponse(
        content=content.encode("utf-8"),
        media_type="application/octet-stream",
        headers={"Content-Disposition": f'attachment; filename="{filename}"'}
    )

# Import ADIF
import re

def parse_adif(content: str) -> list:
    """Parse ADIF content and return list of QSO dicts."""
    # Skip header (everything before <EOH>)
    eoh_match = re.search(r'<EOH>', content, re.IGNORECASE)
    if eoh_match:
        content = content[eoh_match.end():]

    qsos = []
    # Split by <EOR>
    records = re.split(r'<EOR>', content, flags=re.IGNORECASE)

    for record in records:
        record = record.strip()
        if not record:
            continue
        # Extract fields: <FIELDNAME:LENGTH>VALUE
        fields = {}
        for match in re.finditer(r'<(\w+):(\d+)(?::\w+)?>(.*?)(?=<\w+:|\Z)', record, re.DOTALL | re.IGNORECASE):
            name = match.group(1).upper()
            length = int(match.group(2))
            value = match.group(3)[:length].strip()
            fields[name] = value

        if not fields.get("CALL"):
            continue

        # Convert date YYYYMMDD → YYYY-MM-DD
        date_str = fields.get("QSO_DATE", "")
        if len(date_str) == 8:
            date_str = f"{date_str[:4]}-{date_str[4:6]}-{date_str[6:8]}"
        elif not date_str:
            date_str = datetime.now(timezone.utc).strftime("%Y-%m-%d")

        # Convert time HHMM → HH:MM
        time_str = fields.get("TIME_ON", "")
        if len(time_str) >= 4:
            time_str = f"{time_str[:2]}:{time_str[2:4]}"

        # Frequency
        freq = 0.0
        try:
            freq = float(fields.get("FREQ", "0"))
        except ValueError:
            pass

        qsos.append({
            "callsign": fields.get("CALL", "").upper(),
            "date": date_str,
            "time_utc": time_str,
            "frequency": freq,
            "mode": fields.get("MODE", ""),
            "name": fields.get("NAME", ""),
            "comment": fields.get("COMMENT", fields.get("NOTES", "")),
            "qsl_sent": fields.get("QSL_SENT", "") == "Y",
            "qsl_received": fields.get("QSL_RCVD", "") == "Y",
            "rst_sent": fields.get("RST_SENT", ""),
            "rst_received": fields.get("RST_RCVD", ""),
        })

    return qsos

@api_router.post("/qso/import/adif")
async def import_adif(request: Request, file: UploadFile = File(...)):
    logger.info(f"=== ADIF IMPORT called, filename: {file.filename}, content_type: {file.content_type} ===")
    user = await get_current_user(request)

    content = await file.read()
    try:
        text = content.decode("utf-8")
    except UnicodeDecodeError:
        text = content.decode("latin-1")

    qsos = parse_adif(text)
    if not qsos:
        raise HTTPException(status_code=400, detail="Aucun QSO trouvé dans le fichier ADIF")

    imported = 0
    skipped = 0
    for qso in qsos:
        if not qso["callsign"] or qso["frequency"] <= 0:
            skipped += 1
            continue

        doc = {
            "id": str(uuid.uuid4()),
            "callsign": qso["callsign"],
            "date": qso["date"],
            "time_utc": qso["time_utc"],
            "frequency": qso["frequency"],
            "mode": qso["mode"],
            "name": qso["name"],
            "comment": qso["comment"],
            "qsl_sent": qso.get("qsl_sent", False),
            "qsl_received": qso.get("qsl_received", False),
            "rst_sent": qso.get("rst_sent", ""),
            "rst_received": qso.get("rst_received", ""),
            "owner_id": user["id"],
            "owner_callsign": user["callsign"],
            "created_at": datetime.now(timezone.utc).isoformat()
        }
        await db.qsos.insert_one(doc)
        imported += 1

    return {"imported": imported, "skipped": skipped, "total": len(qsos)}

# Alternative import: accept ADIF content as JSON text (no multipart needed)
class AdifTextImport(BaseModel):
    content: str
    logbook: str = "radioamateur"

@api_router.post("/qso/import/adif-text")
async def import_adif_text(data: AdifTextImport, request: Request):
    logger.info("=== ADIF TEXT IMPORT called ===")
    user = await get_current_user(request)
    qsos = parse_adif(data.content)
    if not qsos:
        raise HTTPException(status_code=400, detail="Aucun QSO trouvé dans le contenu ADIF")
    imported = 0
    skipped = 0
    for qso in qsos:
        if not qso["callsign"] or qso["frequency"] <= 0:
            skipped += 1
            continue
        logbook = data.logbook if data.logbook in VALID_LOGBOOKS else "radioamateur"
        doc = {
            "id": str(uuid.uuid4()),
            "callsign": qso["callsign"],
            "date": qso["date"],
            "time_utc": qso["time_utc"],
            "frequency": qso["frequency"],
            "mode": qso["mode"],
            "name": qso["name"],
            "comment": qso["comment"],
            "qsl_sent": qso.get("qsl_sent", False),
            "qsl_received": qso.get("qsl_received", False),
            "rst_sent": qso.get("rst_sent", ""),
            "rst_received": qso.get("rst_received", ""),
            "logbook": logbook,
            "owner_id": user["id"],
            "owner_callsign": user["callsign"],
            "created_at": datetime.now(timezone.utc).isoformat()
        }
        await db.qsos.insert_one(doc)
        imported += 1
    return {"imported": imported, "skipped": skipped, "total": len(qsos)}

def freq_to_band(freq_mhz):
    if not freq_mhz:
        return None
    f = float(freq_mhz)
    bands = [
        (0.1357, 0.1378, "2200m"), (0.472, 0.479, "630m"),
        (1.8, 2.0, "160m"), (3.5, 3.8, "80m"), (5.3515, 5.3665, "60m"),
        (7.0, 7.2, "40m"), (10.1, 10.15, "30m"), (14.0, 14.35, "20m"),
        (18.068, 18.168, "17m"), (21.0, 21.45, "15m"), (24.89, 24.99, "12m"),
        (26.965, 27.405, "11m"), (28.0, 29.7, "10m"),
        (50.0, 54.0, "6m"), (70.0, 70.5, "4m"), (144.0, 148.0, "2m"),
        (222.0, 225.0, "1.25m"), (430.0, 440.0, "70cm"),
        (902.0, 928.0, "33cm"), (1240.0, 1300.0, "23cm"), (2300.0, 2450.0, "13cm"),
        (5650.0, 5925.0, "5cm"),
    ]
    for lo, hi, name in bands:
        if lo <= f <= hi:
            return name
    return None

@api_router.get("/qso/stats/total")
async def get_qso_stats(request: Request, logbook: Optional[str] = "radioamateur"):
    user = await get_current_user(request)
    query = {"owner_id": user["id"]}
    if logbook and logbook in VALID_LOGBOOKS:
        query["logbook"] = logbook
    total_qsos = await db.qsos.count_documents(query)
    unique_callsigns = await db.qsos.distinct("callsign", query)
    return {"total_qsos": total_qsos, "total_callsigns": len(unique_callsigns)}

@api_router.get("/qso")
async def get_qsos(request: Request, search: Optional[str] = None, logbook: Optional[str] = "radioamateur"):
    user = await get_current_user(request)
    query = {"owner_id": user["id"]}
    if logbook and logbook in VALID_LOGBOOKS:
        query["logbook"] = logbook
    if search:
        query = {"$and": [query, {"$or": [
            {"callsign": {"$regex": search, "$options": "i"}},
            {"name": {"$regex": search, "$options": "i"}}
        ]}]}
    qsos = await db.qsos.find(query, {"_id": 0}).sort("created_at", -1).to_list(1000)
    return qsos

@api_router.put("/qso/{qso_id}")
async def update_qso(qso_id: str, qso_data: QSOUpdate, request: Request):
    user = await get_current_user(request)
    existing = await db.qsos.find_one({"id": qso_id, "owner_id": user["id"]}, {"_id": 0})
    if not existing:
        raise HTTPException(status_code=404, detail="QSO non trouvé")
    
    update_data = {k: v for k, v in qso_data.model_dump().items() if v is not None}
    if "callsign" in update_data:
        update_data["callsign"] = update_data["callsign"].upper()
    if update_data:
        await db.qsos.update_one({"id": qso_id}, {"$set": update_data})
    
    updated = await db.qsos.find_one({"id": qso_id}, {"_id": 0})
    return updated

@api_router.delete("/qso/{qso_id}")
async def delete_qso(qso_id: str, request: Request):
    user = await get_current_user(request)
    result = await db.qsos.delete_one({"id": qso_id, "owner_id": user["id"]})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="QSO non trouvé")
    return {"message": "QSO supprimé"}

# Root
@api_router.get("/")
async def root():
    return {"message": "QSO Pocket API", "version": "1.0", "routes": ["/api/qso/import/adif", "/api/qso/export/adif"]}

# === Admin Endpoints ===
async def require_admin(request: Request) -> dict:
    user = await get_current_user(request)
    if user.get("role") != "admin":
        raise HTTPException(status_code=403, detail="Accès réservé à l'administrateur")
    return user

@api_router.get("/admin/stats")
async def admin_stats(request: Request):
    await require_admin(request)
    total_users = await db.users.count_documents({})
    total_qsos = await db.qsos.count_documents({})
    return {"total_users": total_users, "total_qsos": total_qsos}

@api_router.get("/admin/users")
async def admin_list_users(request: Request, search: Optional[str] = None):
    await require_admin(request)
    query = {}
    if search:
        query["$or"] = [
            {"callsign": {"$regex": search, "$options": "i"}},
            {"email": {"$regex": search, "$options": "i"}}
        ]
    users = await db.users.find(query, {"_id": 0, "password_hash": 0}).sort("created_at", -1).to_list(1000)
    # Add QSO count per user
    for u in users:
        u["qso_count"] = await db.qsos.count_documents({"owner_id": u["id"]})
    return users

@api_router.get("/admin/users/{user_id}/qsos")
async def admin_user_qsos(user_id: str, request: Request):
    await require_admin(request)
    user = await db.users.find_one({"id": user_id}, {"_id": 0, "password_hash": 0})
    if not user:
        raise HTTPException(status_code=404, detail="Utilisateur non trouvé")
    qsos = await db.qsos.find({"owner_id": user_id}, {"_id": 0}).sort("date", -1).to_list(1000)
    return {"user": user, "qsos": qsos}

@api_router.get("/admin/users/{user_id}/grouped")
async def admin_user_grouped(user_id: str, request: Request):
    await require_admin(request)
    pipeline = [
        {"$match": {"owner_id": user_id}},
        {"$sort": {"date": 1}},
        {"$group": {
            "_id": "$callsign",
            "callsign": {"$first": "$callsign"},
            "name": {"$first": "$name"},
            "first_contact": {"$first": "$date"},
            "last_contact": {"$last": "$date"},
            "total_contacts": {"$sum": 1},
        }},
        {"$sort": {"first_contact": -1}},
        {"$project": {"_id": 0}}
    ]
    return await db.qsos.aggregate(pipeline).to_list(1000)

@api_router.get("/admin/users/{user_id}/history/{callsign}")
async def admin_user_history(user_id: str, callsign: str, request: Request):
    await require_admin(request)
    qsos = await db.qsos.find(
        {"callsign": callsign.upper(), "owner_id": user_id}, {"_id": 0}
    ).sort("date", -1).to_list(1000)
    if not qsos:
        raise HTTPException(status_code=404, detail="Aucun QSO trouvé")
    return {
        "callsign": callsign.upper(),
        "name": next((q.get("name", "") for q in qsos if q.get("name")), ""),
        "first_contact": qsos[-1]["date"],
        "last_contact": qsos[0]["date"],
        "total_contacts": len(qsos),
        "history": qsos
    }

@api_router.delete("/admin/qso/{qso_id}")
async def admin_delete_qso(qso_id: str, request: Request):
    await require_admin(request)
    result = await db.qsos.delete_one({"id": qso_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="QSO non trouvé")
    return {"message": "QSO supprimé"}

@api_router.delete("/admin/users/{user_id}")
async def admin_delete_user(user_id: str, request: Request):
    admin = await require_admin(request)
    user = await db.users.find_one({"id": user_id}, {"_id": 0})
    if not user:
        raise HTTPException(status_code=404, detail="Utilisateur non trouvé")
    if user.get("role") == "admin":
        raise HTTPException(status_code=400, detail="Impossible de supprimer un administrateur")
    await db.qsos.delete_many({"owner_id": user_id})
    await db.users.delete_one({"id": user_id})
    return {"message": f"Utilisateur {user.get('callsign')} supprimé"}

# === Wavelog Integration ===
class WavelogConfig(BaseModel):
    wavelog_url: str
    wavelog_api_key: str
    wavelog_station_id: str = "1"
    wavelog_auto_sync: bool = False

@api_router.get("/wavelog/config")
async def get_wavelog_config(request: Request):
    user = await get_current_user(request)
    config = await db.wavelog_config.find_one({"user_id": user["id"]}, {"_id": 0})
    if not config:
        return {"configured": False, "wavelog_url": "", "wavelog_api_key": "", "wavelog_station_id": "1", "wavelog_auto_sync": False}
    return {
        "configured": True,
        "wavelog_url": config.get("wavelog_url", ""),
        "wavelog_api_key": config.get("wavelog_api_key", ""),
        "wavelog_station_id": config.get("wavelog_station_id", "1"),
        "wavelog_auto_sync": config.get("wavelog_auto_sync", False)
    }

@api_router.put("/wavelog/config")
async def save_wavelog_config(data: WavelogConfig, request: Request):
    user = await get_current_user(request)
    url = data.wavelog_url.rstrip("/")
    await db.wavelog_config.update_one(
        {"user_id": user["id"]},
        {"$set": {
            "user_id": user["id"],
            "wavelog_url": url,
            "wavelog_api_key": data.wavelog_api_key,
            "wavelog_station_id": data.wavelog_station_id,
            "wavelog_auto_sync": data.wavelog_auto_sync
        }},
        upsert=True
    )
    return {"message": "Configuration Wavelog sauvegardée"}

@api_router.post("/wavelog/test")
async def test_wavelog_connection(request: Request):
    user = await get_current_user(request)
    config = await db.wavelog_config.find_one({"user_id": user["id"]}, {"_id": 0})
    if not config or not config.get("wavelog_url"):
        raise HTTPException(status_code=400, detail="Wavelog non configuré")
    
    url = config["wavelog_url"].rstrip("/")
    key = config["wavelog_api_key"]
    try:
        async with httpx.AsyncClient(timeout=10) as client:
            res = await client.get(f"{url}/api/statistics/{key}", headers={"Accept": "application/json"})
            if res.status_code == 200:
                return {"success": True, "message": "Connexion réussie", "data": res.json()}
            else:
                return {"success": False, "message": f"Erreur {res.status_code}: {res.text[:200]}"}
    except httpx.TimeoutException:
        return {"success": False, "message": "Timeout — vérifiez l'URL"}
    except Exception as e:
        return {"success": False, "message": f"Erreur: {str(e)[:200]}"}

def qso_to_adif_string(qso: dict, my_callsign: str) -> str:
    def af(name, value):
        if not value: return ""
        v = str(value)
        return f"<{name}:{len(v)}>{v}"
    
    s = ""
    s += af("CALL", qso.get("callsign", ""))
    raw_date = qso.get("date", "")
    if raw_date:
        s += af("QSO_DATE", raw_date.replace("-", ""))
    time_utc = qso.get("time_utc", "")
    if time_utc:
        s += af("TIME_ON", time_utc.replace(":", ""))
    freq = qso.get("frequency")
    if freq:
        s += af("FREQ", f"{freq:.6f}")
    band = freq_to_band(freq) if freq else None
    if band:
        s += af("BAND", band)
    mode = qso.get("mode", "")
    if mode:
        s += af("MODE", mode)
    name = qso.get("name", "")
    if name:
        s += af("NAME", name)
    comment = qso.get("comment", "")
    if comment:
        s += af("COMMENT", comment)
    s += af("MY_CALLSIGN", my_callsign)
    s += "<EOR>"
    return s

async def sync_qso_to_wavelog(user_id: str, qso: dict, my_callsign: str):
    """Sync a single QSO to Wavelog. Returns (success, message)."""
    config = await db.wavelog_config.find_one({"user_id": user_id}, {"_id": 0})
    if not config or not config.get("wavelog_url") or not config.get("wavelog_api_key"):
        return False, "Wavelog non configuré"
    
    url = config["wavelog_url"].rstrip("/")
    adif_str = qso_to_adif_string(qso, my_callsign)
    payload = {
        "key": config["wavelog_api_key"],
        "station_profile_id": config.get("wavelog_station_id", "1"),
        "type": "adif",
        "string": adif_str
    }
    
    try:
        async with httpx.AsyncClient(timeout=10) as client:
            res = await client.post(f"{url}/api/qso", json=payload, headers={"Accept": "application/json", "Content-Type": "application/json"})
            if res.status_code == 200 or res.status_code == 201:
                # Log success
                await db.wavelog_sync_log.insert_one({
                    "user_id": user_id,
                    "qso_id": qso.get("id"),
                    "callsign": qso.get("callsign"),
                    "status": "success",
                    "message": "Synchronisé",
                    "timestamp": datetime.now(timezone.utc).isoformat()
                })
                return True, "OK"
            else:
                msg = f"Erreur {res.status_code}: {res.text[:150]}"
                await db.wavelog_sync_log.insert_one({
                    "user_id": user_id,
                    "qso_id": qso.get("id"),
                    "callsign": qso.get("callsign"),
                    "status": "error",
                    "message": msg,
                    "timestamp": datetime.now(timezone.utc).isoformat()
                })
                return False, msg
    except Exception as e:
        msg = str(e)[:150]
        await db.wavelog_sync_log.insert_one({
            "user_id": user_id,
            "qso_id": qso.get("id"),
            "callsign": qso.get("callsign"),
            "status": "error",
            "message": msg,
            "timestamp": datetime.now(timezone.utc).isoformat()
        })
        return False, msg

@api_router.post("/wavelog/sync")
async def sync_all_to_wavelog(request: Request):
    user = await get_current_user(request)
    config = await db.wavelog_config.find_one({"user_id": user["id"]}, {"_id": 0})
    if not config or not config.get("wavelog_url"):
        raise HTTPException(status_code=400, detail="Wavelog non configuré")
    
    # Get all QSOs not yet synced
    synced_ids = await db.wavelog_sync_log.distinct("qso_id", {"user_id": user["id"], "status": "success"})
    qsos = await db.qsos.find({"owner_id": user["id"], "id": {"$nin": synced_ids}}, {"_id": 0}).to_list(5000)
    
    if not qsos:
        return {"synced": 0, "errors": 0, "message": "Tous les QSOs sont déjà synchronisés"}
    
    synced = 0
    errors = 0
    for qso in qsos:
        ok, msg = await sync_qso_to_wavelog(user["id"], qso, user.get("callsign", ""))
        if ok:
            synced += 1
        else:
            errors += 1
    
    return {"synced": synced, "errors": errors, "total": len(qsos), "message": f"{synced} synchronisé(s), {errors} erreur(s)"}

@api_router.get("/wavelog/log")
async def get_wavelog_sync_log(request: Request):
    user = await get_current_user(request)
    logs = await db.wavelog_sync_log.find({"user_id": user["id"]}, {"_id": 0}).sort("timestamp", -1).to_list(50)
    return logs

@api_router.delete("/wavelog/log")
async def clear_wavelog_sync_log(request: Request):
    user = await get_current_user(request)
    await db.wavelog_sync_log.delete_many({"user_id": user["id"]})
    return {"message": "Journal vidé"}

@api_router.post("/wavelog/import")
async def import_from_wavelog(request: Request):
    """Import QSOs from Wavelog into QSO Pocket."""
    user = await get_current_user(request)
    config = await db.wavelog_config.find_one({"user_id": user["id"]}, {"_id": 0})
    if not config or not config.get("wavelog_url") or not config.get("wavelog_api_key"):
        raise HTTPException(status_code=400, detail="Wavelog non configuré")

    url = config["wavelog_url"].rstrip("/")
    key = config["wavelog_api_key"]
    station_id = config.get("wavelog_station_id", "1")

    # Try fetching QSOs from Wavelog API
    try:
        async with httpx.AsyncClient(timeout=30) as client:
            # Wavelog API: get logbook entries
            res = await client.get(
                f"{url}/api/logbook/{key}",
                headers={"Accept": "application/json"}
            )
            if res.status_code != 200:
                raise HTTPException(status_code=502, detail=f"Wavelog returned {res.status_code}: {res.text[:200]}")

            data = res.json()
    except httpx.TimeoutException:
        raise HTTPException(status_code=504, detail="Timeout connecting to Wavelog")
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=502, detail=f"Error connecting to Wavelog: {str(e)[:200]}")

    # Parse Wavelog QSO entries
    entries = data if isinstance(data, list) else data.get("logbook", data.get("qsos", []))
    if not isinstance(entries, list):
        raise HTTPException(status_code=502, detail="Format de réponse Wavelog inattendu")

    imported = 0
    skipped = 0
    for entry in entries:
        # Extract fields from Wavelog entry (field names may vary)
        callsign = (entry.get("COL_CALL") or entry.get("call") or entry.get("callsign") or "").upper().strip()
        if not callsign:
            skipped += 1
            continue

        # Date
        raw_date = entry.get("COL_QSO_DATE") or entry.get("qso_date") or entry.get("date") or ""
        if len(raw_date) == 8:
            date_str = f"{raw_date[:4]}-{raw_date[4:6]}-{raw_date[6:8]}"
        else:
            date_str = raw_date[:10] if raw_date else datetime.now(timezone.utc).strftime("%Y-%m-%d")

        # Time
        raw_time = entry.get("COL_TIME_ON") or entry.get("time_on") or entry.get("time_utc") or ""
        time_str = f"{raw_time[:2]}:{raw_time[2:4]}" if len(raw_time) >= 4 else raw_time[:5] if raw_time else ""

        # Frequency
        freq_raw = entry.get("COL_FREQ") or entry.get("freq") or entry.get("frequency") or "0"
        try:
            freq = float(freq_raw)
            # Wavelog may store freq in Hz or MHz
            if freq > 1000:
                freq = freq / 1000000
        except (ValueError, TypeError):
            freq = 0

        mode = entry.get("COL_MODE") or entry.get("mode") or ""
        name = entry.get("COL_NAME") or entry.get("name") or ""
        comment = entry.get("COL_COMMENT") or entry.get("comment") or ""
        rst_sent = entry.get("COL_RST_SENT") or entry.get("rst_sent") or ""
        rst_received = entry.get("COL_RST_RCVD") or entry.get("rst_rcvd") or entry.get("rst_received") or ""
        qsl_sent = (entry.get("COL_QSL_SENT") or entry.get("qsl_sent") or "") in ("Y", "y", True, "1")
        qsl_received = (entry.get("COL_QSL_RCVD") or entry.get("qsl_rcvd") or entry.get("qsl_received") or "") in ("Y", "y", True, "1")

        # Check for duplicate
        existing = await db.qsos.find_one({
            "owner_id": user["id"],
            "callsign": callsign,
            "date": date_str,
            "time_utc": time_str
        })
        if existing:
            skipped += 1
            continue

        # Build band from frequency
        band = freq_to_band(freq) if freq else None

        doc = {
            "id": str(uuid.uuid4()),
            "owner_id": user["id"],
            "owner_callsign": user.get("callsign", ""),
            "callsign": callsign,
            "date": date_str,
            "time_utc": time_str,
            "frequency": freq,
            "band": band or "",
            "mode": mode,
            "name": name,
            "comment": comment,
            "rst_sent": str(rst_sent),
            "rst_received": str(rst_received),
            "qsl_sent": qsl_sent,
            "qsl_received": qsl_received,
            "created_at": datetime.now(timezone.utc).isoformat()
        }
        await db.qsos.insert_one(doc)
        imported += 1

    return {"imported": imported, "skipped": skipped, "message": f"{imported} importé(s), {skipped} ignoré(s)"}

# Include router
app.include_router(api_router)

# CORS - support cross-origin requests
frontend_url = os.environ.get('REACT_APP_FRONTEND_URL', '')
cors_origins = os.environ.get('CORS_ORIGINS', '*').split(',')
all_origins = [o.strip() for o in cors_origins if o.strip()]

app.add_middleware(
    CORSMiddleware,
    allow_credentials=False,
    allow_origins=all_origins,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(name)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

# Startup - seed admin + indexes
@app.on_event("startup")
async def startup():
    # Create indexes
    await db.users.create_index("email", unique=True)
    await db.users.create_index("callsign", unique=True)
    await db.login_attempts.create_index("identifier")
    await db.qsos.create_index("owner_id")
    await db.password_reset_tokens.create_index("token")
    await db.password_reset_tokens.create_index("expires_at", expireAfterSeconds=0)
    
    # Seed admin
    admin_email = os.environ.get("ADMIN_EMAIL", "admin@example.com")
    admin_password = os.environ.get("ADMIN_PASSWORD", "admin123")
    admin_callsign = os.environ.get("ADMIN_CALLSIGN", "F0ADMIN")
    
    existing = await db.users.find_one({"email": admin_email})
    if existing is None:
        await db.users.insert_one({
            "id": str(uuid.uuid4()),
            "email": admin_email,
            "password_hash": hash_password(admin_password),
            "callsign": admin_callsign,
            "role": "admin",
            "created_at": datetime.now(timezone.utc).isoformat()
        })
        logger.info(f"Admin user seeded: {admin_email} / {admin_callsign}")
    elif not verify_password(admin_password, existing["password_hash"]):
        await db.users.update_one({"email": admin_email}, {"$set": {"password_hash": hash_password(admin_password)}})
        logger.info("Admin password updated")

@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()
