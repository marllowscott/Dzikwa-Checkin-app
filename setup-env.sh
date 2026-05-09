#!/bin/bash

# Setup script for Dzikwa Check-in App Environment
echo "🚀 Setting up Dzikwa Check-in App Environment..."

# Check if .env exists
if [ -f ".env" ]; then
    echo "⚠️  .env file already exists"
    echo "📝 Current .env contents:"
    cat .env
    echo ""
    echo "❌ Do you want to overwrite it? (y/N)"
    read -r response
    if [[ ! $response =~ ^[Yy]$ ]]; then
        echo "👍 Keeping existing .env file"
        exit 0
    fi
fi

# Copy from .env.example if it exists
if [ -f ".env.example" ]; then
    cp .env.example .env
    echo "✅ Copied .env.example to .env"
else
    # Create basic .env file
    cat > .env << EOF
# Supabase Configuration
VITE_SUPABASE_URL=https://your-project-id.supabase.co
VITE_SUPABASE_ANON_KEY=your-supabase-anon-key
VITE_SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
EOF
    echo "✅ Created new .env file"
fi

echo ""
echo "🎯 NEXT STEPS:"
echo "1. Go to: https://supabase.com/dashboard"
echo "2. Select your project (or create one)"
echo "3. Go to Settings → API"
echo "4. Copy the URL and keys to your .env file"
echo "5. Restart your dev server: npm run dev"
echo ""
echo "📝 Edit your .env file now:"
echo "   nano .env  # or use your preferred editor"

# Check if they want to edit now
echo ""
echo "❓ Want to edit .env file now? (y/N)"
read -r edit_now
if [[ $edit_now =~ ^[Yy]$ ]]; then
    ${EDITOR:-nano} .env
fi

echo "🎉 Setup complete!"
