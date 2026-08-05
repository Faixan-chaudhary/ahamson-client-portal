import hashlib
import json
import logging
import secrets
from datetime import UTC, datetime, timedelta
from typing import Any

from fastapi import HTTPException, status
from sqlalchemy import func
from sqlalchemy.orm import Session

from app.config import get_settings
from app.email import send_deal_link_email, send_document_link_email, send_password_reset_email
from app.models import DealRegistration, PasswordResetToken, Submission, User
from app.schemas import (
    CreateDealLinkRequest,
    CreateLinkRequest,
    DashboardResponse,
    DashboardStats,
    DealLinkOut,
    DealLinksListResponse,
    DealRegistrationCreate,
    DealRegistrationOut,
    DealRegistrationsListResponse,
    DealRegistrationStatusUpdate,
    DocumentLinkOut,
    DocumentLinksListResponse,
    InternalApprovalData,
    SubmissionOut,
    SubmissionsListResponse,
    UserCreate,
    UserOut,
    UsersListResponse,
    UserUpdate,
)
from app.security import hash_password, iso, parse_json

settings = get_settings()
logger = logging.getLogger(__name__)


def ensure_admin(db: Session) -> User:
    user = db.query(User).filter(User.email == settings.admin_email).first()
    if user:
        changed = False
        if user.role != "admin":
            user.role = "admin"
            changed = True
        if not user.is_active:
            user.is_active = True
            changed = True
        if changed:
            db.add(user)
            db.commit()
            db.refresh(user)
        return user

    user = User(
        email=settings.admin_email,
        password_hash=hash_password(settings.admin_password),
        name=settings.admin_name,
        role="admin",
        is_active=True,
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    return user


def generate_token() -> str:
    return secrets.token_urlsafe(16)


def generate_submission_id(db: Session) -> str:
    year = datetime.now(UTC).year
    count = db.query(func.count(Submission.id)).scalar() or 0
    return f"DOC-{year}-{count + 1:03d}"


def refresh_expired(submission: Submission, db: Session) -> None:
    if submission.status in {"submitted", "expired"}:
        return
    expires = submission.expires_at
    if expires.tzinfo is None:
        expires = expires.replace(tzinfo=UTC)
    if expires < datetime.now(UTC):
        submission.status = "expired"
        db.add(submission)
        db.commit()
        db.refresh(submission)


def to_submission_out(submission: Submission, include_form: bool = False) -> SubmissionOut:
    approval = parse_json(submission.approval_data)
    return SubmissionOut(
        id=submission.id,
        token=submission.token,
        client_company=submission.client_company,
        contact_person=submission.contact_person,
        email=submission.email,
        phone=submission.phone,
        internal_notes=submission.internal_notes,
        status=submission.status,
        created_at=iso(submission.created_at) or "",
        expires_at=iso(submission.expires_at) or "",
        submitted_at=iso(submission.submitted_at),
        opened_at=iso(submission.opened_at),
        form_data=parse_json(submission.form_data) if include_form else None,
        approval=InternalApprovalData.model_validate(approval) if approval else None,
    )


def assert_link_active(row: Submission) -> None:
    if row.status == "submitted":
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Document already submitted")
    if row.status == "expired":
        raise HTTPException(status_code=status.HTTP_410_GONE, detail="Link expired")


def get_dashboard(db: Session) -> DashboardResponse:
    rows = db.query(Submission).order_by(Submission.created_at.desc()).all()
    for row in rows:
        refresh_expired(row, db)
    stats = DashboardStats(
        total=len(rows),
        pending=sum(1 for r in rows if r.status == "pending"),
        opened=sum(1 for r in rows if r.status == "opened"),
        submitted=sum(1 for r in rows if r.status == "submitted"),
        expired=sum(1 for r in rows if r.status == "expired"),
    )
    return DashboardResponse(stats=stats, submissions=[to_submission_out(r) for r in rows])


def _matches_search(row: Submission, search: str | None) -> bool:
    if not search:
        return True
    term = search.strip().lower()
    if not term:
        return True
    haystack = " ".join([row.client_company, row.contact_person, row.email, row.id]).lower()
    return term in haystack


def _matches_status(row: Submission, status: str | None) -> bool:
    if not status or status == "all":
        return True
    return row.status == status


def _load_submissions(db: Session) -> list[Submission]:
    rows = db.query(Submission).order_by(Submission.created_at.desc()).all()
    for row in rows:
        refresh_expired(row, db)
    return rows


def query_submissions(db: Session, search: str | None = None, status: str | None = None) -> SubmissionsListResponse:
    rows = _load_submissions(db)
    filtered = [row for row in rows if _matches_search(row, search) and _matches_status(row, status)]
    return SubmissionsListResponse(
        items=[to_submission_out(row) for row in filtered],
        total=len(filtered),
    )


def list_submissions(db: Session) -> list[SubmissionOut]:
    return query_submissions(db).items


def build_client_url(client_origin: str, token: str) -> str:
    return f"{client_origin.rstrip('/')}/client/document/{token}"


def list_document_links(
    db: Session,
    client_origin: str,
    search: str | None = None,
    status: str | None = None,
) -> DocumentLinksListResponse:
    rows = _load_submissions(db)
    filtered = [row for row in rows if _matches_search(row, search) and _matches_status(row, status)]
    items = [
        DocumentLinkOut(
            id=row.id,
            token=row.token,
            client_company=row.client_company,
            contact_person=row.contact_person,
            email=row.email,
            status=row.status,
            created_at=iso(row.created_at) or "",
            expires_at=iso(row.expires_at) or "",
            submitted_at=iso(row.submitted_at),
            client_url=build_client_url(client_origin, row.token),
        )
        for row in filtered
    ]
    return DocumentLinksListResponse(items=items, total=len(items))


def get_submission_by_id(db: Session, submission_id: str, include_form: bool = False) -> SubmissionOut:
    row = db.query(Submission).filter(Submission.id == submission_id).first()
    if not row:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Submission not found")
    refresh_expired(row, db)
    return to_submission_out(row, include_form=include_form)


def get_submission_by_token(db: Session, token: str, include_form: bool = False) -> SubmissionOut:
    row = db.query(Submission).filter(Submission.token == token).first()
    if not row:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Invalid link")
    refresh_expired(row, db)
    return to_submission_out(row, include_form=include_form)


def create_link(db: Session, payload: CreateLinkRequest, user: User, client_origin: str) -> tuple[SubmissionOut, str]:
    now = datetime.now(UTC)
    expires = now + timedelta(hours=settings.link_expire_hours)
    token = generate_token()
    submission = Submission(
        id=generate_submission_id(db),
        token=token,
        client_company=payload.client_company.strip(),
        contact_person=payload.contact_person.strip(),
        email=str(payload.contact_email).strip(),
        status="pending",
        expires_at=expires,
        created_by_id=user.id,
    )
    db.add(submission)
    db.commit()
    db.refresh(submission)
    client_url = build_client_url(client_origin, token)
    try:
        send_document_link_email(
            submission.email,
            submission.contact_person,
            submission.client_company,
            client_url,
            settings.link_expire_hours,
        )
    except Exception:
        logger.exception("Failed to send document link email to %s", submission.email)
    return to_submission_out(submission), client_url


def mark_opened(db: Session, token: str) -> None:
    row = db.query(Submission).filter(Submission.token == token).first()
    if not row:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Invalid link")
    refresh_expired(row, db)
    if row.status == "submitted":
        return
    assert_link_active(row)
    if row.status != "pending":
        return
    row.status = "opened"
    row.opened_at = datetime.now(UTC)
    db.add(row)
    db.commit()


def save_draft(db: Session, token: str, data: dict[str, Any]) -> None:
    row = db.query(Submission).filter(Submission.token == token).first()
    if not row:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Invalid link")
    refresh_expired(row, db)
    assert_link_active(row)
    row.draft_data = json.dumps(data)
    db.add(row)
    db.commit()


def get_draft(db: Session, token: str) -> dict[str, Any] | None:
    row = db.query(Submission).filter(Submission.token == token).first()
    if not row:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Invalid link")
    refresh_expired(row, db)
    if row.status == "submitted":
        return None
    return parse_json(row.draft_data)


def submit_document(db: Session, token: str, data: dict[str, Any]) -> SubmissionOut:
    row = db.query(Submission).filter(Submission.token == token).first()
    if not row:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Invalid link")
    refresh_expired(row, db)
    assert_link_active(row)
    row.form_data = json.dumps(data)
    row.draft_data = None
    row.status = "submitted"
    row.submitted_at = datetime.now(UTC)
    db.add(row)
    db.commit()
    db.refresh(row)
    return to_submission_out(row, include_form=True)


def save_approval(db: Session, submission_id: str, approval: InternalApprovalData) -> SubmissionOut:
    row = db.query(Submission).filter(Submission.id == submission_id).first()
    if not row:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Submission not found")
    row.approval_data = approval.model_dump_json(by_alias=True)
    db.add(row)
    db.commit()
    db.refresh(row)
    return to_submission_out(row, include_form=True)


def to_user_out(user: User) -> UserOut:
    return UserOut(
        id=user.id,
        email=user.email,
        name=user.name,
        role=user.role,
        is_active=user.is_active,
        created_at=iso(user.created_at) or "",
        last_active_at=iso(user.last_active_at),
    )


def _matches_user_search(user: User, search: str | None) -> bool:
    if not search:
        return True
    term = search.strip().lower()
    if not term:
        return True
    haystack = f"{user.name} {user.email}".lower()
    return term in haystack


def list_users(db: Session, search: str | None = None, role: str | None = None) -> UsersListResponse:
    rows = db.query(User).order_by(User.created_at.desc()).all()
    filtered = [
        row for row in rows
        if _matches_user_search(row, search) and (not role or role == "all" or row.role == role)
    ]
    return UsersListResponse(items=[to_user_out(row) for row in filtered], total=len(filtered))


def create_user(db: Session, payload: UserCreate) -> UserOut:
    if payload.role not in {"admin", "manager"}:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid role")
    existing = db.query(User).filter(User.email == str(payload.email)).first()
    if existing:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Email already exists")
    user = User(
        email=str(payload.email).strip(),
        name=payload.name.strip(),
        password_hash=hash_password(payload.password),
        role=payload.role,
        is_active=True,
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    return to_user_out(user)


def update_user(db: Session, user_id: int, payload: UserUpdate, actor: User) -> UserOut:
    row = db.query(User).filter(User.id == user_id).first()
    if not row:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")
    if payload.role is not None:
        if payload.role not in {"admin", "manager"}:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid role")
        if row.role == "admin" and payload.role == "manager":
            admin_count = db.query(func.count(User.id)).filter(User.role == "admin").scalar() or 0
            if admin_count <= 1:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="Cannot demote the last admin account",
                )
        row.role = payload.role
    if payload.is_active is not None:
        if row.id == actor.id and not payload.is_active:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="You cannot block your own account")
        row.is_active = payload.is_active
    if payload.name is not None:
        row.name = payload.name.strip()
    db.add(row)
    db.commit()
    db.refresh(row)
    return to_user_out(row)


