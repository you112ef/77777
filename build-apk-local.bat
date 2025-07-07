@echo off
setlocal enabledelayedexpansion

REM 🧬 Sperm Analyzer AI - Local APK Build Script for Windows
REM This script builds the APK locally for testing before GitHub Actions

echo 🧬 Sperm Analyzer AI - Local APK Build
echo ==============================================

REM Check prerequisites
echo 🔍 Checking prerequisites...

where node >nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ Node.js is not installed
    pause
    exit /b 1
)
echo ✅ Node.js found

where npm >nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ npm is not installed
    pause
    exit /b 1
)
echo ✅ npm found

where java >nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ Java is not installed
    pause
    exit /b 1
)
echo ✅ Java found

REM Check Android SDK
if "%ANDROID_HOME%"=="" (
    echo ⚠️ ANDROID_HOME not set. Make sure Android SDK is installed.
)

REM Navigate to mobile directory
cd sperm-analyzer-mobile
echo ℹ️ Working in: %CD%

REM Install dependencies
echo.
echo 📦 Installing dependencies...
call npm install
if %errorlevel% neq 0 (
    echo ❌ Failed to install dependencies
    pause
    exit /b 1
)
echo ✅ Dependencies installed

REM Build web assets
echo.
echo 🔨 Building web assets...
call npm run build
if %errorlevel% neq 0 (
    echo ❌ Failed to build web assets
    pause
    exit /b 1
)
echo ✅ Web assets built

REM Setup Capacitor
echo.
echo 🔧 Setting up Capacitor...
call npx cap sync android
call npx cap copy android
echo ✅ Capacitor setup complete

REM Navigate to Android directory
cd android

REM Create keystore if it doesn't exist
if not exist "app\keystore.jks" (
    echo.
    echo 🔑 Creating debug keystore...
    keytool -genkeypair -v -keystore app\keystore.jks -alias sperm-analyzer-key -keyalg RSA -keysize 2048 -validity 10000 -storepass android -keypass android -dname "CN=Sperm Analyzer AI, OU=Development, O=Sperm Analyzer, L=City, S=State, C=US"
    echo ✅ Debug keystore created
)

REM Check if signing is configured
findstr /c:"signingConfigs" app\build.gradle >nul
if %errorlevel% neq 0 (
    echo.
    echo 🔧 Configuring APK signing...
    echo. >> app\build.gradle
    echo android { >> app\build.gradle
    echo     signingConfigs { >> app\build.gradle
    echo         release { >> app\build.gradle
    echo             keyAlias 'sperm-analyzer-key' >> app\build.gradle
    echo             keyPassword 'android' >> app\build.gradle
    echo             storeFile file('keystore.jks'^) >> app\build.gradle
    echo             storePassword 'android' >> app\build.gradle
    echo         } >> app\build.gradle
    echo     } >> app\build.gradle
    echo     buildTypes { >> app\build.gradle
    echo         release { >> app\build.gradle
    echo             signingConfig signingConfigs.release >> app\build.gradle
    echo             minifyEnabled true >> app\build.gradle
    echo             proguardFiles getDefaultProguardFile('proguard-android-optimize.txt'^), 'proguard-rules.pro' >> app\build.gradle
    echo         } >> app\build.gradle
    echo         debug { >> app\build.gradle
    echo             signingConfig signingConfigs.release >> app\build.gradle
    echo         } >> app\build.gradle
    echo     } >> app\build.gradle
    echo } >> app\build.gradle
    echo ✅ Signing configuration added
)

REM Clean previous builds
echo.
echo 🧹 Cleaning previous builds...
call gradlew.bat clean

REM Build APK
echo.
echo 🔨 Building APK...
call gradlew.bat assembleRelease --stacktrace
if %errorlevel% neq 0 (
    echo ❌ APK build failed!
    pause
    exit /b 1
)

REM Find APK file
for /r app\build\outputs\apk\release %%f in (*.apk) do set APK_PATH=%%f

if exist "%APK_PATH%" (
    REM Get version (simplified for Windows)
    set VERSION=1.0.0
    
    REM Create output directory
    if not exist "..\..\dist" mkdir "..\..\dist"
    
    REM Copy APK with meaningful name
    set APK_NAME=SpermAnalyzerAI-v!VERSION!-local.apk
    copy "%APK_PATH%" "..\..\dist\!APK_NAME!"
    
    echo.
    echo 🎉 BUILD SUCCESSFUL!
    echo ===================
    echo ✅ APK built successfully
    echo ℹ️ Location: dist\!APK_NAME!
    echo ℹ️ Package: com.scrapybara.spermanalyzer
    
    echo.
    echo 📱 Installation Instructions:
    echo 1. Transfer the APK to your Android device
    echo 2. Enable 'Install from Unknown Sources' in Android settings
    echo 3. Install the APK file
    echo 4. Grant camera and storage permissions when prompted
    
    echo.
    echo 🚀 APK is ready for testing!
    
) else (
    echo ❌ APK not found! Build may have failed.
    echo Check the build logs above for errors.
    pause
    exit /b 1
)

pause