from fastapi import APIRouter, HTTPException, Request, UploadFile, File
from pydantic import BaseModel, Field
from typing import Optional
from datetime import datetime, timezone
import uuid
import jwt
import logging

from utils.db import db
from utils.auth import get_current_user, get_jwt_secret, JWT_ALGORITHM
from utils.helpers import (
    VALID_LOGBOOKS, logbook_filter, freq_to_band,
    parse_adif, qso_to_adif_string
)

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/qso")

# === Models ===
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

class UpdateNameRequest(BaseModel):
    name: str = Field("", max_length=100)

class AdifTextImport(BaseModel):
    content: str
    logbook: str = "radioamateur"

BAND_RANGES = {
    "2200m": (0.1357, 0.1378), "630m": (0.472, 0.479),
    "160m": (1.8, 2.0), "80m": (3.5, 3.8), "60m": (5.3515, 5.3665),
    "40m": (7.0, 7.2), "30m": (10.1, 10.15), "20m": (14.0, 14.35),
    "17m": (18.068, 18.168), "15m": (21.0, 21.45), "12m": (24.89, 24.99),
    "11m": (26.965, 27.405), "10m": (28.0, 29.7),
    "6m": (50.0, 54.0), "4m": (70.0, 70.5), "2m": (144.0, 148.0),
    "1.25m": (222.0, 225.0), "70cm": (430.0, 440.0),
    "33cm": (902.0, 928.0), "23cm": (1240.0, 1300.0), "13cm": (2300.0, 2450.0),
}

# Forward declaration for wavelog sync
async def _sync_qso_to_wavelog(user_id, doc, callsign):
    """Lazy import to avoid circular dependency."""
    from routes.wavelog import sync_qso_to_wavelog
    return await sync_qso_to_wavelog(user_id, doc, callsign)

# === Endpoints ===
@router.get("/check/{callsign}")
async def check_callsign_exists(callsign: str, request: Request):
    user = await get_current_user(request)
    qsos = await db.qsos.find(
        {"callsign": callsign.upper(), "owner_id": user["id"]},
        {"_id": 0, "date": 1, "frequency": 1}
    ).sort("date", -1).to_list(5)
    if qsos:
        return {"exists": True, "last_date": qsos[0]["date"], "count": len(qsos)}
    return {"exists": False}

@router.post("")
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

    config = await db.wavelog_config.find_one({"user_id": user["id"]}, {"_id": 0})
    if config and config.get("wavelog_auto_sync"):
        await _sync_qso_to_wavelog(user["id"], doc, user.get("callsign", ""))

    return doc

@router.get("/grouped")
async def get_qsos_grouped(request: Request, search: Optional[str] = None, band: Optional[str] = None, logbook: Optional[str] = "radioamateur"):
    user = await get_current_user(request)
    filters = [{"owner_id": user["id"]}]
    if logbook and logbook in VALID_LOGBOOKS:
        filters.append(logbook_filter(logbook))
    if search:
        filters.append({"$or": [
            {"callsign": {"$regex": search, "$options": "i"}},
            {"name": {"$regex": search, "$options": "i"}}
        ]})
    match_stage = {"$and": filters} if len(filters) > 1 else filters[0]

    if band and band in BAND_RANGES:
        lo, hi = BAND_RANGES[band]
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

@router.get("/history/{callsign}")
async def get_qso_history(callsign: str, request: Request):
    user = await get_current_user(request)
    qsos = await db.qsos.find(
        {"callsign": callsign.upper(), "owner_id": user["id"]},
        {"_id": 0}
    ).sort("date", -1).to_list(1000)

    if not qsos:
        raise HTTPException(status_code=404, detail="Aucun QSO trouve pour cet indicatif")

    return {
        "callsign": callsign.upper(),
        "name": next((q.get("name", "") for q in qsos if q.get("name")), ""),
        "first_contact": qsos[-1]["date"],
        "last_contact": qsos[0]["date"],
        "total_contacts": len(qsos),
        "history": qsos
    }

@router.put("/contact/{callsign}/name")
async def update_contact_name(callsign: str, data: UpdateNameRequest, request: Request):
    user = await get_current_user(request)
    result = await db.qsos.update_many(
        {"callsign": callsign.upper(), "owner_id": user["id"]},
        {"$set": {"name": data.name}}
    )
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Aucun QSO trouve pour cet indicatif")
    return {"message": "Nom mis a jour", "updated": result.modified_count}

