-- =====================================================================
-- JobPilot AI - Production PostgreSQL Database Schema
-- Architecture: Multi-tenant, secure, normalized with audit timestamps
-- =====================================================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm"; -- For fast fuzzy job title & skill search

-- 1. Users
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    full_name VARCHAR(150) NOT NULL,
    headline VARCHAR(255),
    role VARCHAR(50) DEFAULT 'job_seeker', -- 'job_seeker', 'recruiter', 'admin'
    subscription_tier VARCHAR(50) DEFAULT 'free', -- 'free', 'pro', 'enterprise'
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 2. User Profiles
CREATE TABLE IF NOT EXISTS user_profiles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    phone VARCHAR(50),
    location VARCHAR(150),
    preferred_locations TEXT[], -- Array of desired locations
    work_modes TEXT[] DEFAULT ARRAY['remote', 'hybrid'], -- 'remote', 'hybrid', 'onsite'
    expected_salary_min INTEGER,
    expected_salary_max INTEGER,
    currency VARCHAR(10) DEFAULT 'USD',
    years_of_experience NUMERIC(4, 1) DEFAULT 0,
    seniority_level VARCHAR(50), -- 'entry', 'mid', 'senior', 'lead', 'staff', 'executive'
    current_job_title VARCHAR(150),
    target_job_titles TEXT[],
    preferred_industries TEXT[],
    willing_to_relocate BOOLEAN DEFAULT FALSE,
    linkedin_url VARCHAR(255),
    github_url VARCHAR(255),
    portfolio_url VARCHAR(255),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uq_user_profile UNIQUE (user_id)
);

-- 3. Resumes (Uploaded documents)
CREATE TABLE IF NOT EXISTS resumes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    file_name VARCHAR(255) NOT NULL,
    file_type VARCHAR(50) NOT NULL, -- 'pdf', 'docx', 'txt'
    file_size_bytes BIGINT NOT NULL,
    storage_url TEXT NOT NULL,
    raw_text TEXT NOT NULL,
    parsed_json JSONB,
    ats_score INTEGER DEFAULT 0,
    is_master BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 4. Resume Versions (Iterative tailoring history)
CREATE TABLE IF NOT EXISTS resume_versions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    parent_resume_id UUID REFERENCES resumes(id) ON DELETE SET NULL,
    version_title VARCHAR(150) NOT NULL,
    target_role VARCHAR(150),
    target_company VARCHAR(150),
    structured_content JSONB NOT NULL,
    ats_score INTEGER,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 5. Skills Master Catalog & User Skills
