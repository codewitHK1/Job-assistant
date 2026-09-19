import {
  ParsedResumeResult,
  RecommendedRoleItem,
  JobListing,
  JobMatchResult,
  MasterResumeData,
  ApplicationRecord,
  AnalyticsData,
  CustomJobKitResponse,
} from "../types/jobpilot.ts";

export const apiService = {
  async getHealth() {
    const res = await fetch("/api/health");
    return res.json();
  },

  async getCurrentResume(): Promise<{
    hasResume: boolean;
    resume: ParsedResumeResult | null;
    masterResume: MasterResumeData | null;
    topRoles: RecommendedRoleItem[];
    user?: any;
    meta?: { fileName?: string; uploadedAt?: string; rawTextPreview?: string };
  }> {
    const res = await fetch("/api/resumes/current");
    if (!res.ok) {
      return { hasResume: false, resume: null, masterResume: null, topRoles: [] };
    }
    return res.json();
  },

  async clearCurrentResume(): Promise<boolean> {
    const res = await fetch("/api/resumes/current", { method: "DELETE" });
    const data = await res.json();
    return data.success;
  },

  async analyzeResume(text: string, fileName: string = "resume.pdf"): Promise<{
    analysis: ParsedResumeResult;
    topRoles: RecommendedRoleItem[];
    masterResume: MasterResumeData;
    updatedUser?: any;
  }> {
    const res = await fetch("/api/resumes/analyze", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text, fileName }),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({ error: "Analysis failed" }));
      throw new Error(err.error || "Failed to analyze resume");
    }
    return res.json();
  },

  async uploadResumeFile(
    fileBase64: string,
    fileName: string,
    mimeType?: string,
    text?: string
  ): Promise<{
    analysis: ParsedResumeResult;
    topRoles: RecommendedRoleItem[];
    masterResume: MasterResumeData;
    fileName: string;
    rawText?: string;
    updatedUser?: any;
  }> {
    const res = await fetch("/api/resumes/upload-file", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ fileBase64, fileName, mimeType, text }),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({ error: "File parsing failed" }));
      throw new Error(err.error || "Failed to parse and analyze resume document.");
    }
    return res.json();
  },

  async getTopRoles(): Promise<RecommendedRoleItem[]> {
    const res = await fetch("/api/career/roles");
    const data = await res.json();
    return data.roles || [];
  },

  async getMasterResume(): Promise<MasterResumeData | null> {
    const res = await fetch("/api/resumes/master");
    const data = await res.json();
    return data.masterResume || null;
  },

  async getJobs(params?: {
    title?: string;
    location?: string;
    workMode?: string;
    minSalary?: number;
    providers?: string[];
  }): Promise<JobListing[]> {
    const query = new URLSearchParams();
    if (params?.title) query.append("title", params.title);
    if (params?.location) query.append("location", params.location);
    if (params?.workMode) query.append("workMode", params.workMode);
    if (params?.minSalary) query.append("minSalary", params.minSalary.toString());
    if (params?.providers?.length) query.append("providers", params.providers.join(","));

    const res = await fetch(`/api/jobs?${query.toString()}`);
    const data = await res.json();
    return data.jobs || [];
  },

  async getJobProviders(): Promise<Array<{ name: string; displayName: string; isConfigured: boolean }>> {
    const res = await fetch("/api/jobs/providers");
    const data = await res.json();
    return data.providers || [];
  },

  async getJobById(jobId: string): Promise<JobListing> {
    const res = await fetch(`/api/jobs/${jobId}`);
    const data = await res.json();
    return data.job;
  },

  async matchJob(
    jobId: string,
    resume?: ParsedResumeResult
  ): Promise<{ match: JobMatchResult | null; requiresResume?: boolean; message?: string; job: JobListing }> {
    const res = await fetch(`/api/jobs/${jobId}/match`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ resume }),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({ error: "Match failed" }));
      throw new Error(err.error || "Failed to calculate job match");
    }
    return res.json();
  },

  async tailorResume(
    jobId: string,
    jobDescription?: string,
    resume?: ParsedResumeResult,
    masterResume?: MasterResumeData
  ): Promise<{
    tailoredResume: MasterResumeData;
    summaryDiff: string;
    bulletChanges: Array<{ company: string; original: string; tailored: string; reason: string }>;
  }> {
    const res = await fetch("/api/resumes/tailor", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ jobId, jobDescription, resume, masterResume }),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || "Failed to tailor resume");
    }
    return res.json();
  },

  async generateCoverLetter(
    company: string,
    roleTitle: string,
    jobDescription: string,
    tone: string = "professional",
    length: string = "medium"
  ): Promise<string> {
    const res = await fetch("/api/cover-letter/generate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ company, roleTitle, jobDescription, tone, length }),
    });
    const data = await res.json();
    return data.coverLetter || "";
  },

  async generateApplicationAnswers(
    company: string,
    roleTitle: string,
    jobDescription: string,
    questions?: string[]
  ): Promise<Array<{ question: string; suggestedAnswer: string }>> {
    const res = await fetch("/api/application/answers", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ company, roleTitle, jobDescription, questions }),
    });
    const data = await res.json();
    return data.answers || [];
  },

  async getApplications(): Promise<ApplicationRecord[]> {
    const res = await fetch("/api/applications");
    const data = await res.json();
    return data.applications || [];
  },

  async addApplication(payload: Partial<ApplicationRecord>): Promise<ApplicationRecord> {
    const res = await fetch("/api/applications", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    const data = await res.json();
    return data.application;
  },

  async updateApplication(id: string, payload: Partial<ApplicationRecord>): Promise<ApplicationRecord> {
    const res = await fetch(`/api/applications/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    const data = await res.json();
    return data.application;
  },

  async deleteApplication(id: string): Promise<boolean> {
    const res = await fetch(`/api/applications/${id}`, { method: "DELETE" });
    const data = await res.json();
    return data.success;
  },

  async getAnalytics(): Promise<AnalyticsData> {
    const res = await fetch("/api/analytics");
    return res.json();
  },

  async sendChatMessage(message: string, history: Array<{ role: "user" | "model"; text: string }>): Promise<string> {
    const res = await fetch("/api/ai/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ message, history }),
    });
    const data = await res.json();
    return data.reply;
  },

  async generateCustomJobKit(payload: {
    jobDescription: string;
    jobTitle?: string;
    company?: string;
    resume?: ParsedResumeResult;
    masterResume?: MasterResumeData;
  }): Promise<CustomJobKitResponse> {
    const res = await fetch("/api/custom-job/generate-kit", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    if (!res.ok) {
      const errData = await res.json().catch(() => ({}));
      throw new Error(errData.error || "Failed to generate application kit.");
    }
    return res.json();
  },
};
