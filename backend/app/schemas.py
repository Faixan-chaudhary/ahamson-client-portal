from typing import Any

from pydantic import BaseModel, ConfigDict, EmailStr, Field


def to_camel(s: str) -> str:
    parts = s.split("_")
    return parts[0] + "".join(p.capitalize() for p in parts[1:])


class ApiModel(BaseModel):
    model_config = ConfigDict(
        alias_generator=to_camel,
        populate_by_name=True,
        from_attributes=True,
        ser_json_by_alias=True,
    )


class TokenResponse(ApiModel):
    access_token: str
    token_type: str = "bearer"
    user: "UserOut"


class UserOut(ApiModel):
    id: int
    email: EmailStr
    name: str


class LoginRequest(ApiModel):
    email: EmailStr
    password: str


class CreateLinkRequest(ApiModel):
    client_company: str = Field(min_length=1)
    contact_person: str = Field(min_length=1)
    contact_email: EmailStr


class DashboardStats(ApiModel):
    total: int
    pending: int
    opened: int
    submitted: int
    expired: int


class DashboardResponse(ApiModel):
    stats: DashboardStats
    submissions: list["SubmissionOut"]


class InternalApprovalData(ApiModel):
    sales_name: str = ""
    sales_sr_no: str = ""
    sales_admin_name: str = ""
    business_unit_manager: str = ""
    accountant_name: str = ""
    finance_manager: str = ""
    document_controller: str = ""
    approved_credit_days: str = ""
    credit_limit: str = ""
    approved_by_gm: str = ""
    gm_signature_date: str = ""


class SubmissionOut(ApiModel):
    id: str
    token: str
    client_company: str
    contact_person: str
    email: str
    phone: str | None = None
    internal_notes: str | None = None
    status: str
    created_at: str
    expires_at: str
    submitted_at: str | None = None
    opened_at: str | None = None
    form_data: dict[str, Any] | None = None
    approval: InternalApprovalData | None = None


class CreateLinkResponse(ApiModel):
    submission: SubmissionOut
    client_url: str


class DraftResponse(ApiModel):
    data: dict[str, Any] | None


class MessageResponse(ApiModel):
    message: str


TokenResponse.model_rebuild()
DashboardResponse.model_rebuild()
