"""Create or reset the admin user. Run: python create_admin.py"""
from __future__ import annotations

from app.database import SessionLocal
from app.models import User
from app.security import hash_password

ADMIN_EMAIL = "admin@ahamson.com"
ADMIN_PASSWORD = "AHamson@Portal2026!)"
ADMIN_NAME = "Admin"


def main() -> None:
    db = SessionLocal()
    try:
        user = db.query(User).filter(User.email == ADMIN_EMAIL).first()
        if user:
            user.password_hash = hash_password(ADMIN_PASSWORD)
            user.name = ADMIN_NAME
            user.role = "admin"
            user.is_active = True
            action = "updated"
        else:
            user = User(
                email=ADMIN_EMAIL,
                password_hash=hash_password(ADMIN_PASSWORD),
                name=ADMIN_NAME,
                role="admin",
                is_active=True,
            )
            db.add(user)
            action = "created"

        db.commit()
        print(f"Admin {action} successfully.")
        print(f"  Email:    {ADMIN_EMAIL}")
        print(f"  Password: {ADMIN_PASSWORD}")
    except Exception:
        db.rollback()
        raise
    finally:
        db.close()


if __name__ == "__main__":
    main()
