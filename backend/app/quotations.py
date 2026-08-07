"""Budgetary & Formal quotation workflow (application steps from client slides)."""
from __future__ import annotations

import json
from datetime import UTC, datetime

from fastapi import HTTPException, status
from sqlalchemy import func
from sqlalchemy.orm import Session

from app.models import Quotation, User
from app.quotation_status import (
    BQ_LOST,
    BQ_PREPARED,
    BQ_SUBMITTED,
    DEAL_CLOSED,
    EDITABLE,
    FINANCE_QUEUE_STATUSES,
    FINANCE_ROLES,
    FOLLOWUP_ALLOWED,
    FQ_APPROVED,
    FQ_LOST,
    FQ_NOT_APPROVED,
    FQ_PENDING,
    FQ_PREPARED,
    FQ_REVISIONS,
    FQ_SUBMITTED,
    LOST_REASONS,
    ORDER_APPROVED,
    ORDER_DELIVERED,
    ORDER_DRAFT,
    ORDER_NOT_APPROVED,
    ORDER_PENDING,
    ORDER_PLACED,
    ORDER_REVISIONS,
    SALES_HEAD_QUEUE_STATUSES,
    SALES_HEAD_ROLES,
    SALES_QUEUE_STATUSES,
    SALES_ROLES,
    allowed_actions,
    primary_action_hint,
)
from app.schemas import (
    QuotationApprovalAction,
    QuotationCloseLost,
    QuotationCreate,
    QuotationDelivery,
    QuotationFollowUpCreate,
    QuotationListResponse,
    QuotationOrderDraft,
    QuotationOut,
    QuotationPaymentClose,
    QuotationSubmit,
    QuotationUpdate,
)
from app.security import iso


def _loads(raw: str | None) -> list:
    if not raw:
        return []
    try:
        data = json.loads(raw)
        return data if isinstance(data, list) else []
    except json.JSONDecodeError:
        return []


def _dumps(items: list) -> str:
    return json.dumps(items)


def _require_role(user: User, allowed: set[str]) -> None:
    if user.role not in allowed:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Not allowed for this action")


def _append_activity(row: Quotation, user: User, action: str, detail: str = "") -> None:
    from app.activity_log import append_activity

    append_activity(row, user, action, detail)


def _activity_logs_for_out(row: Quotation, viewer: User | None = None) -> list:
    from app.activity_log import loads_logs

    if not viewer:
        return []
    stored = loads_logs(getattr(row, "activity_logs_json", None))
    if stored:
        return stored
    # Fallback timeline for older rows created before activity logging
    logs: list[dict] = []
    if row.created_at:
        logs.append({
            "action": "Created quotation",
            "detail": f"Status: {row.status}",
            "by": "",
            "role": "",
            "at": iso(row.created_at) or "",
        })
    for f in loads_logs(row.followups_json):
        logs.append({
            "action": "Follow-up added",
            "detail": f.get("remarks") or "",
            "by": f.get("by") or "",
            "role": "",
            "at": f.get("at") or f.get("date") or "",
        })
    for a in loads_logs(row.approvals_json):
        logs.append({
            "action": f"Approval: {a.get('action', '')}",
            "detail": a.get("remarks") or a.get("type") or "",
            "by": a.get("by") or "",
            "role": a.get("role") or "",
            "at": a.get("at") or a.get("date") or "",
        })
    if row.closure_reason:
        logs.append({
            "action": "Marked lost / closed",
            "detail": f"{row.closure_reason}. {row.closure_remarks or ''}".strip(),
            "by": "",
            "role": "",
            "at": row.closure_date or iso(row.updated_at) or "",
        })
    return logs


def _next_quote_number(db: Session, phase: str) -> str:
    prefix = "BQ" if phase == "budgetary" else "FQ"
    year = datetime.now(UTC).year
    count = db.query(func.count(Quotation.id)).scalar() or 0
    return f"{prefix}-{year}-{count + 1:04d}"


def _formal_child(db: Session, parent_id: int) -> Quotation | None:
    return db.query(Quotation).filter(Quotation.parent_quote_id == parent_id).first()


