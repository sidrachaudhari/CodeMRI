import unittest
from unittest.mock import MagicMock, patch
from app.services.gemini_service import GeminiService


class TestGeminiService(unittest.TestCase):
    def setUp(self):
        self.service = GeminiService(api_key="mock-api-key", model_name="gemini-3.8-flash")

    @patch("app.services.gemini_service.genai.Client")
    def test_explain_code_calls_gemini_client(self, mock_client_cls):
        mock_client = MagicMock()
        mock_response = MagicMock()
        mock_response.text = "This class implements a thread-safe singleton pattern."
        mock_response.usage_metadata.prompt_token_count = 120
        mock_response.usage_metadata.candidates_token_count = 45
        mock_response.usage_metadata.total_token_count = 165
        mock_client.models.generate_content.return_value = mock_response

        self.service.client = mock_client

        result = self.service.explain_code(
            code_snippet="public class Service { ... }",
            file_path="src/main/java/Service.java"
        )

        self.assertEqual(result["model_name"], "gemini-3.8-flash")
        self.assertEqual(result["model_provider"], "google")
        self.assertIn("singleton", result["text"])
        self.assertEqual(result["token_usage"]["total_tokens"], 165)
        mock_client.models.generate_content.assert_called_once()

    @patch("app.services.gemini_service.genai.Client")
    def test_analyze_finding(self, mock_client_cls):
        mock_client = MagicMock()
        mock_response = MagicMock()
        mock_response.text = "Root Cause: Unsanitized SQL input allows SQL Injection."
        mock_client.models.generate_content.return_value = mock_response

        self.service.client = mock_client

        result = self.service.analyze_finding(
            title="SQL Injection in Repository query",
            category="Security",
            severity="CRITICAL",
            description="Direct string concatenation in query",
            code_evidence="String q = 'SELECT * FROM users WHERE name = ' + name;"
        )

        self.assertIn("SQL Injection", result["text"])


if __name__ == "__main__":
    unittest.main()
