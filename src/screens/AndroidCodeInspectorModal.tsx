import React, { useState } from "react";
import { X, Code, Copy, Check, FileCode, CheckCircle2 } from "lucide-react";

interface AndroidCodeInspectorModalProps {
  onClose: () => void;
}

const FILES: Array<{ id: string; name: string; lang: string; path: string; description: string; code: string }> = [
  {
    id: "compose",
    name: "JobPilotComposeScreens.kt",
    lang: "kotlin",
    path: "android/ui/screens/JobPilotComposeScreens.kt",
    description: "Material 3 Jetpack Compose NavigationBar & Screen Composables",
    code: `package com.jobpilot.ai.ui.screens

import androidx.compose.foundation.background
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp

enum class Screen(val title: String, val icon: androidx.compose.ui.graphics.vector.ImageVector) {
    Home("Home", Icons.Default.Home),
    Jobs("Jobs", Icons.Default.Search),
    Applications("Applications", Icons.Default.CheckCircle),
    Resume("Resume", Icons.Default.Description),
    Profile("Profile", Icons.Default.Person)
}

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun JobPilotApp() {
    var selectedScreen by remember { mutableStateOf(Screen.Home) }

    Scaffold(
        bottomBar = {
            NavigationBar(containerColor = MaterialTheme.colorScheme.surfaceVariant, tonalElevation = 4.dp) {
                Screen.values().forEach { screen ->
                    NavigationBarItem(
                        selected = selectedScreen == screen,
                        onClick = { selectedScreen = screen },
                        icon = { Icon(screen.icon, contentDescription = screen.title) },
                        label = { Text(screen.title, fontSize = 12.sp) }
                    )
                }
            }
        },
        topBar = {
            TopAppBar(
                title = { Text("JobPilot AI", style = MaterialTheme.typography.titleLarge.copy(fontWeight = FontWeight.Bold)) }
            )
        }
    ) { innerPadding ->
        Box(modifier = Modifier.padding(innerPadding).fillMaxSize()) {
            when (selectedScreen) {
                Screen.Home -> HomeScreenContent()
                Screen.Jobs -> JobsScreenContent()
                Screen.Applications -> ApplicationsKanbanContent()
                Screen.Resume -> ResumeScreenContent()
                Screen.Profile -> ProfileScreenContent()
            }
        }
    }
}`,
  },
  {
    id: "room",
    name: "AppDatabase.kt",
    lang: "kotlin",
    path: "android/data/local/AppDatabase.kt",
    description: "Android Room Database, Entities, & DAOs for Offline-First Sync",
    code: `package com.jobpilot.ai.data.local

import androidx.room.*
import com.jobpilot.ai.domain.model.ApplicationEntity
import com.jobpilot.ai.domain.model.JobPostingEntity
import kotlinx.coroutines.flow.Flow

@Dao
interface JobDao {
    @Query("SELECT * FROM cached_jobs ORDER BY cachedAt DESC")
    fun getAllJobs(): Flow<List<JobPostingEntity>>

    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun insertJobs(jobs: List<JobPostingEntity>)
}

@Dao
interface ApplicationDao {
    @Query("SELECT * FROM applications ORDER BY updatedAt DESC")
    fun getAllApplications(): Flow<List<ApplicationEntity>>

    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun upsertApplication(application: ApplicationEntity)

    @Query("UPDATE applications SET status = :newStatus WHERE id = :appId")
    suspend fun updateStatus(appId: String, newStatus: String)
}

@Database(entities = [JobPostingEntity::class, ApplicationEntity::class], version = 1)
abstract class AppDatabase : RoomDatabase() {
    abstract fun jobDao(): JobDao
    abstract fun applicationDao(): ApplicationDao
}`,
  },
  {
    id: "viewmodel",
    name: "MainViewModels.kt",
    lang: "kotlin",
    path: "android/presentation/viewmodels/MainViewModels.kt",
    description: "MVVM Clean Architecture ViewModels using StateFlow & Coroutines",
    code: `package com.jobpilot.ai.presentation.viewmodels

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.jobpilot.ai.domain.model.ApplicationEntity
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.launch

class ApplicationKanbanViewModel : ViewModel() {
    private val _applications = MutableStateFlow<List<ApplicationEntity>>(emptyList())
    val applications: StateFlow<List<ApplicationEntity>> = _applications.asStateFlow()

    fun updateApplicationStatus(appId: String, newStatus: String) {
        viewModelScope.launch {
            _applications.value = _applications.value.map { app ->
                if (app.id == appId) app.copy(status = newStatus) else app
            }
        }
    }
}`,
  },
  {
    id: "schema",
    name: "postgresSchema.sql",
    lang: "sql",
    path: "server/database/postgresSchema.sql",
    description: "Production PostgreSQL Schema (Users, Resumes, Jobs, Applications, Analytics)",
    code: `CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    full_name VARCHAR(150) NOT NULL,
    subscription_tier VARCHAR(50) DEFAULT 'free'
);

CREATE TABLE applications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id),
    job_id UUID REFERENCES jobs(id),
    status VARCHAR(50) NOT NULL,
    match_score INT NOT NULL,
    date_applied DATE,
    submission_verified BOOLEAN DEFAULT FALSE,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);`,
  },
];

