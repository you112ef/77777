#!/bin/bash

# Complete APK Build Script with Local AI Model
# محلل الحيوانات المنوية - APK محلي بالذكاء الاصطناعي

set -e  # Exit on any error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[0;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Function to check if command exists
command_exists() {
    command -v "$1" >/dev/null 2>&1
}

# Function to check system requirements
check_requirements() {
    print_status "فحص متطلبات النظام..."
    
    # Check Node.js
    if ! command_exists node; then
        print_error "Node.js غير مُثبت! الرجاء تثبيت Node.js 18+ من https://nodejs.org"
        exit 1
    fi
    
    node_version=$(node -v | cut -d'v' -f2 | cut -d'.' -f1)
    if [ "$node_version" -lt 18 ]; then
        print_error "Node.js version >= 18 مطلوب. الإصدار الحالي: $(node -v)"
        exit 1
    fi
    print_success "Node.js $(node -v) ✓"
    
    # Check npm
    if ! command_exists npm; then
        print_error "npm غير مُثبت!"
        exit 1
    fi
    print_success "npm $(npm -v) ✓"
    
    # Check Python
    if ! command_exists python3; then
        print_error "Python 3 غير مُثبت! الرجاء تثبيت Python 3.9+"
        exit 1
    fi
    
    python_version=$(python3 -V 2>&1 | grep -Po '(?<=Python )\d+\.\d+' | head -1)
    print_success "Python $python_version ✓"
    
    # Check pip
    if ! command_exists pip3; then
        print_error "pip3 غير مُثبت!"
        exit 1
    fi
    print_success "pip3 $(pip3 -V | cut -d' ' -f2) ✓"
    
    # Check Java (for Android builds)
    if ! command_exists java; then
        print_warning "Java غير مُثبت. سيكون مطلوباً لبناء Android APK"
    else
        print_success "Java $(java -version 2>&1 | head -1 | cut -d'"' -f2) ✓"
    fi
    
    # Check if Android SDK is available
    if [ -z "$ANDROID_HOME" ] && [ -z "$ANDROID_SDK_ROOT" ]; then
        print_warning "ANDROID_HOME غير محدد. سيكون مطلوباً لبناء APK"
    else
        print_success "Android SDK ✓"
    fi
}

# Function to create directory structure
create_directories() {
    print_status "إنشاء هيكل المجلدات..."
    
    mkdir -p sperm-analyzer-mobile/www/assets/models
    mkdir -p sperm-analyzer-mobile/www/assets/icons
    mkdir -p sperm-analyzer-mobile/www/js
    mkdir -p sperm-analyzer-mobile/www/css
    mkdir -p dist
    mkdir -p logs
    
    print_success "تم إنشاء هيكل المجلدات ✓"
}

# Function to install Python dependencies
install_python_deps() {
    print_status "تثبيت تبعيات Python..."
    
    cd sperm-analyzer-ai
    
    if [ ! -f requirements.txt ]; then
        print_status "إنشاء requirements.txt..."
        cat > requirements.txt << EOF
tensorflow>=2.13.0
opencv-python>=4.8.0
ultralytics>=8.0.0
numpy>=1.24.0
pillow>=10.0.0
matplotlib>=3.7.0
scikit-learn>=1.3.0
pandas>=2.0.0
tqdm>=4.65.0
EOF
    fi
    
    # Create virtual environment if it doesn't exist
    if [ ! -d "venv" ]; then
        print_status "إنشاء بيئة Python الافتراضية..."
        python3 -m venv venv
    fi
    
    # Activate virtual environment
    source venv/bin/activate
    
    # Upgrade pip
    pip install --upgrade pip
    
    # Install requirements
    pip install -r requirements.txt
    
    print_success "تم تثبيت تبعيات Python ✓"
    cd ..
}

