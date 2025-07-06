# 🚀 تعليمات بناء APK على GitHub Actions

## خطوات سريعة:

### 1. إعداد Repository
```bash
# إنشاء repository على GitHub ثم:
git remote add origin https://github.com/USERNAME/REPO.git
git branch -M main  
git push -u origin main
git push origin --tags
```

### 2. تشغيل GitHub Actions يدوياً
1. اذهب إلى repository على GitHub
2. اضغط على تبويب **Actions**
3. ابحث عن **"🧬 Build Android APK"**
4. اضغط **"Run workflow"**
5. اختر الإعدادات:
   - Build Type: **release**
   - Upload artifacts: **✅**
   - Create release: **✅**
6. اضغط **"Run workflow"**

### 3. تحميل APK
- انتظر 10-15 دقيقة للانتهاء
- اذهب إلى **Releases** أو **Actions → Artifacts**
- حمل ملف APK

## 🎯 معلومات APK:
- **الاسم**: محلل الحيوانات المنوية
- **الحزمة**: com.scrapybara.spermanalyzer
- **الإصدار**: v1.0.0
- **الحجم المتوقع**: ~25MB

## 🔧 إذا فشل البناء:
1. تحقق من ملفات Android في `sperm-analyzer-mobile/android/`
2. تأكد من صحة `capacitor.config.ts`
3. راجع logs في GitHub Actions

## 📱 APK تجريبي متاح:
يمكنك استخدام APK التجريبي من مجلد `demo-apk/` للتجربة الفورية.

---
🧬 **جاهز للبناء!**
