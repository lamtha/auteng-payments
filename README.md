# AutEng Payments — Mobile App (Expo / React Native)

The mobile app from docs/v5/VISION.md


This project is an Expo (React Native) app with a workflow optimized for:

* **Fast local iteration** on the iOS Simulator
* **On-device testing** via an EAS **development build** (dev client)
* **Production builds + store submission** via EAS

---

## 1) Stack overview

* **Expo + React Native** for cross-platform development
* **Prebuild workflow**: native `ios/` and `android/` projects are generated from Expo config
* **Local dev**

  * Simulator: local compile + run (`run:ios`)
  * Device: dev client + Metro (`--dev-client`)
* **Build/Distribution**

  * EAS Build generates IPAs/AABs
  * EAS Submit uploads to App Store Connect / Play Console

Key concepts:

* **Expo Go** is a generic client with a fixed set of native modules.
* A **development build (dev client)** is your app compiled with your native modules/config.

---

## 2) Prerequisites

### macOS (for iOS simulator/local iOS builds)

* Xcode installed (and Command Line Tools)
* Node.js (LTS recommended)
* npm/pnpm/yarn (examples below use npm)
* CocoaPods (if needed):

  ```bash
  sudo gem install cocoapods
  ```

### CLI tools

From repo root:

```bash
npm install
npm i -g eas-cli
```

You can always avoid global installs by using:

```bash
npx eas-cli@latest <command>
```

---

## 3) Workflow A — Local + Simulator (fast iteration)

### Run on iOS Simulator (local build)

```bash
npx expo run:ios
```

What this does:

* Builds the native iOS project locally (Xcode)
* Launches the iOS Simulator
* Starts Metro (or attaches to it)

### Optional: run Metro separately

```bash
npx expo start
```

Then press `i` to open iOS Simulator.

Notes:

* Simulator is great for UI/networking iteration.
* Biometrics are limited/simulated on simulator; validate the real flow on device.

---

## 4) Workflow B — Dev build to your device (real-device testing)

Use this for native auth modules, keychain/secure storage validation, and biometrics.

### 4.1 Build a development client (iOS)

```bash
npx eas-cli@latest build --profile development --platform ios
```

EAS will output an install link/QR. Install on your iPhone.

### 4.2 Start Metro for dev clients

```bash
npx expo start --dev-client
```

Open the dev build app on your phone and connect to the dev server.

### iOS Developer Mode

If iOS prompts for Developer Mode:

* **Settings → Privacy & Security → Developer Mode → On → Restart**

---

## 5) Workflow C — Production build + submission

### 5.1 Production build

iOS:

```bash
npx eas-cli@latest build --profile production --platform ios
```

Android:

```bash
npx eas-cli@latest build --profile production --platform android
```

### 5.2 Submit to stores

iOS:

```bash
npx eas-cli@latest submit --platform ios
```

Android:

```bash
npx eas-cli@latest submit --platform android
```

---

## 6) Expo prebuild notes

This repo uses the **prebuild workflow**, generating `ios/` and `android/` from Expo config.

### When to re-run prebuild

Re-run when you:

* Add/remove a native module
* Change native config (bundle ID, URL schemes, permissions, entitlements, etc.)

Command:

```bash
npx expo prebuild
```

If you need a clean regen (destroys `ios/` and `android/`):

```bash
rm -rf ios android
npx expo prebuild
```

---

## 7) EAS profiles

EAS behavior is controlled by `eas.json`.

Typical profiles:

* `development`: dev client for on-device testing
* `production`: store-ready builds

Edit/check:

* `eas.json`
* `app.json` or `app.config.*`

---

## 8) Troubleshooting

### “It opened Expo Go, but I need native modules”

Use the dev client flow:

```bash
npx eas-cli@latest build --profile development --platform ios
npx expo start --dev-client
```

### `eas` command not found

Use `npx`:

```bash
npx eas-cli@latest --version
```

Or install globally:

```bash
npm i -g eas-cli
```

### iOS pods issues after prebuild

```bash
cd ios
pod install
cd ..
npx expo run:ios
```

---

## 9) Project structure (high level)

* `app.json` / `app.config.*` — Expo config (IDs, permissions, plugins)
* `eas.json` — EAS build profiles (development/production)
* `ios/` — Generated native iOS project (via prebuild)
* `android/` — Generated native Android project (via prebuild)
* App code — your screens, networking, state, etc.






# EXPO original README:
# Welcome to your Expo app 👋

This is an [Expo](https://expo.dev) project created with [`create-expo-app`](https://www.npmjs.com/package/create-expo-app).

## Get started

1. Install dependencies

   ```bash
   npm install
   ```

2. Start the app

   ```bash
   npx expo start
   ```

In the output, you'll find options to open the app in a

- [development build](https://docs.expo.dev/develop/development-builds/introduction/)
- [Android emulator](https://docs.expo.dev/workflow/android-studio-emulator/)
- [iOS simulator](https://docs.expo.dev/workflow/ios-simulator/)
- [Expo Go](https://expo.dev/go), a limited sandbox for trying out app development with Expo

You can start developing by editing the files inside the **app** directory. This project uses [file-based routing](https://docs.expo.dev/router/introduction).

## Get a fresh project

When you're ready, run:

```bash
npm run reset-project
```

This command will move the starter code to the **app-example** directory and create a blank **app** directory where you can start developing.

## Learn more

To learn more about developing your project with Expo, look at the following resources:

- [Expo documentation](https://docs.expo.dev/): Learn fundamentals, or go into advanced topics with our [guides](https://docs.expo.dev/guides).
- [Learn Expo tutorial](https://docs.expo.dev/tutorial/introduction/): Follow a step-by-step tutorial where you'll create a project that runs on Android, iOS, and the web.

## Join the community

Join our community of developers creating universal apps.

- [Expo on GitHub](https://github.com/expo/expo): View our open source platform and contribute.
- [Discord community](https://chat.expo.dev): Chat with Expo users and ask questions.
