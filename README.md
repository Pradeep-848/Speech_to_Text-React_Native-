# Voice Search — React Native

A small React Native example that converts speech to text and uses the recognized text to search/filter a FlatList of materials.

This repository demonstrates:

* `@react-native-voice/voice` integration for speech-to-text
* Putting recognized speech into a `TextInput` search box
* Flexible search matching (word-order independent, normalized numbers like "one" → `1`)
* A clear (`✖`) button inside the `TextInput` and a mic toggle button

---

## Features

* Tap mic to start/stop listening
* Recognized speech appears in the search box and filters the list in real-time
* Word-based matching: order-independent (e.g. "tempered glass" and "glass tempered")
* Normalization for spacing/punctuation (e.g. `1.2mm` ↔ `1.2 mm`)
* Basic spoken-number handling (e.g. "zero one one" → `011`)

---

## Prerequisites

* Node.js (v16+ recommended)
* npm or yarn
* React Native CLI (for bare workflow): `npm install -g react-native-cli`
* Android Studio with **Android SDK Platform 35** and Build Tools (35.x)
* JDK 11 or newer
* Xcode & CocoaPods (for iOS)

Make sure `ANDROID_HOME` / `ANDROID_SDK_ROOT` points to your SDK, and `platform-tools` is in your `PATH`.

---

## Quick install

```bash
# clone the repo
git clone <your-repo-url>
cd <repo-folder>

# install JS deps
npm install
# or
# yarn

# install native deps
npm install @react-native-voice/voice react-native-vector-icons

# iOS only: install pods
cd ios && pod install && cd ..
```

### Important: If you're using Expo

* `@react-native-voice/voice` contains native code and will **not** run inside Expo Go. You must use a custom dev client (`expo prebuild && expo run:android`) or eject to the bare workflow.

---

## Android configuration

### 1) `gradle.properties`

Ensure AndroidX and Jetifier are enabled:

```properties
android.useAndroidX=true
android.enableJetifier=true
```

### 2) `android/build.gradle` (or `app/build.gradle`)

Make sure the project compiles with SDK 35. Example in `android/app/build.gradle`:

```gradle
android {
  compileSdkVersion 35

  defaultConfig {
    applicationId "com.yourapp"
    minSdkVersion 26
    targetSdkVersion 35
    versionCode 1
    versionName "1.0"
  }
  ...
}
```

Install platform 35 with the SDK manager if not present:

```bash
sdkmanager "platforms;android-35" "build-tools;35.0.0"
```

### 3) AndroidManifest permissions (required)

Open `android/app/src/main/AndroidManifest.xml` and ensure you have microphone and internet permissions plus the `tools` namespace. Example:

```xml
<manifest xmlns:android="http://schemas.android.com/apk/res/android"
    xmlns:tools="http://schemas.android.com/tools"
    package="com.yourapp">

  <uses-permission android:name="android.permission.RECORD_AUDIO" />
  <uses-permission android:name="android.permission.INTERNET" />

  <!-- optional features -->
  <uses-feature android:name="android.hardware.microphone" android:required="false" />

  <application
    android:name=".MainApplication"
    android:label="@string/app_name"
    android:icon="@mipmap/ic_launcher"
    android:allowBackup="false"
    android:theme="@style/AppTheme"
    tools:replace="android:appComponentFactory"
    android:appComponentFactory="androidx.core.app.CoreComponentFactory">

    <activity android:name=".MainActivity" android:exported="true">
      <intent-filter>
        <action android:name="android.intent.action.MAIN" />
        <category android:name="android.intent.category.LAUNCHER" />
      </intent-filter>
    </activity>

  </application>
</manifest>
```

> If you encounter *manifest merger* errors referencing `appComponentFactory`, adding `tools:replace` as above resolves mismatches between AndroidX and older support libraries.

---

## iOS configuration

Add these keys to `ios/<app>/Info.plist`:

```xml
<key>NSMicrophoneUsageDescription</key>
<string>This app needs access to your microphone for speech recognition</string>
<key>NSSpeechRecognitionUsageDescription</key>
<string>This app needs access to speech recognition to convert voice to text</string>
```

Then run:

```bash
cd ios && pod install && cd ..
```

---

## How it works (code overview)

The app uses `@react-native-voice/voice` to start/stop listening and hooks a few listeners:

* `Voice.onSpeechStart` — set UI to listening
* `Voice.onSpeechEnd` — stop UI listening state
* `Voice.onSpeechResults` — final recognized text (put into search box)
* `Voice.onSpeechPartialResults` — optional, gets partial realtime results
* `Voice.onSpeechError` — report errors

You must request microphone permission on Android at runtime (the README's example uses `PermissionsAndroid`).

---

## Search normalization & matching

To make spoken queries match list items even when:

* casing differs (`RR` vs `rr`)
* spaces differ (`1.2mm` vs `1.2 mm`)
* word order differs (`tempered glass` vs `glass tempered`)
* numbers are spoken as words (`zero one one`)

We normalize both the dataset string and the query before matching.

### Helpful helpers (examples):

```js
// generate small number-word map for 0..20
const words = [
  "zero","one","two","three","four","five","six","seven","eight","nine",
  "ten","eleven","twelve","thirteen","fourteen","fifteen",
  "sixteen","seventeen","eighteen","nineteen","twenty"
];
const numMap = Object.fromEntries(words.map((w,i)=>[w,String(i)]));

// replace number words with digits: "zero one one" -> "011" (keeps letters otherwise)
function replaceNumberWords(str){
  return str
    .toLowerCase()
    .split(/\s+/)
    .map(w => numMap[w] ?? w)
    .join(' ');
}

// normalize for comparison: lower-case, normalize spaces, remove punctuation
function normalizeTextForSearch(s){
  if(!s) return '';
  // 1) convert spelled numbers to digits
  const withNums = replaceNumberWords(s);
  // 2) remove punctuation except alphanumerics and spaces
  return withNums
    .toLowerCase()
    .replace(/[^a-z0-9\s.]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

// word-based matching (all words in query must appear in item text)
function matches(itemText, queryText){
  const item = normalizeTextForSearch(itemText);
  const q = normalizeTextForSearch(queryText);
  if(!q) return true; // empty query => show all
  const qWords = q.split(' ');
  return qWords.every(w => item.includes(w));
}
```

Use the `matches(...)` function in your `filteredData`:

```js
const filteredData = materialData.filter(item => matches(item, query));
```

---

## Example: Clear button in TextInput

Wrap the `TextInput` in a `View` and place a clear button absolutely inside it:

```jsx
<View style={{ flex: 1, position: 'relative' }}>
  <TextInput value={query} onChangeText={setQuery} style={styles.input} />
  {query.length > 0 && (
    <TouchableOpacity style={styles.clearButton} onPress={() => setQuery('')}>
      <Icon name="close" size={18} color="#666" />
    </TouchableOpacity>
  )}
</View>
```

---

## Common issues & troubleshooting

* **`Voice` is undefined / `addEventListener` of undefined**

  * Ensure you installed `@react-native-voice/voice` and rebuilt the native app (`npx react-native run-android` or `pod install && npx react-native run-ios`).
  * This module requires native builds — it does **not** work in Expo Go.

* **Microphone permission denied**

  * On Android, open App Info → Permissions → enable Microphone.
  * In emulator, check the 3‑dot menu and enable microphone.

* **`Manifest merger` errors**

  * Add `xmlns:tools` to `<manifest>` and consider `tools:replace="android:appComponentFactory"` on `<application>` if facing AndroidX/support library conflicts.

* **No transcription or poor recognition**

  * Ensure the device has a speech recognition service (e.g., Google Speech Services). Emulators can be flaky; prefer testing on a physical device.

* **Kotlin / Gradle compile errors**

  * Some native libraries require updated Gradle/Kotlin versions. Make sure your `gradle.properties` and Gradle wrapper are compatible with your RN version. Run `./gradlew clean` then rebuild.

---

## Run (dev)

Android:

```bash
npx react-native run-android
```

iOS:

```bash
npx react-native run-ios
```

If you change native dependencies, re-run `pod install` (iOS) and rebuild the app.

---

## License

MIT

---

If you want, I can also:

* produce a ready-to-copy `AndroidManifest.xml` for your project (with `tools` namespace and suggested `application` attributes)
* add a utility file (`utils/search.js`) containing the normalization and number-word mapping functions
* create a sample `App.js` ready to paste into your repo

Tell me which one you want next and I’ll add it to the repo as another file.
