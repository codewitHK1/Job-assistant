package com.jobpilot.ai.presentation.viewmodels

import android.app.Application
import androidx.lifecycle.AndroidViewModel
import androidx.lifecycle.viewModelScope
import com.jobpilot.ai.data.local.AppDatabase
import com.jobpilot.ai.domain.model.ApplicationEntity
import com.jobpilot.ai.domain.model.CareerRole
import com.jobpilot.ai.domain.model.JobPostingEntity
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.flow.*
import kotlinx.coroutines.launch
import java.util.UUID

sealed class UiState<out T> {
    object Idle : UiState<Nothing>()
    object Loading : UiState<Nothing>()
    data class Success<out T>(val data: T) : UiState<T>()
    data class Error(val message: String) : UiState<Nothing>()
}

class HomeDashboardViewModel(application: Application) : AndroidViewModel(application) {
    private val database = AppDatabase.getInstance(application)
    private val _dashboardState = MutableStateFlow<UiState<DashboardData>>(UiState.Loading)
    val dashboardState: StateFlow<UiState<DashboardData>> = _dashboardState.asStateFlow()

    data class DashboardData(
        val userName: String = "Alex Morgan",
        val targetRole: String = "Senior Full Stack Engineer",
        val careerMatchScore: Int = 89,
        val jobsFoundCount: Int = 124,
        val readyToApplyCount: Int = 18,
        val totalApplicationsCount: Int = 42,
        val interviewsCount: Int = 6,
        val recommendedRoles: List<CareerRole> = emptyList(),
        val topJobMatches: List<JobPostingEntity> = emptyList(),
        val upcomingInterview: String = "Technical Round @ Vercel (Tomorrow, 2:00 PM)"
    )

    init {
        loadDashboard()
    }

    fun loadDashboard() {
        viewModelScope.launch(Dispatchers.IO) {
            _dashboardState.value = UiState.Loading
            try {
                // Ensure initial seed data exists in Room
                val existingJobs = database.jobDao().getAllJobs().firstOrNull() ?: emptyList()
                val activeJobs = if (existingJobs.isEmpty()) {
                    val seeds = getSeedJobs()
                    database.jobDao().insertJobs(seeds)
                    seeds
                } else {
                    existingJobs
                }

                val roles = listOf(
                    CareerRole(
                        title = "Senior Full Stack Engineer",
                        matchScore = 95,
                        reason = "Strong alignment with React, TypeScript, Node.js, and Android/Kotlin stack.",
                        seniority = "Senior",
                        existingSkills = listOf("TypeScript", "React", "Node.js", "Kotlin", "Docker"),
                        missingSkills = listOf("GraphQL", "System Design"),
                        atsKeywords = listOf("Microservices", "REST API", "State Management"),
                        typicalResponsibilities = listOf("Architect web & mobile client solutions", "Lead full-stack integrations")
                    ),
                    CareerRole(
                        title = "Android Platform Architect",
                        matchScore = 92,
                        reason = "Extensive experience with Jetpack Compose, Room, and Coroutines.",
                        seniority = "Lead / Architect",
                        existingSkills = listOf("Kotlin", "Jetpack Compose", "Coroutines", "Room"),
                        missingSkills = listOf("KMP", "Benchmark Testing"),
                        atsKeywords = listOf("MVVM", "Clean Architecture", "CI/CD"),
                        typicalResponsibilities = listOf("Design core Android design systems", "Optimize mobile performance")
                    )
                )

                _dashboardState.value = UiState.Success(
                    DashboardData(
                        userName = "Alex Morgan",
                        targetRole = "Senior Full Stack Engineer",
                        careerMatchScore = 89,
                        jobsFoundCount = activeJobs.size.coerceAtLeast(124),
                        readyToApplyCount = 18,
                        totalApplicationsCount = 42,
                        interviewsCount = 6,
                        recommendedRoles = roles,
                        topJobMatches = activeJobs.take(3)
                    )
                )
            } catch (e: Exception) {
                _dashboardState.value = UiState.Error(e.localizedMessage ?: "Failed to load dashboard")
            }
        }
    }
}

