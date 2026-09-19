package com.jobpilot.ai.domain.model

import androidx.room.Entity
import androidx.room.PrimaryKey
import java.util.UUID

/**
 * JobPilot AI Domain Models
 * Clean Architecture Domain Layer
 */

data class UserProfile(
    val id: String = UUID.randomUUID().toString(),
    val name: String,
    val email: String,
    val currentRole: String,
    val yearsOfExperience: Double,
    val skills: List<String>,
    val preferredLocations: List<String>,
    val workModePreference: String = "remote"
)

data class CareerRole(
    val title: String,
    val matchScore: Int,
    val reason: String,
    val seniority: String,
    val existingSkills: List<String>,
    val missingSkills: List<String>,
    val atsKeywords: List<String>,
    val typicalResponsibilities: List<String>
)

data class JobMatchScore(
    val overallScore: Int,
    val skillsScore: Int,
    val experienceScore: Int,
    val seniorityScore: Int,
    val educationScore: Int,
    val locationScore: Int,
    val keywordsScore: Int,
    val strongMatches: List<String>,
    val missingSkills: List<String>,
    val potentialConcerns: List<String>,
    val atsMatchedKeywords: List<String>,
    val atsMissingKeywords: List<String>
)

@Entity(tableName = "cached_jobs")
data class JobPostingEntity(
    @PrimaryKey val id: String,
    val externalJobId: String,
    val company: String,
    val title: String,
    val location: String,
    val workMode: String,
    val salaryMin: Int?,
    val salaryMax: Int?,
    val description: String,
    val directApplyUrl: String,
    val sourceProvider: String,
    val foundOnSources: String, // Comma-delimited
    val datePosted: String,
    val cachedAt: Long = System.currentTimeMillis()
)

@Entity(tableName = "applications")
data class ApplicationEntity(
    @PrimaryKey val id: String = UUID.randomUUID().toString(),
    val jobId: String,
    val company: String,
    val roleTitle: String,
    val matchScore: Int,
    val status: String, // 'saved', 'preparing', 'ready_to_apply', 'application_opened', 'submitted', 'interview', 'rejected', 'offer'
    val dateApplied: String?,
    val notes: String?,
    val nextAction: String?,
    val applyUrl: String,
    val verifiedSubmission: Boolean = false,
    val updatedAt: Long = System.currentTimeMillis()
)
