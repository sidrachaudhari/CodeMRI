import React, { useState } from 'react';
import { REFACTORING_ROADMAP, MODULE_DATA, REPO_SNAPSHOT, SECURITY_METRICS } from '../../data/mockData';
import { Clock, Sparkles, ArrowUpRight, CheckCircle2 } from 'lucide-react';
import { Card } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import LlmExecutionModal from './LlmExecutionModal';

export default function RefactoringRoadmap({
  isDarkMode = true,
  repoSnapshot = REPO_SNAPSHOT,
  modules = MODULE_DATA,
  findings = SECURITY_METRICS.findings,
}) {
  const [selectedItem, setSelectedItem] = useState(null);
  const [executedMetaByTitle, setExecutedMetaByTitle] = useState({});

  const handleOpenLlm = (item) => {
    setSelectedItem(item);
  };

  const handleExecuted = (item, meta) => {
    setExecutedMetaByTitle((prev) => ({
      ...prev,
      [item.title]: meta,
    }));
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Overview Banner */}
      <Card className="p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-950">
        <div>
          <h2 className="text-base font-bold text-neutral-900 dark:text-white">Recommended Action Plan</h2>
          <p className="text-xs mt-0.5 text-neutral-500">
            Ordered remediation steps to eliminate security risks and stabilize codebase
          </p>
        </div>
        <div className="inline-flex items-center gap-1.5 text-[11px] font-medium px-3 py-1.5 rounded-xl bg-[#51E2F5]/10 border border-[#51E2F5]/30 text-neutral-800 dark:text-[#9DF9EF] shrink-0">
          <Sparkles className="h-3.5 w-3.5 text-[#51E2F5]" />
          <span>Click &ldquo;Ready to Execute&rdquo; to send directly to Google Gemini or any LLM</span>
        </div>
      </Card>

      {/* Roadmap List */}
      <div className="space-y-3">
        {REFACTORING_ROADMAP.map((item, idx) => {
          const isReadyToExecute = item.status === 'Ready to Execute';
          const executedMeta = executedMetaByTitle[item.title];

          return (
            <Card
              key={idx}
              className="p-5 border transition-all flex flex-col md:flex-row md:items-center justify-between gap-4 border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-950 hover:border-[#51E2F5] dark:hover:border-[#51E2F5]"
            >
              <div className="flex items-start gap-4">
                <span
                  className={`text-xs font-bold px-2 py-0.5 rounded-md shrink-0 mt-0.5 ${
                    item.priority === 'P0'
                      ? 'bg-[#FFA8B6]/20 text-[#FFA8B6]'
                      : 'bg-neutral-200 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300'
                  }`}
                >
                  {item.priority}
                </span>
                <div>
                  <h4 className="text-sm font-bold mb-1.5 text-neutral-900 dark:text-white">
                    {item.title}
                  </h4>
                  <div className="flex flex-wrap items-center gap-3 text-xs text-neutral-500">
                    <span className="font-mono font-semibold text-neutral-800 dark:text-neutral-200">
                      {item.module}
                    </span>
                    <span>•</span>
                    <span>Category: {item.category}</span>
                    <span>•</span>
                    <span className="flex items-center gap-1 font-medium">
                      <Clock className="h-3.5 w-3.5" /> Est. effort: {item.effort}
                    </span>
                  </div>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-3 self-end md:self-center text-xs">
                <span
                  className={`text-xs font-bold ${
                    item.impact === 'CRITICAL' ? 'text-[#FFA8B6]' : 'text-neutral-400'
                  }`}
                >
                  Impact: {item.impact}
                </span>

                {isReadyToExecute ? (
                  <div className="flex items-center gap-2">
                    {executedMeta && (
                      <span
                        className="inline-flex items-center gap-1 text-[11px] font-mono text-emerald-500"
                        title={`Last executed with ${executedMeta.provider} (${executedMeta.model})`}
                      >
                        <CheckCircle2 className="h-3.5 w-3.5" />
                        {executedMeta.provider}
                      </span>
                    )}
                    <Button
                      type="button"
                      variant="default"
                      size="sm"
                      onClick={() => handleOpenLlm(item)}
                      className="h-8 px-3.5 rounded-lg gap-1.5 cursor-pointer shadow-sm shadow-[#51E2F5]/25 hover:scale-[1.02] active:scale-[0.99] transition-transform"
                    >
                      <Sparkles className="h-3.5 w-3.5" />
                      <span>{item.status}</span>
                      <ArrowUpRight className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                ) : (
                  <span className="text-xs text-neutral-500 font-medium">
                    {item.status}
                  </span>
                )}
              </div>
            </Card>
          );
        })}
      </div>

      {/* LLM Execution Modal */}
      <LlmExecutionModal
        isOpen={Boolean(selectedItem)}
        item={selectedItem}
        repoSnapshot={repoSnapshot}
        modules={modules}
        findings={findings}
        onClose={() => setSelectedItem(null)}
        onExecuted={handleExecuted}
      />
    </div>
  );
}
