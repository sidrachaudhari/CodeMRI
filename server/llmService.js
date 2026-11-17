import fs from 'fs';
import path from 'path';

const ENV_FILES = ['.env.local', '.env', path.join('backend', '.env')];

/**
 * Reads an environment variable from process.env or fallback .env files
 * (root .env.local, root .env, or backend/.env).
 */
function resolveEnvVar(name) {
  if (process.env[name] && process.env[name].trim()) {
    return process.env[name].trim();
  }

  for (const relPath of ENV_FILES) {
    try {
      const fullPath = path.resolve(process.cwd(), relPath);
      if (!fs.existsSync(fullPath)) continue;
      const content = fs.readFileSync(fullPath, 'utf-8');
      const regex = new RegExp(`^${name}=(.*)$`, 'm');
      const match = content.match(regex);
      if (match && match[1]) {
        const cleaned = match[1].trim().replace(/^["'](.*)["']$/, '$1').trim();
        if (cleaned && !cleaned.startsWith('your_') && !cleaned.includes('placeholder')) {
          return cleaned;
        }
      }
    } catch {
      // Ignore unreadable env files
    }
  }

  return '';
}

const PROVIDER_ENV_KEYS = {
  gemini: 'GEMINI_API_KEY',
  openai: 'OPENAI_API_KEY',
  anthropic: 'ANTHROPIC_API_KEY',
  openrouter: 'OPENROUTER_API_KEY',
  groq: 'GROQ_API_KEY',
  ollama: null,
  custom: 'CUSTOM_LLM_API_KEY',
};

const DEFAULT_MODELS = {
  gemini: () => resolveEnvVar('GEMINI_MODEL') || 'gemini-2.5-flash',
  openai: () => resolveEnvVar('OPENAI_MODEL') || 'gpt-4o-mini',
  anthropic: () => resolveEnvVar('ANTHROPIC_MODEL') || 'claude-sonnet-4-20250514',
  openrouter: () => resolveEnvVar('OPENROUTER_MODEL') || 'google/gemini-2.5-flash',
  groq: () => resolveEnvVar('GROQ_MODEL') || 'llama-3.3-70b-versatile',
  ollama: () => resolveEnvVar('OLLAMA_MODEL') || 'llama3.2',
  custom: () => resolveEnvVar('CUSTOM_LLM_MODEL') || 'gpt-4o-mini',
};

/**
 * Returns non-sensitive configuration status for each supported LLM provider.
 */
export function getLlmProviderStatus() {
  const providers = {};
  for (const [id, envKey] of Object.entries(PROVIDER_ENV_KEYS)) {
    providers[id] = {
      configured: envKey === null ? true : Boolean(resolveEnvVar(envKey)),
      defaultModel: DEFAULT_MODELS[id](),
      ...(id === 'ollama'
        ? { baseUrl: resolveEnvVar('OLLAMA_BASE_URL') || 'http://localhost:11434' }
        : {}),
      ...(id === 'custom'
        ? { baseUrl: resolveEnvVar('CUSTOM_LLM_BASE_URL') || '' }
        : {}),
    };
  }
  return {
    defaultProvider: 'gemini',
    providers,
  };
}

function normalizeMessages(prompt, messages) {
  if (Array.isArray(messages) && messages.length > 0) {
    return messages
      .filter((m) => m && typeof m.content === 'string' && m.content.trim())
      .map((m) => ({
        role: m.role === 'assistant' ? 'assistant' : 'user',
        content: m.content.trim(),
      }));
  }
  return [{ role: 'user', content: String(prompt || '').trim() }];
}

async function callGemini({ apiKey, model, systemInstruction, messages, temperature }) {
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(
    model
  )}:generateContent?key=${encodeURIComponent(apiKey)}`;

  const contents = messages.map((m) => ({
    role: m.role === 'assistant' ? 'model' : 'user',
    parts: [{ text: m.content }],
  }));

  const body = {
    contents,
    generationConfig: {
      temperature: typeof temperature === 'number' ? temperature : 0.2,
    },
  };

  if (systemInstruction) {
    body.systemInstruction = {
      parts: [{ text: systemInstruction }],
    };
  }

  const response = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });

  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    const msg = data?.error?.message || `Gemini API error (HTTP ${response.status})`;
    throw new Error(msg);
  }

  const text =
    data?.candidates?.[0]?.content?.parts
      ?.map((p) => p.text || '')
      .join('')
      .trim() || '';

  if (!text) {
    throw new Error('Gemini returned an empty response. Check safety filters or model availability.');
  }

  const usage = data?.usageMetadata || {};
  return {
    text,
    tokenUsage: {
      promptTokens: usage.promptTokenCount || 0,
      completionTokens: usage.candidatesTokenCount || 0,
      totalTokens: usage.totalTokenCount || 0,
    },
  };
}

async function callOpenAICompatible({
  endpoint,
  apiKey,
  model,
  systemInstruction,
  messages,
  temperature,
  extraHeaders = {},
}) {
  const chatMessages = [];
  if (systemInstruction) {
    chatMessages.push({ role: 'system', content: systemInstruction });
  }
  for (const m of messages) {
    chatMessages.push({ role: m.role, content: m.content });
  }

  const headers = {
    'Content-Type': 'application/json',
    ...extraHeaders,
  };
  if (apiKey) {
    headers.Authorization = `Bearer ${apiKey}`;
  }

  const response = await fetch(endpoint, {
    method: 'POST',
    headers,
    body: JSON.stringify({
      model,
      messages: chatMessages,
      temperature: typeof temperature === 'number' ? temperature : 0.2,
    }),
  });

  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    const msg =
      data?.error?.message ||
      (typeof data?.error === 'string' ? data.error : null) ||
      `LLM API error (HTTP ${response.status})`;
    throw new Error(msg);
  }

  const text = data?.choices?.[0]?.message?.content?.trim() || '';
  if (!text) {
    throw new Error('The LLM returned an empty response.');
  }

  const usage = data?.usage || {};
  return {
    text,
    tokenUsage: {
      promptTokens: usage.prompt_tokens || 0,
      completionTokens: usage.completion_tokens || 0,
      totalTokens: usage.total_tokens || 0,
    },
  };
}

async function callAnthropic({ apiKey, model, systemInstruction, messages, temperature }) {
  const response = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({
      model,
      max_tokens: 4096,
      temperature: typeof temperature === 'number' ? temperature : 0.2,
      ...(systemInstruction ? { system: systemInstruction } : {}),
      messages: messages.map((m) => ({
        role: m.role,
        content: m.content,
      })),
    }),
  });

  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    const msg = data?.error?.message || `Anthropic API error (HTTP ${response.status})`;
    throw new Error(msg);
  }

  const text =
    data?.content
      ?.filter((block) => block.type === 'text')
      .map((block) => block.text)
      .join('\n')
      .trim() || '';

  if (!text) {
    throw new Error('Anthropic returned an empty response.');
  }

  const usage = data?.usage || {};
  return {
    text,
    tokenUsage: {
      promptTokens: usage.input_tokens || 0,
      completionTokens: usage.output_tokens || 0,
      totalTokens: (usage.input_tokens || 0) + (usage.output_tokens || 0),
    },
  };
}

async function callOllama({ baseUrl, model, systemInstruction, messages, temperature }) {
  const cleanBase = (baseUrl || resolveEnvVar('OLLAMA_BASE_URL') || 'http://localhost:11434').replace(
    /\/+$/,
    ''
  );
  const endpoint = `${cleanBase}/api/chat`;

  const chatMessages = [];
  if (systemInstruction) {
    chatMessages.push({ role: 'system', content: systemInstruction });
  }
  for (const m of messages) {
    chatMessages.push({ role: m.role, content: m.content });
  }

  let response;
  try {
    response = await fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model,
        messages: chatMessages,
        stream: false,
        options: {
          temperature: typeof temperature === 'number' ? temperature : 0.2,
        },
      }),
    });
  } catch (err) {
    throw new Error(
      `Could not connect to Ollama at ${cleanBase}. Make sure Ollama is running locally (${err.message}).`
    );
  }

  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(data?.error || `Ollama error (HTTP ${response.status})`);
  }

  const text = data?.message?.content?.trim() || '';
  if (!text) {
    throw new Error('Ollama returned an empty response.');
  }

  return {
    text,
    tokenUsage: {
      promptTokens: data?.prompt_eval_count || 0,
      completionTokens: data?.eval_count || 0,
      totalTokens: (data?.prompt_eval_count || 0) + (data?.eval_count || 0),
    },
  };
}

/**
 * Executes a CodeMRI recommendation remediation prompt against any configured LLM provider.
 */
export async function executeLlmPrompt(payload = {}) {
  const provider = (payload.provider || 'gemini').toLowerCase().trim();
  const model =
    (payload.model && payload.model.trim()) ||
    (DEFAULT_MODELS[provider] ? DEFAULT_MODELS[provider]() : 'gemini-2.5-flash');
  const systemInstruction =
    payload.systemInstruction ||
    'You are CodeMRI AI, a principal software architect and security remediation engineer. ' +
      'Provide a clear, immediately executable step-by-step remediation plan, exact code patches / config diffs, ' +
      'and verification tests for the requested recommendation.';
  const messages = normalizeMessages(payload.prompt, payload.messages);
  const temperature = typeof payload.temperature === 'number' ? payload.temperature : 0.2;

  if (!messages.length || !messages[0].content) {
    throw new Error('A non-empty prompt is required to execute with the LLM.');
  }

  const envKeyName = PROVIDER_ENV_KEYS[provider];
  const resolvedApiKey =
    (payload.apiKey && payload.apiKey.trim()) || (envKeyName ? resolveEnvVar(envKeyName) : '');

  if (provider !== 'ollama' && provider !== 'custom' && !resolvedApiKey) {
    throw new Error(
      `No API key found for "${provider}". Enter an API key in the panel or configure ${envKeyName} in .env / backend/.env.`
    );
  }

  const startTime = Date.now();
  let result;

  switch (provider) {
    case 'gemini':
      result = await callGemini({
        apiKey: resolvedApiKey,
        model,
        systemInstruction,
        messages,
        temperature,
      });
      break;

    case 'openai':
      result = await callOpenAICompatible({
        endpoint: 'https://api.openai.com/v1/chat/completions',
        apiKey: resolvedApiKey,
        model,
        systemInstruction,
        messages,
        temperature,
      });
      break;

    case 'anthropic':
      result = await callAnthropic({
        apiKey: resolvedApiKey,
        model,
        systemInstruction,
        messages,
        temperature,
      });
      break;

    case 'openrouter':
      result = await callOpenAICompatible({
        endpoint: 'https://openrouter.ai/api/v1/chat/completions',
        apiKey: resolvedApiKey,
        model,
        systemInstruction,
        messages,
        temperature,
        extraHeaders: {
          'HTTP-Referer': 'http://localhost:5173',
          'X-Title': 'CodeMRI Action Plan Executor',
        },
      });
      break;

    case 'groq':
      result = await callOpenAICompatible({
        endpoint: 'https://api.groq.com/openai/v1/chat/completions',
        apiKey: resolvedApiKey,
        model,
        systemInstruction,
        messages,
        temperature,
      });
      break;

    case 'ollama':
      result = await callOllama({
        baseUrl: payload.baseUrl,
        model,
        systemInstruction,
        messages,
        temperature,
      });
      break;

    case 'custom': {
      const cleanBase = (
        payload.baseUrl ||
        resolveEnvVar('CUSTOM_LLM_BASE_URL') ||
        ''
      ).replace(/\/+$/, '');
      if (!cleanBase) {
        throw new Error(
          'A Base URL is required for the Custom OpenAI-Compatible provider (e.g. https://api.deepseek.com/v1 or http://localhost:1234/v1).'
        );
      }
      const endpoint = cleanBase.endsWith('/chat/completions')
        ? cleanBase
        : `${cleanBase}/chat/completions`;
      result = await callOpenAICompatible({
        endpoint,
        apiKey: resolvedApiKey,
        model,
        systemInstruction,
        messages,
        temperature,
      });
      break;
    }

    default:
      throw new Error(`Unsupported LLM provider: "${provider}".`);
  }

  return {
    provider,
    model,
    text: result.text,
    tokenUsage: result.tokenUsage,
    durationMs: Date.now() - startTime,
  };
}
