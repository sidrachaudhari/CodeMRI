import json
import os
import time
import urllib.error
import urllib.request
from typing import Any, Dict, List

from fastapi import APIRouter, HTTPException, status

from app.core.config import settings
from app.schemas.llm import LlmExecuteRequest, LlmExecuteResponse
from app.services.gemini_service import GeminiService

router = APIRouter(prefix="/llm", tags=["LLM Execution"])

DEFAULT_SYSTEM_INSTRUCTION = (
    "You are CodeMRI AI, a principal software architect and security remediation engineer. "
    "Provide a clear, immediately executable step-by-step remediation plan, exact code patches / config diffs, "
    "and verification tests for the requested recommendation."
)

PROVIDER_ENV_MAP = {
    "gemini": "GEMINI_API_KEY",
    "openai": "OPENAI_API_KEY",
    "anthropic": "ANTHROPIC_API_KEY",
    "openrouter": "OPENROUTER_API_KEY",
    "groq": "GROQ_API_KEY",
    "ollama": None,
    "custom": "CUSTOM_LLM_API_KEY",
}


def _env_value(key: str) -> str:
    val = getattr(settings, key, "") or os.getenv(key, "")
    val = str(val).strip()
    if not val or val.startswith("your_") or "placeholder" in val:
        return ""
    return val


def _post_json(url: str, headers: Dict[str, str], body: Dict[str, Any]) -> Dict[str, Any]:
    req = urllib.request.Request(
        url,
        data=json.dumps(body).encode("utf-8"),
        headers={"Content-Type": "application/json", **headers},
        method="POST",
    )
    try:
        with urllib.request.urlopen(req, timeout=90) as resp:
            return json.loads(resp.read().decode("utf-8"))
    except urllib.error.HTTPError as exc:
        raw = exc.read().decode("utf-8", errors="ignore")
        try:
            err_json = json.loads(raw)
            detail = err_json.get("error", {}).get("message") if isinstance(err_json.get("error"), dict) else err_json.get("error")
        except Exception:
            detail = raw or str(exc)
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=detail or f"LLM provider HTTP {exc.code}",
        )
    except urllib.error.URLError as exc:
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail=f"Could not connect to LLM endpoint {url}: {exc.reason}",
        )


@router.get("/providers", summary="Check configured LLM providers")
def list_llm_providers():
    providers = {}
    for pid, env_key in PROVIDER_ENV_MAP.items():
        providers[pid] = {
            "configured": True if env_key is None else bool(_env_value(env_key)),
        }
    return {"defaultProvider": "gemini", "providers": providers}


