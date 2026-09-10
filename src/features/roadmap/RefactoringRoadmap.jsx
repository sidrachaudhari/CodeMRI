import React from 'react';
import { REFACTORING_ROADMAP } from '../../data/mockData';
import { Clock } from 'lucide-react';
import { Card } from '../../components/ui/card';
import { Badge } from '../../components/ui/badge';

export default function RefactoringRoadmap({ isDarkMode = true }) {
  return (
    <div className="space-y-6 pb-12">
      {/* Overview Banner */}
      <Card className="p-5 flex items-center justify-between border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-950">
        <div>
          <h2 className="text-base font-bold text-neutral-900 dark:text-white">Recommended Action Plan</h2>
          <p className="text-xs mt-0.5 text-neutral-500">
            Prioritized engineering backlog to reduce technical debt, address CVEs, and improve system maintainability
          </p>
        </div>
        <Badge variant="mauve">
          5 Action Items
        </Badge>
      </Card>

      {/* Roadmap List */}
      <div className="space-y-3">
        {REFACTORING_ROADMAP.map((item, idx) => (
          <Card
            key={idx}
            className="p-5 border transition-all flex flex-col md:flex-row md:items-center justify-between gap-4 border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-950 hover:border-[#51E2F5] dark:hover:border-[#51E2F5]"
          >
            <div className="flex items-start gap-4">
              <Badge
                variant={item.priority === 'P0' ? 'coral' : item.priority === 'P1' ? 'secondary' : 'pebble'}
                className="shrink-0 mt-0.5"
              >
                {item.priority}
              </Badge>
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
                    <Clock className="h-3.5 w-3.5" /> Estimated effort: {item.effort}
                  </span>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-3 self-end md:self-center text-xs">
              <Badge
                variant={item.impact === 'CRITICAL' ? 'coral' : 'slate'}
              >
                Impact: {item.impact}
              </Badge>
              <Badge variant="outline">
                {item.status}
              </Badge>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}
