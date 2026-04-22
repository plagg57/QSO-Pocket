from pathlib import Path
from dotenv import load_dotenv
ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

from fastapi import FastAPI, APIRouter, HTTPException, Request, Response, Depends
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
print("SERVER.PY CHARGE OK")

# MongoDB connection
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]
print("MONGO_URL present:", "MONGO_URL" in os.environ)
print("DB_NAME present:", "DB_NAME" in os.environ)
print("JWT_SECRET present:", "JWT_SECRET" in os.environ)
print("PORT =", os.environ.get("PORT"))

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
    token = request.cookies.get("access_token")
    if not token:
        auth_header = request.headers.get("Authorization", "")
        if auth_header.startswith("Bearer "):
            token = auth_header[7:]
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
            "role": user.get("role", "user")
        }
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="Token expired")
    except jwt.InvalidTokenError:
        raise HTTPException(status_code=401, detail="Invalid token")

def set_auth_cookies(response: Response, access_token: str, refresh_token: str):
    response.set_cookie(key="access_token", value=access_token, httponly=True, secure=True, samesite="none", max_age=86400, path="/")
    response.set_cookie(key="refresh_token", value=refresh_token, httponly=True, secure=True, samesite="none", max_age=604800, path="/")

# Create the main app
app = FastAPI()
api_router = APIRouter(prefix="/api")

# === Auth Models ===
class RegisterRequest(BaseModel):
    email: str
    password: str = Field(..., min_length=6)
    callsign: str = Field(..., min_length=2, max_length=20)

class LoginRequest(BaseModel):
    email: str
    password: str

class UserResponse(BaseModel):
    id: str
    email: str
    callsign: str
    role: str

# === Auth Endpoints ===
@api_router.post("/auth/register")
async def register(data: RegisterRequest, response: Response):
    email = data.email.lower().strip()
    callsign = data.callsign.upper().strip()
    
    existing_email = await db.users.find_one({"email": email})
    if existing_email:
        raise HTTPException(status_code=400, detail="Cet email est déjà utilisé")
    
    existing_callsign = await db.users.find_one({"callsign": callsign})
    if existing_callsign:
        raise HTTPException(status_code=400, detail="Cet indicatif est déjà utilisé")
    
    user_id = str(uuid.uuid4())
    user_doc = {
        "id": user_id,
        "email": email,
        "password_hash": hash_password(data.password),
        "callsign": callsign,
        "role": "user",
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    await db.users.insert_one(user_doc)
    
    access_token = create_access_token(user_id, email)
    refresh_token = create_refresh_token(user_id)
    set_auth_cookies(response, access_token, refresh_token)
    
    return {"id": user_id, "email": email, "callsign": callsign, "role": "user", "access_token": access_token}

@api_router.post("/auth/login")
async def login(data: LoginRequest, request: Request, response: Response):
    identifier = data.email.strip()
    
    # Detect if login is by email or callsign
    if "@" in identifier:
        user = await db.users.find_one({"email": identifier.lower()})
    else:
        user = await db.users.find_one({"callsign": identifier.upper()})
    
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
    refresh_token = create_refresh_token(user["id"])
    set_auth_cookies(response, access_token, refresh_token)
    
    return {"id": user["id"], "email": user["email"], "callsign": user["callsign"], "role": user.get("role", "user"), "access_token": access_token}

@api_router.post("/auth/logout")
async def logout(response: Response):
    response.delete_cookie("access_token", path="/")
    response.delete_cookie("refresh_token", path="/")
    return {"message": "Déconnexion réussie"}

@api_router.get("/auth/me")
async def get_me(request: Request):
    user = await get_current_user(request)
    return user

@api_router.post("/auth/refresh")
async def refresh_token(request: Request, response: Response):
    token = request.cookies.get("refresh_token")
    if not token:
        raise HTTPException(status_code=401, detail="No refresh token")
    try:
        payload = jwt.decode(token, get_jwt_secret(), algorithms=[JWT_ALGORITHM])
        if payload.get("type") != "refresh":
            raise HTTPException(status_code=401, detail="Invalid token type")
        user = await db.users.find_one({"id": payload["sub"]})
        if not user:
            raise HTTPException(status_code=401, detail="User not found")
        access_token = create_access_token(user["id"], user["email"])
        response.set_cookie(key="access_token", value=access_token, httponly=True, secure=True, samesite="none", max_age=86400, path="/")
        return {"message": "Token refreshed"}
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="Refresh token expired")
    except jwt.InvalidTokenError:
        raise HTTPException(status_code=401, detail="Invalid refresh token")

# === Password Reset ===
class ForgotPasswordRequest(BaseModel):
    email: str

class ResetPasswordRequest(BaseModel):
    token: str
    password: str = Field(..., min_length=6)

