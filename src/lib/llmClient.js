/**
 * Client utilities for connecting CodeMRI's Recommended Action Plan
 * to any LLM API (Google Gemini default, OpenAI, Anthropic, OpenRouter, Groq,
 * Ollama, or any Custom OpenAI-compatible endpoint) as well as external LLM web apps.
 *
 * Execution flow:
 * 1. Tries Vite server middleware proxy (/api/llm/execute) — uses .env / backend/.env keys automatically.
 * 2. If the proxy route isn't mounted (e.g., HTTP 404 on a static host or un-restarted Vite server),
 *    falls back to calling the LLM API directly from the browser using the entered API key / URL,
 *    or falls back to the FastAPI backend (http://localhost:8000/api/v1/llm/execute) if running.
 */

export const LLM_PROVIDERS = [
  {
    id: 'gemini',
    name: 'Google Gemini',
    badge: 'Default',
    defaultModel: 'gemini-2.5-flash',
    suggestedModels: ['gemini-2.5-flash', 'gemini-2.5-pro', 'gemini-2.0-flash'],
    requiresApiKey: true,
    requiresBaseUrl: false,
    envVar: 'GEMINI_API_KEY',
    keyPlaceholder: 'AIza...',
    helpUrl: 'https://aistudio.google.com/apikey',
  },
  {
    id: 'openai',
    name: 'OpenAI',
    badge: 'GPT',
    defaultModel: 'gpt-4o-mini',
    suggestedModels: ['gpt-4o-mini', 'gpt-4o', 'o3-mini'],
    requiresApiKey: true,
    requiresBaseUrl: false,
    envVar: 'OPENAI_API_KEY',
    keyPlaceholder: 'sk-...',
    helpUrl: 'https://platform.openai.com/api-keys',
  },
  {
    id: 'anthropic',
    name: 'Anthropic Claude',
    badge: 'Claude',
    defaultModel: 'claude-sonnet-4-20250514',
    suggestedModels: ['claude-sonnet-4-20250514', 'claude-3-5-haiku-latest'],
    requiresApiKey: true,
    requiresBaseUrl: false,
    envVar: 'ANTHROPIC_API_KEY',
    keyPlaceholder: 'sk-ant-...',
    helpUrl: 'https://console.anthropic.com/settings/keys',
  },
  {
    id: 'openrouter',
    name: 'OpenRouter',
    badge: 'Multi-Model',
    defaultModel: 'google/gemini-2.5-flash',
    suggestedModels: [
      'google/gemini-2.5-flash',
      'anthropic/claude-sonnet-4',
      'openai/gpt-4o-mini',
      'deepseek/deepseek-r1',
    ],
    requiresApiKey: true,
    requiresBaseUrl: false,
    envVar: 'OPENROUTER_API_KEY',
    keyPlaceholder: 'sk-or-...',
    helpUrl: 'https://openrouter.ai/keys',
  },
  {
    id: 'groq',
    name: 'Groq',
    badge: 'Fast',
    defaultModel: 'llama-3.3-70b-versatile',
    suggestedModels: ['llama-3.3-70b-versatile', 'llama-3.1-8b-instant'],
    requiresApiKey: true,
    requiresBaseUrl: false,
    envVar: 'GROQ_API_KEY',
    keyPlaceholder: 'gsk_...',
    helpUrl: 'https://console.groq.com/keys',
  },
  {
    id: 'ollama',
    name: 'Ollama (Local)',
    badge: 'No Key',
    defaultModel: 'llama3.2',
    suggestedModels: ['llama3.2', 'qwen2.5-coder', 'deepseek-r1', 'codellama'],
    requiresApiKey: false,
    requiresBaseUrl: true,
    defaultBaseUrl: 'http://localhost:11434',
    baseUrlPlaceholder: 'http://localhost:11434',
    envVar: 'OLLAMA_BASE_URL',
  },
  {
    id: 'custom',
    name: 'Custom OpenAI-Compatible',
    badge: 'Any LLM',
    defaultModel: 'gpt-4o-mini',
    suggestedModels: [],
    requiresApiKey: false,
    requiresBaseUrl: true,
    defaultBaseUrl: '',
    baseUrlPlaceholder: 'https://api.deepseek.com/v1 or http://localhost:1234/v1',
    keyPlaceholder: 'Optional API key...',
    envVar: 'CUSTOM_LLM_BASE_URL',
  },
];