def delete_user(db: Session, user_id: int, actor: User) -> None:
    row = db.query(User).filter(User.id == user_id).first()
    if not row:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")
    if row.id == actor.id:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="You cannot delete your own account")
    if row.role == "admin":
        admin_count = db.query(func.count(User.id)).filter(User.role == "admin").scalar() or 0
        if admin_count <= 1:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Cannot delete the last admin account")
    db.delete(row)
    db.commit()


def _hash_reset_token(raw: str) -> str:
    return hashlib.sha256(raw.encode()).hexdigest()


def request_password_reset(db: Session, email: str) -> None:
    user = db.query(User).filter(func.lower(User.email) == email.strip().lower()).first()
    if not user or not user.is_active:
        return

    db.query(PasswordResetToken).filter(PasswordResetToken.user_id == user.id).delete()

    raw_token = secrets.token_urlsafe(32)
    token_row = PasswordResetToken(
        user_id=user.id,
        token_hash=_hash_reset_token(raw_token),
        expires_at=datetime.now(UTC) + timedelta(minutes=settings.password_reset_expire_minutes),
    )
    db.add(token_row)
    db.commit()

    reset_url = f"{settings.frontend_url.rstrip('/')}/admin/reset-password?token={raw_token}"
    send_password_reset_email(user.email, user.name, reset_url)


