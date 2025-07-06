#!/bin/bash

# 🧬 Sperm Analyzer AI - Local APK Build Script
# This script builds the APK locally for testing before GitHub Actions

set -e  # Exit on any error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${BLUE}🧬 Sperm Analyzer AI - Local APK Build${NC}"
echo "=============================================="

# Function to print colored output
print_status() {
    echo -e "${GREEN}✅ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

print_error() {
    echo -e "${RED}❌ $1${NC}"
}

print_info() {
    echo -e "${BLUE}ℹ️  $1${NC}"
}

# Check prerequisites
echo "🔍 Checking prerequisites..."

if ! command -v node &> /dev/null; then
    print_error "Node.js is not installed"
    exit 1
fi
print_status "Node.js: $(node --version)"

if ! command -v npm &> /dev/null; then
    print_error "npm is not installed"
    exit 1
fi
print_status "npm: $(npm --version)"

if ! command -v java &> /dev/null; then
    print_error "Java is not installed"
    exit 1
fi
print_status "Java: $(java --version | head -1)"

# Check if Android SDK is available
if [ -z "$ANDROID_HOME" ]; then
    print_warning "ANDROID_HOME not set. Make sure Android SDK is installed."
fi

# Navigate to mobile directory
cd sperm-analyzer-mobile

print_info "Working in: $(pwd)"

# Install dependencies
echo ""
echo "📦 Installing dependencies..."
npm install
print_status "Dependencies installed"

# Build web assets
echo ""
echo "🔨 Building web assets..."
npm run build
print_status "Web assets built"

# Setup Capacitor
echo ""
echo "🔧 Setting up Capacitor..."
npx cap sync android
npx cap copy android
print_status "Capacitor setup complete"

# Navigate to Android directory
cd android

# Create keystore if it doesn't exist
if [ ! -f "app/keystore.jks" ]; then
    echo ""
    echo "🔑 Creating debug keystore..."
    keytool -genkeypair -v -keystore app/keystore.jks \
        -alias sperm-analyzer-key -keyalg RSA -keysize 2048 -validity 10000 \
        -storepass android -keypass android \
        -dname "CN=Sperm Analyzer AI, OU=Development, O=Sperm Analyzer, L=City, S=State, C=US"
    print_status "Debug keystore created"
fi

# Configure signing in build.gradle if not already configured
if ! grep -q "signingConfigs" app/build.gradle; then
    echo ""
    echo "🔧 Configuring APK signing..."
    cat >> app/build.gradle << 'EOF'

android {
    signingConfigs {
        release {
            keyAlias 'sperm-analyzer-key'
            keyPassword 'android'
            storeFile file('keystore.jks')
            storePassword 'android'
        }
    }
    buildTypes {
        release {
            signingConfig signingConfigs.release
            minifyEnabled true
            proguardFiles getDefaultProguardFile('proguard-android-optimize.txt'), 'proguard-rules.pro'
        }
        debug {
            signingConfig signingConfigs.release
        }
    }
}
EOF
    print_status "Signing configuration added"
fi

# Clean previous builds
echo ""
echo "🧹 Cleaning previous builds..."
./gradlew clean

# Build APK
echo ""
echo "🔨 Building APK..."
./gradlew assembleRelease --stacktrace

# Find and copy APK
APK_PATH=$(find app/build/outputs/apk/release -name "*.apk" | head -1)

if [ -f "$APK_PATH" ]; then
    # Get version from package.json
    VERSION=$(node -p "require('../package.json').version")
    
    # Create output directory
    mkdir -p ../../dist
    
    # Copy APK with meaningful name
    APK_NAME="SpermAnalyzerAI-v${VERSION}-local.apk"
    cp "$APK_PATH" "../../dist/$APK_NAME"
    
    # Get APK info
    APK_SIZE=$(du -h "../../dist/$APK_NAME" | cut -f1)
    
    echo ""
    echo "🎉 BUILD SUCCESSFUL!"
    echo "==================="
    print_status "APK built successfully"
    print_info "Location: dist/$APK_NAME"
    print_info "Size: $APK_SIZE"
    print_info "Package: com.scrapybara.spermanalyzer"
    
    # Verify APK signature
    echo ""
    echo "🔍 Verifying APK signature..."
    if jarsigner -verify -verbose -certs "../../dist/$APK_NAME" &> /dev/null; then
        print_status "APK signature verified"
    else
        print_warning "APK signature verification failed (but APK should still work)"
    fi
    
    echo ""
    echo "📱 Installation Instructions:"
    echo "1. Transfer the APK to your Android device"
    echo "2. Enable 'Install from Unknown Sources' in Android settings"
    echo "3. Install the APK file"
    echo "4. Grant camera and storage permissions when prompted"
    
    echo ""
    echo "🚀 APK is ready for testing!"
    
else
    print_error "APK not found! Build may have failed."
    echo "Check the build logs above for errors."
    exit 1
fi