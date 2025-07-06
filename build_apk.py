#!/usr/bin/env python3
"""
Enhanced APK Build Script for Sperm Analyzer AI
This script builds Android APKs using Capacitor and Gradle with improved error handling
"""

import os
import subprocess
import sys
import argparse
from pathlib import Path
import time
from datetime import datetime

class Colors:
    HEADER = '\033[95m'
    BLUE = '\033[94m'
    CYAN = '\033[96m'
    GREEN = '\033[92m'
    WARNING = '\033[93m'
    FAIL = '\033[91m'
    ENDC = '\033[0m'
    BOLD = '\033[1m'

def print_colored(message, color=Colors.ENDC):
    """Print colored message to console"""
    print(f"{color}{message}{Colors.ENDC}")

def run_command(command, cwd=None, description="", fail_on_error=True):
    """Run a command with enhanced error handling and logging"""
    print_colored(f"\n🔧 {description}", Colors.CYAN)
    print_colored(f"📍 Directory: {cwd or os.getcwd()}", Colors.BLUE)
    print_colored(f"⚡ Command: {command}", Colors.BLUE)
    
    # Set environment variables
    env = os.environ.copy()
    env['JAVA_HOME'] = '/usr/lib/jvm/java-21-openjdk-amd64'
    env['PATH'] = f"{env['JAVA_HOME']}/bin:{env['PATH']}"
    env['ANDROID_HOME'] = env.get('ANDROID_HOME', '/opt/android-sdk')
    
    start_time = time.time()
    
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
        
        elapsed = time.time() - start_time
        print_colored(f"✅ Success: {description} (took {elapsed:.1f}s)", Colors.GREEN)
        
        if result.stdout and result.stdout.strip():
            print_colored("📄 Output:", Colors.BLUE)
            print(result.stdout)
            
        return True
        
    except subprocess.CalledProcessError as e:
        elapsed = time.time() - start_time
        print_colored(f"❌ Error: {description} (failed after {elapsed:.1f}s)", Colors.FAIL)
        print_colored(f"💥 Return code: {e.returncode}", Colors.FAIL)
        
        if e.stdout:
            print_colored("📄 stdout:", Colors.WARNING)
            print(e.stdout)
        if e.stderr:
            print_colored("🚨 stderr:", Colors.FAIL)
            print(e.stderr)
            
        if fail_on_error:
            sys.exit(1)
        return False

def check_requirements():
    """Check if all required tools are installed"""
    print_colored("🔍 Checking requirements...", Colors.HEADER)
    
    requirements = [
        ("node", "Node.js is required"),
        ("npm", "npm is required"),
        ("java", "Java JDK is required"),
    ]
    
    for cmd, desc in requirements:
        try:
            subprocess.run([cmd, "--version"], capture_output=True, check=True)
            print_colored(f"✅ {desc.split(' is ')[0]} found", Colors.GREEN)
        except (subprocess.CalledProcessError, FileNotFoundError):
            print_colored(f"❌ {desc}", Colors.FAIL)
            return False
    
    return True

