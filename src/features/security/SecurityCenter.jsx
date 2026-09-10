import React from 'react';
import { SECURITY_METRICS } from '../../data/mockData';
import { CheckCircle2, ShieldAlert } from 'lucide-react';
import { Card } from '../../components/ui/card';
import { Badge } from '../../components/ui/badge';

export default function SecurityCenter({
  findings = SECURITY_METRICS.findings,
  score = SECURITY_METRICS.score,
  isDarkMode = true
}) {
  const critical = findings.filter(f => f.severity === 'CRITICAL').length;
  const high = findings.filter(f => f.severity === 'HIGH').length;
  const medium = findings.filter(f => f.severity === 'MEDIUM').length;
  const low = findings.filter(f => f.severity === 'LOW').length;

  return (
    <div className="space-y-6 pb-12 font-sans">
      {/* Top Banner */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <Card className="p-5 flex flex-col justify-between border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-950">
          <div>
            <span className="text-xs block mb-1 text-neutral-500">Security Score</span>
            <div className="text-3xl font-extrabold text-neutral-900 dark:text-white">
              {score} <span className="text-xs font-normal text-neutral-500">/ 100</span>
            </div>
          </div>
          <span className="text-[10px] mt-2 flex items-center gap-1 font-semibold text-[#51E2F5]">
            <CheckCircle2 className="h-3 w-3" /> Baseline Met
          </span>
        </Card>

        {[
          { label: 'Critical Severity', count: critical, highlight: true },
          { label: 'High Severity', count: high, highlight: true },
          { label: 'Medium Severity', count: medium, highlight: false },
          { label: 'Low Severity', count: low, highlight: false }
        ].map((item) => (
          <Card
            key={item.label}
            className={`p-5 flex flex-col justify-between border transition-all ${
              item.highlight && item.count > 0
                ? 'bg-[#FFA8B6]/20 text-neutral-900 dark:text-white border-[#FFA8B6]'
                : 'border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-950'
            }`}
          >
            <span className={`text-xs ${item.highlight && item.count > 0 ? 'text-[#FFA8B6] font-bold' : 'text-neutral-500'}`}>
              {item.label}
            </span>
            <div className={`text-3xl font-bold mt-2 ${item.highlight && item.count > 0 ? 'text-[#FFA8B6]' : 'text-neutral-900 dark:text-white'}`}>
              {item.count}
            </div>
          </Card>
        ))}
      </div>

      {/* Security Findings List */}
      <Card className="p-5 border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-950">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-sm font-bold text-neutral-900 dark:text-white">Vulnerability Audit</h3>
            <p className="text-xs text-neutral-500">OWASP Top-10 patterns and vulnerable dependencies</p>
          </div>
          <Badge variant="mauve">
            STATIC AUDIT
          </Badge>
        </div>

        <div className="space-y-3">
          {findings.map((finding) => (
            <div
              key={finding.id}
              className="p-4 rounded-xl border transition-colors bg-neutral-50 dark:bg-black border-neutral-200 dark:border-neutral-800"
            >
              <div className="flex items-start justify-between gap-4">
                <div className="space-y-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <Badge
                      variant={
                        finding.severity === 'CRITICAL'
                          ? 'coral'
                          : finding.severity === 'HIGH'
                          ? 'mauve'
                          : 'secondary'
                      }
                    >
                      {finding.severity}
                    </Badge>
                    <span className="text-xs font-bold text-neutral-900 dark:text-white">{finding.id}</span>
                    <span className="text-xs text-neutral-500">[{finding.cve}]</span>
                    <h4 className="text-xs font-bold text-neutral-900 dark:text-white ml-1">{finding.title}</h4>
                  </div>
                  <p className="text-xs pl-0.5 mt-1">
                    <span className="text-[11px] text-neutral-500">Affected: </span>
                    <span className="font-bold text-neutral-900 dark:text-neutral-100">{finding.module}</span>
                  </p>
                </div>
              </div>

              <div className="mt-3 grid grid-cols-1 md:grid-cols-2 gap-3 text-xs p-3 rounded-xl border bg-white dark:bg-neutral-900 border-neutral-200 dark:border-neutral-800">
                <div>
                  <span className="text-[10px] uppercase tracking-wider block mb-0.5 text-neutral-500">
                    Root Cause
                  </span>
                  <p className="font-sans leading-relaxed text-neutral-800 dark:text-neutral-200">{finding.reason}</p>
                </div>
                <div>
                  <span className="text-[10px] uppercase tracking-wider block mb-0.5 font-bold text-[#51E2F5]">
                    Remediation Action
                  </span>
                  <p className="text-[11px] font-bold text-neutral-900 dark:text-white">{finding.action}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}
