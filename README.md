# 🔬 Sperm Analyzer AI - Android Application

<div align="center">

![Android](https://img.shields.io/badge/Android-3DDC84?style=for-the-badge&logo=android&logoColor=white)
![Capacitor](https://img.shields.io/badge/Capacitor-119EFF?style=for-the-badge&logo=Capacitor&logoColor=white)
![GitHub Actions](https://img.shields.io/badge/github%20actions-%232671E5.svg?style=for-the-badge&logo=githubactions&logoColor=white)
![TypeScript](https://img.shields.io/badge/typescript-%23007ACC.svg?style=for-the-badge&logo=typescript&logoColor=white)

**Advanced AI-powered sperm analysis tool for mobile devices**

[📱 Download Latest APK](https://github.com/your-username/sperm-analyzer-ai/releases) | [🐛 Report Bug](https://github.com/your-username/sperm-analyzer-ai/issues) | [💡 Request Feature](https://github.com/your-username/sperm-analyzer-ai/issues)

</div>

## 🌟 Features

- 🤖 **AI-Powered Analysis**: Advanced machine learning algorithms for sperm analysis
- 📱 **Mobile-First**: Optimized for Android devices with native performance
- 📸 **Camera Integration**: Built-in camera support for sample capture
- 💾 **Local Storage**: Secure data storage on device
- 🎨 **Modern UI**: Beautiful and intuitive user interface
- 🔒 **Privacy-Focused**: All analysis happens on-device
- 📊 **Detailed Reports**: Comprehensive analysis results and statistics

## 🚀 Quick Start

### Download & Install

1. **Download the APK** from the [latest release](https://github.com/your-username/sperm-analyzer-ai/releases)
2. **Enable Unknown Sources** in your Android settings
3. **Install the APK** by tapping the downloaded file
4. **Open the app** and start analyzing!

### System Requirements

- **Android Version**: 7.0 (API level 24) or higher
- **RAM**: Minimum 2GB recommended
- **Storage**: 100MB free space
- **Camera**: Required for sample capture
- **Permissions**: Camera, Storage

## 🛠️ Development Setup

### Prerequisites

- **Node.js**: 18.x or higher
- **npm**: 8.x or higher
- **Java**: JDK 17
- **Android Studio**: Latest version
- **Git**: For version control

### Installation

```bash
# Clone the repository
git clone https://github.com/your-username/sperm-analyzer-ai.git
cd sperm-analyzer-ai

# Navigate to mobile project
cd sperm-analyzer-mobile

# Install dependencies
npm install

# Sync Capacitor
npm run sync
```

### Build Commands

```bash
# Build web assets and sync with Android
npm run android:build

# Build debug APK
npm run debug:android

# Build release APK
npm run release:android

# Open Android Studio
npm run android:open

# Run on connected device/emulator
npm run android
```

### Manual Build with Python Script

```bash
# Use the automated build script
python3 ../build_apk.py
```

## 🔄 CI/CD Pipeline

This project uses **GitHub Actions** for automated building and releasing:

### Automated Builds

- ✅ **Push to main/develop**: Builds debug APK
- ✅ **Pull Requests**: Validates build process
- ✅ **Version Tags**: Creates release with signed APK
- ✅ **Manual Trigger**: Build on-demand

### Release Process

1. **Create a tag**: `git tag v1.0.0`
2. **Push tag**: `git push origin v1.0.0`
3. **GitHub Actions**: Automatically builds and creates release
4. **Download**: APK available in GitHub Releases

### Build Artifacts

- **Debug APK**: Available for every build
- **Release APK**: Created for tagged versions
- **Build Logs**: Complete build information
- **Test Results**: Automated testing reports

## 📁 Project Structure

```
sperm-analyzer-ai/
├── sperm-analyzer-mobile/          # Mobile app (Capacitor)
│   ├── android/                    # Android project
│   │   ├── app/                    # Main Android app
│   │   ├── build.gradle           # Build configuration
│   │   └── gradlew               # Gradle wrapper
│   ├── www/                       # Web assets
│   │   └── index.html            # Main HTML file
│   ├── capacitor.config.ts       # Capacitor configuration
│   └── package.json             # Node.js dependencies
├── .github/
│   └── workflows/
│       ├── build-android.yml     # Android build workflow
│       └── static.yml           # GitHub Pages deployment
├── build_apk.py                 # Python build script
└── README.md                   # This file
```

## 🔧 Configuration

### App Configuration

Edit `sperm-analyzer-mobile/capacitor.config.ts`:

```typescript
const config: CapacitorConfig = {
  appId: 'com.scrapybara.spermanalyzer',
  appName: 'Sperm Analyzer AI',
  webDir: 'www',
  // ... other configurations
};
```

### Android Specific Settings

- **Minimum SDK**: API 24 (Android 7.0)
- **Target SDK**: Latest available
- **Build Tools**: Latest version
- **Gradle**: Wrapper included

### Permissions Required

```xml
<uses-permission android:name="android.permission.CAMERA" />
<uses-permission android:name="android.permission.WRITE_EXTERNAL_STORAGE" />
<uses-permission android:name="android.permission.READ_EXTERNAL_STORAGE" />
```

## 🧪 Testing

```bash
# Run all tests
npm test

# Lint code
npm run lint

# Clean build artifacts
npm run clean
```

## 📦 APK Signing (Production)

For production releases, you'll need to:

1. **Generate keystore**:
   ```bash
   keytool -genkey -v -keystore my-upload-key.keystore -keyalg RSA -keysize 2048 -validity 10000 -alias my-key-alias
   ```

2. **Configure signing** in `android/app/build.gradle`

3. **Add secrets** to GitHub repository:
   - `ANDROID_KEYSTORE_FILE`
   - `ANDROID_KEYSTORE_PASSWORD`
   - `ANDROID_KEY_ALIAS`
   - `ANDROID_KEY_PASSWORD`

## 🤝 Contributing

1. **Fork** the repository
2. **Create** a feature branch (`git checkout -b feature/amazing-feature`)
3. **Commit** your changes (`git commit -m 'Add amazing feature'`)
4. **Push** to the branch (`git push origin feature/amazing-feature`)
5. **Open** a Pull Request

## 📄 License

This project is licensed under the **MIT License** - see the [LICENSE](LICENSE) file for details.

## 🆘 Support

- 📧 **Email**: support@scrapybara.com
- 🐛 **Issues**: [GitHub Issues](https://github.com/your-username/sperm-analyzer-ai/issues)
- 💬 **Discussions**: [GitHub Discussions](https://github.com/your-username/sperm-analyzer-ai/discussions)

## 🙏 Acknowledgments

- Built with [Capacitor](https://capacitorjs.com/)
- Android development powered by [Android Studio](https://developer.android.com/studio)
- CI/CD by [GitHub Actions](https://github.com/features/actions)

---

<div align="center">

**Made with ❤️ by Scrapybara**

[⭐ Star this repo](https://github.com/your-username/sperm-analyzer-ai) | [🍴 Fork it](https://github.com/your-username/sperm-analyzer-ai/fork) | [📋 Clone it](https://github.com/your-username/sperm-analyzer-ai.git)

</div>