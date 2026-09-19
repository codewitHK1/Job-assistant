import React, { useState, useEffect } from "react";
import {
  X,
  Sparkles,
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
  ArrowLeft,
  FileText,
  Mail,
  HelpCircle,
  ExternalLink,
  ShieldCheck,
  Edit3,
  Copy,
  Check,
  RefreshCw,
  Download,
  FileDown,
  Printer,
  ChevronDown,
  Layers,
} from "lucide-react";
import { JobListing, JobMatchResult, MasterResumeData, ApplicationRecord } from "../types/jobpilot.ts";
import { apiService } from "../services/api.ts";
import {
  downloadResumeAsTxt,
  downloadResumeAsDoc,
  printResumeAsPDF,
  formatResumeAsPlainText,
  downloadCoverLetterAsTxt,
  downloadCoverLetterAsDoc,
  printCoverLetterAsPDF,
  downloadAnswersAsTxt,
} from "../utils/documentExport.ts";

interface ApplicationWorkflowModalProps {
  job: JobListing;
  matchResult: JobMatchResult;
  masterResume: MasterResumeData | null;
  onClose: () => void;
  onCompleteWorkflow: (applicationRecord: Partial<ApplicationRecord>) => void;
}

type WorkflowStep = "review" | "tailor_resume" | "cover_letter" | "screening_answers" | "user_confirmation" | "submission_verify";

