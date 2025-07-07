#!/bin/bash

echo "🧬 Starting Sperm Analyzer AI - Complete Application"
echo "=================================================="

# Check if Python is installed
if ! command -v python3 &> /dev/null; then
    echo "❌ Python 3 is required but not installed."
    echo "Please install Python 3.8+ and try again."
    exit 1
fi

# Check if the startup script exists
if [ ! -f "start_complete_app.py" ]; then
    echo "❌ start_complete_app.py not found!"
    echo "Please make sure you're in the correct directory."
    exit 1
fi

# Make the script executable
chmod +x start_complete_app.py

# Run the application
echo "🚀 Launching application..."
python3 start_complete_app.py

echo ""
echo "👋 Thank you for using Sperm Analyzer AI!"