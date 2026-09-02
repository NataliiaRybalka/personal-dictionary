This is a new Personal Dictionary from Nataliia Rybalka project.

You can collect your own dictionary with differect languages.

You don't need internet to use it. Just download and install the [personal-dictionary.apk](https://drive.google.com/file/d/108oQtIxihlGbpQrOp84Qdpy6Xf7jGwFN/view?usp=sharing) file.


## Technologies Used

Personal Dictionary was built using the following technologies:

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
