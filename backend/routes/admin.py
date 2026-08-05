from fastapi import APIRouter, HTTPException, Request
from typing import Optional
import logging

from utils.db import db
from utils.auth import require_admin

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/admin")

@router.get("/stats")
async def admin_stats(request: Request):
    await require_admin(request)
    total_users = await db.users.count_documents({})
    total_qsos = await db.qsos.count_documents({})
    return {"total_users": total_users, "total_qsos": total_qsos}

@router.get("/users")
async def admin_list_users(request: Request, search: Optional[str] = None):
    await require_admin(request)
    query = {}
    if search:
        query["$or"] = [
            {"callsign": {"$regex": search, "$options": "i"}},
            {"email": {"$regex": search, "$options": "i"}}
        ]
    users = await db.users.find(query, {"_id": 0, "password_hash": 0}).sort("created_at", -1).to_list(1000)
    for u in users:
        u["qso_count"] = await db.qsos.count_documents({"owner_id": u["id"]})
    return users

@router.get("/users/{user_id}/qsos")
async def admin_user_qsos(user_id: str, request: Request):
    await require_admin(request)
    user = await db.users.find_one({"id": user_id}, {"_id": 0, "password_hash": 0})
    if not user:
        raise HTTPException(status_code=404, detail="Utilisateur non trouve")
    qsos = await db.qsos.find({"owner_id": user_id}, {"_id": 0}).sort("date", -1).to_list(1000)
    return {"user": user, "qsos": qsos}

@router.get("/users/{user_id}/grouped")
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

@router.get("/users/{user_id}/history/{callsign}")
async def admin_user_history(user_id: str, callsign: str, request: Request):
    await require_admin(request)
    qsos = await db.qsos.find(
        {"callsign": callsign.upper(), "owner_id": user_id}, {"_id": 0}
    ).sort("date", -1).to_list(1000)
    if not qsos:
        raise HTTPException(status_code=404, detail="Aucun QSO trouve")
    return {
        "callsign": callsign.upper(),
        "name": next((q.get("name", "") for q in qsos if q.get("name")), ""),
        "first_contact": qsos[-1]["date"],
        "last_contact": qsos[0]["date"],
        "total_contacts": len(qsos),
        "history": qsos
    }

@router.delete("/qso/{qso_id}")
async def admin_delete_qso(qso_id: str, request: Request):
    await require_admin(request)
    result = await db.qsos.delete_one({"id": qso_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="QSO non trouve")
    return {"message": "QSO supprime"}

@router.delete("/users/{user_id}")
async def admin_delete_user(user_id: str, request: Request):
    await require_admin(request)
    user = await db.users.find_one({"id": user_id}, {"_id": 0})
    if not user:
        raise HTTPException(status_code=404, detail="Utilisateur non trouve")
    if user.get("role") == "admin":
        raise HTTPException(status_code=400, detail="Impossible de supprimer un administrateur")
    await db.qsos.delete_many({"owner_id": user_id})
    await db.users.delete_one({"id": user_id})
    return {"message": f"Utilisateur {user.get('callsign')} supprime"}
