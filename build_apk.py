#!/usr/bin/env python3
"""
Build APK for Sperm Analyzer AI
This script builds the Android APK using Capacitor and Gradle
"""

import os
import subprocess
import sys
from pathlib import Path

def run_command(command, cwd=None, description=""):
    """Run a command and return success status"""
    print(f"\n🔧 {description}")
    print(f"📍 Directory: {cwd or os.getcwd()}")
    print(f"⚡ Command: {command}")
    
    # Set JAVA_HOME environment variable
    env = os.environ.copy()
    env['JAVA_HOME'] = '/usr/lib/jvm/java-17-openjdk-amd64'
    env['PATH'] = f"{env['JAVA_HOME']}/bin:{env['PATH']}"
    
    try:
        result = subprocess.run(
            command, 
            shell=True, 
            cwd=cwd, 
            check=True,
            capture_output=True,
            text=True,
            env=env
        )
        print(f"✅ Success: {description}")
        if result.stdout:
            print(f"📄 Output: {result.stdout}")
        return True
    except subprocess.CalledProcessError as e:
        print(f"❌ Error: {description}")
        print(f"💥 Return code: {e.returncode}")
        if e.stdout:
            print(f"📄 stdout: {e.stdout}")
        if e.stderr:
            print(f"🚨 stderr: {e.stderr}")
        return False

def main():
    print("🚀 Starting Android APK build for Sperm Analyzer AI")
    
    # Project paths
    mobile_dir = Path("/home/scrapybara/sperm-analyzer-mobile")
    android_dir = mobile_dir / "android"
    
    # Verify project structure
    if not mobile_dir.exists():
        print(f"❌ Mobile project directory not found: {mobile_dir}")
        sys.exit(1)
    
    if not android_dir.exists():
        print(f"❌ Android directory not found: {android_dir}")
        sys.exit(1)
    
    print(f"✅ Project directory found: {mobile_dir}")
    print(f"✅ Android directory found: {android_dir}")
    
    # Step 1: Copy web assets to Android
    print("\n📱 Step 1: Copying web assets to Android project...")
    if not run_command(
        "npx cap copy android",
        cwd=mobile_dir,
        description="Copying web assets to Android"
    ):
        print("❌ Failed to copy web assets")
        sys.exit(1)
    
    # Step 2: Sync Capacitor
    print("\n🔄 Step 2: Syncing Capacitor...")
    if not run_command(
        "npx cap sync android",
        cwd=mobile_dir,
        description="Syncing Capacitor Android project"
    ):
        print("❌ Failed to sync Capacitor")
        sys.exit(1)
    
    # Step 3: Make gradlew executable
    print("\n🔧 Step 3: Making gradlew executable...")
    gradlew_path = android_dir / "gradlew"
    if gradlew_path.exists():
        os.chmod(gradlew_path, 0o755)
        print(f"✅ Made {gradlew_path} executable")
    else:
        print(f"⚠️  gradlew not found at {gradlew_path}")
    
    # Step 4: Clean Android project
    print("\n🧹 Step 4: Cleaning Android project...")
    if not run_command(
        "./gradlew clean",
        cwd=android_dir,
        description="Cleaning Android project"
    ):
        print("⚠️ Clean failed, continuing anyway...")
    
    # Step 5: Build debug APK
    print("\n🏗️  Step 5: Building debug APK...")
    if not run_command(
        "./gradlew assembleDebug",
        cwd=android_dir,
        description="Building debug APK"
    ):
        print("❌ Failed to build debug APK")
        sys.exit(1)
    
    # Step 6: Find and copy APK
    print("\n📦 Step 6: Locating built APK...")
    apk_path = android_dir / "app" / "build" / "outputs" / "apk" / "debug" / "app-debug.apk"
    
    if apk_path.exists():
        # Copy APK to home directory with a meaningful name
        output_path = Path("/home/scrapybara/sperm-analyzer-ai.apk")
        if not run_command(
            f"cp '{apk_path}' '{output_path}'",
            description="Copying APK to home directory"
        ):
            print("⚠️ Failed to copy APK, but build succeeded")
        else:
            print(f"\n🎉 SUCCESS! APK built and copied to: {output_path}")
            print(f"📱 File size: {output_path.stat().st_size / 1024 / 1024:.1f} MB")
    else:
        print(f"❌ APK not found at expected location: {apk_path}")
        print("🔍 Searching for APK files...")
        
        # Search for any APK files in the build directory
        build_dir = android_dir / "app" / "build"
        if build_dir.exists():
            apk_files = list(build_dir.rglob("*.apk"))
            if apk_files:
                print("📱 Found APK files:")
                for apk in apk_files:
                    print(f"  - {apk}")
                    size_mb = apk.stat().st_size / 1024 / 1024
                    print(f"    Size: {size_mb:.1f} MB")
            else:
                print("❌ No APK files found in build directory")
        
        sys.exit(1)
    
    print("\n✨ Build completed successfully!")
    print(f"📱 Your APK is ready: /home/scrapybara/sperm-analyzer-ai.apk")
    print("🚀 You can now install it on your Android device!")

if __name__ == "__main__":
    main()