def reset_password(db: Session, token: str, password: str) -> None:
    token_hash = _hash_reset_token(token.strip())
    row = (
        db.query(PasswordResetToken)
        .filter(PasswordResetToken.token_hash == token_hash)
        .first()
    )
    if not row:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid or expired reset link")

    expires = row.expires_at
    if expires.tzinfo is None:
        expires = expires.replace(tzinfo=UTC)
    if expires < datetime.now(UTC):
        db.delete(row)
        db.commit()
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid or expired reset link")

    user = db.query(User).filter(User.id == row.user_id).first()
    if not user or not user.is_active:
        db.delete(row)
        db.commit()
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid or expired reset link")

    user.password_hash = hash_password(password)
    db.add(user)
    db.query(PasswordResetToken).filter(PasswordResetToken.user_id == user.id).delete()
    db.commit()


def generate_deal_id(db: Session) -> str:
    year = datetime.now(UTC).year
    count = db.query(func.count(DealRegistration.id)).scalar() or 0
    return f"DEAL-{year}-{count + 1:03d}"


def _str_field(data: dict[str, Any], *keys: str) -> str:
    for key in keys:
        value = data.get(key)
        if isinstance(value, str) and value.strip():
            return value.strip()
    return ""


def to_deal_out(row: DealRegistration, include_form: bool = False, client_origin: str | None = None) -> DealRegistrationOut:
    client_url = None
    if row.token and client_origin:
        client_url = build_deal_client_url(client_origin, row.token)
    elif row.token:
        client_url = build_deal_client_url(settings.frontend_url or "", row.token) if settings.frontend_url else None
    return DealRegistrationOut(
        id=row.id,
        token=row.token,
        partner_company_name=row.partner_company_name,
        contact_person=row.contact_person,
        email=row.email,
        end_customer_name=row.end_customer_name or "",
        project_name=row.project_name or "",
        estimated_value_usd=row.estimated_value_usd or "",
        status=row.status,
        remarks=row.remarks,
        created_at=iso(row.created_at) or "",
        expires_at=iso(row.expires_at),
        opened_at=iso(row.opened_at),
        submitted_at=iso(row.submitted_at),
        reviewed_at=iso(row.reviewed_at),
        form_data=parse_json(row.form_data) if include_form else None,
        created_by_name=row.created_by.name if row.created_by else None,
        client_url=client_url,
    )


