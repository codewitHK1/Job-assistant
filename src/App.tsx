import React, { useState, useEffect } from "react";
import { AndroidFrame } from "./components/AndroidFrame.tsx";
import { AndroidNavBar, NavTab } from "./components/AndroidNavBar.tsx";
import { HomeScreen } from "./screens/HomeScreen.tsx";
import { JobsScreen } from "./screens/JobsScreen.tsx";
import { ResumeScreen } from "./screens/ResumeScreen.tsx";
import { ApplicationsKanbanScreen } from "./screens/ApplicationsKanbanScreen.tsx";
import { ProfileScreen } from "./screens/ProfileScreen.tsx";
import { JobDetailModal } from "./screens/JobDetailModal.tsx";
import { ApplicationWorkflowModal } from "./screens/ApplicationWorkflowModal.tsx";
import { AIChatAssistantModal } from "./screens/AIChatAssistantModal.tsx";
import { AndroidCodeInspectorModal } from "./screens/AndroidCodeInspectorModal.tsx";
import { QuickJobTailorModal } from "./screens/QuickJobTailorModal.tsx";
import { apiService } from "./services/api.ts";
import {
  ParsedResumeResult,
  RecommendedRoleItem,
  JobListing,
  JobMatchResult,
  MasterResumeData,
  ApplicationRecord,
} from "./types/jobpilot.ts";

