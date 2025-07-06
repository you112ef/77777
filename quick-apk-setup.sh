#!/bin/bash

# 🧬 Sperm Analyzer AI - Quick APK Setup
echo "🧬 إعداد سريع لبناء APK"

# 1. رفع إلى GitHub
echo "📤 رفع الكود إلى GitHub..."
git add .
git commit -m "🧬 APK Build Setup - v1.0.0"
git push origin main

# 2. إنشاء release tag  
echo "🏷️ إنشاء Release Tag..."
git tag v1.0.0
git push origin v1.0.0

# 3. معلومات للمستخدم
echo ""
echo "✅ تم رفع الكود بنجاح!"
echo "🔗 اذهب إلى: https://github.com/YOUR-USERNAME/YOUR-REPO"
echo "📋 خطوات التالية:"
echo "   1. Actions → Build Android APK → Run workflow"
echo "   2. انتظر 10-15 دقيقة"
echo "   3. حمل APK من Artifacts"
echo ""
echo "🚀 APK سيكون جاهز قريباً!"
