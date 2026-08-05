from pathlib import Path
from dotenv import load_dotenv
ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

from fastapi import FastAPI, APIRouter
from starlette.middleware.cors import CORSMiddleware
import os
import re
import logging
import uuid
from datetime import datetime, timezone

from utils.db import db, client
from utils.auth import hash_password, verify_password
from utils.helpers import AMATEUR_CALLSIGN_REGEX

from routes.auth import router as auth_router
from routes.qso import router as qso_router
from routes.admin import router as admin_router
from routes.wavelog import router as wavelog_router

# Logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(name)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

# Create the main app
app = FastAPI()
api_router = APIRouter(prefix="/api")

# Include modular routers
api_router.include_router(auth_router)
api_router.include_router(qso_router)
api_router.include_router(admin_router)
api_router.include_router(wavelog_router)

@api_router.get("/")
async def root():
    return {"message": "QSO Pocket API", "version": "2.0", "routes": ["/api/qso/import/adif", "/api/qso/export/adif"]}

app.include_router(api_router)

# CORS
cors_origins = os.environ.get('CORS_ORIGINS', '*').split(',')
all_origins = [o.strip() for o in cors_origins if o.strip()]

app.add_middleware(
    CORSMiddleware,
    allow_credentials=False,
    allow_origins=all_origins,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Startup - seed admin + indexes + migrations
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

    # Migrate admin user to have user_type/callsigns if missing
    admin_user = await db.users.find_one({"email": admin_email})
    if admin_user and "user_type" not in admin_user:
        await db.users.update_one({"email": admin_email}, {"$set": {
            "user_type": "radioamateur",
            "callsigns": {"radioamateur": admin_user.get("callsign", admin_callsign), "cb": "", "swl": ""}
        }})

    # Auto-migrate QSOs to correct logbook based on callsign format
    cb_pattern = re.compile(r'^[0-9]{1,3}[A-Z]{1,4}[0-9]{1,5}$')
    amateur_pattern = AMATEUR_CALLSIGN_REGEX

    radio_qsos = db.qsos.find({"$or": [{"logbook": "radioamateur"}, {"logbook": {"$exists": False}}]}, {"_id": 0, "id": 1, "callsign": 1})
    cb_moved = 0
    async for qso in radio_qsos:
        cs = qso.get("callsign", "")
        if cs and cb_pattern.match(cs) and not amateur_pattern.match(cs):
            await db.qsos.update_one({"id": qso["id"]}, {"$set": {"logbook": "cb"}})
            cb_moved += 1

    cb_qsos = db.qsos.find({"logbook": "cb"}, {"_id": 0, "id": 1, "callsign": 1})
    ham_moved = 0
    async for qso in cb_qsos:
        cs = qso.get("callsign", "")
        if cs and amateur_pattern.match(cs):
            await db.qsos.update_one({"id": qso["id"]}, {"$set": {"logbook": "radioamateur"}})
            ham_moved += 1

    if cb_moved or ham_moved:
        logger.info(f"QSO logbook migration: {cb_moved} moved to CB, {ham_moved} moved to Radioamateur")

@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()
