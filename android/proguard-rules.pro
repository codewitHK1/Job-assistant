# Add project specific ProGuard rules here.
-dontwarn okio.**
-keepattributes *Annotation*
-keepclassmembers class * {
    @androidx.room.* <methods>;
}
