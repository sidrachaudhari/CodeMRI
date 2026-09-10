import React, { useState } from 'react';
import { DEPENDENCY_LIST } from '../../data/mockData';
import { Card } from '../../components/ui/card';
import { Badge } from '../../components/ui/badge';
import { Button } from '../../components/ui/button';
import { Box, Clock, ShieldAlert, Activity, CheckCircle2, AlertTriangle } from 'lucide-react';

export default function Dependencies({ dependencies = DEPENDENCY_LIST, isDarkMode = true }) {
  const [filter, setFilter] = useState('ALL');

  const filtered = dependencies.filter((dep) => {
    if (filter === 'VULNERABLE') return dep.status === 'CRITICAL' || dep.status === 'MEDIUM';
    if (filter === 'OUTDATED') return dep.status === 'OUTDATED';
    if (filter === 'HEALTHY') return dep.status === 'HEALTHY';
    return true;
  });

  const totalCount = dependencies.length;
  const outdatedCount = dependencies.filter(d => d.status === 'OUTDATED').length;
  const vulnerableCount = dependencies.filter(d => d.status === 'CRITICAL' || d.status === 'MEDIUM').length;

  return (
    <div className="space-y-6 pb-12 font-sans">
      {/* Dependency Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {[
          {
            label: 'Total Dependencies',
            value: totalCount,
            sub: 'Maven POM root dependencies',
            icon: Box,
            iconColor: 'text-[#51E2F5]'
          },
          {
            label: 'Outdated Libraries',
            value: outdatedCount,
            sub: 'Newer patched releases available',
            icon: Clock,
            iconColor: 'text-[#A28089]'
          },
          {
            label: 'Vulnerable Components',
            value: vulnerableCount,
            sub: 'CVE security advisories matched',
            icon: ShieldAlert,
            iconColor: 'text-[#FFA8B6]'
          },
          {
            label: 'Supply Chain Status',
            value: vulnerableCount > 0 ? 'ATTENTION' : 'OPTIMAL',
            sub: vulnerableCount > 0 ? 'Remediation action needed' : 'Clean dependency baseline',
            icon: vulnerableCount > 0 ? AlertTriangle : CheckCircle2,
            iconColor: vulnerableCount > 0 ? 'text-[#FFA8B6]' : 'text-[#51E2F5]',
            isStatus: true
          },
        ].map((item) => {
          const Icon = item.icon;
          return (
            <Card
              key={item.label}
              className="p-5 border-neutral-200 dark:border-neutral-800/80 bg-white dark:bg-neutral-900/70 rounded-2xl shadow-xs transition-all hover:border-neutral-300 dark:hover:border-neutral-700"
            >
              <div className="flex items-center justify-between mb-2">
                <span className="text-[11px] font-semibold text-neutral-500 dark:text-neutral-400 uppercase tracking-wider">
                  {item.label}
                </span>
                <Icon className={`h-4 w-4 ${item.iconColor}`} />
              </div>
              
              {item.isStatus ? (
                <div className="my-1.5 flex items-center gap-2">
                  <span
                    className={`inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-bold font-display tracking-tight border ${
                      vulnerableCount > 0
                        ? 'bg-[#FFA8B6]/15 text-[#FFA8B6] border-[#FFA8B6]/40'
                        : 'bg-[#51E2F5]/15 text-[#51E2F5] border-[#51E2F5]/40'
                    }`}
                  >
                    <span className="w-1.5 h-1.5 rounded-full bg-current mr-1.5 animate-pulse" />
                    {item.value}
                  </span>
                </div>
              ) : (
                <div className="text-3xl font-bold font-display tracking-tight text-neutral-900 dark:text-white my-1">
                  {item.value}
                </div>
              )}
              
              <span className="text-[11px] text-neutral-400 dark:text-neutral-500 block">
                {item.sub}
              </span>
            </Card>
          );
        })}
      </div>

      {/* Dependency Table Card */}
      <Card className="p-6 border-neutral-200 dark:border-neutral-800/80 bg-white dark:bg-neutral-900/70 rounded-2xl shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <div>
            <h3 className="text-base font-bold font-display text-neutral-900 dark:text-white">
              Dependency Intelligence
            </h3>
            <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-0.5">
              Transitive dependency tree analysis, version health, and vulnerability tracking
            </p>
          </div>

          {/* Segmented Filter Pills */}
          <div className="flex items-center overflow-x-auto max-w-full bg-neutral-100 dark:bg-neutral-950 p-1 rounded-xl border border-neutral-200 dark:border-neutral-800 text-xs shrink-0">
            {['ALL', 'VULNERABLE', 'OUTDATED', 'HEALTHY'].map((f) => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={`px-3 py-1.5 rounded-lg font-medium transition-all whitespace-nowrap ${
                  filter === f
                    ? 'bg-white dark:bg-neutral-800 text-neutral-900 dark:text-white shadow-xs font-bold'
                    : 'text-neutral-500 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white'
                }`}
              >
                {f}
              </button>
            ))}
          </div>
        </div>

        <div className="overflow-x-auto -mx-2 sm:mx-0">
          <table className="w-full text-left text-xs min-w-[620px]">
            <thead>
              <tr className="border-b border-neutral-200 dark:border-neutral-800 text-neutral-400 dark:text-neutral-500 text-[11px] uppercase tracking-wider font-semibold">
                <th className="pb-3 pr-4">Package Identifier</th>
                <th className="pb-3 px-4">Resolved Version</th>
                <th className="pb-3 px-4">Status</th>
                <th className="pb-3 px-4">CVE Reference</th>
                <th className="pb-3 pl-4">Import Scope</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-100 dark:divide-neutral-800/60">
              {filtered.map((dep) => (
                <tr
                  key={dep.name}
                  className="transition-colors hover:bg-neutral-50/80 dark:hover:bg-neutral-800/40"
                >
                  <td className="py-3.5 pr-4">
                    <span className="font-mono font-semibold text-xs text-neutral-900 dark:text-neutral-100">
                      {dep.name}
                    </span>
                  </td>
                  <td className="py-3.5 px-4 font-mono text-neutral-500 dark:text-neutral-400 text-xs">
                    {dep.version}
                  </td>
                  <td className="py-3.5 px-4">
                    <span
                      className={`inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-bold font-mono border ${
                        dep.status === 'CRITICAL'
                          ? 'bg-[#FFA8B6]/15 text-[#FFA8B6] border-[#FFA8B6]/40'
                          : dep.status === 'MEDIUM'
                          ? 'bg-[#A28089]/15 text-[#A28089] border-[#A28089]/40'
                          : dep.status === 'HEALTHY'
                          ? 'bg-[#9DF9EF]/15 text-emerald-600 dark:text-[#9DF9EF] border-[#9DF9EF]/40'
                          : 'bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-400 border-neutral-300 dark:border-neutral-700'
                      }`}
                    >
                      {dep.status}
                    </span>
                  </td>
                  <td className="py-3.5 px-4 font-mono font-semibold text-xs">
                    {dep.cve === 'None' ? (
                      <span className="text-neutral-400 dark:text-neutral-600 font-normal">None</span>
                    ) : (
                      <span className="text-[#51E2F5] hover:underline cursor-pointer">
                        {dep.cve}
                      </span>
                    )}
                  </td>
                  <td className="py-3.5 pl-4 text-xs text-neutral-500 dark:text-neutral-400">
                    {dep.usage}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
