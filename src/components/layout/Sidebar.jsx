import React, { useState } from 'react';
import {
  Activity,
  Layers,
  AlertTriangle,
  ShieldAlert,
  GitPullRequest,
  FileCode2,
  Box,
  Flame,
  CheckCircle2,
  FolderGit2,
  FileText
} from 'lucide-react';
import { Badge } from '../ui/badge';

const NAV_ITEMS = [
  { id: 'overview', label: 'Repository Health', icon: Activity },
  { id: 'quality', label: 'Code Quality & Tech Debt', icon: AlertTriangle },
  { id: 'architecture', label: 'System Architecture', icon: Layers },
  { id: 'dependencies', label: 'Dependencies & Packages', icon: Box },
  { id: 'security', label: 'Security & Vulnerabilities', icon: ShieldAlert },
  { id: 'risk', label: 'Hotspot Heatmap', icon: Flame },
  { id: 'ai-diagnosis', label: 'Diagnostic Review', icon: FileText },
  { id: 'roadmap', label: 'Recommended Action Plan', icon: GitPullRequest },
  { id: 'reports', label: 'Export Diagnostic Report', icon: FileCode2 },
];

export default function Sidebar({ activeTab, setActiveTab, repoInfo, isDarkMode }) {
  const [isHovered, setIsHovered] = useState(false);

  return (
    <aside
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      className={`relative border-r flex flex-col justify-between shrink-0 select-none transition-all duration-300 ease-in-out z-30 ${
        isHovered ? 'w-64 shadow-2xl' : 'w-16'
      } ${
        isDarkMode
          ? 'border-neutral-800 bg-black text-neutral-200'
          : 'border-neutral-200 bg-white text-neutral-800'
      }`}
    >
      <div>
        {/* Brand Header */}
        <div className={`p-3.5 border-b flex items-center ${isDarkMode ? 'border-neutral-800' : 'border-neutral-200'}`}>
          <div className="flex items-center gap-3 overflow-hidden">
            <div
              className="h-9 w-9 shrink-0 rounded-xl flex items-center justify-center font-black text-sm text-[#1B1618] bg-gradient-to-br from-[#51E2F5] to-[#9DF9EF] shadow-md shadow-[#51E2F5]/20"
            >
              MRI
            </div>
            {isHovered && (
              <div className="whitespace-nowrap transition-opacity duration-200 opacity-100">
                <div className="text-sm font-bold tracking-tight text-neutral-900 dark:text-white">
                  CodeMRI
                </div>
                <span className="block text-[11px] text-[#A28089]">
                  Repository Diagnostics
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Navigation Menu */}
        <nav className="p-2 space-y-1">
          {isHovered && (
            <div className="px-3 py-1.5 text-[10px] font-semibold uppercase tracking-wider text-[#A28089] whitespace-nowrap transition-opacity duration-200">
              Diagnostics
            </div>
          )}
          {NAV_ITEMS.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                title={!isHovered ? item.label : undefined}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-medium transition-all ${
                  !isHovered ? 'justify-center' : 'justify-start'
                } ${
                  isActive
                    ? 'bg-[#51E2F5] text-[#1B1618] font-bold shadow-sm shadow-[#51E2F5]/25'
                    : isDarkMode
                    ? 'text-neutral-400 hover:text-white hover:bg-neutral-900'
                    : 'text-neutral-600 hover:text-black hover:bg-neutral-100'
                }`}
              >
                <Icon className="h-4 w-4 shrink-0" />
                {isHovered && (
                  <span className="whitespace-nowrap truncate font-sans text-xs">
                    {item.label}
                  </span>
                )}
              </button>
            );
          })}
        </nav>
      </div>

      {/* Footer Info */}
      <div className={`p-3 border-t overflow-hidden ${isDarkMode ? 'border-neutral-800 bg-neutral-950' : 'border-neutral-200 bg-neutral-50'}`}>
        <div className={`flex items-center gap-2.5 ${!isHovered ? 'justify-center' : ''}`}>
          <FolderGit2 className="h-4 w-4 shrink-0 text-[#51E2F5]" />
          {isHovered && (
            <div className="truncate whitespace-nowrap">
              <span className="text-xs font-semibold block truncate font-mono text-neutral-900 dark:text-white">
                {repoInfo.name}
              </span>
              <span className="text-[11px] block font-mono text-[#A28089]">
                {repoInfo.language} • {repoInfo.buildTool}
              </span>
            </div>
          )}
        </div>

        {isHovered && (
          <div className={`pt-2 mt-2 border-t flex items-center justify-between text-xs ${isDarkMode ? 'border-neutral-800' : 'border-neutral-200'}`}>
            <span className="text-[10px] text-[#A28089]">STATUS</span>
            <span className="text-[10px] font-bold text-[#51E2F5] flex items-center gap-1">
              <CheckCircle2 className="h-3 w-3" /> Ready
            </span>
          </div>
        )}
      </div>
    </aside>
  );
}
