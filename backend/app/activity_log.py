"""Shared activity-log helpers. Logs are returned only to admin users."""
from __future__ import annotations

import json
from datetime import UTC, datetime
from typing import Any

from app.models import User
from app.security import iso


def loads_logs(raw: str | None) -> list[dict[str, Any]]:
    if not raw:
        return []
    try:
        data = json.loads(raw)
        return data if isinstance(data, list) else []
    except json.JSONDecodeError:
        return []


def dumps_logs(items: list[dict[str, Any]]) -> str:
    return json.dumps(items)


def append_activity(row: Any, user: User | None, action: str, detail: str = "") -> None:
    items = loads_logs(getattr(row, "activity_logs_json", None))
    items.append({
        "action": action,
        "detail": detail or "",
        "by": user.name if user else "",
        "role": user.role if user else "",
        "at": datetime.now(UTC).isoformat().replace("+00:00", "Z"),
    })
    row.activity_logs_json = dumps_logs(items)


def logs_for_viewer(
    row: Any,
    viewer: User | None,
    *,
    fallback_created_action: str = "Created",
) -> list[dict[str, Any]]:
    """Return activity logs for any authenticated viewer (empty if anonymous)."""
    if not viewer:
        return []
    stored = loads_logs(getattr(row, "activity_logs_json", None))
    if stored:
        return stored
    created_at = getattr(row, "created_at", None)
    if not created_at:
        return []
    return [{
        "action": fallback_created_action,
        "detail": "",
        "by": "",
        "role": "",
        "at": iso(created_at) or "",
    }]
