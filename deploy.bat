@echo off
REM RoomSync Deployment Script for Google Cloud (Windows)
REM This script deploys the backend to Google App Engine

echo 🚀 Starting RoomSync deployment to Google Cloud...

REM Check if gcloud CLI is installed
where gcloud >nul 2>nul
if %ERRORLEVEL% NEQ 0 (
    echo ❌ Google Cloud CLI is not installed. Please install it first:
    echo    https://cloud.google.com/sdk/docs/install
    pause
    exit /b 1
)

REM Check if user is authenticated
gcloud auth list --filter=status:ACTIVE --format="value(account)" | findstr /C:"." >nul
if %ERRORLEVEL% NEQ 0 (
    echo ❌ Not authenticated with Google Cloud. Please run:
    echo    gcloud auth login
    pause
    exit /b 1
)

REM Set default project (you may need to change this)
set PROJECT_ID=roomsync-474705
echo 📋 Using project: %PROJECT_ID%

REM Set the project
gcloud config set project %PROJECT_ID%

REM Navigate to backend directory
cd backend

echo 🔨 Building TypeScript application...
call npm run build
if %ERRORLEVEL% NEQ 0 (
    echo ❌ Build failed!
    pause
    exit /b 1
)

echo 📦 Deploying to Google App Engine...
gcloud app deploy app.yaml --quiet
if %ERRORLEVEL% NEQ 0 (
    echo ❌ Deployment failed!
    pause
    exit /b 1
)

echo ✅ Deployment completed successfully!

REM Get the service URL
for /f "tokens=*" %%i in ('gcloud app browse --no-launch-browser') do set SERVICE_URL=%%i
echo 🌐 Your app is available at: %SERVICE_URL%

echo.
echo 📝 Next steps:
echo 1. Update your Android app's API base URL to: %SERVICE_URL%
echo 2. Test the deployment by visiting: %SERVICE_URL%/api/health
echo 3. Monitor logs with: gcloud app logs tail -s default

pause
