import React, { useState } from "react";
import {
  Upload,
  FileText,
  Sparkles,
  CheckCircle2,
  AlertTriangle,
  Info,
  ChevronDown,
  ChevronUp,
  Download,
  Copy,
  Edit3,
  Check,
  Briefcase,
  Layers,
  ArrowRight,
  Printer,
  FileDown,
} from "lucide-react";
import { ParsedResumeResult, RecommendedRoleItem, MasterResumeData } from "../types/jobpilot.ts";
import {
  downloadResumeAsTxt,
  downloadResumeAsDoc,
  printResumeAsPDF,
} from "../utils/documentExport.ts";

interface ResumeScreenProps {
  resume: ParsedResumeResult | null;
  topRoles: RecommendedRoleItem[];
  masterResume: MasterResumeData | null;
  isAnalyzing: boolean;
  onAnalyzeResume: (text: string, fileName?: string) => Promise<void>;
  onUploadResumeFile?: (fileBase64: string, fileName: string, mimeType?: string, text?: string) => Promise<void>;
  onClearResume?: () => Promise<void>;
  onNavigateToJobsWithRole?: (roleTitle: string) => void;
  onOpenQuickTailor?: () => void;
}

export const ResumeScreen: React.FC<ResumeScreenProps> = ({
  resume,
  topRoles,
  masterResume,
  isAnalyzing,
  onAnalyzeResume,
  onUploadResumeFile,
  onClearResume,
  onNavigateToJobsWithRole,
  onOpenQuickTailor,
}) => {
  const [activeTab, setActiveTab] = useState<"analysis" | "roles" | "master">("analysis");
  const [customText, setCustomText] = useState("");
  const [showUploader, setShowUploader] = useState(!resume);
  const [expandedRoleIndex, setExpandedRoleIndex] = useState<number | null>(0);
  const [copiedNotification, setCopiedNotification] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const [uploadMode, setUploadMode] = useState<"file" | "paste">("file");
  const [showExportMenu, setShowExportMenu] = useState(false);

  const processFile = async (file: File) => {
    const isBinary = file.name.endsWith(".pdf") || file.name.endsWith(".docx") || file.name.endsWith(".doc");

    if (isBinary && onUploadResumeFile) {
      const reader = new FileReader();
      reader.onload = async (event) => {
        const arrayBuffer = event.target?.result as ArrayBuffer;
        if (arrayBuffer) {
          const bytes = new Uint8Array(arrayBuffer);
          let binary = "";
          const len = bytes.byteLength;
          for (let i = 0; i < len; i++) {
            binary += String.fromCharCode(bytes[i]);
          }
          const base64 = btoa(binary);
          await onUploadResumeFile(base64, file.name, file.type);
          setShowUploader(false);
        }
      };
      reader.readAsArrayBuffer(file);
    } else {
      const reader = new FileReader();
      reader.onload = async (event) => {
        const content = event.target?.result as string;
        if (content) {
          setCustomText(content);
          if (onUploadResumeFile) {
            await onUploadResumeFile("", file.name, file.type || "text/plain", content);
          } else {
            await onAnalyzeResume(content, file.name);
          }
          setShowUploader(false);
        }
      };
      reader.readAsText(file);
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    processFile(file);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files?.[0];
    if (file) {
      processFile(file);
    }
  };

  const handleAnalyzePastedText = async () => {
    if (!customText.trim()) return;
    if (onUploadResumeFile) {
      await onUploadResumeFile("", "My_Resume.txt", "text/plain", customText);
    } else {
      await onAnalyzeResume(customText, "My_Resume.txt");
    }
    setShowUploader(false);
  };

  const copyMasterResumeText = () => {
    if (!masterResume) return;
    const textRepresentation = `
${masterResume.contactInfo.name}
${masterResume.contactInfo.email} | ${masterResume.contactInfo.phone} | ${masterResume.contactInfo.location}
${masterResume.contactInfo.linkedin} | ${masterResume.contactInfo.github}

PROFESSIONAL SUMMARY
${masterResume.professionalSummary}

TECHNICAL SKILLS
Languages: ${masterResume.technicalSkills.languages.join(", ")}
Frameworks: ${masterResume.technicalSkills.frameworks.join(", ")}
Cloud & DevOps: ${masterResume.technicalSkills.cloudDevOps.join(", ")}
Databases: ${masterResume.technicalSkills.databases.join(", ")}

PROFESSIONAL EXPERIENCE
${masterResume.experience
  .map(
    (exp) => `
${exp.title} - ${exp.company} (${exp.period})
${exp.bullets.map((b) => `• ${b}`).join("\n")}
`
  )
  .join("\n")}

EDUCATION
${masterResume.education.map((edu) => `${edu.degree} - ${edu.school} (${edu.year})`).join("\n")}
`;
    navigator.clipboard.writeText(textRepresentation.trim());
    setCopiedNotification(true);
    setTimeout(() => setCopiedNotification(false), 2000);
  };

  return (
    <div className="flex-1 overflow-y-auto px-4 py-3 space-y-4 scrollbar-thin scrollbar-thumb-slate-800">
      {/* Top Header / Switcher */}
      <div className="flex items-center justify-between pb-1 border-b border-slate-800/80">
        <div>
          <h1 className="text-lg font-bold text-slate-100 flex items-center gap-2">
            <FileText className="w-5 h-5 text-indigo-400" />
            Resume & Career Analysis
          </h1>
          <p className="text-[11px] text-slate-400">
            ATS extraction, Top 20 realistic role match, & Master Resume
          </p>
        </div>

        <button
          onClick={() => setShowUploader(!showUploader)}
          className="text-xs px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-indigo-300 border border-slate-700 font-medium transition-all"
        >
          {showUploader ? "Close Uploader" : (resume ? "Re-upload / Switch CV" : "Upload CV")}
        </button>
      </div>

      {/* Active Persistent CV Status Banner */}
      {resume && !isAnalyzing && (
        <div className="bg-slate-900/95 border border-indigo-500/30 p-3 rounded-2xl flex items-center justify-between gap-3 shadow-md">
          <div className="flex items-center gap-2.5">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse shrink-0" />
            <div>
              <div className="text-xs font-bold text-slate-100 flex items-center gap-2">
                <span>Active CV: <strong className="text-indigo-300">{resume.personalInfo.fullName}</strong></span>
                <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-emerald-500/10 text-emerald-300 border border-emerald-500/20 font-medium">
                  Persisted
                </span>
              </div>
              <div className="text-[11px] text-slate-400 mt-0.5">
                Persists until you re-upload. Job tailoring for all roles is generated strictly based on this CV only.
              </div>
            </div>
          </div>
          <div className="flex items-center gap-1.5 shrink-0">
            <button
              onClick={() => setShowUploader(true)}
              className="text-xs px-2.5 py-1 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-medium transition-colors"
            >
              Re-upload New CV
            </button>
            {onClearResume && (
              <button
                onClick={async () => {
                  if (confirm("Are you sure you want to remove your uploaded CV?")) {
                    await onClearResume();
                    setShowUploader(true);
                  }
                }}
                className="text-xs px-2 py-1 rounded-lg bg-slate-800 hover:bg-red-950/60 text-slate-400 hover:text-red-400 border border-slate-700 hover:border-red-800 transition-colors"
                title="Remove uploaded CV"
              >
                Clear
              </button>
            )}
          </div>
        </div>
      )}

      {/* Uploader Dropzone & Quick Samples */}
      {showUploader && (
        <div className="bg-slate-900 border border-indigo-500/30 p-4 rounded-2xl space-y-3.5 shadow-lg">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5">
              <span className="text-xs font-bold text-slate-100">Add Your Real CV / Resume</span>
              <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-medium">
                Gemini 3.8 Flash Powered
              </span>
            </div>
            <span className="text-[10px] text-indigo-400 font-medium">Strict zero-fabrication</span>
          </div>

          {/* Mode Switcher: File Upload vs Direct Text Paste */}
          <div className="flex rounded-lg bg-slate-950 p-1 border border-slate-800 text-xs">
            <button
              onClick={() => setUploadMode("file")}
              className={`flex-1 py-1 rounded font-medium transition-all ${
                uploadMode === "file"
                  ? "bg-indigo-600 text-white shadow-sm"
                  : "text-slate-400 hover:text-slate-200"
              }`}
            >
              Upload PDF or DOCX
            </button>
            <button
              onClick={() => setUploadMode("paste")}
              className={`flex-1 py-1 rounded font-medium transition-all ${
                uploadMode === "paste"
                  ? "bg-indigo-600 text-white shadow-sm"
                  : "text-slate-400 hover:text-slate-200"
              }`}
            >
              Paste Resume Text
            </button>
          </div>

          {uploadMode === "file" ? (
            /* Drag & Drop Box */
            <div
              onDragOver={(e) => {
                e.preventDefault();
                setDragOver(true);
              }}
              onDragLeave={() => setDragOver(false)}
              onDrop={handleDrop}
              className={`border-2 border-dashed rounded-xl p-5 text-center cursor-pointer transition-all ${
                dragOver
                  ? "border-indigo-500 bg-indigo-950/30"
                  : "border-slate-700 bg-slate-950/50 hover:border-slate-600"
              }`}
            >
              <label className="cursor-pointer flex flex-col items-center space-y-2">
                <Upload className="w-6 h-6 text-indigo-400 animate-bounce" />
                <div className="text-xs font-semibold text-slate-200">
                  Select or drop your PDF or Word resume
                </div>
                <div className="text-[11px] text-slate-400">
                  Accepts <span className="text-indigo-300 font-mono">.pdf, .docx, .doc, .txt</span>
                </div>
                <div className="text-[10px] text-slate-500">
                  Gemini extracts your actual experience, skills, and projects without inventing credentials
                </div>
                <input
                  type="file"
                  accept=".pdf,.docx,.doc,.txt,.md"
                  onChange={handleFileUpload}
                  className="hidden"
                />
              </label>
            </div>
          ) : (
            /* Direct Textarea Paste */
            <div className="space-y-2">
              <textarea
                value={customText}
                onChange={(e) => setCustomText(e.target.value)}
                placeholder="Paste the full text of your CV/Resume here (experience, education, skills, projects)..."
                rows={6}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-indigo-500 transition-colors font-mono"
              />
              <button
                onClick={handleAnalyzePastedText}
                disabled={!customText.trim() || isAnalyzing}
                className="w-full py-2 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 transition-all shadow-md"
              >
                <Sparkles className="w-3.5 h-3.5" />
                Analyze Pasted Resume with Gemini
              </button>
            </div>
          )}
        </div>
      )}

      {/* Empty State when no resume loaded yet and uploader is closed */}
      {!resume && !isAnalyzing && !showUploader && (
        <div className="bg-slate-900 border border-slate-800 p-8 rounded-2xl text-center space-y-3">
          <FileText className="w-10 h-10 text-indigo-400 mx-auto" />
          <h3 className="text-sm font-bold text-slate-200">No Resume Analyzed Yet</h3>
          <p className="text-xs text-slate-400 max-w-sm mx-auto">
            Upload your actual CV as a PDF or Word document, or paste your text directly to generate an ATS health score, top matching roles, and a tailored master resume.
          </p>
          <button
            onClick={() => setShowUploader(true)}
            className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-semibold shadow-md transition-all inline-flex items-center gap-1.5"
          >
            <Upload className="w-3.5 h-3.5" />
            Upload Your Resume
          </button>
        </div>
      )}

      {/* Analyzing Banner Animation */}
      {isAnalyzing && (
        <div className="bg-indigo-950/50 border border-indigo-500/40 p-5 rounded-2xl flex flex-col items-center justify-center space-y-3 text-center animate-pulse">
          <Sparkles className="w-8 h-8 text-indigo-400 animate-spin" />
          <div className="space-y-1">
            <h3 className="text-sm font-bold text-slate-100">Analyzing your career profile...</h3>
            <p className="text-xs text-slate-300">
              Extracting skills, auditing bullet point impact metrics, and generating Top 20 realistic roles.
            </p>
          </div>
        </div>
      )}

      {/* Main Tab Controls: Analysis vs Top 20 Roles vs Master Resume */}
      {resume && !isAnalyzing && (
        <>
          <div className="flex rounded-xl bg-slate-900 p-1 border border-slate-800 text-xs font-medium">
            <button
              onClick={() => setActiveTab("analysis")}
              className={`flex-1 py-1.5 rounded-lg transition-all ${
                activeTab === "analysis"
                  ? "bg-indigo-600 text-white font-semibold shadow-sm"
                  : "text-slate-400 hover:text-slate-200"
              }`}
            >
              Resume Analysis & Health
            </button>
            <button
              onClick={() => setActiveTab("roles")}
              className={`flex-1 py-1.5 rounded-lg transition-all flex items-center justify-center gap-1.5 ${
                activeTab === "roles"
                  ? "bg-indigo-600 text-white font-semibold shadow-sm"
                  : "text-slate-400 hover:text-slate-200"
              }`}
            >
              <span>Top 20 Roles</span>
              <span className="px-1.5 py-0.2 rounded-full bg-indigo-950 text-[10px] text-indigo-200">
                {topRoles.length || 20}
              </span>
            </button>
            <button
              onClick={() => setActiveTab("master")}
              className={`flex-1 py-1.5 rounded-lg transition-all ${
                activeTab === "master"
                  ? "bg-indigo-600 text-white font-semibold shadow-sm"
                  : "text-slate-400 hover:text-slate-200"
              }`}
            >
              Master Resume (ATS)
            </button>
          </div>

          {/* TAB 1: RESUME ANALYSIS */}
          {activeTab === "analysis" && (
            <div className="space-y-4">
              {/* Profile Card Summary */}
              <div className="bg-slate-900 border border-slate-800 p-4 rounded-2xl space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-base font-bold text-slate-100">{resume.personalInfo.fullName}</h3>
                    <div className="text-xs text-slate-400 mt-0.5">
                      {resume.personalInfo.email} • {resume.personalInfo.location}
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="text-[10px] uppercase font-bold text-indigo-400">Current Level</span>
                    <div className="text-sm font-bold text-slate-200">{resume.experienceLevel}</div>
                    <div className="text-[11px] text-slate-400">{resume.yearsOfExperience} yrs experience</div>
                  </div>
                </div>

                <div className="text-xs text-slate-300 bg-slate-950/60 p-3 rounded-xl border border-slate-800/80 leading-relaxed">
                  {resume.candidateSummary}
                </div>

                {/* Primary Skills Chips */}
                <div className="space-y-1.5">
                  <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                    Primary Detected Skills
                  </span>
                  <div className="flex flex-wrap gap-1.5">
                    {resume.skills.languages.map((lang) => (
                      <span
                        key={lang}
                        className="px-2 py-0.5 rounded-md text-[11px] font-medium bg-indigo-500/10 text-indigo-300 border border-indigo-500/20"
                      >
                        {lang}
                      </span>
                    ))}
                    {resume.skills.frameworks.map((fw) => (
                      <span
                        key={fw}
                        className="px-2 py-0.5 rounded-md text-[11px] font-medium bg-purple-500/10 text-purple-300 border border-purple-500/20"
                      >
                        {fw}
                      </span>
                    ))}
                    {resume.skills.databases.map((db) => (
                      <span
                        key={db}
                        className="px-2 py-0.5 rounded-md text-[11px] font-medium bg-emerald-500/10 text-emerald-300 border border-emerald-500/20"
                      >
                        {db}
                      </span>
                    ))}
                    {resume.skills.cloudAndDevOps.map((cloud) => (
                      <span
                        key={cloud}
                        className="px-2 py-0.5 rounded-md text-[11px] font-medium bg-sky-500/10 text-sky-300 border border-sky-500/20"
                      >
                        {cloud}
                      </span>
                    ))}
                  </div>
                </div>
              </div>

              {/* Detailed ATS Health Breakdown */}
              <div className="bg-slate-900 border border-slate-800 p-4 rounded-2xl space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-bold text-slate-200 uppercase tracking-wider">
                    ATS Resume Health Breakdown
                  </h3>
                  <span className="text-xs font-bold text-emerald-400 bg-emerald-950/80 px-2 py-0.5 rounded-lg border border-emerald-800/80">
                    Overall {resume.atsHealth.overallScore}/100
                  </span>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-slate-300">ATS Formatting Compatibility</span>
                    <span className="font-bold text-slate-200">{resume.atsHealth.atsCompatibility}%</span>
                  </div>
                  <div className="w-full h-1.5 rounded-full bg-slate-800 overflow-hidden">
                    <div
                      className="h-full bg-emerald-500 rounded-full"
                      style={{ width: `${resume.atsHealth.atsCompatibility}%` }}
                    />
                  </div>

                  <div className="flex items-center justify-between text-xs pt-1">
                    <span className="text-slate-300">Keyword Density & Coverage</span>
                    <span className="font-bold text-slate-200">{resume.atsHealth.keywordCoverage}%</span>
                  </div>
                  <div className="w-full h-1.5 rounded-full bg-slate-800 overflow-hidden">
                    <div
                      className="h-full bg-indigo-500 rounded-full"
                      style={{ width: `${resume.atsHealth.keywordCoverage}%` }}
                    />
                  </div>

                  <div className="flex items-center justify-between text-xs pt-1">
                    <span className="text-slate-300">Measurable Impact & Action Verbs</span>
                    <span className="font-bold text-slate-200">{resume.atsHealth.impactScore}%</span>
                  </div>
                  <div className="w-full h-1.5 rounded-full bg-slate-800 overflow-hidden">
                    <div
                      className="h-full bg-amber-500 rounded-full"
                      style={{ width: `${resume.atsHealth.impactScore}%` }}
                    />
                  </div>
                </div>

                <div className="text-[10px] text-slate-400 bg-slate-950/40 p-2.5 rounded-xl border border-slate-800/60 flex items-start gap-1.5">
                  <Info className="w-3.5 h-3.5 text-indigo-400 shrink-0 mt-0.5" />
                  <span>
                    Note: ATS engines vary by employer (e.g. Workday vs Greenhouse vs Taleo). JobPilot analyzes keyword syntax and structure standards rather than certifying guarantees.
                  </span>
                </div>
              </div>

              {/* Detected Issues & Bullet Audit */}
              {resume.resumeIssues.length > 0 && (
                <div className="bg-slate-900 border border-slate-800 p-4 rounded-2xl space-y-2.5">
                  <h3 className="text-xs font-bold text-amber-400 uppercase tracking-wider flex items-center gap-1.5">
                    <AlertTriangle className="w-4 h-4" />
                    Detected Weak Points & Improvement Suggestions
                  </h3>

                  <div className="space-y-2">
                    {resume.resumeIssues.map((issue, idx) => (
                      <div
                        key={idx}
                        className="bg-slate-950/60 border border-slate-800/80 p-2.5 rounded-xl space-y-1"
                      >
                        <div className="flex items-center justify-between text-[11px]">
                          <span className="font-bold text-slate-200">{issue.section}</span>
                          <span
                            className={`text-[9px] uppercase font-bold px-1.5 py-0.2 rounded ${
                              issue.severity === "critical"
                                ? "bg-red-500/20 text-red-400"
                                : "bg-amber-500/20 text-amber-400"
                            }`}
                          >
                            {issue.severity}
                          </span>
                        </div>
                        <div className="text-xs text-slate-300">{issue.issue}</div>
                        <div className="text-[11px] text-indigo-300 font-medium">
                          Fix: {issue.recommendation}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* TAB 2: TOP 20 REALISTIC JOB TITLES */}
          {activeTab === "roles" && (
            <div className="space-y-3">
              <div className="bg-indigo-950/30 border border-indigo-500/20 p-3 rounded-xl flex items-center justify-between">
                <div>
                  <h3 className="text-xs font-bold text-indigo-300">Top 20 Realistic Job Matches</h3>
                  <p className="text-[11px] text-slate-400">
                    Calculated strictly based on your actual demonstrated experience.
                  </p>
                </div>
                <span className="text-xs font-bold text-slate-300 bg-slate-800 px-2 py-0.5 rounded-md">
                  {topRoles.length} Roles
                </span>
              </div>

              <div className="space-y-2">
                {topRoles.map((role, idx) => {
                  const isExpanded = expandedRoleIndex === idx;
                  return (
                    <div
                      key={idx}
                      className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden transition-all"
                    >
                      <button
                        onClick={() => setExpandedRoleIndex(isExpanded ? null : idx)}
                        className="w-full p-3.5 flex items-center justify-between text-left hover:bg-slate-800/50 transition-colors"
                      >
                        <div className="flex items-center gap-3">
                          <span className="text-xs font-mono font-bold text-slate-500 w-5">
                            #{idx + 1}
                          </span>
                          <div>
                            <h4 className="text-sm font-bold text-slate-100">{role.title}</h4>
                            <span className="text-[11px] text-slate-400">{role.seniority}</span>
                          </div>
                        </div>

                        <div className="flex items-center gap-2">
                          <div className="px-2 py-0.5 rounded-full bg-emerald-950 text-emerald-400 border border-emerald-800 text-xs font-bold">
                            {role.matchScore}%
                          </div>
                          {isExpanded ? (
                            <ChevronUp className="w-4 h-4 text-slate-400" />
                          ) : (
                            <ChevronDown className="w-4 h-4 text-slate-400" />
                          )}
                        </div>
                      </button>

                      {isExpanded && (
                        <div className="px-4 pb-4 pt-1 border-t border-slate-800/70 space-y-3 bg-slate-950/40 text-xs">
                          <div>
                            <span className="text-[10px] font-bold text-slate-400 uppercase">
                              Why it matches:
                            </span>
                            <p className="text-slate-300 mt-0.5">{role.reason}</p>
                          </div>

                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                            <div className="bg-slate-900/90 p-2.5 rounded-lg border border-slate-800">
                              <span className="text-[10px] font-bold text-emerald-400 uppercase">
                                Existing Skills ({role.existingSkills.length})
                              </span>
                              <div className="flex flex-wrap gap-1 mt-1">
                                {role.existingSkills.map((s) => (
                                  <span
                                    key={s}
                                    className="px-1.5 py-0.2 rounded bg-emerald-500/10 text-emerald-300 text-[10px]"
                                  >
                                    {s}
                                  </span>
                                ))}
                              </div>
                            </div>

                            <div className="bg-slate-900/90 p-2.5 rounded-lg border border-slate-800">
                              <span className="text-[10px] font-bold text-amber-400 uppercase">
                                Missing Skills Gap ({role.missingSkills.length})
                              </span>
                              <div className="flex flex-wrap gap-1 mt-1">
                                {role.missingSkills.map((s) => (
                                  <span
                                    key={s}
                                    className="px-1.5 py-0.2 rounded bg-amber-500/10 text-amber-300 text-[10px]"
                                  >
                                    {s}
                                  </span>
                                ))}
                              </div>
                            </div>
                          </div>

                          <div>
                            <span className="text-[10px] font-bold text-indigo-400 uppercase">
                              Important ATS Keywords:
                            </span>
                            <div className="flex flex-wrap gap-1 mt-1">
                              {role.atsKeywords.map((kw) => (
                                <span
                                  key={kw}
                                  className="px-1.5 py-0.2 rounded bg-indigo-500/10 text-indigo-300 text-[10px] border border-indigo-500/20"
                                >
                                  {kw}
                                </span>
                              ))}
                            </div>
                          </div>

                          {onNavigateToJobsWithRole && (
                            <button
                              onClick={() => onNavigateToJobsWithRole(role.title)}
                              className="w-full mt-2 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-medium flex items-center justify-center gap-1.5 transition-all text-xs"
                            >
                              <span>Search available "{role.title}" jobs</span>
                              <ArrowRight className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* TAB 3: MASTER RESUME GENERATOR */}
          {activeTab === "master" && masterResume && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-xs font-bold text-slate-200 uppercase tracking-wider">
                    ATS-Optimized Master Resume
                  </h3>
                  <p className="text-[11px] text-slate-400">
                    Clean, single-column ATS layout. No keyword stuffing or graphics.
                  </p>
                </div>

                <div className="flex items-center gap-2 relative">
                  {onOpenQuickTailor && (
                    <button
                      type="button"
                      onClick={onOpenQuickTailor}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-gradient-to-r from-purple-900/60 to-indigo-900/60 hover:from-purple-800/80 hover:to-indigo-800/80 text-indigo-200 border border-indigo-500/40 text-xs font-semibold transition-all shadow-sm cursor-pointer"
                      title="Paste any Job Description to generate tailored resume, cover letter & answers"
                    >
                      <Sparkles className="w-3.5 h-3.5 text-amber-300" />
                      <span>Tailor for Pasted Job</span>
                    </button>
                  )}

                  <button
                    onClick={copyMasterResumeText}
                    className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium border border-slate-700 transition-all"
                    title="Copy full resume text"
                  >
                    {copiedNotification ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copiedNotification ? "Copied!" : "Copy"}</span>
                  </button>

                  {/* Export Dropdown */}
                  <div className="relative">
                    <button
                      onClick={() => setShowExportMenu(!showExportMenu)}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-medium transition-all shadow-sm shadow-indigo-600/30"
                    >
                      <Download className="w-3.5 h-3.5" />
                      <span>Download Resume</span>
                      <ChevronDown className="w-3 h-3" />
                    </button>

                    {showExportMenu && (
                      <div className="absolute right-0 mt-1 w-48 bg-slate-900 border border-slate-700 rounded-xl shadow-2xl p-1.5 z-30 space-y-1 text-xs">
                        <button
                          onClick={() => {
                            printResumeAsPDF(masterResume);
                            setShowExportMenu(false);
                          }}
                          className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg hover:bg-slate-800 text-slate-200 text-left transition-colors"
                        >
                          <Printer className="w-3.5 h-3.5 text-indigo-400" />
                          <div>
                            <div className="font-semibold">Print / PDF</div>
                            <div className="text-[10px] text-slate-400">Save as formatted PDF</div>
                          </div>
                        </button>
                        <button
                          onClick={() => {
                            downloadResumeAsDoc(masterResume);
                            setShowExportMenu(false);
                          }}
                          className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg hover:bg-slate-800 text-slate-200 text-left transition-colors"
                        >
                          <FileDown className="w-3.5 h-3.5 text-blue-400" />
                          <div>
                            <div className="font-semibold">Word Document (.doc)</div>
                            <div className="text-[10px] text-slate-400">MS Word format</div>
                          </div>
                        </button>
                        <button
                          onClick={() => {
                            downloadResumeAsTxt(masterResume);
                            setShowExportMenu(false);
                          }}
                          className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg hover:bg-slate-800 text-slate-200 text-left transition-colors"
                        >
                          <FileText className="w-3.5 h-3.5 text-emerald-400" />
                          <div>
                            <div className="font-semibold">Plain Text (.txt)</div>
                            <div className="text-[10px] text-slate-400">ATS standard text</div>
                          </div>
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* ATS Document Canvas View */}
              <div className="bg-slate-950 border border-slate-800 p-6 rounded-2xl shadow-inner font-sans space-y-5 text-slate-200 text-xs">
                {/* Header */}
                <div className="text-center pb-3 border-b border-slate-800 space-y-1">
                  <h2 className="text-lg font-bold text-white tracking-wide">
                    {masterResume.contactInfo.name}
                  </h2>
                  <div className="text-[11px] text-slate-400">
                    {masterResume.contactInfo.location} • {masterResume.contactInfo.email} • {masterResume.contactInfo.phone}
                  </div>
                  <div className="text-[10px] text-indigo-400 font-mono">
                    {masterResume.contactInfo.linkedin} • {masterResume.contactInfo.github}
                  </div>
                </div>

                {/* Professional Summary */}
                <div className="space-y-1">
                  <h4 className="text-xs font-bold text-indigo-400 uppercase tracking-wider">
                    Professional Summary
                  </h4>
                  <p className="text-slate-300 leading-relaxed text-[11px]">
                    {masterResume.professionalSummary}
                  </p>
                </div>

                {/* Technical Skills */}
                <div className="space-y-1.5">
                  <h4 className="text-xs font-bold text-indigo-400 uppercase tracking-wider">
                    Technical Skills
                  </h4>
                  <div className="space-y-1 text-[11px]">
                    <div>
                      <span className="font-semibold text-slate-300">Languages: </span>
                      <span className="text-slate-400">{masterResume.technicalSkills.languages.join(", ")}</span>
                    </div>
                    <div>
                      <span className="font-semibold text-slate-300">Frameworks: </span>
                      <span className="text-slate-400">{masterResume.technicalSkills.frameworks.join(", ")}</span>
                    </div>
                    <div>
                      <span className="font-semibold text-slate-300">Databases & Cloud: </span>
                      <span className="text-slate-400">
                        {[...masterResume.technicalSkills.databases, ...masterResume.technicalSkills.cloudDevOps].join(", ")}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Professional Experience */}
                <div className="space-y-2">
                  <h4 className="text-xs font-bold text-indigo-400 uppercase tracking-wider">
                    Professional Experience
                  </h4>
                  {masterResume.experience.map((exp, idx) => (
                    <div key={idx} className="space-y-1 text-[11px]">
                      <div className="flex items-center justify-between font-semibold text-slate-200">
                        <span>{exp.title} — {exp.company}</span>
                        <span className="text-slate-400 font-normal">{exp.period}</span>
                      </div>
                      <ul className="list-disc list-inside space-y-1 text-slate-300 pl-1">
                        {exp.bullets.map((b, bIdx) => (
                          <li key={bIdx} className="leading-relaxed">
                            {b}
                          </li>
                        ))}
                      </ul>
                    </div>
                  ))}
                </div>

                {/* Projects */}
                {masterResume.projects && masterResume.projects.length > 0 && (
                  <div className="space-y-2">
                    <h4 className="text-xs font-bold text-indigo-400 uppercase tracking-wider">
                      Projects
                    </h4>
                    {masterResume.projects.map((proj, idx) => (
                      <div key={idx} className="space-y-1 text-[11px]">
                        <div className="font-semibold text-slate-200">{proj.name}</div>
                        <p className="text-slate-400">{proj.description}</p>
                      </div>
                    ))}
                  </div>
                )}

                {/* Education */}
                <div className="space-y-1 text-[11px]">
                  <h4 className="text-xs font-bold text-indigo-400 uppercase tracking-wider">
                    Education
                  </h4>
                  {masterResume.education.map((edu, idx) => (
                    <div key={idx} className="flex justify-between text-slate-300">
                      <span>{edu.degree} — {edu.school}</span>
                      <span className="text-slate-400">{edu.year}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
};
