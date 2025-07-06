# دليل بناء ونشر تطبيق محلل الحيوانات المنوية بالذكاء الاصطناعي

## نظرة عامة

هذا الدليل يوضح كيفية بناء ونشر تطبيق **محلل الحيوانات المنوية بالذكاء الاصطناعي** كتطبيق Android APK يعمل بدون إنترنت مع وظائف كاملة للذكاء الاصطناعي.

## المتطلبات الأساسية

### متطلبات النظام
- **نظام التشغيل**: Linux، macOS، أو Windows
- **Node.js**: الإصدار 18.0.0 أو أحدث
- **npm**: الإصدار 8.0.0 أو أحدث
- **Java JDK**: الإصدار 17 أو أحدث
- **Android SDK**: API Level 24+ (Android 7.0)
- **Git**: لإدارة الكود

### أدوات التطوير
- **Android Studio** (اختياري للتطوير)
- **VS Code** أو أي محرر نصوص
- **Chrome/Firefox** للاختبار في المتصفح

## إعداد البيئة

### 1. تثبيت Node.js و npm
```bash
# تحقق من الإصدار الحالي
node --version
npm --version

# تثبيت Node.js من الموقع الرسمي
# https://nodejs.org/
```

### 2. تثبيت Java JDK
```bash
# Ubuntu/Debian
sudo apt update
sudo apt install openjdk-17-jdk

# macOS (باستخدام Homebrew)
brew install openjdk@17

# Windows
# حمل وثبت من Oracle أو OpenJDK
```

### 3. إعداد Android SDK
```bash
# تثبيت Android Studio أو SDK Tools فقط
# أو استخدام GitHub Actions (موصى به)

# إعداد متغيرات البيئة
export ANDROID_HOME=$HOME/Android/Sdk
export PATH=$PATH:$ANDROID_HOME/platform-tools
export PATH=$PATH:$ANDROID_HOME/cmdline-tools/latest/bin
```

## بناء التطبيق محلياً

### 1. استنساخ المشروع
```bash
git clone https://github.com/sperm-analyzer-ai/mobile-app.git
cd mobile-app/sperm-analyzer-mobile
```

### 2. تثبيت التبعيات
```bash
# تثبيت جميع التبعيات
npm run install:deps

# أو تثبيت يدوي
npm install
npm install -g @capacitor/cli
```

### 3. إعداد المشروع
```bash
# إنشاء ملفات الأيقونات والموارد
npm run setup

# أو خطوة بخطوة
npm run build
npx cap add android
```

### 4. بناء ملفات الويب
```bash
# بناء ملفات HTML/CSS/JS
npm run build

# نسخ الملفات إلى Android
npx cap copy android
npx cap sync android
```

### 5. بناء APK
```bash
# للتطوير (Debug)
npm run debug:android

# للإنتاج (Release)
npm run release:android

# أو مباشرة مع Gradle
cd android
./gradlew assembleDebug    # للتطوير
./gradlew assembleRelease  # للإنتاج
```

## الحلول للمشاكل الشائعة

### مشكلة gradle-wrapper.jar مفقود
```bash
cd sperm-analyzer-mobile/android
curl -L -o gradle/wrapper/gradle-wrapper.jar \
  https://github.com/gradle/gradle/raw/v8.2.1/gradle/wrapper/gradle-wrapper.jar
chmod +x gradlew
```

### خطأ في الأذونات
```bash
# إعطاء أذونات للملفات
chmod +x android/gradlew
chmod -R 755 android/gradle/
```

### مشكلة في إصدار Java
```bash
# تأكد من إصدار Java
java -version
javac -version

# إعداد JAVA_HOME
export JAVA_HOME=/usr/lib/jvm/java-17-openjdk-amd64
```

## البناء باستخدام GitHub Actions

### 1. إعداد Repository
```bash
# ادفع الكود إلى GitHub
git add .
git commit -m "Initial commit"
git push origin main
```

### 2. تفعيل GitHub Actions
الملف `.github/workflows/build-apk.yml` موجود بالفعل ويقوم بـ:
- بناء التطبيق تلقائياً
- إنشاء APK للتطوير والإنتاج
- رفع الملفات كـ artifacts
- إنشاء release عند وضع tag

### 3. إنشاء Release
```bash
# إنشاء tag جديد
git tag v1.0.0
git push origin v1.0.0

# سيتم بناء ورفع APK تلقائياً
```

## التوقيع الرقمي للـ APK

### 1. إنشاء Keystore
```bash
keytool -genkey -v -keystore release.keystore \
  -alias sperm-analyzer -keyalg RSA -keysize 2048 \
  -validity 10000

# احفظ الملف والكلمات السرية بأمان
```

### 2. إعداد GitHub Secrets
في إعدادات Repository على GitHub، أضف:
- `ANDROID_KEYSTORE_BASE64`: محتوى keystore مُرمز بـ base64
- `ANDROID_KEYSTORE_PASSWORD`: كلمة سر keystore
- `ANDROID_KEY_ALIAS`: اسم المفتاح
- `ANDROID_KEY_PASSWORD`: كلمة سر المفتاح

```bash
# تحويل keystore إلى base64
base64 -w 0 release.keystore > keystore.base64.txt
```

### 3. توقيع يدوي
```bash
# توقيع APK يدوياً
$ANDROID_HOME/build-tools/34.0.0/apksigner sign \
  --ks release.keystore \
  --ks-key-alias sperm-analyzer \
  --out app-release-signed.apk \
  app-release-unsigned.apk
```

