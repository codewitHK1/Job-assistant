package com.jobpilot.ai

import android.app.Application
import com.jobpilot.ai.data.local.AppDatabase

class JobPilotApplication : Application() {
    val database: AppDatabase by lazy {
        AppDatabase.getInstance(this)
    }

    override fun onCreate() {
        super.onCreate()
        instance = this
    }

    companion object {
        lateinit var instance: JobPilotApplication
            private set
    }
}
