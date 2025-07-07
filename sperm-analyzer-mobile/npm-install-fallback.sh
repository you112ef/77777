#!/bin/bash

# 🔧 NPM Install Fallback Script
# Used when npm ci fails in GitHub Actions

echo "🚨 NPM CI Fallback Script Starting..."
echo "📍 Current directory: $(pwd)"
echo "📦 Node version: $(node --version)"
echo "📦 NPM version: $(npm --version)"

# Create .npmrc if missing
if [ ! -f .npmrc ]; then
  echo "📝 Creating .npmrc..."
  cat > .npmrc << EOF
legacy-peer-deps=true
auto-install-peers=true
fund=false
audit=false
EOF
fi

echo "📋 Current package.json dependencies:"
cat package.json | grep -A 30 '"dependencies"' | head -40

# Clean slate approach
echo "🧹 Cleaning node_modules and package-lock.json..."
rm -rf node_modules package-lock.json

# Install with legacy peer deps
echo "📦 Running npm install with legacy-peer-deps..."
npm install --legacy-peer-deps --no-optional --no-audit

# Verify installation
echo "🔍 Verifying installation..."
if [ -f package-lock.json ]; then
  echo "✅ package-lock.json created successfully"
  echo "📊 Size: $(wc -l < package-lock.json) lines"
else
  echo "❌ package-lock.json was not created"
  exit 1
fi

# Test npm ci
echo "🧪 Testing npm ci..."
npm ci && echo "✅ npm ci now works!" || echo "❌ npm ci still fails"

echo "🎉 Fallback script completed!"