## اختبار التطبيق

### 1. اختبار في المتصفح
```bash
# تشغيل خادم محلي
npm run serve

# فتح في المتصفح
# http://localhost:3000
```

### 2. اختبار على الجهاز
```bash
# تثبيت APK على جهاز Android
adb install app-debug.apk

# أو نسخ الملف وتثبيت يدوياً
```

### 3. اختبار الوظائف
- [ ] تشغيل التطبيق
- [ ] التقاط صورة من الكاميرا
- [ ] اختيار صورة من المعرض
- [ ] تشغيل التحليل
- [ ] عرض النتائج
- [ ] حفظ التحليل
- [ ] عرض السجل
- [ ] مشاركة النتائج

## النشر

### 1. متجر Google Play
```bash
# إنشاء AAB للمتجر
./gradlew bundleRelease

# الملف في: android/app/build/outputs/bundle/release/
```

### 2. التوزيع المباشر
- رفع APK إلى موقع ويب
- توزيع عبر البريد الإلكتروني
- استخدام GitHub Releases

### 3. التحديث التلقائي
- استخدام Firebase App Distribution
- إعداد OTA updates
- استخدام CodePush (للتحديثات السريعة)

## إعدادات الإنتاج

### 1. تحسين الأداء
```javascript
// في capacitor.config.ts
export default {
  appId: 'com.spermanalyzer.ai',
  appName: 'محلل الحيوانات المنوية',
  webDir: 'www',
  bundledWebRuntime: false,
  android: {
    buildOptions: {
      keystorePath: 'release.keystore',
      keystoreAlias: 'sperm-analyzer',
      releaseType: 'AAB'
    }
  }
};
```

### 2. تحسين حجم APK
```bash
# تمكين ProGuard/R8
# في android/app/build.gradle
android {
    buildTypes {
        release {
            minifyEnabled true
            shrinkResources true
            proguardFiles getDefaultProguardFile('proguard-android-optimize.txt'), 'proguard-rules.pro'
        }
    }
}
```

### 3. إعدادات الأمان
```xml
<!-- في android/app/src/main/AndroidManifest.xml -->
<application
    android:allowBackup="false"
    android:usesCleartextTraffic="false"
    android:networkSecurityConfig="@xml/network_security_config">
```

## المراقبة والتحليلات

### 1. تتبع الأخطاء
```javascript
// في app.js
if (window.Capacitor && Capacitor.isNativePlatform()) {
    // إعداد Crashlytics أو Sentry
}
```

### 2. تحليلات الاستخدام
```javascript
// تتبع الأحداث المهمة
analytics.track('analysis_completed', {
    confidence: result.confidence,
    processing_time: result.processingTime
});
```

## النسخ الاحتياطي والاستعادة

### 1. نسخ احتياطي للكود
```bash
# Git hooks للنسخ الاحتياطي
git remote add backup https://backup-server.com/repo.git
git push backup main
```

### 2. نسخ احتياطي لبيانات المستخدم
```javascript
// في storage.js
async exportUserData() {
    const data = await this.getAllAnalyses();
    return JSON.stringify(data);
}
```

## الصيانة والتحديث

### 1. تحديث التبعيات
```bash
# فحص التحديثات
npm outdated

# تحديث التبعيات
npm update

# تحديث Capacitor
npx cap update
```

### 2. مراقبة الأمان
```bash
# فحص الثغرات الأمنية
npm audit

# إصلاح الثغرات
npm audit fix
```

## الدعم الفني

### 1. سجلات التطبيق
```javascript
// تمكين السجلات المفصلة
console.log = function(...args) {
    if (DEBUG_MODE) {
        // حفظ السجلات محلياً
        localStorage.setItem('app_logs', 
            localStorage.getItem('app_logs') + '\n' + args.join(' ')
        );
    }
};
```

### 2. تقارير الأخطاء
```javascript
window.onerror = function(msg, url, line, col, error) {
    const errorReport = {
        message: msg,
        source: url,
        line: line,
        column: col,
        stack: error ? error.stack : null,
        timestamp: new Date().toISOString(),
        userAgent: navigator.userAgent
    };
    
    // حفظ التقرير محلياً
    saveErrorReport(errorReport);
};
```

## الامتثال والقانونية

### 1. خصوصية البيانات
- إضافة سياسة الخصوصية
- إعداد موافقة المستخدم
- تشفير البيانات الحساسة

### 2. المعايير الطبية
- إضافة إخلاء مسؤولية طبية
- اتباع معايير FDA/CE (إن أمكن)
- توثيق دقة النظام

## الخلاصة

هذا الدليل يوفر إرشادات شاملة لبناء ونشر تطبيق محلل الحيوانات المنوية. التطبيق مُصمم ليعمل بدون إنترنت ويوفر تحليلاً متقدماً باستخدام الذكاء الاصطناعي.

### الخطوات التالية:
1. اتبع دليل الإعداد
2. ابنِ التطبيق محلياً
3. اختبر جميع الوظائف
4. استخدم GitHub Actions للبناء التلقائي
5. وقع التطبيق للإنتاج
6. انشر في المتجر أو وزع مباشرة

للدعم الفني، راجع ملف `TROUBLESHOOTING.md` أو اتصل بفريق التطوير.

---

**إخلاء مسؤولية**: هذا التطبيق مخصص للأغراض التعليمية والبحثية فقط. لا يجب استخدامه للتشخيص الطبي. استشر طبيباً مختصاً دائماً.