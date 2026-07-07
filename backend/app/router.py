from fastapi import APIRouter, Depends, Header, Request
from sqlalchemy.orm import Session

from app.database import get_db
from app.models import User
from app.schemas import (
    CreateLinkRequest,
    CreateLinkResponse,
    DashboardResponse,
    DraftResponse,
    InternalApprovalData,
    LoginRequest,
    MessageResponse,
    SubmissionOut,
    TokenResponse,
    UserOut,
)
from app.security import create_access_token, get_current_user, verify_password
from app.services import (
    create_link,
    ensure_admin,
    get_dashboard,
    get_draft,
    get_submission_by_id,
    get_submission_by_token,
    list_submissions,
    mark_opened,
    save_approval,
    save_draft,
    submit_document,
)

router = APIRouter()


@router.post("/auth/login", response_model=TokenResponse)
def login(payload: LoginRequest, db: Session = Depends(get_db)):
    ensure_admin(db)
    user = db.query(User).filter(User.email == payload.email).first()
    if not user or not verify_password(payload.password, user.password_hash):
        from fastapi import HTTPException, status

        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid credentials")
    token = create_access_token(user.email)
    return TokenResponse(access_token=token, user=UserOut.model_validate(user))


@router.get("/auth/me", response_model=UserOut)
def me(user: User = Depends(get_current_user)):
    return UserOut.model_validate(user)


@router.get("/dashboard", response_model=DashboardResponse)
def dashboard(_: User = Depends(get_current_user), db: Session = Depends(get_db)):
    return get_dashboard(db)


@router.get("/submissions", response_model=list[SubmissionOut])
def submissions(_: User = Depends(get_current_user), db: Session = Depends(get_db)):
    return list_submissions(db)


@router.get("/submissions/{submission_id}", response_model=SubmissionOut)
def submission_detail(submission_id: str, _: User = Depends(get_current_user), db: Session = Depends(get_db)):
    return get_submission_by_id(db, submission_id, include_form=True)


@router.post("/submissions", response_model=CreateLinkResponse)
def create_submission(
    payload: CreateLinkRequest,
    request: Request,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
    x_client_origin: str | None = Header(default=None),
):
    origin = x_client_origin or str(request.headers.get("origin") or request.base_url).rstrip("/")
    submission, client_url = create_link(db, payload, user, origin)
    return CreateLinkResponse(submission=submission, client_url=client_url)


@router.patch("/submissions/{submission_id}/approval", response_model=SubmissionOut)
def update_approval(
    submission_id: str,
    payload: InternalApprovalData,
    _: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    return save_approval(db, submission_id, payload)


@router.get("/client/links/{token}", response_model=SubmissionOut)
def client_link(token: str, db: Session = Depends(get_db)):
    return get_submission_by_token(db, token)


@router.post("/client/links/{token}/open", response_model=MessageResponse)
def client_open(token: str, db: Session = Depends(get_db)):
    mark_opened(db, token)
    return MessageResponse(message="ok")


@router.get("/client/links/{token}/draft", response_model=DraftResponse)
def client_get_draft(token: str, db: Session = Depends(get_db)):
    return DraftResponse(data=get_draft(db, token))


@router.put("/client/links/{token}/draft", response_model=MessageResponse)
def client_save_draft(token: str, payload: dict, db: Session = Depends(get_db)):
    save_draft(db, token, payload)
    return MessageResponse(message="saved")


@router.post("/client/links/{token}/submit", response_model=SubmissionOut)
def client_submit(token: str, payload: dict, db: Session = Depends(get_db)):
    return submit_document(db, token, payload)


@router.get("/client/links/{token}/preview", response_model=DraftResponse)
def client_preview(token: str, db: Session = Depends(get_db)):
    submission = get_submission_by_token(db, token, include_form=True)
    return DraftResponse(data=submission.form_data)
