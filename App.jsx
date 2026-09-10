import React, { useState } from 'react';
import Sidebar from './src/components/layout/Sidebar';
import Header from './src/components/layout/Header';
import Overview from './src/features/overview/Overview';
import ArchitectureGraph from './src/features/architecture/ArchitectureGraph';
import CodeQuality from './src/features/quality/CodeQuality';
import Dependencies from './src/features/dependencies/Dependencies';
import SecurityCenter from './src/features/security/SecurityCenter';
import RiskHeatmap from './src/features/risk/RiskHeatmap';
import AIDiagnosis from './src/features/ai-diagnosis/AIDiagnosis';
import RefactoringRoadmap from './src/features/roadmap/RefactoringRoadmap';
import Reports from './src/features/reports/Reports';
import ProjectIngestionModal from './src/features/ingestion/ProjectIngestionModal';
import { PIPELINE_STAGES, MODULE_DATA, REPO_SNAPSHOT, HEALTH_SCORE, SECURITY_METRICS, DEPENDENCY_LIST } from './src/data/mockData';
import { analyzeProjectInput } from './src/data/scanner';

export default function App() {
  const [isDarkMode, setIsDarkMode] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');
  const [isScanning, setIsScanning] = useState(false);
  const [scanStep, setScanStep] = useState(8); // Default complete
  const [isIngestModalOpen, setIsIngestModalOpen] = useState(false);
  const [isMobileNavOpen, setIsMobileNavOpen] = useState(false);

  // Dynamic Repository State
  const [currentRepo, setCurrentRepo] = useState(REPO_SNAPSHOT);
  const [currentHealthScore, setCurrentHealthScore] = useState(HEALTH_SCORE);
  const [currentHotspots, setCurrentHotspots] = useState(MODULE_DATA);
  const [selectedModule, setSelectedModule] = useState(MODULE_DATA[0]);
  const [currentFindings, setCurrentFindings] = useState(SECURITY_METRICS.findings);
  const [currentDependencies, setCurrentDependencies] = useState(DEPENDENCY_LIST);

  React.useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [isDarkMode]);

  const runFullScan = () => {
    setIsScanning(true);
    setScanStep(0);
    const interval = setInterval(() => {
      setScanStep((prev) => {
        if (prev >= PIPELINE_STAGES.length - 1) {
          clearInterval(interval);
          setIsScanning(false);
          return PIPELINE_STAGES.length - 1;
        }
        return prev + 1;
      });
    }, 500);
  };

  const handleIngestProject = (inputData) => {
    const scanResults = analyzeProjectInput(inputData);

    setCurrentRepo({
      name: scanResults.projectName,
      language: scanResults.language,
      buildTool: scanResults.buildTool,
      filesAnalyzed: scanResults.filesAnalyzed,
      loc: scanResults.loc,
      modulesCount: scanResults.modulesCount,
      dependenciesCount: scanResults.dependenciesCount,
      issuesDetected: scanResults.issuesDetected,
      techDebtHours: scanResults.techDebtHours,
      isDemoData: false
    });

    setCurrentHealthScore(scanResults.healthScore);

    if (scanResults.hotspots.length > 0) {
      setCurrentHotspots(scanResults.hotspots);
      setSelectedModule(scanResults.hotspots[0]);
    }

    if (scanResults.findings.length > 0) {
      setCurrentFindings(scanResults.findings);
    }

    if (scanResults.dependencies.length > 0) {
      setCurrentDependencies(scanResults.dependencies);
    }

    runFullScan();
  };

  return (
    <div
      className={`flex h-screen overflow-hidden font-sans transition-colors duration-200 ${
        isDarkMode ? 'dark bg-[#0a0a0c] text-neutral-100' : 'bg-[#f8fafc] text-[#0f172a]'
      }`}
    >
      {/* Sidebar (Desktop + Mobile Drawer) */}
      <Sidebar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        repoInfo={currentRepo}
        isDarkMode={isDarkMode}
        isMobileOpen={isMobileNavOpen}
        onCloseMobile={() => setIsMobileNavOpen(false)}
      />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <Header
          activeTab={activeTab}
          onRunScan={runFullScan}
          isScanning={isScanning}
          onOpenIngest={() => setIsIngestModalOpen(true)}
          isDarkMode={isDarkMode}
          onToggleTheme={() => setIsDarkMode((prev) => !prev)}
          onOpenMobileMenu={() => setIsMobileNavOpen(true)}
        />

        <main
          className={`flex-1 overflow-y-auto p-3 sm:p-6 transition-colors duration-200 ${
            isDarkMode ? 'bg-[#0a0a0c]' : 'bg-[#f8fafc]'
          }`}
        >
          {activeTab === 'overview' && (
            <Overview
              onSelectModule={setSelectedModule}
              onNavigate={setActiveTab}
              scanStep={scanStep}
              isScanning={isScanning}
              repoSnapshot={currentRepo}
              healthScore={currentHealthScore}
              modules={currentHotspots}
              isDarkMode={isDarkMode}
            />
          )}

          {activeTab === 'architecture' && (
            <ArchitectureGraph
              onSelectModule={setSelectedModule}
              onNavigate={setActiveTab}
              isDarkMode={isDarkMode}
            />
          )}

          {activeTab === 'quality' && (
            <CodeQuality
              onSelectModule={setSelectedModule}
              onNavigate={setActiveTab}
              isDarkMode={isDarkMode}
            />
          )}

          {activeTab === 'dependencies' && (
            <Dependencies
              dependencies={currentDependencies}
              isDarkMode={isDarkMode}
            />
          )}

          {activeTab === 'security' && (
            <SecurityCenter
              findings={currentFindings}
              score={currentHealthScore.breakdown.find((b) => b.category === 'Security')?.score || 91}
              isDarkMode={isDarkMode}
            />
          )}

          {activeTab === 'risk' && (
            <RiskHeatmap
              onSelectModule={setSelectedModule}
              onNavigate={setActiveTab}
              isDarkMode={isDarkMode}
            />
          )}

          {activeTab === 'ai-diagnosis' && (
            <AIDiagnosis
              selectedModule={selectedModule}
              onSelectModule={setSelectedModule}
              onNavigate={setActiveTab}
              modules={currentHotspots}
              isDarkMode={isDarkMode}
            />
          )}

          {activeTab === 'roadmap' && (
            <RefactoringRoadmap isDarkMode={isDarkMode} />
          )}

          {activeTab === 'reports' && (
            <Reports
              repoSnapshot={currentRepo}
              healthScore={currentHealthScore}
              findings={currentFindings}
              hotspots={currentHotspots}
              isDarkMode={isDarkMode}
            />
          )}
        </main>
      </div>

      {/* Ingestion Modal */}
      <ProjectIngestionModal
        isOpen={isIngestModalOpen}
        onClose={() => setIsIngestModalOpen(false)}
        onIngestProject={handleIngestProject}
        isDarkMode={isDarkMode}
      />
    </div>
  );
}