import React, { useState } from 'react';
import { MODULE_DATA } from '../../data/mockData';
import { ArrowRight } from 'lucide-react';
import { Card } from '../../components/ui/card';
import { Badge } from '../../components/ui/badge';
import { Button } from '../../components/ui/button';

export default function RiskHeatmap({ onSelectModule, onNavigate, isDarkMode = true }) {
  const [selectedHotspot, setSelectedHotspot] = useState(MODULE_DATA[0]);

  const gridCells = [
    ...MODULE_DATA,
    { name: 'InventoryService.java', category: 'Backend', riskScore: 42, complexity: 6, coupling: 0.3, dependents: 3, techDebt: '5h', actions: ['Standard audit'] },
    { name: 'CartManager.java', category: 'Backend', riskScore: 68, complexity: 11, coupling: 0.55, dependents: 4, techDebt: '11h', actions: ['Refactor state caching'] },
    { name: 'NotificationWorker.java', category: 'Worker', riskScore: 22, complexity: 4, coupling: 0.12, dependents: 2, techDebt: '2h', actions: ['None'] },
    { name: 'SecurityFilter.java', category: 'Security', riskScore: 71, complexity: 12, coupling: 0.62, dependents: 8, techDebt: '14h', actions: ['Modernize filter chain'] },
    { name: 'InvoiceGenerator.java', category: 'Billing', riskScore: 35, complexity: 7, coupling: 0.28, dependents: 2, techDebt: '4h', actions: ['None'] },
    { name: 'EmailGateway.java', category: 'Worker', riskScore: 19, complexity: 3, coupling: 0.1, dependents: 1, techDebt: '1h', actions: ['None'] },
    { name: 'DatabaseConfig.java', category: 'Config', riskScore: 15, complexity: 2, coupling: 0.05, dependents: 12, techDebt: '1h', actions: ['None'] }
  ];

  return (
    <div className="space-y-6 pb-12 font-sans">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Heatmap Matrix */}
        <Card className="lg:col-span-2 p-5 border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-950">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-bold text-neutral-900 dark:text-white">Repository Risk Matrix</h3>
              <p className="text-xs text-neutral-500">Intensity mapped to composite complexity, coupling & security</p>
            </div>
            <div className="flex items-center gap-3 text-[10px] text-neutral-500">
              <span className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-sm bg-neutral-100 border border-neutral-300 dark:bg-neutral-900 dark:border-neutral-700"></span> Low
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-sm bg-[#9DF9EF]/50 border border-[#51E2F5]/50"></span> Med
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-sm bg-[#FFA8B6] border border-[#FFA8B6]"></span> Critical
              </span>
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
            {gridCells.map((cell) => {
              const isSelected = selectedHotspot?.name === cell.name;
              const isCritical = cell.riskScore > 75;
              const isMedium = cell.riskScore >= 40 && cell.riskScore <= 75;

              return (
                <button
                  key={cell.name}
                  onClick={() => setSelectedHotspot(cell)}
                  className={`p-3 rounded-xl text-left transition-all border ${
                    isSelected
                      ? 'ring-2 ring-[#51E2F5] border-[#51E2F5] bg-[#51E2F5]/15 text-neutral-900 dark:text-white font-bold'
                      : isCritical
                      ? 'bg-[#FFA8B6] border-[#FFA8B6] text-[#1B1618] font-semibold'
                      : isMedium
                      ? 'bg-[#9DF9EF]/20 border-[#9DF9EF]/40 text-neutral-900 dark:text-neutral-200'
                      : 'bg-neutral-50 border-neutral-200 text-neutral-500 dark:bg-black dark:border-neutral-900'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-xs font-bold font-mono">
                      {cell.riskScore}
                    </span>
                    <span className="text-[10px] opacity-70">score</span>
                  </div>
                  <div className="text-xs font-bold truncate">{cell.name}</div>
                  <div className="text-[10px] opacity-70 truncate mt-0.5">{cell.category}</div>
                </button>
              );
            })}
          </div>
        </Card>

        {/* Selected Hotspot Detail Panel */}
        <Card className="p-5 flex flex-col justify-between border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-950">
          {selectedHotspot ? (
            <div className="space-y-4">
              <div>
                <span className="text-[10px] uppercase tracking-wider block text-neutral-500">Hotspot Inspector</span>
                <h3 className="text-base font-bold mt-1 text-neutral-900 dark:text-white">{selectedHotspot.name}</h3>
                <span className="text-xs block text-neutral-500">{selectedHotspot.category}</span>
              </div>

              <div className="p-3 border rounded-xl space-y-2 text-xs bg-neutral-50 dark:bg-black border-neutral-200 dark:border-neutral-800">
                <div className="flex justify-between">
                  <span className="text-neutral-500">Composite Risk Score:</span>
                  <span className="font-bold text-neutral-900 dark:text-white">{selectedHotspot.riskScore} / 100</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-neutral-500">Cyclomatic Complexity:</span>
                  <span className="font-medium text-neutral-900 dark:text-neutral-200">{selectedHotspot.complexity}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-neutral-500">Coupling Ratio:</span>
                  <span className="font-medium text-neutral-900 dark:text-neutral-200">{selectedHotspot.coupling}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-neutral-500">Dependent Services:</span>
                  <span className="font-medium text-neutral-900 dark:text-neutral-200">{selectedHotspot.dependents}</span>
                </div>
              </div>

              <div className="space-y-1">
                <span className="text-xs font-bold block text-neutral-900 dark:text-white">Recommended Remediation:</span>
                <div className="p-3 border rounded-xl text-xs leading-relaxed font-sans bg-white dark:bg-neutral-900 border-neutral-200 dark:border-neutral-800 text-neutral-800 dark:text-neutral-200">
                  <span className="font-mono text-[11px] font-bold block mb-1 text-[#51E2F5]">
                    {selectedHotspot.riskScore > 75 ? 'P0 — Critical Hotspot' : 'P1 — Action Required'}
                  </span>
                  {selectedHotspot.actions?.[0] || 'Refactor module to isolate dependencies.'}
                </div>
              </div>
            </div>
          ) : (
            <div className="text-xs text-center my-auto text-neutral-500">Select a cell to inspect.</div>
          )}

          {selectedHotspot && (
            <div className="pt-4 border-t border-neutral-200 dark:border-neutral-800">
              <Button
                variant="default"
                className="w-full justify-center"
                onClick={() => {
                  onSelectModule(selectedHotspot);
                  onNavigate('ai-diagnosis');
                }}
              >
                Inspect in AI Diagnosis <ArrowRight className="h-3.5 w-3.5" />
              </Button>
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}
