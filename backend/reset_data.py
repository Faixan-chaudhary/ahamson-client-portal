"""Delete all portal data except users. Run: python reset_data.py"""
from __future__ import annotations

from app.database import SessionLocal
from app.models import PasswordResetToken, Submission, User


def main() -> None:
    db = SessionLocal()
    try:
        submissions = db.query(Submission).count()
        tokens = db.query(PasswordResetToken).count()
        users = db.query(User).count()

        print(f"Before: {users} users, {submissions} submissions, {tokens} reset tokens")

        db.query(PasswordResetToken).delete(synchronize_session=False)
        db.query(Submission).delete(synchronize_session=False)
        db.commit()

        print(f"After:  {db.query(User).count()} users, 0 submissions, 0 reset tokens")
        print("Done — users kept, all other data deleted.")
    except Exception:
        db.rollback()
        raise
    finally:
        db.close()


if __name__ == "__main__":
    main()