def to_quotation_out(
    row: Quotation,
    user: User | None = None,
    db: Session | None = None,
) -> QuotationOut:
    child_id = None
    child_number = ""
    parent_number = ""
    has_child = False
    if db is not None and row.phase == "budgetary":
        child = _formal_child(db, row.id)
        if child:
            child_id = child.id
            child_number = child.quote_number or ""
            has_child = True
    if db is not None and row.parent_quote_id:
        parent = db.query(Quotation).filter(Quotation.id == row.parent_quote_id).first()
        if parent:
            parent_number = parent.quote_number or ""
    actions = (
        allowed_actions(row, user, has_formal_child=has_child)
        if user is not None
        else []
    )
    hint = primary_action_hint(actions) if actions else None
    return QuotationOut(
        id=row.id,
        quote_number=row.quote_number,
        phase=row.phase,
        status=row.status,
        quotation_date=row.quotation_date or "",
        sales_person=row.sales_person or "",
        partner=row.partner or "",
        end_user=row.end_user or "",
        country=row.country or "",
        brand=row.brand or "",
        products=row.products or "",
        deal_value=row.deal_value or "",
        gp_value=row.gp_value or "",
        contact_person=row.contact_person or "",
        closure_date=row.closure_date or "",
        probability=row.probability or "",
        details=row.details or "",
        si_attachment_name=row.si_attachment_name or "",
        si_attachment_note=row.si_attachment_note or "",
        quotation_submission_date=row.quotation_submission_date or "",
        closure_reason=row.closure_reason or "",
        closure_remarks=row.closure_remarks or "",
        parent_quote_id=row.parent_quote_id,
        child_quote_id=child_id,
        parent_quote_number=parent_number,
        child_quote_number=child_number,
        formal_submission_date=row.formal_submission_date or "",
        po_file_name=row.po_file_name or "",
        po_note=row.po_note or "",
        oem=row.oem or "",
        order_date=row.order_date or "",
        order_details=row.order_details or "",
        expected_delivery_date=row.expected_delivery_date or "",
        order_submission_date=row.order_submission_date or "",
        order_remarks=row.order_remarks or "",
        invoice_file_name=row.invoice_file_name or "",
        delivery_docs_note=row.delivery_docs_note or "",
        delivery_date=row.delivery_date or "",
        delivery_remarks=row.delivery_remarks or "",
        payment_received_date=row.payment_received_date or "",
        payment_docs_note=row.payment_docs_note or "",
        payment_remarks=row.payment_remarks or "",
        followups=_loads(row.followups_json),
        approvals=_loads(row.approvals_json),
        activity_logs=_activity_logs_for_out(row, viewer=user),
        allowed_actions=actions,
        action_hint=hint or "",
        created_at=iso(row.created_at) or "",
        updated_at=iso(row.updated_at) or "",
        created_by_id=row.created_by_id,
    )


def _get(db: Session, quote_id: int) -> Quotation:
    row = db.query(Quotation).filter(Quotation.id == quote_id).first()
    if not row:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Quotation not found")
    return row


def _matches_multi(value: str | None, filter_value: str | None) -> bool:
    if not filter_value or filter_value == "all":
        return True
    options = {part.strip().lower() for part in filter_value.split(",") if part.strip()}
    if not options:
        return True
    return (value or "").strip().lower() in options


def list_quotations(
    db: Session,
    search: str | None = None,
    status_filter: str | None = None,
    phase: str | None = None,
    queue: str | None = None,
    user: User | None = None,
) -> QuotationListResponse:
    rows = db.query(Quotation).order_by(Quotation.updated_at.desc()).all()
    items: list[Quotation] = []
    q = (search or "").strip().lower()
    queue_key = (queue or "").strip().lower()
    for row in rows:
        if not _matches_multi(row.phase, phase):
            continue
        if not _matches_multi(row.status, status_filter):
            continue
        if queue_key == "finance" and (row.status or "") not in FINANCE_QUEUE_STATUSES:
            continue
        if queue_key == "sales_head" and (row.status or "") not in SALES_HEAD_QUEUE_STATUSES:
            continue
        if queue_key == "sales" and (row.status or "") not in SALES_QUEUE_STATUSES:
            continue
        if q:
            blob = " ".join([
                row.quote_number, row.partner, row.end_user, row.sales_person,
                row.brand, row.products, row.contact_person, row.status, row.details,
            ]).lower()
            if q not in blob:
                continue
        items.append(row)

    outs = [to_quotation_out(r, user=user, db=db) for r in items]
    if queue_key == "action" and user is not None:
        outs = [o for o in outs if o.allowed_actions]
    return QuotationListResponse(items=outs, total=len(outs))


