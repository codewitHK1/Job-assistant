import React, { useState } from "react";
import {
  X,
  Sparkles,
  Clipboard,
  FileText,
  Mail,
  HelpCircle,
  Download,
  Copy,
  Check,
  ChevronDown,
  Printer,
  FileDown,
  ArrowRight,
  RotateCcw,
  Building,
  Briefcase,
  Layers,
  AlertCircle,
  BookmarkPlus,
} from "lucide-react";
import { MasterResumeData, CustomJobKitResponse, ParsedResumeResult } from "../types/jobpilot.ts";
import { apiService } from "../services/api.ts";
import {
  downloadResumeAsTxt,
  downloadResumeAsDoc,
  printResumeAsPDF,
  downloadCoverLetterAsTxt,
  downloadCoverLetterAsDoc,
  printCoverLetterAsPDF,
  downloadAnswersAsTxt,
  formatResumeAsPlainText,
} from "../utils/documentExport.ts";

interface QuickJobTailorModalProps {
  onClose: () => void;
  resume?: ParsedResumeResult | null;
  masterResume?: MasterResumeData | null;
  onNavigateToResume?: () => void;
  onSaveToTracker?: (jobData: {
    title: string;
    company: string;
    description: string;
    matchScore: number;
    tailoredResume: MasterResumeData;
    coverLetter: string;
    answers: Array<{ question: string; suggestedAnswer: string }>;
  }) => void;
}

const SAMPLE_JOBS = [
  {
    title: "Senior Full-Stack Engineer",
    company: "Stripe",
    text: `Job Title: Senior Full-Stack Engineer
Company: Stripe
Location: Remote / San Francisco, CA
Salary: $165,000 - $210,000 + Equity

About the Role:
We are looking for a Senior Full-Stack Engineer to join our Payment Platform team. In this role, you will design and build mission-critical, high-throughput systems that power billions of dollars in global commerce.

Key Responsibilities:
- Design, build, and maintain scalable APIs, microservices, and user-facing dashboard interfaces.
- Collaborate closely with product managers, security engineers, and designers to build reliable financial infrastructure.
- Uphold high standards for code quality, automated test coverage (unit/integration), and system architecture.
- Optimize database queries, reduce API latencies, and participate in on-call engineering rotations.

Qualifications:
- 4+ years of professional experience building modern full-stack web applications.
- Strong proficiency in TypeScript, React, Node.js, and relational databases (PostgreSQL/MySQL).
- Experience designing RESTful and GraphQL APIs with strict security and rate limiting.
- Familiarity with cloud platforms (AWS/GCP), Docker, CI/CD pipelines, and observability tools.
- Excellent communication skills and empathy for developer and merchant experiences.`,
  },
  {
    title: "Lead Mobile & Android Engineer",
    company: "Spotify",
    text: `Job Title: Lead Mobile & Android Engineer
Company: Spotify
Location: New York, NY / Remote (US)
Salary: $175,000 - $225,000

About the Role:
Join the Core Mobile Experience team at Spotify. You will build and scale music and podcast listening experiences used by more than 600 million active listeners worldwide.

Responsibilities:
- Architect modern Android mobile applications using Kotlin, Jetpack Compose, Coroutines, and Flow.
- Implement robust offline caching, local SQLite/Room persistence, and smooth audio streaming pipelines.
- Champion design system components, Material 3 guidelines, accessibility, and 60fps animations.
- Collaborate across cross-functional teams to deliver localized and resilient mobile features.

Requirements:
- 5+ years of software engineering experience with deep specialization in modern Android development.
- Deep expertise in Kotlin, Jetpack Compose, MVVM/MVI architectures, and Android SDK internals.
- Proven track record of shipping consumer-grade mobile applications with excellent ratings.
- Strong knowledge of unit testing, instrumentation, and CI/CD pipelines for mobile deployments.`,
  },
  {
    title: "Frontend Architect / React Specialist",
    company: "Vercel",
    text: `Job Title: Frontend Architect (React & Next.js)
Company: Vercel
Location: Global Remote
Salary: $160,000 - $200,000

About the Role:
Vercel is the platform for frontend developers. We are seeking a Frontend Architect to shape the next generation of web application dashboards, developer workflows, and serverless interfaces.

What You Will Do:
- Architect responsive, high-performance web applications using React 19, TypeScript, and modern CSS.
- Optimize Core Web Vitals, bundle sizes, server-side rendering, and streaming responses.
- Collaborate with open-source communities and internal teams to establish best practices for UI development.

Qualifications:
- 4+ years of frontend development experience building complex Single Page Applications and SSR sites.
- Exceptional proficiency in TypeScript, React, state management, and modern Web APIs.
- Passion for developer experience, accessible UI component primitives, and aesthetic design craft.`,
  },
];

