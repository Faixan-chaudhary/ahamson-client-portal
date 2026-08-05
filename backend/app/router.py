from datetime import UTC, datetime

from fastapi import APIRouter, Depends, Header, HTTPException, Query, Request, Response, status
from sqlalchemy.orm import Session

from app.database import get_db
from app.middleware import admin_rate_limiter, auth_rate_limiter, client_rate_limiter, enforce_rate_limit
from app.models import User
from app.config import get_settings
from app.pipeline import (
    create_pipeline_entry,
    delete_pipeline_entry,
    export_pipeline_excel,
    query_pipeline,
    update_pipeline_entry,
)
from app.schemas import (
    AppConfigResponse,
    CreateDealLinkRequest,
    CreateDealLinkResponse,
    CreateLinkRequest,
    CreateLinkResponse,
    DashboardResponse,
    DocumentLinksListResponse,
    DraftResponse,
    DealLinkOut,
    DealLinksListResponse,
    DealRegistrationCreate,
    DealRegistrationOut,
    DealRegistrationsListResponse,
    DealRegistrationStatusUpdate,
    ForgotPasswordRequest,
    InternalApprovalData,
    LoginRequest,
    MessageResponse,
    PipelineEntryCreate,
    PipelineEntryOut,
    PipelineEntryUpdate,
    PipelineListResponse,
    ResetPasswordRequest,
    SubmissionOut,
    SubmissionsListResponse,
    TokenResponse,
    UserOut,
    UsersListResponse,
    UserCreate,
    UserUpdate,
)
from app.security import create_access_token, get_current_user, require_admin, verify_password
from app.services import (
    create_deal_link,
    create_deal_registration,
    create_link,
    create_user,
    delete_user,
    ensure_admin,
    get_dashboard,
    get_deal_by_token,
    get_deal_draft,
    get_deal_registration,
    get_draft,
    get_submission_by_id,
    get_submission_by_token,
    list_deal_links,
    list_document_links,
    list_users,
    mark_deal_opened,
    mark_opened,
    query_deal_registrations,
    query_submissions,
    request_password_reset,
    reset_password,
    save_approval,
    save_deal_draft,
    save_draft,
    submit_deal_via_link,
    submit_document,
    update_deal_status,
    update_user,
    to_user_out,
)

router = APIRouter()


def admin_rate_limit(request: Request) -> None:
    enforce_rate_limit(request, admin_rate_limiter, "admin")


@router.get("/health")
def health():
    return {"status": "ok"}


@router.get("/deploy-status")
def deploy_status():
    """Diagnostic — check if frontend dist is configured and found."""
    settings = get_settings()
    configured = str(settings.frontend_dist_dir)
    resolved = settings.resolve_frontend_dist()
    auto_serve = bool(
        resolved
        and (
            settings.serve_frontend
            or settings.environment == "production"
            or settings.port == 8080
        )
    )
    return {
        "serveFrontend": settings.serve_frontend,
        "environment": settings.environment,
        "port": settings.port,
        "autoServeSpa": auto_serve,
        "configuredDistPath": configured,
        "resolvedDistPath": str(resolved) if resolved else None,
        "frontendReady": resolved is not None,
        "hint": (
            "Run npm run build and ensure dist/ is next to backend/. Set ENVIRONMENT=production or SERVE_FRONTEND=true in backend/.env"
            if not resolved
            else "Frontend should be served at /admin/login (refresh supported)"
            if auto_serve
            else "dist found but SPA serving disabled — set SERVE_FRONTEND=true or ENVIRONMENT=production"
        ),
    }


@router.get("/config", response_model=AppConfigResponse)
def app_config():
    settings = get_settings()
    return AppConfigResponse(
        link_expire_hours=settings.link_expire_hours,
        support_email=settings.support_email,
    )


