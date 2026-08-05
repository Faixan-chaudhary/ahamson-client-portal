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
    role: str
    is_active: bool
    created_at: str
    last_active_at: str | None = None


class UserCreate(ApiModel):
    name: str = Field(min_length=1)
    email: EmailStr
    password: str = Field(min_length=6)
    role: str = "manager"


class UserUpdate(ApiModel):
    name: str | None = None
    role: str | None = None
    is_active: bool | None = None


class UsersListResponse(ApiModel):
    items: list[UserOut]
    total: int


class LoginRequest(ApiModel):
    email: EmailStr
    password: str


class ForgotPasswordRequest(ApiModel):
    email: EmailStr


class ResetPasswordRequest(ApiModel):
    token: str = Field(min_length=20)
    password: str = Field(min_length=6)


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


class AppConfigResponse(ApiModel):
    link_expire_hours: int
    support_email: str


class SubmissionsListResponse(ApiModel):
    items: list[SubmissionOut]
    total: int


class DocumentLinkOut(ApiModel):
    id: str
    token: str
    client_company: str
    contact_person: str
    email: str
    status: str
    created_at: str
    expires_at: str
    submitted_at: str | None = None
    client_url: str


class DocumentLinksListResponse(ApiModel):
    items: list[DocumentLinkOut]
    total: int


class DealRegistrationCreate(ApiModel):
    form_data: dict[str, Any]


class CreateDealLinkRequest(ApiModel):
    partner_company_name: str = Field(min_length=1)
    contact_person: str = Field(min_length=1)
    contact_email: EmailStr


class DealRegistrationOut(ApiModel):
    id: str
    token: str | None = None
    partner_company_name: str
    contact_person: str
    email: str
    end_customer_name: str
    project_name: str
    estimated_value_usd: str
    status: str
    remarks: str | None = None
    created_at: str
    expires_at: str | None = None
    opened_at: str | None = None
    submitted_at: str | None = None
    reviewed_at: str | None = None
    form_data: dict[str, Any] | None = None
    created_by_name: str | None = None
    client_url: str | None = None


class CreateDealLinkResponse(ApiModel):
    deal: DealRegistrationOut
    client_url: str


class DealRegistrationStatusUpdate(ApiModel):
    status: str = Field(pattern="^(pending|approved|rejected)$")
    remarks: str | None = None
    deal_id: str | None = None
    registered_by: str | None = None
    registration_date: str | None = None


class DealRegistrationsListResponse(ApiModel):
    items: list[DealRegistrationOut]
    total: int


class DealLinkOut(ApiModel):
    id: str
    token: str
    partner_company_name: str
    contact_person: str
    email: str
    status: str
    created_at: str
    expires_at: str | None = None
    submitted_at: str | None = None
    client_url: str


class DealLinksListResponse(ApiModel):
    items: list[DealLinkOut]
    total: int


class PipelineEntryCreate(ApiModel):
    quote_date: str | None = None
    sp: str = ""
    partner: str = ""
    end_user: str = ""
    country: str = ""
    brand: str = ""
    product: str = ""
    value_aed: str = ""
    gp_aed: str = ""
    contact_name: str = ""
    closure: str = ""
    probability: str = ""
    status: str = ""
    details: str = ""


class PipelineEntryUpdate(ApiModel):
    quote_date: str | None = None
    sp: str | None = None
    partner: str | None = None
    end_user: str | None = None
    country: str | None = None
    brand: str | None = None
    product: str | None = None
    value_aed: str | None = None
    gp_aed: str | None = None
    contact_name: str | None = None
    closure: str | None = None
    probability: str | None = None
    status: str | None = None
    details: str | None = None


class PipelineEntryOut(ApiModel):
    id: int
    quote_date: str | None = None
    sp: str = ""
    partner: str = ""
    end_user: str = ""
    country: str = ""
    brand: str = ""
    product: str = ""
    value_aed: str = ""
    gp_aed: str = ""
    contact_name: str = ""
    closure: str = ""
    probability: str = ""
    status: str = ""
    details: str = ""
    created_at: str = ""
    updated_at: str = ""


class PipelineListResponse(ApiModel):
    items: list[PipelineEntryOut]
    total: int


TokenResponse.model_rebuild()
DashboardResponse.model_rebuild()
