import unittest
import uuid
from sqlalchemy import create_engine
from sqlalchemy.ext.compiler import compiles
from sqlalchemy.dialects.postgresql import INET, JSONB
from sqlalchemy.orm import sessionmaker, Session
from pgvector.sqlalchemy import Vector

from app.models import Base
from app.models.models import User, Workspace, WorkspaceMember, Repository

# Enable SQLite in-memory compilation for PostgreSQL types
@compiles(INET, "sqlite")
def compile_inet_sqlite(type_, compiler, **kw):
    return "TEXT"

@compiles(JSONB, "sqlite")
def compile_jsonb_sqlite(type_, compiler, **kw):
    return "JSON"

@compiles(Vector, "sqlite")
def compile_vector_sqlite(type_, compiler, **kw):
    return "BLOB"


class BaseTestCase(unittest.TestCase):
    """
    Base test fixture providing an isolated, in-memory SQLite database
    for safe, repeatable testing without mutating production NeonDB.
    """
    @classmethod
    def setUpClass(cls):
        cls.engine = create_engine("sqlite:///:memory:", echo=False)
        Base.metadata.create_all(cls.engine)
        cls.SessionLocal = sessionmaker(
            bind=cls.engine,
            autoflush=False,
            autocommit=False,
            expire_on_commit=False,
        )

    @classmethod
    def tearDownClass(cls):
        Base.metadata.drop_all(cls.engine)
        cls.engine.dispose()

    def setUp(self):
        self.db: Session = self.SessionLocal()

    def tearDown(self):
        self.db.rollback()
        self.db.close()

    def create_test_user(
        self,
        auth_subject: str = None,
        auth_provider: str = "neon_auth",
        email: str = None,
        display_name: str = "Test User"
    ) -> User:
        sub = auth_subject or f"sub-{uuid.uuid4().hex[:8]}"
        user = User(
            auth_provider=auth_provider,
            auth_subject=sub,
            email=email or f"{sub}@example.com",
            display_name=display_name,
        )
        self.db.add(user)
        self.db.commit()
        self.db.refresh(user)
        return user
