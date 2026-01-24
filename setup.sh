#!/bin/bash

# iDrobe Development Environment Setup Script
# This script helps new developers set up the complete development environment

set -e  # Exit on any error

echo "🚀 Setting up iDrobe development environment..."

# Check prerequisites
echo "📋 Checking prerequisites..."

# Check Node.js version
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed. Please install Node.js >= 22.12.0"
    exit 1
fi

NODE_VERSION=$(node -v | cut -d'v' -f2)
REQUIRED_VERSION="22.12.0"

if ! npx semver -r ">=$REQUIRED_VERSION" "$NODE_VERSION" &> /dev/null; then
    echo "❌ Node.js version $NODE_VERSION is too old. Please install >= $REQUIRED_VERSION"
    exit 1
fi

echo "✅ Node.js version $NODE_VERSION is compatible"

# Check npm version
if ! command -v npm &> /dev/null; then
    echo "❌ npm is not installed"
    exit 1
fi

echo "✅ npm is available"

# Check Docker
if ! command -v docker &> /dev/null; then
    echo "❌ Docker is not installed. Please install Docker for Supabase local development"
    exit 1
fi

echo "✅ Docker is available"

# Check if Docker is running
if ! docker info &> /dev/null; then
    echo "❌ Docker is not running. Please start Docker"
    exit 1
fi

echo "✅ Docker is running"

# Install dependencies
echo "📦 Installing dependencies..."
npm install

# Check if .env file exists
if [ ! -f ".env" ]; then
    echo "⚙️ Creating .env file from template..."
    cp .env.example .env
    echo "📝 Please edit .env file with your API keys:"
    echo "   - GEMINI_API_KEY (required for AI features)"
    echo "   - OPENWEATHER_API_KEY (required for weather-based recommendations)"
    echo "   - Supabase keys (if using remote Supabase)"
    echo "   - Stripe keys (for subscription testing)"
else
    echo "✅ .env file already exists"
fi

# Start Supabase
echo "🗄️ Starting Supabase local development..."
npm run db:start

# Wait for Supabase to be ready
echo "⏳ Waiting for Supabase to be ready..."
sleep 10

# Apply migrations
echo "🔄 Applying database migrations..."
npm run db:reset

# Check if web/.env exists
if [ ! -f "web/.env" ]; then
    echo "⚙️ Creating web/.env file from template..."
    cp web/.env.example web/.env
fi

echo "🎉 Setup complete!"
echo ""
echo "📚 Next steps:"
echo "1. Edit .env files with your API keys"
echo "2. Run 'npm run dev' to start the development server"
echo "3. Visit http://localhost:5173 to see the application"
echo "4. Visit http://localhost:54323 for Supabase Studio"
echo ""
echo "📖 Documentation:"
echo "- COMPLETE_SYSTEM_HANDOFF.md - Full system overview"
echo "- CRITICAL_FIXES.md - Urgent fixes needed"
echo "- DEVELOPER_HANDOFF.md - Technical details"
echo ""
echo "🐛 If you encounter issues:"
echo "- Check Docker is running: docker info"
echo "- Restart Supabase: npm run db:stop && npm run db:start"
echo "- Check logs: npx supabase logs"
echo ""
echo "Happy coding! 🚀"