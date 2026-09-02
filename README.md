This is a new Personal Dictionary project.

## Technologies Used

Metaphorical Cards app was built using the following technologies:

-   **React Native**: Mobile app framework for Android.
-	**i18next**: For multiple languages

## Start Metro

```sh
adb reverse tcp:8081 tcp:8081

npx react-native start
```

-------------------------------------------
Reset cache:

```sh
cd android

./gradlew clean

cd ..

npx react-native start --reset-cache
```

-------------------------------------------

```sh
npx react-native run-android - in another tab

npx react-native log-android - logs
```

-------------------------------------------

Before build needs update fields:

MYAPP_RELEASE_STORE_PASSWORD and MYAPP_RELEASE_KEY_PASSWORD in

android/gradle.properties