/**
 * Client utilities for connecting CodeMRI's Recommended Action Plan
 * to any LLM API (Google Gemini default, OpenAI, Anthropic, OpenRouter, Groq,
 * Ollama, or any Custom OpenAI-compatible endpoint) as well as external LLM web apps.
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
    id: 'gemini-web',
    name: 'Gemini',
    buildUrl: () => 'https://gemini.google.com/app',
    autoFillsPrompt: false,
  },
  {
    id: 'chatgpt-web',
    name: 'ChatGPT',
    buildUrl: (prompt) => `https://chatgpt.com/?q=${encodeURIComponent(prompt)}`,
    autoFillsPrompt: true,
  },
  {
    id: 'claude-web',
    name: 'Claude',
    buildUrl: (prompt) => `https://claude.ai/new?q=${encodeURIComponent(prompt)}`,
    autoFillsPrompt: true,
  },
  {
    id: 'perplexity-web',
    name: 'Perplexity',
    buildUrl: (prompt) => `https://www.perplexity.ai/search?q=${encodeURIComponent(prompt)}`,
    autoFillsPrompt: true,
  },
];

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
  try {
    const res = await fetch('/api/llm/providers');
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return await res.json();
  } catch {
    return {
      defaultProvider: 'gemini',
      providers: {},
    };
  }
}

export async function executeLlmRequest(payload) {
  const res = await fetch('/api/llm/execute', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });

  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(data.error || data.detail || `LLM request failed (HTTP ${res.status})`);
  }
  return data;
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
