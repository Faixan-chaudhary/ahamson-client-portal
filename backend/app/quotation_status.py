"""Single source of truth for quotation statuses, roles, and allowed actions."""
from __future__ import annotations

from typing import TYPE_CHECKING

if TYPE_CHECKING:
    from app.models import Quotation, User

# --- Statuses ---
BQ_PREPARED = "Budgetary Quote Prepared"
BQ_SUBMITTED = "Budgetary Quote Submitted"
BQ_LOST = "Budgetary Quote - Lost"

FQ_PREPARED = "Formal Quote Prepared"
FQ_PENDING = "Formal Quote Pending Approval"
FQ_APPROVED = "Formal Quote Approved"
FQ_SUBMITTED = "Formal Quote Submitted"
FQ_REVISIONS = "Formal Quote Revisions Requested"
FQ_NOT_APPROVED = "Formal Quote Not Approved"
FQ_LOST = "Formal Quote - Lost"

ORDER_DRAFT = "Order draft for OEM"
ORDER_PENDING = "Order Pending Approval"
ORDER_APPROVED = "Order Approved for OEM"
ORDER_PLACED = "Order Placed to OEM"
ORDER_DELIVERED = "Order Delivered to SI"
ORDER_REVISIONS = "Order Revisions Requested"
ORDER_NOT_APPROVED = "Order Not Approved"

DEAL_CLOSED = "Deal Closed"

ALL_STATUSES: list[str] = [
    BQ_PREPARED,
    BQ_SUBMITTED,
    BQ_LOST,
    FQ_PREPARED,
    FQ_PENDING,
    FQ_APPROVED,
    FQ_SUBMITTED,
    FQ_REVISIONS,
    FQ_NOT_APPROVED,
    FQ_LOST,
    ORDER_DRAFT,
    ORDER_PENDING,
    ORDER_APPROVED,
    ORDER_PLACED,
    ORDER_DELIVERED,
    ORDER_REVISIONS,
    ORDER_NOT_APPROVED,
    DEAL_CLOSED,
]

TERMINAL = {BQ_LOST, FQ_LOST, DEAL_CLOSED, FQ_NOT_APPROVED, ORDER_NOT_APPROVED}

EDITABLE = {
    BQ_PREPARED,
    FQ_PREPARED,
    FQ_REVISIONS,
    ORDER_DRAFT,
    ORDER_REVISIONS,
}

FOLLOWUP_ALLOWED = {
    BQ_SUBMITTED,
    FQ_SUBMITTED,
    ORDER_PLACED,
    ORDER_DELIVERED,
}

LOST_REASONS = {
    "End User Holds the Order",
    "High in Price",
    "End User decided to acquire any other product",
}

SALES_ROLES = {"admin", "manager"}
FINANCE_ROLES = {"admin", "finance_manager"}
SALES_HEAD_ROLES = {"admin", "sales_head"}

# Status queues used by list filters / KPI strip
FINANCE_QUEUE_STATUSES = {FQ_PENDING}
SALES_HEAD_QUEUE_STATUSES = {ORDER_PENDING}
# Sales Person next-steps (not soft follow-ups alone)
SALES_QUEUE_STATUSES = {
    BQ_PREPARED,
    BQ_SUBMITTED,
    FQ_PREPARED,
    FQ_REVISIONS,
    FQ_APPROVED,
    FQ_SUBMITTED,
    FQ_NOT_APPROVED,
    ORDER_DRAFT,
    ORDER_REVISIONS,
    ORDER_APPROVED,
    ORDER_PLACED,
    ORDER_DELIVERED,
    ORDER_NOT_APPROVED,
}


def _role_ok(user: User, roles: set[str]) -> bool:
    return user.role in roles


def primary_action_hint(actions: list[str]) -> str | None:
    """Short label for list UI — highest-priority next step."""
    priority = [
        ("finance-review", "Finance approval needed"),
        ("sales-head-review", "Sales Head approval needed"),
        ("submit-finance", "Submit to Finance"),
        ("submit-order-approval", "Submit to Sales Head"),
        ("start-formal", "Start Formal Quote"),
        ("submit-budgetary", "Submit Budgetary Quote"),
        ("submit-formal", "Submit Formal to SI"),
        ("oem-draft", "Draft OEM order"),
        ("place-oem-order", "Place OEM order"),
        ("deliver", "Record delivery"),
        ("close-deal", "Close deal"),
        ("reopen-revisions", "Reopen revisions"),
        ("edit", "Needs edits"),
        ("followups", "Follow-up available"),
        ("close-lost", "Can mark lost"),
        ("open-formal-child", "Open formal quote"),
    ]
    for key, label in priority:
        if key in actions:
            return label
    return None


def allowed_actions(row: Quotation, user: User, *, has_formal_child: bool = False) -> list[str]:
    """Return action keys the current user may run on this quotation."""
    status = row.status or ""
    phase = row.phase or ""
    actions: list[str] = []

    if status in EDITABLE and _role_ok(user, SALES_ROLES):
        actions.append("edit")

    if status == BQ_PREPARED and _role_ok(user, SALES_ROLES):
        actions.append("submit-budgetary")
        actions.append("close-lost")

    if status in FOLLOWUP_ALLOWED and _role_ok(user, SALES_ROLES):
        actions.append("followups")

    if status == BQ_SUBMITTED and _role_ok(user, SALES_ROLES):
        if not has_formal_child:
            actions.append("start-formal")
            actions.append("close-lost")
        else:
            actions.append("open-formal-child")

    if status in {FQ_PREPARED, FQ_REVISIONS} and _role_ok(user, SALES_ROLES):
        actions.append("submit-finance")

    if status == FQ_PENDING and _role_ok(user, FINANCE_ROLES):
        actions.append("finance-review")

    if status == FQ_APPROVED and _role_ok(user, SALES_ROLES):
        actions.append("submit-formal")

    if status == FQ_SUBMITTED and _role_ok(user, SALES_ROLES):
        actions.append("oem-draft")
        actions.append("close-lost")

    if status in {ORDER_DRAFT, ORDER_REVISIONS} and _role_ok(user, SALES_ROLES):
        actions.append("submit-order-approval")

    if status == ORDER_PENDING and _role_ok(user, SALES_HEAD_ROLES):
        actions.append("sales-head-review")

    if status == ORDER_APPROVED and _role_ok(user, SALES_ROLES):
        actions.append("place-oem-order")

    if status == ORDER_PLACED and _role_ok(user, SALES_ROLES):
        actions.append("deliver")

    if status == ORDER_DELIVERED and _role_ok(user, SALES_ROLES):
        actions.append("close-deal")

    # Recovery from hard reject → back to revisions so work can continue
    if status == FQ_NOT_APPROVED and _role_ok(user, SALES_ROLES):
        actions.append("reopen-revisions")
    if status == ORDER_NOT_APPROVED and _role_ok(user, SALES_ROLES):
        actions.append("reopen-revisions")

    if phase == "formal" and status in {FQ_PREPARED, FQ_REVISIONS} and "edit" not in actions:
        if _role_ok(user, SALES_ROLES):
            actions.append("edit")

    return actions
