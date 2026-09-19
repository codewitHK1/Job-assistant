import React, { useState, useEffect } from "react";
import {
  X,
  Sparkles,
  ShieldCheck,
  CheckCircle2,
  AlertTriangle,
  ExternalLink,
  Briefcase,
  MapPin,
  DollarSign,
  ArrowRight,
  TrendingUp,
  Bookmark,
  Share2,
  Upload,
} from "lucide-react";
import { JobListing, JobMatchResult, ParsedResumeResult } from "../types/jobpilot.ts";
import { apiService } from "../services/api.ts";

interface JobDetailModalProps {
  job: JobListing | null;
  resume: ParsedResumeResult | null;
  onClose: () => void;
  onStartWorkflow: (job: JobListing, matchResult: JobMatchResult) => void;
  onSaveToApplications: (job: JobListing, matchScore: number) => void;
  onNavigateToResume?: () => void;
}

export const JobDetailModal: React.FC<JobDetailModalProps> = ({
  job,
  resume,
  onClose,
  onStartWorkflow,
  onSaveToApplications,
  onNavigateToResume,
}) => {
  const [matchResult, setMatchResult] = useState<JobMatchResult | null>(null);
  const [isLoadingMatch, setIsLoadingMatch] = useState(true);
  const [activeTab, setActiveTab] = useState<"match" | "description" | "ats">("match");
  const [isSaved, setIsSaved] = useState(false);

  useEffect(() => {
    if (!job) return;

    if (!resume) {
      setIsLoadingMatch(false);
      setMatchResult(null);
      return;
    }

    let isMounted = true;
    setIsLoadingMatch(true);

    apiService
      .matchJob(job.id, resume)
      .then((data) => {
        if (isMounted) {
          setMatchResult(data.match);
          setIsLoadingMatch(false);
        }
      })
      .catch((err) => {
        console.warn("Could not calculate job match:", err);
        if (isMounted) setIsLoadingMatch(false);
      });

    return () => {
      isMounted = false;
    };
  }, [job, resume]);

  if (!job) return null;

  const handleSave = () => {
    onSaveToApplications(job, matchResult ? matchResult.overallScore : 88);
    setIsSaved(true);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4">
      <div className="w-full sm:max-w-xl max-h-[92vh] bg-slate-900 border border-slate-800 rounded-t-3xl sm:rounded-2xl flex flex-col overflow-hidden shadow-2xl animate-in slide-in-from-bottom-6 duration-200">
        {/* Header */}
        <div className="p-4 border-b border-slate-800 flex items-start justify-between bg-slate-950/40">
          <div className="space-y-1 pr-4">
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-slate-300">{job.company}</span>
              <span className="text-[10px] px-1.5 py-0.2 rounded bg-slate-800 text-slate-400">
                {job.workMode}
              </span>
              {job.foundOnSources.length > 1 && (
                <span className="text-[9px] px-1.5 py-0.2 rounded bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
                  {job.foundOnSources.join(" + ")}
                </span>
              )}
            </div>
            <h2 className="text-base font-bold text-white">{job.title}</h2>
            <div className="flex items-center gap-3 text-xs text-slate-400">
              <span>{job.location}</span>
              {job.salaryRange && (
                <>
                  <span>•</span>
                  <span className="text-emerald-400 font-medium">
                    ${(job.salaryRange.min / 1000).toFixed(0)}k - ${(job.salaryRange.max / 1000).toFixed(0)}k
                  </span>
                </>
              )}
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg bg-slate-800/80 hover:bg-slate-700 text-slate-400 hover:text-slate-200 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Tab Controls */}
        <div className="flex border-b border-slate-800 bg-slate-950/20 px-4 pt-2 text-xs font-medium">
          <button
            onClick={() => setActiveTab("match")}
            className={`pb-2 px-3 border-b-2 transition-all ${
              activeTab === "match"
                ? "border-indigo-500 text-indigo-400 font-semibold"
                : "border-transparent text-slate-400 hover:text-slate-200"
            }`}
          >
            AI Match Breakdown
          </button>
          <button
            onClick={() => setActiveTab("ats")}
            className={`pb-2 px-3 border-b-2 transition-all ${
              activeTab === "ats"
                ? "border-indigo-500 text-indigo-400 font-semibold"
                : "border-transparent text-slate-400 hover:text-slate-200"
            }`}
          >
            ATS Simulator
          </button>
          <button
            onClick={() => setActiveTab("description")}
            className={`pb-2 px-3 border-b-2 transition-all ${
              activeTab === "description"
                ? "border-indigo-500 text-indigo-400 font-semibold"
                : "border-transparent text-slate-400 hover:text-slate-200"
            }`}
          >
            Job Description
          </button>
        </div>

        {/* Modal Scrollable Body */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4 text-xs scrollbar-thin scrollbar-thumb-slate-800">
          {/* TAB 1: MATCH BREAKDOWN */}
          {activeTab === "match" && (
            <div className="space-y-4">
              {/* Overall Score Header */}
              <div className="bg-slate-950/80 border border-slate-800 p-4 rounded-xl flex items-center justify-between">
                <div>
                  <span className="text-[10px] uppercase font-bold text-slate-400">
                    Calculated Job Match
                  </span>
                  <div className="text-2xl font-bold text-white flex items-center gap-2">
                    <span>
                      {matchResult
                        ? `${matchResult.overallScore}%`
                        : resume
                        ? (isLoadingMatch ? "Evaluating..." : "--")
                        : "--"}
                    </span>
                    {matchResult ? (
                      <span
                        className={`text-xs font-normal px-2 py-0.5 rounded-full border ${
                          matchResult.overallScore >= 80
                            ? "bg-emerald-950 text-emerald-400 border-emerald-800"
                            : matchResult.overallScore >= 60
                            ? "bg-indigo-950 text-indigo-400 border-indigo-800"
                            : "bg-amber-950 text-amber-400 border-amber-800"
                        }`}
                      >
                        {matchResult.overallScore >= 80
                          ? "Strong Fit"
                          : matchResult.overallScore >= 60
                          ? "Moderate Fit"
                          : "Skill Gap"}
                      </span>
                    ) : (
                      <span className="text-xs font-normal px-2 py-0.5 rounded-full bg-amber-950/70 text-amber-300 border border-amber-700/50">
                        {resume ? (isLoadingMatch ? "Analyzing" : "Awaiting Score") : "Upload CV Required"}
                      </span>
                    )}
                  </div>
                </div>

                <div className="text-right">
                  <span className="text-[10px] text-slate-400">Evaluated Candidate</span>
                  <div className="text-xs font-semibold text-indigo-300">
                    {resume ? resume.personalInfo.fullName : "None (Upload CV)"}
                  </div>
                </div>
              </div>

              {/* No CV Banner */}
              {!resume && (
                <div className="p-4 rounded-xl bg-gradient-to-r from-indigo-950/60 via-slate-900 to-indigo-950/40 border border-indigo-500/40 space-y-3 shadow-md">
                  <div className="flex items-start gap-3">
                    <div className="p-2 rounded-lg bg-indigo-500/20 text-indigo-300 shrink-0 mt-0.5">
                      <Sparkles className="w-4 h-4" />
                    </div>
                    <div className="space-y-1">
                      <h4 className="text-xs font-bold text-white">
                        Upload your CV to calculate your personalized ATS Match Score
                      </h4>
                      <p className="text-[11px] text-slate-300 leading-relaxed">
                        JobPilot AI performs a factual comparison between your uploaded CV and this job posting. We evaluate hard skills, experience depth, and ATS keywords with zero fabrication.
                      </p>
                    </div>
                  </div>
                  {onNavigateToResume && (
                    <button
                      type="button"
                      onClick={() => {
                        onClose();
                        onNavigateToResume();
                      }}
                      className="w-full py-2.5 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold flex items-center justify-center gap-2 shadow-md shadow-indigo-600/30 transition-all cursor-pointer"
                    >
                      <Upload className="w-3.5 h-3.5" />
                      <span>Upload CV to Unlock Match Score & Tailoring</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              )}

              {/* Required Skills from Job (Shown if no CV or in addition) */}
              {!resume && job.requiredSkills && job.requiredSkills.length > 0 && (
                <div className="space-y-2 bg-slate-900 border border-slate-800 p-3.5 rounded-xl">
                  <span className="text-[10px] font-bold text-slate-300 uppercase tracking-wider">
                    Skills Required for this Position ({job.requiredSkills.length})
                  </span>
                  <div className="flex flex-wrap gap-1.5 pt-1">
                    {job.requiredSkills.map((skill, idx) => (
                      <span
                        key={idx}
                        className="px-2 py-0.5 rounded-md bg-slate-800 text-indigo-300 border border-slate-700 text-xs font-medium"
                      >
                        {skill}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Breakdown Bars */}
              {matchResult && (
                <div className="space-y-2 bg-slate-900 border border-slate-800/80 p-3.5 rounded-xl">
                  <span className="text-[10px] font-bold text-slate-300 uppercase tracking-wider">
                    Score Breakdown
                  </span>
                  <div className="grid grid-cols-2 gap-3 pt-1">
                    <div>
                      <div className="flex justify-between text-[11px] mb-1">
                        <span className="text-slate-400">Skills Alignment</span>
                        <span className="font-bold text-slate-200">{matchResult.breakdown.skills}%</span>
                      </div>
                      <div className="w-full h-1.5 rounded-full bg-slate-800 overflow-hidden">
                        <div
                          className="h-full bg-indigo-500 rounded-full"
                          style={{ width: `${matchResult.breakdown.skills}%` }}
                        />
                      </div>
                    </div>

                    <div>
                      <div className="flex justify-between text-[11px] mb-1">
                        <span className="text-slate-400">Experience Match</span>
                        <span className="font-bold text-slate-200">{matchResult.breakdown.experience}%</span>
                      </div>
                      <div className="w-full h-1.5 rounded-full bg-slate-800 overflow-hidden">
                        <div
                          className="h-full bg-emerald-500 rounded-full"
                          style={{ width: `${matchResult.breakdown.experience}%` }}
                        />
                      </div>
                    </div>

                    <div>
                      <div className="flex justify-between text-[11px] mb-1">
                        <span className="text-slate-400">Seniority Level</span>
                        <span className="font-bold text-slate-200">{matchResult.breakdown.seniority}%</span>
                      </div>
                      <div className="w-full h-1.5 rounded-full bg-slate-800 overflow-hidden">
                        <div
                          className="h-full bg-sky-500 rounded-full"
                          style={{ width: `${matchResult.breakdown.seniority}%` }}
                        />
                      </div>
                    </div>

                    <div>
                      <div className="flex justify-between text-[11px] mb-1">
                        <span className="text-slate-400">Keywords Density</span>
                        <span className="font-bold text-slate-200">{matchResult.breakdown.keywords}%</span>
                      </div>
                      <div className="w-full h-1.5 rounded-full bg-slate-800 overflow-hidden">
                        <div
                          className="h-full bg-purple-500 rounded-full"
                          style={{ width: `${matchResult.breakdown.keywords}%` }}
                        />
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Strong Matches */}
              {matchResult && matchResult.strongMatches.length > 0 && (
                <div className="space-y-1.5">
                  <span className="text-[10px] font-bold text-emerald-400 uppercase tracking-wider flex items-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    Confirmed Qualifications
                  </span>
                  <div className="flex flex-wrap gap-1.5">
                    {matchResult.strongMatches.map((m, idx) => (
                      <span
                        key={idx}
                        className="px-2 py-0.5 rounded-md bg-emerald-500/10 text-emerald-300 border border-emerald-500/20 text-xs"
                      >
                        {m}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Missing Skills / Gaps */}
              {matchResult && matchResult.missingSkills.length > 0 && (
                <div className="space-y-1.5">
                  <span className="text-[10px] font-bold text-amber-400 uppercase tracking-wider flex items-center gap-1">
                    <AlertTriangle className="w-3.5 h-3.5" />
                    Missing Skills or Keywords
                  </span>
                  <div className="flex flex-wrap gap-1.5">
                    {matchResult.missingSkills.map((m, idx) => (
                      <span
                        key={idx}
                        className="px-2 py-0.5 rounded-md bg-amber-500/10 text-amber-300 border border-amber-500/20 text-xs"
                      >
                        {m}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Potential Concerns / Red Flags (Section 10) */}
              {matchResult && matchResult.potentialConcerns.length > 0 && (
                <div className="bg-red-950/20 border border-red-500/20 p-3 rounded-xl space-y-1">
                  <span className="text-[10px] font-bold text-red-400 uppercase tracking-wider flex items-center gap-1">
                    <AlertTriangle className="w-3.5 h-3.5 text-red-400" />
                    Potential Concerns & Honest Notes
                  </span>
                  <ul className="list-disc list-inside space-y-1 text-slate-300 text-[11px]">
                    {matchResult.potentialConcerns.map((c, idx) => (
                      <li key={idx}>{c}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}

          {/* TAB 2: ATS SIMULATOR */}
          {activeTab === "ats" && (
            matchResult ? (
              <div className="space-y-3">
                <div className="bg-indigo-950/30 border border-indigo-500/30 p-3 rounded-xl flex items-center justify-between">
                  <div>
                    <h4 className="text-xs font-bold text-indigo-300">ATS Parsing Simulation</h4>
                    <p className="text-[11px] text-slate-400">
                      Simulates applicant tracking parser extracting keywords from your CV.
                    </p>
                  </div>
                  <span className="text-xs font-bold text-emerald-400 bg-emerald-950 px-2 py-0.5 rounded border border-emerald-800">
                    {matchResult.breakdown.keywords}% Parsed
                  </span>
                </div>

                {/* Matched ATS Keywords */}
                <div className="space-y-1.5">
                  <span className="text-[10px] font-bold text-emerald-400 uppercase tracking-wider">
                    Keywords Matched ({matchResult.atsKeywordsMatched.length})
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

                {/* Missing ATS Keywords */}
                <div className="space-y-1.5">
                  <span className="text-[10px] font-bold text-amber-400 uppercase tracking-wider">
                    Missing Target ATS Keywords ({matchResult.atsKeywordsMissing.length})
                  </span>
                  <div className="flex flex-wrap gap-1">
                    {matchResult.atsKeywordsMissing.map((kw, idx) => (
                      <span
                        key={idx}
                        className="px-2 py-0.5 rounded bg-amber-500/10 text-amber-300 border border-amber-500/20 text-[11px]"
                      >
                        {kw}
                      </span>
                    ))}
                  </div>
                </div>

                <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 text-[11px] text-slate-400">
                  JobPilot will automatically emphasize your matching keywords in the tailored resume bullet points without fabricating unperformed work.
                </div>
              </div>
            ) : (
              <div className="space-y-3 p-6 rounded-xl bg-slate-950/60 border border-slate-800 text-center">
                <ShieldCheck className="w-8 h-8 text-indigo-400 mx-auto" />
                <h4 className="text-xs font-bold text-slate-200">
                  ATS Simulator Awaiting CV
                </h4>
                <p className="text-[11px] text-slate-400 max-w-sm mx-auto leading-relaxed">
                  Upload your CV to simulate enterprise applicant tracking parsers and check keyword match rates against this position.
                </p>
                {onNavigateToResume && (
                  <button
                    type="button"
                    onClick={() => {
                      onClose();
                      onNavigateToResume();
                    }}
                    className="mt-2 inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold transition-colors"
                  >
                    <Upload className="w-3.5 h-3.5" />
                    <span>Upload CV to Test ATS</span>
                  </button>
                )}
              </div>
            )
          )}

          {/* TAB 3: FULL JOB DESCRIPTION */}
          {activeTab === "description" && (
            <div className="space-y-3 leading-relaxed text-slate-300">
              <div>
                <h4 className="text-xs font-bold text-slate-200 uppercase tracking-wider mb-1">
                  About the Role
                </h4>
                <p className="text-slate-300 whitespace-pre-line text-xs">{job.description}</p>
              </div>

              <div>
                <h4 className="text-xs font-bold text-slate-200 uppercase tracking-wider mb-1">
                  Key Requirements
                </h4>
                <ul className="list-disc list-inside space-y-1 text-slate-300 text-xs">
                  {job.requirements.map((req, idx) => (
                    <li key={idx}>{req}</li>
                  ))}
                </ul>
              </div>
            </div>
          )}
        </div>

        {/* Modal Actions Footer */}
        <div className="p-4 border-t border-slate-800 bg-slate-950/60 flex items-center justify-between gap-2.5 flex-wrap">
          <div className="flex items-center gap-2">
            <button
              onClick={handleSave}
              disabled={isSaved}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-medium border transition-all ${
                isSaved
                  ? "bg-emerald-950 text-emerald-400 border-emerald-800"
                  : "bg-slate-800 hover:bg-slate-700 text-slate-300 border-slate-700"
              }`}
            >
              <Bookmark className="w-3.5 h-3.5" />
              <span>{isSaved ? "Saved" : "Save"}</span>
            </button>

            {job.directApplyUrl && (
              <a
                href={job.directApplyUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-medium bg-slate-800/90 hover:bg-slate-700 text-indigo-300 border border-slate-700 transition-all"
                title="View original employer listing"
              >
                <span>Live Post</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
            )}
          </div>

          {!resume ? (
            <button
              onClick={() => {
                onClose();
                if (onNavigateToResume) onNavigateToResume();
              }}
              className="flex-1 min-w-[200px] flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs shadow-lg shadow-indigo-600/30 transition-all cursor-pointer"
            >
              <Upload className="w-4 h-4" />
              <span>Upload CV to Tailor & Apply</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          ) : (
            <button
              onClick={() => matchResult && onStartWorkflow(job, matchResult)}
              disabled={isLoadingMatch || !matchResult}
              className="flex-1 min-w-[200px] flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs shadow-lg shadow-indigo-600/30 transition-all disabled:opacity-50"
            >
              <Sparkles className="w-4 h-4" />
              <span>{isLoadingMatch ? "Analyzing Match..." : "Tailor CV & Prep Application"}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