@router.post("/auth/login", response_model=TokenResponse)
def login(payload: LoginRequest, request: Request, db: Session = Depends(get_db)):
    enforce_rate_limit(request, auth_rate_limiter, "auth-login")
    ensure_admin(db)
    user = db.query(User).filter(User.email == payload.email).first()
    if not user or not verify_password(payload.password, user.password_hash):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid credentials")
    if not user.is_active:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Account access is temporarily blocked")
    user.last_active_at = datetime.now(UTC)
    db.add(user)
    db.commit()
    db.refresh(user)
    token = create_access_token(user.email)
    return TokenResponse(access_token=token, user=to_user_out(user))


@router.get("/auth/me", response_model=UserOut)
def me(request: Request, user: User = Depends(get_current_user)):
    admin_rate_limit(request)
    return to_user_out(user)


@router.post("/auth/forgot-password", response_model=MessageResponse)
def forgot_password(payload: ForgotPasswordRequest, request: Request, db: Session = Depends(get_db)):
    enforce_rate_limit(request, auth_rate_limiter, "auth-forgot")
    request_password_reset(db, str(payload.email))
    return MessageResponse(message="If an account exists for this email, a reset link has been sent.")


@router.post("/auth/reset-password", response_model=MessageResponse)
def reset_password_route(payload: ResetPasswordRequest, request: Request, db: Session = Depends(get_db)):
    enforce_rate_limit(request, auth_rate_limiter, "auth-reset")
    reset_password(db, payload.token, payload.password)
    return MessageResponse(message="Password updated successfully")


@router.get("/users", response_model=UsersListResponse)
def users(
    request: Request,
    _: User = Depends(require_admin),
    db: Session = Depends(get_db),
    search: str | None = Query(default=None),
    role: str | None = Query(default=None),
):
    admin_rate_limit(request)
    return list_users(db, search=search, role=role)


@router.post("/users", response_model=UserOut)
def create_user_route(
    request: Request,
    payload: UserCreate,
    _: User = Depends(require_admin),
    db: Session = Depends(get_db),
):
    admin_rate_limit(request)
    return create_user(db, payload)


@router.patch("/users/{user_id}", response_model=UserOut)
def update_user_route(
    user_id: int,
    request: Request,
    payload: UserUpdate,
    actor: User = Depends(require_admin),
    db: Session = Depends(get_db),
):
    admin_rate_limit(request)
    return update_user(db, user_id, payload, actor)


@router.delete("/users/{user_id}", response_model=MessageResponse)
def delete_user_route(
    user_id: int,
    request: Request,
    actor: User = Depends(require_admin),
    db: Session = Depends(get_db),
):
    admin_rate_limit(request)
    delete_user(db, user_id, actor)
    return MessageResponse(message="deleted")


@router.get("/dashboard", response_model=DashboardResponse)
def dashboard(request: Request, _: User = Depends(get_current_user), db: Session = Depends(get_db)):
    admin_rate_limit(request)
    return get_dashboard(db)


@router.get("/submissions", response_model=SubmissionsListResponse)
def submissions(
    request: Request,
    _: User = Depends(get_current_user),
    db: Session = Depends(get_db),
    search: str | None = Query(default=None),
    status: str | None = Query(default=None),
):
    admin_rate_limit(request)
    return query_submissions(db, search=search, status=status)


@router.get("/links", response_model=DocumentLinksListResponse)
def document_links(
    request: Request,
    _: User = Depends(get_current_user),
    db: Session = Depends(get_db),
    search: str | None = Query(default=None),
    status: str | None = Query(default=None),
    x_client_origin: str | None = Header(default=None),
):
    admin_rate_limit(request)
    origin = x_client_origin or str(request.headers.get("origin") or request.base_url).rstrip("/")
    return list_document_links(db, client_origin=origin, search=search, status=status)


@router.get("/submissions/{submission_id}", response_model=SubmissionOut)
def submission_detail(submission_id: str, request: Request, _: User = Depends(get_current_user), db: Session = Depends(get_db)):
    admin_rate_limit(request)
    return get_submission_by_id(db, submission_id, include_form=True)