@api_router.post("/auth/forgot-password")
async def forgot_password(data: ForgotPasswordRequest):
    identifier = data.email.strip()
    if "@" in identifier:
        user = await db.users.find_one({"email": identifier.lower()})
    else:
        user = await db.users.find_one({"callsign": identifier.upper()})

    if not user:
        # Don't reveal if user exists
        return {"message": "Si ce compte existe, un lien de réinitialisation a été généré.", "reset_link": None}

    token = secrets.token_urlsafe(32)
    await db.password_reset_tokens.insert_one({
        "token": token,
        "user_id": user["id"],
        "expires_at": datetime.now(timezone.utc) + timedelta(hours=1),
        "used": False
    })

    frontend_url = os.environ.get("REACT_APP_FRONTEND_URL", "")
    if not frontend_url:
        cors = os.environ.get("CORS_ORIGINS", "")
        frontend_url = cors.split(",")[0].strip() if cors and cors != "*" else ""

    reset_link = f"{frontend_url}/reset-password?token={token}" if frontend_url else f"/reset-password?token={token}"
    logger.info(f"Password reset link for {user['email']}: {reset_link}")

    # Simulation mode: return the link directly
    return {
        "message": "Lien de réinitialisation généré",
        "reset_link": reset_link,
        "callsign": user.get("callsign", "")
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
    time_utc: str = Field("", max_length=5)  # HH:MM format
    frequency: float = Field(..., gt=0)
    name: str = Field("", max_length=100)
    mode: str = Field("", max_length=20)
    comment: Optional[str] = ""

class QSOUpdate(BaseModel):
    callsign: Optional[str] = None
    date: Optional[str] = None
    time_utc: Optional[str] = None
    frequency: Optional[float] = None
    name: Optional[str] = None
    mode: Optional[str] = None
    comment: Optional[str] = None

# === QSO Endpoints (Protected) ===
@api_router.post("/qso")
async def create_qso(qso_data: QSOCreate, request: Request):
    user = await get_current_user(request)
    
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
        "owner_id": user["id"],
        "owner_callsign": user["callsign"],
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    await db.qsos.insert_one(doc)
    doc.pop("_id", None)
    return doc

# Grouped list: one entry per callsign
@api_router.get("/qso/grouped")
async def get_qsos_grouped(request: Request, search: Optional[str] = None, band: Optional[str] = None):
    user = await get_current_user(request)
    match_stage = {"owner_id": user["id"]}
    if search:
        match_stage["$or"] = [
            {"callsign": {"$regex": search, "$options": "i"}},
            {"name": {"$regex": search, "$options": "i"}}
        ]
    
    # Band filter: convert band name to frequency range
    if band:
        band_ranges = {
            "160m": (1.8, 2.0), "80m": (3.5, 3.8), "40m": (7.0, 7.2), "30m": (10.1, 10.15),
            "20m": (14.0, 14.35), "17m": (18.068, 18.168), "15m": (21.0, 21.45),
            "12m": (24.89, 24.99), "10m": (28.0, 29.7), "6m": (50.0, 52.0),
            "4m": (70.0, 70.5), "2m": (144.0, 146.0), "70cm": (430.0, 440.0),
            "23cm": (1240.0, 1300.0),
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
async def export_adif(request: Request):
    from fastapi.responses import Response as RawResponse
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

def freq_to_band(freq_mhz):
    if not freq_mhz:
        return None
    f = float(freq_mhz)
    bands = [
        (0.1357, 0.1378, "2190m"), (0.472, 0.479, "630m"),
        (1.8, 2.0, "160m"), (3.5, 3.8, "80m"), (5.3515, 5.3665, "60m"),
        (7.0, 7.2, "40m"), (10.1, 10.15, "30m"), (14.0, 14.35, "20m"),
        (18.068, 18.168, "17m"), (21.0, 21.45, "15m"), (24.89, 24.99, "12m"),
        (28.0, 29.7, "10m"), (50.0, 52.0, "6m"), (70.0, 70.5, "4m"),
        (144.0, 146.0, "2m"), (430.0, 440.0, "70cm"),
        (1240.0, 1300.0, "23cm"), (2300.0, 2450.0, "13cm"),
    ]
    for lo, hi, name in bands:
        if lo <= f <= hi:
            return name
    return None

@api_router.get("/qso/stats/total")
async def get_qso_stats(request: Request):
    user = await get_current_user(request)
    total_qsos = await db.qsos.count_documents({"owner_id": user["id"]})
    unique_callsigns = await db.qsos.distinct("callsign", {"owner_id": user["id"]})
    return {"total_qsos": total_qsos, "total_callsigns": len(unique_callsigns)}

@api_router.get("/qso")
async def get_qsos(request: Request, search: Optional[str] = None):
    user = await get_current_user(request)
    query = {"owner_id": user["id"]}
    if search:
        query = {"$and": [{"owner_id": user["id"]}, {"$or": [
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
    return {"message": "QSO Logbook API"}

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

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=["https://qso-pocket.vercel.app"],
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include router
app.include_router(api_router)

# CORS - must support credentials
frontend_url = os.environ.get('REACT_APP_FRONTEND_URL', '')
cors_origins = os.environ.get('CORS_ORIGINS', '*').split(',')
all_origins = [o.strip() for o in cors_origins if o.strip()]

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