export default function App() {
  const [activeTab, setActiveTab] = useState<NavTab>("home");
  const [isDeviceFrame, setIsDeviceFrame] = useState(true);

  // User State - Clean real state
  const [userName, setUserName] = useState("Candidate");
  const [userEmail, setUserEmail] = useState("kumarhk1002@gmail.com");
  const [targetRole, setTargetRole] = useState("Upload Resume to Begin");

  // Core Resume & Career Data
  const [resume, setResume] = useState<ParsedResumeResult | null>(null);
  const [topRoles, setTopRoles] = useState<RecommendedRoleItem[]>([]);
  const [masterResume, setMasterResume] = useState<MasterResumeData | null>(null);
  const [isAnalyzingResume, setIsAnalyzingResume] = useState(false);

  // Job Search State
  const [jobs, setJobs] = useState<JobListing[]>([]);
  const [providers, setProviders] = useState<
    Array<{ name: string; displayName: string; isConfigured: boolean; isLiveApi?: boolean }>
  >([]);
  const [jobSearchQuery, setJobSearchQuery] = useState("");
  const [selectedWorkMode, setSelectedWorkMode] = useState("all");
  const [selectedProviders, setSelectedProviders] = useState<string[]>([]);
  const [minSalary, setMinSalary] = useState(0);
  const [isJobsLoading, setIsJobsLoading] = useState(false);

  // Applications Tracking State - Starts empty, updated on real user action
  const [applications, setApplications] = useState<ApplicationRecord[]>([]);

  // Modals
  const [selectedJobForDetail, setSelectedJobForDetail] = useState<JobListing | null>(null);
  const [activeWorkflowJob, setActiveWorkflowJob] = useState<{
    job: JobListing;
    matchResult: JobMatchResult;
  } | null>(null);
  const [showAIChat, setShowAIChat] = useState(false);
  const [showCodeInspector, setShowCodeInspector] = useState(false);
  const [showQuickTailor, setShowQuickTailor] = useState(false);

  // Initial Data Fetch
  useEffect(() => {
    // 1. Load active persisted CV (remains until user re-uploads or clears)
    apiService.getCurrentResume().then((current) => {
      if (current?.hasResume && current.resume) {
        setResume(current.resume);
        setMasterResume(current.masterResume);
        setTopRoles(current.topRoles || []);
        if (current.resume.personalInfo?.fullName) {
          setUserName(current.resume.personalInfo.fullName);
        }
        if (current.resume.personalInfo?.email) {
          setUserEmail(current.resume.personalInfo.email);
        }
        if (current.topRoles?.[0]?.title) {
          setTargetRole(current.topRoles[0].title);
        }
      }
    }).catch(console.error);

    // 2. Fetch initial providers & jobs
    apiService.getJobProviders().then((provs) => {
      setProviders(provs);
      setSelectedProviders(provs.map((p) => p.name));
    }).catch(console.error);

    loadJobs();
    loadApplications();
  }, []);

  const loadJobs = async (overrides?: {
    title?: string;
    workMode?: string;
    providers?: string[];
    minSalary?: number;
  }) => {
    setIsJobsLoading(true);
    try {
      const q = overrides?.title !== undefined ? overrides.title : jobSearchQuery;
      const wm = overrides?.workMode !== undefined ? overrides.workMode : selectedWorkMode;
      const provs = overrides?.providers !== undefined ? overrides.providers : selectedProviders;
      const sal = overrides?.minSalary !== undefined ? overrides.minSalary : minSalary;

      const data = await apiService.getJobs({
        title: q,
        workMode: wm,
        providers: provs.length > 0 ? provs : undefined,
        minSalary: sal > 0 ? sal : undefined,
      });
      const list = Array.isArray(data) ? data : (data as any)?.jobs || [];
      setJobs(list);
    } catch (err) {
      console.error("Error loading jobs:", err);
    } finally {
      setIsJobsLoading(false);
    }
  };

  // Re-fetch jobs on filter change
  useEffect(() => {
    loadJobs();
  }, [jobSearchQuery, selectedWorkMode, selectedProviders, minSalary]);

  const loadApplications = async () => {
    try {
      const data = await apiService.getApplications();
      setApplications(data);
    } catch (err) {
      console.error("Error loading applications:", err);
    }
  };

  // Handlers
  const handleAnalyzeResume = async (text: string, fileName?: string) => {
    setIsAnalyzingResume(true);
    try {
      const res = await apiService.analyzeResume(text, fileName);
      setResume(res.analysis);
      setTopRoles(res.topRoles);
      setMasterResume(res.masterResume);
      if (res.analysis?.personalInfo?.fullName) {
        setUserName(res.analysis.personalInfo.fullName);
      }
      if (res.analysis?.personalInfo?.email) {
        setUserEmail(res.analysis.personalInfo.email);
      }
      if (res.topRoles?.[0]?.title) {
        setTargetRole(res.topRoles[0].title);
      }
      // Reload jobs to refresh match scores against real profile
      loadJobs();
    } catch (err) {
      console.error("Error analyzing resume:", err);
    } finally {
      setIsAnalyzingResume(false);
    }
  };

  const handleUploadResumeFile = async (
    fileBase64: string,
    fileName: string,
    mimeType?: string,
    text?: string
  ) => {
    setIsAnalyzingResume(true);
    try {
      const res = await apiService.uploadResumeFile(fileBase64, fileName, mimeType, text);
      setResume(res.analysis);
      setTopRoles(res.topRoles);
      setMasterResume(res.masterResume);
      if (res.analysis?.personalInfo?.fullName) {
        setUserName(res.analysis.personalInfo.fullName);
      }
      if (res.analysis?.personalInfo?.email) {
        setUserEmail(res.analysis.personalInfo.email);
      }
      if (res.topRoles?.[0]?.title) {
        setTargetRole(res.topRoles[0].title);
      }
      // Re-fetch jobs to recalculate matching against candidate's real profile
      loadJobs();
    } catch (err) {
      console.error("Error uploading resume document:", err);
      alert(err instanceof Error ? err.message : "Failed to analyze resume file");
    } finally {
      setIsAnalyzingResume(false);
    }
  };

  const handleUpdateApplicationStatus = async (
    id: string,
    newStatus: ApplicationRecord["status"]
  ) => {
    try {
      const updated = await apiService.updateApplication(id, { status: newStatus });
      setApplications((prev) => prev.map((a) => (a.id === id ? updated : a)));
    } catch (err) {
      console.error("Error updating status:", err);
    }
  };

  const handleUpdateApplicationNotes = async (id: string, notes: string) => {
    try {
      const updated = await apiService.updateApplication(id, { notes });
      setApplications((prev) => prev.map((a) => (a.id === id ? updated : a)));
    } catch (err) {
      console.error("Error updating notes:", err);
    }
  };

  const handleDeleteApplication = async (id: string) => {
    try {
      await apiService.deleteApplication(id);
      setApplications((prev) => prev.filter((a) => a.id !== id));
    } catch (err) {
      console.error("Error deleting application:", err);
    }
  };

  const handleClearResume = async () => {
    try {
      await apiService.clearCurrentResume();
      setResume(null);
      setMasterResume(null);
      setTopRoles([]);
      setUserName("Candidate");
      setUserEmail("candidate@example.com");
      setTargetRole("Upload CV to Begin");
      loadJobs();
    } catch (err) {
      console.error("Error clearing resume:", err);
    }
  };

  const handleSaveJobToTracker = async (job: JobListing, matchScore: number) => {
    try {
      const newApp = await apiService.addApplication({
        jobId: job.id,
        company: job.company,
        title: job.title,
        location: job.location,
        workMode: job.workMode,
        salaryText: job.salaryRange
          ? `$${(job.salaryRange.min / 1000).toFixed(0)}k - $${(job.salaryRange.max / 1000).toFixed(0)}k`
          : undefined,
        status: "saved",
        matchScore,
        applyUrl: job.directApplyUrl,
        foundOnSources: job.foundOnSources,
        notes: `Saved from ${job.sourceProvider} discovery feed.`,
        nextAction: "Tailor resume bullets and review ATS keywords",
      });
      loadApplications();
    } catch (err) {
      console.error("Error saving job to tracker:", err);
    }
  };

  const handleStartWorkflow = (job: JobListing, matchResult: JobMatchResult) => {
    setSelectedJobForDetail(null);
    setActiveWorkflowJob({ job, matchResult });
  };

  const handleCompleteWorkflow = async (record: Partial<ApplicationRecord>) => {
    try {
      await apiService.addApplication(record);
      loadApplications();
      setActiveTab("applications");
    } catch (err) {
      console.error("Error completing workflow:", err);
    }
  };

  const handleNavigateToJobsWithRole = (roleTitle: string) => {
    setJobSearchQuery(roleTitle);
    setActiveTab("jobs");
  };

  const handleSaveCustomJobToTracker = async (customJob: {
    title: string;
    company: string;
    description: string;
    matchScore: number;
    tailoredResume: MasterResumeData;
    coverLetter: string;
    answers: Array<{ question: string; suggestedAnswer: string }>;
  }) => {
    try {
      await apiService.addApplication({
        jobId: `custom-paste-${Date.now()}`,
        company: customJob.company || "Direct Opportunity",
        title: customJob.title || "Custom Tailored Position",
        location: "Remote / Employer Site",
        workMode: "remote",
        status: "ready_to_apply",
        matchScore: customJob.matchScore || 90,
        notes: `Application Kit generated via Quick Paste Tool.\nReady to apply with tailored ATS bullet points, personalized cover letter, and screening question answers.`,
        nextAction: "Copy tailored materials and submit application to company portal",
        applyUrl: "https://linkedin.com/jobs",
        foundOnSources: ["Pasted Job Description"],
      });
      loadApplications();
      setActiveTab("applications");
    } catch (err) {
      console.error("Error saving custom job to tracker:", err);
    }
  };

  return (
    <AndroidFrame
      isDeviceFrame={isDeviceFrame}
      onToggleFrame={() => setIsDeviceFrame(!isDeviceFrame)}
      onOpenCodeInspector={() => setShowCodeInspector(true)}
      onOpenAIChat={() => setShowAIChat(true)}
    >
      {/* Dynamic Screen Container */}
      <main className="flex-1 flex flex-col overflow-hidden relative">
        {activeTab === "home" && (
          <HomeScreen
            userName={userName}
            targetRole={targetRole}
            resume={resume}
            topRoles={topRoles}
            jobs={jobs}
            applications={applications}
            onNavigateTab={setActiveTab}
            onSelectJobForMatch={(job) => setSelectedJobForDetail(job)}
            onOpenAIChat={() => setShowAIChat(true)}
            onOpenQuickTailor={() => setShowQuickTailor(true)}
          />
        )}

        {activeTab === "jobs" && (
          <JobsScreen
            jobs={jobs}
            providers={providers}
            searchQuery={jobSearchQuery}
            selectedWorkMode={selectedWorkMode}
            selectedProviders={selectedProviders}
            minSalary={minSalary}
            isLoading={isJobsLoading}
            onSearchChange={setJobSearchQuery}
            onWorkModeChange={setSelectedWorkMode}
            onProvidersChange={setSelectedProviders}
            onMinSalaryChange={setMinSalary}
            onSelectJob={(job) => setSelectedJobForDetail(job)}
            onOpenQuickTailor={() => setShowQuickTailor(true)}
          />
        )}

        {activeTab === "resume" && (
          <ResumeScreen
            resume={resume}
            topRoles={topRoles}
            masterResume={masterResume}
            isAnalyzing={isAnalyzingResume}
            onAnalyzeResume={handleAnalyzeResume}
            onUploadResumeFile={handleUploadResumeFile}
            onClearResume={handleClearResume}
            onNavigateToJobsWithRole={handleNavigateToJobsWithRole}
            onOpenQuickTailor={() => setShowQuickTailor(true)}
          />
        )}

        {activeTab === "applications" && (
          <ApplicationsKanbanScreen
            applications={applications}
            onUpdateStatus={handleUpdateApplicationStatus}
            onUpdateNotes={handleUpdateApplicationNotes}
            onDeleteApplication={handleDeleteApplication}
            onNavigateToJobs={() => setActiveTab("jobs")}
          />
        )}

        {activeTab === "profile" && (
          <ProfileScreen
            userName={userName}
            userEmail={userEmail}
            targetRole={targetRole}
            onUpdateTargetRole={setTargetRole}
            onOpenCodeInspector={() => setShowCodeInspector(true)}
          />
        )}
      </main>

      {/* Material 3 Bottom Navigation Bar */}
      <AndroidNavBar
        activeTab={activeTab}
        onSelectTab={setActiveTab}
        applicationsBadgeCount={applications.length}
      />

      {/* Modal 1: Job Match Details & ATS Simulator */}
      {selectedJobForDetail && (
        <JobDetailModal
          job={selectedJobForDetail}
          resume={resume}
          onClose={() => setSelectedJobForDetail(null)}
          onStartWorkflow={handleStartWorkflow}
          onSaveToApplications={handleSaveJobToTracker}
          onNavigateToResume={() => {
            setSelectedJobForDetail(null);
            setActiveTab("resume");
          }}
        />
      )}

      {/* Modal 2: 8-Step Application Workflow */}
      {activeWorkflowJob && (
        <ApplicationWorkflowModal
          job={activeWorkflowJob.job}
          matchResult={activeWorkflowJob.matchResult}
          masterResume={masterResume}
          onClose={() => setActiveWorkflowJob(null)}
          onCompleteWorkflow={handleCompleteWorkflow}
        />
      )}

      {/* Modal 3: AI Career Coach Chat Assistant */}
      {showAIChat && (
        <AIChatAssistantModal
          candidateName={userName}
          onClose={() => setShowAIChat(false)}
        />
      )}

      {/* Modal 4: Native Android Code Inspector */}
      {showCodeInspector && (
        <AndroidCodeInspectorModal onClose={() => setShowCodeInspector(false)} />
      )}

      {/* Modal 5: Quick Job Tailor & Application Kit Generator */}
      {showQuickTailor && (
        <QuickJobTailorModal
          onClose={() => setShowQuickTailor(false)}
          resume={resume}
          masterResume={masterResume}
          onNavigateToResume={() => {
            setShowQuickTailor(false);
            setActiveTab("resume");
          }}
          onSaveToTracker={handleSaveCustomJobToTracker}
        />
      )}
    </AndroidFrame>
  );
}
