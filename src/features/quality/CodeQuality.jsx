import React from 'react';
import { MODULE_DATA, TECH_DEBT_DISTRIBUTION } from '../../data/mockData';
import { Clock, ArrowRight } from 'lucide-react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';
import { Card } from '../../components/ui/card';
import { Badge } from '../../components/ui/badge';
import { Button } from '../../components/ui/button';

export default function CodeQuality({ onSelectModule, onNavigate, isDarkMode = true }) {
  return (
    <div className="space-y-6 pb-12">
      {/* Metrics Row */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {[
          { label: 'Avg Cyclomatic Complexity', value: '7.8', status: 'Optimal < 10' },
          { label: 'Avg Coupling Ratio', value: '0.42', status: 'Moderate' },
          { label: 'Maintainability Index', value: '76 / 100', status: 'Grade B+' },
          { label: 'Estimated Tech Debt', value: '142 hours', status: 'Remediation backlog' }
        ].map((m) => (
          <Card key={m.label} className="p-4 border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-950">
            <span className="text-xs block mb-1 text-neutral-500">{m.label}</span>
            <div className="text-2xl font-bold font-mono mb-1 text-neutral-900 dark:text-white">{m.value}</div>
            <span className="text-[10px] text-neutral-500">{m.status}</span>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Module Quality Findings Table */}
        <Card className="lg:col-span-2 p-5 border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-950">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-bold text-neutral-900 dark:text-white">Static Code Quality Hotspots</h3>
              <p className="text-xs text-neutral-500">AST metrics mapped to maintainability risks</p>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-neutral-200 dark:border-neutral-800 text-neutral-500">
                  <th className="pb-2 font-semibold">Module / File</th>
                  <th className="pb-2 font-semibold">Complexity</th>
                  <th className="pb-2 font-semibold">Coupling</th>
                  <th className="pb-2 font-semibold">Tech Debt</th>
                  <th className="pb-2 font-semibold">Risk</th>
                  <th className="pb-2 font-semibold text-right">Details</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-200/60 dark:divide-neutral-800/60">
                {MODULE_DATA.map((mod) => (
                  <tr key={mod.name} className="transition-colors hover:bg-neutral-100/60 dark:hover:bg-neutral-900">
                    <td className="py-3">
                      <span className="font-bold font-mono text-neutral-900 dark:text-white">{mod.name}</span>
                      <span className="block text-[10px] text-neutral-500">{mod.category}</span>
                    </td>
                    <td className="py-3 font-mono">
                      <span className={mod.complexity > 10 ? 'font-bold text-[#51E2F5]' : 'text-neutral-900 dark:text-white'}>
                        {mod.complexity}
                      </span>
                    </td>
                    <td className="py-3 font-mono">
                      <span className={mod.coupling > 0.6 ? 'font-bold text-neutral-500' : 'text-neutral-900 dark:text-white'}>
                        {mod.coupling}
                      </span>
                    </td>
                    <td className="py-3 font-mono text-neutral-500">{mod.techDebt}</td>
                    <td className="py-3">
                      <Badge variant={mod.riskScore > 80 ? 'coral' : mod.riskScore > 50 ? 'secondary' : 'pebble'} className="font-mono">
                        {mod.riskScore}
                      </Badge>
                    </td>
                    <td className="py-3 text-right">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => {
                          onSelectModule(mod);
                          onNavigate('ai-diagnosis');
                        }}
                        className="text-[#51E2F5] hover:bg-[#51E2F5]/10"
                      >
                        <ArrowRight className="h-4 w-4" />
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>

        {/* Technical Debt Allocation Chart */}
        <Card className="p-5 border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-950 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-bold text-neutral-900 dark:text-white">Tech Debt Allocation</h3>
              <Clock className="h-4 w-4 text-[#51E2F5]" />
            </div>
            <p className="text-xs mb-4 text-neutral-500">
              Total remediation: <strong className="text-neutral-900 dark:text-white">142 hours</strong>
            </p>

            <div className="h-48 w-full flex items-center justify-center">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={TECH_DEBT_DISTRIBUTION}
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={75}
                    paddingAngle={3}
                    dataKey="hours"
                  >
                    {TECH_DEBT_DISTRIBUTION.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.fill} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      backgroundColor: isDarkMode ? '#000000' : '#ffffff',
                      borderColor: isDarkMode ? '#262626' : '#e5e5e5',
                      fontSize: '11px',
                      borderRadius: '8px',
                      color: isDarkMode ? '#ffffff' : '#000000'
                    }}
                    itemStyle={{ color: isDarkMode ? '#ffffff' : '#000000' }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="space-y-2 mt-4 pt-4 border-t border-neutral-200 dark:border-neutral-800">
            {TECH_DEBT_DISTRIBUTION.map((item) => (
              <div key={item.name} className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-2">
                  <span
                    className="w-2.5 h-2.5 rounded-full"
                    style={{ backgroundColor: item.fill }}
                  />
                  <span className="text-neutral-500">{item.name}</span>
                </div>
                <span className="font-bold font-mono text-neutral-900 dark:text-white">{item.hours}h</span>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </div>
  );
}
