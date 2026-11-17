import logging
import os
import time
from typing import Any, Dict, List, Optional
from google import genai
from google.genai import types
from tenacity import retry, retry_if_exception_type, stop_after_attempt, wait_exponential

from app.core.config import settings

logger = logging.getLogger(__name__)


class GeminiService:
    """
    Production-grade integration service for Google Gemini 3.8 Flash.
    Provides intelligent code analysis, root-cause diagnostics, and RAG intelligence
    with automatic retry handling for transient API spikes and rate limits.
    """

    def __init__(
        self,
        api_key: Optional[str] = None,
        model_name: Optional[str] = None,
        thinking_level: Optional[str] = None,
    ):
        self.api_key = api_key or settings.GEMINI_API_KEY or os.getenv("GEMINI_API_KEY", "")
        self.model_name = model_name or settings.GEMINI_MODEL or "gemini-3.8-flash"
        self.thinking_level = thinking_level or getattr(settings, "GEMINI_THINKING_LEVEL", "medium")

        if not self.api_key:
            logger.warning("GeminiService initialized without GEMINI_API_KEY. Calls will fail until configured.")

        # Initialize the official Google GenAI Client
        self.client = genai.Client(api_key=self.api_key) if self.api_key else None

    def _get_client(self) -> genai.Client:
        if not self.client:
            self.api_key = settings.GEMINI_API_KEY or os.getenv("GEMINI_API_KEY", "")
            if not self.api_key:
                raise ValueError("GEMINI_API_KEY is not configured in backend/.env")
            self.client = genai.Client(api_key=self.api_key)
        return self.client

    @retry(
        wait=wait_exponential(multiplier=1, min=2, max=10),
        stop=stop_after_attempt(3),
        reraise=True,
    )
    def generate_content(
        self,
        prompt: str,
        system_instruction: Optional[str] = None,
        temperature: float = 0.2,
        max_output_tokens: Optional[int] = None,
    ) -> Dict[str, Any]:
        """
        Executes a prompt against Gemini 3.8 Flash with exponential backoff for 503/429 spikes.
        """
        client = self._get_client()

        # Build configuration for Gemini 3.8 Flash
        config_args: Dict[str, Any] = {
            "temperature": temperature,
        }
        if system_instruction:
            config_args["system_instruction"] = system_instruction
        if max_output_tokens:
            config_args["max_output_tokens"] = max_output_tokens

        config = types.GenerateContentConfig(**config_args)

        start_time = time.time()
        try:
            response = client.models.generate_content(
                model=self.model_name,
                contents=prompt,
                config=config,
            )
            duration_ms = int((time.time() - start_time) * 1000)

            # Extract token usage if returned by SDK
            token_usage = {}
            if hasattr(response, "usage_metadata") and response.usage_metadata:
                token_usage = {
                    "prompt_tokens": getattr(response.usage_metadata, "prompt_token_count", 0),
                    "candidates_tokens": getattr(response.usage_metadata, "candidates_token_count", 0),
                    "total_tokens": getattr(response.usage_metadata, "total_token_count", 0),
                }

            return {
                "text": response.text if hasattr(response, "text") and response.text else "",
                "model_name": self.model_name,
                "model_provider": "google",
                "duration_ms": duration_ms,
                "token_usage": token_usage,
            }
        except Exception as exc:
            logger.warning(f"Gemini API request failed (will retry if attempts remain): {exc}")
            raise

    def explain_code(
        self,
        code_snippet: str,
        file_path: Optional[str] = None,
        context: Optional[str] = None,
    ) -> Dict[str, Any]:
        """
        Explains Java source code, classes, or methods for CodeMRI intelligence.
        """
        system_instruction = (
            "You are CodeMRI AI, a senior Java architect and code intelligence specialist. "
            "Explain the architecture, design patterns, concurrency safety, and performance characteristics "
            "of the provided Java code concisely and authoritatively."
        )

        prompt = f"File: {file_path or 'Java Source'}\n\n"
        if context:
            prompt += f"Architectural Context:\n{context}\n\n"
        prompt += f"Code Snippet:\n```java\n{code_snippet}\n```"

        return self.generate_content(prompt=prompt, system_instruction=system_instruction)

    def analyze_finding(
        self,
        title: str,
        category: str,
        severity: str,
        description: str,
        code_evidence: Optional[str] = None,
    ) -> Dict[str, Any]:
        """
        Performs automated root cause and impact analysis for static code analysis findings.
        """
        system_instruction = (
            "You are CodeMRI's automated static analysis diagnostic engine. "
            "Given a code finding or vulnerability, diagnose the exact root cause, security/performance impact, "
            "and suggest an actionable fix."
        )

        prompt = (
            f"Finding: {title}\n"
            f"Category: {category}\n"
            f"Severity: {severity}\n"
            f"Description: {description}\n"
        )
        if code_evidence:
            prompt += f"Evidence:\n```java\n{code_evidence}\n```"

        return self.generate_content(prompt=prompt, system_instruction=system_instruction)


# Global singleton instance
gemini_service = GeminiService()