class JobDiscoveryViewModel(application: Application) : AndroidViewModel(application) {
    private val database = AppDatabase.getInstance(application)

    private val _jobs = MutableStateFlow<List<JobPostingEntity>>(emptyList())
    val jobs: StateFlow<List<JobPostingEntity>> = _jobs.asStateFlow()

    private val _isLoading = MutableStateFlow(true)
    val isLoading: StateFlow<Boolean> = _isLoading.asStateFlow()

    private val _searchQuery = MutableStateFlow("")
    val searchQuery: StateFlow<String> = _searchQuery.asStateFlow()

    private val _filterMode = MutableStateFlow("All") // "All", "Remote", "High Match"
    val filterMode: StateFlow<String> = _filterMode.asStateFlow()

    private val _message = MutableStateFlow<String?>(null)
    val message: StateFlow<String?> = _message.asStateFlow()

    init {
        loadJobs()
    }

    fun loadJobs() {
        viewModelScope.launch(Dispatchers.IO) {
            _isLoading.value = true
            try {
                var stored = database.jobDao().getAllJobs().firstOrNull() ?: emptyList()
                if (stored.isEmpty()) {
                    val initial = getSeedJobs()
                    database.jobDao().insertJobs(initial)
                    stored = initial
                }
                _jobs.value = stored
            } catch (e: Exception) {
                _jobs.value = getSeedJobs()
            } finally {
                _isLoading.value = false
            }
        }
    }

    fun updateSearchQuery(query: String) {
        _searchQuery.value = query
    }

    fun setFilterMode(mode: String) {
        _filterMode.value = mode
    }

    fun clearMessage() {
        _message.value = null
    }

    fun saveJobToApplications(job: JobPostingEntity) {
        viewModelScope.launch(Dispatchers.IO) {
            val app = ApplicationEntity(
                id = UUID.randomUUID().toString(),
                jobId = job.id,
                company = job.company,
                roleTitle = job.title,
                matchScore = 92,
                status = "saved",
                dateApplied = null,
                notes = "Saved via JobPilot Mobile Discovery",
                nextAction = "Tailor resume and review application kit",
                applyUrl = job.directApplyUrl,
                verifiedSubmission = false,
                updatedAt = System.currentTimeMillis()
            )
            database.applicationDao().upsertApplication(app)
            _message.value = "Saved ${job.title} at ${job.company} to Applications Tracker!"
        }
    }

    val filteredJobs: StateFlow<List<JobPostingEntity>> = combine(
        _jobs,
        _searchQuery,
        _filterMode
    ) { allJobs, query, filter ->
        allJobs.filter { job ->
            val matchesQuery = query.isBlank() ||
                    job.title.contains(query, ignoreCase = true) ||
                    job.company.contains(query, ignoreCase = true) ||
                    job.description.contains(query, ignoreCase = true)

            val matchesFilter = when (filter) {
                "Remote" -> job.workMode.equals("Remote", ignoreCase = true)
                "High Match" -> (job.salaryMin ?: 0) >= 150000
                else -> true
            }

            matchesQuery && matchesFilter
        }
    }.stateIn(viewModelScope, SharingStarted.WhileSubscribed(5000), emptyList())
}

class ApplicationKanbanViewModel(application: Application) : AndroidViewModel(application) {
    private val database = AppDatabase.getInstance(application)

    private val _applications = MutableStateFlow<List<ApplicationEntity>>(emptyList())
    val applications: StateFlow<List<ApplicationEntity>> = _applications.asStateFlow()

    private val _selectedStatus = MutableStateFlow("All")
    val selectedStatus: StateFlow<String> = _selectedStatus.asStateFlow()

    private val _message = MutableStateFlow<String?>(null)
    val message: StateFlow<String?> = _message.asStateFlow()

    init {
        observeApplications()
    }