export const AndroidCodeInspectorModal: React.FC<AndroidCodeInspectorModalProps> = ({ onClose }) => {
  const [activeFileId, setActiveFileId] = useState(FILES[0].id);
  const [copied, setCopied] = useState(false);

  const currentFile = FILES.find((f) => f.id === activeFileId) || FILES[0];

  const handleCopy = () => {
    navigator.clipboard.writeText(currentFile.code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-end sm:items-center justify-center p-0 sm:p-4">
      <div className="w-full sm:max-w-3xl h-[88vh] bg-slate-900 border border-slate-800 rounded-t-3xl sm:rounded-2xl flex flex-col overflow-hidden shadow-2xl">
        {/* Header */}
        <div className="p-4 border-b border-slate-800 flex items-center justify-between bg-slate-950/70">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-indigo-600/30 border border-indigo-500/40 flex items-center justify-center text-indigo-400">
              <FileCode className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-white">Native Android Architecture & Code</h2>
              <span className="text-[10px] text-slate-400">
                Kotlin 2.0 • Jetpack Compose • Material 3 • Room 2.6 • Coroutines Flow
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleCopy}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium border border-slate-700 transition-all"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copied ? "Copied!" : "Copy File"}</span>
            </button>
            <button
              onClick={onClose}
              className="p-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-slate-200"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* File Tabs Ribbon */}
        <div className="flex items-center gap-1 overflow-x-auto px-4 py-2 border-b border-slate-800/80 bg-slate-950/40 no-scrollbar text-xs">
          {FILES.map((f) => (
            <button
              key={f.id}
              onClick={() => setActiveFileId(f.id)}
              className={`px-3 py-1.5 rounded-lg text-xs font-mono font-medium whitespace-nowrap transition-all border ${
                activeFileId === f.id
                  ? "bg-indigo-600/30 border-indigo-500/50 text-indigo-300"
                  : "bg-slate-900 border-slate-800 text-slate-400 hover:text-slate-200"
              }`}
            >
              {f.name}
            </button>
          ))}
        </div>

        {/* File Description Header */}
        <div className="px-4 py-2 bg-slate-950/80 border-b border-slate-800/60 flex items-center justify-between text-[11px] text-slate-400">
          <span className="font-mono text-indigo-300">{currentFile.path}</span>
          <span>{currentFile.description}</span>
        </div>

        {/* Code Canvas */}
        <div className="flex-1 overflow-y-auto p-4 bg-slate-950 font-mono text-xs text-slate-300 leading-relaxed scrollbar-thin scrollbar-thumb-slate-800 select-text">
          <pre>{currentFile.code}</pre>
        </div>
      </div>
    </div>
  );
};
