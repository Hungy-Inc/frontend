#!/bin/bash

echo "🚀 Starting Vercel Deployment..."

# Check if vercel is installed
if ! command -v vercel &> /dev/null; then
    echo "❌ Vercel CLI not found. Installing..."
    npm install -g vercel
fi

# Check if user is logged in
if ! vercel whoami &> /dev/null; then
    echo "🔐 Please login to Vercel..."
    vercel login
fi

# Set environment variables
echo "🔧 Setting environment variables..."
vercel env add NEXT_PUBLIC_API_URL production <<< "https://backend-1-7yki.onrender.com"

# Deploy to production
echo "📦 Deploying to production..."
vercel --prod --yes

echo "✅ Deployment completed!"
echo "🌐 Your app should be available at the URL shown above" 