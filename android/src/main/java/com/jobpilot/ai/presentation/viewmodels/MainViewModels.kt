package com.jobpilot.ai.presentation.viewmodels

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.jobpilot.ai.domain.model.ApplicationEntity
import com.jobpilot.ai.domain.model.CareerRole
import com.jobpilot.ai.domain.model.JobPostingEntity
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.launch

/**
 * StateFlow Architecture with MVVM Clean Architecture
 */

sealed class UiState<out T> {
    object Idle : UiState<Nothing>()
    object Loading : UiState<Nothing>()
    data class Success<out T>(val data: T) : UiState<T>()
    data class Error(val message: String) : UiState<Nothing>()
}

class HomeDashboardViewModel : ViewModel() {
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
        val recommendedRoles: List<CareerRole> = emptyList()
    )

    init {
        loadDashboard()
    }

    fun loadDashboard() {
        viewModelScope.launch {
            _dashboardState.value = UiState.Loading
            try {
                // In production, syncs with JobPilotRepository Room cache and REST API
                _dashboardState.value = UiState.Success(
                    DashboardData(
                        userName = "Alex Morgan",
                        targetRole = "Senior Full Stack Engineer",
                        careerMatchScore = 89,
                        jobsFoundCount = 124,
                        readyToApplyCount = 18,
                        totalApplicationsCount = 42,
                        interviewsCount = 6
                    )
                )
            } catch (e: Exception) {
                _dashboardState.value = UiState.Error(e.localizedMessage ?: "Failed to load dashboard")
            }
        }
    }
}

class JobDiscoveryViewModel : ViewModel() {
    private val _jobsState = MutableStateFlow<UiState<List<JobPostingEntity>>>(UiState.Loading)
    val jobsState: StateFlow<UiState<List<JobPostingEntity>>> = _jobsState.asStateFlow()

    private val _searchFilter = MutableStateFlow("")
    val searchFilter: StateFlow<String> = _searchFilter.asStateFlow()

    fun updateSearchQuery(query: String) {
        _searchFilter.value = query
    }
}

class ApplicationKanbanViewModel : ViewModel() {
    private val _applications = MutableStateFlow<List<ApplicationEntity>>(emptyList())
    val applications: StateFlow<List<ApplicationEntity>> = _applications.asStateFlow()

    fun updateApplicationStatus(appId: String, newStatus: String) {
        viewModelScope.launch {
            _applications.value = _applications.value.map { app ->
                if (app.id == appId) app.copy(status = newStatus, updatedAt = System.currentTimeMillis()) else app
            }
        }
    }
}
