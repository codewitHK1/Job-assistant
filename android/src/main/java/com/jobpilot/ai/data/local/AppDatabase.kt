package com.jobpilot.ai.data.local

import android.content.Context
import androidx.room.*
import com.jobpilot.ai.domain.model.ApplicationEntity
import com.jobpilot.ai.domain.model.JobPostingEntity
import kotlinx.coroutines.flow.Flow

/**
 * Local Room Persistence Layer for Offline Support
 */

@Dao
interface JobDao {
    @Query("SELECT * FROM cached_jobs ORDER BY cachedAt DESC")
    fun getAllJobs(): Flow<List<JobPostingEntity>>

    @Query("SELECT * FROM cached_jobs WHERE id = :jobId LIMIT 1")
    suspend fun getJobById(jobId: String): JobPostingEntity?

    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun insertJobs(jobs: List<JobPostingEntity>)

    @Query("DELETE FROM cached_jobs")
    suspend fun clearJobs()
}

@Dao
interface ApplicationDao {
    @Query("SELECT * FROM applications ORDER BY updatedAt DESC")
    fun getAllApplications(): Flow<List<ApplicationEntity>>

    @Query("SELECT * FROM applications WHERE status = :status")
    fun getApplicationsByStatus(status: String): Flow<List<ApplicationEntity>>

    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun upsertApplication(application: ApplicationEntity)

    @Query("UPDATE applications SET status = :newStatus, updatedAt = :timestamp WHERE id = :appId")
    suspend fun updateStatus(appId: String, newStatus: String, timestamp: Long = System.currentTimeMillis())

    @Delete
    suspend fun deleteApplication(application: ApplicationEntity)
}

@Database(
    entities = [JobPostingEntity::class, ApplicationEntity::class],
    version = 1,
    exportSchema = false
)
abstract class AppDatabase : RoomDatabase() {
    abstract fun jobDao(): JobDao
    abstract fun applicationDao(): ApplicationDao

    companion object {
        const val DATABASE_NAME = "jobpilot_offline_db"

        @Volatile
        private var INSTANCE: AppDatabase? = null

        fun getInstance(context: Context): AppDatabase {
            return INSTANCE ?: synchronized(this) {
                val instance = Room.databaseBuilder(
                    context.applicationContext,
                    AppDatabase::class.java,
                    DATABASE_NAME
                )
                    .fallbackToDestructiveMigration()
                    .build()
                INSTANCE = instance
                instance
            }
        }
    }
}
