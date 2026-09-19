export interface PersonalInfo {
  fullName: string;
  email: string;
  phone: string;
  location: string;
  linkedinUrl?: string;
  githubUrl?: string;
}

export interface ParsedResumeResult {
  personalInfo: PersonalInfo;
  candidateSummary: string;
  experienceLevel: string;
  yearsOfExperience: number;
  skills: {
    languages: string[];
    frameworks: string[];
    databases: string[];
    cloudAndDevOps: string[];
    softSkills: string[];
  };
  experience: Array<{
    company: string;
    role: string;
    startDate: string;
    endDate: string;
    responsibilities: string[];
    achievements: string[];
    technologies: string[];
  }>;
  education: Array<{
    institution: string;
    degree: string;
    fieldOfStudy: string;
    graduationYear: string;
  }>;
  certifications: string[];
  projects: Array<{
    title: string;
    description: string;
    technologies: string[];
  }>;
  resumeIssues: Array<{
    severity: "critical" | "warning" | "suggestion";
    section: string;
    issue: string;
    recommendation: string;
  }>;
  atsHealth: {
    overallScore: number;
    atsCompatibility: number;
    keywordCoverage: number;
    impactScore: number;
    readabilityScore: number;
    structureScore: number;
    skillsRelevance: number;
  };
}

export interface RecommendedRoleItem {
  title: string;
  matchScore: number;
  reason: string;
  seniority: string;
  existingSkills: string[];
  missingSkills: string[];
  atsKeywords: string[];
  typicalResponsibilities: string[];
}

export interface JobListing {
  id: string;
  externalJobId: string;
  company: string;
  companyLogo?: string;
  title: string;
  location: string;
  workMode: "remote" | "hybrid" | "onsite";
  employmentType: "full_time" | "contract" | "part_time";
  salaryRange?: {
    min: number;
    max: number;
    currency: string;
  };
  description: string;
  requirements: string[];
  requiredSkills: string[];
  preferredSkills: string[];
  atsKeywords: string[];
  directApplyUrl: string;
  sourceProvider: string;
  foundOnSources: string[];
  datePosted: string;
  calculatedMatchScore?: number;
  deduplicatedCount?: number;
}

export interface JobMatchResult {
  overallScore: number;
  breakdown: {
    skills: number;
    experience: number;
    seniority: number;
    education: number;
    location: number;
    keywords: number;
  };
  strongMatches: string[];
  missingSkills: string[];
  potentialConcerns: string[];
  atsKeywordsMatched: string[];
  atsKeywordsMissing: string[];
  summaryAnalysis: string;
}

export interface MasterResumeData {
  contactInfo: {
    name: string;
    email: string;
    phone: string;
    location: string;
    linkedin: string;
    github: string;
  };
  professionalSummary: string;
  technicalSkills: {
    languages: string[];
    frameworks: string[];
    cloudDevOps: string[];
    databases: string[];
    tools: string[];
  };
  experience: Array<{
    company: string;
    title: string;
    period: string;
    location: string;
    bullets: string[];
  }>;
  projects: Array<{
    name: string;
    description: string;
    bullets: string[];
    technologies: string[];
  }>;
  education: Array<{
    degree: string;
    school: string;
    year: string;
  }>;
  certifications: string[];
}

export interface ApplicationRecord {
  id: string;
  jobId: string;
  company: string;
  title: string;
  location: string;
  workMode: string;
  salaryText?: string;
  status: "saved" | "preparing" | "ready_to_apply" | "application_opened" | "submitted" | "interview" | "rejected" | "offer";
  matchScore: number;
  dateApplied?: string;
  notes?: string;
  nextAction?: string;
  submissionConfirmationVerified?: boolean;
  applyUrl: string;
  foundOnSources: string[];
}

export interface AnalyticsData {
  totalApplications: number;
  submittedApplications: number;
  interviews: number;
  offers: number;
  rejections: number;
  averageMatchScore: number;
  responseRate: number;
  highMatchInsight: string;
  topCompanies: string[];
  statusCounts: Record<string, number>;
}

export interface CustomJobKitResponse {
  jobTitle: string;
  company: string;
  jobDescription: string;
  matchScore: number;
  matchResult: JobMatchResult;
  tailoredResume: MasterResumeData;
  summaryDiff: string;
  bulletChanges: Array<{ company: string; original: string; tailored: string; reason: string }>;
  coverLetter: string;
  screeningAnswers: Array<{ question: string; suggestedAnswer: string }>;
}
