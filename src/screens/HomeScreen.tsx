import React from "react";
import {
  Sparkles,
  TrendingUp,
  FileCheck,
  Send,
  Briefcase,
  ChevronRight,
  ShieldCheck,
  FileText,
  AlertCircle,
  ArrowUpRight,
  Zap,
  Clipboard,
} from "lucide-react";
import { ParsedResumeResult, RecommendedRoleItem, JobListing, ApplicationRecord } from "../types/jobpilot.ts";

interface HomeScreenProps {
  userName: string;
  targetRole: string;
  resume: ParsedResumeResult | null;
  topRoles: RecommendedRoleItem[];
  jobs: JobListing[];
  applications: ApplicationRecord[];
  onNavigateTab: (tab: "home" | "jobs" | "applications" | "resume" | "profile") => void;
  onSelectJobForMatch: (job: JobListing) => void;
  onOpenAIChat: () => void;
  onOpenQuickTailor?: () => void;
}

export const HomeScreen: React.FC<HomeScreenProps> = ({
  userName,
  targetRole,
  resume,
  topRoles,
  jobs,
  applications,
  onNavigateTab,
  onSelectJobForMatch,
  onOpenAIChat,
  onOpenQuickTailor,
}) => {
  // Metrics calculation
  const totalApps = applications.length;
  const interviewsCount = applications.filter((a) => a.status === "interview" || a.status === "offer").length;
  const readyToApplyCount = applications.filter((a) => a.status === "ready_to_apply").length;
  const careerMatchScore = resume ? resume.atsHealth.overallScore : null;

  return (
    <div className="flex-1 overflow-y-auto px-4 py-4 space-y-5 scrollbar-thin scrollbar-thumb-slate-800">
      {/* 1. Header Greeting & Career Target */}
      <div className="flex items-center justify-between">
        <div>
          <span className="text-xs font-medium text-slate-400">Welcome,</span>
          <h1 className="text-xl font-bold text-slate-100 flex items-center gap-1.5">
            {userName}
            <span className="inline-block w-2 h-2 rounded-full bg-emerald-400" />
          </h1>
          <div className="mt-1 flex items-center gap-1.5">
            <span className="text-[11px] text-slate-400 font-medium">Target:</span>
            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold bg-indigo-500/10 text-indigo-300 border border-indigo-500/20">
              <Zap className="w-2.5 h-2.5 mr-1 text-indigo-400" />
              {targetRole}
            </span>
          </div>
        </div>

        <button
          onClick={onOpenAIChat}
          className="p-2.5 rounded-xl bg-slate-800/80 hover:bg-slate-700/80 text-indigo-400 border border-slate-700/60 shadow-sm transition-all"
          title="Open AI Career Coach"
        >
          <Sparkles className="w-5 h-5" />
        </button>
      </div>

      {/* 2. Top Metric Cards (Horizontal Grid) */}
      <div className="grid grid-cols-3 sm:grid-cols-5 gap-2">
        <div className="bg-gradient-to-br from-indigo-950/60 to-slate-900 border border-indigo-900/40 p-2.5 rounded-xl flex flex-col justify-between">
          <span className="text-[10px] text-indigo-300 font-medium">Career Match</span>
          <span className="text-lg font-bold text-indigo-200 mt-1">
            {careerMatchScore !== null ? `${careerMatchScore}%` : "--"}
          </span>
        </div>

        <div className="bg-slate-900/80 border border-slate-800 p-2.5 rounded-xl flex flex-col justify-between">
          <span className="text-[10px] text-slate-400 font-medium">Live Jobs</span>
          <span className="text-lg font-bold text-slate-200 mt-1">{jobs.length}</span>
        </div>

        <div className="bg-slate-900/80 border border-slate-800 p-2.5 rounded-xl flex flex-col justify-between">
          <span className="text-[10px] text-emerald-400 font-medium">Ready to Apply</span>
          <span className="text-lg font-bold text-emerald-300 mt-1">{readyToApplyCount}</span>
        </div>

        <div className="bg-slate-900/80 border border-slate-800 p-2.5 rounded-xl flex flex-col justify-between">
          <span className="text-[10px] text-slate-400 font-medium">Applications</span>
          <span className="text-lg font-bold text-slate-200 mt-1">{totalApps}</span>
        </div>

        <div className="bg-slate-900/80 border border-slate-800 p-2.5 rounded-xl flex flex-col justify-between">
          <span className="text-[10px] text-amber-400 font-medium">Interviews</span>
          <span className="text-lg font-bold text-amber-300 mt-1">{interviewsCount}</span>
        </div>
      </div>

      {/* Quick Tool: Paste Job Description & Instant Tailor */}
      <div className="bg-gradient-to-r from-purple-950/60 via-indigo-950/70 to-slate-900 border border-indigo-500/40 p-3.5 sm:p-4 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-lg shadow-indigo-950/40">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="px-2 py-0.5 rounded-md bg-indigo-500/20 text-indigo-300 text-[10px] font-bold uppercase tracking-wider border border-indigo-500/30 flex items-center gap-1">
              <Sparkles className="w-3 h-3 text-amber-300" />
              One-Click Tailor Tool
            </span>
          </div>
          <h3 className="text-sm font-bold text-white flex items-center gap-1.5">
            Paste Job Description & Generate Kit
          </h3>
          <p className="text-xs text-slate-300 max-w-xl">
            Found a role on LinkedIn, Greenhouse, or any job board? Paste the JD to instantly get an ATS-tailored resume, custom cover letter, and screening answers ready to copy & download.
          </p>
        </div>
        <button
          type="button"
          onClick={onOpenQuickTailor}
          className="px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold shrink-0 shadow-md shadow-indigo-600/40 transition-all flex items-center justify-center gap-1.5 cursor-pointer"
        >
          <Clipboard className="w-3.5 h-3.5" />
          <span>Paste Job Description</span>
          <ChevronRight className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* 3. Hero Quick Action Banner if CV not analyzed */}
      {!resume && (
        <div className="bg-gradient-to-r from-indigo-900/40 via-purple-900/30 to-slate-900 border border-indigo-500/30 p-4 rounded-2xl flex items-center justify-between">
          <div className="space-y-1">
            <h3 className="text-sm font-bold text-white flex items-center gap-1.5">
              <FileText className="w-4 h-4 text-indigo-400" />
              Upload your CV to Unlock Top 20 Roles
            </h3>
            <p className="text-xs text-slate-300">
              Get an instant ATS health score and factual job matches without guesswork.
            </p>
          </div>
          <button
            onClick={() => onNavigateTab("resume")}
            className="px-3.5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shrink-0 shadow-md shadow-indigo-600/30 transition-all flex items-center gap-1"
          >
            Upload CV
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* 4. Recommended Jobs Section */}
      <div className="space-y-2.5">
        <div className="flex items-center justify-between">
          <h2 className="text-xs font-bold text-slate-300 tracking-wider uppercase flex items-center gap-1.5">
            <Briefcase className="w-3.5 h-3.5 text-indigo-400" />
            Recommended Jobs
          </h2>
          <button
            onClick={() => onNavigateTab("jobs")}
            className="text-[11px] text-indigo-400 hover:text-indigo-300 font-medium flex items-center gap-0.5"
          >
            View all ({jobs.length})
            <ChevronRight className="w-3 h-3" />
          </button>
        </div>

        <div className="space-y-2">
          {jobs.slice(0, 3).map((job) => (
            <div
              key={job.id}
              onClick={() => onSelectJobForMatch(job)}
              className="bg-slate-900/90 hover:bg-slate-800/90 border border-slate-800/90 p-3.5 rounded-xl cursor-pointer transition-all hover:border-slate-700 flex items-center justify-between group"
            >
              <div className="space-y-1 pr-2">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-slate-200 group-hover:text-indigo-300 transition-colors">
                    {job.company}
                  </span>
                  <span className="text-[10px] px-1.5 py-0.2 rounded bg-slate-800 text-slate-400 border border-slate-700/80">
                    {job.workMode}
                  </span>
                  {job.foundOnSources.length > 1 && (
                    <span className="text-[9px] px-1.5 py-0.2 rounded bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
                      {job.foundOnSources.join(" + ")}
                    </span>
                  )}
                </div>
                <h4 className="text-sm font-medium text-slate-100 line-clamp-1">{job.title}</h4>
                <div className="flex items-center gap-2 text-[11px] text-slate-400">
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

              <div className="flex flex-col items-end gap-1.5 shrink-0">
                <div className="px-2 py-0.5 rounded-full bg-emerald-950/80 text-emerald-400 border border-emerald-800/60 text-xs font-bold flex items-center gap-1">
                  <span>{job.calculatedMatchScore ? `${job.calculatedMatchScore}%` : "Live"}</span>
                  {job.calculatedMatchScore && <span className="text-[9px] font-normal">Match</span>}
                </div>
                <span className="text-[10px] text-slate-500 flex items-center gap-0.5 group-hover:text-indigo-400">
                  ATS Match <ArrowUpRight className="w-3 h-3" />
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 5. Resume Health Score Section */}
      <div className="bg-slate-900/90 border border-slate-800/90 p-4 rounded-2xl space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            <h3 className="text-xs font-bold text-slate-200 tracking-wider uppercase">Resume Health Score</h3>
          </div>
          {resume ? (
            <span className="text-[11px] font-bold text-emerald-400 bg-emerald-950/60 px-2 py-0.5 rounded-md border border-emerald-900/60">
              {resume.atsHealth.overallScore}/100
            </span>
          ) : (
            <button
              onClick={() => onNavigateTab("resume")}
              className="text-[11px] font-semibold text-indigo-400 hover:text-indigo-300"
            >
              Upload CV &rarr;
            </button>
          )}
        </div>

        {resume ? (
          <div className="grid grid-cols-3 gap-2 text-center">
            <div className="bg-slate-950/60 border border-slate-800/60 p-2 rounded-lg">
              <div className="text-xs font-bold text-slate-200">
                {resume.atsHealth.atsCompatibility}%
              </div>
              <div className="text-[10px] text-slate-400 mt-0.5">ATS Compatibility</div>
            </div>
            <div className="bg-slate-950/60 border border-slate-800/60 p-2 rounded-lg">
              <div className="text-xs font-bold text-slate-200">
                {resume.atsHealth.keywordCoverage}%
              </div>
              <div className="text-[10px] text-slate-400 mt-0.5">Keyword Coverage</div>
            </div>
            <div className="bg-slate-950/60 border border-slate-800/60 p-2 rounded-lg">
              <div className="text-xs font-bold text-slate-200">
                {resume.atsHealth.impactScore}%
              </div>
              <div className="text-[10px] text-slate-400 mt-0.5">Impact Score</div>
            </div>
          </div>
        ) : (
          <div className="p-3 bg-slate-950/60 rounded-xl border border-slate-800/60 text-center space-y-1">
            <p className="text-xs text-slate-300">No resume analyzed yet.</p>
            <p className="text-[11px] text-slate-500">
              Upload your PDF or Word document in the Resume tab for instant ATS calibration.
            </p>
          </div>
        )}

        <div className="text-[10px] text-slate-400 flex items-start gap-1.5 pt-1 border-t border-slate-800/60">
          <AlertCircle className="w-3.5 h-3.5 text-slate-500 shrink-0 mt-0.5" />
          <span>ATS algorithms differ across platforms. This score provides calibrated recruiter guidance.</span>
        </div>
      </div>

      {/* 6. Application Queue / Kanban Status Strip */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <h2 className="text-xs font-bold text-slate-300 tracking-wider uppercase flex items-center gap-1.5">
            <FileCheck className="w-3.5 h-3.5 text-indigo-400" />
            Application Queue
          </h2>
          <button
            onClick={() => onNavigateTab("applications")}
            className="text-[11px] text-indigo-400 hover:text-indigo-300 font-medium flex items-center gap-0.5"
          >
            Kanban Board
            <ChevronRight className="w-3 h-3" />
          </button>
        </div>

        {applications.length > 0 ? (
          <div className="grid grid-cols-2 gap-2">
            {applications.slice(0, 2).map((app) => (
              <div
                key={app.id}
                onClick={() => onNavigateTab("applications")}
                className="bg-slate-900/70 border border-slate-800 p-3 rounded-xl cursor-pointer hover:border-slate-700 transition-all space-y-1"
              >
                <div className="flex items-center justify-between">
                  <span className="text-[10px] uppercase font-bold text-indigo-400">{app.status.replace("_", " ")}</span>
                  <span className="text-[10px] font-bold text-slate-300">{app.matchScore}%</span>
                </div>
                <div className="text-xs font-bold text-slate-200 truncate">{app.company}</div>
                <div className="text-[11px] text-slate-400 truncate">{app.title}</div>
              </div>
            ))}
          </div>
        ) : (
          <div
            onClick={() => onNavigateTab("jobs")}
            className="p-3.5 bg-slate-900/60 border border-dashed border-slate-800 rounded-xl text-center cursor-pointer hover:border-slate-700 transition-colors"
          >
            <p className="text-xs text-slate-400">No applications tracked yet</p>
            <p className="text-[11px] text-indigo-400 font-medium mt-0.5">
              Browse live jobs to save and prepare tailored submissions &rarr;
            </p>
          </div>
        )}
      </div>

      {/* 7. Career Insights Section */}
      <div className="bg-indigo-950/20 border border-indigo-500/20 p-3.5 rounded-xl space-y-2">
        <div className="flex items-center gap-2 text-indigo-300 text-xs font-bold">
          <TrendingUp className="w-4 h-4 text-indigo-400" />
          Career Insights
        </div>
        <p className="text-xs text-slate-300 leading-relaxed">
          Your applications with match score &gt;85% generated <strong>3x more interview callbacks</strong>. Focus on tailoring resume bullets with real metrics for senior-level postings.
        </p>
      </div>
    </div>
  );
};
