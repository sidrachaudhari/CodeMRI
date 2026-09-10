import React, { useState } from 'react';
import {
  Activity,
  ShieldAlert,
  Cpu,
  GitPullRequest,
  Layers,
  FileCode2,
  AlertTriangle,
  CheckCircle2,
  ChevronRight,
  Download,
  Play,
  RotateCcw,
  Sparkles,
  Server,
  Database,
  ArrowRight,
  TrendingDown,
  Info,
  Clock,
  Terminal,
  Search,
  ExternalLink
} from 'lucide-react';

// --- DATA DEFINITION & MODELS ---
const PIPELINE_STAGES = [
  { id: '01', name: 'Project Ingestion', desc: 'Parsing repo manifest & AST extraction' },
  { id: '02', name: 'Repo Preprocessing', desc: 'File tokenization & build tool index' },
  { id: '03', name: 'Static Code Analysis', desc: 'AST metrics, cyclomatic hotspots' },
  { id: '04', name: 'Structure Analysis', desc: 'Module coupling & call-graph analysis' },
  { id: '05', name: 'Security Analysis', desc: 'OWASP Top-10 & CVE dependency check' },
  { id: '06', name: 'Metrics & Tech Debt', desc: 'Quantifying remediation hours' },
  { id: '07', name: 'AI Diagnosis (RAG)', desc: 'Gemini reasoning over retrieved context' },
  { id: '08', name: 'Software Health Score', desc: 'Multi-pillar weighted scoring' },
  { id: '09', name: 'MRI Report Gen', desc: 'Diagnostic blueprint synthesis' }
];

const MODULE_DATA = [
  {
    name: 'PaymentService.java',
    category: 'Backend Core',
    riskScore: 87,
    complexity: 18,
    coupling: 0.72,
    dependents: 7,
    securityIssues: 1,
    loc: 1420,
    techDebt: '24h',
    ragEvidence: [
      'AST Cyclomatic Complexity exceeds threshold (> 15).',
      'Afferent/Efferent coupling ratio 0.72 indicates tight cohesion failure.',
      'Log4j v2.14.1 transitive vulnerability mapped to transaction dispatch.',
      '7 consumer services depend directly on un-abstracted persistence entities.'
    ],
    diagnosis: 'Acts as an architectural bottleneck. Un-isolated payment validation loops and high incoming dependencies increase cascade-failure risk during upstream schema changes.',
    actions: [
      'Extract validateTransaction() into dedicated domain validator.',
      'Decouple direct dependency from OrderService using event-driven pub/sub.',
      'Patch Log4j dependency to version >= 2.17.1.'
    ]
  },
  {
    name: 'OrderController.java',
    category: 'API / Routing',
    riskScore: 81,
    complexity: 14,
    coupling: 0.68,
    dependents: 5,
    securityIssues: 0,
    loc: 890,
    techDebt: '16h',
    ragEvidence: [
      'Controller contains direct business logic and DB transactions.',
      'Coupling with 5 microservices without circuit breaker fallback.'
    ],
    diagnosis: 'Violates Single Responsibility Principle. High blast radius if PaymentService or InventoryService stalls.',
    actions: [
      'Introduce Command/Query Responsibility Segregation (CQRS).',
      'Move validation logic to middleware request validators.'
    ]
  },
  {
    name: 'UserRepository.java',
    category: 'Data Access',
    riskScore: 54,
    complexity: 8,
    coupling: 0.35,
    dependents: 9,
    securityIssues: 1,
    loc: 620,
    techDebt: '9h',
    ragEvidence: [
      'Unparameterized SQL string concat pattern flagged in findByCustomFilter().',
      'High reuse across authentication and billing services.'
    ],
    diagnosis: 'Potential SQL Injection vector under high reuse conditions.',
    actions: ['Refactor native query into Spring Data JPA CriteriaBuilder parameterization.']
  },
  {
    name: 'AuthService.java',
    category: 'Security / Auth',
    riskScore: 32,
    complexity: 6,
    coupling: 0.22,
    dependents: 12,
    securityIssues: 0,
    loc: 540,
    techDebt: '4h',
    ragEvidence: ['Isolated token validation logic.', 'Zero cyclic dependencies detected.'],
    diagnosis: 'Well-encapsulated service with minimal coupling and high test coverage.',
    actions: ['Maintain current interface contract; update JWT expiration telemetry.']
  },
  {
    name: 'ProductService.java',
    category: 'Catalog Core',
    riskScore: 28,
    complexity: 5,
    coupling: 0.18,
    dependents: 4,
    securityIssues: 0,
    loc: 480,
    techDebt: '3h',
    ragEvidence: ['Low branch complexity.', 'Clean domain segregation.'],
    diagnosis: 'Healthy architectural module meeting optimal maintainability baseline.',
    actions: ['No refactoring required at this cycle.']
  }
];

