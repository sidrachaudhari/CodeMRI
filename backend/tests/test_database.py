import unittest
from sqlalchemy.orm import configure_mappers, Session
from app.models import Base
from app.core.config import settings
from app.database.connection import get_db, SessionLocal
from tests.test_base import BaseTestCase


class TestDatabaseLayer(BaseTestCase):
    def test_model_registration(self):
        """Verify all 17 application models are registered in Base.metadata."""
        tables = Base.metadata.tables.keys()
        self.assertEqual(len(tables), 17)
        expected_tables = {
            "users", "workspaces", "workspace_members", "repositories",
            "analyses", "source_files", "code_entities", "dependencies",
            "findings", "analysis_metrics", "analysis_summaries", "recommendations",
            "code_chunks", "code_embeddings", "ai_interactions", "analysis_jobs",
            "audit_logs"
        }
        self.assertEqual(set(tables), expected_tables)

    def test_mapper_configuration(self):
        """Verify that SQLAlchemy mapper compilation succeeds with no relationship conflicts."""
        try:
            configure_mappers()
        except Exception as e:
            self.fail(f"configure_mappers failed: {e}")

    def test_session_lifecycle(self):
        """Verify that get_db dependency properly opens, yields, and closes session."""
        gen = get_db()
        session = next(gen)
        self.assertIsInstance(session, Session)
        self.assertTrue(session.is_active)
        # Advance generator to trigger cleanup
        try:
            next(gen)
        except StopIteration:
            pass  # Expected generator completion

    def test_settings_loaded(self):
        """Verify settings module loads proper defaults and configuration."""
        self.assertEqual(settings.PROJECT_NAME, "CodeMRI API")
        self.assertEqual(settings.VERSION, "1.0.0")
        self.assertTrue(settings.DATABASE_URL.startswith("postgresql+psycopg://"))


if __name__ == "__main__":
    unittest.main()