@router.get("/export/adif")
async def export_adif(request: Request, token: Optional[str] = None):
    from fastapi.responses import Response as RawResponse
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
    lines.append("ADIF Export from QSO LOG")
    lines.append("<ADIF_VER:5>3.1.4")
    lines.append("<PROGRAMID:7>QSO_LOG")
    lines.append("<PROGRAMVERSION:3>1.0")
    lines.append("<EOH>\n")

    for qso in qsos:
        record = ""
        record += adif_field("CALL", qso.get("callsign", ""))
        raw_date = qso.get("date", "")
        if raw_date:
            record += adif_field("QSO_DATE", raw_date.replace("-", ""))
        time_utc = qso.get("time_utc", "")
        if time_utc:
            record += adif_field("TIME_ON", time_utc.replace(":", ""))
        freq = qso.get("frequency")
        if freq:
            record += adif_field("FREQ", f"{freq:.6f}")
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

@router.post("/import/adif")
async def import_adif(request: Request, file: UploadFile = File(...), logbook: Optional[str] = "radioamateur"):
    logger.info(f"=== ADIF IMPORT called, filename: {file.filename}, content_type: {file.content_type} ===")
    user = await get_current_user(request)
    content = await file.read()
    try:
        text = content.decode("utf-8")
    except UnicodeDecodeError:
        text = content.decode("latin-1")

    qsos = parse_adif(text)
    if not qsos:
        raise HTTPException(status_code=400, detail="Aucun QSO trouve dans le fichier ADIF")

    lb = logbook if logbook in VALID_LOGBOOKS else "radioamateur"
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
            "logbook": lb,
            "owner_id": user["id"],
            "owner_callsign": user["callsign"],
            "created_at": datetime.now(timezone.utc).isoformat()
        }
        await db.qsos.insert_one(doc)
        imported += 1

    return {"imported": imported, "skipped": skipped, "total": len(qsos)}

@router.post("/import/adif-text")
async def import_adif_text(data: AdifTextImport, request: Request):
    logger.info("=== ADIF TEXT IMPORT called ===")
    user = await get_current_user(request)
    qsos = parse_adif(data.content)
    if not qsos:
        raise HTTPException(status_code=400, detail="Aucun QSO trouve dans le contenu ADIF")
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

@router.get("/stats/total")
async def get_qso_stats(request: Request, logbook: Optional[str] = "radioamateur"):
    user = await get_current_user(request)
    filters = [{"owner_id": user["id"]}]
    if logbook and logbook in VALID_LOGBOOKS:
        filters.append(logbook_filter(logbook))
    query = {"$and": filters} if len(filters) > 1 else filters[0]
    total_qsos = await db.qsos.count_documents(query)
    unique_callsigns = await db.qsos.distinct("callsign", query)
    return {"total_qsos": total_qsos, "total_callsigns": len(unique_callsigns)}

@router.get("")
async def get_qsos(request: Request, search: Optional[str] = None, logbook: Optional[str] = "radioamateur"):
    user = await get_current_user(request)
    filters = [{"owner_id": user["id"]}]
    if logbook and logbook in VALID_LOGBOOKS:
        filters.append(logbook_filter(logbook))
    if search:
        filters.append({"$or": [
            {"callsign": {"$regex": search, "$options": "i"}},
            {"name": {"$regex": search, "$options": "i"}}
        ]})
    query = {"$and": filters} if len(filters) > 1 else filters[0]
    qsos = await db.qsos.find(query, {"_id": 0}).sort("created_at", -1).to_list(1000)
    return qsos

@router.put("/{qso_id}")
async def update_qso(qso_id: str, qso_data: QSOUpdate, request: Request):
    user = await get_current_user(request)
    existing = await db.qsos.find_one({"id": qso_id, "owner_id": user["id"]}, {"_id": 0})
    if not existing:
        raise HTTPException(status_code=404, detail="QSO non trouve")

    update_data = {k: v for k, v in qso_data.model_dump().items() if v is not None}
    if "callsign" in update_data:
        update_data["callsign"] = update_data["callsign"].upper()
    if update_data:
        await db.qsos.update_one({"id": qso_id}, {"$set": update_data})

    updated = await db.qsos.find_one({"id": qso_id}, {"_id": 0})
    return updated

@router.delete("/{qso_id}")
async def delete_qso(qso_id: str, request: Request):
    user = await get_current_user(request)
    result = await db.qsos.delete_one({"id": qso_id, "owner_id": user["id"]})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="QSO non trouve")
    return {"message": "QSO supprime"}
