from sqlalchemy import inspect, text

from app.config import get_settings
from app.database import engine

settings = get_settings()


def run_migrations() -> None:
    insp = inspect(engine)
    tables = insp.get_table_names()
    if "users" not in tables:
        return
    cols = {c["name"] for c in insp.get_columns("users")}
    with engine.begin() as conn:
        if "role" not in cols:
            conn.execute(text("ALTER TABLE users ADD COLUMN role VARCHAR(16) NOT NULL DEFAULT 'manager'"))
        if "is_active" not in cols:
            conn.execute(text("ALTER TABLE users ADD COLUMN is_active BOOLEAN NOT NULL DEFAULT 1"))
        if "last_active_at" not in cols:
            conn.execute(text("ALTER TABLE users ADD COLUMN last_active_at DATETIME"))
        conn.execute(
            text("UPDATE users SET role = 'admin', is_active = 1 WHERE email = :email"),
            {"email": settings.admin_email},
        )

    if "deal_registrations" in tables:
        deal_cols = {c["name"] for c in insp.get_columns("deal_registrations")}
        with engine.begin() as conn:
            if "token" not in deal_cols:
                conn.execute(text("ALTER TABLE deal_registrations ADD COLUMN token VARCHAR(64)"))
                conn.execute(text("CREATE UNIQUE INDEX IF NOT EXISTS ix_deal_registrations_token ON deal_registrations (token)"))
            if "expires_at" not in deal_cols:
                conn.execute(text("ALTER TABLE deal_registrations ADD COLUMN expires_at DATETIME"))
            if "opened_at" not in deal_cols:
                conn.execute(text("ALTER TABLE deal_registrations ADD COLUMN opened_at DATETIME"))
            if "draft_data" not in deal_cols:
                conn.execute(text("ALTER TABLE deal_registrations ADD COLUMN draft_data TEXT"))
