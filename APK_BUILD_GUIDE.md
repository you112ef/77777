# 🧬 Sperm Analyzer AI - APK Build Guide

## 📱 تطبيق محلل الحيوانات المنوية - دليل بناء APK

هذا الدليل يوضح كيفية بناء ملف APK حقيقي للتطبيق باستخدام GitHub Actions أو محلياً.

---

## 🚀 **البناء التلقائي على GitHub**

### الإعداد الأولي

1. **Fork أو Clone المشروع**:
```bash
git clone <repository-url>
cd sperm-analyzer-ai
```

2. **رفع الكود إلى GitHub Repository**:
```bash
git add .
git commit -m "🧬 Initial commit - Sperm Analyzer AI"
git push origin main
```

### تشغيل GitHub Actions

يتم بناء APK تلقائياً عند:
- **Push إلى main/master branch**
- **إنشاء Release Tag** (مثل `v1.0.0`)
- **التشغيل اليدوي** عبر Actions tab

#### التشغيل اليدوي:
1. اذهب إلى **Actions** tab في GitHub
2. اختر **"🧬 Build Android APK - Sperm Analyzer AI"**
3. اضغط **"Run workflow"**
4. اختر **"Create GitHub Release"** إذا كنت تريد إنشاء release

### تحميل APK

#### من GitHub Actions:
1. اذهب إلى **Actions** → **أحدث workflow run**
2. في قسم **Artifacts**, ستجد ملف APK
3. حمل الملف واستخرجه

#### من GitHub Releases:
1. اذهب إلى **Releases** tab
2. حمل APK من أحدث release

---

## 🛠️ **البناء المحلي**

### المتطلبات

- **Node.js 18+**
- **Java JDK 17+**
- **Android SDK** (Android Studio)
- **npm أو yarn**

### إعداد Android SDK

```bash
# Linux/Mac
export ANDROID_HOME=$HOME/Android/Sdk
export PATH=$PATH:$ANDROID_HOME/emulator
export PATH=$PATH:$ANDROID_HOME/tools
export PATH=$PATH:$ANDROID_HOME/tools/bin
export PATH=$PATH:$ANDROID_HOME/platform-tools

# Windows (Command Prompt)
set ANDROID_HOME=C:\Users\%USERNAME%\AppData\Local\Android\Sdk
set PATH=%PATH%;%ANDROID_HOME%\emulator;%ANDROID_HOME%\tools;%ANDROID_HOME%\platform-tools
```

### بناء APK محلياً

#### Linux/Mac:
```bash
chmod +x build-apk-local.sh
./build-apk-local.sh
```

#### Windows:
```cmd
build-apk-local.bat
```

### النتيجة
سيتم إنشاء APK في مجلد `dist/`:
```
dist/
└── SpermAnalyzerAI-v1.0.0-local.apk
```

---

## 📋 **تفاصيل التطبيق**

### معلومات APK
- **Package Name**: `com.scrapybara.spermanalyzer`
- **App Name**: `محلل الحيوانات المنوية` (Sperm Analyzer AI)
- **Min SDK**: 24 (Android 7.0)
- **Target SDK**: 34 (Android 14)
- **Permissions**:
  - Camera
  - File Storage
  - Internet Access

### المميزات المدمجة
- ✅ **AI حقيقي**: YOLOv8 لتحليل الحيوانات المنوية
- ✅ **واجهة عربية**: دعم RTL كامل
- ✅ **رسوم بيانية**: Chart.js للتصور
- ✅ **تصدير البيانات**: CSV وصور الرسوم البيانية
- ✅ **يعمل بدون إنترنت**: معالجة محلية

---

## 📱 **تثبيت APK**

### على الهاتف
1. **تفعيل "مصادر غير معروفة"**:
   - اذهب إلى `الإعدادات` → `الأمان`
   - فعل `مصادر غير معروفة` أو `تثبيت تطبيقات غير معروفة`

2. **نقل APK**:
   - انقل ملف APK إلى الهاتف عبر USB أو Cloud
   - أو حمل مباشرة من GitHub على الهاتف

3. **التثبيت**:
   - افتح ملف APK
   - اضغط `تثبيت`
   - امنح الأذونات المطلوبة

