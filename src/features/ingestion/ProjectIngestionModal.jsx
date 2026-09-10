import React, { useState } from 'react';
import { TESTBED_PROJECTS } from '../../data/scanner';
import { X, Upload, CheckCircle2, Play, FolderGit2 } from 'lucide-react';
import { Card } from '../../components/ui/card';
import { Badge } from '../../components/ui/badge';
import { Button } from '../../components/ui/button';

export default function ProjectIngestionModal({ isOpen, onClose, onIngestProject, isDarkMode = true }) {
  const [activeTab, setActiveTab] = useState('presets');
  const [selectedPreset, setSelectedPreset] = useState(TESTBED_PROJECTS[0]);
  const [projectName, setProjectName] = useState('custom-java-app');
  const [pastedPom, setPastedPom] = useState(TESTBED_PROJECTS[0].pomContent);
  const [pastedJava, setPastedJava] = useState(TESTBED_PROJECTS[0].javaCode);
  const [uploadedFiles, setUploadedFiles] = useState([]);

  if (!isOpen) return null;

  const handleFileUpload = (e) => {
    const files = Array.from(e.target.files);
    const readFiles = [];
    let count = 0;

    files.forEach((file) => {
      const reader = new FileReader();
      reader.onload = (event) => {
        readFiles.push({ name: file.name, content: event.target.result });
        count++;
        if (count === files.length) {
          setUploadedFiles(readFiles);
        }
      };
      reader.readAsText(file);
    });
  };

  const handleStartScan = () => {
    if (activeTab === 'presets') {
      onIngestProject({
        projectName: selectedPreset.name,
        pomContent: selectedPreset.pomContent,
        javaCode: selectedPreset.javaCode,
        files: []
      });
    } else if (activeTab === 'paste') {
      onIngestProject({
        projectName: projectName,
        pomContent: pastedPom,
        javaCode: pastedJava,
        files: []
      });
    } else {
      onIngestProject({
        projectName: 'uploaded-java-project',
        pomContent: uploadedFiles.find(f => f.name.includes('pom.xml'))?.content || '',
        javaCode: uploadedFiles.find(f => f.name.endsWith('.java'))?.content || '',
        files: uploadedFiles
      });
    }
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-2 sm:p-4">
      <Card className="w-full max-w-2xl overflow-hidden shadow-2xl flex flex-col max-h-[92vh] border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-950 rounded-2xl">
        {/* Header */}
        <div className="p-4 sm:p-5 border-b flex items-center justify-between border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-black">
          <div className="flex items-center gap-2.5 sm:gap-3">
            <div className="h-8 w-8 sm:h-9 sm:w-9 rounded-xl border flex items-center justify-center bg-white border-neutral-200 text-neutral-900 dark:bg-neutral-900 dark:border-neutral-800 dark:text-white shrink-0">
              <FolderGit2 className="h-4 w-4 text-[#51E2F5]" />
            </div>
            <div>
              <h2 className="text-xs sm:text-sm font-bold text-neutral-900 dark:text-white">Select or Upload Repository</h2>
              <p className="text-[11px] sm:text-xs text-neutral-500">Choose a sample benchmark or provide your own Java files to audit</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-neutral-100 text-neutral-500 hover:text-neutral-900 dark:hover:bg-neutral-900 dark:hover:text-white transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Tab Selection */}
        <div className="flex border-b px-3 sm:px-5 pt-2 sm:pt-3 gap-3 sm:gap-6 text-xs border-neutral-200 dark:border-neutral-800 overflow-x-auto">
          {[
            { id: 'presets', label: 'Sample Testbeds' },
            { id: 'paste', label: 'Paste Code / Manifest' },
            { id: 'upload', label: 'Upload Files' }
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`pb-2.5 sm:pb-3 font-semibold transition-colors border-b-2 whitespace-nowrap text-xs ${
                activeTab === tab.id
                  ? 'border-[#51E2F5] text-neutral-900 dark:text-white font-bold'
                  : 'border-transparent text-neutral-500 hover:text-neutral-900 dark:hover:text-white'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Body Content */}
        <div className="p-5 overflow-y-auto space-y-4 flex-1 text-xs">
          {activeTab === 'presets' && (
            <div className="space-y-3">
              <span className="text-xs block text-neutral-500">
                Select a benchmark project equipped with realistic known vulnerabilities:
              </span>
              {TESTBED_PROJECTS.map((project) => {
                const isSelected = selectedPreset.id === project.id;
                return (
                  <div
                    key={project.id}
                    onClick={() => setSelectedPreset(project)}
                    className={`p-4 rounded-xl border cursor-pointer transition-all ${
                      isSelected
                        ? 'border-[#51E2F5] bg-[#51E2F5]/10 text-neutral-900 dark:text-white ring-1 ring-[#51E2F5]'
                        : 'bg-neutral-50 border-neutral-200 text-neutral-800 dark:bg-neutral-900/60 dark:border-neutral-800 dark:text-neutral-200 hover:border-neutral-400 dark:hover:border-neutral-700'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="font-bold flex items-center gap-2">
                        {project.name}
                        {isSelected && <CheckCircle2 className="h-4 w-4 text-[#51E2F5]" />}
                      </span>
                      <Badge variant="mauve">
                        Known CVEs Included
                      </Badge>
                    </div>
                    <p className="text-xs leading-relaxed text-neutral-500">{project.description}</p>
                  </div>
                );
              })}
            </div>
          )}

          {activeTab === 'paste' && (
            <div className="space-y-3">
              <div>
                <label className="text-xs font-semibold block mb-1 text-neutral-500">Repository / Project Name</label>
                <input
                  type="text"
                  value={projectName}
                  onChange={(e) => setProjectName(e.target.value)}
                  className="w-full border rounded-xl px-3 py-2 text-xs font-mono focus:outline-none bg-white border-neutral-200 text-neutral-900 dark:bg-black dark:border-neutral-800 dark:text-white focus:border-[#51E2F5]"
                />
              </div>
              <div>
                <label className="text-xs font-semibold block mb-1 text-neutral-500">pom.xml Manifest</label>
                <textarea
                  rows={4}
                  value={pastedPom}
                  onChange={(e) => setPastedPom(e.target.value)}
                  className="w-full border rounded-xl p-3 text-xs font-mono focus:outline-none bg-white border-neutral-200 text-neutral-900 dark:bg-black dark:border-neutral-800 dark:text-white focus:border-[#51E2F5]"
                  placeholder="Paste pom.xml dependencies..."
                />
              </div>
              <div>
                <label className="text-xs font-semibold block mb-1 text-neutral-500">Java Class Source Code</label>
                <textarea
                  rows={6}
                  value={pastedJava}
                  onChange={(e) => setPastedJava(e.target.value)}
                  className="w-full border rounded-xl p-3 text-xs font-mono focus:outline-none bg-white border-neutral-200 text-neutral-900 dark:bg-black dark:border-neutral-800 dark:text-white focus:border-[#51E2F5]"
                  placeholder="Paste Java code..."
                />
              </div>
            </div>
          )}

          {activeTab === 'upload' && (
            <div className="space-y-4">
              <label className="border-2 border-dashed rounded-xl p-8 flex flex-col items-center justify-center cursor-pointer transition-all border-neutral-200 bg-neutral-50 hover:border-[#51E2F5] dark:border-neutral-800 dark:bg-black dark:hover:border-[#51E2F5]">
                <Upload className="h-8 w-8 mb-2 text-[#51E2F5]" />
                <span className="font-bold text-neutral-900 dark:text-white">Select Java files or pom.xml to audit</span>
                <span className="text-xs mt-1 text-neutral-500">Drag and drop or browse files from demo-files/ folder</span>
                <input
                  type="file"
                  multiple
                  accept=".java,.xml"
                  onChange={handleFileUpload}
                  className="hidden"
                />
              </label>

              {uploadedFiles.length > 0 && (
                <div className="p-3 border rounded-xl space-y-1 bg-neutral-50 border-neutral-200 dark:bg-neutral-900 dark:border-neutral-800">
                  <span className="text-xs font-bold block mb-1 text-[#51E2F5]">
                    ✓ {uploadedFiles.length} file(s) staged for audit:
                  </span>
                  {uploadedFiles.map((f, i) => (
                    <div key={i} className="text-xs font-mono truncate text-neutral-500">
                      • {f.name}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Pre-check details */}
          <div className="p-3.5 rounded-xl border space-y-1 text-xs bg-white dark:bg-neutral-900 border-neutral-200 dark:border-neutral-800">
            <div className="font-semibold text-neutral-900 dark:text-white">Audit Pre-Check:</div>
            <div className="grid grid-cols-3 gap-2 pt-1 text-neutral-500">
              <div>Language: <strong className="text-neutral-900 dark:text-white">Java</strong></div>
              <div>Build Tool: <strong className="text-neutral-900 dark:text-white">Maven</strong></div>
              <div>Static Checks: <strong className="text-neutral-900 dark:text-white">AST + OWASP</strong></div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t flex items-center justify-between border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-black">
          <Button
            variant="ghost"
            onClick={onClose}
          >
            Cancel
          </Button>
          <Button
            variant="default"
            onClick={handleStartScan}
          >
            <Play className="h-3.5 w-3.5 fill-current mr-1.5" /> Run Repository Audit
          </Button>
        </div>
      </Card>
    </div>
  );
}
