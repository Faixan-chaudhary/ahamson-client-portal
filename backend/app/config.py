from functools import lru_cache
from pathlib import Path

from pydantic_settings import BaseSettings, SettingsConfigDict

BACKEND_ROOT = Path(__file__).resolve().parent.parent


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

    environment: str = "development"
    database_url: str = "sqlite:///./ahamson.db"
    secret_key: str = "dev-secret-change-in-production"
    access_token_expire_minutes: int = 1440
    cors_origins: str = "http://localhost:5173,http://127.0.0.1:5173"
    max_request_body_bytes: int = 6_000_000
    max_url_path_length: int = 2048
    max_query_string_length: int = 4096
    request_timeout_seconds: int = 30
    global_rate_limit_requests: int = 300
    global_rate_limit_window_seconds: int = 60
    auth_rate_limit_requests: int = 10
    auth_rate_limit_window_seconds: int = 300
    admin_rate_limit_requests: int = 180
    admin_rate_limit_window_seconds: int = 60
    client_rate_limit_requests: int = 120
    client_rate_limit_window_seconds: int = 60
    max_concurrent_requests_per_ip: int = 25
    ip_ban_violation_threshold: int = 15
    ip_ban_violation_window_seconds: int = 300
    ip_ban_duration_seconds: int = 900
    trusted_proxies: str = ""
    allowed_hosts: str = "*"
    admin_email: str = "admin@ahamson.com"
    admin_password: str = "Admin@2025"
    admin_name: str = "Sarah Mitchell"
    link_expire_hours: int = 2
    support_email: str = "documents@ahamson.com"
    frontend_url: str = "http://localhost:5173"
    password_reset_expire_minutes: int = 60
    smtp_host: str = ""
    smtp_port: int = 587
    smtp_user: str = ""
    smtp_password: str = ""
    smtp_from: str = ""
    smtp_use_tls: bool = True
    serve_frontend: bool = False
    frontend_dist_path: str = "../dist"
    host: str = "0.0.0.0"
    port: int = 8080

    @property
    def frontend_dist_dir(self) -> Path:
        path = Path(self.frontend_dist_path)
        if path.is_absolute():
            return path
        return (BACKEND_ROOT / path).resolve()

    def resolve_frontend_dist(self) -> Path | None:
        """Find dist folder — tries configured path, then common locations."""
        candidates = [
            self.frontend_dist_dir,
            (BACKEND_ROOT / "dist").resolve(),
            (BACKEND_ROOT.parent / "dist").resolve(),
        ]
        seen: set[Path] = set()
        for candidate in candidates:
            if candidate in seen:
                continue
            seen.add(candidate)
            if candidate.is_dir() and (candidate / "index.html").is_file():
                return candidate
        return None

    @property
    def cors_origin_list(self) -> list[str]:
        return [o.strip() for o in self.cors_origins.split(",") if o.strip()]

    @property
    def trusted_proxy_list(self) -> set[str]:
        return {p.strip() for p in self.trusted_proxies.split(",") if p.strip()}

    @property
    def allowed_host_list(self) -> list[str]:
        hosts = [h.strip() for h in self.allowed_hosts.split(",") if h.strip()]
        return hosts or ["*"]


@lru_cache
def get_settings() -> Settings:
    return Settings()
