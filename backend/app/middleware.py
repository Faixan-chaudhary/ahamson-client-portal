import asyncio
import logging
import time
from collections import defaultdict
from collections.abc import Callable

from fastapi import HTTPException, Request, Response, status
from starlette.middleware.base import BaseHTTPMiddleware
from starlette.responses import JSONResponse

from app.config import get_settings

logger = logging.getLogger(__name__)
settings = get_settings()


class RateLimiter:
    """Sliding-window rate limiter with periodic memory cleanup."""

    def __init__(self, max_requests: int, window_seconds: int) -> None:
        self.max_requests = max_requests
        self.window_seconds = window_seconds
        self._hits: dict[str, list[float]] = defaultdict(list)
        self._last_cleanup = time.time()

    def allow(self, key: str) -> bool:
        self._maybe_cleanup()
        now = time.time()
        window_start = now - self.window_seconds
        hits = [t for t in self._hits[key] if t > window_start]
        if len(hits) >= self.max_requests:
            self._hits[key] = hits
            return False
        hits.append(now)
        self._hits[key] = hits
        return True

    def _maybe_cleanup(self) -> None:
        now = time.time()
        if now - self._last_cleanup < 60:
            return
        self._last_cleanup = now
        cutoff = now - self.window_seconds
        stale = [key for key, hits in self._hits.items() if not hits or hits[-1] <= cutoff]
        for key in stale:
            del self._hits[key]


class IpBanManager:
    """Temporarily ban IPs that repeatedly exceed rate or concurrency limits."""

    def __init__(
        self,
        violation_threshold: int,
        violation_window_seconds: int,
        ban_duration_seconds: int,
    ) -> None:
        self.violation_threshold = violation_threshold
        self.violation_window_seconds = violation_window_seconds
        self.ban_duration_seconds = ban_duration_seconds
        self._violations: dict[str, list[float]] = defaultdict(list)
        self._banned_until: dict[str, float] = {}

    def is_banned(self, ip: str) -> bool:
        self._purge_expired_bans()
        banned_until = self._banned_until.get(ip)
        return banned_until is not None and banned_until > time.time()

    def record_violation(self, ip: str, reason: str) -> None:
        now = time.time()
        window_start = now - self.violation_window_seconds
        hits = [t for t in self._violations[ip] if t > window_start]
        hits.append(now)
        self._violations[ip] = hits
        if len(hits) >= self.violation_threshold:
            self._banned_until[ip] = now + self.ban_duration_seconds
            self._violations[ip] = []
            logger.warning("IP temporarily banned (%s): %s", reason, ip)

    def _purge_expired_bans(self) -> None:
        now = time.time()
        expired = [ip for ip, until in self._banned_until.items() if until <= now]
        for ip in expired:
            del self._banned_until[ip]


class ConcurrentRequestGate:
    """Limit simultaneous in-flight requests per IP."""

    def __init__(self, max_per_ip: int) -> None:
        self.max_per_ip = max_per_ip
        self._active: dict[str, int] = defaultdict(int)
        self._lock = asyncio.Lock()

    async def try_enter(self, ip: str) -> bool:
        async with self._lock:
            if self._active[ip] >= self.max_per_ip:
                return False
            self._active[ip] += 1
            return True

    async def leave(self, ip: str) -> None:
        async with self._lock:
            if self._active[ip] > 0:
                self._active[ip] -= 1
            if self._active[ip] == 0:
                del self._active[ip]


auth_rate_limiter = RateLimiter(
    max_requests=settings.auth_rate_limit_requests,
    window_seconds=settings.auth_rate_limit_window_seconds,
)
client_rate_limiter = RateLimiter(
    max_requests=settings.client_rate_limit_requests,
    window_seconds=settings.client_rate_limit_window_seconds,
)
global_rate_limiter = RateLimiter(
    max_requests=settings.global_rate_limit_requests,
    window_seconds=settings.global_rate_limit_window_seconds,
)
admin_rate_limiter = RateLimiter(
    max_requests=settings.admin_rate_limit_requests,
    window_seconds=settings.admin_rate_limit_window_seconds,
)
ip_ban_manager = IpBanManager(
    violation_threshold=settings.ip_ban_violation_threshold,
    violation_window_seconds=settings.ip_ban_violation_window_seconds,
    ban_duration_seconds=settings.ip_ban_duration_seconds,
)
concurrent_gate = ConcurrentRequestGate(max_per_ip=settings.max_concurrent_requests_per_ip)


