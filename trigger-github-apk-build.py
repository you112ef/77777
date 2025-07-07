#!/usr/bin/env python3
"""
🚀 تشغيل بناء APK على GitHub Actions فوراً
Trigger APK build on GitHub Actions immediately
"""

import os
import sys
import subprocess
import time
import json
from pathlib import Path

class GitHubAPKBuilder:
    def __init__(self):
        self.project_root = Path(__file__).parent
        self.version = "1.0.0"
        
    def print_status(self, message, emoji="ℹ️"):
        print(f"{emoji} {message}")
        
    def run_command(self, cmd, show_output=True):
        """تشغيل أمر Git مع معالجة الأخطاء"""
        try:
            if show_output:
                self.print_status(f"تشغيل: {cmd}", "⚙️")
            
            result = subprocess.run(cmd, shell=True, 
                                 capture_output=True, text=True, check=True)
            
            if show_output and result.stdout:
                print(result.stdout)
                
            return result.stdout
        except subprocess.CalledProcessError as e:
            self.print_status(f"❌ خطأ في: {cmd}", "❌")
            if e.stderr:
                print(e.stderr)
            return None
            
    def check_git_status(self):
        """التحقق من حالة Git"""
        self.print_status("🔍 فحص حالة Git...", "🔍")
        
        # التحقق من وجود Git
        if not self.run_command("git --version", False):
            raise Exception("Git غير مثبت!")
            
        # التحقق من وجود repository
        if not self.run_command("git status", False):
            self.print_status("🆕 إنشاء Git repository جديد...", "🆕")
            self.run_command("git init")
            
        return True
        
    def setup_git_config(self):
        """إعداد Git config إذا لزم الأمر"""
        # فحص إذا كان Git مُعد
        name = self.run_command("git config user.name", False)
        email = self.run_command("git config user.email", False)
        
        if not name or not email:
            self.print_status("⚙️ إعداد Git config...", "⚙️")
            self.run_command('git config user.name "Sperm Analyzer Builder"')
            self.run_command('git config user.email "builder@spermanalyzer.ai"')
            
    def create_commit_and_push(self):
        """إنشاء commit ورفع إلى GitHub"""
        self.print_status("📦 إعداد الملفات للرفع...", "📦")
        
        # إضافة جميع الملفات
        self.run_command("git add .")
        
        # إنشاء commit
        commit_message = f"🧬 APK Build Ready - Sperm Analyzer AI v{self.version}"
        self.run_command(f'git commit -m "{commit_message}"')
        
        # إنشاء tag للإصدار
        tag_name = f"v{self.version}"
        self.print_status(f"🏷️ إنشاء tag: {tag_name}", "🏷️")
        self.run_command(f"git tag -a {tag_name} -m 'Release {tag_name}'")
        
        # رفع إلى GitHub (إذا كان repository موجود)
        self.print_status("🚀 رفع إلى GitHub...", "🚀")
        
        # محاولة رفع إلى main أو master
        push_success = False
        for branch in ["main", "master"]:
            result = self.run_command(f"git push origin {branch}", False)
            if result is not None:
                push_success = True
                break
                
        if not push_success:
            self.print_status("⚠️ لم يتم رفع الكود - تأكد من إعداد GitHub remote", "⚠️")
            self.print_git_setup_instructions()
            return False
            
        # رفع الـ tags
        self.run_command("git push origin --tags")
        
        return True
        
    def trigger_github_actions(self):
        """محاولة تشغيل GitHub Actions"""
        self.print_status("🎯 محاولة تشغيل GitHub Actions...", "🎯")
        
        # التحقق من وجود GitHub CLI
        gh_version = self.run_command("gh --version", False)
        
        if gh_version:
            self.print_status("✅ GitHub CLI موجود", "✅")
            
            # تشغيل workflow
            workflow_result = self.run_command(
                'gh workflow run "build-android-apk.yml" --field build_type=release --field upload_artifacts=true --field create_release=true',
                False
            )
            
            if workflow_result is not None:
                self.print_status("🎉 تم تشغيل GitHub Actions بنجاح!", "🎉")
                return True
            else:
                self.print_status("⚠️ لم يتم تشغيل workflow - قم بتشغيله يدوياً", "⚠️")
        else:
            self.print_status("⚠️ GitHub CLI غير موجود - شغل workflow يدوياً", "⚠️")
            
        return False
        
    def print_git_setup_instructions(self):
        """عرض تعليمات إعداد Git"""
        print("\n" + "="*50)
        print("📋 تعليمات إعداد GitHub Repository:")
        print("="*50)
        print("1. إنشاء repository جديد على GitHub")
        print("2. انسخ URL الخاص بالـ repository")
        print("3. شغل الأوامر التالية:")
        print("")
        print("   git remote add origin https://github.com/USERNAME/REPO.git")
        print("   git branch -M main")
        print("   git push -u origin main")
        print("")
        print("4. ثم شغل هذا الـ script مرة أخرى")
        print("="*50)
        
    def create_manual_instructions(self):
        """إنشاء تعليمات يدوية"""
        instructions_file = self.project_root / "GITHUB_ACTIONS_INSTRUCTIONS.md"
        
        content = f"""# 🚀 تعليمات بناء APK على GitHub Actions

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
- **الإصدار**: v{self.version}
- **الحجم المتوقع**: ~25MB

## 🔧 إذا فشل البناء:
1. تحقق من ملفات Android في `sperm-analyzer-mobile/android/`
2. تأكد من صحة `capacitor.config.ts`
3. راجع logs في GitHub Actions

## 📱 APK تجريبي متاح:
يمكنك استخدام APK التجريبي من مجلد `demo-apk/` للتجربة الفورية.

---
🧬 **جاهز للبناء!**
"""
        
        with open(instructions_file, 'w', encoding='utf-8') as f:
            f.write(content)
            
        self.print_status(f"📋 تم إنشاء التعليمات: {instructions_file}", "📋")
        
    def run(self):
        """تشغيل العملية الكاملة"""
        try:
            self.print_status("🚀 بدء تشغيل GitHub APK Builder", "🚀")
            
            # 1. فحص Git
            self.check_git_status()
            
            # 2. إعداد Git config
            self.setup_git_config()
            
            # 3. إنشاء commit ورفع
            if self.create_commit_and_push():
                # 4. محاولة تشغيل Actions
                if self.trigger_github_actions():
                    self.print_success_instructions()
                else:
                    self.print_manual_instructions()
            else:
                self.print_setup_needed()
                
            # 5. إنشاء تعليمات مفصلة
            self.create_manual_instructions()
            
        except Exception as e:
            self.print_status(f"❌ خطأ: {e}", "❌")
            self.print_manual_instructions()
            
    def print_success_instructions(self):
        """عرض تعليمات النجاح"""
        print("\n" + "🎉"*20)
        print("✅ تم تشغيل GitHub Actions بنجاح!")
        print("🎉"*20)
        print("\n📋 الخطوات التالية:")
        print("1. ⏰ انتظر 10-15 دقيقة لإنهاء البناء")
        print("2. 🔗 اذهب إلى repository على GitHub")
        print("3. 📊 تابع التقدم في تبويب Actions")
        print("4. 📱 حمل APK من Releases أو Artifacts")
        print("\n🧬 APK سيكون جاهز قريباً!")
        
    def print_manual_instructions(self):
        """عرض تعليمات يدوية"""
        print("\n" + "📋"*20)
        print("📋 تعليمات يدوية لبناء APK")
        print("📋"*20)
        print("\n🔗 اذهب إلى GitHub repository")
        print("📊 Actions → 🧬 Build Android APK → Run workflow")
        print("⚙️ اختر: release, artifacts=true, release=true")
        print("🚀 اضغط Run workflow")
        print("⏰ انتظر 10-15 دقيقة")
        print("📱 حمل APK من Downloads")
        print("\n🎯 راجع: GITHUB_ACTIONS_INSTRUCTIONS.md")
        
    def print_setup_needed(self):
        """عرض حاجة لإعداد Repository"""
        print("\n" + "⚙️"*20)
        print("⚙️ إعداد GitHub Repository مطلوب")
        print("⚙️"*20)
        print("\n📋 خطوات الإعداد:")
        print("1. إنشاء repository على GitHub")
        print("2. ربطه بالكود المحلي")
        print("3. رفع الكود")
        print("4. تشغيل script مرة أخرى")
        print("\n🔗 راجع: GITHUB_ACTIONS_INSTRUCTIONS.md")

if __name__ == "__main__":
    builder = GitHubAPKBuilder()
    builder.run()