def _normalize_quote_date(raw: str | None) -> str:
    """Accept YYYY-MM-DD; reject absurd years (browser autofill often injects junk dates)."""
    today = datetime.now(UTC).date()
    text = (raw or "").strip()
    if not text:
        return today.isoformat()
    try:
        parsed = datetime.fromisoformat(text[:10]).date()
    except ValueError:
        return today.isoformat()
    if parsed.year < 2000 or parsed.year > today.year + 1:
        return today.isoformat()
    return parsed.isoformat()


def create_budgetary_quotation(db: Session, payload: QuotationCreate, user: User) -> QuotationOut:
    _require_role(user, SALES_ROLES)
    if not (payload.partner or "").strip() or not (payload.end_user or "").strip():
        raise HTTPException(status_code=400, detail="Partner and End User are required")
    row = Quotation(
        quote_number=_next_quote_number(db, "budgetary"),
        phase="budgetary",
        status=BQ_PREPARED,
        quotation_date=_normalize_quote_date(payload.quotation_date),
        sales_person=payload.sales_person or user.name,
        partner=payload.partner,
        end_user=payload.end_user,
        country=payload.country,
        brand=payload.brand,
        products=payload.products,
        deal_value=payload.deal_value,
        gp_value=payload.gp_value,
        contact_person=payload.contact_person,
        closure_date=payload.closure_date,
        probability=payload.probability,
        details=payload.details,
        si_attachment_name=payload.si_attachment_name,
        si_attachment_note=payload.si_attachment_note,
        created_by_id=user.id,
        activity_logs_json="[]",
    )
    _append_activity(row, user, "Created budgetary quote", f"Quote {row.quote_number}")
    db.add(row)
    db.commit()
    db.refresh(row)
    return to_quotation_out(row, user=user, db=db)


def update_quotation(db: Session, quote_id: int, payload: QuotationUpdate, user: User) -> QuotationOut:
    _require_role(user, SALES_ROLES)
    row = _get(db, quote_id)
    if row.status not in EDITABLE:
        raise HTTPException(status_code=400, detail="Quotation cannot be edited in the current status")

    data = payload.model_dump(exclude_unset=True)
    for key, value in data.items():
        if hasattr(row, key) and value is not None:
            setattr(row, key, value)
    _append_activity(row, user, "Updated quote details")
    db.add(row)
    db.commit()
    db.refresh(row)
    return to_quotation_out(row, user=user, db=db)


def submit_budgetary(db: Session, quote_id: int, payload: QuotationSubmit, user: User) -> QuotationOut:
    _require_role(user, SALES_ROLES)
    row = _get(db, quote_id)
    if row.phase != "budgetary" or row.status != BQ_PREPARED:
        raise HTTPException(status_code=400, detail="Only prepared budgetary quotes can be submitted")
    row.quotation_submission_date = payload.submission_date or datetime.now(UTC).date().isoformat()
    row.status = BQ_SUBMITTED
    _append_activity(row, user, "Submitted budgetary quote", f"Submission date: {row.quotation_submission_date}")
    db.add(row)
    db.commit()
    db.refresh(row)
    return to_quotation_out(row, user=user, db=db)


def add_followup(db: Session, quote_id: int, payload: QuotationFollowUpCreate, user: User) -> QuotationOut:
    _require_role(user, SALES_ROLES)
    row = _get(db, quote_id)
    if row.status not in FOLLOWUP_ALLOWED:
        raise HTTPException(status_code=400, detail="Follow-ups not allowed in current status")
    items = _loads(row.followups_json)
    items.append({
        "date": payload.followup_date or datetime.now(UTC).date().isoformat(),
        "remarks": payload.remarks,
        "by": user.name,
        "at": datetime.now(UTC).isoformat().replace("+00:00", "Z"),
    })
    row.followups_json = _dumps(items)
    _append_activity(row, user, "Added follow-up", payload.remarks or "")
    db.add(row)
    db.commit()
    db.refresh(row)
    return to_quotation_out(row, user=user, db=db)