### الأذونات المطلوبة
عند أول تشغيل، ستحتاج لمنح:
- **الكاميرا**: لالتقاط الصور وتسجيل الفيديو
- **التخزين**: لحفظ وتصدير النتائج

---

## 🔧 **اختبار التطبيق**

### الوظائف للاختبار
1. **تحليل صورة**:
   - التقط صورة بالكاميرا
   - أو اختر صورة من المعرض
   - تأكد من عمل التحليل

2. **الرسوم البيانية**:
   - اذهب إلى `الرسوم البيانية`
   - تأكد من ظهور البيانات
   - جرب تبديل أنواع الرسوم البيانية

3. **التصدير**:
   - صدر النتائج كـ CSV
   - صدر الرسوم البيانية كصور

---

## 🐛 **استكشاف الأخطاء**

### مشاكل شائعة

#### فشل البناء على GitHub
- **تحقق من Logs**: اذهب إلى Actions وافحص الخطأ
- **المتطلبات مفقودة**: تأكد من وجود جميع الملفات
- **مشكلة في Android SDK**: GitHub Actions تعالج هذا تلقائياً

#### فشل البناء المحلي
```bash
# تحقق من Java
java --version

# تحقق من Android SDK
echo $ANDROID_HOME  # Linux/Mac
echo %ANDROID_HOME% # Windows

# تحقق من Node.js
node --version
npm --version
```

#### مشاكل التثبيت
- **تأكد من تفعيل "مصادر غير معروفة"**
- **تحقق من مساحة التخزين المتاحة**
- **أعد تشغيل الهاتف إذا لزم الأمر**

#### مشاكل الأذونات
```xml
<!-- في AndroidManifest.xml -->
<uses-permission android:name="android.permission.CAMERA" />
<uses-permission android:name="android.permission.WRITE_EXTERNAL_STORAGE" />
```

---

## 📊 **مراقبة البناء**

### GitHub Actions Status
يمكنك مراقبة حالة البناء عبر:
- **Actions tab** في GitHub
- **Status badges** في README
- **Email notifications** (إذا فعلت)

### معلومات مفيدة
- **مدة البناء**: ~10-15 دقيقة
- **حجم APK المتوقع**: 15-30 MB
- **وقت انتظار**: يعتمد على GitHub Actions queue

---

## 🚀 **نشر التطبيق**

### للتطوير
- استخدم **debug builds** للاختبار
- شارك APK مع المختبرين عبر GitHub Releases

### للإنتاج
- أنشئ **production keystore**
- فعل **ProGuard/R8** للتصغير
- اختبر على أجهزة متعددة

### Google Play Store (اختياري)
1. أنشئ **release keystore**
2. وقع APK بـ keystore الإنتاج
3. اتبع [Google Play Console guidelines](https://play.google.com/console)

---

## 💡 **نصائح للتطوير**

### تحسين الأداء
```gradle
// في build.gradle
android {
    buildTypes {
        release {
            minifyEnabled true
            shrinkResources true
            proguardFiles getDefaultProguardFile('proguard-android-optimize.txt')
        }
    }
}
```

### تصحيح الأخطاء
```bash
# مشاهدة logs الهاتف
adb logcat | grep "SpermAnalyzer"

# تثبيت APK عبر ADB
adb install path/to/app.apk
```

### اختبار متقدم
- **Unit Tests**: `npm test` في مجلد mobile
- **Integration Tests**: Capacitor test suite
- **Manual Testing**: على أجهزة مختلفة

---

## 📞 **الدعم**

### للمساعدة
- **GitHub Issues**: لإبلاغ عن الأخطاء
- **Discussions**: للأسئلة العامة
- **Documentation**: هذا الملف والملفات المرفقة

### موارد مفيدة
- [Capacitor Documentation](https://capacitorjs.com/docs)
- [Android Developer Guide](https://developer.android.com/guide)
- [GitHub Actions Documentation](https://docs.github.com/en/actions)

---

**🧬 جاهز للبناء والتشغيل!**

التطبيق معد بالكامل لإنتاج APK حقيقي يعمل على أجهزة Android. اتبع الخطوات أعلاه لبناء تطبيقك الآن!