def build_deal_client_url(client_origin: str, token: str) -> str:
    return f"{client_origin.rstrip('/')}/client/deal/{token}"


def refresh_deal_expired(row: DealRegistration, db: Session) -> None:
    if row.submitted_at or row.status in {"approved", "rejected", "expired"}:
        return
    if not row.expires_at:
        return
    expires = row.expires_at
    if expires.tzinfo is None:
        expires = expires.replace(tzinfo=UTC)
    if expires < datetime.now(UTC):
        row.status = "expired"
        db.add(row)
        db.commit()
        db.refresh(row)


def assert_deal_link_active(row: DealRegistration) -> None:
    if row.submitted_at or row.status in {"approved", "rejected"}:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Deal already submitted")
    if row.status == "expired":
        raise HTTPException(status_code=status.HTTP_410_GONE, detail="Link expired")


def create_deal_link(
    db: Session,
    payload: CreateDealLinkRequest,
    user: User,
    client_origin: str,
) -> tuple[DealRegistrationOut, str]:
    now = datetime.now(UTC)
    expires = now + timedelta(hours=settings.link_expire_hours)
    token = generate_token()
    row = DealRegistration(
        id=generate_deal_id(db),
        token=token,
        partner_company_name=payload.partner_company_name.strip(),
        contact_person=payload.contact_person.strip(),
        email=str(payload.contact_email).strip(),
        end_customer_name="",
        status="pending",
        expires_at=expires,
        created_by_id=user.id,
    )
    db.add(row)
    db.commit()
    db.refresh(row)
    client_url = build_deal_client_url(client_origin, token)
    try:
        send_deal_link_email(
            row.email,
            row.contact_person,
            row.partner_company_name,
            client_url,
            settings.link_expire_hours,
        )
    except Exception:
        logger.exception("Failed to send deal link email to %s", row.email)
    return to_deal_out(row, client_origin=client_origin), client_url