def close_budgetary_lost(db: Session, quote_id: int, payload: QuotationCloseLost, user: User) -> QuotationOut:
    _require_role(user, SALES_ROLES)
    row = _get(db, quote_id)
    if row.phase != "budgetary" or row.status not in {BQ_PREPARED, BQ_SUBMITTED}:
        raise HTTPException(status_code=400, detail="Only open budgetary quotes can be marked lost")
    if _formal_child(db, row.id):
        raise HTTPException(status_code=400, detail="Cannot mark lost — a formal quote already exists for this entry")
    if payload.reason not in LOST_REASONS:
        raise HTTPException(status_code=400, detail="Invalid lost reason")
    row.closure_date = payload.closure_date or datetime.now(UTC).date().isoformat()
    row.closure_reason = payload.reason
    row.closure_remarks = payload.remarks
    row.status = BQ_LOST
    _append_activity(row, user, "Marked budgetary quote as lost", f"{payload.reason}. {payload.remarks or ''}".strip())
    db.add(row)
    db.commit()
    db.refresh(row)
    return to_quotation_out(row, user=user, db=db)


def start_formal_from_budgetary(db: Session, quote_id: int, user: User) -> QuotationOut:
    _require_role(user, SALES_ROLES)
    parent = _get(db, quote_id)
    if parent.phase != "budgetary" or parent.status != BQ_SUBMITTED:
        raise HTTPException(status_code=400, detail="Formal quote can start from a submitted budgetary quote")
    existing = db.query(Quotation).filter(Quotation.parent_quote_id == parent.id).first()
    if existing:
        return to_quotation_out(existing, user=user, db=db)

    row = Quotation(
        quote_number=_next_quote_number(db, "formal"),
        phase="formal",
        status=FQ_PREPARED,
        parent_quote_id=parent.id,
        quotation_date=datetime.now(UTC).date().isoformat(),
        sales_person=parent.sales_person or user.name,
        partner=parent.partner,
        end_user=parent.end_user,
        country=parent.country,
        brand=parent.brand,
        products=parent.products,
        deal_value=parent.deal_value,
        gp_value=parent.gp_value,
        contact_person=parent.contact_person,
        closure_date=parent.closure_date,
        probability=parent.probability,
        details=parent.details,
        created_by_id=user.id,
        activity_logs_json="[]",
    )
    _append_activity(parent, user, "Started formal quotation", f"Created {row.quote_number}")
    _append_activity(row, user, "Created formal quote", f"From {parent.quote_number}")
    db.add(parent)
    db.add(row)
    db.commit()
    db.refresh(row)
    return to_quotation_out(row, user=user, db=db)


def submit_formal_for_approval(db: Session, quote_id: int, user: User) -> QuotationOut:
    _require_role(user, SALES_ROLES)
    row = _get(db, quote_id)
    if row.phase != "formal" or row.status not in {FQ_PREPARED, FQ_REVISIONS}:
        raise HTTPException(status_code=400, detail="Formal quote not ready for approval")
    row.status = FQ_PENDING
    _append_activity(row, user, "Submitted formal quote for finance approval")
    db.add(row)
    db.commit()
    db.refresh(row)
    return to_quotation_out(row, user=user, db=db)