export default function CodeMRIDashboard() {
  const [activeTab, setActiveTab] = useState('overview');
  const [selectedModule, setSelectedModule] = useState(MODULE_DATA[0]);
  const [isScanning, setIsScanning] = useState(false);
  const [scanStep, setScanStep] = useState(8); // Default completed

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
    }, 600);
  };

  return (
    <div className="flex h-screen bg-[#0b0f17] text-slate-200 font-sans antialiased overflow-hidden">
      {/* --- SIDEBAR --- */}
      <aside className="w-64 border-r border-slate-800 bg-[#0d131f] flex flex-col justify-between shrink-0">
        <div>
          {/* Brand */}
          <div className="p-5 border-b border-slate-800">
            <div className="flex items-center gap-2.5">
              <div className="h-8 w-8 rounded-lg bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-400">
                <Activity className="h-5 w-5 animate-pulse" />
              </div>
              <div>
                <span className="font-mono text-base font-bold tracking-wider text-white">CODEMRI</span>
                <span className="block text-[10px] text-cyan-400/80 font-mono tracking-widest uppercase">Repo Intelligence</span>
              </div>
            </div>
          </div>

          {/* Navigation */}
          <nav className="p-3 space-y-1">
            {[
              { id: 'overview', label: 'Overview', icon: Activity },
              { id: 'architecture', label: 'Architecture & Nodes', icon: Layers },
              { id: 'quality', label: 'Code Quality & Risk', icon: AlertTriangle },
              { id: 'security', label: 'Security & CVEs', icon: ShieldAlert },
              { id: 'ai-diagnosis', label: 'AI Diagnosis (RAG)', icon: Sparkles },
              { id: 'roadmap', label: 'Refactoring Roadmap', icon: GitPullRequest },
              { id: 'reports', label: 'MRI Reports', icon: FileCode2 }
            ].map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => setActiveTab(item.id)}
                  className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-lg text-xs font-medium transition-colors ${
                    isActive
                      ? 'bg-cyan-500/10 text-cyan-400 border border-cyan-500/30 font-semibold'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/40'
                  }`}
                >
                  <Icon className={`h-4 w-4 ${isActive ? 'text-cyan-400' : 'text-slate-500'}`} />
                  {item.label}
                </button>
              );
            })}
          </nav>
        </div>

        {/* Footer Profile & Status */}
        <div className="p-4 border-t border-slate-800 bg-[#090d15] space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-[11px] text-slate-400">Repository</span>
            <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-cyan-950/60 border border-cyan-800 text-cyan-300">
              ecommerce-platform
            </span>
          </div>
          <div className="flex items-center justify-between text-[11px] text-slate-500">
            <span>Stack</span>
            <span className="font-mono text-slate-400">Java 17 / Spring Boot</span>
          </div>
          <div className="pt-2 border-t border-slate-800/80 flex items-center gap-2">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
            </span>
            <span className="text-[10px] text-slate-400 font-mono">AST Engine: READY</span>
          </div>
        </div>
      </aside>

      {/* --- MAIN CONTENT AREA --- */}
      <main className="flex-1 flex flex-col overflow-hidden">
        {/* Top Header */}
        <header className="h-14 border-b border-slate-800 bg-[#0d131f]/70 backdrop-blur px-6 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 text-xs">
              <span className="px-2 py-0.5 rounded bg-amber-500/10 text-amber-400 border border-amber-500/20 font-mono text-[10px]">
                DEMO DATA
              </span>
              <span className="text-slate-400">Last scanned:</span>
              <span className="font-mono text-slate-200">Today, 18:42 UTC</span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={runFullScan}
              disabled={isScanning}
              className="flex items-center gap-2 px-3.5 py-1.5 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-slate-950 font-semibold text-xs transition shadow-sm disabled:opacity-50 cursor-pointer"
            >
              {isScanning ? (
                <>
                  <RotateCcw className="h-3.5 w-3.5 animate-spin text-slate-950" />
                  Running Pipeline...
                </>
              ) : (
                <>
                  <Play className="h-3.5 w-3.5 fill-current" />
                  Run MRI Scan
                </>
              )}
            </button>
            <button
              onClick={() => setActiveTab('reports')}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs border border-slate-700"
            >
              <Download className="h-3.5 w-3.5" />
              Export PDF
            </button>
          </div>
        </header>

        {/* 9-STAGE PIPELINE TICKER */}
        <section className="bg-[#080c14] border-b border-slate-800/80 px-6 py-2.5">
          <div className="flex items-center justify-between max-w-7xl mx-auto overflow-x-auto gap-2 py-1 scrollbar-none">
            {PIPELINE_STAGES.map((stg, idx) => {
              const isDone = idx < scanStep;
              const isCurrent = idx === scanStep;
              return (
                <div key={stg.id} className="flex items-center gap-1.5 shrink-0">
                  <div
                    className={`flex items-center gap-1.5 text-[11px] font-mono px-2 py-1 rounded transition-colors ${
                      isCurrent
                        ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 font-bold'
                        : isDone
                        ? 'text-slate-400 bg-slate-800/40'
                        : 'text-slate-600'
                    }`}
                  >
                    <span className="text-[9px] opacity-60">{stg.id}</span>
                    <span>{stg.name}</span>
                    {isDone && <CheckCircle2 className="h-3 w-3 text-emerald-400" />}
                    {isCurrent && <div className="h-1.5 w-1.5 rounded-full bg-cyan-400 animate-ping" />}
                  </div>
                  {idx < PIPELINE_STAGES.length - 1 && (
                    <ChevronRight className="h-3 w-3 text-slate-700 shrink-0" />
                  )}
                </div>
              );
            })}
          </div>
        </section>

        {/* --- SCROLLABLE TAB VIEW --- */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {activeTab === 'overview' && (
            <>
              {/* Health Score & Key Repository Stats */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                {/* Visual Health Score Centerpiece */}
                <div className="lg:col-span-5 bg-[#0f172a]/60 border border-slate-800 rounded-xl p-6 relative overflow-hidden flex flex-col justify-between">
                  <div className="flex justify-between items-start">
                    <div>
                      <h2 className="text-xs uppercase tracking-wider font-mono text-cyan-400">Diagnostic Verdict</h2>
                      <p className="text-lg font-bold text-white mt-1">SOFTWARE HEALTH SCORE</p>
                    </div>
                    <span className="px-2.5 py-1 text-xs font-mono rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                      GOOD — IMPROVEMENTS RECOMMENDED
                    </span>
                  </div>

                  {/* Radial / Score Center */}
                  <div className="flex items-center justify-center my-6">
                    <div className="relative flex items-center justify-center">
                      <svg className="w-44 h-44 transform -rotate-90">
                        <circle cx="88" cy="88" r="70" stroke="#1e293b" strokeWidth="12" fill="transparent" />
                        <circle
                          cx="88"
                          cy="88"
                          r="70"
                          stroke="#06b6d4"
                          strokeWidth="12"
                          strokeDasharray={440}
                          strokeDashoffset={440 - (440 * 78) / 100}
                          strokeLinecap="round"
                          fill="transparent"
                        />
                      </svg>
                      <div className="absolute flex flex-col items-center">
                        <span className="text-4xl font-extrabold text-white font-mono">78</span>
                        <span className="text-[11px] font-mono text-slate-400 uppercase tracking-widest">/ 100</span>
                      </div>
                    </div>
                  </div>

                  {/* Pillar Breakdown */}
                  <div className="space-y-2 pt-3 border-t border-slate-800 text-xs">
                    {[
                      { name: 'Security', score: 91, color: 'bg-emerald-400' },
                      { name: 'Code Quality', score: 82, color: 'bg-cyan-400' },
                      { name: 'Maintainability', score: 76, color: 'bg-blue-400' },
                      { name: 'Architecture', score: 74, color: 'bg-indigo-400' },
                      { name: 'Dependencies', score: 68, color: 'bg-amber-400' }
                    ].map((pillar) => (
                      <div key={pillar.name} className="flex items-center justify-between">
                        <span className="text-slate-400">{pillar.name}</span>
                        <div className="flex items-center gap-3 w-44">
                          <div className="flex-1 h-1.5 bg-slate-800 rounded-full overflow-hidden">
                            <div
                              className={`h-full ${pillar.color} rounded-full`}
                              style={{ width: `${pillar.score}%` }}
                            />
                          </div>
                          <span className="font-mono text-slate-200 text-right w-6">{pillar.score}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Repository Snapshot Metric Grid */}
                <div className="lg:col-span-7 grid grid-cols-2 sm:grid-cols-3 gap-4">
                  {[
                    { label: 'Files Analyzed', val: '1,284', sub: '98% Java, 2% XML', icon: FileCode2 },
                    { label: 'Lines of Code', val: '184K', sub: '142K executable', icon: Terminal },
                    { label: 'Modules', val: '47', sub: '5 key microservices', icon: Layers },
                    { label: 'Dependencies', val: '136', sub: '4 vulnerable (1 CVE)', icon: Server },
                    { label: 'Issues Detected', val: '63', sub: '12 high, 51 medium/low', icon: AlertTriangle },
                    { label: 'Technical Debt', val: '142 hrs', sub: 'est. remediation cost', icon: Clock }
                  ].map((stat, i) => {
                    const Icon = stat.icon;
                    return (
                      <div key={i} className="bg-[#0f172a]/60 border border-slate-800 rounded-xl p-4 flex flex-col justify-between">
                        <div className="flex justify-between items-start text-slate-400">
                          <span className="text-xs font-medium">{stat.label}</span>
                          <Icon className="h-4 w-4 text-cyan-400" />
                        </div>
                        <div className="my-2">
                          <span className="text-2xl font-bold font-mono text-white">{stat.val}</span>
                          <span className="block text-[11px] text-slate-500 mt-0.5">{stat.sub}</span>
                        </div>
                        <div className="text-[10px] text-cyan-400/80 font-mono">AST Verified ✓</div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* TRADITIONAL VS CODEMRI COMPARISON STRIP */}
              <div className="border border-cyan-500/20 rounded-xl p-4 bg-gradient-to-r from-cyan-950/20 via-slate-900 to-slate-900 flex flex-col md:flex-row items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-cyan-500/10 rounded-lg text-cyan-400">
                    <Sparkles className="h-5 w-5" />
                  </div>
                  <div>
                    <h3 className="text-xs font-bold uppercase tracking-wider text-cyan-300">CodeMRI Context Correlation</h3>
                    <p className="text-xs text-slate-400">
                      Eliminates alert fatigue by correlating AST complexity, call coupling, and CVEs into a contextual diagnostic report.
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2 font-mono text-[11px] text-slate-300">
                  <span className="line-through text-slate-500">63 Unfiltered Alerts</span>
                  <ArrowRight className="h-3.5 w-3.5 text-cyan-400" />
                  <span className="text-emerald-400 font-semibold">4 Actionable P0/P1 Refactorings</span>
                </div>
              </div>

              {/* Architectural Hotspots Table */}
              <div className="bg-[#0f172a]/60 border border-slate-800 rounded-xl overflow-hidden">
                <div className="px-6 py-4 border-b border-slate-800 flex justify-between items-center">
                  <div>
                    <h3 className="text-sm font-semibold text-white">Critical Architectural Hotspots</h3>
                    <p className="text-xs text-slate-400">Modules showing combined high complexity and coupling</p>
                  </div>
                  <button
                    onClick={() => setActiveTab('architecture')}
                    className="text-xs text-cyan-400 hover:text-cyan-300 flex items-center gap-1 font-mono"
                  >
                    View Interactive Graph <ChevronRight className="h-3.5 w-3.5" />
                  </button>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-[#0b101b] text-slate-400 font-mono text-[11px] uppercase border-b border-slate-800">
                      <tr>
                        <th className="px-6 py-3">Module / File</th>
                        <th className="px-4 py-3">Category</th>
                        <th className="px-4 py-3">Complexity (CC)</th>
                        <th className="px-4 py-3">Coupling Ratio</th>
                        <th className="px-4 py-3">Dependents</th>
                        <th className="px-4 py-3">Risk Index</th>
                        <th className="px-6 py-3 text-right">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/60 font-mono">
                      {MODULE_DATA.map((m) => (
                        <tr key={m.name} className="hover:bg-slate-800/30 transition-colors">
                          <td className="px-6 py-3.5 font-medium text-white flex items-center gap-2">
                            <FileCode2 className="h-4 w-4 text-cyan-400" />
                            {m.name}
                          </td>
                          <td className="px-4 py-3.5 text-slate-400">{m.category}</td>
                          <td className="px-4 py-3.5">
                            <span className={m.complexity > 10 ? 'text-amber-400 font-bold' : 'text-slate-300'}>
                              {m.complexity}
                            </span>
                          </td>
                          <td className="px-4 py-3.5 text-slate-300">{m.coupling}</td>
                          <td className="px-4 py-3.5 text-slate-300">{m.dependents}</td>
                          <td className="px-4 py-3.5">
                            <span
                              className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                                m.riskScore > 80
                                  ? 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                                  : m.riskScore > 50
                                  ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                                  : 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                              }`}
                            >
                              {m.riskScore} / 100
                            </span>
                          </td>
                          <td className="px-6 py-3.5 text-right">
                            <button
                              onClick={() => {
                                setSelectedModule(m);
                                setActiveTab('ai-diagnosis');
                              }}
                              className="text-cyan-400 hover:text-cyan-300 text-[11px] underline cursor-pointer"
                            >
                              Inspect AI RAG Evidence
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </>
          )}

          {/* TAB: ARCHITECTURE & NODES */}
          {activeTab === 'architecture' && (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 h-full">
              {/* Graph Visual Canvas */}
              <div className="lg:col-span-8 bg-[#0f172a]/60 border border-slate-800 rounded-xl p-6 flex flex-col justify-between relative min-h-[500px]">
                <div>
                  <div className="flex justify-between items-center mb-4">
                    <div>
                      <h3 className="text-sm font-semibold text-white">Call-Graph & Structural Topology</h3>
                      <p className="text-xs text-slate-400">Click any service node to inspect afferent/efferent context</p>
                    </div>
                    <span className="text-[11px] font-mono px-2 py-1 rounded bg-slate-800 text-slate-300">
                      Layout: Force-Directed (Simulated)
                    </span>
                  </div>

                  {/* Interactive Nodes Representation */}
                  <div className="grid grid-cols-3 gap-6 my-10 max-w-2xl mx-auto">
                    {MODULE_DATA.map((mod) => {
                      const isSelected = selectedModule.name === mod.name;
                      return (
                        <div
                          key={mod.name}
                          onClick={() => setSelectedModule(mod)}
                          className={`p-4 rounded-xl border cursor-pointer transition-all ${
                            isSelected
                              ? 'bg-cyan-950/40 border-cyan-400 ring-2 ring-cyan-500/20 shadow-lg'
                              : 'bg-slate-900/80 border-slate-800 hover:border-slate-700'
                          }`}
                        >
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-[10px] font-mono text-slate-500 uppercase">{mod.category}</span>
                            <span
                              className={`h-2 w-2 rounded-full ${
                                mod.riskScore > 80 ? 'bg-rose-500' : mod.riskScore > 50 ? 'bg-amber-500' : 'bg-emerald-500'
                              }`}
                            />
                          </div>
                          <div className="font-mono text-xs font-bold text-white truncate">{mod.name}</div>
                          <div className="mt-3 flex justify-between text-[11px] font-mono text-slate-400">
                            <span>CC: {mod.complexity}</span>
                            <span>Deps: {mod.dependents}</span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                <div className="p-3 bg-slate-900/90 rounded-lg border border-slate-800 flex items-center justify-between text-xs text-slate-400 font-mono">
                  <span>Selected Node: <strong className="text-white">{selectedModule.name}</strong></span>
                  <span className="text-cyan-400">Coupling Index: {selectedModule.coupling} (High Ripple Risk)</span>
                </div>
              </div>

              {/* Node Detail Inspector */}
              <div className="lg:col-span-4 bg-[#0f172a]/60 border border-slate-800 rounded-xl p-5 flex flex-col justify-between">
                <div>
                  <h4 className="text-xs uppercase tracking-wider font-mono text-cyan-400 mb-1">Structural Inspection</h4>
                  <h2 className="text-lg font-bold text-white font-mono break-all">{selectedModule.name}</h2>
                  <div className="mt-4 space-y-3">
                    <div className="flex justify-between text-xs py-1.5 border-b border-slate-800">
                      <span className="text-slate-400">Module Type</span>
                      <span className="text-slate-200 font-mono">{selectedModule.category}</span>
                    </div>
                    <div className="flex justify-between text-xs py-1.5 border-b border-slate-800">
                      <span className="text-slate-400">Cyclomatic Complexity</span>
                      <span className="text-amber-400 font-mono font-bold">{selectedModule.complexity}</span>
                    </div>
                    <div className="flex justify-between text-xs py-1.5 border-b border-slate-800">
                      <span className="text-slate-400">Afferent Dependents</span>
                      <span className="text-slate-200 font-mono">{selectedModule.dependents} caller services</span>
                    </div>
                    <div className="flex justify-between text-xs py-1.5 border-b border-slate-800">
                      <span className="text-slate-400">Estimated Technical Debt</span>
                      <span className="text-rose-400 font-mono font-bold">{selectedModule.techDebt}</span>
                    </div>
                  </div>

                  <div className="mt-5">
                    <h5 className="text-[11px] font-mono text-cyan-400 uppercase tracking-wide mb-2">AST Reasoning</h5>
                    <p className="text-xs text-slate-300 leading-relaxed bg-slate-900/80 p-3 rounded border border-slate-800">
                      {selectedModule.diagnosis}
                    </p>
                  </div>
                </div>

                <button
                  onClick={() => setActiveTab('ai-diagnosis')}
                  className="w-full mt-4 py-2 bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-400 border border-cyan-500/30 rounded-lg text-xs font-semibold flex items-center justify-center gap-2 transition"
                >
                  <Sparkles className="h-4 w-4" /> Open Full AI Diagnosis
                </button>
              </div>
            </div>
          )}

          {/* TAB: AI DIAGNOSIS (RAG + EVIDENCE) */}
          {activeTab === 'ai-diagnosis' && (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              {/* Left Column: Context & Evidence */}
              <div className="lg:col-span-6 space-y-6">
                <div className="bg-[#0f172a]/60 border border-slate-800 rounded-xl p-6">
                  <div className="flex items-center gap-2 mb-3">
                    <Sparkles className="h-4 w-4 text-purple-400" />
                    <h3 className="text-sm font-semibold text-white">Grounding Evidence (RAG Context)</h3>
                  </div>
                  <p className="text-xs text-slate-400 mb-4">
                    The Gemini model diagnoses the repository purely based on deterministic AST signals and security AST artifacts:
                  </p>
                  <div className="space-y-2">
                    {selectedModule.ragEvidence.map((ev, i) => (
                      <div key={i} className="flex items-start gap-2 text-xs font-mono p-2.5 rounded bg-slate-900/80 border border-slate-800">
                        <CheckCircle2 className="h-3.5 w-3.5 text-cyan-400 mt-0.5 shrink-0" />
                        <span className="text-slate-300">{ev}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="bg-[#0f172a]/60 border border-slate-800 rounded-xl p-6">
                  <h4 className="text-xs uppercase tracking-wider font-mono text-cyan-400 mb-2">Module Selector</h4>
                  <div className="flex flex-wrap gap-2">
                    {MODULE_DATA.map((mod) => (
                      <button
                        key={mod.name}
                        onClick={() => setSelectedModule(mod)}
                        className={`text-xs font-mono px-3 py-1.5 rounded-lg border transition ${
                          selectedModule.name === mod.name
                            ? 'bg-cyan-500/20 text-cyan-300 border-cyan-500/50'
                            : 'bg-slate-900 text-slate-400 border-slate-800 hover:text-slate-200'
                        }`}
                      >
                        {mod.name}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Right Column: AI Synthesis */}
              <div className="lg:col-span-6 bg-[#0f172a]/60 border border-slate-800 rounded-xl p-6 flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between pb-4 border-b border-slate-800">
                    <div>
                      <span className="text-[10px] font-mono text-purple-400 uppercase tracking-widest">Gemini Software Model</span>
                      <h3 className="text-base font-bold text-white mt-0.5">Contextual Diagnosis</h3>
                    </div>
                    <span className="text-[10px] font-mono px-2 py-1 rounded bg-purple-500/10 text-purple-300 border border-purple-500/20">
                      Temp: 0.0 (Deterministic)
                    </span>
                  </div>

                  <div className="my-5 space-y-4">
                    <div>
                      <h4 className="text-xs font-mono text-slate-400 uppercase">Target Hotspot</h4>
                      <p className="font-mono text-sm text-cyan-400 font-bold">{selectedModule.name}</p>
                    </div>

                    <div className="bg-slate-900/90 border border-slate-800 p-4 rounded-lg">
                      <h5 className="text-xs font-semibold text-slate-300 mb-1">Why this matters</h5>
                      <p className="text-xs text-slate-300 leading-relaxed">
                        {selectedModule.diagnosis}
                      </p>
                    </div>

                    <div>
                      <h5 className="text-xs font-semibold text-slate-300 mb-2">AI-Generated Remediation Directives</h5>
                      <ul className="space-y-2">
                        {selectedModule.actions.map((act, i) => (
                          <li key={i} className="flex items-start gap-2 text-xs text-slate-300">
                            <span className="h-5 w-5 rounded bg-cyan-500/10 text-cyan-400 flex items-center justify-center font-mono text-[10px] shrink-0 border border-cyan-500/20">
                              {i + 1}
                            </span>
                            <span>{act}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </div>

                <div className="pt-4 border-t border-slate-800 flex items-center justify-between">
                  <span className="text-xs font-mono text-slate-500">Confidence Score: 0.94</span>
                  <button
                    onClick={() => setActiveTab('roadmap')}
                    className="px-3.5 py-1.5 bg-cyan-600 hover:bg-cyan-500 text-slate-950 font-semibold rounded-lg text-xs flex items-center gap-1.5 transition"
                  >
                    Send to Refactoring Roadmap <ChevronRight className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* TAB: REFACTORING ROADMAP */}
          {activeTab === 'roadmap' && (
            <div className="space-y-6">
              <div className="flex justify-between items-center">
                <div>
                  <h3 className="text-base font-bold text-white">AI-Prioritized Refactoring Roadmap</h3>
                  <p className="text-xs text-slate-400">Order based on risk factor, blast radius, and estimated remediation effort</p>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-slate-400 font-mono">Total Estimated Effort:</span>
                  <span className="px-2.5 py-1 rounded bg-rose-500/10 text-rose-400 border border-rose-500/20 font-mono text-xs font-bold">
                    142 Remediation Hours
                  </span>
                </div>
              </div>

              <div className="space-y-3">
                {[
                  {
                    pri: 'P0',
                    badge: 'CRITICAL SECURITY',
                    title: 'Mitigate Remote Code Execution in Log4j Core',
                    module: 'pom.xml / PaymentService.java',
                    impact: 'HIGH',
                    effort: '1h',
                    status: 'PENDING'
                  },
                  {
                    pri: 'P1',
                    badge: 'ARCHITECTURAL RISK',
                    title: 'Decouple PaymentService from direct OrderService schema callers',
                    module: 'PaymentService.java',
                    impact: 'HIGH',
                    effort: '24h',
                    status: 'IN PROGRESS'
                  },
                  {
                    pri: 'P1',
                    badge: 'MAINTAINABILITY',
                    title: 'Refactor OrderController fat endpoints into Command Handlers',
                    module: 'OrderController.java',
                    impact: 'MEDIUM',
                    effort: '16h',
                    status: 'SCHEDULED'
                  },
                  {
                    pri: 'P2',
                    badge: 'CODE HYGIENE',
                    title: 'Sanitize CriteriaBuilder queries against UserRepository injection',
                    module: 'UserRepository.java',
                    impact: 'HIGH',
                    effort: '9h',
                    status: 'SCHEDULED'
                  }
                ].map((item, idx) => (
                  <div
                    key={idx}
                    className="bg-[#0f172a]/60 border border-slate-800 rounded-xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:border-slate-700 transition"
                  >
                    <div className="flex items-start gap-3">
                      <span
                        className={`px-2.5 py-1 rounded font-mono text-xs font-extrabold ${
                          item.pri === 'P0'
                            ? 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
                            : 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                        }`}
                      >
                        {item.pri}
                      </span>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-[10px] font-mono text-slate-400 tracking-wide uppercase">{item.badge}</span>
                          <span className="text-slate-600">•</span>
                          <span className="text-xs font-mono text-cyan-400">{item.module}</span>
                        </div>
                        <h4 className="text-sm font-semibold text-white mt-0.5">{item.title}</h4>
                      </div>
                    </div>

                    <div className="flex items-center gap-6 self-end sm:self-center">
                      <div className="text-right">
                        <span className="block text-[10px] text-slate-500 font-mono uppercase">Blast Impact</span>
                        <span className="text-xs font-mono font-semibold text-slate-300">{item.impact}</span>
                      </div>
                      <div className="text-right">
                        <span className="block text-[10px] text-slate-500 font-mono uppercase">Est. Effort</span>
                        <span className="text-xs font-mono font-semibold text-cyan-400">{item.effort}</span>
                      </div>
                      <button className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded text-xs font-medium border border-slate-700">
                        Details
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB: MRI DIAGNOSTIC REPORT */}
          {activeTab === 'reports' && (
            <div className="max-w-4xl mx-auto bg-[#0f172a]/60 border border-slate-800 rounded-xl p-8 space-y-6">
              <div className="flex justify-between items-start border-b border-slate-800 pb-6">
                <div>
                  <div className="flex items-center gap-2 font-mono text-cyan-400 text-xs tracking-wider">
                    <Activity className="h-4 w-4" /> CODEMRI DIAGNOSTIC RECORD
                  </div>
                  <h1 className="text-2xl font-extrabold text-white mt-1">Repository Health Audit: ecommerce-platform</h1>
                  <p className="text-xs text-slate-400 mt-1">Audit Token: #MRI-2026-9982 • AST Engine v4.2</p>
                </div>
                <div className="text-right">
                  <div className="text-3xl font-black font-mono text-cyan-400">78 / 100</div>
                  <span className="text-[10px] font-mono text-emerald-400 uppercase">HEALTHY AUDIT</span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 text-xs font-mono">
                <div className="p-4 bg-slate-900/80 rounded-lg border border-slate-800">
                  <span className="text-slate-500 block">Total Monitored Source</span>
                  <span className="text-white text-base font-bold">184,291 Lines of Code</span>
                </div>
                <div className="p-4 bg-slate-900/80 rounded-lg border border-slate-800">
                  <span className="text-slate-500 block">Identified Technical Debt</span>
                  <span className="text-rose-400 text-base font-bold">142 Engineering Hours</span>
                </div>
              </div>

              <div className="text-xs text-slate-300 space-y-3 leading-relaxed border-t border-slate-800 pt-6">
                <h3 className="text-sm font-bold text-white uppercase font-mono">Executive Synthesis</h3>
                <p>
                  The repository shows strong perimeter security defense (Score: 91/100) and structured domain boundaries.
                  However, technical debt is concentrated heavily in the <code>PaymentService</code> and <code>OrderController</code>
                  corridor where cyclomatic complexity approaches 18 and afferent caller density prevents independent deployment cycles.
                </p>
                <p>
                  Remediation should target the P0 dependency patch followed by extraction of the transaction validation pipeline into
                  a decoupled service layer.
                </p>
              </div>

              <div className="flex justify-end gap-3 pt-6 border-t border-slate-800">
                <button
                  onClick={() => alert("Simulated: CodeMRI_Audit_Report.json exported.")}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-mono rounded-lg border border-slate-700"
                >
                  Export JSON
                </button>
                <button
                  onClick={() => window.print()}
                  className="px-4 py-2 bg-cyan-600 hover:bg-cyan-500 text-slate-950 text-xs font-bold rounded-lg flex items-center gap-2"
                >
                  <Download className="h-4 w-4" /> Download PDF Report
                </button>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}