def list_deal_links(
    db: Session,
    client_origin: str,
    search: str | None = None,
    status_filter: str | None = None,
) -> DealLinksListResponse:
    rows = (
        db.query(DealRegistration)
        .filter(DealRegistration.token.isnot(None))
        .order_by(DealRegistration.created_at.desc())
        .all()
    )
    term = (search or "").strip().lower()
    items: list[DealLinkOut] = []
    for row in rows:
        refresh_deal_expired(row, db)
        if status_filter and status_filter != "all" and row.status != status_filter:
            continue
        if term:
            haystack = " ".join([
                row.id,
                row.partner_company_name,
                row.contact_person,
                row.email,
            ]).lower()
            if term not in haystack:
                continue
        items.append(
            DealLinkOut(
                id=row.id,
                token=row.token or "",
                partner_company_name=row.partner_company_name,
                contact_person=row.contact_person,
                email=row.email,
                status=row.status,
                created_at=iso(row.created_at) or "",
                expires_at=iso(row.expires_at),
                submitted_at=iso(row.submitted_at),
                client_url=build_deal_client_url(client_origin, row.token or ""),
            )
        )
    return DealLinksListResponse(items=items, total=len(items))


def get_deal_by_token(db: Session, token: str, include_form: bool = False) -> DealRegistrationOut:
    row = db.query(DealRegistration).filter(DealRegistration.token == token).first()
    if not row:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Invalid link")
    refresh_deal_expired(row, db)
    return to_deal_out(row, include_form=include_form)


def mark_deal_opened(db: Session, token: str) -> None:
    row = db.query(DealRegistration).filter(DealRegistration.token == token).first()
    if not row:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Invalid link")
    refresh_deal_expired(row, db)
    if row.submitted_at:
        return
    assert_deal_link_active(row)
    if row.status != "pending":
        return
    row.status = "opened"
    row.opened_at = datetime.now(UTC)
    db.add(row)
    db.commit()


def save_deal_draft(db: Session, token: str, data: dict[str, Any]) -> None:
    row = db.query(DealRegistration).filter(DealRegistration.token == token).first()
    if not row:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Invalid link")
    refresh_deal_expired(row, db)
    assert_deal_link_active(row)
    row.draft_data = json.dumps(data)
    db.add(row)
    db.commit()


def get_deal_draft(db: Session, token: str) -> dict[str, Any] | None:
    row = db.query(DealRegistration).filter(DealRegistration.token == token).first()
    if not row:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Invalid link")
    refresh_deal_expired(row, db)
    if row.submitted_at:
        return None
    return parse_json(row.draft_data)


def submit_deal_via_link(db: Session, token: str, data: dict[str, Any]) -> DealRegistrationOut:
    row = db.query(DealRegistration).filter(DealRegistration.token == token).first()
    if not row:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Invalid link")
    refresh_deal_expired(row, db)
    assert_deal_link_active(row)

    partner = _str_field(data, "partnerCompanyName", "partner_company_name") or row.partner_company_name
    contact = _str_field(data, "contactPerson", "contact_person") or row.contact_person
    email = _str_field(data, "emailAddress", "email") or row.email
    end_customer = _str_field(data, "endCustomerName", "end_customer_name")
    if not partner or not contact or not email or not end_customer:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Partner company, contact person, email, and end customer are required",
        )

    form = dict(data)
    form["partnerCompanyName"] = partner
    form["contactPerson"] = contact
    form["emailAddress"] = email
    form["endCustomerName"] = end_customer
    form["approvalStatus"] = "pending"

    row.partner_company_name = partner
    row.contact_person = contact
    row.email = email
    row.end_customer_name = end_customer
    row.project_name = _str_field(data, "projectName", "project_name")
    row.estimated_value_usd = _str_field(data, "estimatedValueUsd", "estimated_value_usd")
    row.form_data = json.dumps(form)
    row.draft_data = None
    row.status = "pending"
    row.submitted_at = datetime.now(UTC)
    db.add(row)
    db.commit()
    db.refresh(row)
    return to_deal_out(row, include_form=True)


