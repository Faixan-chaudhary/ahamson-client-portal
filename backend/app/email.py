import logging
import smtplib
from email.message import EmailMessage

from app.config import get_settings

logger = logging.getLogger(__name__)
settings = get_settings()


def smtp_configured() -> bool:
    return bool(settings.smtp_host and settings.smtp_from)


def _send_email(to_email: str, subject: str, body: str, html: str) -> None:
    if not smtp_configured():
        logger.warning("SMTP not configured — email to %s | %s", to_email, subject)
        logger.warning("%s", body)
        return

    msg = EmailMessage()
    msg["Subject"] = subject
    msg["From"] = settings.smtp_from
    msg["To"] = to_email
    msg.set_content(body)
    msg.add_alternative(html, subtype="html")

    with smtplib.SMTP(settings.smtp_host, settings.smtp_port, timeout=30) as server:
        if settings.smtp_use_tls:
            server.starttls()
        if settings.smtp_user:
            server.login(settings.smtp_user, settings.smtp_password)
        server.send_message(msg)


def send_password_reset_email(to_email: str, name: str, reset_url: str) -> None:
    subject = "Reset your AHamson portal password"
    body = f"""Hello {name},

We received a request to reset your AHamson Client Document Portal password.

Reset your password using the link below (valid for {settings.password_reset_expire_minutes} minutes):
{reset_url}

If you did not request this, you can safely ignore this email.

AHamson Client Document Portal
"""
    html = f"""<!DOCTYPE html>
<html>
<body style="font-family:Inter,Arial,sans-serif;background:#f4f6fa;padding:24px">
  <div style="max-width:520px;margin:0 auto;background:#fff;border-radius:16px;border:1px solid #e2e8f0;padding:32px">
    <h2 style="color:#0B1F3A;margin:0 0 12px">Password reset</h2>
    <p style="color:#64748B;line-height:1.6">Hello {name},</p>
    <p style="color:#64748B;line-height:1.6">Use the button below to set a new password for your administrator account.</p>
    <p style="margin:28px 0">
      <a href="{reset_url}" style="background:#0B1F3A;color:#fff;text-decoration:none;padding:12px 24px;border-radius:10px;font-weight:600;display:inline-block">Reset password</a>
    </p>
    <p style="color:#94A3B8;font-size:13px;line-height:1.5">This link expires in {settings.password_reset_expire_minutes} minutes. If you did not request a reset, ignore this email.</p>
  </div>
</body>
</html>"""
    _send_email(to_email, subject, body, html)


def send_document_link_email(
    to_email: str,
    contact_name: str,
    company_name: str,
    client_url: str,
    expires_hours: int,
) -> None:
    subject = "Complete your AHamson client registration"
    body = f"""Hello {contact_name},

You have been invited to complete the AHamson Client Registration Form for {company_name}.

Open the secure link below to fill and submit your document (expires in {expires_hours} hours):
{client_url}

If you were not expecting this email, please contact AHamson.

AHamson Client Document Portal
"""
    html = f"""<!DOCTYPE html>
<html>
<body style="font-family:Inter,Arial,sans-serif;background:#f4f6fa;padding:24px">
  <div style="max-width:520px;margin:0 auto;background:#fff;border-radius:16px;border:1px solid #e2e8f0;padding:32px">
    <h2 style="color:#0B1F3A;margin:0 0 12px">Client registration</h2>
    <p style="color:#64748B;line-height:1.6">Hello {contact_name},</p>
    <p style="color:#64748B;line-height:1.6">Please complete the registration form for <strong>{company_name}</strong>.</p>
    <p style="margin:28px 0">
      <a href="{client_url}" style="background:#F7931E;color:#fff;text-decoration:none;padding:12px 24px;border-radius:10px;font-weight:600;display:inline-block">Open secure form</a>
    </p>
    <p style="color:#94A3B8;font-size:13px;line-height:1.5">This link expires in {expires_hours} hours.</p>
  </div>
</body>
</html>"""
    _send_email(to_email, subject, body, html)


def send_deal_link_email(
    to_email: str,
    contact_name: str,
    company_name: str,
    client_url: str,
    expires_hours: int,
) -> None:
    subject = "Complete your AHamson Deal Registration"
    body = f"""Hello {contact_name},

You have been invited to complete the AHamson Deal Registration Form for {company_name}.

Open the secure link below to fill and submit the form (expires in {expires_hours} hours):
{client_url}

If you were not expecting this email, please contact AHamson.

AHamson Client Document Portal
"""
    html = f"""<!DOCTYPE html>
<html>
<body style="font-family:Inter,Arial,sans-serif;background:#f4f6fa;padding:24px">
  <div style="max-width:520px;margin:0 auto;background:#fff;border-radius:16px;border:1px solid #e2e8f0;padding:32px">
    <h2 style="color:#0B1F3A;margin:0 0 12px">Deal registration</h2>
    <p style="color:#64748B;line-height:1.6">Hello {contact_name},</p>
    <p style="color:#64748B;line-height:1.6">Please complete the deal registration form for <strong>{company_name}</strong>.</p>
    <p style="margin:28px 0">
      <a href="{client_url}" style="background:#F7931E;color:#fff;text-decoration:none;padding:12px 24px;border-radius:10px;font-weight:600;display:inline-block">Open secure form</a>
    </p>
    <p style="color:#94A3B8;font-size:13px;line-height:1.5">This link expires in {expires_hours} hours.</p>
  </div>
</body>
</html>"""
    _send_email(to_email, subject, body, html)