export const EXTERNAL_LLM_TARGETS = [
  {
    id: 'chatgpt-web',
    name: 'ChatGPT',
    provider: 'OpenAI',
    description: 'Opens ChatGPT with your problem prompt pre-filled',
    buildUrl: (prompt) => `https://chatgpt.com/?q=${encodeURIComponent(prompt)}`,
    autoFillsPrompt: true,
  },
  {
    id: 'claude-web',
    name: 'Claude',
    provider: 'Anthropic',
    description: 'Opens Claude with your problem prompt pre-filled',
    buildUrl: (prompt) => `https://claude.ai/new?q=${encodeURIComponent(prompt)}`,
    autoFillsPrompt: true,
  },
  {
    id: 'gemini-web',
    name: 'Google Gemini',
    provider: 'Google',
    description: 'Copies your problem prompt & opens Gemini (paste with Ctrl+V)',
    buildUrl: () => 'https://gemini.google.com/app',
    autoFillsPrompt: false,
  },
  {
    id: 'perplexity-web',
    name: 'Perplexity',
    provider: 'Perplexity AI',
    description: 'Opens Perplexity with your problem prompt pre-filled',
    buildUrl: (prompt) => `https://www.perplexity.ai/search?q=${encodeURIComponent(prompt)}`,
    autoFillsPrompt: true,
  },
  {
    id: 'grok-web',
    name: 'Grok',
    provider: 'xAI',
    description: 'Opens Grok with your problem prompt pre-filled',
    buildUrl: (prompt) => `https://grok.com/?q=${encodeURIComponent(prompt)}`,
    autoFillsPrompt: true,
  },
];

const DEFAULT_SYSTEM_INSTRUCTION =
  'You are CodeMRI AI, a principal software architect and security remediation engineer. ' +
  'Provide a clear, immediately executable step-by-step remediation plan, exact code patches / config diffs, ' +
  'and verification tests for the requested recommendation.';

const STORAGE_KEY = 'codemri_llm_preferences_v1';

export function loadLlmPreferences() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return {};
    return JSON.parse(raw);
  } catch {
    return {};
  }
}

export function saveLlmPreferences(prefs) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(prefs));
  } catch {
    // Ignore storage quota / privacy errors
  }
}

/**
 * Matches modules and findings relevant to a roadmap recommendation item.
 */
export function findContextForRecommendation(item, modules = [], findings = []) {
  const targetText = `${item.module || ''} ${item.title || ''} ${item.category || ''}`.toLowerCase();

  const matchedModule =
    modules.find((m) => m?.name && targetText.includes(m.name.toLowerCase())) ||
    modules.find((m) => {
      const base = (m?.name || '').replace(/\.[^.]+$/, '').toLowerCase();
      return base && targetText.includes(base);
    }) ||
    null;

  const matchedFindings = findings.filter((f) => {
    const mod = (f?.module || '').toLowerCase();
    const title = (f?.title || '').toLowerCase();
    return (
      (mod && targetText.includes(mod)) ||
      (targetText.includes('log4j') && title.includes('log4j')) ||
      (targetText.includes('sql') && title.includes('sql'))
    );
  });

  return { matchedModule, matchedFindings };
}

/**
 * Builds a structured remediation prompt for the selected recommendation item.
 */
export function buildRecommendationPrompt({ item, repoSnapshot, matchedModule, matchedFindings = [] }) {
  const lines = [
    `Execute the following CodeMRI Recommended Action Plan item and provide an immediately actionable remediation:`,
    ``,
    `## Recommendation`,
    `- **Priority**: ${item.priority}`,
    `- **Title**: ${item.title}`,
    `- **Target Module**: ${item.module}`,
    `- **Category**: ${item.category}`,
    `- **Impact**: ${item.impact}`,
    `- **Estimated Effort**: ${item.effort}`,
  ];

  if (repoSnapshot) {
    lines.push(
      ``,
      `## Repository Context`,
      `- **Repository**: ${repoSnapshot.name || 'Unknown'}`,
      `- **Language / Stack**: ${repoSnapshot.language || 'Java'} (${repoSnapshot.buildTool || 'Maven'})`
    );
  }

  if (matchedModule) {
    lines.push(
      ``,
      `## Module Diagnostics (${matchedModule.name})`,
      `- **Risk Score**: ${matchedModule.riskScore}/100 | **Complexity**: ${matchedModule.complexity} | **Coupling**: ${matchedModule.coupling} | **Dependents**: ${matchedModule.dependents}`,
      `- **Assessment**: ${matchedModule.diagnosis}`
    );

    if (Array.isArray(matchedModule.ragEvidence) && matchedModule.ragEvidence.length > 0) {
      lines.push(`- **Evidence**:`);
      for (const ev of matchedModule.ragEvidence) {
        lines.push(`  - ${ev}`);
      }
    }
  }

  if (matchedFindings.length > 0) {
    lines.push(``, `## Related Security Findings`);
    for (const f of matchedFindings) {
      lines.push(`- **[${f.severity}] ${f.title}** (${f.cve || f.id}): ${f.reason} Suggested action: ${f.action}`);
    }
  }

  lines.push(
    ``,
    `## Requested Output`,
    `1. **Root Cause & Blast Radius**: Briefly confirm why this fix is critical.`,
    `2. **Exact Code / Config Patch**: Provide concrete, copy-pasteable code or build manifest (e.g., pom.xml / Java class) changes.`,
    `3. **Step-by-Step Execution Checklist**: Exact commands and rollout order to apply safely.`,
    `4. **Verification & Regression Tests**: How to confirm the fix resolved the issue without breaking dependent services.`
  );

  return lines.join('\n');
}

