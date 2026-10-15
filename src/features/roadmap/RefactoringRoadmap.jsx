import React from 'react';
import { REFACTORING_ROADMAP } from '../../data/mockData';
import { Clock } from 'lucide-react';
import { Card } from '../../components/ui/card';
import { Badge } from '../../components/ui/badge';

export default function RefactoringRoadmap({ isDarkMode = true }) {
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
      </Card>

      {/* Roadmap List */}
      <div className="space-y-3">
        {REFACTORING_ROADMAP.map((item, idx) => (
          <Card
            key={idx}
            className="p-5 border transition-all flex flex-col md:flex-row md:items-center justify-between gap-4 border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-950 hover:border-[#51E2F5] dark:hover:border-[#51E2F5]"
          >
            <div className="flex items-start gap-4">
              <span
                className={`text-xs font-bold px-2 py-0.5 rounded-md shrink-0 mt-0.5 ${
                  item.priority === 'P0' ? 'bg-[#FFA8B6]/20 text-[#FFA8B6]' : 'bg-neutral-200 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300'
                }`}
              >
                {item.priority}
              </span>
              <div>
                <h4 className="text-sm font-bold mb-1.5 text-neutral-900 dark:text-white">
                  {item.title}
                </h4>
                <div className="flex flex-wrap items-center gap-3 text-xs text-neutral-500">
                  <span className="font-mono font-semibold text-neutral-800 dark:text-neutral-200">{item.module}</span>
                  <span>•</span>
                  <span>Category: {item.category}</span>
                  <span>•</span>
                  <span className="flex items-center gap-1 font-medium">
                    <Clock className="h-3.5 w-3.5" /> Est. effort: {item.effort}
                  </span>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-3 self-end md:self-center text-xs">
              <span className={`text-xs font-bold ${item.impact === 'CRITICAL' ? 'text-[#FFA8B6]' : 'text-neutral-400'}`}>
                Impact: {item.impact}
              </span>
              <span className="text-xs text-neutral-500 font-medium">
                {item.status}
              </span>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}