# Function to create local AI model
create_ai_model() {
    print_status "إنشاء نموذج الذكاء الاصطناعي المحلي..."
    
    cd sperm-analyzer-ai
    source venv/bin/activate
    
    # Run the model creation script
    python create_local_model.py
    
    # Check if model was created successfully
    if [ -f "../sperm-analyzer-mobile/www/assets/models/sperm_detector.tflite" ]; then
        print_success "تم إنشاء نموذج TensorFlow Lite ✓"
    else
        print_error "فشل في إنشاء النموذج!"
        exit 1
    fi
    
    # Check metadata
    if [ -f "../sperm-analyzer-mobile/www/assets/models/model_metadata.json" ]; then
        print_success "تم إنشاء ملف المعادن ✓"
    else
        print_warning "ملف المعادن غير موجود"
    fi
    
    cd ..
}

# Function to install Node.js dependencies
install_node_deps() {
    print_status "تثبيت تبعيات Node.js..."
    
    cd sperm-analyzer-mobile
    
    # Install dependencies
    npm install
    
    # Install Capacitor CLI globally if not installed
    if ! command_exists cap; then
        npm install -g @capacitor/cli
    fi
    
    print_success "تم تثبيت تبعيات Node.js ✓"
    cd ..
}

# Function to build web assets
build_web_assets() {
    print_status "بناء ملفات الويب..."
    
    cd sperm-analyzer-mobile
    
    # Build the web app
    npm run build
    
    print_success "تم بناء ملفات الويب ✓"
    cd ..
}

# Function to sync Capacitor
sync_capacitor() {
    print_status "مزامنة Capacitor..."
    
    cd sperm-analyzer-mobile
    
    # Add Android platform if not exists
    if [ ! -d "android" ]; then
        npx cap add android
    fi
    
    # Sync with native platforms
    npx cap sync android
    
    print_success "تم مزامنة Capacitor ✓"
    cd ..
}

# Function to build Android APK
build_android_apk() {
    print_status "بناء Android APK..."
    
    cd sperm-analyzer-mobile/android
    
    # Make gradlew executable
    chmod +x gradlew
    
    # Download gradle wrapper if missing
    if [ ! -f "gradle/wrapper/gradle-wrapper.jar" ]; then
        print_status "تحميل Gradle Wrapper..."
        mkdir -p gradle/wrapper
        curl -L -o gradle/wrapper/gradle-wrapper.jar \
            https://github.com/gradle/gradle/raw/v8.2.1/gradle/wrapper/gradle-wrapper.jar
    fi
    
    # Build debug APK
    print_status "بناء Debug APK..."
    ./gradlew assembleDebug
    
    if [ $? -eq 0 ]; then
        print_success "تم بناء Debug APK ✓"
        
        # Copy to dist directory
        cp app/build/outputs/apk/debug/app-debug.apk ../../dist/sperm-analyzer-debug.apk
        
        # Get APK size
        debug_size=$(du -h app/build/outputs/apk/debug/app-debug.apk | cut -f1)
        print_success "حجم Debug APK: $debug_size"
    else
        print_error "فشل في بناء Debug APK"
        exit 1
    fi
    
    # Build release APK if keystore exists
    if [ -f "app/keystore/release.keystore" ] || [ ! -z "$ANDROID_KEYSTORE_PASSWORD" ]; then
        print_status "بناء Release APK..."
        ./gradlew assembleRelease
        
        if [ $? -eq 0 ]; then
            print_success "تم بناء Release APK ✓"
            
            # Copy to dist directory
            cp app/build/outputs/apk/release/app-release-unsigned.apk ../../dist/sperm-analyzer-release.apk
            
            # Get APK size
            release_size=$(du -h app/build/outputs/apk/release/app-release-unsigned.apk | cut -f1)
            print_success "حجم Release APK: $release_size"
        else
            print_warning "فشل في بناء Release APK (لكن Debug APK جاهز)"
        fi
    else
        print_warning "لا يوجد keystore للتوقيع. تم تخطي Release APK"
    fi
    
    cd ../..
}