export const QuickJobTailorModal: React.FC<QuickJobTailorModalProps> = ({
  onClose,
  resume,
  masterResume,
  onNavigateToResume,
  onSaveToTracker,
}) => {
  // Input State
  const [jobDescription, setJobDescription] = useState("");
  const [jobTitle, setJobTitle] = useState("");
  const [company, setCompany] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [generationStep, setGenerationStep] = useState("");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Result State
  const [kitResult, setKitResult] = useState<CustomJobKitResponse | null>(null);
  const [activeTab, setActiveTab] = useState<"resume" | "cover_letter" | "answers" | "overview">("resume");
  const [resumeViewMode, setResumeViewMode] = useState<"diff" | "full">("diff");
  const [editableCoverLetter, setEditableCoverLetter] = useState("");
  const [screeningAnswers, setScreeningAnswers] = useState<Array<{ question: string; suggestedAnswer: string }>>([]);

  // Copy & Export feedback states
  const [copiedResume, setCopiedResume] = useState(false);
  const [copiedCoverLetter, setCopiedCoverLetter] = useState(false);
  const [copiedAllAnswers, setCopiedAllAnswers] = useState(false);
  const [copiedBulletIndex, setCopiedBulletIndex] = useState<number | null>(null);
  const [copiedAnswerIndex, setCopiedAnswerIndex] = useState<number | null>(null);
  const [showResumeExportMenu, setShowResumeExportMenu] = useState(false);
  const [showCoverLetterExportMenu, setShowCoverLetterExportMenu] = useState(false);
  const [savedToTracker, setSavedToTracker] = useState(false);

  // Handle Paste from Clipboard
  const handlePasteClipboard = async () => {
    try {
      const text = await navigator.clipboard.readText();
      if (text) {
        setJobDescription(text);
        // Try to auto-detect title or company
        autoDetectFields(text);
      }
    } catch {
      // If clipboard access is blocked, prompt politely
      alert("Please paste the job description text into the box using Ctrl+V / Cmd+V.");
    }
  };

  // Auto-detect title and company heuristics
  const autoDetectFields = (text: string) => {
    const lines = text.split("\n").slice(0, 10);
    for (const line of lines) {
      const titleMatch = line.match(/(?:title|role|position|job)\s*[:\-–]\s*([^\n\r,]+)/i);
      if (titleMatch && !jobTitle) {
        setJobTitle(titleMatch[1].trim());
      }
      const compMatch = line.match(/(?:company|organization|at|about)\s*[:\-–]\s*([^\n\r,]+)/i);
      if (compMatch && !company) {
        setCompany(compMatch[1].trim());
      }
    }
  };

  const handleSelectSample = (sample: (typeof SAMPLE_JOBS)[0]) => {
    setJobTitle(sample.title);
    setCompany(sample.company);
    setJobDescription(sample.text);
    setErrorMessage(null);
  };

  // Trigger Generation
  const handleGenerate = async () => {
    if (!jobDescription.trim()) {
      setErrorMessage("Please paste a job description first.");
      return;
    }

    if (!resume) {
      setErrorMessage(
        "No uploaded CV found. Please upload your CV first — tailoring for any job description is generated strictly based on your uploaded CV only."
      );
      return;
    }

    setIsGenerating(true);
    setErrorMessage(null);
    setGenerationStep("Parsing job requirements and matching keywords...");

    try {
      setTimeout(() => setGenerationStep("Tailoring ATS resume and bullet points based on your CV..."), 800);
      setTimeout(() => setGenerationStep("Drafting targeted cover letter..."), 1600);
      setTimeout(() => setGenerationStep("Preparing tailored screening interview answers..."), 2400);

      const result = await apiService.generateCustomJobKit({
        jobDescription: jobDescription.trim(),
        jobTitle: jobTitle.trim() || undefined,
        company: company.trim() || undefined,
        resume: resume || undefined,
        masterResume: masterResume || undefined,
      });

      setKitResult(result);
      setEditableCoverLetter(result.coverLetter);
      setScreeningAnswers(result.screeningAnswers || []);
      setActiveTab("resume");
    } catch (err: any) {
      console.error("Error generating kit:", err);
      setErrorMessage(err.message || "Failed to generate application kit. Please try again.");
    } finally {
      setIsGenerating(false);
      setGenerationStep("");
    }
  };

  // Copy Handlers
  const handleCopyResumeText = () => {
    if (!kitResult) return;
    const text = formatResumeAsPlainText(
      kitResult.tailoredResume,
      kitResult.jobTitle,
      kitResult.company
    );
    navigator.clipboard.writeText(text);
    setCopiedResume(true);
    setTimeout(() => setCopiedResume(false), 2000);
  };

  const handleCopyBullet = (bulletText: string, index: number) => {
    navigator.clipboard.writeText(bulletText);
    setCopiedBulletIndex(index);
    setTimeout(() => setCopiedBulletIndex(null), 2000);
  };

  const handleCopyCoverLetter = () => {
    navigator.clipboard.writeText(editableCoverLetter);
    setCopiedCoverLetter(true);
    setTimeout(() => setCopiedCoverLetter(false), 2000);
  };

  const handleCopyAnswer = (text: string, index: number) => {
    navigator.clipboard.writeText(text);
    setCopiedAnswerIndex(index);
    setTimeout(() => setCopiedAnswerIndex(null), 2000);
  };

  const handleCopyAllAnswers = () => {
    const formatted = screeningAnswers
      .map((item, idx) => `Question ${idx + 1}: ${item.question}\n\nAnswer:\n${item.suggestedAnswer}\n\n${"-".repeat(40)}`)
      .join("\n\n");
    navigator.clipboard.writeText(formatted);
    setCopiedAllAnswers(true);
    setTimeout(() => setCopiedAllAnswers(false), 2000);
  };

  // Save to Tracker Handler
  const handleSaveTracker = () => {
    if (!kitResult) return;
    if (onSaveToTracker) {
      onSaveToTracker({
        title: kitResult.jobTitle,
        company: kitResult.company,
        description: kitResult.jobDescription,
        matchScore: kitResult.matchScore,
        tailoredResume: kitResult.tailoredResume,
        coverLetter: editableCoverLetter,
        answers: screeningAnswers,
      });
    }
    setSavedToTracker(true);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-2 sm:p-4">
      <div className="w-full max-w-4xl h-[92vh] bg-slate-950 border border-slate-800 rounded-2xl flex flex-col shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="px-5 py-3.5 border-b border-slate-800 flex items-center justify-between bg-slate-900/60 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-md shadow-indigo-500/25">
              <Sparkles className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="text-sm sm:text-base font-bold text-white flex items-center gap-2">
                Paste Job Description & Tailor
                <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                  Instant Kit
                </span>
              </h2>
              <p className="text-[11px] text-slate-400">
                Generate ATS tailored resume, targeted cover letter & screening answers ready to copy and download
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        {!kitResult ? (
          /* STEP 1: INPUT SCREEN */
          <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4">
            {/* Active CV Anchor Status Banner */}
            {resume ? (
              <div className="p-3.5 rounded-xl bg-emerald-950/40 border border-emerald-500/30 flex items-center justify-between gap-3 shadow-sm">
                <div className="flex items-center gap-2.5">
                  <div className="p-1.5 rounded-lg bg-emerald-500/20 text-emerald-400">
                    <Check className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="text-xs font-semibold text-slate-100 flex items-center gap-1.5">
                      <span>CV Active: <strong className="text-emerald-300">{resume.personalInfo.fullName}</strong></span>
                      <span className="text-[10px] text-slate-400 font-normal">
                        ({resume.experienceLevel}, {resume.yearsOfExperience} yrs exp)
                      </span>
                    </div>
                    <p className="text-[11px] text-emerald-400/90 mt-0.5">
                      Tailoring is generated strictly based on your uploaded CV only. Zero fabrication.
                    </p>
                  </div>
                </div>
                {onNavigateToResume && (
                  <button
                    type="button"
                    onClick={onNavigateToResume}
                    className="text-[11px] px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 font-medium transition-colors shrink-0"
                  >
                    Switch CV
                  </button>
                )}
              </div>
            ) : (
              <div className="p-3.5 rounded-xl bg-amber-950/40 border border-amber-500/40 flex items-center justify-between gap-3 shadow-sm">
                <div className="flex items-center gap-2.5">
                  <div className="p-1.5 rounded-lg bg-amber-500/20 text-amber-400">
                    <AlertCircle className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="text-xs font-bold text-amber-200">
                      No CV Uploaded Yet
                    </div>
                    <p className="text-[11px] text-amber-300/80 mt-0.5">
                      Tailoring is generated strictly based on your uploaded CV only. Please upload your CV first to begin.
                    </p>
                  </div>
                </div>
                {onNavigateToResume && (
                  <button
                    type="button"
                    onClick={onNavigateToResume}
                    className="text-xs px-3 py-1.5 rounded-lg bg-amber-600 hover:bg-amber-500 text-white font-semibold transition-colors shrink-0 shadow-sm"
                  >
                    Upload CV First
                  </button>
                )}
              </div>
            )}

            {/* Quick Sample Presets */}
            <div className="space-y-1.5">
              <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                Or try a sample job posting:
              </span>
              <div className="flex items-center gap-2 flex-wrap">
                {SAMPLE_JOBS.map((sample) => (
                  <button
                    key={sample.company}
                    type="button"
                    onClick={() => handleSelectSample(sample)}
                    className="px-2.5 py-1 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-800 hover:border-slate-700 text-slate-300 text-xs flex items-center gap-1.5 transition-colors"
                  >
                    <Building className="w-3.5 h-3.5 text-indigo-400" />
                    <span className="font-medium text-white">{sample.company}</span>
                    <span className="text-slate-400">({sample.title})</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Optional Title & Company inputs */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1 flex items-center gap-1.5">
                  <Briefcase className="w-3.5 h-3.5 text-indigo-400" />
                  Target Role / Title <span className="text-[10px] text-slate-400 font-normal">(Optional - auto-detected)</span>
                </label>
                <input
                  type="text"
                  value={jobTitle}
                  onChange={(e) => setJobTitle(e.target.value)}
                  placeholder="e.g. Senior Full-Stack Engineer"
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 transition-colors"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1 flex items-center gap-1.5">
                  <Building className="w-3.5 h-3.5 text-indigo-400" />
                  Target Company <span className="text-[10px] text-slate-400 font-normal">(Optional - auto-detected)</span>
                </label>
                <input
                  type="text"
                  value={company}
                  onChange={(e) => setCompany(e.target.value)}
                  placeholder="e.g. Stripe, Spotify, Google"
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 transition-colors"
                />
              </div>
            </div>

            {/* Job Description Textarea */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
                  <FileText className="w-3.5 h-3.5 text-indigo-400" />
                  Job Description Text <span className="text-indigo-400 font-bold">*</span>
                </label>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={handlePasteClipboard}
                    className="text-xs text-indigo-400 hover:text-indigo-300 flex items-center gap-1 font-medium py-0.5 px-2 rounded hover:bg-slate-900 transition-colors"
                  >
                    <Clipboard className="w-3.5 h-3.5" />
                    Paste from Clipboard
                  </button>

                  {jobDescription && (
                    <button
                      type="button"
                      onClick={() => setJobDescription("")}
                      className="text-xs text-slate-400 hover:text-slate-300 transition-colors"
                    >
                      Clear
                    </button>
                  )}
                </div>
              </div>

              <textarea
                value={jobDescription}
                onChange={(e) => {
                  setJobDescription(e.target.value);
                  if (!jobTitle || !company) {
                    autoDetectFields(e.target.value);
                  }
                }}
                rows={12}
                placeholder="Paste the raw job description here from LinkedIn, Indeed, Greenhouse, Lever, or company careers page...

Include responsibilities, required skills, technologies, qualifications, and about the company."
                className="w-full bg-slate-900/90 border border-slate-800 rounded-xl p-3.5 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-indigo-500 font-mono leading-relaxed transition-colors resize-none scrollbar-thin scrollbar-thumb-slate-800"
              />

              <div className="flex items-center justify-between text-[11px] text-slate-400">
                <span>Characters: {jobDescription.length}</span>
                <span>Includes ATS keyword matching & truthful resume diff</span>
              </div>
            </div>

            {/* Error banner if any */}
            {errorMessage && (
              <div className="p-3 rounded-xl bg-red-950/50 border border-red-800 text-red-300 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
                <span>{errorMessage}</span>
              </div>
            )}

            {/* Submit Button */}
            <div className="pt-2">
              <button
                type="button"
                disabled={isGenerating || !jobDescription.trim()}
                onClick={handleGenerate}
                className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-indigo-600 via-purple-600 to-indigo-600 hover:from-indigo-500 hover:via-purple-500 hover:to-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed text-white text-sm font-bold flex items-center justify-center gap-2 shadow-lg shadow-indigo-600/30 transition-all cursor-pointer"
              >
                {isGenerating ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    <span>{generationStep || "Generating your application kit..."}</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4 text-amber-300" />
                    <span>Generate Tailored Resume, Cover Letter & Answers</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </div>
          </div>
        ) : (
          /* STEP 2: APPLICATION KIT RESULT SCREEN */
          <div className="flex-1 flex flex-col overflow-hidden">
            {/* Top Job Banner */}
            <div className="px-5 py-3 bg-slate-900 border-b border-slate-800 flex flex-wrap items-center justify-between gap-3 shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-indigo-950 border border-indigo-800 flex items-center justify-center font-bold text-indigo-300 text-sm">
                  {kitResult.company.slice(0, 2).toUpperCase()}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-sm font-bold text-white">{kitResult.jobTitle}</h3>
                    <span className="text-xs text-indigo-300">at {kitResult.company}</span>
                  </div>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className="text-[10px] font-semibold px-2 py-0.5 rounded-md bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                      {kitResult.matchScore}% ATS Match
                    </span>
                    <span className="text-[10px] text-slate-400">
                      {kitResult.bulletChanges.length} bullet points optimized
                    </span>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleSaveTracker}
                  disabled={savedToTracker}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 border transition-all ${
                    savedToTracker
                      ? "bg-emerald-950/60 border-emerald-800 text-emerald-300"
                      : "bg-slate-800 hover:bg-slate-700 border-slate-700 text-slate-200"
                  }`}
                >
                  <BookmarkPlus className="w-3.5 h-3.5" />
                  <span>{savedToTracker ? "Saved to Applications" : "Save to Tracker"}</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setKitResult(null);
                    setSavedToTracker(false);
                  }}
                  className="px-2.5 py-1.5 rounded-lg bg-slate-800/80 hover:bg-slate-800 border border-slate-700 text-slate-400 hover:text-slate-200 text-xs flex items-center gap-1 transition-colors"
                >
                  <RotateCcw className="w-3 h-3" />
                  <span>Paste Another</span>
                </button>
              </div>
            </div>

            {/* Navigation Tabs */}
            <div className="px-5 pt-2 bg-slate-900/40 border-b border-slate-800 flex items-center gap-1 shrink-0 overflow-x-auto no-scrollbar">
              <button
                type="button"
                onClick={() => setActiveTab("resume")}
                className={`flex items-center gap-1.5 px-3 py-2 text-xs font-semibold border-b-2 transition-all shrink-0 ${
                  activeTab === "resume"
                    ? "border-indigo-500 text-indigo-400"
                    : "border-transparent text-slate-400 hover:text-slate-200"
                }`}
              >
                <FileText className="w-3.5 h-3.5" />
                <span>Tailored Resume</span>
                <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-slate-800 text-slate-300">
                  {kitResult.bulletChanges.length}
                </span>
              </button>

              <button
                type="button"
                onClick={() => setActiveTab("cover_letter")}
                className={`flex items-center gap-1.5 px-3 py-2 text-xs font-semibold border-b-2 transition-all shrink-0 ${
                  activeTab === "cover_letter"
                    ? "border-indigo-500 text-indigo-400"
                    : "border-transparent text-slate-400 hover:text-slate-200"
                }`}
              >
                <Mail className="w-3.5 h-3.5" />
                <span>Targeted Cover Letter</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveTab("answers")}
                className={`flex items-center gap-1.5 px-3 py-2 text-xs font-semibold border-b-2 transition-all shrink-0 ${
                  activeTab === "answers"
                    ? "border-indigo-500 text-indigo-400"
                    : "border-transparent text-slate-400 hover:text-slate-200"
                }`}
              >
                <HelpCircle className="w-3.5 h-3.5" />
                <span>Screening Answers</span>
                <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-slate-800 text-slate-300">
                  {screeningAnswers.length}
                </span>
              </button>

              <button
                type="button"
                onClick={() => setActiveTab("overview")}
                className={`flex items-center gap-1.5 px-3 py-2 text-xs font-semibold border-b-2 transition-all shrink-0 ${
                  activeTab === "overview"
                    ? "border-indigo-500 text-indigo-400"
                    : "border-transparent text-slate-400 hover:text-slate-200"
                }`}
              >
                <Layers className="w-3.5 h-3.5" />
                <span>Match Breakdown & Keywords</span>
              </button>
            </div>

            {/* Tab Contents */}
            <div className="flex-1 overflow-y-auto p-4 sm:p-6">
              {/* TAB 1: TAILORED RESUME */}
              {activeTab === "resume" && (
                <div className="space-y-4">
                  {/* Action Bar */}
                  <div className="bg-slate-900 border border-slate-800 p-3 rounded-xl flex flex-wrap items-center justify-between gap-2">
                    <div className="flex items-center gap-1.5 bg-slate-950 p-1 rounded-lg border border-slate-800 text-xs">
                      <button
                        type="button"
                        onClick={() => setResumeViewMode("diff")}
                        className={`px-2.5 py-1 rounded-md font-medium transition-all ${
                          resumeViewMode === "diff"
                            ? "bg-indigo-600 text-white shadow-sm"
                            : "text-slate-400 hover:text-slate-200"
                        }`}
                      >
                        Bullet Optimizations ({kitResult.bulletChanges.length})
                      </button>
                      <button
                        type="button"
                        onClick={() => setResumeViewMode("full")}
                        className={`px-2.5 py-1 rounded-md font-medium transition-all ${
                          resumeViewMode === "full"
                            ? "bg-indigo-600 text-white shadow-sm"
                            : "text-slate-400 hover:text-slate-200"
                        }`}
                      >
                        Full Tailored CV Preview
                      </button>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={handleCopyResumeText}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold border border-slate-700 transition-all"
                        title="Copy full plain text resume formatted for ATS"
                      >
                        {copiedResume ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                        <span>{copiedResume ? "Copied All CV Text!" : "Copy CV Text"}</span>
                      </button>

                      {/* Download Menu */}
                      <div className="relative">
                        <button
                          type="button"
                          onClick={() => setShowResumeExportMenu(!showResumeExportMenu)}
                          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold transition-all shadow-sm shadow-indigo-600/30"
                        >
                          <Download className="w-3.5 h-3.5" />
                          <span>Download Resume</span>
                          <ChevronDown className="w-3 h-3" />
                        </button>

                        {showResumeExportMenu && (
                          <div className="absolute right-0 mt-1 w-48 bg-slate-900 border border-slate-700 rounded-xl shadow-2xl p-1.5 z-30 space-y-1 text-xs">
                            <button
                              type="button"
                              onClick={() => {
                                printResumeAsPDF(kitResult.tailoredResume, kitResult.jobTitle, kitResult.company);
                                setShowResumeExportMenu(false);
                              }}
                              className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg hover:bg-slate-800 text-slate-200 text-left transition-colors"
                            >
                              <Printer className="w-3.5 h-3.5 text-indigo-400" />
                              <div>
                                <div className="font-semibold">Print / PDF</div>
                                <div className="text-[10px] text-slate-400">Clean formatted PDF</div>
                              </div>
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                downloadResumeAsDoc(kitResult.tailoredResume, kitResult.jobTitle, kitResult.company);
                                setShowResumeExportMenu(false);
                              }}
                              className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg hover:bg-slate-800 text-slate-200 text-left transition-colors"
                            >
                              <FileDown className="w-3.5 h-3.5 text-blue-400" />
                              <div>
                                <div className="font-semibold">Word Doc (.doc)</div>
                                <div className="text-[10px] text-slate-400">Editable MS Word</div>
                              </div>
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                downloadResumeAsTxt(kitResult.tailoredResume, kitResult.jobTitle, kitResult.company);
                                setShowResumeExportMenu(false);
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

                  {/* Summary Diff Notice */}
                  {kitResult.summaryDiff && (
                    <div className="p-3 bg-indigo-950/40 border border-indigo-900/50 rounded-xl text-xs text-indigo-200">
                      <span className="font-bold text-white">Summary Enhancement: </span>
                      {kitResult.summaryDiff}
                    </div>
                  )}

                  {/* View: Bullet Diff View */}
                  {resumeViewMode === "diff" && (
                    <div className="space-y-3">
                      {kitResult.bulletChanges.map((change, idx) => (
                        <div
                          key={idx}
                          className="bg-slate-900 border border-slate-800 rounded-xl p-3.5 space-y-2.5"
                        >
                          <div className="flex items-center justify-between">
                            <span className="text-xs font-bold text-white flex items-center gap-1.5">
                              <Building className="w-3 h-3 text-indigo-400" />
                              {change.company}
                            </span>
                            <button
                              type="button"
                              onClick={() => handleCopyBullet(change.tailored, idx)}
                              className="flex items-center gap-1 px-2 py-0.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 text-[11px] font-medium transition-colors"
                              title="Copy this tailored bullet point"
                            >
                              {copiedBulletIndex === idx ? (
                                <>
                                  <Check className="w-3 h-3 text-emerald-400" />
                                  <span className="text-emerald-400 font-semibold">Copied!</span>
                                </>
                              ) : (
                                <>
                                  <Copy className="w-3 h-3" />
                                  <span>Copy Bullet</span>
                                </>
                              )}
                            </button>
                          </div>

                          <div className="space-y-1.5 text-xs">
                            <div className="p-2 rounded-lg bg-red-950/20 border border-red-900/40 text-slate-400 font-mono text-[11px]">
                              <span className="text-red-400 font-bold block mb-0.5">Original:</span>
                              {change.original}
                            </div>
                            <div className="p-2 rounded-lg bg-emerald-950/30 border border-emerald-900/50 text-emerald-200 font-mono text-[11px]">
                              <span className="text-emerald-400 font-bold block mb-0.5">Tailored for this Job:</span>
                              {change.tailored}
                            </div>
                          </div>

                          <div className="text-[11px] text-slate-400 italic">
                            <span className="font-semibold text-slate-300">Why ATS optimized:</span> {change.reason}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* View: Full CV Preview */}
                  {resumeViewMode === "full" && (
                    <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-4 sm:p-6 font-mono text-xs text-slate-200 whitespace-pre-wrap leading-relaxed space-y-4">
                      <div className="border-b border-slate-800 pb-3">
                        <h2 className="text-base font-bold text-white tracking-wider">
                          {kitResult.tailoredResume.contactInfo.name}
                        </h2>
                        <div className="text-slate-400 text-[11px] mt-0.5">
                          {kitResult.tailoredResume.contactInfo.email} • {kitResult.tailoredResume.contactInfo.phone} • {kitResult.tailoredResume.contactInfo.location}
                        </div>
                      </div>

                      <div>
                        <h3 className="text-xs font-bold text-indigo-400 tracking-wider uppercase mb-1">
                          Professional Summary
                        </h3>
                        <p className="text-slate-300 font-sans text-xs leading-relaxed">
                          {kitResult.tailoredResume.professionalSummary}
                        </p>
                      </div>

                      <div>
                        <h3 className="text-xs font-bold text-indigo-400 tracking-wider uppercase mb-1">
                          Core Technical Skills
                        </h3>
                        <div className="text-slate-300 text-[11px] space-y-1">
                          <div>
                            <span className="text-slate-400">Languages:</span>{" "}
                            {kitResult.tailoredResume.technicalSkills.languages.join(", ")}
                          </div>
                          <div>
                            <span className="text-slate-400">Frameworks:</span>{" "}
                            {kitResult.tailoredResume.technicalSkills.frameworks.join(", ")}
                          </div>
                          <div>
                            <span className="text-slate-400">Cloud & DevOps:</span>{" "}
                            {kitResult.tailoredResume.technicalSkills.cloudDevOps.join(", ")}
                          </div>
                        </div>
                      </div>

                      <div>
                        <h3 className="text-xs font-bold text-indigo-400 tracking-wider uppercase mb-2">
                          Professional Experience
                        </h3>
                        <div className="space-y-3">
                          {kitResult.tailoredResume.experience.map((exp, eIdx) => (
                            <div key={eIdx} className="space-y-1">
                              <div className="flex justify-between text-xs font-bold text-white">
                                <span>{exp.title} — {exp.company}</span>
                                <span className="text-slate-400 font-normal">{exp.period}</span>
                              </div>
                              <ul className="list-disc pl-4 space-y-1 text-slate-300 font-sans text-xs">
                                {exp.bullets.map((b, bIdx) => (
                                  <li key={bIdx}>{b}</li>
                                ))}
                              </ul>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* TAB 2: TARGETED COVER LETTER */}
              {activeTab === "cover_letter" && (
                <div className="space-y-4">
                  <div className="bg-slate-900 border border-slate-800 p-3 rounded-xl flex flex-wrap items-center justify-between gap-2">
                    <div className="text-xs text-slate-300">
                      <span className="font-bold text-white">Targeted Cover Letter</span> • Factually aligned with your experience & this job description
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={handleCopyCoverLetter}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold border border-slate-700 transition-all"
                        title="Copy cover letter text"
                      >
                        {copiedCoverLetter ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                        <span>{copiedCoverLetter ? "Copied Cover Letter!" : "Copy Cover Letter"}</span>
                      </button>

                      {/* Download Menu */}
                      <div className="relative">
                        <button
                          type="button"
                          onClick={() => setShowCoverLetterExportMenu(!showCoverLetterExportMenu)}
                          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold transition-all shadow-sm shadow-indigo-600/30"
                        >
                          <Download className="w-3.5 h-3.5" />
                          <span>Download Letter</span>
                          <ChevronDown className="w-3 h-3" />
                        </button>

                        {showCoverLetterExportMenu && (
                          <div className="absolute right-0 mt-1 w-48 bg-slate-900 border border-slate-700 rounded-xl shadow-2xl p-1.5 z-30 space-y-1 text-xs">
                            <button
                              type="button"
                              onClick={() => {
                                printCoverLetterAsPDF(editableCoverLetter, kitResult.company, kitResult.jobTitle);
                                setShowCoverLetterExportMenu(false);
                              }}
                              className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg hover:bg-slate-800 text-slate-200 text-left transition-colors"
                            >
                              <Printer className="w-3.5 h-3.5 text-indigo-400" />
                              <div>
                                <div className="font-semibold">Print / PDF</div>
                                <div className="text-[10px] text-slate-400">Formal letter layout</div>
                              </div>
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                downloadCoverLetterAsDoc(editableCoverLetter, kitResult.company, kitResult.jobTitle);
                                setShowCoverLetterExportMenu(false);
                              }}
                              className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg hover:bg-slate-800 text-slate-200 text-left transition-colors"
                            >
                              <FileDown className="w-3.5 h-3.5 text-blue-400" />
                              <div>
                                <div className="font-semibold">Word Doc (.doc)</div>
                                <div className="text-[10px] text-slate-400">MS Word format</div>
                              </div>
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                downloadCoverLetterAsTxt(editableCoverLetter, kitResult.company, kitResult.jobTitle);
                                setShowCoverLetterExportMenu(false);
                              }}
                              className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg hover:bg-slate-800 text-slate-200 text-left transition-colors"
                            >
                              <FileText className="w-3.5 h-3.5 text-emerald-400" />
                              <div>
                                <div className="font-semibold">Plain Text (.txt)</div>
                                <div className="text-[10px] text-slate-400">Text file</div>
                              </div>
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <textarea
                      value={editableCoverLetter}
                      onChange={(e) => setEditableCoverLetter(e.target.value)}
                      rows={16}
                      className="w-full bg-slate-900 border border-slate-800 rounded-xl p-4 text-xs sm:text-sm text-slate-200 leading-relaxed font-sans focus:outline-none focus:border-indigo-500 transition-colors resize-none scrollbar-thin scrollbar-thumb-slate-800"
                    />
                    <div className="flex justify-between text-[11px] text-slate-400">
                      <span>{editableCoverLetter.split(/\s+/).filter(Boolean).length} words</span>
                      <span>Editable • Click any paragraph to fine-tune before copying</span>
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 3: SCREENING ANSWERS */}
              {activeTab === "answers" && (
                <div className="space-y-4">
                  <div className="bg-slate-900 border border-slate-800 p-3 rounded-xl flex flex-wrap items-center justify-between gap-2">
                    <div className="text-xs text-slate-300">
                      <span className="font-bold text-white">Application Screening Questions</span> • Anticipated recruiter questions answered with verified qualifications
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={handleCopyAllAnswers}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold border border-slate-700 transition-all"
                        title="Copy all questions and answers"
                      >
                        {copiedAllAnswers ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                        <span>{copiedAllAnswers ? "Copied All Q&A!" : "Copy All Q&A"}</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => downloadAnswersAsTxt(screeningAnswers, kitResult.company, kitResult.jobTitle)}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold transition-all shadow-sm shadow-indigo-600/30"
                      >
                        <Download className="w-3.5 h-3.5" />
                        <span>Download (.txt)</span>
                      </button>
                    </div>
                  </div>

                  <div className="space-y-3">
                    {screeningAnswers.map((item, idx) => (
                      <div
                        key={idx}
                        className="bg-slate-900 border border-slate-800 rounded-xl p-4 space-y-2.5"
                      >
                        <div className="flex items-start justify-between gap-2">
                          <h4 className="text-xs font-bold text-white flex items-center gap-1.5">
                            <span className="w-5 h-5 rounded-full bg-indigo-600/30 text-indigo-300 font-bold text-[10px] flex items-center justify-center shrink-0">
                              {idx + 1}
                            </span>
                            {item.question}
                          </h4>

                          <button
                            type="button"
                            onClick={() => handleCopyAnswer(item.suggestedAnswer, idx)}
                            className="flex items-center gap-1 px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-200 text-[11px] font-medium transition-colors shrink-0"
                            title="Copy this answer to clipboard"
                          >
                            {copiedAnswerIndex === idx ? (
                              <>
                                <Check className="w-3 h-3 text-emerald-400" />
                                <span className="text-emerald-400 font-semibold">Copied!</span>
                              </>
                            ) : (
                              <>
                                <Copy className="w-3 h-3" />
                                <span>Copy Answer</span>
                              </>
                            )}
                          </button>
                        </div>

                        <textarea
                          value={item.suggestedAnswer}
                          onChange={(e) => {
                            const updated = [...screeningAnswers];
                            updated[idx].suggestedAnswer = e.target.value;
                            setScreeningAnswers(updated);
                          }}
                          rows={3}
                          className="w-full bg-slate-950 border border-slate-800/80 rounded-lg p-2.5 text-xs text-slate-300 focus:outline-none focus:border-indigo-500 transition-colors resize-none font-sans"
                        />
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* TAB 4: MATCH BREAKDOWN & KEYWORDS */}
              {activeTab === "overview" && (
                <div className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div className="bg-slate-900 border border-slate-800 p-3 rounded-xl text-center">
                      <div className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">Overall ATS Match</div>
                      <div className="text-2xl font-bold text-emerald-400 mt-1">{kitResult.matchScore}%</div>
                      <div className="text-[10px] text-slate-400 mt-0.5">ATS keyword match: {kitResult.matchResult.breakdown?.keywords ?? 88}%</div>
                    </div>

                    <div className="bg-slate-900 border border-slate-800 p-3 rounded-xl text-center">
                      <div className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">Skills Overlap</div>
                      <div className="text-2xl font-bold text-indigo-400 mt-1">{kitResult.matchResult.breakdown?.skills ?? 85}%</div>
                      <div className="text-[10px] text-slate-400 mt-0.5">Matching core tech requirements</div>
                    </div>

                    <div className="bg-slate-900 border border-slate-800 p-3 rounded-xl text-center">
                      <div className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">Experience Fit</div>
                      <div className="text-2xl font-bold text-purple-400 mt-1">{kitResult.matchResult.breakdown?.experience ?? 87}%</div>
                      <div className="text-[10px] text-slate-400 mt-0.5">Seniority score: {kitResult.matchResult.breakdown?.seniority ?? 85}%</div>
                    </div>
                  </div>

                  <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl space-y-2">
                    <h4 className="text-xs font-bold text-white">Summary Evaluation</h4>
                    <p className="text-xs text-slate-300 leading-relaxed">
                      {kitResult.matchResult.summaryAnalysis || `High compatibility with requirements for ${kitResult.jobTitle} at ${kitResult.company}.`}
                    </p>
                  </div>

                  {/* Matching Skills */}
                  {(kitResult.matchResult.strongMatches?.length > 0 || kitResult.matchResult.atsKeywordsMatched?.length > 0) && (
                    <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl space-y-2">
                      <h4 className="text-xs font-bold text-emerald-400 flex items-center gap-1.5">
                        <Check className="w-3.5 h-3.5" />
                        Matching Keywords in Your Profile
                      </h4>
                      <div className="flex flex-wrap gap-1.5">
                        {(kitResult.matchResult.strongMatches || kitResult.matchResult.atsKeywordsMatched || []).map((s, i) => (
                          <span
                            key={i}
                            className="px-2 py-0.5 rounded-md bg-emerald-950/60 border border-emerald-800/60 text-emerald-300 text-xs font-medium"
                          >
                            {s}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Missing Skills */}
                  {(kitResult.matchResult.missingSkills?.length > 0 || kitResult.matchResult.atsKeywordsMissing?.length > 0) && (
                    <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl space-y-2">
                      <h4 className="text-xs font-bold text-amber-400 flex items-center gap-1.5">
                        <AlertCircle className="w-3.5 h-3.5" />
                        Gaps or Bonus Technologies Mentioned in JD
                      </h4>
                      <div className="flex flex-wrap gap-1.5">
                        {(kitResult.matchResult.missingSkills || kitResult.matchResult.atsKeywordsMissing || []).map((s, i) => (
                          <span
                            key={i}
                            className="px-2 py-0.5 rounded-md bg-amber-950/40 border border-amber-800/60 text-amber-300 text-xs font-medium"
                          >
                            {s}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