CREATE TABLE IF NOT EXISTS skills (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(100) UNIQUE NOT NULL,
    category VARCHAR(50), -- 'language', 'framework', 'database', 'cloud', 'devops', 'soft_skill'
    is_verified BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS user_skills (
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    skill_id UUID NOT NULL REFERENCES skills(id) ON DELETE CASCADE,
    years_experience NUMERIC(4, 1),
    proficiency_level VARCHAR(50), -- 'beginner', 'intermediate', 'advanced', 'expert'
    PRIMARY KEY (user_id, skill_id)
);

-- 6. Career Roles (Top 20 recommended realistic roles)
CREATE TABLE IF NOT EXISTS career_roles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    role_title VARCHAR(150) NOT NULL,
    match_score INTEGER NOT NULL,
    reason TEXT NOT NULL,
    seniority VARCHAR(50) NOT NULL,
    existing_skills TEXT[] DEFAULT ARRAY[]::TEXT[],
    missing_skills TEXT[] DEFAULT ARRAY[]::TEXT[],
    ats_keywords TEXT[] DEFAULT ARRAY[]::TEXT[],
    typical_responsibilities TEXT[] DEFAULT ARRAY[]::TEXT[],
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 7. Job Sources (Modular provider configuration)
CREATE TABLE IF NOT EXISTS job_sources (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    provider_name VARCHAR(100) UNIQUE NOT NULL, -- 'linkedin', 'indeed', 'greenhouse', 'lever', 'direct'
    is_active BOOLEAN DEFAULT TRUE,
    api_endpoint TEXT,
    auth_type VARCHAR(50) DEFAULT 'none', -- 'oauth2', 'api_key', 'public_rss'
    rate_limit_per_minute INTEGER DEFAULT 60,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 8. Jobs (Deduplicated Job Postings)
CREATE TABLE IF NOT EXISTS jobs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    external_job_id VARCHAR(255),
    source_provider VARCHAR(100) NOT NULL,
    company_name VARCHAR(150) NOT NULL,
    title VARCHAR(150) NOT NULL,
    location VARCHAR(150) NOT NULL,
    work_mode VARCHAR(50) DEFAULT 'remote', -- 'remote', 'hybrid', 'onsite'
    employment_type VARCHAR(50) DEFAULT 'full_time', -- 'full_time', 'contract', 'part_time'
    salary_min INTEGER,
    salary_max INTEGER,
    salary_currency VARCHAR(10) DEFAULT 'USD',
    description TEXT NOT NULL,
    requirements TEXT[],
    required_skills TEXT[],
    preferred_skills TEXT[],
    ats_keywords TEXT[],
    direct_apply_url TEXT NOT NULL,
    found_on_sources TEXT[] DEFAULT ARRAY['direct'], -- for deduplication provenance
    date_posted TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 9. Job Matches (Cached match calculations)
CREATE TABLE IF NOT EXISTS job_matches (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    job_id UUID NOT NULL REFERENCES jobs(id) ON DELETE CASCADE,
    overall_score INTEGER NOT NULL,
    skills_score INTEGER NOT NULL,
    experience_score INTEGER NOT NULL,
    seniority_score INTEGER NOT NULL,
    education_score INTEGER NOT NULL,
    location_score INTEGER NOT NULL,
    keywords_score INTEGER NOT NULL,
    strong_matches TEXT[],
    missing_skills TEXT[],
    potential_concerns TEXT[],
    ats_matched_keywords TEXT[],
    ats_missing_keywords TEXT[],
    calculated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uq_user_job_match UNIQUE (user_id, job_id)
);

-- 10. Tailored Resumes
CREATE TABLE IF NOT EXISTS tailored_resumes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    job_id UUID NOT NULL REFERENCES jobs(id) ON DELETE CASCADE,
    master_resume_id UUID REFERENCES resumes(id) ON DELETE SET NULL,
    tailored_content JSONB NOT NULL,
    summary_diff TEXT,
    skills_diff TEXT,
    bullet_diffs JSONB,
    ats_score INTEGER,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 11. Cover Letters
CREATE TABLE IF NOT EXISTS cover_letters (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    job_id UUID NOT NULL REFERENCES jobs(id) ON DELETE CASCADE,
    tone VARCHAR(50) DEFAULT 'professional', -- 'professional', 'confident', 'concise', 'technical'
    length VARCHAR(50) DEFAULT 'medium', -- 'short', 'medium', 'long'
    content TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 12. Applications (Kanban Tracking)
CREATE TABLE IF NOT EXISTS applications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    job_id UUID NOT NULL REFERENCES jobs(id) ON DELETE CASCADE,
    resume_id UUID REFERENCES resumes(id) ON DELETE SET NULL,
    tailored_resume_id UUID REFERENCES tailored_resumes(id) ON DELETE SET NULL,
    cover_letter_id UUID REFERENCES cover_letters(id) ON DELETE SET NULL,
    status VARCHAR(50) DEFAULT 'saved', -- 'saved', 'preparing', 'ready_to_apply', 'application_opened', 'submitted', 'interview', 'rejected', 'offer', 'withdrawn'
    match_score INTEGER,
    date_applied TIMESTAMP WITH TIME ZONE,
    interview_date TIMESTAMP WITH TIME ZONE,
    notes TEXT,
    next_action VARCHAR(255),
    submission_confirmation_verified BOOLEAN DEFAULT FALSE,
    external_submission_id VARCHAR(255),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uq_user_job_app UNIQUE (user_id, job_id)
);

-- 13. Application Answers (Job Question Answers)
CREATE TABLE IF NOT EXISTS application_answers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    application_id UUID NOT NULL REFERENCES applications(id) ON DELETE CASCADE,
    question TEXT NOT NULL,
    suggested_answer TEXT NOT NULL,
    user_edited_answer TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 14. Application Events (Audit Trail)
CREATE TABLE IF NOT EXISTS application_events (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    application_id UUID NOT NULL REFERENCES applications(id) ON DELETE CASCADE,
    event_type VARCHAR(100) NOT NULL, -- 'status_changed', 'application_opened_in_browser', 'confirmed_submitted', 'interview_scheduled'
    payload JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 15. Integrations (OAuth tokens, API credentials for supported platforms)
CREATE TABLE IF NOT EXISTS integrations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    provider_name VARCHAR(100) NOT NULL,
    is_connected BOOLEAN DEFAULT FALSE,
    access_token_encrypted TEXT,
    refresh_token_encrypted TEXT,
    token_expires_at TIMESTAMP WITH TIME ZONE,
    metadata JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 16. AI Usage (Quota, token tracking, audit)
CREATE TABLE IF NOT EXISTS ai_usage (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    service_name VARCHAR(100) NOT NULL, -- 'ResumeAnalyzer', 'JobMatcher', 'CareerAssistant', etc.
    model_name VARCHAR(100) NOT NULL,
    prompt_tokens INTEGER DEFAULT 0,
    completion_tokens INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 17. User Preferences
CREATE TABLE IF NOT EXISTS user_preferences (
    user_id UUID PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
    theme VARCHAR(20) DEFAULT 'dark', -- 'light', 'dark', 'system'
    email_alerts BOOLEAN DEFAULT TRUE,
    push_notifications BOOLEAN DEFAULT TRUE,
    auto_generate_tailored_resumes BOOLEAN DEFAULT FALSE,
    default_cover_letter_tone VARCHAR(50) DEFAULT 'professional',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- INDEXES for high query performance
CREATE INDEX IF NOT EXISTS idx_jobs_company ON jobs (company_name);
CREATE INDEX IF NOT EXISTS idx_jobs_title ON jobs (title);
CREATE INDEX IF NOT EXISTS idx_jobs_location ON jobs (location);
CREATE INDEX IF NOT EXISTS idx_jobs_work_mode ON jobs (work_mode);
CREATE INDEX IF NOT EXISTS idx_applications_user_status ON applications (user_id, status);
CREATE INDEX IF NOT EXISTS idx_job_matches_user_score ON job_matches (user_id, overall_score DESC);
CREATE INDEX IF NOT EXISTS idx_career_roles_user ON career_roles (user_id, match_score DESC);
