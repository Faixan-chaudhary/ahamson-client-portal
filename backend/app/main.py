import logging
import mimetypes
from contextlib import asynccontextmanager
from pathlib import Path

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse
from starlette.middleware.trustedhost import TrustedHostMiddleware

from app.config import get_settings
from app.database import Base, engine, SessionLocal
from app.middleware import DoSProtectionMiddleware, RequestSizeLimitMiddleware, SecurityHeadersMiddleware
from app.migrations import run_migrations
from app.router import router
from app.services import ensure_admin
from app.pipeline import seed_pipeline_from_template

BACKEND_ROOT = Path(__file__).resolve().parent.parent

mimetypes.add_type("application/javascript", ".js")
mimetypes.add_type("application/javascript", ".mjs")
mimetypes.add_type("text/css", ".css")
mimetypes.add_type("image/svg+xml", ".svg")
mimetypes.add_type("font/woff2", ".woff2")
mimetypes.add_type("font/woff", ".woff")
mimetypes.add_type("font/ttf", ".ttf")

MIME_BY_SUFFIX: dict[str, str] = {
    ".html": "text/html; charset=utf-8",
    ".js": "application/javascript",
    ".mjs": "application/javascript",
    ".css": "text/css",
    ".json": "application/json",
    ".svg": "image/svg+xml",
    ".png": "image/png",
    ".jpg": "image/jpeg",
    ".jpeg": "image/jpeg",
    ".webp": "image/webp",
    ".ico": "image/x-icon",
    ".woff": "font/woff",
    ".woff2": "font/woff2",
    ".ttf": "font/ttf",
    ".pdf": "application/pdf",
}

settings = get_settings()
logger = logging.getLogger(__name__)
INSECURE_SECRET = "dev-secret-change-in-production"
DEFAULT_ADMIN_PASSWORD = "Admin@2025"
FRONTEND_DIST: Path | None = None


def media_type_for(path: Path) -> str:
    ext = path.suffix.lower()
    if ext in MIME_BY_SUFFIX:
        return MIME_BY_SUFFIX[ext]
    guessed, _ = mimetypes.guess_type(str(path))
    return guessed or "application/octet-stream"


def find_frontend_dist() -> Path | None:
    if hasattr(settings, "resolve_frontend_dist"):
        found = settings.resolve_frontend_dist()
        if found:
            return found
    candidates = [
        BACKEND_ROOT.parent / "dist",
        BACKEND_ROOT / "dist",
        settings.frontend_dist_dir if hasattr(settings, "frontend_dist_dir") else BACKEND_ROOT.parent / "dist",
    ]
    seen: set[Path] = set()
    for candidate in candidates:
        path = Path(candidate).resolve()
        if path in seen:
            continue
        seen.add(path)
        if path.is_dir() and (path / "index.html").is_file():
            return path
    return None


def validate_production_settings() -> None:
    if settings.environment != "production":
        return
    if settings.secret_key == INSECURE_SECRET or len(settings.secret_key) < 32:
        raise RuntimeError("Set a strong SECRET_KEY (32+ chars) before running in production.")
    if settings.admin_password == DEFAULT_ADMIN_PASSWORD:
        logger.warning("Change ADMIN_PASSWORD from the default before going live.")
    if not settings.cors_origin_list:
        raise RuntimeError("Set CORS_ORIGINS to your frontend domain(s) in production.")


def _log_deploy_status() -> None:
    print("=" * 60)
    print("AHamson Portal — deploy status")
    print(f"  Backend root:     {BACKEND_ROOT}")
    print(f"  SERVE_FRONTEND:   {settings.serve_frontend}")
    print(f"  ENVIRONMENT:      {settings.environment}")
    if FRONTEND_DIST and _should_serve_frontend(FRONTEND_DIST):
        print(f"  Frontend dist:    {FRONTEND_DIST}")
        print("  Frontend:         ENABLED — SPA refresh supported")
    elif FRONTEND_DIST:
        print(f"  Frontend dist:    {FRONTEND_DIST} (found, not served in development)")
        print("  Frontend:         OFF — use Vite dev server or set SERVE_FRONTEND=true")
    elif settings.serve_frontend or settings.environment == "production":
        print("  Frontend:         DISABLED — dist/index.html NOT FOUND")
        print(f"  Expected at:      {BACKEND_ROOT.parent / 'dist'}")
    else:
        print("  Frontend:         OFF (development mode)")
    print("  Diagnostic URL:   /api/deploy-status")
    print("=" * 60)


@asynccontextmanager
async def lifespan(_: FastAPI):
    validate_production_settings()
    Base.metadata.create_all(bind=engine)
    run_migrations()
    with SessionLocal() as db:
        ensure_admin(db)
        seeded = seed_pipeline_from_template(db)
        if seeded:
            logger.info("Seeded %s pipeline rows from Excel template", seeded)
    _log_deploy_status()
    yield


app = FastAPI(title="AHamson Document Portal API", lifespan=lifespan)
app.add_middleware(SecurityHeadersMiddleware)
app.add_middleware(RequestSizeLimitMiddleware)
app.add_middleware(DoSProtectionMiddleware)
if settings.environment == "production" and settings.allowed_host_list != ["*"]:
    app.add_middleware(TrustedHostMiddleware, allowed_hosts=settings.allowed_host_list)
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origin_list,
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allow_headers=["Authorization", "Content-Type", "X-Client-Origin"],
)
app.include_router(router, prefix="/api")


def _should_serve_frontend(dist_dir: Path | None) -> bool:
    if not dist_dir:
        return False
    if settings.serve_frontend:
        return True
    if settings.environment == "production":
        return True
    # Same-port deploy (setup.ps1 / run.py) uses 8080 — serve SPA even if .env is minimal
    if settings.port == 8080:
        return True
    return False


def _register_frontend(dist_dir: Path) -> None:
    """Serve static assets + index.html for all SPA routes (fixes refresh on /admin/*)."""

    @app.get("/", include_in_schema=False)
    async def frontend_root():
        return FileResponse(dist_dir / "index.html", media_type="text/html; charset=utf-8")

    @app.get("/{full_path:path}", include_in_schema=False)
    async def frontend_spa(full_path: str):
        if full_path.startswith("api/") or full_path == "api":
            raise HTTPException(status_code=404, detail="Not Found")
        asset = dist_dir / full_path
        if asset.is_file():
            return FileResponse(asset, media_type=media_type_for(asset))
        return FileResponse(dist_dir / "index.html", media_type="text/html; charset=utf-8")


FRONTEND_DIST = find_frontend_dist()
if _should_serve_frontend(FRONTEND_DIST):
    logger.info("Serving frontend from %s", FRONTEND_DIST)
    _register_frontend(FRONTEND_DIST)
elif settings.serve_frontend:
    logger.warning("SERVE_FRONTEND=true but dist/index.html not found")
elif settings.environment == "production":
    logger.warning(
        "Production mode: dist/index.html not found — page refresh on /admin/* will 404. Run npm run build.",
    )
