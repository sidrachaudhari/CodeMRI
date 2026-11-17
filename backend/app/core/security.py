import base64
import hashlib
import hmac
import json
import logging
import time
from typing import Any, Dict, Optional
from fastapi import Depends, Request
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.core.config import settings
from app.core.exceptions import UnauthorizedException
from app.database.connection import get_db
from app.models.models import User

logger = logging.getLogger(__name__)

# HTTP Bearer scheme with custom error handling
security_scheme = HTTPBearer(auto_error=False)


def base64url_decode(input_str: str) -> bytes:
    """Decode base64url-encoded string with padding handling."""
    rem = len(input_str) % 4
    if rem > 0:
        input_str += "=" * (4 - rem)
    return base64.urlsafe_b64decode(input_str.encode("utf-8"))


def parse_and_verify_token(token: str) -> Dict[str, Any]:
    """
    Parses and verifies an external authentication token (JWT).
    Supports HS256 verification when AUTH_JWT_SECRET is configured.
    Extracts standard claims: sub, email, name, iss.
    """
    if not token or not token.strip():
        raise UnauthorizedException("Empty authentication token")

    token = token.strip()

    # Check for dev / test formatted tokens: "dev:<subject>:<email>:<name>"
    if token.startswith("dev:"):
        parts = token.split(":")
        sub = parts[1] if len(parts) > 1 else "dev-user-001"
        email = parts[2] if len(parts) > 2 else f"{sub}@example.com"
        name = parts[3] if len(parts) > 3 else "Development User"
        return {
            "sub": sub,
            "email": email,
            "name": name,
            "iss": "dev",
            "provider": "dev"
        }

    # Standard JWT has 3 dot-separated segments
    segments = token.split(".")
    if len(segments) != 3:
        raise UnauthorizedException("Invalid token format: expected 3-part JWT")

    header_b64, payload_b64, signature_b64 = segments

    try:
        header_bytes = base64url_decode(header_b64)
        header = json.loads(header_bytes.decode("utf-8"))
        payload_bytes = base64url_decode(payload_b64)
        payload = json.loads(payload_bytes.decode("utf-8"))
    except Exception as e:
        logger.debug(f"Failed to decode JWT segments: {e}")
        raise UnauthorizedException("Malformed token header or payload")

    # Verify signature if secret is configured
    if settings.AUTH_JWT_SECRET and settings.AUTH_JWT_SECRET != "replace-with-a-secure-secret-key-in-production":
        signing_input = f"{header_b64}.{payload_b64}".encode("utf-8")
        expected_sig = hmac.new(
            settings.AUTH_JWT_SECRET.encode("utf-8"),
            signing_input,
            hashlib.sha256
        ).digest()
        actual_sig = base64url_decode(signature_b64)

        if not hmac.compare_digest(expected_sig, actual_sig):
            raise UnauthorizedException("Invalid token signature")

    # Check expiration claim if present
    exp = payload.get("exp")
    if exp and isinstance(exp, (int, float)):
        if time.time() > exp:
            raise UnauthorizedException("Authentication token has expired")

    # Ensure subject claim is present
    sub = payload.get("sub")
    if not sub:
        raise UnauthorizedException("Token missing required 'sub' claim")

    return payload


def get_current_user(
    credentials: Optional[HTTPAuthorizationCredentials] = Depends(security_scheme),
    db: Session = Depends(get_db)
) -> User:
    """
    FastAPI dependency that extracts the authenticated external identity,
    resolves or provisions the internal CodeMRI user, and returns the User model.
    """
    if not credentials or not credentials.credentials:
        raise UnauthorizedException("Missing Authorization header or Bearer token")

    token = credentials.credentials
    claims = parse_and_verify_token(token)

    auth_subject = str(claims["sub"])
    auth_provider = str(claims.get("iss") or claims.get("provider") or settings.AUTH_PROVIDER_DEFAULT)

    # Optional metadata from token claims
    email = claims.get("email")
    display_name = claims.get("name") or claims.get("preferred_username")
    avatar_url = claims.get("picture") or claims.get("avatar_url")

    # Lookup existing user
    stmt = select(User).where(
        User.auth_provider == auth_provider,
        User.auth_subject == auth_subject
    )
    user = db.scalar(stmt)

    if not user:
        # Auto-provision internal user record for authenticated external identity
        user = User(
            auth_provider=auth_provider,
            auth_subject=auth_subject,
            email=email,
            display_name=display_name,
            avatar_url=avatar_url
        )
        db.add(user)
        try:
            db.commit()
            db.refresh(user)
            logger.info(f"Provisioned new user {user.id} for {auth_provider}:{auth_subject}")
        except Exception as e:
            db.rollback()
            # Handle potential race condition if created concurrently
            user = db.scalar(stmt)
            if not user:
                raise UnauthorizedException(f"Could not provision user identity: {e}")
    else:
        # Optionally update email/display name if changed
        updated = False
        if email and user.email != email:
            user.email = email
            updated = True
        if display_name and user.display_name != display_name:
            user.display_name = display_name
            updated = True
        if avatar_url and user.avatar_url != avatar_url:
            user.avatar_url = avatar_url
            updated = True
        if updated:
            try:
                db.commit()
                db.refresh(user)
            except Exception:
                db.rollback()

    return user
