from typing import Optional
from datetime import datetime

from fastapi import APIRouter, Depends, Query, Request
from sqlalchemy import select, func

from backend.app.db.session import async_session_factory
from backend.app.hardness.state_store import StateStore
from backend.app.models.audit import AuditEntry as AuditModel

router = APIRouter()


async def get_state_store(request: Request) -> StateStore:
    async with async_session_factory() as session:
        store = StateStore(session)
        yield store
        await session.commit()


@router.get("/audit")
async def query_audit_log(
    request: Request,
    state_store: StateStore = Depends(get_state_store),
    session_id: Optional[str] = Query(None),
    start_time: Optional[str] = Query(None),
    end_time: Optional[str] = Query(None),
    cursor: Optional[str] = Query(None, description="Cursor for pagination (entry_id of last item)"),
    limit: int = Query(100, ge=1, le=1000),
):
    entries = []
    total = 0
    has_more = False
    next_cursor = None

    # Query in-memory logs for recent entries (governance + tool_registry)
    governance = getattr(request.app.state, "governance", None)
    tool_registry = getattr(request.app.state, "tool_registry", None)
    in_memory_entries = []

    if governance:
        for entry in governance.audit_log[-50:]:
            ts = entry.timestamp
            if start_time and ts < start_time:
                continue
            if end_time and ts > end_time:
                continue
            if session_id and entry.session_id != session_id:
                continue
            in_memory_entries.append({
                "entry_id": entry.entry_id,
                "timestamp": ts,
                "session_id": entry.session_id,
                "action": entry.action,
                "actor": entry.actor,
                "result": entry.result,
                "risk_level": entry.risk_level.value if hasattr(entry.risk_level, 'value') else str(entry.risk_level),
            })

    if tool_registry:
        for entry in tool_registry.audit_log[-50:]:
            ts = entry.get("timestamp", "")
            if start_time and ts < start_time:
                continue
            if end_time and ts > end_time:
                continue
            if session_id and entry.get("session_id") != session_id:
                continue
            in_memory_entries.append({
                "entry_id": entry.get("entry_id", ts),
                "timestamp": ts,
                "session_id": entry.get("session_id", ""),
                "action": entry.get("tool", entry.get("action", "")),
                "actor": entry.get("actor", "system"),
                "result": entry.get("result", "executed"),
                "risk_level": entry.get("risk_level", "low"),
            })

    # Query database for persisted entries
    try:
        session = state_store.session
        query = select(AuditModel).order_by(AuditModel.created_at.desc())

        if session_id:
            query = query.where(AuditModel.session_id == session_id)
        if start_time:
            query = query.where(AuditModel.created_at >= start_time)
        if end_time:
            query = query.where(AuditModel.created_at <= end_time)

        # Count
        count_query = select(func.count(AuditModel.entry_id))
        if session_id:
            count_query = count_query.where(AuditModel.session_id == session_id)
        total_result = await session.execute(count_query)
        total = total_result.scalar() or 0

        # Paginate
        query = query.limit(limit + 1)
        result = await session.execute(query)
        db_entries = result.scalars().all()

        has_more = len(db_entries) > limit
        if has_more:
            db_entries = db_entries[:limit]

        for e in db_entries:
            entries.append({
                "entry_id": e.entry_id,
                "timestamp": e.created_at.isoformat() if e.created_at else None,
                "session_id": e.session_id,
                "action": e.action,
                "actor": e.actor,
                "result": e.result,
                "risk_level": e.risk_level,
            })

        if db_entries:
            next_cursor = db_entries[-1].entry_id

    except Exception:
        pass  # Graceful degradation if DB is unavailable

    # Merge in-memory entries not already in DB results
    db_ids = {e["entry_id"] for e in entries}
    for mem_entry in in_memory_entries:
        if mem_entry["entry_id"] not in db_ids:
            entries.append(mem_entry)

    entries = entries[:limit]
    total = max(total, len(in_memory_entries))

    return {
        "entries": entries,
        "total": total,
        "cursor": cursor,
        "next_cursor": next_cursor,
        "has_more": has_more,
        "filters": {
            "session_id": session_id,
            "start_time": start_time,
            "end_time": end_time,
        },
    }
