---
description: How to generate an Android APK for the CivilWorks project
---

Follow these steps to generate a debug APK for your Ionic/Capacitor project.

### Phase 1: Prepare the Web Assets
First, you need to compile your Angular code into web assets that the native app can use.

// turbo
1. Run `npm run build` or `ionic build` in your terminal. This creates the `www` folder.

### Phase 2: Sync with Android Platform
Update the Android project with your latest web changes and plugins.

// turbo
2. Run `npx cap sync android`. This copies the web assets to the Android project.

### Phase 3: Build APK via Android Studio
Capacitor uses Android Studio for the final build process.

3. Run `npx cap open android`. This will launch Android Studio with your project.
4. Wait for it to finish indexing (Gradle sync).
5. Go to the top menu: **Build** > **Build Bundle(s) / APK(s)** > **Build APK(s)**.
6. Once finished, a notification will appear at the bottom right with a **locate** link. Click it to find your `app-debug.apk`.

> [!TIP]
> If you want to create a **Release APK** for the Play Store, you should go to **Build** > **Generate Signed Bundle / APK** in Android Studio and follow the wizard.
