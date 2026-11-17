import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  X,
  Sparkles,
  Send,
  ExternalLink,
  Copy,
  Check,
  Loader2,
  AlertCircle,
  Eye,
  EyeOff,
  ChevronDown,
  ChevronUp,
  RotateCcw,
  KeyRound,
  Cpu,
  CheckCircle2,
  Terminal,
} from 'lucide-react';
import { Card } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import {
  LLM_PROVIDERS,
  EXTERNAL_LLM_TARGETS,
  loadLlmPreferences,
  saveLlmPreferences,
  findContextForRecommendation,
  buildRecommendationPrompt,
  fetchLlmProviderStatus,
  executeLlmRequest,
  copyToClipboard,
} from '../../lib/llmClient';

/**
 * Lightweight, safe Markdown renderer supporting fenced code blocks with copy buttons,
 * headings, lists, bold text, and inline code without external dependencies.
 */
function MarkdownResponse({ text }) {
  const [copiedIdx, setCopiedIdx] = useState(null);

  const segments = useMemo(() => {
    const parts = [];
    const regex = /```([a-zA-Z0-9_-]*)\n([\s\S]*?)```/g;
    let lastIndex = 0;
    let match;

    while ((match = regex.exec(text || '')) !== null) {
      if (match.index > lastIndex) {
        parts.push({ type: 'text', content: text.slice(lastIndex, match.index) });
      }
      parts.push({
        type: 'code',
        lang: match[1] || 'code',
        content: match[2].replace(/\n$/, ''),
      });
      lastIndex = regex.lastIndex;
    }

    if (lastIndex < (text || '').length) {
      parts.push({ type: 'text', content: (text || '').slice(lastIndex) });
    }
    return parts;
  }, [text]);

  const renderInline = (line) => {
    const tokens = line.split(/(`[^`]+`|\*\*[^*]+\*\*)/g);
    return tokens.map((tok, i) => {
      if (tok.startsWith('`') && tok.endsWith('`') && tok.length > 2) {
        return (
          <code
            key={i}
            className="px-1.5 py-0.5 rounded bg-neutral-200/80 dark:bg-neutral-800 font-mono text-[11px] text-neutral-900 dark:text-[#9DF9EF]"
          >
            {tok.slice(1, -1)}
          </code>
        );
      }
      if (tok.startsWith('**') && tok.endsWith('**') && tok.length > 4) {
        return (
          <strong key={i} className="font-bold text-neutral-900 dark:text-white">
            {tok.slice(2, -2)}
          </strong>
        );
      }
      return <React.Fragment key={i}>{tok}</React.Fragment>;
    });
  };

  const handleCopyCode = async (code, idx) => {
    await copyToClipboard(code);
    setCopiedIdx(idx);
    setTimeout(() => setCopiedIdx(null), 1800);
  };

  return (
    <div className="space-y-3 text-xs leading-relaxed text-neutral-800 dark:text-neutral-200">
      {segments.map((seg, idx) => {
        if (seg.type === 'code') {
          return (
            <div
              key={idx}
              className="rounded-xl overflow-hidden border border-neutral-200 dark:border-neutral-800 bg-neutral-950 text-neutral-100"
            >
              <div className="flex items-center justify-between px-3 py-1.5 bg-neutral-900 border-b border-neutral-800 text-[11px] font-mono text-neutral-400">
                <span className="flex items-center gap-1.5">
                  <Terminal className="h-3 w-3 text-[#51E2F5]" />
                  {seg.lang}
                </span>
                <button
                  type="button"
                  onClick={() => handleCopyCode(seg.content, idx)}
                  className="inline-flex items-center gap-1 text-[11px] text-neutral-300 hover:text-[#51E2F5] transition-colors"
                >
                  {copiedIdx === idx ? (
                    <>
                      <Check className="h-3 w-3 text-emerald-400" /> Copied
                    </>
                  ) : (
                    <>
                      <Copy className="h-3 w-3" /> Copy
                    </>
                  )}
                </button>
              </div>
              <pre className="p-3 overflow-x-auto text-[11px] font-mono leading-relaxed">
                <code>{seg.content}</code>
              </pre>
            </div>
          );
        }

        const lines = seg.content.split('\n');
        return (
          <div key={idx} className="space-y-1.5">
            {lines.map((rawLine, lineIdx) => {
              const line = rawLine.trimEnd();
              if (!line.trim()) return <div key={lineIdx} className="h-1" />;

              if (line.startsWith('### ')) {
                return (
                  <h4 key={lineIdx} className="text-xs font-bold text-neutral-900 dark:text-[#51E2F5] pt-2">
                    {renderInline(line.slice(4))}
                  </h4>
                );
              }
              if (line.startsWith('## ')) {
                return (
                  <h3 key={lineIdx} className="text-sm font-bold text-neutral-900 dark:text-white pt-2">
                    {renderInline(line.slice(3))}
                  </h3>
                );
              }
              if (line.startsWith('# ')) {
                return (
                  <h2 key={lineIdx} className="text-base font-bold text-neutral-900 dark:text-white pt-2">
                    {renderInline(line.slice(2))}
                  </h2>
                );
              }
              if (/^\s*[-*]\s+/.test(line)) {
                return (
                  <div key={lineIdx} className="flex items-start gap-2 pl-2">
                    <span className="text-[#51E2F5] font-bold mt-0.5">•</span>
                    <span>{renderInline(line.replace(/^\s*[-*]\s+/, ''))}</span>
                  </div>
                );
              }
              if (/^\s*\d+\.\s+/.test(line)) {
                const matchNum = line.match(/^\s*(\d+\.)\s+(.*)$/);
                return (
                  <div key={lineIdx} className="flex items-start gap-2 pl-2">
                    <span className="font-mono font-bold text-[#51E2F5] shrink-0">{matchNum[1]}</span>
                    <span>{renderInline(matchNum[2])}</span>
                  </div>
                );
              }

              return <p key={lineIdx}>{renderInline(line)}</p>;
            })}
          </div>
        );
      })}
    </div>
  );
}

export default function LlmExecutionModal({
  isOpen,
  item,
  repoSnapshot,
  modules = [],
  findings = [],
  onClose,
  onExecuted,
}) {
  const savedPrefs = useMemo(() => loadLlmPreferences(), []);

  const [provider, setProvider] = useState(savedPrefs.provider || 'gemini');
  const [modelsByProvider, setModelsByProvider] = useState(savedPrefs.modelsByProvider || {});
  const [apiKeysByProvider, setApiKeysByProvider] = useState(savedPrefs.apiKeysByProvider || {});
  const [baseUrlsByProvider, setBaseUrlsByProvider] = useState(savedPrefs.baseUrlsByProvider || {});
  const [rememberKey, setRememberKey] = useState(
    savedPrefs.rememberKey !== undefined ? savedPrefs.rememberKey : true
  );
  const [showApiKey, setShowApiKey] = useState(false);

  const [serverStatus, setServerStatus] = useState({ defaultProvider: 'gemini', providers: {} });
  const [statusLoaded, setStatusLoaded] = useState(false);

  const [promptText, setPromptText] = useState('');
  const [isPromptExpanded, setIsPromptExpanded] = useState(false);
  const [isConfigExpanded, setIsConfigExpanded] = useState(true);

  const [conversation, setConversation] = useState([]);
  const [followUpInput, setFollowUpInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [lastMeta, setLastMeta] = useState(null);
  const [toastMsg, setToastMsg] = useState('');

  const autoTriggeredRef = useRef(false);
  const scrollBottomRef = useRef(null);
  const apiKeyInputRef = useRef(null);

  const providerConfig = useMemo(
    () => LLM_PROVIDERS.find((p) => p.id === provider) || LLM_PROVIDERS[0],
    [provider]
  );

  const serverProviderInfo = serverStatus.providers?.[provider] || {};
  const hasServerKey = Boolean(serverProviderInfo.configured);

  const activeModel =
    modelsByProvider[provider] || serverProviderInfo.defaultModel || providerConfig.defaultModel;
  const activeApiKey = apiKeysByProvider[provider] || '';
  const activeBaseUrl =
    baseUrlsByProvider[provider] ||
    serverProviderInfo.baseUrl ||
    providerConfig.defaultBaseUrl ||
    '';

  const isProviderReady =
    provider === 'ollama' ||
    (provider === 'custom' && Boolean(activeBaseUrl.trim())) ||
    hasServerKey ||
    Boolean(activeApiKey.trim());

  // Build contextual prompt whenever a new item is opened
  useEffect(() => {
    if (!isOpen || !item) return;

    const { matchedModule, matchedFindings } = findContextForRecommendation(
      item,
      modules,
      findings
    );
    const built = buildRecommendationPrompt({
      item,
      repoSnapshot,
      matchedModule,
      matchedFindings,
    });

    setPromptText(built);
    setConversation([]);
    setFollowUpInput('');
    setErrorMsg('');
    setLastMeta(null);
    setToastMsg('');
    autoTriggeredRef.current = false;

    let cancelled = false;
    setStatusLoaded(false);
    fetchLlmProviderStatus().then((status) => {
      if (!cancelled) {
        setServerStatus(status);
        setStatusLoaded(true);
      }
    });

    return () => {
      cancelled = true;
    };
  }, [isOpen, item, repoSnapshot, modules, findings]);

  // Persist provider/model preferences (and optionally API key)
  useEffect(() => {
    saveLlmPreferences({
      provider,
      modelsByProvider,
      baseUrlsByProvider,
      rememberKey,
      apiKeysByProvider: rememberKey ? apiKeysByProvider : {},
    });
  }, [provider, modelsByProvider, baseUrlsByProvider, rememberKey, apiKeysByProvider]);

  // Auto-execute immediately when opened if the selected provider is already configured
  useEffect(() => {
    if (!isOpen || !item || !statusLoaded || !promptText || autoTriggeredRef.current) return;
    if (isProviderReady) {
      autoTriggeredRef.current = true;
      setIsConfigExpanded(false);
      runExecution([{ role: 'user', content: promptText }]);
    } else {
      setIsConfigExpanded(true);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, item, statusLoaded, promptText]);

  useEffect(() => {
    if (scrollBottomRef.current) {
      scrollBottomRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [conversation, isLoading]);

  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen || !item) return null;

  const showToast = (msg) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(''), 3000);
  };

  async function runExecution(messagesToSend) {
    setIsLoading(true);
    setErrorMsg('');

    try {
      const result = await executeLlmRequest({
        provider,
        model: activeModel,
        apiKey: activeApiKey || undefined,
        baseUrl: activeBaseUrl || undefined,
        messages: messagesToSend,
        temperature: 0.2,
      });

      const assistantTurn = {
        role: 'assistant',
        content: result.text,
        meta: {
          provider: result.provider,
          model: result.model,
          durationMs: result.durationMs,
          tokenUsage: result.tokenUsage,
        },
      };

      setConversation([...messagesToSend, assistantTurn]);
      setLastMeta(assistantTurn.meta);
      if (onExecuted) {
        onExecuted(item, assistantTurn.meta);
      }
    } catch (err) {
      setErrorMsg(err.message || 'Failed to get response from the LLM.');
      setIsConfigExpanded(true);
    } finally {
      setIsLoading(false);
    }
  }

  const handleRunInitial = () => {
    if (!promptText.trim()) return;
    if (providerConfig.requiresApiKey && !hasServerKey && !activeApiKey.trim()) {
      setIsConfigExpanded(true);
      setErrorMsg(
        `Please paste your ${providerConfig.name} API key above (or click "Get key →" for a free key), or use one of the external LLM buttons (Gemini / ChatGPT / Claude) at the top.`
      );
      setTimeout(() => apiKeyInputRef.current?.focus(), 50);
      return;
    }
    setIsConfigExpanded(false);
    runExecution([{ role: 'user', content: promptText.trim() }]);
  };

  const handleSendFollowUp = (e) => {
    e.preventDefault();
    const trimmed = followUpInput.trim();
    if (!trimmed || isLoading) return;

    const baseMessages =
      conversation.length > 0
        ? conversation.map((m) => ({ role: m.role, content: m.content }))
        : [{ role: 'user', content: promptText.trim() }];

    const nextMessages = [...baseMessages, { role: 'user', content: trimmed }];
    setFollowUpInput('');
    setConversation(nextMessages);
    runExecution(nextMessages);
  };

  const handleOpenExternalLlm = async (target) => {
    const activePrompt = promptText.trim();
    await copyToClipboard(activePrompt);
    const url = target.buildUrl(activePrompt);
    window.open(url, '_blank', 'noopener,noreferrer');

    if (target.autoFillsPrompt) {
      showToast(`Opened ${target.name} with prompt pre-filled (also copied to clipboard).`);
    } else {
      showToast(`Prompt copied to clipboard — press Ctrl+V in ${target.name}.`);
    }
  };

  const handleCopyPrompt = async () => {
    await copyToClipboard(promptText);
    showToast('Diagnostic prompt copied to clipboard.');
  };

  const handleCopyLatestResponse = async () => {
    const latest = [...conversation].reverse().find((m) => m.role === 'assistant');
    if (!latest) return;
    await copyToClipboard(latest.content);
    showToast('LLM response copied to clipboard.');
  };

  const assistantTurns = conversation.filter((m) => m.role === 'assistant');

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-2 sm:p-4">
      <Card className="w-full max-w-4xl overflow-hidden shadow-2xl flex flex-col max-h-[92vh] border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-950 rounded-2xl">
        {/* Header */}
        <div className="p-4 sm:p-5 border-b flex items-start justify-between gap-3 border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-black shrink-0">
          <div className="flex items-start gap-3 min-w-0">
            <div className="h-9 w-9 rounded-xl bg-gradient-to-br from-[#51E2F5] to-[#9DF9EF] text-[#1B1618] flex items-center justify-center shrink-0 shadow-sm">
              <Sparkles className="h-4 w-4" />
            </div>
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-[#FFA8B6]/20 text-[#FFA8B6]">
                  {item.priority}
                </span>
                <span className="text-[11px] font-mono text-neutral-500 truncate">
                  {item.module}
                </span>
              </div>
              <h2 className="text-sm sm:text-base font-bold text-neutral-900 dark:text-white truncate mt-0.5">
                {item.title}
              </h2>
              <p className="text-[11px] text-neutral-500">
                Execute this recommendation with Google Gemini, any LLM API, or launch an external LLM chat
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            aria-label="Close LLM execution modal"
            className="p-1.5 rounded-lg hover:bg-neutral-200/60 dark:hover:bg-neutral-900 text-neutral-500 hover:text-neutral-900 dark:hover:text-white transition-colors shrink-0"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Toast Banner */}
        {toastMsg && (
          <div className="px-4 py-2 bg-[#51E2F5]/15 border-b border-[#51E2F5]/30 text-xs text-neutral-900 dark:text-[#9DF9EF] flex items-center gap-2 shrink-0">
            <CheckCircle2 className="h-3.5 w-3.5 text-[#51E2F5] shrink-0" />
            <span>{toastMsg}</span>
          </div>
        )}

        {/* Scrollable Body */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-4">
          {/* External LLM Quick Redirect Bar */}
          <div className="p-3 rounded-xl border border-neutral-200 dark:border-neutral-800 bg-neutral-50/70 dark:bg-neutral-900/50 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
            <div className="text-xs">
              <span className="font-bold text-neutral-900 dark:text-white">
                Open directly in external LLM:
              </span>
              <span className="text-neutral-500 ml-1.5">
                Auto-copies diagnostic prompt & opens chat
              </span>
            </div>
            <div className="flex flex-wrap items-center gap-1.5">
              {EXTERNAL_LLM_TARGETS.map((target) => (
                <button
                  key={target.id}
                  type="button"
                  onClick={() => handleOpenExternalLlm(target)}
                  className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-[11px] font-semibold border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-950 text-neutral-800 dark:text-neutral-200 hover:border-[#51E2F5] hover:text-[#51E2F5] transition-colors cursor-pointer"
                >
                  {target.name}
                  <ExternalLink className="h-3 w-3" />
                </button>
              ))}
              <button
                type="button"
                onClick={handleCopyPrompt}
                className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-[11px] font-semibold border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-950 text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white transition-colors cursor-pointer"
              >
                <Copy className="h-3 w-3" />
                Copy Prompt
              </button>
            </div>
          </div>

          {/* LLM Provider Configuration Accordion */}
          <div className="rounded-xl border border-neutral-200 dark:border-neutral-800 overflow-hidden">
            <button
              type="button"
              onClick={() => setIsConfigExpanded((prev) => !prev)}
              className="w-full px-4 py-3 flex items-center justify-between bg-neutral-50 dark:bg-neutral-900/60 hover:bg-neutral-100/70 dark:hover:bg-neutral-900 transition-colors text-left"
            >
              <div className="flex flex-wrap items-center gap-2 text-xs">
                <Cpu className="h-4 w-4 text-[#51E2F5]" />
                <span className="font-bold text-neutral-900 dark:text-white">
                  In-App LLM Connection:
                </span>
                <span className="font-mono text-[#51E2F5] font-semibold">
                  {providerConfig.name} ({activeModel})
                </span>
                {hasServerKey && provider !== 'ollama' && (
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-500/15 text-emerald-500 border border-emerald-500/30">
                    .env Key Detected
                  </span>
                )}
                {provider === 'ollama' && (
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-[#51E2F5]/15 text-[#51E2F5] border border-[#51E2F5]/30">
                    Local • No Key Needed
                  </span>
                )}
              </div>
              {isConfigExpanded ? (
                <ChevronUp className="h-4 w-4 text-neutral-500 shrink-0" />
              ) : (
                <ChevronDown className="h-4 w-4 text-neutral-500 shrink-0" />
              )}
            </button>

            {isConfigExpanded && (
              <div className="p-4 space-y-4 bg-white dark:bg-neutral-950 border-t border-neutral-200 dark:border-neutral-800">
                {/* Provider Pills */}
                <div>
                  <label className="block text-[11px] font-semibold uppercase tracking-wider text-neutral-500 mb-2">
                    Select LLM Provider
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {LLM_PROVIDERS.map((p) => {
                      const active = provider === p.id;
                      const envReady = serverStatus.providers?.[p.id]?.configured;
                      return (
                        <button
                          key={p.id}
                          type="button"
                          onClick={() => {
                            setProvider(p.id);
                            setErrorMsg('');
                          }}
                          className={`px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all flex items-center gap-1.5 cursor-pointer ${
                            active
                              ? 'bg-[#51E2F5] text-[#1B1618] border-[#51E2F5] font-bold shadow-sm'
                              : 'border-neutral-200 dark:border-neutral-800 text-neutral-600 dark:text-neutral-300 hover:border-[#51E2F5]/60'
                          }`}
                        >
                          <span>{p.name}</span>
                          {envReady && p.id !== 'ollama' && (
                            <span
                              className={`h-1.5 w-1.5 rounded-full ${
                                active ? 'bg-[#1B1618]' : 'bg-emerald-400'
                              }`}
                              title="Configured via .env"
                            />
                          )}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Model + API Key / Base URL Inputs */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {/* Model Input */}
                  <div>
                    <label className="block text-[11px] font-semibold text-neutral-600 dark:text-neutral-400 mb-1">
                      Model Name
                    </label>
                    <input
                      type="text"
                      value={activeModel}
                      onChange={(e) =>
                        setModelsByProvider((prev) => ({ ...prev, [provider]: e.target.value }))
                      }
                      placeholder={providerConfig.defaultModel}
                      className="w-full px-3 py-2 rounded-lg text-xs font-mono border border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-900 text-neutral-900 dark:text-white focus:outline-none focus:border-[#51E2F5]"
                    />
                    {providerConfig.suggestedModels?.length > 0 && (
                      <div className="flex flex-wrap gap-1 mt-1.5">
                        {providerConfig.suggestedModels.map((m) => (
                          <button
                            key={m}
                            type="button"
                            onClick={() =>
                              setModelsByProvider((prev) => ({ ...prev, [provider]: m }))
                            }
                            className={`px-2 py-0.5 rounded text-[10px] font-mono border transition-colors ${
                              activeModel === m
                                ? 'border-[#51E2F5] text-[#51E2F5] bg-[#51E2F5]/10'
                                : 'border-neutral-200 dark:border-neutral-800 text-neutral-500 hover:text-neutral-800 dark:hover:text-neutral-200'
                            }`}
                          >
                            {m}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* API Key or Base URL */}
                  {providerConfig.requiresBaseUrl ? (
                    <div>
                      <label className="block text-[11px] font-semibold text-neutral-600 dark:text-neutral-400 mb-1">
                        Endpoint Base URL
                      </label>
                      <input
                        type="text"
                        value={activeBaseUrl}
                        onChange={(e) =>
                          setBaseUrlsByProvider((prev) => ({
                            ...prev,
                            [provider]: e.target.value,
                          }))
                        }
                        placeholder={providerConfig.baseUrlPlaceholder}
                        className="w-full px-3 py-2 rounded-lg text-xs font-mono border border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-900 text-neutral-900 dark:text-white focus:outline-none focus:border-[#51E2F5]"
                      />
                    </div>
                  ) : null}

                  {provider !== 'ollama' && (
                    <div className={providerConfig.requiresBaseUrl ? 'md:col-span-2' : ''}>
                      <div className="flex items-center justify-between mb-1">
                        <label className="text-[11px] font-semibold text-neutral-600 dark:text-neutral-400 flex items-center gap-1">
                          <KeyRound className="h-3 w-3 text-[#51E2F5]" />
                          API Key{' '}
                          {hasServerKey && (
                            <span className="text-emerald-500 font-normal">
                              (optional — using {providerConfig.envVar} from .env)
                            </span>
                          )}
                        </label>
                        {providerConfig.helpUrl && (
                          <a
                            href={providerConfig.helpUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-[11px] text-[#51E2F5] hover:underline"
                          >
                            Get key &rarr;
                          </a>
                        )}
                      </div>
                      <div className="relative">
                        <input
                          ref={apiKeyInputRef}
                          type={showApiKey ? 'text' : 'password'}
                          value={activeApiKey}
                          onChange={(e) =>
                            setApiKeysByProvider((prev) => ({
                              ...prev,
                              [provider]: e.target.value,
                            }))
                          }
                          placeholder={
                            hasServerKey
                              ? `Using server ${providerConfig.envVar} (paste here to override)`
                              : providerConfig.keyPlaceholder || 'Enter API key...'
                          }
                          className="w-full pl-3 pr-9 py-2 rounded-lg text-xs font-mono border border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-900 text-neutral-900 dark:text-white focus:outline-none focus:border-[#51E2F5]"
                        />
                        <button
                          type="button"
                          onClick={() => setShowApiKey((prev) => !prev)}
                          className="absolute right-2.5 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-200"
                          aria-label={showApiKey ? 'Hide API key' : 'Show API key'}
                        >
                          {showApiKey ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
                        </button>
                      </div>
                      <label className="mt-1.5 inline-flex items-center gap-1.5 text-[11px] text-neutral-500 cursor-pointer select-none">
                        <input
                          type="checkbox"
                          checked={rememberKey}
                          onChange={(e) => setRememberKey(e.target.checked)}
                          className="rounded border-neutral-300 dark:border-neutral-700 accent-[#51E2F5]"
                        />
                        Remember API key in this browser (localStorage)
                      </label>
                    </div>
                  )}
                </div>

                {/* Action Row */}
                <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
                  <button
                    type="button"
                    onClick={() => setIsPromptExpanded((prev) => !prev)}
                    className="text-xs font-medium text-neutral-500 hover:text-neutral-900 dark:hover:text-white flex items-center gap-1"
                  >
                    {isPromptExpanded ? (
                      <>
                        <ChevronUp className="h-3.5 w-3.5" /> Hide Prompt Context
                      </>
                    ) : (
                      <>
                        <ChevronDown className="h-3.5 w-3.5" /> Inspect / Edit Prompt Context
                      </>
                    )}
                  </button>

                  <Button
                    type="button"
                    onClick={handleRunInitial}
                    disabled={isLoading || !promptText.trim()}
                    className="gap-1.5 cursor-pointer"
                  >
                    {isLoading ? (
                      <>
                        <Loader2 className="h-3.5 w-3.5 animate-spin" />
                        Executing on {providerConfig.name}...
                      </>
                    ) : (
                      <>
                        <Sparkles className="h-3.5 w-3.5" />
                        {assistantTurns.length > 0
                          ? `Re-run with ${providerConfig.name}`
                          : `Execute with ${providerConfig.name}`}
                      </>
                    )}
                  </Button>
                </div>

                {/* Editable Prompt Context */}
                {isPromptExpanded && (
                  <div className="pt-2">
                    <label className="block text-[11px] font-semibold text-neutral-500 mb-1">
                      Prompt Sent to LLM (editable)
                    </label>
                    <textarea
                      rows={8}
                      value={promptText}
                      onChange={(e) => setPromptText(e.target.value)}
                      className="w-full p-3 rounded-xl text-xs font-mono border border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-900 text-neutral-900 dark:text-neutral-100 focus:outline-none focus:border-[#51E2F5]"
                    />
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Error Alert */}
          {errorMsg && (
            <div className="p-3.5 rounded-xl border border-[#FFA8B6]/40 bg-[#FFA8B6]/10 text-xs text-neutral-900 dark:text-[#FFA8B6] flex items-start gap-2.5">
              <AlertCircle className="h-4 w-4 text-[#FFA8B6] shrink-0 mt-0.5" />
              <div className="space-y-1">
                <div className="font-bold">Could not execute via {providerConfig.name}</div>
                <p className="leading-relaxed opacity-90">{errorMsg}</p>
              </div>
            </div>
          )}

          {/* Loading State */}
          {isLoading && assistantTurns.length === 0 && (
            <div className="p-8 rounded-xl border border-neutral-200 dark:border-neutral-800 bg-neutral-50/70 dark:bg-neutral-900/40 flex flex-col items-center justify-center gap-3 text-center">
              <Loader2 className="h-6 w-6 text-[#51E2F5] animate-spin" />
              <div>
                <div className="text-xs font-bold text-neutral-900 dark:text-white">
                  Sending "{item.title}" to {providerConfig.name}...
                </div>
                <p className="text-[11px] text-neutral-500 mt-0.5 font-mono">
                  Model: {activeModel} • Generating remediation patch & checklist
                </p>
              </div>
            </div>
          )}

          {/* Conversation / LLM Output */}
          {conversation.length > 0 && (
            <div className="space-y-4">
              {conversation.map((turn, idx) => {
                // Skip showing the huge initial system-built prompt bubble unless user wants it
                if (idx === 0 && turn.role === 'user') return null;

                if (turn.role === 'user') {
                  return (
                    <div key={idx} className="flex justify-end">
                      <div className="max-w-[85%] px-3.5 py-2.5 rounded-xl bg-[#51E2F5]/15 border border-[#51E2F5]/30 text-xs text-neutral-900 dark:text-white">
                        {turn.content}
                      </div>
                    </div>
                  );
                }

                return (
                  <div
                    key={idx}
                    className="p-4 sm:p-5 rounded-xl border border-neutral-200 dark:border-neutral-800 bg-neutral-50/50 dark:bg-neutral-900/40 space-y-3"
                  >
                    <div className="flex flex-wrap items-center justify-between gap-2 pb-2.5 border-b border-neutral-200 dark:border-neutral-800">
                      <div className="flex items-center gap-2 text-[11px] font-mono">
                        <Sparkles className="h-3.5 w-3.5 text-[#51E2F5]" />
                        <span className="font-bold text-neutral-900 dark:text-white uppercase">
                          {turn.meta?.provider || provider}
                        </span>
                        <span className="text-neutral-400">•</span>
                        <span className="text-[#51E2F5]">{turn.meta?.model || activeModel}</span>
                        {turn.meta?.durationMs ? (
                          <>
                            <span className="text-neutral-400">•</span>
                            <span className="text-neutral-500">
                              {(turn.meta.durationMs / 1000).toFixed(1)}s
                            </span>
                          </>
                        ) : null}
                        {turn.meta?.tokenUsage?.totalTokens ? (
                          <>
                            <span className="text-neutral-400">•</span>
                            <span className="text-neutral-500">
                              {turn.meta.tokenUsage.totalTokens} tokens
                            </span>
                          </>
                        ) : null}
                      </div>

                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={handleCopyLatestResponse}
                          className="inline-flex items-center gap-1 text-[11px] font-semibold text-neutral-500 hover:text-[#51E2F5] transition-colors cursor-pointer"
                        >
                          <Copy className="h-3 w-3" /> Copy
                        </button>
                        <button
                          type="button"
                          onClick={handleRunInitial}
                          disabled={isLoading}
                          className="inline-flex items-center gap-1 text-[11px] font-semibold text-neutral-500 hover:text-[#51E2F5] transition-colors cursor-pointer"
                        >
                          <RotateCcw className="h-3 w-3" /> Re-run
                        </button>
                      </div>
                    </div>

                    <MarkdownResponse text={turn.content} />
                  </div>
                );
              })}

              {isLoading && assistantTurns.length > 0 && (
                <div className="flex items-center gap-2 text-xs text-neutral-500 font-mono px-2">
                  <Loader2 className="h-3.5 w-3.5 animate-spin text-[#51E2F5]" />
                  Waiting for {providerConfig.name}...
                </div>
              )}

              <div ref={scrollBottomRef} />
            </div>
          )}
        </div>

        {/* Footer: Follow-up Chat Input */}
        <form
          onSubmit={handleSendFollowUp}
          className="p-3 sm:p-4 border-t border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-black flex items-center gap-2 shrink-0"
        >
          <input
            type="text"
            value={followUpInput}
            onChange={(e) => setFollowUpInput(e.target.value)}
            disabled={isLoading}
            placeholder={
              assistantTurns.length > 0
                ? 'Ask a follow-up (e.g., "Generate JUnit tests for this patch" or "Show exact pom.xml diff")...'
                : `Or type a custom instruction to run on ${providerConfig.name}...`
            }
            className="flex-1 px-3.5 py-2 rounded-xl text-xs border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-950 text-neutral-900 dark:text-white focus:outline-none focus:border-[#51E2F5]"
          />
          <Button
            type="submit"
            disabled={isLoading || (!followUpInput.trim() && assistantTurns.length > 0)}
            size="sm"
            className="h-9 px-4 gap-1.5 cursor-pointer"
            onClick={(e) => {
              if (!followUpInput.trim() && assistantTurns.length === 0) {
                e.preventDefault();
                handleRunInitial();
              }
            }}
          >
            {isLoading ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : (
              <Send className="h-3.5 w-3.5" />
            )}
            <span>{assistantTurns.length > 0 ? 'Send' : 'Run'}</span>
          </Button>
        </form>
      </Card>
    </div>
  );
}
