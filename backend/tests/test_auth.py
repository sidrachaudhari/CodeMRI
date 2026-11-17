import unittest
import base64
import json
import time
from fastapi.security import HTTPAuthorizationCredentials
from app.core.exceptions import UnauthorizedException
from app.core.security import get_current_user, parse_and_verify_token
from app.models.models import User
from tests.test_base import BaseTestCase


def create_mock_jwt(payload: dict) -> str:
    header = {"alg": "none", "typ": "JWT"}
    header_b64 = base64.urlsafe_b64encode(json.dumps(header).encode()).decode().rstrip("=")
    payload_b64 = base64.urlsafe_b64encode(json.dumps(payload).encode()).decode().rstrip("=")
    return f"{header_b64}.{payload_b64}.c2lnbmF0dXJl"


class TestAuthentication(BaseTestCase):
    def test_missing_token(self):
        """Verify missing credentials raise 401 Unauthorized."""
        with self.assertRaises(UnauthorizedException) as ctx:
            get_current_user(None, self.db)
        self.assertIn("Missing Authorization header", ctx.exception.detail)

    def test_invalid_token_format(self):
        """Verify non-JWT strings raise 401 Unauthorized."""
        creds = HTTPAuthorizationCredentials(scheme="Bearer", credentials="invalid-token-string")
        with self.assertRaises(UnauthorizedException) as ctx:
            get_current_user(creds, self.db)
        self.assertIn("Invalid token format", ctx.exception.detail)

    def test_expired_token(self):
        """Verify expired tokens raise 401 Unauthorized."""
        expired_payload = {
            "sub": "user_exp_123",
            "exp": time.time() - 3600,
            "iss": "neon_auth"
        }
        token = create_mock_jwt(expired_payload)
        creds = HTTPAuthorizationCredentials(scheme="Bearer", credentials=token)
        with self.assertRaises(UnauthorizedException) as ctx:
            get_current_user(creds, self.db)
        self.assertIn("expired", ctx.exception.detail)

    def test_valid_token_provisions_internal_user(self):
        """Verify valid token claims provision a new internal user in the database."""
        payload = {
            "sub": "neon_auth_usr_9988",
            "email": "sarah.connor@example.com",
            "name": "Sarah Connor",
            "iss": "neon_auth",
            "exp": time.time() + 3600,
        }
        token = create_mock_jwt(payload)
        creds = HTTPAuthorizationCredentials(scheme="Bearer", credentials=token)

        user = get_current_user(creds, self.db)
        self.assertIsNotNone(user)
        self.assertIsNotNone(user.id)
        self.assertEqual(user.auth_provider, "neon_auth")
        self.assertEqual(user.auth_subject, "neon_auth_usr_9988")
        self.assertEqual(user.email, "sarah.connor@example.com")
        self.assertEqual(user.display_name, "Sarah Connor")

        # Calling again with the same token retrieves the existing user
        user_repeat = get_current_user(creds, self.db)
        self.assertEqual(user.id, user_repeat.id)

    def test_dev_token_format(self):
        """Verify structured dev token 'dev:sub:email:name' parses and maps user correctly."""
        creds = HTTPAuthorizationCredentials(scheme="Bearer", credentials="dev:engineer-01:dev@codemri.io:Senior Dev")
        user = get_current_user(creds, self.db)
        self.assertEqual(user.auth_subject, "engineer-01")
        self.assertEqual(user.email, "dev@codemri.io")
        self.assertEqual(user.display_name, "Senior Dev")


if __name__ == "__main__":
    unittest.main()
