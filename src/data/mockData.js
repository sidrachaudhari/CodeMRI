export const PIPELINE_STAGES = [
  { id: '01', name: 'Project Ingestion', desc: 'Parsing repository manifest & code files' },
  { id: '02', name: 'Code Preprocessing', desc: 'Tokenizing files and indexing build tools' },
  { id: '03', name: 'Static Analysis', desc: 'Measuring complexity and code hotspots' },
  { id: '04', name: 'System Structure', desc: 'Mapping component connections and call graphs' },
  { id: '05', name: 'Security Audit', desc: 'Checking known vulnerabilities and CVEs' },
  { id: '06', name: 'Technical Debt', desc: 'Estimating hours required for remediation' },
  { id: '07', name: 'Code Risk Diagnosis', desc: 'Analyzing root causes and failure points' },
  { id: '08', name: 'Health Scoring', desc: 'Calculating overall software risk score' },
  { id: '09', name: 'Summary & Export', desc: 'Exporting audit findings and fixes' }
];

export const REPO_SNAPSHOT = {
  name: 'ecommerce-platform',
  language: 'Java',
  buildTool: 'Maven 3.8.4 / Spring Boot 3.1',
  filesAnalyzed: '1,284',
  loc: '184K',
  modulesCount: 47,
  dependenciesCount: 136,
  issuesDetected: 63,
  techDebtHours: 142,
  isDemoData: true
};

export const HEALTH_SCORE = {
  overall: 78,
  // status: 'GOOD — IMPROVEMENTS RECOMMENDED',
  comparison: '+4 pts from previous scan (v2.4.1)',
  breakdown: [
    { category: 'Code Quality', score: 82, weight: '25%', status: 'good' },
    { category: 'Architecture', score: 74, weight: '25%', status: 'warning' },
    { category: 'Security', score: 91, weight: '20%', status: 'excellent' },
    { category: 'Dependencies', score: 68, weight: '15%', status: 'warning' },
    { category: 'Maintainability', score: 76, weight: '15%', status: 'good' },
  ]
};

export const MODULE_DATA = [
  {
    id: 'mod-1',
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
      'Fee calculation logic has 18 tangled decision branches (recommended: fewer than 10).',
      '7 other services call this file directly with no safety buffer or fallback.',
      'Uses outdated Log4j (v2.14.1) which enables remote server takeover.',
      'Database query glues user input directly into SQL text without parameter protection.'
    ],
    diagnosis: 'PaymentService is the highest-risk file in the project. It handles money and account verification, but contains a data theft vulnerability (SQL Injection), a server takeover vulnerability (Log4Shell), and brittle fee calculation logic that can fail under heavy checkout volume.',
    actions: [
      'Separate fee calculation into clean, independent calculation rules.',
      'Protect the Order service with an asynchronous queue so payment hiccups do not freeze the store.',
      'Upgrade the Log4j library to version 2.17.1 or higher immediately.',
      'Use secure prepared database statements to block data theft.'
    ]
  },
  {
    id: 'mod-2',
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
      'Mixes cart management, order submission, and database queries in one place.',
      'Directly calls 5 other services without an automatic safety timeout or fallback.'
    ],
    diagnosis: 'OrderController handles too many unrelated tasks at once. If PaymentService or Inventory slows down, OrderController locks up and the entire store checkout freezes.',
    actions: [
      'Add a safety circuit breaker so slow payment gateways do not freeze customer checkouts.',
      'Separate cart order processing from database search operations.'
    ]
  },
  {
    id: 'mod-3',
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
      'Search filters concatenate raw user text directly into database commands.',
      'Heavily called by both customer login and billing services.'
    ],
    diagnosis: 'Data theft vulnerability (SQL Injection). A malicious user can type database commands into user search fields to view passwords or user profiles.',
    actions: [
      'Use secure parameter binding (:filterParam) instead of gluing text into queries.'
    ]
  },
  {
    id: 'mod-4',
    name: 'AuthService.java',
    category: 'Security / Auth',
    riskScore: 32,
    complexity: 6,
    coupling: 0.22,
    dependents: 12,
    securityIssues: 0,
    loc: 540,
    techDebt: '4h',
    ragEvidence: [
      'Isolated token validation logic.',
      'Zero cyclic dependencies detected.'
    ],
    diagnosis: 'Well-encapsulated service with minimal coupling and high test coverage.',
    actions: [
      'Maintain current interface contract; update JWT expiration telemetry.'
    ]
  },
  {
    id: 'mod-5',
    name: 'ProductService.java',
    category: 'Catalog Core',
    riskScore: 28,
    complexity: 5,
    coupling: 0.18,
    dependents: 4,
    securityIssues: 0,
    loc: 480,
    techDebt: '3h',
    ragEvidence: [
      'Low branch complexity.',
      'Clean domain segregation.'
    ],
    diagnosis: 'Healthy architectural module meeting optimal maintainability baseline.',
    actions: [
      'No refactoring required at this cycle.'
    ]
  }
];

