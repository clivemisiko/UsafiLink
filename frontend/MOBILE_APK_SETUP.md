# UsafiLink Mobile APK Setup

This project now uses Capacitor to package the existing React web app as an Android mobile app.

## What was added

- Capacitor dependencies (`@capacitor/core`, `@capacitor/cli`, `@capacitor/android`)
- Android native project at `frontend/android`
- Capacitor config at `frontend/capacitor.config.json`
- Mobile scripts in `frontend/package.json`

## Prerequisites (Windows)

Install these tools:

1. Node.js LTS (already in use for this project)
2. Java JDK 17 (or newer)
3. Android Studio (with Android SDK + Build Tools)
4. Set `ANDROID_HOME` and ensure SDK tools are available

## Build and sync mobile assets

From `frontend`:

```bash
npm install
npm run mobile:sync
```

This builds React (`dist`) and syncs it into the Android project.

## Open in Android Studio

```bash
npm run mobile:open
```

Then in Android Studio:

- Let Gradle sync finish
- Select a connected device/emulator
- Run the app

## Build a debug APK from terminal

```bash
npm run apk:debug
```

APK output:

`frontend/android/app/build/outputs/apk/debug/app-debug.apk`

## Important backend note

Your frontend is currently configured to call:

`https://usafilink-backend.onrender.com/api`

If you switch to a local backend for mobile testing, set `VITE_API_URL` to a network-reachable address (not `localhost` from the phone's point of view), then run:

```bash
npm run mobile:sync
```