def client_ip(request: Request) -> str:
    """Resolve client IP, trusting X-Forwarded-For only from configured proxies."""
    if settings.trusted_proxy_list and request.client:
        peer = request.client.host
        if peer in settings.trusted_proxy_list:
            forwarded = request.headers.get("x-forwarded-for")
            if forwarded:
                return forwarded.split(",")[0].strip()
    if request.client:
        return request.client.host
    return "unknown"


def enforce_rate_limit(request: Request, limiter: RateLimiter, scope: str) -> None:
    ip = client_ip(request)
    key = f"{scope}:{ip}"
    if not limiter.allow(key):
        ip_ban_manager.record_violation(ip, f"{scope}-rate-limit")
        raise HTTPException(
            status_code=status.HTTP_429_TOO_MANY_REQUESTS,
            detail="Too many requests. Please try again later.",
        )


class DoSProtectionMiddleware(BaseHTTPMiddleware):
    """Global per-IP rate limit, concurrency cap, timeouts, and auto IP bans."""

    async def dispatch(self, request: Request, call_next: Callable) -> Response:
        ip = client_ip(request)

        if ip_ban_manager.is_banned(ip):
            return JSONResponse(
                status_code=status.HTTP_403_FORBIDDEN,
                content={"detail": "Access temporarily blocked due to suspicious activity."},
            )

        if not await concurrent_gate.try_enter(ip):
            ip_ban_manager.record_violation(ip, "concurrent-limit")
            return JSONResponse(
                status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
                content={"detail": "Too many concurrent requests from this address."},
            )

        try:
            if not global_rate_limiter.allow(f"global:{ip}"):
                ip_ban_manager.record_violation(ip, "global-rate-limit")
                return JSONResponse(
                    status_code=status.HTTP_429_TOO_MANY_REQUESTS,
                    content={"detail": "Too many requests. Please try again later."},
                )

            try:
                return await asyncio.wait_for(
                    call_next(request),
                    timeout=settings.request_timeout_seconds,
                )
            except TimeoutError:
                ip_ban_manager.record_violation(ip, "request-timeout")
                return JSONResponse(
                    status_code=status.HTTP_504_GATEWAY_TIMEOUT,
                    content={"detail": "Request timed out."},
                )
        finally:
            await concurrent_gate.leave(ip)


class SecurityHeadersMiddleware(BaseHTTPMiddleware):
    _API_CSP = "default-src 'none'; frame-ancestors 'none'"
    _SPA_CSP = (
        "default-src 'self'; "
        "script-src 'self'; "
        "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; "
        "style-src-elem 'self' 'unsafe-inline' https://fonts.googleapis.com; "
        "img-src 'self' data: blob:; "
        "font-src 'self' data: https://fonts.gstatic.com; "
        "connect-src 'self'; "
        "frame-ancestors 'none'"
    )

    async def dispatch(self, request: Request, call_next: Callable) -> Response:
        response = await call_next(request)
        path = request.url.path
        is_api = path.startswith("/api")

        response.headers["X-Content-Type-Options"] = "nosniff"
        response.headers["X-Frame-Options"] = "DENY"
        response.headers["Referrer-Policy"] = "strict-origin-when-cross-origin"
        response.headers["Permissions-Policy"] = "camera=(), microphone=(), geolocation=()"
        response.headers["X-XSS-Protection"] = "0"
        response.headers["Content-Security-Policy"] = self._API_CSP if is_api else self._SPA_CSP

        if is_api:
            response.headers["Cache-Control"] = "no-store"
        if settings.environment == "production":
            response.headers["Strict-Transport-Security"] = "max-age=31536000; includeSubDomains"
        return response


class RequestSizeLimitMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request: Request, call_next: Callable) -> Response:
        content_length = request.headers.get("content-length")
        if content_length:
            try:
                size = int(content_length)
            except ValueError:
                raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid Content-Length") from None
            if size > settings.max_request_body_bytes:
                ip_ban_manager.record_violation(client_ip(request), "oversized-body")
                raise HTTPException(
                    status_code=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE,
                    detail="Request body too large",
                )

        if len(request.url.path) > settings.max_url_path_length:
            raise HTTPException(status_code=status.HTTP_414_URI_TOO_LONG, detail="URI too long")

        query_len = len(request.url.query) if request.url.query else 0
        if query_len > settings.max_query_string_length:
            raise HTTPException(status_code=status.HTTP_414_URI_TOO_LONG, detail="Query string too long")

        return await call_next(request)