export const INITIAL_NODES = [
  {
    id: 'frontend',
    type: 'default',
    data: { label: 'Web Storefront (React)' },
    position: { x: 50, y: 150 },
    className: 'bg-white border-2 border-slate-900 text-slate-950 font-mono text-xs font-bold rounded-lg px-4 py-2.5 shadow-md'
  },
  {
    id: 'api-gateway',
    type: 'default',
    data: { label: 'API Gateway (Spring Cloud)' },
    position: { x: 280, y: 150 },
    className: 'bg-white border-2 border-slate-800 text-slate-900 font-mono text-xs font-bold rounded-lg px-4 py-2.5 shadow-md'
  },
  {
    id: 'auth-service',
    type: 'default',
    data: { label: 'AuthService (Risk: 32)' },
    position: { x: 520, y: 50 },
    className: 'bg-slate-50 border-2 border-slate-700 text-slate-900 font-mono text-xs font-semibold rounded-lg px-4 py-2.5 shadow-sm'
  },
  {
    id: 'order-service',
    type: 'default',
    data: { label: 'OrderController (Risk: 81)' },
    position: { x: 520, y: 150 },
    className: 'bg-slate-100 border-2 border-slate-900 text-slate-950 font-mono text-xs font-bold rounded-lg px-4 py-2.5 shadow-md'
  },
  {
    id: 'payment-service',
    type: 'default',
    data: { label: 'PaymentService [HOTSPOT] (Risk: 87)' },
    position: { x: 520, y: 250 },
    className: 'bg-slate-950 border-2 border-slate-950 text-white font-mono text-xs font-bold rounded-lg px-4 py-2.5 shadow-xl ring-2 ring-slate-500'
  },
  {
    id: 'product-service',
    type: 'default',
    data: { label: 'ProductService (Risk: 28)' },
    position: { x: 520, y: 350 },
    className: 'bg-slate-50 border-2 border-slate-700 text-slate-900 font-mono text-xs font-semibold rounded-lg px-4 py-2.5 shadow-sm'
  },
  {
    id: 'database',
    type: 'default',
    data: { label: 'PostgreSQL & Redis DB' },
    position: { x: 800, y: 200 },
    className: 'bg-white border-2 border-slate-900 text-slate-950 font-mono text-xs font-bold rounded-lg px-4 py-2.5 shadow-md'
  }
];

export const INITIAL_EDGES = [
  { id: 'e1', source: 'frontend', target: 'api-gateway', animated: true, style: { stroke: '#0f172a', strokeWidth: 2 } },
  { id: 'e2', source: 'api-gateway', target: 'auth-service', style: { stroke: '#334155', strokeWidth: 1.5 } },
  { id: 'e3', source: 'api-gateway', target: 'order-service', style: { stroke: '#0f172a', strokeWidth: 2 } },
  { id: 'e4', source: 'api-gateway', target: 'product-service', style: { stroke: '#334155', strokeWidth: 1.5 } },
  { id: 'e5', source: 'order-service', target: 'payment-service', animated: true, style: { stroke: '#000000', strokeWidth: 2.5 } },
  { id: 'e6', source: 'payment-service', target: 'database', style: { stroke: '#0f172a', strokeWidth: 2 } },
  { id: 'e7', source: 'order-service', target: 'database', style: { stroke: '#334155', strokeWidth: 1.5 } },
  { id: 'e8', source: 'product-service', target: 'database', style: { stroke: '#334155', strokeWidth: 1.5 } }
];