# Function to test APK
test_apk() {
    print_status "اختبار APK..."
    
    # Check if APK files exist
    if [ -f "dist/sperm-analyzer-debug.apk" ]; then
        print_success "Debug APK موجود ✓"
        
        # Get APK info using aapt if available
        if command_exists aapt; then
            print_status "معلومات APK:"
            aapt dump badging dist/sperm-analyzer-debug.apk | grep -E "(package|application-label|sdkVersion|targetSdkVersion)"
        fi
    else
        print_error "Debug APK غير موجود!"
        exit 1
    fi
}

# Function to create release package
create_release_package() {
    print_status "إنشاء حزمة الإصدار..."
    
    # Create release directory
    release_dir="dist/sperm-analyzer-release-$(date +%Y%m%d-%H%M%S)"
    mkdir -p "$release_dir"
    
    # Copy APK files
    if [ -f "dist/sperm-analyzer-debug.apk" ]; then
        cp dist/sperm-analyzer-debug.apk "$release_dir/"
    fi
    
    if [ -f "dist/sperm-analyzer-release.apk" ]; then
        cp dist/sperm-analyzer-release.apk "$release_dir/"
    fi
    
    # Copy documentation
    cp OFFLINE_APK_GUIDE_ARABIC.md "$release_dir/"
    
    # Create installation script
    cat > "$release_dir/install.sh" << 'EOF'
#!/bin/bash
echo "تثبيت محلل الحيوانات المنوية بالذكاء الاصطناعي"
echo "=============================================="

if command -v adb >/dev/null 2>&1; then
    echo "تثبيت عبر ADB..."
    adb install -r sperm-analyzer-debug.apk
else
    echo "الرجاء تثبيت ADB أو نقل ملف APK للجهاز يدوياً"
    echo "ملفات APK المتوفرة:"
    ls -la *.apk
fi
EOF
    chmod +x "$release_dir/install.sh"
    
    # Create release notes
    cat > "$release_dir/RELEASE_NOTES.md" << EOF
# محلل الحيوانات المنوية بالذكاء الاصطناعي
## إصدار $(date +%Y.%m.%d)

### ملفات الحزمة:
- \`sperm-analyzer-debug.apk\`: للتطوير والاختبار
- \`sperm-analyzer-release.apk\`: للاستخدام العادي (إن وُجد)
- \`OFFLINE_APK_GUIDE_ARABIC.md\`: دليل الاستخدام الكامل
- \`install.sh\`: سكريبت التثبيت التلقائي

### الميزات:
✅ تحليل ذكي محلي بدون إنترنت
✅ واجهة عربية متطورة  
✅ حفظ وإدارة النتائج
✅ خصوصية كاملة للبيانات

### متطلبات النظام:
- Android 7.0+ (API 24)
- 100 MB مساحة فارغة
- 2 GB RAM مستحسن

### التثبيت:
1. فعّل "مصادر غير معروفة" في إعدادات الجهاز
2. اختر الملف المناسب لحالة الاستخدام
3. انقر على APK واتبع تعليمات التثبيت

تم البناء في: $(date)
EOF
    
    # Create ZIP archive
    zip_file="dist/sperm-analyzer-apk-$(date +%Y%m%d-%H%M%S).zip"
    cd dist
    zip -r "$(basename "$zip_file")" "$(basename "$release_dir")"
    cd ..
    
    print_success "تم إنشاء حزمة الإصدار: $zip_file"
    print_success "مجلد الإصدار: $release_dir"
}

# Function to display build summary
show_summary() {
    echo ""
    echo "=============================="
    print_success "تم اكتمال البناء بنجاح! 🎉"
    echo "=============================="
    echo ""
    
    print_status "ملفات الإخراج:"
    if [ -f "dist/sperm-analyzer-debug.apk" ]; then
        echo "  📱 Debug APK: dist/sperm-analyzer-debug.apk ($(du -h dist/sperm-analyzer-debug.apk | cut -f1))"
    fi
    
    if [ -f "dist/sperm-analyzer-release.apk" ]; then
        echo "  📱 Release APK: dist/sperm-analyzer-release.apk ($(du -h dist/sperm-analyzer-release.apk | cut -f1))"
    fi
    
    # Find latest release package
    latest_zip=$(ls -t dist/sperm-analyzer-apk-*.zip 2>/dev/null | head -1)
    if [ ! -z "$latest_zip" ]; then
        echo "  📦 حزمة الإصدار: $latest_zip ($(du -h "$latest_zip" | cut -f1))"
    fi
    
    echo ""
    print_status "خطوات التثبيت:"
    echo "  1. انقل ملف APK للجهاز المحمول"
    echo "  2. فعّل 'مصادر غير معروفة' في إعدادات الأمان"
    echo "  3. انقر على ملف APK لتثبيت التطبيق"
    echo "  4. امنح التطبيق صلاحيات الكاميرا والتخزين"
    echo ""
    
    print_status "للمطورين:"
    echo "  🔧 تشغيل مع ADB: adb install -r dist/sperm-analyzer-debug.apk"
    echo "  📖 دليل كامل: OFFLINE_APK_GUIDE_ARABIC.md"
    echo "  🐛 تقرير المشاكل: GitHub Issues"
    echo ""
    
    print_success "شكراً لاستخدام محلل الحيوانات المنوية بالذكاء الاصطناعي! ✨"
}

# Main build process
main() {
    echo "======================================================"
    echo "🔬 محلل الحيوانات المنوية بالذكاء الاصطناعي"
    echo "    بناء APK محلي - يعمل بدون إنترنت"
    echo "======================================================"
    echo ""
    
    # Start build timer
    start_time=$(date +%s)
    
    # Run build steps
    check_requirements
    create_directories
    install_python_deps
    create_ai_model
    install_node_deps
    build_web_assets
    sync_capacitor
    build_android_apk
    test_apk
    create_release_package
    
    # Calculate build time
    end_time=$(date +%s)
    build_time=$((end_time - start_time))
    minutes=$((build_time / 60))
    seconds=$((build_time % 60))
    
    echo ""
    print_success "وقت البناء الإجمالي: ${minutes}m ${seconds}s"
    
    show_summary
}

# Handle script interruption
trap 'print_error "تم إيقاف البناء بواسطة المستخدم"; exit 1' INT TERM

# Parse command line arguments
while [[ $# -gt 0 ]]; do
    case $1 in
        --skip-deps)
            SKIP_DEPS=true
            shift
            ;;
        --debug-only)
            DEBUG_ONLY=true
            shift
            ;;
        --clean)
            CLEAN_BUILD=true
            shift
            ;;
        --help)
            echo "الاستخدام: $0 [OPTIONS]"
            echo ""
            echo "الخيارات:"
            echo "  --skip-deps    تخطي تثبيت التبعيات"
            echo "  --debug-only   بناء Debug APK فقط"
            echo "  --clean        تنظيف قبل البناء"
            echo "  --help         عرض هذه المساعدة"
            echo ""
            exit 0
            ;;
        *)
            print_error "خيار غير معروف: $1"
            echo "استخدم --help لعرض الخيارات المتاحة"
            exit 1
            ;;
    esac
done

# Clean if requested
if [ "$CLEAN_BUILD" = true ]; then
    print_status "تنظيف ملفات البناء السابقة..."
    rm -rf dist/*
    rm -rf sperm-analyzer-mobile/www/build
    rm -rf sperm-analyzer-mobile/android/app/build
    rm -rf sperm-analyzer-ai/venv
    print_success "تم التنظيف ✓"
fi

# Run main build process
main

exit 0