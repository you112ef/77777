# 🧪 اختبار بناء APK محلياً

## 🔧 متطلبات الاختبار

### 📋 المتطلبات الأساسية
- **Java 17** (OpenJDK recommended)
- **Node.js 18+**
- **Android SDK** (API 34)
- **Git**

### 🛠️ إعداد البيئة
```bash
# تثبيت Node.js dependencies
cd sperm-analyzer-mobile
npm install --legacy-peer-deps

# تثبيت Capacitor CLI
npm install -g @capacitor/cli

# التأكد من Java 17
java -version
# يجب أن يظهر: openjdk version "17.x.x"
```

## 🚀 خطوات الاختبار

### 1️⃣ بناء Web App
```bash
cd sperm-analyzer-mobile
npm run build
```

### 2️⃣ مزامنة Capacitor
```bash
npx cap sync android --no-build
```

### 3️⃣ إنشاء Debug Keystore
```bash
cd android
mkdir -p app
keytool -genkey -v -keystore app/debug.keystore \
  -storepass android -alias androiddebugkey \
  -keypass android -keyalg RSA -keysize 2048 \
  -validity 10000 \
  -dname "C=US, O=Android, CN=Android Debug"
```

### 4️⃣ بناء APK
```bash
chmod +x gradlew
./gradlew clean
./gradlew assembleDebug --stacktrace --info
```

## ✅ التحقق من النجاح

### 📱 مكان APK
```bash
# يجب أن يكون الملف موجود في:
ls -la app/build/outputs/apk/debug/app-debug.apk
```

### 📊 معلومات APK
```bash
# حجم الملف
du -h app/build/outputs/apk/debug/app-debug.apk

# معلومات Package (إذا كان aapt متاح)
aapt dump badging app/build/outputs/apk/debug/app-debug.apk
```

## 🐛 حل المشاكل الشائعة

### ❌ مشكلة Java Version
```bash
# تحقق من إصدار Java
java -version

# إذا لم يكن 17، قم بتثبيت OpenJDK 17
sudo apt install openjdk-17-jdk  # Ubuntu/Debian
brew install openjdk@17         # macOS

# تعيين JAVA_HOME
export JAVA_HOME=/usr/lib/jvm/java-17-openjdk
```

### ❌ مشكلة Android SDK
```bash
# تعيين ANDROID_HOME
export ANDROID_HOME=$HOME/Android/Sdk
export PATH=$PATH:$ANDROID_HOME/tools:$ANDROID_HOME/platform-tools
```

### ❌ مشكلة Gradle
```bash
# تنظيف cache
./gradlew --stop
rm -rf ~/.gradle/caches/
./gradlew clean
```

### ❌ مشكلة Dependencies
```bash
# إعادة تثبيت Node modules
rm -rf node_modules package-lock.json
npm install --legacy-peer-deps
```

## 📊 مؤشرات النجاح

### ✅ البناء ناجح إذا:
- ✅ لا توجد أخطاء في `npm run build`
- ✅ `npx cap sync` ينتهي بنجاح
- ✅ `./gradlew assembleDebug` ينتهي بـ "BUILD SUCCESSFUL"
- ✅ ملف `app-debug.apk` موجود وحجمه > 10MB
- ✅ APK قابل للتثبيت على جهاز Android

### 📱 اختبار التثبيت
```bash
# نسخ APK للجهاز واختبار التثبيت
adb install app/build/outputs/apk/debug/app-debug.apk
```

## 🎯 النتيجة المتوقعة

**✅ APK جاهز للاستخدام مع:**
- 📱 حجم: ~15-20 MB
- 🏷️ Package: com.spermanalyzer.ai
- 🔧 Version: 1.0 (1)
- 🤖 Min SDK: 24 (Android 7.0+)
- 🎯 Target SDK: 34 (Android 14)

**🧬 الميزات العاملة:**
- ✅ واجهة عربية RTL
- ✅ ذكاء اصطناعي YOLOv8
- ✅ تحليل CASA
- ✅ تصدير PDF/CSV/JSON
- ✅ رسوم بيانية تفاعلية

---

**💡 نصيحة:** إذا فشل البناء محلياً، نفس المشكلة ستحدث في GitHub Actions!