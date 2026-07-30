# BRAC Print+ — Mobile (Android)

A focused Expo/React Native app covering just the core print flow: sign in,
upload a document, pick options, select a printer, submit, and track status
— talking to the same BRAC Print+ backend built earlier in this project.

## Getting a real .apk file

**This is the one thing I could not do inside this sandbox** — confirmed,
not just assumed: this sandbox has no Android SDK, no JDK (a JRE only), and
apt only offers a legacy `aapt` v1 + `adb`, missing `aapt2`/`d8`/`r8` and
every platform jar a modern Android Gradle build needs. Those all come from
Google's Maven repo and SDK manager (`dl.google.com`) and Gradle's own
distribution service — none reachable from this sandbox's network allowlist.

### Easiest: let GitHub Actions build it for you (no local setup at all)

This project includes `.github/workflows/build-apk.yml`, validated with
`actionlint` (clean) during development. Push this project to a GitHub repo,
then either push to `main` or trigger it manually (Actions tab → "Build
Android APK" → "Run workflow"). It runs on GitHub's own runners, which
*do* have normal internet access, so every step that was blocked here just
works there:

1. Go to the Actions tab after the workflow finishes.
2. Open the run → download the `bracprint-debug-apk` artifact.
3. Unzip it, transfer `app-debug.apk` to an Android device (or drag it onto
   an emulator), and install it (you'll need "install from unknown sources"
   allowed, since it's not signed for the Play Store).

This gives you a debug-signed APK — installable and fully functional for
testing, but not suitable for distributing to end users or the Play Store
as-is (debug builds use Gradle's auto-generated, insecure debug keystore).

### Signing a real release build

To get a properly signed release APK from the same workflow:

1. Generate a release keystore once (keep it safe — losing it means you
   can't update the app under the same signature later):
   ```bash
   keytool -genkeypair -v -keystore release.keystore -alias bracprint \
     -keyalg RSA -keysize 2048 -validity 10000
   ```
2. Add these as repo secrets (Settings → Secrets and variables → Actions):
   `ANDROID_KEYSTORE_BASE64` (`base64 -w0 release.keystore`),
   `ANDROID_KEYSTORE_PASSWORD`, `ANDROID_KEY_ALIAS`, `ANDROID_KEY_PASSWORD`.
3. Add a repo **variable** `ENABLE_RELEASE_APK` = `true` (Settings → Secrets
   and variables → Actions → Variables tab) - the release job is gated on
   this so the workflow doesn't fail for anyone who hasn't set up signing yet.
4. Re-run the workflow → download the `bracprint-release-apk` artifact.

### Alternative: Expo's cloud build service (EAS)

```bash
npm install -g eas-cli
eas login
eas build:configure
eas build --platform android --profile preview
```
Needs an Expo account; `--profile preview` produces an installable `.apk`
(the default `production` profile produces a Play-Store-bound `.aab` instead).

### Alternative: build locally, if you have Android Studio installed

```bash
npx expo prebuild --platform android
cd android && ./gradlew assembleRelease
# output: android/app/build/outputs/apk/release/app-release.apk
```

## What was actually verified here (vs. what to expect for real)

| Verified for real | Not runnable in this sandbox |
|---|---|
| `npx tsc --noEmit` - clean | Actually compiling the native `.apk` (needs Android SDK/Gradle or EAS, both network-blocked here) |
| `npx eslint .` (Expo's official config) - clean | Running on a real device/emulator (no Android emulator or physical device attached here) |
| `npx jest` - 13/13 tests passing (pure logic + a real React Native Testing Library component render/press test) | |
| **`npx expo export --platform android`** - Metro actually resolved and bundled all ~1625 modules into real Hermes bytecode, *twice* (once initially, once again after a dependency fix) - this is the strongest available proof the app's full dependency graph, native module linking, and Babel/worklets transform pipeline are all correct without needing a physical device | |

Two real dependency bugs were caught and fixed while getting the export to
pass, worth knowing about if you touch dependencies later:
- `@testing-library/react-native`'s newest major version (v14) has a broken
  `screen` singleton (and even `render()`'s own returned queries didn't work)
  in this exact dependency combination — downgraded to the long-stable v12
  line with `react-test-renderer`, which works correctly.
- `react-native-reanimated` v4 split its runtime into a separate
  `react-native-worklets` package that isn't pulled in automatically by
  every installer path - an `npm install` shuffle silently dropped it,
  breaking the Metro bundle until it was reinstalled explicitly.

Also note: `expo install` (Expo's own version-matching installer) couldn't
run here either — it needs to reach Expo's compatibility API, which isn't
in this sandbox's network allowlist. Plain `npm install` was used instead,
with compatibility confirmed via the typecheck/lint/test/export chain above
rather than trusted from Expo's own version table. If you add packages
later, prefer `npx expo install <package>` on a machine with normal
internet access — it'll pick the exact version Expo SDK 57 expects.

## Getting started (development)

```bash
npm install
cp .env.example .env.local   # optionally point EXPO_PUBLIC_API_URL at the backend
npx expo start
```

Scan the QR code with Expo Go (fastest way to try it on a real phone without
building anything), or press `a` to launch an Android emulator if you have
one configured locally.

Demo credentials (used when the backend is unset/unreachable): `student1` /
any password.

## Architecture

```
app/                          Expo Router file-based routes
  _layout.tsx                   Root layout: providers, gesture handler, status bar
  index.tsx                     Redirects to /home or /login based on auth state
  login.tsx                     AD/LDAP-styled sign-in
  (app)/
    _layout.tsx                  Auth-guarded stack (redirects to /login if signed out)
    home.tsx                     Quota, printer availability, recent jobs, upload entry point
    new-job.tsx                  4-step flow: document picker to options to printer to confirm
    job/[id].tsx                 Print job status/result screen
src/
  components/                  Button, Card, ProgressBar, StatusBadge (plain RN StyleSheet,
                                 no UI library - kept dependency footprint small for a 5-screen app)
  hooks/use-auth.tsx            Auth context backed by secure storage
  lib/
    api.ts                       Real backend + demo-data fallback (same pattern as the web app)
    storage.ts                   expo-secure-store wrapper (Keystore/Keychain-backed, not AsyncStorage)
    mock-data.ts, format.ts
  theme/                        Light/dark color tokens + a useThemeColors() hook
  types/                        Mirrors the backend's DTOs/enums
```

## Design decisions

- **Secure token storage, not AsyncStorage**: `expo-secure-store` backs onto
  the Android Keystore / iOS Keychain, unlike AsyncStorage which is
  unencrypted on-disk. Access/refresh tokens and the cached user profile all
  go through `src/lib/storage.ts`.
- **Native document picker, not a WebView file input**: `expo-document-picker`
  uses Android's real Storage Access Framework picker, so it works with any
  document provider the user has installed (Drive, Dropbox, local files),
  not just what a WebView's HTML file input would expose.
- **No UI library**: with only ~5 screens, hand-rolled `StyleSheet`
  components (matching the web app's color palette) were simpler and lower
  dependency-risk than pulling in a full RN component library.
- **Same demo-data-fallback pattern as the web frontend**: `src/lib/api.ts`
  tries `EXPO_PUBLIC_API_URL` first and transparently falls back to demo
  data on any failure, so the app is fully reviewable (including the upload
  flow, with a simulated delay) without a live backend.
- **Android package id**: `bd.ac.bracu.bracprint` (set in `app.json`) -
  change this before any real Play Store / MDM deployment if your
  institution has a different reverse-DNS convention in mind.

## Known follow-ups

- No push notifications wired up yet (the backend's notification system is
  in-app/email/SMS-oriented; adding Expo push notifications for print-job
  status would be a natural next step).
- No offline queueing - a submission attempted with no connectivity will
  currently just fail, not queue for retry.
- No automated E2E tests (Detox/Maestro) - only unit/component-level tests.