def finance_review(db: Session, quote_id: int, payload: QuotationApprovalAction, user: User) -> QuotationOut:
    _require_role(user, FINANCE_ROLES)
    row = _get(db, quote_id)
    if row.status != FQ_PENDING:
        raise HTTPException(status_code=400, detail="No formal quote pending finance approval")
    action = payload.action
    if action not in {"approve", "send_back", "reject"}:
        raise HTTPException(status_code=400, detail="Invalid approval action")
    items = _loads(row.approvals_json)
    items.append({
        "type": "formal_quote",
        "date": payload.date or datetime.now(UTC).date().isoformat(),
        "action": action,
        "remarks": payload.remarks,
        "by": user.name,
        "role": user.role,
        "at": datetime.now(UTC).isoformat().replace("+00:00", "Z"),
    })
    row.approvals_json = _dumps(items)
    if action == "approve":
        row.status = FQ_APPROVED
    elif action == "send_back":
        row.status = FQ_REVISIONS
    else:
        row.status = FQ_NOT_APPROVED
    _append_activity(row, user, f"Finance review: {action}", payload.remarks or "")
    db.add(row)
    db.commit()
    db.refresh(row)
    return to_quotation_out(row, user=user, db=db)


def submit_formal_to_si(db: Session, quote_id: int, payload: QuotationSubmit, user: User) -> QuotationOut:
    _require_role(user, SALES_ROLES)
    row = _get(db, quote_id)
    if row.status != FQ_APPROVED:
        raise HTTPException(status_code=400, detail="Only approved formal quotes can be submitted to SI")
    row.formal_submission_date = payload.submission_date or datetime.now(UTC).date().isoformat()
    row.status = FQ_SUBMITTED
    _append_activity(row, user, "Submitted formal quote to SI", f"Date: {row.formal_submission_date}")
    db.add(row)
    db.commit()
    db.refresh(row)
    return to_quotation_out(row, user=user, db=db)


def close_formal_lost(db: Session, quote_id: int, payload: QuotationCloseLost, user: User) -> QuotationOut:
    _require_role(user, SALES_ROLES)
    row = _get(db, quote_id)
    if row.phase != "formal" or row.status != FQ_SUBMITTED:
        raise HTTPException(status_code=400, detail="Only submitted formal quotes can be closed as lost")
    if payload.reason not in LOST_REASONS:
        raise HTTPException(status_code=400, detail="Invalid lost reason")
    row.closure_date = payload.closure_date or datetime.now(UTC).date().isoformat()
    row.closure_reason = payload.reason
    row.closure_remarks = payload.remarks
    row.status = FQ_LOST
    _append_activity(row, user, "Marked formal quote as lost", f"{payload.reason}. {payload.remarks or ''}".strip())
    db.add(row)
    db.commit()
    db.refresh(row)
    return to_quotation_out(row, user=user, db=db)


def draft_oem_order(db: Session, quote_id: int, payload: QuotationOrderDraft, user: User) -> QuotationOut:
    _require_role(user, SALES_ROLES)
    row = _get(db, quote_id)
    if row.status != FQ_SUBMITTED:
        raise HTTPException(status_code=400, detail="PO/order draft requires a submitted formal quote")
    row.po_file_name = payload.po_file_name
    row.po_note = payload.po_note
    row.oem = payload.oem
    row.order_date = payload.order_date or datetime.now(UTC).date().isoformat()
    row.order_details = payload.order_details
    row.expected_delivery_date = payload.expected_delivery_date
    row.status = ORDER_DRAFT
    _append_activity(row, user, "Prepared OEM order draft", f"OEM: {payload.oem or '—'}")
    db.add(row)
    db.commit()
    db.refresh(row)
    return to_quotation_out(row, user=user, db=db)


def submit_order_for_approval(db: Session, quote_id: int, user: User) -> QuotationOut:
    _require_role(user, SALES_ROLES)
    row = _get(db, quote_id)
    if row.status not in {ORDER_DRAFT, ORDER_REVISIONS}:
        raise HTTPException(status_code=400, detail="Order draft not ready for approval")
    row.status = ORDER_PENDING
    _append_activity(row, user, "Submitted OEM order for Sales Head approval")
    db.add(row)
    db.commit()
    db.refresh(row)
    return to_quotation_out(row, user=user, db=db)


