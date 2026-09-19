package com.jobpilot.ai.ui.screens

import androidx.compose.foundation.background
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
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

/**
 * JobPilot AI - Modern Material 3 Jetpack Compose Navigation & Screens
 */

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
            NavigationBar(
                containerColor = MaterialTheme.colorScheme.surfaceVariant,
                tonalElevation = 4.dp
            ) {
                Screen.values().forEach { screen ->
                    NavigationBarItem(
                        selected = selectedScreen == screen,
                        onClick = { selectedScreen = screen },
                        icon = { Icon(screen.icon, contentDescription = screen.title) },
                        label = { Text(screen.title, fontSize = 12.sp) },
                        colors = NavigationBarItemDefaults.colors(
                            selectedIconColor = MaterialTheme.colorScheme.primary,
                            indicatorColor = MaterialTheme.colorScheme.primaryContainer
                        )
                    )
                }
            }
        },
        topBar = {
            TopAppBar(
                title = {
                    Row(verticalAlignment = Alignment.CenterVertically) {
                        Text(
                            text = "JobPilot AI",
                            style = MaterialTheme.typography.titleLarge.copy(fontWeight = FontWeight.Bold)
                        )
                    }
                },
                colors = TopAppBarDefaults.topAppBarColors(
                    containerColor = MaterialTheme.colorScheme.surface
                )
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
}

@Composable
fun HomeScreenContent() {
    LazyColumn(
        modifier = Modifier.fillMaxSize().padding(16.dp),
        verticalArrangement = Arrangement.spacedBy(16.dp)
    ) {
        item {
            Card(
                shape = RoundedCornerShape(16.dp),
                colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.primaryContainer)
            ) {
                Column(modifier = Modifier.padding(20.dp)) {
                    Text("Good evening, Alex", style = MaterialTheme.typography.titleLarge, fontWeight = FontWeight.Bold)
                    Text("Career Target: Senior Full Stack Engineer", color = MaterialTheme.colorScheme.onPrimaryContainer.copy(alpha = 0.8f))
                    Spacer(modifier = Modifier.height(16.dp))
                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        horizontalArrangement = Arrangement.SpaceBetween
                    ) {
                        MetricItem(title = "Career Match", value = "89%")
                        MetricItem(title = "Jobs Found", value = "124")
                        MetricItem(title = "Ready to Apply", value = "18")
                    }
                }
            }
        }
    }
}

@Composable
fun MetricItem(title: String, value: String) {
    Column(horizontalAlignment = Alignment.CenterHorizontally) {
        Text(value, style = MaterialTheme.typography.headlineMedium, fontWeight = FontWeight.Bold)
        Text(title, style = MaterialTheme.typography.bodySmall)
    }
}

@Composable fun JobsScreenContent() { Box(Modifier.fillMaxSize()) { Text("Job Discovery Engine", Modifier.align(Alignment.Center)) } }
@Composable fun ApplicationsKanbanContent() { Box(Modifier.fillMaxSize()) { Text("Applications Kanban Tracker", Modifier.align(Alignment.Center)) } }
@Composable fun ResumeScreenContent() { Box(Modifier.fillMaxSize()) { Text("ATS Resume Analyzer & Master Resume", Modifier.align(Alignment.Center)) } }
@Composable fun ProfileScreenContent() { Box(Modifier.fillMaxSize()) { Text("User Profile & Integrations", Modifier.align(Alignment.Center)) } }