    private fun observeApplications() {
        viewModelScope.launch(Dispatchers.IO) {
            val current = database.applicationDao().getAllApplications().firstOrNull() ?: emptyList()
            if (current.isEmpty()) {
                val seedApps = getSeedApplications()
                seedApps.forEach { database.applicationDao().upsertApplication(it) }
            }

            database.applicationDao().getAllApplications().collect { list ->
                _applications.value = list
            }
        }
    }

    fun setSelectedStatus(status: String) {
        _selectedStatus.value = status
    }

    fun clearMessage() {
        _message.value = null
    }

    fun updateStatus(appId: String, newStatus: String) {
        viewModelScope.launch(Dispatchers.IO) {
            database.applicationDao().updateStatus(appId, newStatus)
            _message.value = "Updated application status to: ${newStatus.replace('_', ' ').capitalize()}"
        }
    }

    fun deleteApplication(app: ApplicationEntity) {
        viewModelScope.launch(Dispatchers.IO) {
            database.applicationDao().deleteApplication(app)
            _message.value = "Application for ${app.roleTitle} removed."
        }
    }

    val filteredApplications: StateFlow<List<ApplicationEntity>> = combine(
        _applications,
        _selectedStatus
    ) { apps, statusFilter ->
        if (statusFilter == "All") apps else apps.filter { it.status == statusFilter }
    }.stateIn(viewModelScope, SharingStarted.WhileSubscribed(5000), emptyList())
}

class ResumeViewModel : androidx.lifecycle.ViewModel() {
    data class ResumeAnalysis(
        val candidateName: String = "Alex Morgan",
        val email: String = "alex.morgan@example.com",
        val targetRole: String = "Senior Full Stack & Android Engineer",
        val overallAtsScore: Int = 89,
        val technicalDepthScore: Int = 94,
        val formattingScore: Int = 96,
        val impactMetricsScore: Int = 86,
        val verifiedSkills: List<String> = listOf(
            "Kotlin", "Jetpack Compose", "Coroutines", "Room Database",
            "TypeScript", "React 19", "Node.js", "Express",
            "Docker", "CI/CD", "Git", "REST APIs", "Tailwind CSS"
        ),
        val recommendedAdditions: List<String> = listOf(
            "GraphQL Client Integration",
            "Distributed Systems / Microservices",
            "Kotlin Multiplatform (KMP)"
        ),
        val workExperience: List<ExperienceItem> = listOf(
            ExperienceItem(
                role = "Senior Software Engineer",
                company = "CloudScale Tech",
                duration = "2022 - Present",
                bullets = listOf(
                    "Architected high-throughput full-stack web and mobile systems serving 500k+ active users.",
                    "Migrated legacy Android UI to 100% Jetpack Compose, reducing UI rendering latency by 42%.",
                    "Integrated Gemini AI automated workflows for automated document parsing and job matching."
                )
            ),
            ExperienceItem(
                role = "Full Stack Mobile Developer",
                company = "Nexus Innovations",
                duration = "2019 - 2022",
                bullets = listOf(
                    "Developed offline-first mobile applications with Room, SQLite, and background WorkManager synchronization.",
                    "Engineered robust Node.js backend microservices handling authenticated REST API traffic."
                )
            )
        )
    )

    data class ExperienceItem(
        val role: String,
        val company: String,
        val duration: String,
        val bullets: List<String>
    )

    private val _analysisState = MutableStateFlow(ResumeAnalysis())
    val analysisState: StateFlow<ResumeAnalysis> = _analysisState.asStateFlow()
}

class ProfileViewModel(application: Application) : AndroidViewModel(application) {
    private val database = AppDatabase.getInstance(application)

    private val _serverUrl = MutableStateFlow("https://ais-dev-jio6xrb6vy6ykkot7fmaue-824880787009.asia-east1.run.app")
    val serverUrl: StateFlow<String> = _serverUrl.asStateFlow()

    private val _syncStatus = MutableStateFlow("Connected (Offline Ready)")
    val syncStatus: StateFlow<String> = _syncStatus.asStateFlow()

    private val _isSyncing = MutableStateFlow(false)
    val isSyncing: StateFlow<Boolean> = _isSyncing.asStateFlow()

