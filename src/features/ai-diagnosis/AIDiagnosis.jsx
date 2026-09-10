import React, { useState } from 'react';
import { MODULE_DATA } from '../../data/mockData';
import { CheckCircle2, FileText, ArrowRight, ShieldAlert, Sparkles } from 'lucide-react';
import { Card } from '../../components/ui/card';
import { Badge } from '../../components/ui/badge';
import { Button } from '../../components/ui/button';

export default function AIDiagnosis({
  selectedModule,
  onSelectModule,
  onNavigate,
  modules = MODULE_DATA,
  isDarkMode = true
}) {
  const current = selectedModule || modules[0] || MODULE_DATA[0];
  const [isGenerating, setIsGenerating] = useState(false);
  const [planGenerated, setPlanGenerated] = useState(false);

  const handleGeneratePlan = () => {
    setIsGenerating(true);
    setTimeout(() => {
      setIsGenerating(false);
      setPlanGenerated(true);
    }, 600);
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Humanized Header */}
      <Card className="p-4 border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-950 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <FileText className="h-4 w-4 text-[#51E2F5]" />
            <h2 className="text-sm font-bold text-neutral-900 dark:text-white">Diagnostic Code Review</h2>
          </div>
          <p className="text-xs mt-0.5 text-neutral-500">
            Deterministic code audit connecting AST metrics, architecture dependencies, and security findings
          </p>
        </div>
        <Badge variant="mauve" className="self-start sm:self-auto shrink-0">
          Evidence-Backed Audit
        </Badge>
      </Card>

      {/* Module Selector tabs */}
      <div className="flex items-center gap-2 border-b pb-2 overflow-x-auto border-neutral-200 dark:border-neutral-800">
        {modules.map((mod) => (
          <button
            key={mod.name}
            onClick={() => {
              onSelectModule(mod);
              setPlanGenerated(false);
            }}
            className={`px-3 py-1.5 rounded-xl text-xs font-mono transition-all shrink-0 border ${
              current.name === mod.name
                ? 'bg-[#51E2F5] text-[#1B1618] border-[#51E2F5] font-bold shadow-sm shadow-[#51E2F5]/25'
                : 'border-transparent text-neutral-500 hover:text-neutral-900 dark:hover:text-white hover:bg-neutral-100 dark:hover:bg-neutral-900'
            }`}
          >
            {mod.name}
          </button>
        ))}
      </div>

      {/* Diagnosis Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Humanized Review Output */}
        <div className="lg:col-span-2 space-y-6">
          <Card className="p-6 space-y-4 border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-950">
            <div className="flex items-center justify-between">
              <div>
                <span className="text-xs uppercase tracking-wider font-semibold block text-neutral-500">File Under Review</span>
                <h3 className="text-base font-bold font-mono text-neutral-900 dark:text-white">{current.name}</h3>
                <span className="text-xs text-neutral-500">{current.category}</span>
              </div>
              <Badge variant={current.riskScore > 80 ? 'coral' : 'secondary'}>
                Risk Score: {current.riskScore} / 100
              </Badge>
            </div>

            {/* Plain English Finding */}
            <div className="p-4 rounded-xl border text-sm leading-relaxed bg-neutral-50 dark:bg-black border-neutral-200 dark:border-neutral-800">
              <span className="font-bold block mb-1 text-neutral-900 dark:text-white">Review Assessment:</span>
              <p className="text-neutral-800 dark:text-neutral-200">{current.diagnosis}</p>
            </div>

            {/* Why This Matters (Human impact on system) */}
            <div>
              <h4 className="text-xs font-bold uppercase tracking-wider mb-2 text-neutral-900 dark:text-white">
                Why This Matters in Production
              </h4>
              <div className="p-3.5 border rounded-xl text-xs leading-relaxed bg-neutral-100/70 dark:bg-neutral-900 border-neutral-200 dark:border-neutral-800 text-neutral-800 dark:text-neutral-200">
                This file has a cyclomatic complexity of <strong className="text-neutral-900 dark:text-white">{current.complexity}</strong> and is directly called by <strong className="text-neutral-900 dark:text-white">{current.dependents} other services</strong> without an abstraction boundary. Any regression or failure here has a high blast radius and will directly impact downstream checkout and user flows.
              </div>
            </div>

            {/* Recommended Steps */}
            <div>
              <h4 className="text-xs font-bold uppercase tracking-wider mb-2 text-neutral-900 dark:text-white">
                Recommended Action Plan
              </h4>
              <div className="space-y-2">
                {current.actions.map((act, i) => (
                  <div key={i} className="flex items-start gap-3 p-3 rounded-xl border text-xs bg-white dark:bg-neutral-900/50 border-neutral-200 dark:border-neutral-800">
                    <span className="h-5 w-5 rounded-full border border-[#51E2F5] text-[#51E2F5] flex items-center justify-center font-bold text-xs shrink-0 mt-0.5">
                      {i + 1}
                    </span>
                    <span className="leading-relaxed text-neutral-800 dark:text-neutral-200">{act}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Generate Fix Button */}
            <div className="pt-2">
              <Button
                variant="default"
                onClick={handleGeneratePlan}
                disabled={isGenerating}
              >
                <Sparkles className="h-4 w-4 mr-2" />
                {isGenerating ? 'Preparing Step-by-Step Refactor...' : 'Generate Step-by-Step Refactor'}
              </Button>

              {planGenerated && (
                <div className="mt-4 p-4 rounded-xl border text-xs space-y-2 bg-[#51E2F5]/10 border-[#51E2F5]/40 text-neutral-900 dark:text-neutral-100">
                  <div className="font-bold flex items-center gap-1.5 text-neutral-900 dark:text-white">
                    <CheckCircle2 className="h-4 w-4 text-[#51E2F5]" /> Proposed Refactoring Steps:
                  </div>
                  <ol className="list-decimal pl-4 space-y-1.5 leading-relaxed">
                    <li>Create domain package `validator` and extract transaction validation logic.</li>
                    <li>Replace synchronous direct calls with an event-driven pub/sub queue to decouple OrderController.</li>
                    <li>Update pom.xml dependencies to fully patched releases (Log4j &gt;= 2.17.1).</li>
                    <li>Add targeted regression tests with mock payment gateways.</li>
                  </ol>
                  <button
                    onClick={() => onNavigate('roadmap')}
                    className="text-xs font-bold text-[#51E2F5] underline mt-2 block hover:opacity-80"
                  >
                    View in Recommended Action Plan &rarr;
                  </button>
                </div>
              )}
            </div>
          </Card>
        </div>

        {/* Explainability / Evidence Panel */}
        <Card className="p-5 space-y-4 border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-950">
          <div>
            <span className="text-xs uppercase tracking-wider font-semibold block text-neutral-500">Audit Evidence</span>
            <h3 className="text-sm font-bold text-neutral-900 dark:text-white">Signals Audited</h3>
          </div>
          <p className="text-xs leading-relaxed text-neutral-500">
            Every finding is directly verified against deterministic AST static metrics and dependency manifests.
          </p>

          <div className="space-y-2.5 pt-2">
            {current.ragEvidence.map((ev, i) => (
              <div key={i} className="p-2.5 rounded-xl border text-xs flex items-start gap-2 bg-neutral-50 dark:bg-neutral-900 border-neutral-200 dark:border-neutral-800">
                <CheckCircle2 className="h-3.5 w-3.5 shrink-0 mt-0.5 text-[#51E2F5]" />
                <span className="text-[12px] leading-relaxed text-neutral-800 dark:text-neutral-200">{ev}</span>
              </div>
            ))}
          </div>

          <div className="pt-4 border-t border-neutral-200 dark:border-neutral-800 space-y-2 text-xs">
            <div className="font-semibold text-neutral-900 dark:text-white">Scope Checked:</div>
            <div className="p-2.5 rounded-xl border text-xs space-y-1 bg-white dark:bg-neutral-900 border-neutral-200 dark:border-neutral-800 text-neutral-500">
              <div>• File Size: <strong className="text-neutral-900 dark:text-neutral-100">{current.loc} lines</strong></div>
              <div>• Dependent Inbound Services: <strong className="text-neutral-900 dark:text-neutral-100">{current.dependents}</strong></div>
              <div>• Associated CVEs / Smells: <strong className="text-neutral-900 dark:text-neutral-100">{current.securityIssues}</strong></div>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}
