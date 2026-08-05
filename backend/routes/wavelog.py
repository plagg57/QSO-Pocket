from fastapi import APIRouter, HTTPException, Request
from pydantic import BaseModel
from datetime import datetime, timezone
from typing import Optional
import uuid
import httpx
import logging

from utils.db import db
from utils.auth import get_current_user
from utils.helpers import VALID_LOGBOOKS, freq_to_band, qso_to_adif_string

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/wavelog")

class WavelogConfig(BaseModel):
    wavelog_url: str
    wavelog_api_key: str
    wavelog_station_id: str = "1"
    wavelog_auto_sync: bool = False

@router.get("/config")
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

@router.put("/config")
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
    return {"message": "Configuration Wavelog sauvegardee"}

@router.post("/test")
async def test_wavelog_connection(request: Request):
    user = await get_current_user(request)
    config = await db.wavelog_config.find_one({"user_id": user["id"]}, {"_id": 0})
    if not config or not config.get("wavelog_url"):
        raise HTTPException(status_code=400, detail="Wavelog non configure")

    url = config["wavelog_url"].rstrip("/")
    key = config["wavelog_api_key"]
    try:
        async with httpx.AsyncClient(timeout=10) as client:
            res = await client.get(f"{url}/api/statistics/{key}", headers={"Accept": "application/json"})
            if res.status_code == 200:
                return {"success": True, "message": "Connexion reussie", "data": res.json()}
            else:
                return {"success": False, "message": f"Erreur {res.status_code}: {res.text[:200]}"}
    except httpx.TimeoutException:
        return {"success": False, "message": "Timeout — verifiez l'URL"}
    except Exception as e:
        return {"success": False, "message": f"Erreur: {str(e)[:200]}"}

async def sync_qso_to_wavelog(user_id: str, qso: dict, my_callsign: str):
    """Sync a single QSO to Wavelog. Returns (success, message)."""
    config = await db.wavelog_config.find_one({"user_id": user_id}, {"_id": 0})
    if not config or not config.get("wavelog_url") or not config.get("wavelog_api_key"):
        return False, "Wavelog non configure"

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
                await db.wavelog_sync_log.insert_one({
                    "user_id": user_id,
                    "qso_id": qso.get("id"),
                    "callsign": qso.get("callsign"),
                    "status": "success",
                    "message": "Synchronise",
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

@router.post("/sync")
async def sync_all_to_wavelog(request: Request):
    user = await get_current_user(request)
    config = await db.wavelog_config.find_one({"user_id": user["id"]}, {"_id": 0})
    if not config or not config.get("wavelog_url"):
        raise HTTPException(status_code=400, detail="Wavelog non configure")

    synced_ids = await db.wavelog_sync_log.distinct("qso_id", {"user_id": user["id"], "status": "success"})
    qsos = await db.qsos.find({"owner_id": user["id"], "id": {"$nin": synced_ids}}, {"_id": 0}).to_list(5000)

    if not qsos:
        return {"synced": 0, "errors": 0, "message": "Tous les QSOs sont deja synchronises"}

    synced = 0
    errors = 0
    for qso in qsos:
        ok, msg = await sync_qso_to_wavelog(user["id"], qso, user.get("callsign", ""))
        if ok:
            synced += 1
        else:
            errors += 1

    return {"synced": synced, "errors": errors, "total": len(qsos), "message": f"{synced} synchronise(s), {errors} erreur(s)"}

@router.get("/log")
async def get_wavelog_sync_log(request: Request):
    user = await get_current_user(request)
    logs = await db.wavelog_sync_log.find({"user_id": user["id"]}, {"_id": 0}).sort("timestamp", -1).to_list(50)
    return logs

@router.delete("/log")
async def clear_wavelog_sync_log(request: Request):
    user = await get_current_user(request)
    await db.wavelog_sync_log.delete_many({"user_id": user["id"]})
    return {"message": "Journal vide"}

@router.post("/import")
async def import_from_wavelog(request: Request):
    """Import QSOs from Wavelog into QSO Pocket."""
    user = await get_current_user(request)
    config = await db.wavelog_config.find_one({"user_id": user["id"]}, {"_id": 0})
    if not config or not config.get("wavelog_url") or not config.get("wavelog_api_key"):
        raise HTTPException(status_code=400, detail="Wavelog non configure")

    url = config["wavelog_url"].rstrip("/")
    key = config["wavelog_api_key"]

    try:
        async with httpx.AsyncClient(timeout=30) as client:
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

    entries = data if isinstance(data, list) else data.get("logbook", data.get("qsos", []))
    if not isinstance(entries, list):
        raise HTTPException(status_code=502, detail="Format de reponse Wavelog inattendu")

    imported = 0
    skipped = 0
    for entry in entries:
        callsign = (entry.get("COL_CALL") or entry.get("call") or entry.get("callsign") or "").upper().strip()
        if not callsign:
            skipped += 1
            continue

        raw_date = entry.get("COL_QSO_DATE") or entry.get("qso_date") or entry.get("date") or ""
        if len(raw_date) == 8:
            date_str = f"{raw_date[:4]}-{raw_date[4:6]}-{raw_date[6:8]}"
        else:
            date_str = raw_date[:10] if raw_date else datetime.now(timezone.utc).strftime("%Y-%m-%d")

        raw_time = entry.get("COL_TIME_ON") or entry.get("time_on") or entry.get("time_utc") or ""
        time_str = f"{raw_time[:2]}:{raw_time[2:4]}" if len(raw_time) >= 4 else raw_time[:5] if raw_time else ""

        freq_raw = entry.get("COL_FREQ") or entry.get("freq") or entry.get("frequency") or "0"
        try:
            freq = float(freq_raw)
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

        existing = await db.qsos.find_one({
            "owner_id": user["id"],
            "callsign": callsign,
            "date": date_str,
            "time_utc": time_str
        })
        if existing:
            skipped += 1
            continue

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

    return {"imported": imported, "skipped": skipped, "message": f"{imported} importe(s), {skipped} ignore(s)"}
