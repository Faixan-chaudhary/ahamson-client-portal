import json
import secrets
from datetime import UTC, datetime, timedelta
from typing import Any

from fastapi import HTTPException, status
from sqlalchemy import func
from sqlalchemy.orm import Session

from app.config import get_settings
from app.models import Submission, User
from app.schemas import CreateLinkRequest, DashboardResponse, DashboardStats, InternalApprovalData, SubmissionOut
from app.security import iso, parse_json

settings = get_settings()


def ensure_admin(db: Session) -> User:
    user = db.query(User).filter(User.email == settings.admin_email).first()
    if user:
        return user
    from app.security import hash_password

    user = User(
        email=settings.admin_email,
        password_hash=hash_password(settings.admin_password),
        name=settings.admin_name,
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


def list_submissions(db: Session) -> list[SubmissionOut]:
    rows = db.query(Submission).order_by(Submission.created_at.desc()).all()
    for row in rows:
        refresh_expired(row, db)
    return [to_submission_out(row) for row in rows]


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
    client_url = f"{client_origin.rstrip('/')}/client/document/{token}"
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
