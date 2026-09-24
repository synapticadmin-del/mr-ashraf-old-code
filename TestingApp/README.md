# Welcome to your Expo app 👋

This is an [Expo](https://expo.dev) project created with [`create-expo-app`](https://www.npmjs.com/package/create-expo-app).

## Get started

1. Install dependencies

   ```bash
   npm install
   ```

2. **Install the development build (required once per device/simulator)**  
   This project uses **expo-dev-client**, so it does **not** run in Expo Go. You must build and install the native app first:

   **iOS (Mac with Xcode):**
   ```bash
   npm run ios
   ```
   **Android (emulator or device):**
   ```bash
   npm run android
   ```

3. Start the dev server and open the app

   ```bash
   npm start
   ```
   Then press **`i`** (iOS) or **`a`** (Android). This will open the **development build** you installed in step 2 — not Expo Go.  
   If you see *"No development build (com.edusky.testing) for this project is installed"*, you have not run step 2 yet on that device/simulator.

In the output, you'll find options to open the app in a

- [development build](https://docs.expo.dev/develop/development-builds/introduction/) (this project uses this)
- [Android emulator](https://docs.expo.dev/workflow/android-studio-emulator/)
- [iOS simulator](https://docs.expo.dev/workflow/ios-simulator/)
- **Expo Go does not work** with this project because it uses a custom development build

You can start developing by editing the files inside the **app** directory. This project uses [file-based routing](https://docs.expo.dev/router/introduction).

## Build for Android device (APK)

To build an APK you can install on a physical Android device:

1. **Install project dependencies** (if you haven’t):
   ```bash
   npm install
   ```
   This installs `eas-cli` as a dev dependency (no global install needed).

2. **Log in to Expo** (one-time, free account at [expo.dev](https://expo.dev)):
   ```bash
   npx eas-cli login
   ```

3. **Configure the project** (one-time, if prompted):
   ```bash
   npx eas-cli build:configure
   ```

4. **Build the Android APK**:
   ```bash
   npm run build:android
   ```
   Or: `npx eas-cli build --platform android --profile preview`

5. **Install on device:** When the build finishes on [expo.dev](https://expo.dev), download the **APK** from the build page and transfer it to your Android device (e.g. via USB, email, or cloud). On the device, open the APK and allow "Install from unknown sources" if asked, then install.

For a **Play Store** build (AAB) instead of APK, use:
```bash
npm run build:android:prod
```

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
# testing-app