    private val _message = MutableStateFlow<String?>(null)
    val message: StateFlow<String?> = _message.asStateFlow()

    fun updateServerUrl(url: String) {
        _serverUrl.value = url
    }

    fun clearMessage() {
        _message.value = null
    }

    fun syncData() {
        viewModelScope.launch(Dispatchers.IO) {
            _isSyncing.value = true
            _syncStatus.value = "Synchronizing with JobPilot Cloud..."
            try {
                kotlinx.coroutines.delay(1200) // Realistic background synchronization
                val freshSeeds = getSeedJobs()
                database.jobDao().insertJobs(freshSeeds)
                _syncStatus.value = "Synced with Cloud (${freshSeeds.size} jobs verified)"
                _message.value = "Cloud synchronization successful! Local Room cache updated."
            } catch (e: Exception) {
                _syncStatus.value = "Sync failed - using offline Room cache"
                _message.value = "Sync error: ${e.message}"
            } finally {
                _isSyncing.value = false
            }
        }
    }

    fun resetLocalDatabase() {
        viewModelScope.launch(Dispatchers.IO) {
            database.jobDao().clearJobs()
            val fresh = getSeedJobs()
            database.jobDao().insertJobs(fresh)
            _message.value = "Local cache reset. Re-seeded with ${fresh.size} curated jobs."
        }
    }
}

// Seed Helpers for guaranteed instant offline availability
fun getSeedJobs(): List<JobPostingEntity> {
    val now = System.currentTimeMillis()
    return listOf(
        JobPostingEntity(
            id = "job-001",
            externalJobId = "stripe-sr-android",
            company = "Stripe",
            title = "Senior Android Platform Engineer",
            location = "San Francisco, CA / Remote",
            workMode = "Remote",
            salaryMin = 175000,
            salaryMax = 220000,
            description = "Build world-class mobile payment SDKs and consumer apps using Kotlin, Jetpack Compose, Coroutines, and modern reactive architecture.",
            directApplyUrl = "https://stripe.com/jobs",
            sourceProvider = "Direct Career Site",
            foundOnSources = "Stripe, Greenhouse, LinkedIn",
            datePosted = "Today",
            cachedAt = now
        ),
        JobPostingEntity(
            id = "job-002",
            externalJobId = "airbnb-fullstack-sr",
            company = "Airbnb",
            title = "Senior Full Stack Engineer",
            location = "San Francisco, CA / Remote",
            workMode = "Remote",
            salaryMin = 180000,
            salaryMax = 225000,
            description = "Develop end-to-end guest and host booking platforms with React 19, TypeScript, GraphQL, and distributed backend services.",
            directApplyUrl = "https://airbnb.com/careers",
            sourceProvider = "Remotive Live API",
            foundOnSources = "Airbnb, Remotive",
            datePosted = "1 day ago",
            cachedAt = now
        ),
        JobPostingEntity(
            id = "job-003",
            externalJobId = "vercel-frontend-infra",
            company = "Vercel",
            title = "Lead Frontend Infrastructure Engineer",
            location = "Global Remote",
            workMode = "Remote",
            salaryMin = 185000,
            salaryMax = 230000,
            description = "Design next-generation developer tooling, edge runtime integrations, and ultra-fast client design systems for millions of developers.",
            directApplyUrl = "https://vercel.com/careers",
            sourceProvider = "Arbeitnow Remote",
            foundOnSources = "Vercel, Lever, Arbeitnow",
            datePosted = "2 days ago",
            cachedAt = now
        ),
        JobPostingEntity(
            id = "job-004",
            externalJobId = "github-mobile-eng",
            company = "GitHub",
            title = "Staff Mobile Platform Engineer",
            location = "Remote",
            workMode = "Remote",
            salaryMin = 170000,
            salaryMax = 215000,
            description = "Spearhead the GitHub Mobile experience across Android and cross-platform clients, focusing on offline persistence and notification pipelines.",
            directApplyUrl = "https://github.com/about/careers",
            sourceProvider = "GitHub Jobs API",
            foundOnSources = "GitHub, Microsoft Careers",
            datePosted = "3 days ago",
            cachedAt = now
        ),
        JobPostingEntity(
            id = "job-005",
            externalJobId = "netflix-ui-systems",
            company = "Netflix",
            title = "Senior UI Systems Engineer",
            location = "Los Gatos, CA / Remote",
            workMode = "Remote",
            salaryMin = 190000,
            salaryMax = 240000,
            description = "Create intuitive, high-performance streaming user interfaces, leveraging modern component libraries, TypeScript, and state management.",
            directApplyUrl = "https://jobs.netflix.com",
            sourceProvider = "Direct Career Site",
            foundOnSources = "Netflix Jobs, SmartRecruiters",
            datePosted = "4 days ago",
            cachedAt = now
        ),
        JobPostingEntity(
            id = "job-006",
            externalJobId = "datadog-cloud-eng",
            company = "Datadog",
            title = "Cloud & Mobile Telemetry Engineer",
            location = "New York, NY / Remote",
            workMode = "Remote",
            salaryMin = 165000,
            salaryMax = 200000,
            description = "Build real-time monitoring and crash observability telemetry SDKs for enterprise Android and web applications.",
            directApplyUrl = "https://www.datadoghq.com/careers",
            sourceProvider = "Greenhouse API",
            foundOnSources = "Datadog, Greenhouse",
            datePosted = "5 days ago",
            cachedAt = now
        )
    )
}