def sales_head_review(db: Session, quote_id: int, payload: QuotationApprovalAction, user: User) -> QuotationOut:
    _require_role(user, SALES_HEAD_ROLES)
    row = _get(db, quote_id)
    if row.status != ORDER_PENDING:
        raise HTTPException(status_code=400, detail="No OEM order pending Sales Head approval")
    action = payload.action
    if action not in {"approve", "send_back", "reject"}:
        raise HTTPException(status_code=400, detail="Invalid approval action")
    items = _loads(row.approvals_json)
    items.append({
        "type": "oem_order",
        "date": payload.date or datetime.now(UTC).date().isoformat(),
        "action": action,
        "remarks": payload.remarks,
        "by": user.name,
        "role": user.role,
        "at": datetime.now(UTC).isoformat().replace("+00:00", "Z"),
    })
    row.approvals_json = _dumps(items)
    if action == "approve":
        row.status = ORDER_APPROVED
    elif action == "send_back":
        row.status = ORDER_REVISIONS
    else:
        row.status = ORDER_NOT_APPROVED
    _append_activity(row, user, f"Sales Head review: {action}", payload.remarks or "")
    db.add(row)
    db.commit()
    db.refresh(row)
    return to_quotation_out(row, user=user, db=db)


def place_order_oem(db: Session, quote_id: int, payload: QuotationSubmit, user: User) -> QuotationOut:
    _require_role(user, SALES_ROLES)
    row = _get(db, quote_id)
    if row.status != ORDER_APPROVED:
        raise HTTPException(status_code=400, detail="Only approved orders can be placed with OEM")
    row.order_submission_date = payload.submission_date or datetime.now(UTC).date().isoformat()
    row.order_remarks = payload.remarks or row.order_remarks
    row.status = ORDER_PLACED
    _append_activity(row, user, "Placed order with OEM", f"Date: {row.order_submission_date}")
    db.add(row)
    db.commit()
    db.refresh(row)
    return to_quotation_out(row, user=user, db=db)


def mark_delivered(db: Session, quote_id: int, payload: QuotationDelivery, user: User) -> QuotationOut:
    _require_role(user, SALES_ROLES)
    row = _get(db, quote_id)
    if row.status != ORDER_PLACED:
        raise HTTPException(status_code=400, detail="Delivery can be recorded after OEM order is placed")
    row.invoice_file_name = payload.invoice_file_name
    row.delivery_docs_note = payload.delivery_docs_note
    row.delivery_date = payload.delivery_date or datetime.now(UTC).date().isoformat()
    row.delivery_remarks = payload.remarks
    row.status = ORDER_DELIVERED
    _append_activity(row, user, "Marked order delivered to SI", f"Date: {row.delivery_date}")
    db.add(row)
    db.commit()
    db.refresh(row)
    return to_quotation_out(row, user=user, db=db)


def close_deal_paid(db: Session, quote_id: int, payload: QuotationPaymentClose, user: User) -> QuotationOut:
    _require_role(user, SALES_ROLES)
    row = _get(db, quote_id)
    if row.status != ORDER_DELIVERED:
        raise HTTPException(status_code=400, detail="Deal can close after delivery")
    row.payment_received_date = payload.payment_received_date or datetime.now(UTC).date().isoformat()
    row.payment_docs_note = payload.payment_docs_note
    row.payment_remarks = payload.remarks
    row.status = DEAL_CLOSED
    _append_activity(row, user, "Closed deal — payment received", f"Date: {row.payment_received_date}")
    db.add(row)
    db.commit()
    db.refresh(row)
    return to_quotation_out(row, user=user, db=db)


def reopen_after_reject(db: Session, quote_id: int, user: User) -> QuotationOut:
    """Move Not Approved → Revisions Requested so sales can continue."""
    _require_role(user, SALES_ROLES)
    row = _get(db, quote_id)
    if row.status == FQ_NOT_APPROVED:
        row.status = FQ_REVISIONS
        _append_activity(row, user, "Reopened formal quote for revisions after reject")
    elif row.status == ORDER_NOT_APPROVED:
        row.status = ORDER_REVISIONS
        _append_activity(row, user, "Reopened OEM order for revisions after reject")
    else:
        raise HTTPException(status_code=400, detail="Only rejected quotes/orders can be reopened")
    db.add(row)
    db.commit()
    db.refresh(row)
    return to_quotation_out(row, user=user, db=db)


def get_quotation(db: Session, quote_id: int, user: User | None = None) -> QuotationOut:
    return to_quotation_out(_get(db, quote_id), user=user, db=db)
