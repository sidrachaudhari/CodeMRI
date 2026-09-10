import React from 'react';
import { Play, RotateCcw, FolderPlus, Sun, Moon } from 'lucide-react';
import { Button } from '../ui/button';

export default function Header({
  activeTab,
  onRunScan,
  isScanning,
  onOpenIngest,
  isDarkMode,
  onToggleTheme
}) {
  const titles = {
    overview: 'Repository Health & Executive Summary',
    quality: 'Code Quality, Smells & Technical Debt',
    architecture: 'System Architecture & Service Call Graph',
    dependencies: 'Third-Party Dependencies & Supply Chain',
    security: 'Vulnerability Audit & Security Findings',
    risk: 'Repository Risk Heatmap',
    'ai-diagnosis': 'Diagnostic Code Review',
    roadmap: 'Prioritized Fixes & Action Plan',
    reports: 'Printable Health Report & Exports'
  };

  return (
    <header
      className={`h-16 border-b px-6 flex items-center justify-between z-10 transition-colors duration-200 ${
        isDarkMode
          ? 'border-neutral-800 bg-black text-white'
          : 'border-neutral-200 bg-white text-neutral-900'
      }`}
    >
      <div>
        <h1 className="text-sm font-bold tracking-tight text-neutral-900 dark:text-white">
          {titles[activeTab] || 'Repository Health Check'}
        </h1>
        <p className="text-xs text-[#A28089]">
          Diagnostic health scan for software repositories
        </p>
      </div>

      <div className="flex items-center gap-3">
        {/* Theme Toggle */}
        <Button
          variant="outline"
          size="sm"
          onClick={onToggleTheme}
          title={isDarkMode ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
          className="gap-1.5 border-[#A28089]/40 dark:border-[#3D3136] text-[#362B30] dark:text-[#EDF7F6]"
        >
          {isDarkMode ? (
            <>
              <Sun className="h-3.5 w-3.5 text-[#51E2F5]" /> Light
            </>
          ) : (
            <>
              <Moon className="h-3.5 w-3.5 text-[#A28089]" /> Dark
            </>
          )}
        </Button>

        {/* Change / Ingest Repo */}
        <Button
          variant="secondary"
          size="sm"
          onClick={onOpenIngest}
          className="gap-2"
        >
          <FolderPlus className="h-3.5 w-3.5 text-[#1B1618]" /> Choose Repo
        </Button>

        {/* Run Full Scan Button */}
        <Button
          variant="default"
          size="sm"
          onClick={onRunScan}
          disabled={isScanning}
          className="gap-2"
        >
          {isScanning ? (
            <>
              <RotateCcw className="h-3.5 w-3.5 animate-spin" /> Scanning...
            </>
          ) : (
            <>
              <Play className="h-3.5 w-3.5 fill-current" /> Run Full Scan
            </>
          )}
        </Button>
      </div>
    </header>
  );
}
