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
    activity_logs: list[Any] = Field(default_factory=list)
    created_at: str = ""
    updated_at: str = ""


class PipelineListResponse(ApiModel):
    items: list[PipelineEntryOut]
    total: int


class QuotationCreate(ApiModel):
    quotation_date: str = ""
    sales_person: str = ""
    partner: str = ""
    end_user: str = ""
    country: str = ""
    brand: str = ""
    products: str = ""
    deal_value: str = ""
    gp_value: str = ""
    contact_person: str = ""
    closure_date: str = ""
    probability: str = ""
    details: str = ""
    si_attachment_name: str = ""
    si_attachment_note: str = ""


class QuotationUpdate(ApiModel):
    quotation_date: str | None = None
    sales_person: str | None = None
    partner: str | None = None
    end_user: str | None = None
    country: str | None = None
    brand: str | None = None
    products: str | None = None
    deal_value: str | None = None
    gp_value: str | None = None
    contact_person: str | None = None
    closure_date: str | None = None
    probability: str | None = None
    details: str | None = None
    si_attachment_name: str | None = None
    si_attachment_note: str | None = None
    oem: str | None = None
    order_date: str | None = None
    order_details: str | None = None
    expected_delivery_date: str | None = None
    po_file_name: str | None = None
    po_note: str | None = None


class QuotationSubmit(ApiModel):
    submission_date: str = ""
    remarks: str = ""


class QuotationFollowUpCreate(ApiModel):
    followup_date: str = ""
    remarks: str = Field(min_length=1)


class QuotationCloseLost(ApiModel):
    closure_date: str = ""
    reason: str = Field(min_length=1)
    remarks: str = ""


class QuotationApprovalAction(ApiModel):
    date: str = ""
    action: str = Field(min_length=1)  # approve | send_back | reject
    remarks: str = ""


class QuotationOrderDraft(ApiModel):
    po_file_name: str = ""
    po_note: str = ""
    oem: str = ""
    order_date: str = ""
    order_details: str = ""
    expected_delivery_date: str = ""


class QuotationDelivery(ApiModel):
    invoice_file_name: str = ""
    delivery_docs_note: str = ""
    delivery_date: str = ""
    remarks: str = ""


class QuotationPaymentClose(ApiModel):
    payment_received_date: str = ""
    payment_docs_note: str = ""
    remarks: str = ""


class QuotationOut(ApiModel):
    id: int
    quote_number: str
    phase: str
    status: str
    quotation_date: str = ""
    sales_person: str = ""
    partner: str = ""
    end_user: str = ""
    country: str = ""
    brand: str = ""
    products: str = ""
    deal_value: str = ""
    gp_value: str = ""
    contact_person: str = ""
    closure_date: str = ""
    probability: str = ""
    details: str = ""
    si_attachment_name: str = ""
    si_attachment_note: str = ""
    quotation_submission_date: str = ""
    closure_reason: str = ""
    closure_remarks: str = ""
    parent_quote_id: int | None = None
    child_quote_id: int | None = None
    parent_quote_number: str = ""
    child_quote_number: str = ""
    formal_submission_date: str = ""
    po_file_name: str = ""
    po_note: str = ""
    oem: str = ""
    order_date: str = ""
    order_details: str = ""
    expected_delivery_date: str = ""
    order_submission_date: str = ""
    order_remarks: str = ""
    invoice_file_name: str = ""
    delivery_docs_note: str = ""
    delivery_date: str = ""
    delivery_remarks: str = ""
    payment_received_date: str = ""
    payment_docs_note: str = ""
    payment_remarks: str = ""
    followups: list[Any] = Field(default_factory=list)
    approvals: list[Any] = Field(default_factory=list)
    activity_logs: list[Any] = Field(default_factory=list)
    allowed_actions: list[str] = Field(default_factory=list)
    action_hint: str = ""
    created_at: str = ""
    updated_at: str = ""
    created_by_id: int | None = None


class QuotationListResponse(ApiModel):
    items: list[QuotationOut]
    total: int


class QuotationStatusCount(ApiModel):
    status: str
    count: int


class QuotationStatsResponse(ApiModel):
    total: int = 0
    open: int = 0
    submitted: int = 0
    lost: int = 0
    closed: int = 0
    pending_finance: int = 0
    pending_sales_head: int = 0
    pending_sales: int = 0
    my_queue: int = 0
    by_phase: dict[str, int] = Field(default_factory=dict)
    by_status: list[QuotationStatusCount] = Field(default_factory=list)


class PipelineSyncResponse(ApiModel):
    created: int = 0
    updated: int = 0
    skipped: int = 0
    total_pipeline: int = 0
    message: str = ""


class SalesActivityCreate(ApiModel):
    sales_person: str = ""
    customer_name: str = ""
    meeting_date: str = ""
    contact_person: str = ""
    contact_number: str = ""
    meeting_outputs: str = ""


class SalesActivityUpdate(ApiModel):
    sales_person: str | None = None
    customer_name: str | None = None
    meeting_date: str | None = None
    contact_person: str | None = None
    contact_number: str | None = None
    meeting_outputs: str | None = None


class SalesActivityOut(ApiModel):
    id: int
    sales_person: str = ""
    customer_name: str = ""
    meeting_date: str = ""
    contact_person: str = ""
    contact_number: str = ""
    meeting_outputs: str = ""
    activity_logs: list[Any] = Field(default_factory=list)
    created_at: str = ""
    updated_at: str = ""
    created_by_id: int | None = None


class SalesActivityListResponse(ApiModel):
    items: list[SalesActivityOut]
    total: int


TokenResponse.model_rebuild()
DashboardResponse.model_rebuild()
