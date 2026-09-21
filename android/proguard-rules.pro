# ProGuard rules for JobPilot AI Mobile
-dontwarn okio.**
-dontwarn javax.annotation.**
-keepattributes *Annotation*,Signature,InnerClasses,EnclosingMethod

# Room Database & Entities
-keepclassmembers class * {
    @androidx.room.* <methods>;
}
-keep class * extends androidx.room.RoomDatabase
-keep @androidx.room.Entity class * { *; }
-keep @androidx.room.Dao class * { *; }

# Domain Models & ViewModels
-keep class com.jobpilot.ai.domain.model.** { *; }
-keep class com.jobpilot.ai.presentation.viewmodels.** { *; }
-keep class com.jobpilot.ai.data.local.** { *; }

# Jetpack Compose & Kotlin Coroutines
-keep class androidx.compose.** { *; }
-dontwarn androidx.compose.**
-keep class kotlinx.coroutines.** { *; }
