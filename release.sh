#!/bin/bash

# 🚀 Release Script for Sperm Analyzer AI Android App
# This script helps create new releases with proper versioning

set -e  # Exit on any error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[0;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

print_colored() {
    local color=$1
    local message=$2
    echo -e "${color}${message}${NC}"
}

print_header() {
    echo ""
    print_colored $PURPLE "🔬 =================================="
    print_colored $PURPLE "   Sperm Analyzer AI Release Tool"
    print_colored $PURPLE "=================================="
    echo ""
}

show_usage() {
    echo "Usage: $0 [OPTIONS]"
    echo ""
    echo "Options:"
    echo "  -v, --version VERSION    Set version (e.g., 1.0.0)"
    echo "  -t, --type TYPE         Release type: patch, minor, major"
    echo "  -d, --dry-run           Show what would be done without executing"
    echo "  -h, --help              Show this help message"
    echo ""
    echo "Examples:"
    echo "  $0 -v 1.2.0             # Create version 1.2.0"
    echo "  $0 -t patch             # Increment patch version"
    echo "  $0 -d -v 1.2.0          # Dry run for version 1.2.0"
}

get_current_version() {
    if [ -f "sperm-analyzer-mobile/package.json" ]; then
        grep '"version"' sperm-analyzer-mobile/package.json | sed 's/.*"version": "\([^"]*\)".*/\1/'
    else
        echo "0.0.0"
    fi
}

increment_version() {
    local version=$1
    local type=$2
    
    local major=$(echo $version | cut -d. -f1)
    local minor=$(echo $version | cut -d. -f2)
    local patch=$(echo $version | cut -d. -f3)
    
    case $type in
        "major")
            major=$((major + 1))
            minor=0
            patch=0
            ;;
        "minor")
            minor=$((minor + 1))
            patch=0
            ;;
        "patch")
            patch=$((patch + 1))
            ;;
        *)
            print_colored $RED "❌ Invalid increment type: $type"
            exit 1
            ;;
    esac
    
    echo "$major.$minor.$patch"
}

update_version() {
    local new_version=$1
    local dry_run=$2
    
    print_colored $CYAN "📝 Updating version to $new_version..."
    
    if [ "$dry_run" != "true" ]; then
        # Update package.json version
        sed -i "s/\"version\": \"[^\"]*\"/\"version\": \"$new_version\"/" sperm-analyzer-mobile/package.json
        print_colored $GREEN "✅ Updated package.json"
        
        # Update Android version (optional, if you have version in gradle)
        # This would update the version in android/app/build.gradle
        # You can uncomment and modify this if needed
        # sed -i "s/versionName \"[^\"]*\"/versionName \"$new_version\"/" sperm-analyzer-mobile/android/app/build.gradle
    else
        print_colored $YELLOW "🔍 [DRY RUN] Would update package.json version to $new_version"
    fi
}

build_apk() {
    local dry_run=$1
    
    print_colored $CYAN "🏗️ Building APK..."
    
    if [ "$dry_run" != "true" ]; then
        python3 build_apk.py --type release
    else
        print_colored $YELLOW "🔍 [DRY RUN] Would build release APK"
    fi
}

create_git_tag() {
    local version=$1
    local dry_run=$2
    
    local tag="v$version"
    
    print_colored $CYAN "🏷️ Creating Git tag: $tag..."
    
    if [ "$dry_run" != "true" ]; then
        # Check if tag already exists
        if git tag -l | grep -q "^$tag$"; then
            print_colored $RED "❌ Tag $tag already exists!"
            exit 1
        fi
        
        # Stage changes
        git add sperm-analyzer-mobile/package.json
        
        # Commit version bump
        git commit -m "🔖 Release version $version" || true
        
        # Create and push tag
        git tag -a "$tag" -m "Release version $version"
        git push origin main
        git push origin "$tag"
        
        print_colored $GREEN "✅ Created and pushed tag: $tag"
    else
        print_colored $YELLOW "🔍 [DRY RUN] Would create and push tag: $tag"
    fi
}

main() {
    print_header
    
    local version=""
    local increment_type=""
    local dry_run="false"
    
    # Parse command line arguments
    while [[ $# -gt 0 ]]; do
        case $1 in
            -v|--version)
                version="$2"
                shift 2
                ;;
            -t|--type)
                increment_type="$2"
                shift 2
                ;;
            -d|--dry-run)
                dry_run="true"
                shift
                ;;
            -h|--help)
                show_usage
                exit 0
                ;;
            *)
                print_colored $RED "❌ Unknown option: $1"
                show_usage
                exit 1
                ;;
        esac
    done
    
    # Get current version
    local current_version=$(get_current_version)
    print_colored $BLUE "📋 Current version: $current_version"
    
    # Determine new version
    local new_version=""
    if [ -n "$version" ]; then
        new_version="$version"
    elif [ -n "$increment_type" ]; then
        new_version=$(increment_version "$current_version" "$increment_type")
    else
        print_colored $RED "❌ Please specify either --version or --type"
        show_usage
        exit 1
    fi
    
    print_colored $GREEN "🎯 Target version: $new_version"
    
    if [ "$dry_run" = "true" ]; then
        print_colored $YELLOW "🔍 DRY RUN MODE - No changes will be made"
    fi
    
    # Confirm release
    if [ "$dry_run" != "true" ]; then
        echo ""
        print_colored $CYAN "Are you sure you want to create release $new_version? (y/N)"
        read -r response
        if [[ ! "$response" =~ ^[Yy]$ ]]; then
            print_colored $YELLOW "❌ Release cancelled"
            exit 0
        fi
    fi
    
    echo ""
    print_colored $PURPLE "🚀 Starting release process..."
    
    # Update version
    update_version "$new_version" "$dry_run"
    
    # Build APK
    build_apk "$dry_run"
    
    # Create Git tag (this will trigger GitHub Actions)
    create_git_tag "$new_version" "$dry_run"
    
    echo ""
    print_colored $GREEN "🎉 Release process completed!"
    
    if [ "$dry_run" != "true" ]; then
        print_colored $CYAN "📱 GitHub Actions will build and publish the APK automatically"
        print_colored $CYAN "🔗 Check the release at: https://github.com/your-username/sperm-analyzer-ai/releases"
    fi
    
    echo ""
}

# Run main function with all arguments
main "$@"