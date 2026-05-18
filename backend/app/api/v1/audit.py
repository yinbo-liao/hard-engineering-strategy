from typing import Optional
from fastapi import APIRouter, Query, Request

router = APIRouter()


@router.get("/audit")
async def query_audit_log(
    request: Request,
    session_id: Optional[str] = Query(None),
    start_time: Optional[str] = Query(None),
    end_time: Optional[str] = Query(None),
    cursor: Optional[str] = Query(None, description="Cursor for pagination (entry_id of last item)"),
    limit: int = Query(100, ge=1, le=1000),
):
    governance = getattr(request.app.state, "governance", None)
    tool_registry = getattr(request.app.state, "tool_registry", None)

    entries = []

    if governance:
        for entry in governance.audit_log[-limit:]:
            if entry.action == "unknown":
                continue
            entries.append({
                "entry_id": entry.entry_id,
                "timestamp": entry.timestamp,
                "session_id": entry.session_id,
                "action": entry.action,
                "actor": entry.actor,
                "result": entry.result,
                "risk_level": entry.risk_level.value,
            })

    if tool_registry:
        for entry in tool_registry.audit_log[-limit:]:
            action = entry.get("tool", entry.get("action", ""))
            if action == "unknown" or not action:
                continue
            entries.append({
                "entry_id": entry.get("entry_id", entry.get("timestamp", "")),
                "timestamp": entry.get("timestamp", ""),
                "session_id": entry.get("session_id", ""),
                "action": action,
                "actor": entry.get("actor", "system"),
                "result": entry.get("result", "executed"),
                "risk_level": entry.get("risk_level", "low"),
            })

    entries = entries[-limit:]

    if session_id:
        entries = [e for e in entries if e.get("session_id") == session_id]

    total = len(entries)

    return {
        "entries": entries,
        "total": total,
        "cursor": cursor,
        "next_cursor": None,
        "has_more": False,
        "filters": {
            "session_id": session_id,
            "start_time": start_time,
            "end_time": end_time,
        },
    }