def build_apk(build_type="debug", output_dir=None):
    """Build APK with specified type"""
    print_colored(f"🚀 Starting Android APK build for Sperm Analyzer AI", Colors.HEADER)
    print_colored(f"📱 Build type: {build_type.upper()}", Colors.CYAN)
    print_colored(f"🕐 Started at: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}", Colors.BLUE)
    
    # Check requirements
    if not check_requirements():
        print_colored("❌ Requirements check failed", Colors.FAIL)
        sys.exit(1)
    
    # Project paths
    workspace_dir = Path("/workspace")
    mobile_dir = workspace_dir / "sperm-analyzer-mobile"
    android_dir = mobile_dir / "android"
    
    # Verify project structure
    if not mobile_dir.exists():
        print_colored(f"❌ Mobile project directory not found: {mobile_dir}", Colors.FAIL)
        sys.exit(1)
    
    if not android_dir.exists():
        print_colored(f"❌ Android directory not found: {android_dir}", Colors.FAIL)
        sys.exit(1)
    
    print_colored(f"✅ Project directory found: {mobile_dir}", Colors.GREEN)
    print_colored(f"✅ Android directory found: {android_dir}", Colors.GREEN)
    
    # Step 1: Install dependencies
    print_colored("\n📦 Step 1: Installing dependencies...", Colors.HEADER)
    if not run_command(
        "npm ci",
        cwd=mobile_dir,
        description="Installing npm dependencies"
    ):
        print_colored("❌ Failed to install dependencies", Colors.FAIL)
        sys.exit(1)
    
    # Step 2: Build web assets
    print_colored("\n🏗️ Step 2: Building web assets...", Colors.HEADER)
    if not run_command(
        "npm run build",
        cwd=mobile_dir,
        description="Building web assets"
    ):
        print_colored("❌ Failed to build web assets", Colors.FAIL)
        sys.exit(1)
    
    # Step 3: Copy web assets to Android
    print_colored("\n📱 Step 3: Copying web assets to Android project...", Colors.HEADER)
    if not run_command(
        "npx cap copy android",
        cwd=mobile_dir,
        description="Copying web assets to Android"
    ):
        print_colored("❌ Failed to copy web assets", Colors.FAIL)
        sys.exit(1)
    
    # Step 4: Sync Capacitor
    print_colored("\n🔄 Step 4: Syncing Capacitor...", Colors.HEADER)
    if not run_command(
        "npx cap sync android",
        cwd=mobile_dir,
        description="Syncing Capacitor Android project"
    ):
        print_colored("❌ Failed to sync Capacitor", Colors.FAIL)
        sys.exit(1)
    
    # Step 5: Make gradlew executable
    print_colored("\n🔧 Step 5: Preparing Gradle wrapper...", Colors.HEADER)
    gradlew_path = android_dir / "gradlew"
    if gradlew_path.exists():
        os.chmod(gradlew_path, 0o755)
        print_colored(f"✅ Made {gradlew_path} executable", Colors.GREEN)
    else:
        print_colored(f"⚠️ gradlew not found at {gradlew_path}", Colors.WARNING)
    
    # Step 6: Clean Android project
    print_colored("\n🧹 Step 6: Cleaning Android project...", Colors.HEADER)
    run_command(
        "./gradlew clean",
        cwd=android_dir,
        description="Cleaning Android project",
        fail_on_error=False
    )
    
    # Step 7: Build APK
    gradle_task = "assembleDebug" if build_type == "debug" else "assembleRelease"
    print_colored(f"\n🏗️ Step 7: Building {build_type.upper()} APK...", Colors.HEADER)
    
    if not run_command(
        f"./gradlew {gradle_task}",
        cwd=android_dir,
        description=f"Building {build_type} APK"
    ):
        print_colored(f"❌ Failed to build {build_type} APK", Colors.FAIL)
        sys.exit(1)
    
    # Step 8: Find and copy APK
    print_colored("\n📦 Step 8: Locating and organizing APK...", Colors.HEADER)
    
    if build_type == "debug":
        apk_path = android_dir / "app" / "build" / "outputs" / "apk" / "debug" / "app-debug.apk"
        output_name = "sperm-analyzer-ai-debug.apk"
    else:
        apk_path = android_dir / "app" / "build" / "outputs" / "apk" / "release" / "app-release-unsigned.apk"
        output_name = "sperm-analyzer-ai-release.apk"
    
    if apk_path.exists():
        # Determine output directory
        if output_dir:
            output_path = Path(output_dir) / output_name
            output_path.parent.mkdir(parents=True, exist_ok=True)
        else:
            output_path = workspace_dir / output_name
        
        if not run_command(
            f"cp '{apk_path}' '{output_path}'",
            description=f"Copying APK to {output_path}"
        ):
            print_colored("⚠️ Failed to copy APK, but build succeeded", Colors.WARNING)
        else:
            file_size = output_path.stat().st_size / 1024 / 1024
            print_colored(f"\n🎉 SUCCESS! APK built and copied to: {output_path}", Colors.GREEN)
            print_colored(f"📱 File size: {file_size:.1f} MB", Colors.GREEN)
            print_colored(f"🔧 Build type: {build_type.upper()}", Colors.GREEN)
            
            # Additional info
            print_colored(f"\n📋 Installation Instructions:", Colors.CYAN)
            print_colored(f"1. Transfer {output_name} to your Android device", Colors.BLUE)
            print_colored(f"2. Enable 'Install from Unknown Sources' in device settings", Colors.BLUE)
            print_colored(f"3. Tap the APK file to install", Colors.BLUE)
            print_colored(f"4. Grant necessary permissions when prompted", Colors.BLUE)
            
            return str(output_path)
    else:
        print_colored(f"❌ APK not found at expected location: {apk_path}", Colors.FAIL)
        print_colored("🔍 Searching for APK files...", Colors.WARNING)
        
        # Search for any APK files in the build directory
        build_dir = android_dir / "app" / "build"
        if build_dir.exists():
            apk_files = list(build_dir.rglob("*.apk"))
            if apk_files:
                print_colored("📱 Found APK files:", Colors.BLUE)
                for apk in apk_files:
                    size_mb = apk.stat().st_size / 1024 / 1024
                    print_colored(f"  - {apk} (Size: {size_mb:.1f} MB)", Colors.BLUE)
            else:
                print_colored("❌ No APK files found in build directory", Colors.FAIL)
        
        sys.exit(1)

def main():
    parser = argparse.ArgumentParser(description="Build APK for Sperm Analyzer AI")
    parser.add_argument(
        "--type", 
        choices=["debug", "release"], 
        default="debug",
        help="Build type (default: debug)"
    )
    parser.add_argument(
        "--output", 
        help="Output directory for APK file"
    )
    parser.add_argument(
        "--verbose", 
        action="store_true",
        help="Enable verbose output"
    )
    
    args = parser.parse_args()
    
    try:
        apk_path = build_apk(args.type, args.output)
        print_colored(f"\n✨ Build completed successfully!", Colors.GREEN)
        print_colored(f"📱 Your {args.type.upper()} APK is ready at: {apk_path}", Colors.GREEN)
        print_colored(f"🚀 You can now install it on your Android device!", Colors.GREEN)
        
    except KeyboardInterrupt:
        print_colored(f"\n⚠️ Build cancelled by user", Colors.WARNING)
        sys.exit(1)
    except Exception as e:
        print_colored(f"\n💥 Unexpected error: {str(e)}", Colors.FAIL)
        sys.exit(1)

if __name__ == "__main__":
    main()