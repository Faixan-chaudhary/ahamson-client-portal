"""Windows RDP entry point — shows real errors if app fails to load."""
from __future__ import annotations

import os
import sys


def main() -> None:
    os.chdir(os.path.dirname(os.path.abspath(__file__)))

    try:
        from app.main import app  # noqa: F401
    except Exception:
        print("\n*** FAILED TO LOAD app.main ***")
        print("Make sure these files are updated on the server:")
        print("  backend/app/main.py")
        print("  backend/app/config.py")
        print("  backend/app/middleware.py")
        print("  backend/app/router.py")
        print()
        import traceback

        traceback.print_exc()
        sys.exit(1)

    import uvicorn
    from app.config import get_settings

    settings = get_settings()
    host = settings.host if hasattr(settings, "host") else "0.0.0.0"
    port = settings.port if hasattr(settings, "port") else 8080

    print(f"\nStarting server on http://{host}:{port}\n")
    uvicorn.run(app, host=host, port=port, log_level="info")


if __name__ == "__main__":
    main()
