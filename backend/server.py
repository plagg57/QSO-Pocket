from fastapi import FastAPI, APIRouter, HTTPException
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
from pathlib import Path
from pydantic import BaseModel, Field, ConfigDict
from typing import List, Optional
import uuid
from datetime import datetime, timezone

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# MongoDB connection
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

# Create the main app without a prefix
app = FastAPI()

# Create a router with the /api prefix
api_router = APIRouter(prefix="/api")

# QSO Models
class QSOBase(BaseModel):
    callsign: str = Field(..., min_length=1, max_length=20)
    date: str  # ISO date string
    frequency: float = Field(..., gt=0)
    name: str = Field(..., min_length=1, max_length=100)

class QSOCreate(QSOBase):
    pass

class QSOUpdate(BaseModel):
    callsign: Optional[str] = None
    date: Optional[str] = None
    frequency: Optional[float] = None
    name: Optional[str] = None

class QSO(QSOBase):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    created_at: str = Field(default_factory=lambda: datetime.now(timezone.utc).isoformat())

# QSO Routes
@api_router.post("/qso", response_model=QSO)
async def create_qso(qso_data: QSOCreate):
    qso = QSO(**qso_data.model_dump())
    doc = qso.model_dump()
    await db.qsos.insert_one(doc)
    return qso

@api_router.get("/qso", response_model=List[QSO])
async def get_qsos(
    search: Optional[str] = None,
    frequency_min: Optional[float] = None,
    frequency_max: Optional[float] = None
):
    query = {}
    
    if search:
        query["$or"] = [
            {"callsign": {"$regex": search, "$options": "i"}},
            {"name": {"$regex": search, "$options": "i"}}
        ]
    
    if frequency_min is not None or frequency_max is not None:
        query["frequency"] = {}
        if frequency_min is not None:
            query["frequency"]["$gte"] = frequency_min
        if frequency_max is not None:
            query["frequency"]["$lte"] = frequency_max
        if not query["frequency"]:
            del query["frequency"]
    
    qsos = await db.qsos.find(query, {"_id": 0}).sort("created_at", -1).to_list(1000)
    return qsos

@api_router.get("/qso/{qso_id}", response_model=QSO)
async def get_qso(qso_id: str):
    qso = await db.qsos.find_one({"id": qso_id}, {"_id": 0})
    if not qso:
        raise HTTPException(status_code=404, detail="QSO not found")
    return qso

@api_router.put("/qso/{qso_id}", response_model=QSO)
async def update_qso(qso_id: str, qso_data: QSOUpdate):
    existing = await db.qsos.find_one({"id": qso_id}, {"_id": 0})
    if not existing:
        raise HTTPException(status_code=404, detail="QSO not found")
    
    update_data = {k: v for k, v in qso_data.model_dump().items() if v is not None}
    if update_data:
        await db.qsos.update_one({"id": qso_id}, {"$set": update_data})
    
    updated = await db.qsos.find_one({"id": qso_id}, {"_id": 0})
    return updated

@api_router.delete("/qso/{qso_id}")
async def delete_qso(qso_id: str):
    result = await db.qsos.delete_one({"id": qso_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="QSO not found")
    return {"message": "QSO deleted successfully"}

@api_router.get("/qso/stats/total")
async def get_qso_stats():
    total = await db.qsos.count_documents({})
    return {"total": total}

# Root route
@api_router.get("/")
async def root():
    return {"message": "QSO Logbook API"}

# Include the router in the main app
app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=os.environ.get('CORS_ORIGINS', '*').split(','),
    allow_methods=["*"],
    allow_headers=["*"],
)

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()
