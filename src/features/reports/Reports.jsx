import React from 'react';
import { FileCode2, FileText, Printer, FileDown } from 'lucide-react';
import { Card } from '../../components/ui/card';
import { Badge } from '../../components/ui/badge';
import { Button } from '../../components/ui/button';

export default function Reports({
  repoSnapshot,
  healthScore,
  findings = [],
  hotspots = [],
  isDarkMode = true
}) {
  // 1. Generate real printable PDF via clean print window
  const handlePrintPDF = () => {
    const printWindow = window.open('', '_blank', 'width=900,height=800');
    if (!printWindow) {
      alert('Popup blocker prevented opening the print report. Please allow popups.');
      return;
    }

    const htmlContent = `
      <!DOCTYPE html>
      <html>
        <head>
          <title>CodeMRI Diagnostic Report - ${repoSnapshot.name}</title>
          <style>
            body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, monospace; padding: 40px; color: #000; line-height: 1.5; background: #fff; }
            .header { border-bottom: 2px solid #000; padding-bottom: 16px; margin-bottom: 24px; display: flex; justify-content: space-between; align-items: flex-end; }
            .title { font-size: 24px; font-weight: 800; text-transform: uppercase; margin: 0; color: #000; }
            .subtitle { font-size: 12px; color: #666; }
            .badge { display: inline-block; padding: 4px 10px; border: 1px solid #51E2F5; background: #51E2F5; color: #1B1618; font-size: 12px; font-weight: bold; border-radius: 4px; }
            .section { margin-top: 24px; }
            .section-title { font-size: 13px; font-weight: bold; text-transform: uppercase; letter-spacing: 0.05em; border-bottom: 1px solid #000; padding-bottom: 6px; margin-bottom: 12px; color: #000; }
            .score-box { border: 1.5px solid #000; background: #fafafa; padding: 16px; display: flex; align-items: center; justify-content: space-between; border-radius: 8px; }
            .score-val { font-size: 40px; font-weight: 900; color: #000; }
            table { width: 100%; border-collapse: collapse; margin-top: 8px; font-size: 12px; }
            th, td { text-align: left; padding: 8px 12px; border-bottom: 1px solid #ddd; }
            th { border-bottom: 2px solid #000; font-weight: bold; text-transform: uppercase; color: #000; }
            .finding-card { border: 1px solid #ddd; background: #fff; padding: 12px; margin-bottom: 10px; border-radius: 6px; }
            @media print {
              body { padding: 0; }
            }
          </style>
        </head>
        <body>
          <div class="header">
            <div>
              <h1 class="title">CodeMRI Diagnostic Health Report</h1>
              <div class="subtitle">TARGET: ${repoSnapshot.name} (${repoSnapshot.language}) • ${new Date().toLocaleDateString()}</div>
            </div>
            <div>
              <span class="badge">${healthScore.status}</span>
            </div>
          </div>

          <div class="score-box">
            <div>
              <div style="font-size: 12px; font-weight: bold; text-transform: uppercase; color: #666;">Software Health Score</div>
              <div class="score-val">${healthScore.overall} <span style="font-size: 18px; font-weight: normal; color: #666;">/ 100</span></div>
            </div>
            <div style="font-size: 12px; color: #000;">
              <div>• Files Analyzed: <strong>${repoSnapshot.filesAnalyzed}</strong></div>
              <div>• Lines of Code: <strong>${repoSnapshot.loc}</strong></div>
              <div>• Remediation Effort: <strong>${repoSnapshot.techDebtHours}h</strong></div>
            </div>
          </div>

          <div class="section">
            <div class="section-title">Score Breakdown</div>
            <table>
              <thead>
                <tr>
                  <th>Category</th>
                  <th>Score</th>
                  <th>Weight</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                ${healthScore.breakdown.map(b => `
                  <tr>
                    <td><strong>${b.category}</strong></td>
                    <td>${b.score} / 100</td>
                    <td>${b.weight}</td>
                    <td>${b.status.toUpperCase()}</td>
                  </tr>
                `).join('')}
              </tbody>
            </table>
          </div>

          <div class="section">
            <div class="section-title">Vulnerabilities & Hotspots Audited</div>
            ${findings.length === 0 ? '<p style="font-size: 12px;">No critical vulnerabilities detected.</p>' : ''}
            ${findings.map(f => `
              <div class="finding-card">
                <div style="display: flex; justify-content: space-between; font-weight: bold; font-size: 13px;">
                  <span style="color: #000;">[${f.severity}] ${f.title}</span>
                  <span style="color: #666;">${f.cve || ''}</span>
                </div>
                <div style="font-size: 11px; margin: 4px 0; color: #666;">Module: <strong style="color: #000;">${f.module}</strong></div>
                <div style="font-size: 12px; color: #333;">Root Cause: ${f.reason}</div>
                <div style="font-size: 12px; font-weight: bold; margin-top: 4px; color: #51E2F5;">Remediation: ${f.action}</div>
              </div>
            `).join('')}
          </div>

          <div style="margin-top: 40px; font-size: 11px; text-align: center; border-top: 1px solid #ddd; padding-top: 16px; color: #666;">
            Generated by CodeMRI Diagnostic Engine. Grounded in AST and deterministic static analysis.
          </div>
        </body>
      </html>
    `;

    printWindow.document.write(htmlContent);
    printWindow.document.close();
    printWindow.focus();
    setTimeout(() => {
      printWindow.print();
    }, 400);
  };

  // 2. Export Structured JSON
  const handleExportJSON = () => {
    const reportData = {
      scanId: `mri-${Date.now()}`,
      timestamp: new Date().toISOString(),
      repository: repoSnapshot,
      healthScore: healthScore,
      findings: findings,
      hotspots: hotspots
    };

    const blob = new Blob([JSON.stringify(reportData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `codemri-report-${repoSnapshot.name}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  // 3. Export Markdown Report
  const handleExportMarkdown = () => {
    const mdContent = `# CodeMRI Diagnostic Health Report: ${repoSnapshot.name}
Generated: ${new Date().toISOString()}

## Executive Summary
- **Overall Health Score**: ${healthScore.overall} / 100 (${healthScore.status})
- **Files Analyzed**: ${repoSnapshot.filesAnalyzed}
- **Lines of Code**: ${repoSnapshot.loc}
- **Estimated Remediation Effort**: ${repoSnapshot.techDebtHours} hours

## Health Score Breakdown
${healthScore.breakdown.map(b => `- **${b.category}**: ${b.score}/100 (Weight: ${b.weight})`).join('\n')}

## Findings & Detected Vulnerabilities
${findings.length === 0 ? 'No critical vulnerabilities detected.' : ''}
${findings.map(f => `### [${f.severity}] ${f.title} (${f.cve || 'Hotspot'})
- **Affected Module**: \`${f.module}\`
- **Root Cause**: ${f.reason}
- **Remediation Action**: ${f.action}
`).join('\n')}
`;

    const blob = new Blob([mdContent], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `codemri-report-${repoSnapshot.name}.md`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6 pb-12 max-w-4xl font-sans">
      <Card className="p-6 border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-950">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-3 border rounded-xl shrink-0 bg-neutral-50 border-neutral-200 text-neutral-900 dark:bg-black dark:border-neutral-800 dark:text-white">
              <FileText className="h-6 w-6 text-[#51E2F5]" />
            </div>
            <div>
              <h2 className="text-base font-bold text-neutral-900 dark:text-white">Diagnostic Health Report</h2>
              <span className="text-xs block text-neutral-500">
                Target: {repoSnapshot.name} ({repoSnapshot.language}) • Status: {healthScore.status}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <Button
              variant="default"
              onClick={handlePrintPDF}
            >
              <Printer className="h-4 w-4 mr-1.5" />
              Print / Save PDF
            </Button>
            <Button
              variant="outline"
              onClick={handleExportJSON}
            >
              <FileCode2 className="h-4 w-4 mr-1.5" />
              Export JSON
            </Button>
            <Button
              variant="outline"
              onClick={handleExportMarkdown}
            >
              <FileDown className="h-4 w-4 mr-1.5" />
              Markdown
            </Button>
          </div>
        </div>

        {/* Report Preview */}
        <div className="mt-6 pt-6 border-t border-neutral-200 dark:border-neutral-800 space-y-4 text-xs">
          <div className="p-4 border rounded-xl space-y-3 bg-neutral-50 dark:bg-black border-neutral-200 dark:border-neutral-800">
            <div className="flex justify-between items-center pb-2 border-b border-neutral-200 dark:border-neutral-800 font-bold text-neutral-900 dark:text-white">
              <span>EXECUTIVE SUMMARY</span>
              <span>SCORE: {healthScore.overall} / 100</span>
            </div>
            <p className="font-sans leading-relaxed text-neutral-600 dark:text-neutral-400">
              Diagnostic scan for repository <strong className="text-neutral-900 dark:text-white">{repoSnapshot.name}</strong> completed.
              Multi-pillar analysis correlates security findings and architecture coupling directly to the overall
              score of <strong className="text-[#51E2F5]">{healthScore.overall}/100</strong>.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-4 border rounded-xl space-y-2 bg-white dark:bg-neutral-900 border-neutral-200 dark:border-neutral-800">
              <span className="font-bold block mb-1 text-neutral-900 dark:text-white">METRICS AUDITED</span>
              <div className="flex justify-between text-neutral-500">
                <span>Lines of Code:</span>
                <span className="font-bold text-neutral-900 dark:text-white">{repoSnapshot.loc}</span>
              </div>
              <div className="flex justify-between text-neutral-500">
                <span>Files Analyzed:</span>
                <span className="font-bold text-neutral-900 dark:text-white">{repoSnapshot.filesAnalyzed}</span>
              </div>
              <div className="flex justify-between text-neutral-500">
                <span>Dependencies Mapped:</span>
                <span className="font-bold text-neutral-900 dark:text-white">{repoSnapshot.dependenciesCount}</span>
              </div>
              <div className="flex justify-between text-neutral-500">
                <span>Remediation Effort:</span>
                <span className="font-bold text-neutral-900 dark:text-white">{repoSnapshot.techDebtHours} hours</span>
              </div>
            </div>

            <div className="p-4 border rounded-xl space-y-2 bg-white dark:bg-neutral-900 border-neutral-200 dark:border-neutral-800">
              <span className="font-bold block mb-1 text-neutral-900 dark:text-white">SCORE BREAKDOWN</span>
              {healthScore.breakdown.map((b) => (
                <div key={b.category} className="flex justify-between text-neutral-500">
                  <span>{b.category}:</span>
                  <span className="font-bold text-neutral-900 dark:text-white">{b.score} / 100</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
}
