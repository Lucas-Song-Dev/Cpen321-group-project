@echo off
REM Google Cloud Setup Script for RoomSync
REM This script helps you set up Google Cloud for deployment

echo 🚀 Setting up Google Cloud for RoomSync deployment...

REM Check if gcloud CLI is installed
where gcloud >nul 2>nul
if %ERRORLEVEL% NEQ 0 (
    echo ❌ Google Cloud CLI is not installed.
    echo.
    echo Please install it from: https://cloud.google.com/sdk/docs/install
    echo After installation, restart this script.
    pause
    exit /b 1
)

echo ✅ Google Cloud CLI is installed.

REM Authenticate with Google Cloud
echo.
echo 🔐 Authenticating with Google Cloud...
gcloud auth login

REM Get project ID from user
echo.
set /p PROJECT_ID="Enter your Google Cloud Project ID: "
if "%PROJECT_ID%"=="" (
    echo ❌ Project ID is required!
    pause
    exit /b 1
)

echo 📋 Setting project to: %PROJECT_ID%
gcloud config set project %PROJECT_ID%

REM Enable required APIs
echo.
echo 🔧 Enabling required Google Cloud APIs...
gcloud services enable appengine.googleapis.com
gcloud services enable cloudbuild.googleapis.com

REM Initialize App Engine
echo.
echo 🏗️ Initializing App Engine...
gcloud app create --region=us-central

echo.
echo ✅ Setup completed successfully!
echo.
echo 📝 Next steps:
echo 1. Run deploy.bat to deploy your backend
echo 2. Update your Android app's API URL to: https://%PROJECT_ID%.appspot.com
echo 3. Test your deployment at: https://%PROJECT_ID%.appspot.com/api/health
echo.
echo 🎉 You're ready to deploy!

pause