@router.post("/execute", response_model=LlmExecuteResponse, summary="Execute recommendation prompt with an LLM")
def execute_llm(req: LlmExecuteRequest):
    provider = req.provider.lower().strip()
    system_instruction = req.systemInstruction or DEFAULT_SYSTEM_INSTRUCTION

    messages: List[Dict[str, str]] = []
    if req.messages:
        messages = [
            {"role": "assistant" if m.role == "assistant" else "user", "content": m.content.strip()}
            for m in req.messages
            if m.content.strip()
        ]
    elif req.prompt and req.prompt.strip():
        messages = [{"role": "user", "content": req.prompt.strip()}]

    if not messages:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Prompt or messages required.")

    env_key = PROVIDER_ENV_MAP.get(provider)
    api_key = (req.apiKey or "").strip() or (_env_value(env_key) if env_key else "")

    if provider not in ("ollama", "custom") and not api_key:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"No API key configured for provider '{provider}'. Set {env_key} in backend/.env or provide apiKey.",
        )

    start = time.time()

    if provider == "gemini":
        model = (req.model or "").strip() or settings.GEMINI_MODEL or "gemini-2.5-flash"
        compiled_prompt = (
            messages[0]["content"]
            if len(messages) == 1
            else "\n\n".join(f"{m['role'].upper()}: {m['content']}" for m in messages)
        )
        try:
            service = GeminiService(api_key=api_key, model_name=model)
            result = service.generate_content(
                prompt=compiled_prompt,
                system_instruction=system_instruction,
                temperature=req.temperature,
            )
        except Exception as exc:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(exc))

        usage = result.get("token_usage") or {}
        return LlmExecuteResponse(
            provider="gemini",
            model=model,
            text=result.get("text", ""),
            durationMs=result.get("duration_ms", int((time.time() - start) * 1000)),
            tokenUsage={
                "promptTokens": usage.get("prompt_tokens", 0),
                "completionTokens": usage.get("candidates_tokens", 0),
                "totalTokens": usage.get("total_tokens", 0),
            },
        )

    if provider == "anthropic":
        model = (req.model or "").strip() or "claude-sonnet-4-20250514"
        data = _post_json(
            "https://api.anthropic.com/v1/messages",
            {"x-api-key": api_key, "anthropic-version": "2023-06-01"},
            {
                "model": model,
                "max_tokens": 4096,
                "temperature": req.temperature,
                "system": system_instruction,
                "messages": messages,
            },
        )
        text = "\n".join(b.get("text", "") for b in data.get("content", []) if b.get("type") == "text").strip()
        usage = data.get("usage") or {}
        return LlmExecuteResponse(
            provider="anthropic",
            model=model,
            text=text,
            durationMs=int((time.time() - start) * 1000),
            tokenUsage={
                "promptTokens": usage.get("input_tokens", 0),
                "completionTokens": usage.get("output_tokens", 0),
                "totalTokens": usage.get("input_tokens", 0) + usage.get("output_tokens", 0),
            },
        )

    if provider == "ollama":
        model = (req.model or "").strip() or "llama3.2"
        base = (req.baseUrl or os.getenv("OLLAMA_BASE_URL") or "http://localhost:11434").rstrip("/")
        data = _post_json(
            f"{base}/api/chat",
            {},
            {
                "model": model,
                "messages": [{"role": "system", "content": system_instruction}, *messages],
                "stream": False,
                "options": {"temperature": req.temperature},
            },
        )
        return LlmExecuteResponse(
            provider="ollama",
            model=model,
            text=(data.get("message") or {}).get("content", "").strip(),
            durationMs=int((time.time() - start) * 1000),
            tokenUsage={
                "promptTokens": data.get("prompt_eval_count", 0),
                "completionTokens": data.get("eval_count", 0),
                "totalTokens": data.get("prompt_eval_count", 0) + data.get("eval_count", 0),
            },
        )

    endpoint_map = {
        "openai": ("https://api.openai.com/v1/chat/completions", "gpt-4o-mini"),
        "openrouter": ("https://openrouter.ai/api/v1/chat/completions", "google/gemini-2.5-flash"),
        "groq": ("https://api.groq.com/openai/v1/chat/completions", "llama-3.3-70b-versatile"),
    }

    if provider in endpoint_map:
        endpoint, default_model = endpoint_map[provider]
        model = (req.model or "").strip() or default_model
    elif provider == "custom":
        base = (req.baseUrl or os.getenv("CUSTOM_LLM_BASE_URL") or "").rstrip("/")
        if not base:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="baseUrl is required for custom provider.",
            )
        endpoint = base if base.endswith("/chat/completions") else f"{base}/chat/completions"
        model = (req.model or "").strip() or "gpt-4o-mini"
    else:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=f"Unsupported provider '{provider}'.")

    headers = {"Authorization": f"Bearer {api_key}"} if api_key else {}
    data = _post_json(
        endpoint,
        headers,
        {
            "model": model,
            "temperature": req.temperature,
            "messages": [{"role": "system", "content": system_instruction}, *messages],
        },
    )
    text = ((data.get("choices") or [{}])[0].get("message") or {}).get("content", "").strip()
    usage = data.get("usage") or {}
    return LlmExecuteResponse(
        provider=provider,
        model=model,
        text=text,
        durationMs=int((time.time() - start) * 1000),
        tokenUsage={
            "promptTokens": usage.get("prompt_tokens", 0),
            "completionTokens": usage.get("completion_tokens", 0),
            "totalTokens": usage.get("total_tokens", 0),
        },
    )