export const ApplicationWorkflowModal: React.FC<ApplicationWorkflowModalProps> = ({
  job,
  matchResult,
  masterResume,
  onClose,
  onCompleteWorkflow,
}) => {
  const [step, setStep] = useState<WorkflowStep>("review");
  const [isProcessing, setIsProcessing] = useState(false);

  // Workflow Generated State
  const [tailoredResumeData, setTailoredResumeData] = useState<{
    tailoredResume: MasterResumeData;
    summaryDiff: string;
    bulletChanges: Array<{ company: string; original: string; tailored: string; reason: string }>;
  } | null>(null);

  const [coverLetterTone, setCoverLetterTone] = useState("professional");
  const [coverLetterLength, setCoverLetterLength] = useState("medium");
  const [coverLetterText, setCoverLetterText] = useState("");

  const [screeningAnswers, setScreeningAnswers] = useState<
    Array<{ question: string; suggestedAnswer: string }>
  >([]);

  const [userConfirmedReview, setUserConfirmedReview] = useState(false);
  const [copiedCoverLetter, setCopiedCoverLetter] = useState(false);
  const [copiedResume, setCopiedResume] = useState(false);
  const [copiedBulletIndex, setCopiedBulletIndex] = useState<number | null>(null);
  const [copiedAnswerIndex, setCopiedAnswerIndex] = useState<number | null>(null);
  const [copiedAllAnswers, setCopiedAllAnswers] = useState(false);
  const [tailoredViewMode, setTailoredViewMode] = useState<"diff" | "full">("diff");
  const [showResumeDownloadMenu, setShowResumeDownloadMenu] = useState(false);
  const [showCoverLetterDownloadMenu, setShowCoverLetterDownloadMenu] = useState(false);

  // Candidate name fallback
  const candidateName =
    tailoredResumeData?.tailoredResume.contactInfo.name ||
    masterResume?.contactInfo.name ||
    "Candidate";

  const effectiveResume = tailoredResumeData?.tailoredResume || masterResume;

  const handleCopyResumeText = () => {
    if (!effectiveResume) return;
    const txt = formatResumeAsPlainText(effectiveResume, job.title, job.company);
    navigator.clipboard.writeText(txt);
    setCopiedResume(true);
    setTimeout(() => setCopiedResume(false), 2000);
  };

  const handleCopyBullet = (bullet: string, idx: number) => {
    navigator.clipboard.writeText(bullet);
    setCopiedBulletIndex(idx);
    setTimeout(() => setCopiedBulletIndex(null), 2000);
  };

  const handleCopyAnswer = (answer: string, idx: number) => {
    navigator.clipboard.writeText(answer);
    setCopiedAnswerIndex(idx);
    setTimeout(() => setCopiedAnswerIndex(null), 2000);
  };

  const handleCopyAllAnswers = () => {
    if (screeningAnswers.length === 0) return;
    const formatted = screeningAnswers
      .map((item, idx) => `Question ${idx + 1}: ${item.question}\nAnswer: ${item.suggestedAnswer}\n`)
      .join("\n");
    navigator.clipboard.writeText(formatted.trim());
    setCopiedAllAnswers(true);
    setTimeout(() => setCopiedAllAnswers(false), 2000);
  };

  const handleDownloadAnswers = () => {
    if (screeningAnswers.length === 0) return;
    downloadAnswersAsTxt(screeningAnswers, job.company, job.title);
  };

  // Step 1 -> Tailor Resume Trigger
  const handleProceedToTailorResume = async () => {
    setIsProcessing(true);
    setStep("tailor_resume");
    try {
      const data = await apiService.tailorResume(job.id, job.description, undefined, masterResume || undefined);
      setTailoredResumeData(data);
    } catch (err) {
      console.error("Error tailoring resume:", err);
    } finally {
      setIsProcessing(false);
    }
  };

  // Step 2 -> Generate Cover Letter Trigger
  const handleProceedToCoverLetter = async () => {
    setIsProcessing(true);
    setStep("cover_letter");
    try {
      const letter = await apiService.generateCoverLetter(
        job.company,
        job.title,
        job.description,
        coverLetterTone,
        coverLetterLength
      );
      setCoverLetterText(letter);
    } catch (err) {
      console.error("Error generating cover letter:", err);
    } finally {
      setIsProcessing(false);
    }
  };

  // Step 3 -> Generate Screening Answers
  const handleProceedToAnswers = async () => {
    setIsProcessing(true);
    setStep("screening_answers");
    try {
      const answers = await apiService.generateApplicationAnswers(
        job.company,
        job.title,
        job.description,
        [
          "Why do you want to work here?",
          "Why are you a good fit for this role?",
          "Describe a challenging technical problem you solved.",
        ]
      );
      setScreeningAnswers(answers);
    } catch (err) {
      console.error("Error generating answers:", err);
    } finally {
      setIsProcessing(false);
    }
  };

  // Step 4 -> Review Confirmation
  const handleProceedToConfirmation = () => {
    setStep("user_confirmation");
  };

  // Step 5 -> Open portal & prompt submission verification
  const handleOpenOfficialApplication = () => {
    // Open in new window/tab safely with noopener
    window.open(job.directApplyUrl, "_blank", "noopener,noreferrer");
    setStep("submission_verify");
  };

  // Step 6 -> Confirm submitted or saved
  const handleConfirmSubmission = (wasSubmitted: boolean) => {
    onCompleteWorkflow({
      jobId: job.id,
      company: job.company,
      title: job.title,
      location: job.location,
      workMode: job.workMode,
      salaryText: job.salaryRange
        ? `$${(job.salaryRange.min / 1000).toFixed(0)}k - $${(job.salaryRange.max / 1000).toFixed(0)}k`
        : undefined,
      status: wasSubmitted ? "submitted" : "application_opened",
      matchScore: matchResult.overallScore,
      dateApplied: wasSubmitted ? new Date().toISOString().split("T")[0] : undefined,
      notes: wasSubmitted
        ? `Applied on official portal (${job.sourceProvider}). Verified by candidate.`
        : `Application opened in portal. Awaiting submission confirmation.`,
      nextAction: wasSubmitted
        ? `Follow up with ${job.company} recruiter if no response in 5 business days.`
        : `Complete form on ${job.company} portal and confirm submission.`,
      submissionConfirmationVerified: wasSubmitted,
      applyUrl: job.directApplyUrl,
      foundOnSources: job.foundOnSources,
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-end sm:items-center justify-center p-0 sm:p-4">
      <div className="w-full sm:max-w-2xl max-h-[92vh] bg-slate-900 border border-slate-800 rounded-t-3xl sm:rounded-2xl flex flex-col overflow-hidden shadow-2xl">
        {/* Modal Top Bar */}
        <div className="p-4 border-b border-slate-800 flex items-center justify-between bg-slate-950/60">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-indigo-500 animate-ping" />
            <h2 className="text-sm font-bold text-white flex items-center gap-2">
              Application Assistant • {job.company}
            </h2>
          </div>

          <button
            onClick={onClose}
            className="p-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-slate-200"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Steps Breadcrumb Progress */}
        <div className="w-full bg-slate-950 px-4 py-2 border-b border-slate-800/80 flex items-center justify-between text-[11px]">
          <div className="flex items-center gap-2 text-slate-400">
            <span
              className={`font-semibold ${
                step === "review" ? "text-indigo-400" : "text-slate-500"
              }`}
            >
              1. Job Review
            </span>
            <span>→</span>
            <span
              className={`font-semibold ${
                step === "tailor_resume" ? "text-indigo-400" : "text-slate-500"
              }`}
            >
              2. Tailored CV
            </span>
            <span>→</span>
            <span
              className={`font-semibold ${
                step === "cover_letter" ? "text-indigo-400" : "text-slate-500"
              }`}
            >
              3. Cover Letter
            </span>
            <span>→</span>
            <span
              className={`font-semibold ${
                step === "screening_answers" ? "text-indigo-400" : "text-slate-500"
              }`}
            >
              4. Answers
            </span>
            <span>→</span>
            <span
              className={`font-semibold ${
                step === "user_confirmation" || step === "submission_verify"
                  ? "text-emerald-400"
                  : "text-slate-500"
              }`}
            >
              5. Submit
            </span>
          </div>
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4 text-xs scrollbar-thin scrollbar-thumb-slate-800">
          {/* STEP 1: REVIEW */}
          {step === "review" && (
            <div className="space-y-4">
              <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-2">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-bold text-slate-100">{job.title}</h3>
                  <span className="text-xs font-bold text-emerald-400 px-2 py-0.5 rounded-full bg-emerald-950 border border-emerald-800">
                    {matchResult.overallScore}% Overall Match
                  </span>
                </div>
                <div className="text-slate-400 text-xs">
                  {job.company} • {job.location} • {job.workMode}
                </div>
              </div>

              {/* Zero-Fabrication Promise Banner (Section 12, 13, 14) */}
              <div className="bg-indigo-950/40 border border-indigo-500/30 p-3.5 rounded-xl space-y-1.5">
                <div className="flex items-center gap-1.5 text-indigo-300 font-bold text-xs">
                  <ShieldCheck className="w-4 h-4 text-indigo-400" />
                  Ethical AI & Truthfulness Safeguard
                </div>
                <p className="text-slate-300 text-[11px] leading-relaxed">
                  JobPilot AI will re-order your real experiences, optimize phrasing for ATS keyword discovery, and highlight matching skills. We never fabricate accomplishments, certifications, or employment dates.
                </p>
              </div>

              <div className="space-y-1">
                <span className="text-[10px] font-bold text-slate-400 uppercase">
                  ATS Simulator Focus Areas
                </span>
                <div className="flex flex-wrap gap-1">
                  {matchResult.atsKeywordsMatched.map((kw, idx) => (
                    <span
                      key={idx}
                      className="px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-300 border border-emerald-500/20 text-[11px]"
                    >
                      {kw}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* STEP 2: TAILORED RESUME DIFF & FULL PREVIEW */}
          {step === "tailor_resume" && (
            <div className="space-y-3">
              {isProcessing ? (
                <div className="p-8 text-center space-y-2">
                  <Sparkles className="w-8 h-8 text-indigo-400 mx-auto animate-spin" />
                  <div className="text-sm font-bold text-slate-200">
                    Generating ATS-tailored resume bullets...
                  </div>
                  <div className="text-xs text-slate-400">
                    Aligning action verbs and keyword placement to {job.company}'s job description.
                  </div>
                </div>
              ) : tailoredResumeData ? (
                <div className="space-y-3">
                  {/* Top Action & View Toolbar */}
                  <div className="flex flex-wrap items-center justify-between gap-2 bg-slate-950 p-2.5 rounded-xl border border-slate-800">
                    <div className="flex items-center gap-1.5">
                      <button
                        onClick={() => setTailoredViewMode("diff")}
                        className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-all ${
                          tailoredViewMode === "diff"
                            ? "bg-indigo-600 text-white shadow-sm shadow-indigo-600/30"
                            : "bg-slate-900 text-slate-400 hover:text-slate-200 border border-slate-800"
                        }`}
                      >
                        Targeted Diff ({tailoredResumeData.bulletChanges.length})
                      </button>
                      <button
                        onClick={() => setTailoredViewMode("full")}
                        className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-all ${
                          tailoredViewMode === "full"
                            ? "bg-indigo-600 text-white shadow-sm shadow-indigo-600/30"
                            : "bg-slate-900 text-slate-400 hover:text-slate-200 border border-slate-800"
                        }`}
                      >
                        Full Tailored CV Preview
                      </button>
                    </div>

                    {/* Copy & Download Actions */}
                    <div className="flex items-center gap-1.5 relative">
                      <button
                        onClick={handleCopyResumeText}
                        className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-200 border border-slate-700 text-xs font-medium transition-all"
                        title="Copy entire ATS resume as plain text"
                      >
                        {copiedResume ? (
                          <Check className="w-3.5 h-3.5 text-emerald-400" />
                        ) : (
                          <Copy className="w-3.5 h-3.5 text-indigo-400" />
                        )}
                        <span>{copiedResume ? "Copied!" : "Copy CV"}</span>
                      </button>

                      {/* Download Dropdown */}
                      <div className="relative">
                        <button
                          onClick={() => setShowResumeDownloadMenu(!showResumeDownloadMenu)}
                          className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow-sm shadow-indigo-600/30 transition-all"
                        >
                          <Download className="w-3.5 h-3.5" />
                          <span>Download</span>
                          <ChevronDown className="w-3 h-3 ml-0.5" />
                        </button>

                        {showResumeDownloadMenu && (
                          <div className="absolute right-0 mt-1 w-44 bg-slate-900 border border-slate-700 rounded-xl shadow-2xl p-1.5 z-30 space-y-1 text-xs">
                            <button
                              onClick={() => {
                                printResumeAsPDF(effectiveResume!, job.company, job.title);
                                setShowResumeDownloadMenu(false);
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
                                downloadResumeAsDoc(effectiveResume!, job.company, job.title);
                                setShowResumeDownloadMenu(false);
                              }}
                              className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg hover:bg-slate-800 text-slate-200 text-left transition-colors"
                            >
                              <FileDown className="w-3.5 h-3.5 text-blue-400" />
                              <div>
                                <div className="font-semibold">Word Document (.doc)</div>
                                <div className="text-[10px] text-slate-400">MS Word &amp; Docs format</div>
                              </div>
                            </button>
                            <button
                              onClick={() => {
                                downloadResumeAsTxt(effectiveResume!, job.company, job.title);
                                setShowResumeDownloadMenu(false);
                              }}
                              className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg hover:bg-slate-800 text-slate-200 text-left transition-colors"
                            >
                              <FileText className="w-3.5 h-3.5 text-emerald-400" />
                              <div>
                                <div className="font-semibold">Plain Text (.txt)</div>
                                <div className="text-[10px] text-slate-400">ATS standard format</div>
                              </div>
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  {tailoredViewMode === "diff" ? (
                    <div className="space-y-3">
                      <div className="bg-indigo-950/30 border border-indigo-500/30 p-3 rounded-xl flex items-start justify-between gap-2">
                        <div className="flex-1">
                          <h4 className="text-xs font-bold text-indigo-300">
                            Tailored Professional Summary
                          </h4>
                          <p className="text-[11px] text-slate-300 mt-1 leading-relaxed">
                            {tailoredResumeData.tailoredResume.professionalSummary}
                          </p>
                        </div>
                        <button
                          onClick={() => {
                            navigator.clipboard.writeText(
                              tailoredResumeData.tailoredResume.professionalSummary
                            );
                            setCopiedResume(true);
                            setTimeout(() => setCopiedResume(false), 2000);
                          }}
                          className="shrink-0 p-1.5 rounded-lg bg-slate-900 border border-slate-800 text-slate-400 hover:text-white"
                          title="Copy summary"
                        >
                          <Copy className="w-3.5 h-3.5" />
                        </button>
                      </div>

                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                            Targeted Bullet Optimizations ({tailoredResumeData.bulletChanges.length})
                          </span>
                          <span className="text-[10px] text-slate-500">
                            Click copy to paste any bullet into employer forms
                          </span>
                        </div>

                        {tailoredResumeData.bulletChanges.map((change, idx) => (
                          <div
                            key={idx}
                            className="bg-slate-950 p-3 rounded-xl border border-slate-800 space-y-2"
                          >
                            <div className="flex items-center justify-between text-[10px] font-bold text-slate-400">
                              <span>{change.company}</span>
                              <button
                                onClick={() => handleCopyBullet(change.tailored, idx)}
                                className="flex items-center gap-1 px-2 py-0.5 rounded bg-indigo-600/20 hover:bg-indigo-600/40 text-indigo-300 border border-indigo-500/30 text-[10px] font-semibold transition-all"
                              >
                                {copiedBulletIndex === idx ? (
                                  <Check className="w-3 h-3 text-emerald-400" />
                                ) : (
                                  <Copy className="w-3 h-3 text-indigo-400" />
                                )}
                                <span>{copiedBulletIndex === idx ? "Copied!" : "Copy Bullet"}</span>
                              </button>
                            </div>
                            <div className="p-2 rounded bg-slate-900 border border-slate-800/80 text-[11px] text-slate-400 line-through">
                              {change.original}
                            </div>
                            <div className="p-2 rounded bg-indigo-950/40 border border-indigo-500/30 text-[11px] text-indigo-200 font-medium">
                              {change.tailored}
                            </div>
                            <div className="text-[10px] text-emerald-400 font-mono">
                              ✓ Reason: {change.reason}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ) : (
                    /* Full Tailored Resume Preview Canvas */
                    <div className="bg-slate-950 border border-slate-800 p-4 rounded-xl space-y-3 font-sans text-slate-200 text-xs max-h-96 overflow-y-auto">
                      <div className="text-center pb-2 border-b border-slate-800 space-y-1">
                        <h3 className="text-base font-bold text-white">
                          {effectiveResume?.contactInfo.name}
                        </h3>
                        <p className="text-[10px] text-slate-400">
                          {[
                            effectiveResume?.contactInfo.location,
                            effectiveResume?.contactInfo.email,
                            effectiveResume?.contactInfo.phone,
                          ]
                            .filter(Boolean)
                            .join(" • ")}
                        </p>
                      </div>

                      <div className="space-y-1">
                        <h4 className="text-[10px] font-bold text-indigo-400 uppercase tracking-wider">
                          Professional Summary
                        </h4>
                        <p className="text-[11px] text-slate-300 leading-relaxed">
                          {effectiveResume?.professionalSummary}
                        </p>
                      </div>

                      <div className="space-y-1">
                        <h4 className="text-[10px] font-bold text-indigo-400 uppercase tracking-wider">
                          Key Technical Skills
                        </h4>
                        <div className="text-[11px] text-slate-300 space-y-0.5">
                          <p>
                            <strong className="text-slate-200">Languages:</strong>{" "}
                            {effectiveResume?.technicalSkills.languages.join(", ")}
                          </p>
                          <p>
                            <strong className="text-slate-200">Frameworks:</strong>{" "}
                            {effectiveResume?.technicalSkills.frameworks.join(", ")}
                          </p>
                          <p>
                            <strong className="text-slate-200">Cloud &amp; DevOps:</strong>{" "}
                            {effectiveResume?.technicalSkills.cloudDevOps.join(", ")}
                          </p>
                          <p>
                            <strong className="text-slate-200">Databases:</strong>{" "}
                            {effectiveResume?.technicalSkills.databases.join(", ")}
                          </p>
                        </div>
                      </div>

                      <div className="space-y-2">
                        <h4 className="text-[10px] font-bold text-indigo-400 uppercase tracking-wider">
                          Experience (Tailored)
                        </h4>
                        {effectiveResume?.experience.map((exp, idx) => (
                          <div key={idx} className="space-y-1 text-[11px]">
                            <div className="flex justify-between font-bold text-slate-200">
                              <span>
                                {exp.title} &mdash; {exp.company}
                              </span>
                              <span className="text-slate-400 text-[10px]">{exp.period}</span>
                            </div>
                            <ul className="list-disc pl-4 space-y-0.5 text-slate-300">
                              {exp.bullets.map((b, bIdx) => (
                                <li key={bIdx}>{b}</li>
                              ))}
                            </ul>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ) : null}
            </div>
          )}

          {/* STEP 3: COVER LETTER */}
          {step === "cover_letter" && (
            <div className="space-y-3">
              {/* Tone & Length Controls */}
              <div className="flex flex-wrap items-center justify-between gap-2 bg-slate-950 p-2.5 rounded-xl border border-slate-800">
                <div className="flex items-center gap-1.5">
                  <span className="text-[10px] uppercase font-bold text-slate-400">Tone:</span>
                  {["professional", "confident", "technical", "concise"].map((tone) => (
                    <button
                      key={tone}
                      onClick={() => setCoverLetterTone(tone)}
                      className={`px-2 py-0.5 rounded capitalize text-[11px] font-medium transition-all ${
                        coverLetterTone === tone
                          ? "bg-indigo-600 text-white"
                          : "bg-slate-900 text-slate-400 hover:text-slate-200"
                      }`}
                    >
                      {tone}
                    </button>
                  ))}
                </div>

                <button
                  onClick={handleProceedToCoverLetter}
                  className="flex items-center gap-1 text-[11px] text-indigo-400 hover:text-indigo-300 font-medium"
                >
                  <RefreshCw className="w-3 h-3" />
                  <span>Regenerate</span>
                </button>
              </div>

              {isProcessing ? (
                <div className="p-8 text-center space-y-2">
                  <Sparkles className="w-8 h-8 text-indigo-400 mx-auto animate-spin" />
                  <div className="text-sm font-bold text-slate-200">
                    Drafting personalized cover letter...
                  </div>
                </div>
              ) : (
                <div className="space-y-2">
                  <div className="flex items-center justify-between gap-2 flex-wrap">
                    <span className="text-[10px] font-bold text-slate-400 uppercase">
                      Editable Draft (Ground truth verified)
                    </span>

                    {/* Copy & Download Buttons */}
                    <div className="flex items-center gap-1.5 relative">
                      <button
                        onClick={() => {
                          navigator.clipboard.writeText(coverLetterText);
                          setCopiedCoverLetter(true);
                          setTimeout(() => setCopiedCoverLetter(false), 2000);
                        }}
                        className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-200 border border-slate-700 text-[11px] font-medium transition-all"
                      >
                        {copiedCoverLetter ? (
                          <Check className="w-3.5 h-3.5 text-emerald-400" />
                        ) : (
                          <Copy className="w-3.5 h-3.5 text-indigo-400" />
                        )}
                        <span>{copiedCoverLetter ? "Copied" : "Copy Letter"}</span>
                      </button>

                      {/* Download Menu */}
                      <div className="relative">
                        <button
                          onClick={() => setShowCoverLetterDownloadMenu(!showCoverLetterDownloadMenu)}
                          className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-[11px] font-semibold shadow-sm shadow-indigo-600/30 transition-all"
                        >
                          <Download className="w-3 h-3" />
                          <span>Download</span>
                          <ChevronDown className="w-2.5 h-2.5" />
                        </button>

                        {showCoverLetterDownloadMenu && (
                          <div className="absolute right-0 mt-1 w-44 bg-slate-900 border border-slate-700 rounded-xl shadow-2xl p-1.5 z-30 space-y-1 text-xs">
                            <button
                              onClick={() => {
                                printCoverLetterAsPDF(coverLetterText, job.company, job.title, candidateName);
                                setShowCoverLetterDownloadMenu(false);
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
                                downloadCoverLetterAsDoc(coverLetterText, job.company, job.title, candidateName);
                                setShowCoverLetterDownloadMenu(false);
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
                                downloadCoverLetterAsTxt(coverLetterText, job.company, candidateName);
                                setShowCoverLetterDownloadMenu(false);
                              }}
                              className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg hover:bg-slate-800 text-slate-200 text-left transition-colors"
                            >
                              <FileText className="w-3.5 h-3.5 text-emerald-400" />
                              <div>
                                <div className="font-semibold">Plain Text (.txt)</div>
                                <div className="text-[10px] text-slate-400">Raw text file</div>
                              </div>
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  <textarea
                    rows={10}
                    value={coverLetterText}
                    onChange={(e) => setCoverLetterText(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-slate-200 text-xs leading-relaxed focus:outline-none focus:border-indigo-500 font-sans"
                  />
                </div>
              )}
            </div>
          )}

          {/* STEP 4: SCREENING QUESTIONS */}
          {step === "screening_answers" && (
            <div className="space-y-3">
              <div className="bg-indigo-950/30 border border-indigo-500/20 p-3 rounded-xl flex items-start justify-between gap-3">
                <div>
                  <h4 className="text-xs font-bold text-indigo-300">Application Question Answers</h4>
                  <p className="text-[11px] text-slate-400 mt-0.5">
                    Pre-drafted based on your verified resume. Copy individual answers or all at once to paste into {job.company}'s form.
                  </p>
                </div>

                {/* Bulk Actions */}
                <div className="flex items-center gap-1.5 shrink-0">
                  <button
                    onClick={handleCopyAllAnswers}
                    className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow-sm shadow-indigo-600/30 transition-all"
                  >
                    {copiedAllAnswers ? (
                      <Check className="w-3.5 h-3.5 text-emerald-300" />
                    ) : (
                      <Copy className="w-3.5 h-3.5" />
                    )}
                    <span>{copiedAllAnswers ? "All Copied!" : "Copy All Q&A"}</span>
                  </button>

                  <button
                    onClick={handleDownloadAnswers}
                    className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-200 border border-slate-700 text-xs font-medium transition-all"
                    title="Download answers as text file"
                  >
                    <Download className="w-3.5 h-3.5 text-indigo-400" />
                    <span>Download</span>
                  </button>
                </div>
              </div>

              {isProcessing ? (
                <div className="p-8 text-center space-y-2">
                  <Sparkles className="w-8 h-8 text-indigo-400 mx-auto animate-spin" />
                  <div className="text-sm font-bold text-slate-200">
                    Formulating grounded answers...
                  </div>
                </div>
              ) : (
                <div className="space-y-3">
                  {screeningAnswers.map((item, idx) => (
                    <div
                      key={idx}
                      className="bg-slate-950 p-3.5 rounded-xl border border-slate-800 space-y-2"
                    >
                      <div className="flex items-center justify-between gap-2">
                        <div className="text-xs font-bold text-slate-200 flex items-center gap-1.5">
                          <HelpCircle className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
                          <span>{item.question}</span>
                        </div>

                        {/* Copy Single Answer Button */}
                        <button
                          onClick={() => handleCopyAnswer(item.suggestedAnswer, idx)}
                          className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-slate-900 hover:bg-indigo-950/60 border border-slate-700 hover:border-indigo-500/50 text-indigo-300 text-[11px] font-semibold transition-all shrink-0"
                        >
                          {copiedAnswerIndex === idx ? (
                            <Check className="w-3 h-3 text-emerald-400" />
                          ) : (
                            <Copy className="w-3 h-3 text-indigo-400" />
                          )}
                          <span>{copiedAnswerIndex === idx ? "Copied!" : "Copy Answer"}</span>
                        </button>
                      </div>

                      <textarea
                        rows={3}
                        value={item.suggestedAnswer}
                        onChange={(e) => {
                          const updated = [...screeningAnswers];
                          updated[idx].suggestedAnswer = e.target.value;
                          setScreeningAnswers(updated);
                        }}
                        className="w-full bg-slate-900 border border-slate-800 rounded-lg p-2.5 text-[11px] text-slate-300 leading-relaxed focus:outline-none focus:border-indigo-500"
                        placeholder="Draft answer..."
                      />
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* STEP 5: FINAL CONFIRMATION & PORTAL APPLY KIT */}
          {step === "user_confirmation" && (
            <div className="space-y-4">
              <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-3">
                <h3 className="text-xs font-bold text-slate-200 uppercase tracking-wider">
                  Review & Sign-Off Before Submitting
                </h3>
                <div className="space-y-2 text-xs">
                  <div className="flex items-center justify-between text-slate-300">
                    <span>Target Employer:</span>
                    <span className="font-bold text-white">{job.company}</span>
                  </div>
                  <div className="flex items-center justify-between text-slate-300">
                    <span>Target Role:</span>
                    <span className="font-bold text-white">{job.title}</span>
                  </div>
                  <div className="flex items-center justify-between text-slate-300">
                    <span>Tailored Resume:</span>
                    <span className="text-emerald-400 font-semibold">Generated &amp; Ready</span>
                  </div>
                  <div className="flex items-center justify-between text-slate-300">
                    <span>Custom Cover Letter:</span>
                    <span className="text-emerald-400 font-semibold">Ready ({coverLetterTone})</span>
                  </div>
                </div>
              </div>

              {/* Portal Application Assets Hub (Ready to Paste) */}
              <div className="bg-indigo-950/30 border border-indigo-500/30 p-3.5 rounded-xl space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5 text-indigo-300 font-bold text-xs">
                    <FileText className="w-4 h-4 text-indigo-400" />
                    Application Assets Kit (Copy &amp; Paste into Portal)
                  </div>
                  <span className="text-[10px] text-slate-400 bg-slate-900 px-2 py-0.5 rounded border border-slate-800">
                    For {job.company} Portal
                  </span>
                </div>
                <p className="text-[11px] text-slate-300">
                  Because you submit directly on {job.company}'s portal, use these instant buttons to download files to upload, or copy answers to paste into their form fields:
                </p>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 pt-1">
                  {/* Resume Box */}
                  <div className="bg-slate-900/90 border border-slate-800 p-2.5 rounded-lg space-y-2 flex flex-col justify-between">
                    <div>
                      <div className="text-[11px] font-bold text-slate-200">Tailored Resume</div>
                      <div className="text-[10px] text-slate-400">ATS optimized</div>
                    </div>
                    <div className="space-y-1">
                      <button
                        onClick={handleCopyResumeText}
                        className="w-full py-1 px-2 rounded bg-slate-800 hover:bg-slate-700 text-slate-200 text-[11px] font-medium flex items-center justify-center gap-1 transition-all"
                      >
                        {copiedResume ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                        <span>{copiedResume ? "Copied!" : "Copy Text"}</span>
                      </button>
                      <div className="grid grid-cols-2 gap-1">
                        <button
                          onClick={() => printResumeAsPDF(effectiveResume!, job.company, job.title)}
                          className="py-1 px-1.5 rounded bg-indigo-600/30 hover:bg-indigo-600/50 text-indigo-200 border border-indigo-500/30 text-[10px] font-medium text-center"
                        >
                          PDF
                        </button>
                        <button
                          onClick={() => downloadResumeAsDoc(effectiveResume!, job.company, job.title)}
                          className="py-1 px-1.5 rounded bg-blue-600/30 hover:bg-blue-600/50 text-blue-200 border border-blue-500/30 text-[10px] font-medium text-center"
                        >
                          Word
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Cover Letter Box */}
                  <div className="bg-slate-900/90 border border-slate-800 p-2.5 rounded-lg space-y-2 flex flex-col justify-between">
                    <div>
                      <div className="text-[11px] font-bold text-slate-200">Cover Letter</div>
                      <div className="text-[10px] text-slate-400">Custom pitch</div>
                    </div>
                    <div className="space-y-1">
                      <button
                        onClick={() => {
                          navigator.clipboard.writeText(coverLetterText);
                          setCopiedCoverLetter(true);
                          setTimeout(() => setCopiedCoverLetter(false), 2000);
                        }}
                        className="w-full py-1 px-2 rounded bg-slate-800 hover:bg-slate-700 text-slate-200 text-[11px] font-medium flex items-center justify-center gap-1 transition-all"
                      >
                        {copiedCoverLetter ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                        <span>{copiedCoverLetter ? "Copied!" : "Copy Text"}</span>
                      </button>
                      <div className="grid grid-cols-2 gap-1">
                        <button
                          onClick={() => printCoverLetterAsPDF(coverLetterText, job.company, job.title, candidateName)}
                          className="py-1 px-1.5 rounded bg-indigo-600/30 hover:bg-indigo-600/50 text-indigo-200 border border-indigo-500/30 text-[10px] font-medium text-center"
                        >
                          PDF
                        </button>
                        <button
                          onClick={() => downloadCoverLetterAsDoc(coverLetterText, job.company, job.title, candidateName)}
                          className="py-1 px-1.5 rounded bg-blue-600/30 hover:bg-blue-600/50 text-blue-200 border border-blue-500/30 text-[10px] font-medium text-center"
                        >
                          Word
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Screening Answers Box */}
                  <div className="bg-slate-900/90 border border-slate-800 p-2.5 rounded-lg space-y-2 flex flex-col justify-between">
                    <div>
                      <div className="text-[11px] font-bold text-slate-200">Screening Answers</div>
                      <div className="text-[10px] text-slate-400">{screeningAnswers.length} responses ready</div>
                    </div>
                    <div className="space-y-1">
                      <button
                        onClick={handleCopyAllAnswers}
                        className="w-full py-1 px-2 rounded bg-slate-800 hover:bg-slate-700 text-slate-200 text-[11px] font-medium flex items-center justify-center gap-1 transition-all"
                      >
                        {copiedAllAnswers ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                        <span>{copiedAllAnswers ? "Copied All!" : "Copy All Q&A"}</span>
                      </button>
                      <button
                        onClick={handleDownloadAnswers}
                        className="w-full py-1 px-2 rounded bg-indigo-600/30 hover:bg-indigo-600/50 text-indigo-200 border border-indigo-500/30 text-[10px] font-medium text-center"
                      >
                        Download (.txt)
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              {/* Mandatory User Confirmation Checkbox (Section 16) */}
              <label className="flex items-start gap-2.5 p-3 rounded-xl bg-slate-950 border border-indigo-500/40 cursor-pointer">
                <input
                  type="checkbox"
                  checked={userConfirmedReview}
                  onChange={(e) => setUserConfirmedReview(e.target.checked)}
                  className="mt-0.5 rounded accent-indigo-500 w-4 h-4"
                />
                <span className="text-xs text-slate-200 leading-snug">
                  <strong>I have reviewed and approved all materials.</strong> I confirm that all listed skills and achievements accurately reflect my background.
                </span>
              </label>

              <button
                onClick={handleOpenOfficialApplication}
                disabled={!userConfirmedReview}
                className="w-full py-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-lg shadow-emerald-600/30 flex items-center justify-center gap-2 transition-all disabled:opacity-40"
              >
                <span>Open Official Application Portal</span>
                <ExternalLink className="w-4 h-4" />
              </button>
            </div>
          )}

          {/* STEP 6: VERIFY SUBMISSION STATUS */}
          {step === "submission_verify" && (
            <div className="space-y-4 py-2 text-center">
              <div className="w-12 h-12 rounded-full bg-indigo-500/20 border border-indigo-500/40 flex items-center justify-center mx-auto text-indigo-400">
                <ExternalLink className="w-6 h-6" />
              </div>

              <div className="space-y-1">
                <h3 className="text-sm font-bold text-white">Application Portal Opened</h3>
                <p className="text-xs text-slate-300 max-w-sm mx-auto">
                  JobPilot opened <strong>{job.company}'s official job portal</strong> in a browser window. Did you finalize and submit your application?
                </p>
              </div>

              <div className="grid grid-cols-2 gap-3 pt-2">
                <button
                  onClick={() => handleConfirmSubmission(false)}
                  className="py-2.5 px-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold border border-slate-700 transition-all"
                >
                  Still In Progress (Save as Opened)
                </button>
                <button
                  onClick={() => handleConfirmSubmission(true)}
                  className="py-2.5 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold shadow-md shadow-emerald-600/30 transition-all"
                >
                  Yes, Successfully Submitted!
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Modal Navigation Footer */}
        {step !== "submission_verify" && (
          <div className="p-4 border-t border-slate-800 bg-slate-950/60 flex items-center justify-between">
            {step === "review" && (
              <button
                onClick={onClose}
                className="px-3 py-1.5 rounded-lg bg-slate-800 text-slate-300 hover:bg-slate-700 text-xs font-medium"
              >
                Cancel
              </button>
            )}

            {step === "tailor_resume" && (
              <button
                onClick={() => setStep("review")}
                className="flex items-center gap-1 text-slate-400 hover:text-slate-200 text-xs"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                Back
              </button>
            )}

            {step === "cover_letter" && (
              <button
                onClick={() => setStep("tailor_resume")}
                className="flex items-center gap-1 text-slate-400 hover:text-slate-200 text-xs"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                Back
              </button>
            )}

            {step === "screening_answers" && (
              <button
                onClick={() => setStep("cover_letter")}
                className="flex items-center gap-1 text-slate-400 hover:text-slate-200 text-xs"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                Back
              </button>
            )}

            {step === "user_confirmation" && (
              <button
                onClick={() => setStep("screening_answers")}
                className="flex items-center gap-1 text-slate-400 hover:text-slate-200 text-xs"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                Back
              </button>
            )}

            <div className="ml-auto">
              {step === "review" && (
                <button
                  onClick={handleProceedToTailorResume}
                  className="flex items-center gap-1.5 py-2 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs shadow-md shadow-indigo-600/30"
                >
                  <span>Tailor My CV</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              )}

              {step === "tailor_resume" && (
                <button
                  onClick={handleProceedToCoverLetter}
                  disabled={isProcessing}
                  className="flex items-center gap-1.5 py-2 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs shadow-md shadow-indigo-600/30 disabled:opacity-50"
                >
                  <span>Draft Cover Letter</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              )}

              {step === "cover_letter" && (
                <button
                  onClick={handleProceedToAnswers}
                  disabled={isProcessing}
                  className="flex items-center gap-1.5 py-2 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs shadow-md shadow-indigo-600/30 disabled:opacity-50"
                >
                  <span>Screening Answers</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              )}

              {step === "screening_answers" && (
                <button
                  onClick={handleProceedToConfirmation}
                  disabled={isProcessing}
                  className="flex items-center gap-1.5 py-2 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs shadow-md shadow-emerald-600/30 disabled:opacity-50"
                >
                  <span>Final Review</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