def create_deal_registration(
    db: Session,
    payload: DealRegistrationCreate,
    user: User,
) -> DealRegistrationOut:
    data = payload.form_data or {}
    partner = _str_field(data, "partnerCompanyName", "partner_company_name")
    contact = _str_field(data, "contactPerson", "contact_person")
    email = _str_field(data, "emailAddress", "email")
    end_customer = _str_field(data, "endCustomerName", "end_customer_name")

    if not partner or not contact or not email or not end_customer:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Partner company, contact person, email, and end customer are required",
        )

    # New deals start as pending for Salicru review
    form = dict(data)
    form["approvalStatus"] = "pending"

    now = datetime.now(UTC)
    row = DealRegistration(
        id=generate_deal_id(db),
        partner_company_name=partner,
        contact_person=contact,
        email=email,
        end_customer_name=end_customer,
        project_name=_str_field(data, "projectName", "project_name"),
        estimated_value_usd=_str_field(data, "estimatedValueUsd", "estimated_value_usd"),
        status="pending",
        form_data=json.dumps(form),
        remarks=_str_field(data, "remarks") or None,
        submitted_at=now,
        created_by_id=user.id,
    )
    db.add(row)
    db.commit()
    db.refresh(row)
    return to_deal_out(row, include_form=True)


def query_deal_registrations(
    db: Session,
    search: str | None = None,
    status_filter: str | None = None,
) -> DealRegistrationsListResponse:
    rows = (
        db.query(DealRegistration)
        .order_by(DealRegistration.created_at.desc())
        .all()
    )
    term = (search or "").strip().lower()
    filtered: list[DealRegistration] = []
    for row in rows:
        refresh_deal_expired(row, db)
        if status_filter and status_filter != "all" and row.status != status_filter:
            continue
        if term:
            haystack = " ".join([
                row.id,
                row.partner_company_name,
                row.contact_person,
                row.email,
                row.end_customer_name,
                row.project_name or "",
            ]).lower()
            if term not in haystack:
                continue
        filtered.append(row)

    return DealRegistrationsListResponse(
        items=[to_deal_out(row) for row in filtered],
        total=len(filtered),
    )

def get_deal_registration(db: Session, deal_id: str, include_form: bool = True) -> DealRegistrationOut:
    row = db.query(DealRegistration).filter(DealRegistration.id == deal_id).first()
    if not row:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Deal registration not found")
    return to_deal_out(row, include_form=include_form)


def update_deal_status(
    db: Session,
    deal_id: str,
    payload: DealRegistrationStatusUpdate,
) -> DealRegistrationOut:
    row = db.query(DealRegistration).filter(DealRegistration.id == deal_id).first()
    if not row:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Deal registration not found")

    row.status = payload.status
    if payload.remarks is not None:
        row.remarks = payload.remarks

    form = parse_json(row.form_data) or {}
    form["approvalStatus"] = payload.status
    if payload.remarks is not None:
        form["remarks"] = payload.remarks
    if payload.deal_id is not None:
        form["dealId"] = payload.deal_id
    if payload.registered_by is not None:
        form["registeredBy"] = payload.registered_by
    if payload.registration_date is not None:
        form["registrationDate"] = payload.registration_date
    row.form_data = json.dumps(form)
    row.reviewed_at = datetime.now(UTC)

    db.add(row)
    db.commit()
    db.refresh(row)
    return to_deal_out(row, include_form=True)