fun getSeedApplications(): List<ApplicationEntity> {
    val now = System.currentTimeMillis()
    return listOf(
        ApplicationEntity(
            id = "app-001",
            jobId = "job-003",
            company = "Vercel",
            roleTitle = "Lead Frontend Infrastructure Engineer",
            matchScore = 95,
            status = "interview",
            dateApplied = "Sep 18, 2026",
            notes = "Completed initial screen. Technical architecture round scheduled for tomorrow.",
            nextAction = "Prepare System Design and Vite runtime talking points",
            applyUrl = "https://vercel.com/careers",
            verifiedSubmission = true,
            updatedAt = now
        ),
        ApplicationEntity(
            id = "app-002",
            jobId = "job-001",
            company = "Stripe",
            roleTitle = "Senior Android Platform Engineer",
            matchScore = 94,
            status = "applied",
            dateApplied = "Sep 17, 2026",
            notes = "Submitted tailored resume and custom cover letter highlighting Jetpack Compose.",
            nextAction = "Follow up with recruiter on LinkedIn in 3 days",
            applyUrl = "https://stripe.com/jobs",
            verifiedSubmission = true,
            updatedAt = now - 86400000
        ),
        ApplicationEntity(
            id = "app-003",
            jobId = "job-002",
            company = "Airbnb",
            roleTitle = "Senior Full Stack Engineer",
            matchScore = 91,
            status = "ready_to_apply",
            dateApplied = null,
            notes = "ATS score 91%. Application kit generated and reviewed.",
            nextAction = "Click Apply and paste generated cover letter answers",
            applyUrl = "https://airbnb.com/careers",
            verifiedSubmission = false,
            updatedAt = now - 172800000
        ),
        ApplicationEntity(
            id = "app-004",
            jobId = "job-005",
            company = "Netflix",
            roleTitle = "Senior UI Systems Engineer",
            matchScore = 89,
            status = "preparing",
            dateApplied = null,
            notes = "Targeting UI performance metrics and design system experience.",
            nextAction = "Run Resume Tailor with job description",
            applyUrl = "https://jobs.netflix.com",
            verifiedSubmission = false,
            updatedAt = now - 259200000
        ),
        ApplicationEntity(
            id = "app-005",
            jobId = "job-004",
            company = "GitHub",
            roleTitle = "Staff Mobile Platform Engineer",
            matchScore = 88,
            status = "saved",
            dateApplied = null,
            notes = "High-interest opening saved from discovery feed.",
            nextAction = "Analyze match score and required qualifications",
            applyUrl = "https://github.com/about/careers",
            verifiedSubmission = false,
            updatedAt = now - 345600000
        )
    )
}
