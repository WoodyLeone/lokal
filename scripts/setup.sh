#!/bin/bash

echo "🚀 Setting up Lokal React Native App"
echo "====================================="

# Check if .env file exists
if [ ! -f .env ]; then
    echo "📝 Creating .env file..."
    cat > .env << EOF
# Supabase Configuration
EXPO_PUBLIC_SUPABASE_URL=your_supabase_project_url
EXPO_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key

# Backend API Configuration (optional - for object detection)
EXPO_PUBLIC_API_BASE_URL=http://localhost:3001/api

# App Configuration
EXPO_PUBLIC_APP_NAME=Lokal
EXPO_PUBLIC_APP_VERSION=1.0.0
EOF
    echo "✅ .env file created!"
    echo "⚠️  Please update the .env file with your Supabase credentials"
else
    echo "✅ .env file already exists"
fi

# Install dependencies
echo "📦 Installing dependencies..."
npm install

echo "🎉 Setup complete!"
echo ""
echo "Next steps:"
echo "1. Update .env file with your Supabase credentials"
echo "2. Run 'npm start' to start the development server"
echo "3. Follow the Supabase setup guide in README.md" 