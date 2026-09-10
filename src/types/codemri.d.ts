export interface CodeMRIScanResult {
  scanId: string;
  timestamp: string;
  repository: {
    name: string;
    url?: string;
    primaryLanguage: "Java" | "TypeScript" | "Python";
    loc: number;
    filesCount: number;
    modulesCount: number;
    buildTool: "Maven" | "Gradle";
  };
  healthScore: {
    overall: number; // 0-100
    status: "EXCELLENT" | "GOOD" | "CRITICAL_ATTENTION_REQUIRED";
    breakdown: {
      codeQuality: number;
      architecture: number;
      security: number;
      dependencies: number;
      maintainability: number;
    };
  };
  hotspots: Array<{
    name: string;
    category: string;
    riskScore: number;
    complexity: number;
    coupling: number;
    dependents: number;
    loc: number;
    techDebtHours: number;
    ragEvidence: string[];
    aiDiagnosis: string;
    remediationActions: string[];
  }>;
  roadmap: Array<{
    priority: "P0" | "P1" | "P2";
    category: "SECURITY" | "ARCHITECTURE" | "CODE_QUALITY";
    title: string;
    targetModule: string;
    impact: "HIGH" | "MEDIUM" | "LOW";
    effortHours: number;
  }>;
}