export async function fetchLlmProviderStatus() {
  for (const endpoint of ['/api/llm/providers', 'http://localhost:8000/api/v1/llm/providers']) {
    try {
      const res = await fetch(endpoint);
      if (res.ok) {
        const contentType = res.headers.get('content-type') || '';
        if (contentType.includes('application/json')) {
          const data = await res.json();
          return { ...data, serverProxyAvailable: true };
        }
      }
    } catch {
      // Try next endpoint
    }
  }

  return {
    defaultProvider: 'gemini',
    providers: {},
    serverProxyAvailable: false,
  };
}

/**
 * Direct browser execution fallback when the server proxy (/api/llm/execute) is unavailable
 * (e.g., static deploy or Vite dev server not yet restarted after config update).
 */
async function executeDirectlyInBrowser(payload) {
  const provider = (payload.provider || 'gemini').toLowerCase().trim();
  const providerMeta = LLM_PROVIDERS.find((p) => p.id === provider) || LLM_PROVIDERS[0];
  const model = (payload.model && payload.model.trim()) || providerMeta.defaultModel;
  const apiKey = (payload.apiKey || '').trim();
  const baseUrl = (payload.baseUrl || providerMeta.defaultBaseUrl || '').trim();
  const systemInstruction = payload.systemInstruction || DEFAULT_SYSTEM_INSTRUCTION;
  const temperature = typeof payload.temperature === 'number' ? payload.temperature : 0.2;

  const messages = Array.isArray(payload.messages) && payload.messages.length > 0
    ? payload.messages.map((m) => ({
      role: m.role === 'assistant' ? 'assistant' : 'user',
      content: String(m.content || '').trim(),
    }))
    : [{ role: 'user', content: String(payload.prompt || '').trim() }];

  if (provider !== 'ollama' && provider !== 'custom' && !apiKey) {
    throw new Error(
      `Please enter your ${providerMeta.name} API key above to execute directly, or restart "npm run dev" if you set ${providerMeta.envVar} in .env / backend/.env.`
    );
  }

  const startTime = Date.now();

  if (provider === 'gemini') {
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(
      model
    )}:generateContent?key=${encodeURIComponent(apiKey)}`;

    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        systemInstruction: { parts: [{ text: systemInstruction }] },
        contents: messages.map((m) => ({
          role: m.role === 'assistant' ? 'model' : 'user',
          parts: [{ text: m.content }],
        })),
        generationConfig: { temperature },
      }),
    });

    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      throw new Error(data?.error?.message || `Google Gemini API error (HTTP ${res.status})`);
    }
    const text =
      data?.candidates?.[0]?.content?.parts
        ?.map((p) => p.text || '')
        .join('')
        .trim() || '';
    if (!text) throw new Error('Google Gemini returned an empty response.');

    const usage = data?.usageMetadata || {};
    return {
      provider: 'gemini',
      model,
      text,
      durationMs: Date.now() - startTime,
      tokenUsage: {
        promptTokens: usage.promptTokenCount || 0,
        completionTokens: usage.candidatesTokenCount || 0,
        totalTokens: usage.totalTokenCount || 0,
      },
    };
  }

  if (provider === 'anthropic') {
    const res = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
        'anthropic-dangerous-direct-browser-access': 'true',
      },
      body: JSON.stringify({
        model,
        max_tokens: 4096,
        temperature,
        system: systemInstruction,
        messages,
      }),
    });

    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      throw new Error(data?.error?.message || `Anthropic API error (HTTP ${res.status})`);
    }
    const text =
      data?.content
        ?.filter((b) => b.type === 'text')
        .map((b) => b.text)
        .join('\n')
        .trim() || '';
    if (!text) throw new Error('Anthropic returned an empty response.');

    const usage = data?.usage || {};
    return {
      provider: 'anthropic',
      model,
      text,
      durationMs: Date.now() - startTime,
      tokenUsage: {
        promptTokens: usage.input_tokens || 0,
        completionTokens: usage.output_tokens || 0,
        totalTokens: (usage.input_tokens || 0) + (usage.output_tokens || 0),
      },
    };
  }

  if (provider === 'ollama') {
    const cleanBase = (baseUrl || 'http://localhost:11434').replace(/\/+$/, '');
    const res = await fetch(`${cleanBase}/api/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model,
        stream: false,
        messages: [{ role: 'system', content: systemInstruction }, ...messages],
        options: { temperature },
      }),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      throw new Error(data?.error || `Ollama error (HTTP ${res.status})`);
    }
    const text = data?.message?.content?.trim() || '';
    if (!text) throw new Error('Ollama returned an empty response.');
    return {
      provider: 'ollama',
      model,
      text,
      durationMs: Date.now() - startTime,
      tokenUsage: {
        promptTokens: data?.prompt_eval_count || 0,
        completionTokens: data?.eval_count || 0,
        totalTokens: (data?.prompt_eval_count || 0) + (data?.eval_count || 0),
      },
    };
  }

  // OpenAI, OpenRouter, Groq, or Custom OpenAI-compatible
  const endpointMap = {
    openai: 'https://api.openai.com/v1/chat/completions',
    openrouter: 'https://openrouter.ai/api/v1/chat/completions',
    groq: 'https://api.groq.com/openai/v1/chat/completions',
  };

  let endpoint = endpointMap[provider];
  if (provider === 'custom') {
    const cleanBase = baseUrl.replace(/\/+$/, '');
    if (!cleanBase) {
      throw new Error('Please enter a Base URL for your Custom OpenAI-Compatible endpoint.');
    }
    endpoint = cleanBase.endsWith('/chat/completions')
      ? cleanBase
      : `${cleanBase}/chat/completions`;
  }

  const headers = { 'Content-Type': 'application/json' };
  if (apiKey) headers.Authorization = `Bearer ${apiKey}`;

  const res = await fetch(endpoint, {
    method: 'POST',
    headers,
    body: JSON.stringify({
      model,
      temperature,
      messages: [{ role: 'system', content: systemInstruction }, ...messages],
    }),
  });

  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(
      data?.error?.message ||
      (typeof data?.error === 'string' ? data.error : null) ||
      `${providerMeta.name} API error (HTTP ${res.status})`
    );
  }
  const text = data?.choices?.[0]?.message?.content?.trim() || '';
  if (!text) throw new Error(`${providerMeta.name} returned an empty response.`);

  const usage = data?.usage || {};
  return {
    provider,
    model,
    text,
    durationMs: Date.now() - startTime,
    tokenUsage: {
      promptTokens: usage.prompt_tokens || 0,
      completionTokens: usage.completion_tokens || 0,
      totalTokens: usage.total_tokens || 0,
    },
  };
}