export const DEPENDENCY_LIST = [
  { name: 'org.apache.logging.log4j:log4j-core', version: '2.14.1', status: 'CRITICAL', cve: 'CVE-2021-44228', usage: 'PaymentService, OrderController', type: 'External' },
  { name: 'com.fasterxml.jackson.core:jackson-databind', version: '2.9.10', status: 'MEDIUM', cve: 'CVE-2020-25649', usage: 'Global Serialization', type: 'External' },
  { name: 'org.springframework.boot:spring-boot-starter-web', version: '3.1.2', status: 'OUTDATED', cve: 'None', usage: 'All Core Services', type: 'External' },
  { name: 'io.jsonwebtoken:jjwt-api', version: '0.11.5', status: 'HEALTHY', cve: 'None', usage: 'AuthService', type: 'External' },
  { name: 'org.postgresql:postgresql', version: '42.6.0', status: 'HEALTHY', cve: 'None', usage: 'UserRepository, Persistence', type: 'External' }
];

export const SECURITY_METRICS = {
  score: 91,
  total: 35,
  critical: 1,
  high: 4,
  medium: 12,
  low: 18,
  findings: [
    {
      id: 'SEC-01',
      module: 'PaymentService.java',
      severity: 'CRITICAL',
      title: 'Remote Code Execution (Log4j JNDI Lookup)',
      cve: 'CVE-2021-44228',
      reason: 'Outdated Log4j library enables remote hackers to run malicious code and take over the server.',
      action: 'Upgrade log4j-core to 2.17.1 or higher immediately.'
    },
    {
      id: 'SEC-02',
      module: 'UserRepository.java',
      severity: 'HIGH',
      title: 'Potential SQL Injection via Native Query String Concat',
      cve: 'CWE-89',
      reason: 'User input is glued directly into database queries, allowing attackers to extract passwords and user records.',
      action: 'Replace raw concatenation with JPA parameter binding (:filterParam).'
    },
    {
      id: 'SEC-03',
      module: 'OrderController.java',
      severity: 'HIGH',
      title: 'Missing Circuit Breaker & Rate Limiter',
      cve: 'CWE-400',
      reason: 'Store orders call payment processing directly without a timeout safety net, risking full checkout freezes.',
      action: 'Implement Resilience4j circuit breaker and retry policies.'
    }
  ]
};

export const REFACTORING_ROADMAP = [
  {
    priority: 'P0',
    title: 'Patch Critical Log4j JNDI Vulnerability',
    category: 'Security',
    module: 'PaymentService.java',
    effort: 'LOW (2h)',
    impact: 'CRITICAL',
    status: 'Ready to Execute'
  },
  {
    priority: 'P1',
    title: 'Decouple PaymentService from OrderService',
    category: 'Architecture',
    module: 'PaymentService.java & OrderController.java',
    effort: 'MEDIUM (12h)',
    impact: 'HIGH',
    status: 'In Planning'
  },
  {
    priority: 'P1',
    title: 'Parameterize SQL Queries in UserRepository',
    category: 'Security / Quality',
    module: 'UserRepository.java',
    effort: 'LOW (4h)',
    impact: 'HIGH',
    status: 'In Planning'
  },
  {
    priority: 'P2',
    title: 'Extract Payment Validation into Domain Component',
    category: 'Code Quality',
    module: 'PaymentService.java',
    effort: 'MEDIUM (8h)',
    impact: 'MEDIUM',
    status: 'Backlog'
  },
  {
    priority: 'P3',
    title: 'Upgrade Spring Boot to 3.2+ baseline',
    category: 'Dependencies',
    module: 'pom.xml',
    effort: 'HIGH (16h)',
    impact: 'MEDIUM',
    status: 'Backlog'
  }
];

export const TECH_DEBT_DISTRIBUTION = [
  { name: 'Architecture Coupling', hours: 51, fill: '#51E2F5' },
  { name: 'Code Smells & Complexity', hours: 42, fill: '#FFA8B6' },
  { name: 'Duplicated Logic', hours: 19, fill: '#A28089' },
  { name: 'Security Remediations', hours: 17, fill: '#9DF9EF' },
  { name: 'Other Refactorings', hours: 13, fill: '#C4A8B0' }
];
