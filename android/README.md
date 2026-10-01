# VanaTok Android

Android version of VanaTok: camera preview, front/back switch, brightness control, MP4 recording, and Android share flow.

## Build APK

Open the `android/` directory in Android Studio, let Gradle sync, then run:

```bash
./gradlew assembleDebug
```

APK output:

```text
android/app/build/outputs/apk/debug/app-debug.apk
```

Install on a connected device:

```bash
adb install -r android/app/build/outputs/apk/debug/app-debug.apk
```

The share sheet can be used to select TikTok when TikTok is installed. Android does not provide a standard third-party virtual-camera device API, so this app is a camera/recording app and does not inject frames into the TikTok camera.
