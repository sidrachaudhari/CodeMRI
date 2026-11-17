from typing import Any, Dict, List, Optional
from pydantic import BaseModel, Field


class LlmMessage(BaseModel):
    role: str = Field(..., description="Message role: 'user' or 'assistant'")
    content: str = Field(..., min_length=1)


class LlmExecuteRequest(BaseModel):
    provider: str = Field(default="gemini", description="LLM provider id (gemini, openai, anthropic, openrouter, groq, ollama, custom)")
    model: Optional[str] = Field(default=None, description="Model identifier")
    prompt: Optional[str] = Field(default=None, description="Single prompt text")
    messages: Optional[List[LlmMessage]] = Field(default=None, description="Multi-turn conversation messages")
    systemInstruction: Optional[str] = Field(default=None, description="System prompt")
    apiKey: Optional[str] = Field(default=None, description="Optional per-request API key override")
    baseUrl: Optional[str] = Field(default=None, description="Base URL for ollama or custom OpenAI-compatible endpoints")
    temperature: float = Field(default=0.2, ge=0.0, le=2.0)


class LlmExecuteResponse(BaseModel):
    provider: str
    model: str
    text: str
    durationMs: int
    tokenUsage: Dict[str, Any] = Field(default_factory=dict)
