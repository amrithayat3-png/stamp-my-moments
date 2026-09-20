import type { CapacitorConfig } from "@capacitor/cli";

/**
 * PhotoStamp — Capacitor configuration.
 *
 * Android permissions required (declared in android/app/src/main/AndroidManifest.xml
 * when the native shell is generated):
 *
 *   <!-- Android 13+ (API 33+) scoped media read -->
 *   <uses-permission android:name="android.permission.READ_MEDIA_IMAGES" />
 *   <!-- Android 14+ partial selection -->
 *   <uses-permission android:name="android.permission.READ_MEDIA_VISUAL_USER_SELECTED" />
 *   <!-- Android 12 and below fallback -->
 *   <uses-permission android:name="android.permission.READ_EXTERNAL_STORAGE"
 *                    android:maxSdkVersion="32" />
 *   <!-- Writing stamped copies back to the gallery on Android 9 and below -->
 *   <uses-permission android:name="android.permission.WRITE_EXTERNAL_STORAGE"
 *                    android:maxSdkVersion="28" />
 *
 * Native plugins used when the shell is generated (web build works without them):
 *   @capacitor/camera            — multi-select gallery picker
 *   @capacitor-community/media   — MediaStore save into the Pictures/PhotoStamp album
 *   @capacitor/filesystem        — scoped-storage fallback write + share staging
 *   @capacitor/share             — native share sheet
 */
const config: CapacitorConfig = {
  appId: "app.lovable.photostamp",
  appName: "PhotoStamp",
  webDir: "dist",
  android: {
    allowMixedContent: false,
  },
  plugins: {
    CapacitorHttp: { enabled: false },
  },
};

export default config;