@router.post("/submissions", response_model=CreateLinkResponse)
def create_submission(
    payload: CreateLinkRequest,
    request: Request,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
    x_client_origin: str | None = Header(default=None),
):
    admin_rate_limit(request)
    origin = x_client_origin or str(request.headers.get("origin") or request.base_url).rstrip("/")
    submission, client_url = create_link(db, payload, user, origin)
    return CreateLinkResponse(submission=submission, client_url=client_url)


@router.patch("/submissions/{submission_id}/approval", response_model=SubmissionOut)
def update_approval(
    submission_id: str,
    request: Request,
    payload: InternalApprovalData,
    _: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    admin_rate_limit(request)
    return save_approval(db, submission_id, payload)


@router.get("/client/links/{token}", response_model=SubmissionOut)
def client_link(token: str, request: Request, db: Session = Depends(get_db)):
    enforce_rate_limit(request, client_rate_limiter, "client-read")
    return get_submission_by_token(db, token)


@router.post("/client/links/{token}/open", response_model=MessageResponse)
def client_open(token: str, request: Request, db: Session = Depends(get_db)):
    enforce_rate_limit(request, client_rate_limiter, "client-write")
    mark_opened(db, token)
    return MessageResponse(message="ok")


@router.get("/client/links/{token}/draft", response_model=DraftResponse)
def client_get_draft(token: str, request: Request, db: Session = Depends(get_db)):
    enforce_rate_limit(request, client_rate_limiter, "client-read")
    return DraftResponse(data=get_draft(db, token))


@router.put("/client/links/{token}/draft", response_model=MessageResponse)
def client_save_draft(token: str, payload: dict, request: Request, db: Session = Depends(get_db)):
    enforce_rate_limit(request, client_rate_limiter, "client-write")
    save_draft(db, token, payload)
    return MessageResponse(message="saved")


@router.post("/client/links/{token}/submit", response_model=SubmissionOut)
def client_submit(token: str, payload: dict, request: Request, db: Session = Depends(get_db)):
    enforce_rate_limit(request, client_rate_limiter, "client-write")
    return submit_document(db, token, payload)


@router.get("/client/links/{token}/preview", response_model=DraftResponse)
def client_preview(token: str, request: Request, db: Session = Depends(get_db)):
    enforce_rate_limit(request, client_rate_limiter, "client-read")
    submission = get_submission_by_token(db, token, include_form=True)
    return DraftResponse(data=submission.form_data)


@router.get("/deals", response_model=DealRegistrationsListResponse)
def list_deals(
    request: Request,
    _: User = Depends(get_current_user),
    db: Session = Depends(get_db),
    search: str | None = Query(default=None),
    status: str | None = Query(default=None),
):
    admin_rate_limit(request)
    return query_deal_registrations(db, search=search, status_filter=status)


@router.get("/deal-links", response_model=DealLinksListResponse)
def deal_links(
    request: Request,
    _: User = Depends(get_current_user),
    db: Session = Depends(get_db),
    search: str | None = Query(default=None),
    status: str | None = Query(default=None),
    x_client_origin: str | None = Header(default=None),
):
    admin_rate_limit(request)
    origin = x_client_origin or str(request.headers.get("origin") or request.base_url).rstrip("/")
    return list_deal_links(db, client_origin=origin, search=search, status_filter=status)


@router.post("/deal-links", response_model=CreateDealLinkResponse)
def create_deal_share_link(
    payload: CreateDealLinkRequest,
    request: Request,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
    x_client_origin: str | None = Header(default=None),
):
    admin_rate_limit(request)
    origin = x_client_origin or str(request.headers.get("origin") or request.base_url).rstrip("/")
    deal, client_url = create_deal_link(db, payload, user, origin)
    return CreateDealLinkResponse(deal=deal, client_url=client_url)


@router.get("/client/deal-links/{token}", response_model=DealRegistrationOut)
def client_deal_link(token: str, request: Request, db: Session = Depends(get_db)):
    enforce_rate_limit(request, client_rate_limiter, "client-read")
    return get_deal_by_token(db, token)


@router.post("/client/deal-links/{token}/open", response_model=MessageResponse)
def client_deal_open(token: str, request: Request, db: Session = Depends(get_db)):
    enforce_rate_limit(request, client_rate_limiter, "client-write")
    mark_deal_opened(db, token)
    return MessageResponse(message="ok")


@router.get("/client/deal-links/{token}/draft", response_model=DraftResponse)
def client_deal_get_draft(token: str, request: Request, db: Session = Depends(get_db)):
    enforce_rate_limit(request, client_rate_limiter, "client-read")
    return DraftResponse(data=get_deal_draft(db, token))


@router.put("/client/deal-links/{token}/draft", response_model=MessageResponse)
def client_deal_save_draft(token: str, payload: dict, request: Request, db: Session = Depends(get_db)):
    enforce_rate_limit(request, client_rate_limiter, "client-write")
    save_deal_draft(db, token, payload)
    return MessageResponse(message="saved")


@router.post("/client/deal-links/{token}/submit", response_model=DealRegistrationOut)
def client_deal_submit(token: str, payload: dict, request: Request, db: Session = Depends(get_db)):
    enforce_rate_limit(request, client_rate_limiter, "client-write")
    return submit_deal_via_link(db, token, payload)


@router.post("/deals", response_model=DealRegistrationOut)
def create_deal(
    payload: DealRegistrationCreate,
    request: Request,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    admin_rate_limit(request)
    return create_deal_registration(db, payload, user)

@router.get("/deals/{deal_id}", response_model=DealRegistrationOut)
def deal_detail(
    deal_id: str,
    request: Request,
    _: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    admin_rate_limit(request)
    return get_deal_registration(db, deal_id, include_form=True)


@router.patch("/deals/{deal_id}/status", response_model=DealRegistrationOut)
def deal_status_update(
    deal_id: str,
    payload: DealRegistrationStatusUpdate,
    request: Request,
    _: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    admin_rate_limit(request)
    return update_deal_status(db, deal_id, payload)


@router.get("/pipeline", response_model=PipelineListResponse)
def list_pipeline(
    request: Request,
    _: User = Depends(get_current_user),
    db: Session = Depends(get_db),
    search: str | None = Query(default=None),
    status: str | None = Query(default=None),
    brand: str | None = Query(default=None),
    country: str | None = Query(default=None),
    sp: str | None = Query(default=None),
    closure: str | None = Query(default=None),
):
    admin_rate_limit(request)
    return query_pipeline(
        db, search=search, status_filter=status, brand=brand,
        country=country, sp=sp, closure=closure,
    )


@router.get("/pipeline/export")
def download_pipeline(
    request: Request,
    _: User = Depends(get_current_user),
    db: Session = Depends(get_db),
    search: str | None = Query(default=None),
    status: str | None = Query(default=None),
    brand: str | None = Query(default=None),
    country: str | None = Query(default=None),
    sp: str | None = Query(default=None),
    closure: str | None = Query(default=None),
):
    admin_rate_limit(request)
    content = export_pipeline_excel(
        db, search=search, status_filter=status, brand=brand,
        country=country, sp=sp, closure=closure,
    )
    filename = f"AHamson-Pipeline-{datetime.now(UTC).strftime('%Y%m%d')}.xlsx"
    return Response(
        content=content,
        media_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        headers={"Content-Disposition": f'attachment; filename="{filename}"'},
    )


@router.post("/pipeline", response_model=PipelineEntryOut)
def create_pipeline(
    payload: PipelineEntryCreate,
    request: Request,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    admin_rate_limit(request)
    return create_pipeline_entry(db, payload, user)


@router.patch("/pipeline/{entry_id}", response_model=PipelineEntryOut)
def patch_pipeline(
    entry_id: int,
    payload: PipelineEntryUpdate,
    request: Request,
    _: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    admin_rate_limit(request)
    return update_pipeline_entry(db, entry_id, payload)


@router.delete("/pipeline/{entry_id}", response_model=MessageResponse)
def remove_pipeline(
    entry_id: int,
    request: Request,
    _: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    admin_rate_limit(request)
    delete_pipeline_entry(db, entry_id)
    return MessageResponse(message="deleted")
