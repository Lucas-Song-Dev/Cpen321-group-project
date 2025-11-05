#!/bin/bash

# RoomSync Deployment Script for Google Cloud
# This script deploys the backend to Google App Engine

set -e  # Exit on any error

echo "🚀 Starting RoomSync deployment to Google Cloud..."

# Check if gcloud CLI is installed
if ! command -v gcloud &> /dev/null; then
    echo "❌ Google Cloud CLI is not installed. Please install it first:"
    echo "   https://cloud.google.com/sdk/docs/install"
    exit 1
fi

# Check if user is authenticated
if ! gcloud auth list --filter=status:ACTIVE --format="value(account)" | grep -q .; then
    echo "❌ Not authenticated with Google Cloud. Please run:"
    echo "   gcloud auth login"
    exit 1
fi

# Set default project (you may need to change this)
PROJECT_ID="roomsync-cpen321"
echo "📋 Using project: $PROJECT_ID"

# Set the project
gcloud config set project $PROJECT_ID

# Navigate to backend directory
cd backend

echo "🔨 Building TypeScript application..."
npm run build

echo "📦 Deploying to Google App Engine..."
gcloud app deploy app.yaml --quiet

echo "✅ Deployment completed successfully!"
echo "🌐 Your app is available at: https://$PROJECT_ID.appspot.com"

# Get the service URL
SERVICE_URL=$(gcloud app browse --no-launch-browser)
echo "🔗 Service URL: $SERVICE_URL"

echo ""
echo "📝 Next steps:"
echo "1. Update your Android app's API base URL to: $SERVICE_URL"
echo "2. Test the deployment by visiting: $SERVICE_URL/api/health"
echo "3. Monitor logs with: gcloud app logs tail -s default"
