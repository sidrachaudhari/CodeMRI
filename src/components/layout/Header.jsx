import React from 'react';
import { Play, RotateCcw, FolderPlus, Sun, Moon, Menu } from 'lucide-react';
import { Button } from '../ui/button';

export default function Header({
  activeTab,
  onRunScan,
  isScanning,
  onOpenIngest,
  isDarkMode,
  onToggleTheme,
  onOpenMobileMenu
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
      className={`h-14 sm:h-16 border-b px-3 sm:px-6 flex items-center justify-between z-10 transition-colors duration-200 shrink-0 ${
        isDarkMode
          ? 'border-neutral-800 bg-black text-white'
          : 'border-neutral-200 bg-white text-neutral-900'
      }`}
    >
      {/* Left: Hamburger (Mobile) + Title */}
      <div className="flex items-center gap-2.5 sm:gap-3 min-w-0">
        {/* Mobile Hamburger Button */}
        <button
          onClick={onOpenMobileMenu}
          aria-label="Open navigation menu"
          className="md:hidden p-1.5 -ml-1 rounded-xl text-neutral-500 hover:text-neutral-900 dark:hover:text-white hover:bg-neutral-100 dark:hover:bg-neutral-900 transition-colors shrink-0"
        >
          <Menu className="h-5 w-5" />
        </button>

        <div className="min-w-0">
          <h1 className="text-xs sm:text-sm font-bold tracking-tight text-neutral-900 dark:text-white truncate max-w-[130px] xs:max-w-[220px] sm:max-w-none">
            {titles[activeTab] || 'Repository Health Check'}
          </h1>
          <p className="text-[11px] sm:text-xs text-[#A28089] truncate hidden xs:block">
            Diagnostic health scan for software repositories
          </p>
        </div>
      </div>

      {/* Right: Actions */}
      <div className="flex items-center gap-1.5 sm:gap-3 shrink-0">
        {/* Theme Toggle */}
        <Button
          variant="outline"
          size="sm"
          onClick={onToggleTheme}
          title={isDarkMode ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
          className="px-2 sm:px-3 gap-1.5 border-[#A28089]/40 dark:border-[#3D3136] text-[#362B30] dark:text-[#EDF7F6]"
        >
          {isDarkMode ? (
            <>
              <Sun className="h-3.5 w-3.5 text-[#51E2F5]" />
              <span className="hidden sm:inline">Light</span>
            </>
          ) : (
            <>
              <Moon className="h-3.5 w-3.5 text-[#A28089]" />
              <span className="hidden sm:inline">Dark</span>
            </>
          )}
        </Button>

        {/* Change / Ingest Repo */}
        <Button
          variant="secondary"
          size="sm"
          onClick={onOpenIngest}
          className="px-2 sm:px-3 gap-1.5"
          title="Choose or Upload Repository"
        >
          <FolderPlus className="h-3.5 w-3.5 text-[#1B1618]" />
          <span className="hidden sm:inline">Choose Repo</span>
        </Button>

        {/* Run Full Scan Button */}
        <Button
          variant="default"
          size="sm"
          onClick={onRunScan}
          disabled={isScanning}
          className="px-2.5 sm:px-3 gap-1.5"
        >
          {isScanning ? (
            <>
              <RotateCcw className="h-3.5 w-3.5 animate-spin" />
              <span className="hidden xs:inline">Scanning...</span>
            </>
          ) : (
            <>
              <Play className="h-3.5 w-3.5 fill-current" />
              <span className="hidden sm:inline">Run Full Scan</span>
              <span className="sm:hidden">Scan</span>
            </>
          )}
        </Button>
      </div>
    </header>
  );
}
