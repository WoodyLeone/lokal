#!/bin/bash

# Lokal Backend Startup Script
echo "🚀 Starting Lokal Backend with Hybrid Detection..."

# Check if .env file exists
if [ ! -f .env ]; then
    echo "⚠️  No .env file found. Creating from example..."
    cp config.env.example .env
    echo "📝 Please edit .env file and add your OpenAI API key"
    echo "   export OPENAI_API_KEY=\"your-api-key-here\""
fi

# Check if OpenAI API key is set
if [ -z "$OPENAI_API_KEY" ]; then
    echo "⚠️  OpenAI API key not set. Running in YOLO-only mode."
    echo "   Set OPENAI_API_KEY for hybrid detection capabilities."
else
    echo "✅ OpenAI API key found. Hybrid detection enabled."
fi

# Check if ffmpeg is installed
if ! command -v ffmpeg &> /dev/null; then
    echo "⚠️  ffmpeg not found. Installing..."
    if command -v brew &> /dev/null; then
        brew install ffmpeg
    else
        echo "❌ Please install ffmpeg manually for video processing"
        exit 1
    fi
fi

# Check if Python dependencies are installed
echo "🔍 Checking Python dependencies..."
python3 -c "import ultralytics" 2>/dev/null || {
    echo "⚠️  YOLOv8 not found. Installing..."
    pip3 install ultralytics opencv-python
}

# Start the server
echo "🎯 Starting server..."
echo "📱 API will be available at http://localhost:3001/api"
echo "🏥 Health check at http://localhost:3001/api/health"
echo ""

node src/server.js 