export async function executeLlmRequest(payload) {
  // 1. Try Vite server proxy (/api/llm/execute) first
  try {
    const res = await fetch('/api/llm/execute', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    const contentType = res.headers.get('content-type') || '';
    if (res.ok && contentType.includes('application/json')) {
      return await res.json();
    }

    // If proxy is active and returned a structured JSON error (not 404), surface it directly
    if (res.status !== 404 && contentType.includes('application/json')) {
      const errData = await res.json().catch(() => ({}));
      throw new Error(errData.error || errData.detail || `LLM request failed (HTTP ${res.status})`);
    }
  } catch (err) {
    // Re-throw genuine API/validation errors returned by the proxy itself
    if (err instanceof Error && !err.message.includes('Failed to fetch') && !err.message.includes('HTTP 404')) {
      throw err;
    }
  }

  // 2. If no client API key was given, try local FastAPI backend if running
  if (!payload.apiKey && payload.provider !== 'ollama' && payload.provider !== 'custom') {
    try {
      const backendRes = await fetch('http://localhost:8000/api/v1/llm/execute', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (backendRes.ok) {
        return await backendRes.json();
      }
      const errData = await backendRes.json().catch(() => ({}));
      if (errData.detail) {
        throw new Error(errData.detail);
      }
    } catch (err) {
      if (err instanceof Error && !err.message.includes('Failed to fetch') && !err.message.includes('NetworkError')) {
        throw err;
      }
    }
  }

  // 3. Direct browser API execution fallback (works even without Vite proxy or on static deploys)
  return await executeDirectlyInBrowser(payload);
}

export async function copyToClipboard(text) {
  try {
    if (navigator.clipboard && navigator.clipboard.writeText) {
      await navigator.clipboard.writeText(text);
      return true;
    }
  } catch {
    // Fallback below
  }
  try {
    const textarea = document.createElement('textarea');
    textarea.value = text;
    textarea.style.position = 'fixed';
    textarea.style.opacity = '0';
    document.body.appendChild(textarea);
    textarea.select();
    document.execCommand('copy');
    document.body.removeChild(textarea);
    return true;
  } catch {
    return false;
  }
}
