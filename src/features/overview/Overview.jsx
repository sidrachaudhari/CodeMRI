import React from 'react';
import {
  FileCode2,
  Box,
  AlertTriangle,
  Clock,
  CheckCircle2,
  ChevronRight,
  Layers,
  Zap,
  ArrowUpRight
} from 'lucide-react';
import { HEALTH_SCORE, REPO_SNAPSHOT, PIPELINE_STAGES, MODULE_DATA } from '../../data/mockData';
import { Card } from '../../components/ui/card';
import { Badge } from '../../components/ui/badge';
import { Progress } from '../../components/ui/progress';
import { Button } from '../../components/ui/button';

export default function Overview({
  onSelectModule,
  onNavigate,
  scanStep,
  isScanning,
  repoSnapshot = REPO_SNAPSHOT,
  healthScore = HEALTH_SCORE,
  modules = MODULE_DATA,
  isDarkMode = true
}) {
  return (
    <div className="space-y-6 pb-12">
      {/* 9-STAGE AUDIT PIPELINE */}
      <Card className="border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-950 p-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 mb-3">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold uppercase tracking-wider text-neutral-900 dark:text-white">
              Repository Audit Pipeline
            </span>
            <span className="text-xs text-neutral-500 hidden sm:inline">• Standard 9-Step Verification</span>
          </div>
          <span className="text-[11px] sm:text-xs font-mono font-medium text-neutral-500">
            {isScanning ? `Running Step ${scanStep + 1} of 9...` : '✓ All 9 Diagnostic Stages Completed'}
          </span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-9 gap-2">
          {PIPELINE_STAGES.map((stage, idx) => {
            const isDone = idx <= scanStep;
            const isCurrent = idx === scanStep && isScanning;
            return (
              <div
                key={stage.id}
                className={`p-2.5 rounded-xl border text-left transition-all ${
                  isCurrent
                    ? 'bg-[#51E2F5] text-[#1B1618] border-[#51E2F5] font-bold shadow-sm shadow-[#51E2F5]/25'
                    : isDone
                    ? 'bg-neutral-100 dark:bg-neutral-900 border-neutral-200 dark:border-neutral-800 text-neutral-900 dark:text-neutral-100'
                    : 'bg-transparent border-neutral-200/60 dark:border-neutral-900 text-neutral-400 opacity-50'
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="text-[10px] font-mono font-bold">{stage.id}</span>
                  {isDone && !isCurrent ? (
                    <CheckCircle2 className="h-3 w-3 text-[#51E2F5]" />
                  ) : isCurrent ? (
                    <span className="h-2 w-2 rounded-full bg-[#1B1618] animate-ping" />
                  ) : null}
                </div>
                <div className="text-[11px] font-medium leading-tight truncate">{stage.name}</div>
              </div>
            );
          })}
        </div>
      </Card>

      {/* HEALTH SCORE & CONTRIBUTING FACTORS */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Large Circular Health Score Card */}
        <Card className="flex flex-col justify-between p-6 border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-950">
          <div>
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs uppercase tracking-wider font-semibold text-neutral-500">
                Overall Repository Health
              </span>
              <Badge variant="default">
                {healthScore.status}
              </Badge>
            </div>

            <h2 className="text-sm font-bold mb-4 text-neutral-900 dark:text-white">
              SOFTWARE HEALTH SCORE
            </h2>

            {/* Circular score display with Dumma Cyan & Ice */}
            <div className="flex items-center justify-center my-3">
              <div className="relative w-40 h-40 rounded-full flex items-center justify-center border-4 border-neutral-100 dark:border-neutral-900 bg-white dark:bg-black">
                <svg className="w-full h-full -rotate-90 transform" viewBox="0 0 100 100">
                  <circle
                    cx="50"
                    cy="50"
                    r="42"
                    className="text-neutral-100 dark:text-neutral-900"
                    strokeWidth="6"
                    stroke="currentColor"
                    fill="transparent"
                  />
                  <circle
                    cx="50"
                    cy="50"
                    r="42"
                    className="text-[#51E2F5] transition-all duration-1000 ease-out"
                    strokeWidth="6"
                    strokeDasharray={264}
                    strokeDashoffset={264 - (264 * healthScore.overall) / 100}
                    strokeLinecap="round"
                    stroke="currentColor"
                    fill="transparent"
                  />
                </svg>
                <div className="absolute flex flex-col items-center">
                  <span className="text-4xl font-extrabold tracking-tight font-mono text-neutral-900 dark:text-white">
                    {healthScore.overall}
                  </span>
                  <span className="text-xs text-neutral-500">out of 100</span>
                </div>
              </div>
            </div>

            <p className="text-xs text-center mt-2 text-neutral-500">
              {healthScore.comparison}
            </p>
          </div>

          {/* Breakdown bars */}
          <div className="space-y-3 mt-6 pt-4 border-t border-neutral-200 dark:border-neutral-800">
            <span className="text-[11px] uppercase tracking-wider font-semibold block text-neutral-500">
              Score Breakdown Factors
            </span>
            {healthScore.breakdown.map((item) => (
              <div key={item.category} className="space-y-1 text-xs">
                <div className="flex justify-between text-neutral-900 dark:text-neutral-200">
                  <span>{item.category}</span>
                  <span className="font-bold font-mono">{item.score}</span>
                </div>
                <Progress value={item.score} className="h-1.5" />
              </div>
            ))}
          </div>
        </Card>

        {/* SNAPSHOT METRICS & PRIORITY ACTIONS */}
        <div className="lg:col-span-2 space-y-6">
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {[
              { label: 'Files Analyzed', value: repoSnapshot.filesAnalyzed, icon: FileCode2, note: 'Scanned AST tokens' },
              { label: 'Lines of Code', value: repoSnapshot.loc, icon: Layers, note: 'Active Java codebase' },
              { label: 'Modules Mapped', value: repoSnapshot.modulesCount, icon: Box, note: 'Service components' },
              { label: 'Dependencies', value: repoSnapshot.dependenciesCount, icon: Zap, note: 'Resolved packages' },
              { label: 'Issues Detected', value: repoSnapshot.issuesDetected, icon: AlertTriangle, note: 'Smells & warnings' },
              { label: 'Technical Debt', value: `${repoSnapshot.techDebtHours}h`, icon: Clock, note: 'Remediation backlog' }
            ].map((card) => {
              const Icon = card.icon;
              return (
                <Card key={card.label} className="p-4 border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-950 flex flex-col justify-between">
                  <div className="flex items-center justify-between mb-1 text-neutral-500">
                    <span className="text-xs font-semibold">{card.label}</span>
                    <Icon className="h-4 w-4 text-[#51E2F5]" />
                  </div>
                  <div className="text-2xl font-bold tracking-tight font-mono text-neutral-900 dark:text-white">
                    {card.value}
                  </div>
                  <span className="text-[11px] mt-1 text-neutral-500">{card.note}</span>
                </Card>
              );
            })}
          </div>

          {/* WHAT SHOULD THE DEVELOPER FIX FIRST? */}
          <Card className="p-5 border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-950">
            <div className="flex items-center justify-between mb-3">
              <div>
                <span className="text-[11px] uppercase tracking-wider font-semibold text-neutral-500">
                  Immediate Action
                </span>
                <h3 className="text-sm font-bold text-neutral-900 dark:text-white">
                  What Should You Fix First?
                </h3>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onNavigate('roadmap')}
                className="text-xs text-[#51E2F5] hover:text-neutral-900 dark:hover:text-white gap-1"
              >
                View Roadmap <ChevronRight className="h-3 w-3" />
              </Button>
            </div>

            <div className="space-y-2.5">
              {[
                { priority: 'P0 — Critical', title: 'Patch Log4j JNDI Vulnerability (CVE-2021-44228)', module: 'PaymentService.java', effort: '2h effort', why: 'Eliminates unauthenticated Remote Code Execution risk.' },
                { priority: 'P1 — High', title: 'Decouple PaymentService from OrderController', module: 'OrderController.java', effort: '12h effort', why: 'Breaks single point of failure so checkout survives payment delays.' },
                { priority: 'P1 — High', title: 'Parameterize native SQL queries in UserRepository', module: 'UserRepository.java', effort: '4h effort', why: 'Eliminates SQL injection vector (CWE-89) in search methods.' }
              ].map((item, idx) => (
                <div
                  key={idx}
                  className="p-3 rounded-xl border border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-900/60 flex flex-col sm:flex-row sm:items-center justify-between gap-2"
                >
                  <div>
                    <div className="flex items-center gap-2">
                      <Badge variant={idx === 0 ? 'coral' : 'secondary'}>
                        {item.priority}
                      </Badge>
                      <span className="text-xs font-bold text-neutral-900 dark:text-white">
                        {item.title}
                      </span>
                    </div>
                    <p className="text-xs mt-1 text-neutral-500">{item.why}</p>
                  </div>

                  <div className="flex items-center gap-2 shrink-0 self-end sm:self-center text-xs">
                    <span className="font-mono text-[11px] text-neutral-500">{item.module}</span>
                    <Badge variant="pebble" className="font-mono text-[10px]">
                      {item.effort}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </div>
      </div>

      {/* HOTSPOT INSPECTION CARDS */}
      <Card className="p-5 border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-950">
        <div className="flex items-center justify-between mb-4">
          <div>
            <span className="text-[11px] uppercase tracking-wider font-semibold text-neutral-500">
              Hotspot Breakdown
            </span>
            <h3 className="text-sm font-bold text-neutral-900 dark:text-white">
              Where Are The Biggest Risks & Why Are They Risky?
            </h3>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onNavigate('quality')}
            className="text-xs text-[#51E2F5] gap-1"
          >
            All Modules <ChevronRight className="h-3 w-3" />
          </Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {modules.slice(0, 3).map((mod) => (
            <div
              key={mod.name}
              className="p-4 rounded-xl border border-neutral-200 dark:border-neutral-800 bg-neutral-50/50 dark:bg-black flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-bold font-mono truncate text-neutral-900 dark:text-white">
                    {mod.name}
                  </span>
                  <Badge variant={mod.riskScore > 80 ? 'coral' : 'secondary'} className="font-mono">
                    Risk: {mod.riskScore}/100
                  </Badge>
                </div>

                <div className="text-[11px] mb-3 space-y-1 text-neutral-500">
                  <div>Category: <strong className="text-neutral-900 dark:text-neutral-200">{mod.category}</strong></div>
                  <div>Cyclomatic Complexity: <strong className="font-mono text-neutral-900 dark:text-white">{mod.complexity}</strong> (Target &lt;10)</div>
                  <div>Coupling Ratio: <strong className="font-mono text-neutral-900 dark:text-white">{mod.coupling}</strong> • {mod.dependents} callers</div>
                </div>

                <div className="p-2.5 rounded-xl border border-neutral-200 dark:border-neutral-800 text-xs leading-relaxed bg-white dark:bg-neutral-900 text-neutral-800 dark:text-neutral-200">
                  <span className="font-bold block mb-0.5 text-neutral-900 dark:text-white">Why it's risky:</span>
                  {mod.diagnosis}
                </div>
              </div>

              <div className="pt-3 mt-3 border-t border-neutral-200 dark:border-neutral-800 flex items-center justify-between">
                <span className="text-[11px] text-neutral-500">Remediation: {mod.techDebt}</span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    onSelectModule(mod);
                    onNavigate('ai-diagnosis');
                  }}
                  className="text-xs gap-1 border-[#51E2F5] text-[#51E2F5] hover:bg-[#51E2F5] hover:text-[#1B1618]"
                >
                  Diagnose <ArrowUpRight className="h-3 w-3" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}
