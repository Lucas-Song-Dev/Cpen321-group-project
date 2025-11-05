# RoomSync Deployment Guide

This guide will help you deploy the RoomSync application to Google Cloud Platform.

## Prerequisites

1. **Google Cloud CLI**: Install the [Google Cloud CLI](https://cloud.google.com/sdk/docs/install)
2. **Node.js**: Version 18 or higher
3. **Google Cloud Project**: Create a project in the [Google Cloud Console](https://console.cloud.google.com/)

## Project Structure

```
├── backend/           # Node.js/TypeScript backend
│   ├── Dockerfile     # Container configuration
│   ├── app.yaml       # App Engine configuration
│   └── .gcloudignore  # Files to exclude from deployment
├── frontend/          # Android application
└── deploy.sh          # Deployment script (Linux/Mac)
└── deploy.bat         # Deployment script (Windows)
```

## Backend Deployment (Google App Engine)

### 1. Setup Google Cloud

```bash
# Authenticate with Google Cloud
gcloud auth login

# Set your project ID (replace with your actual project ID)
gcloud config set project YOUR_PROJECT_ID

# Enable required APIs
gcloud services enable appengine.googleapis.com
gcloud services enable cloudbuild.googleapis.com
```

### 2. Configure Environment Variables

The following environment variables are configured in `backend/app.yaml`:

- `NODE_ENV`: production
- `PORT`: 8080
- `MONGODB_URI`: Your MongoDB connection string
- `GOOGLE_CLIENT_ID`: Your Google OAuth client ID
- `JWT_SECRET`: Your JWT secret key

### 3. Deploy Backend

#### Option A: Using the deployment script (Recommended)

**Windows:**
```cmd
deploy.bat
```

**Linux/Mac:**
```bash
./deploy.sh
```

#### Option B: Manual deployment

```bash
# Navigate to backend directory
cd backend

# Build the TypeScript application
npm run build

# Deploy to App Engine
gcloud app deploy app.yaml
```

### 4. Verify Deployment

After deployment, you can verify your backend is running:

```bash
# Get the service URL
gcloud app browse

# Test the health endpoint
curl https://YOUR_PROJECT_ID.appspot.com/api/health
```

## Frontend Deployment (Android)

### 1. Update API Configuration

Update your Android app's API base URL to point to your deployed backend:

```kotlin
// In your Android app's network configuration
const val BASE_URL = "https://YOUR_PROJECT_ID.appspot.com"
```

### 2. Build and Deploy Android App

```bash
# Navigate to frontend directory
cd frontend

# Build the Android app
./gradlew assembleRelease

# The APK will be generated in:
# frontend/app/build/outputs/apk/release/app-release.apk
```

### 3. Deploy to Google Play Store

1. Create a developer account on [Google Play Console](https://play.google.com/console/)
2. Upload your signed APK
3. Configure app store listing
4. Submit for review

## Monitoring and Maintenance

### View Logs

```bash
# View real-time logs
gcloud app logs tail -s default

# View logs from specific time
gcloud app logs read --service=default --version=VERSION_ID
```

### Monitor Performance

1. Visit [Google Cloud Console](https://console.cloud.google.com/)
2. Navigate to App Engine > Services
3. Monitor metrics, errors, and performance

### Update Deployment

To update your backend:

```bash
# Make your changes
# Then run the deployment script again
./deploy.sh  # or deploy.bat on Windows
```

## Troubleshooting

### Common Issues

1. **Build Failures**: Ensure all dependencies are installed (`npm install`)
2. **Deployment Errors**: Check that your Google Cloud project is properly configured
3. **Database Connection**: Verify your MongoDB URI is correct and accessible
4. **Authentication Issues**: Ensure your Google OAuth client ID is correct

### Useful Commands

```bash
# Check deployment status
gcloud app versions list

# View specific version details
gcloud app versions describe VERSION_ID

# Rollback to previous version
gcloud app versions migrate VERSION_ID

# Delete old versions
gcloud app versions delete VERSION_ID
```

## Security Considerations

1. **Environment Variables**: Never commit sensitive data to version control
2. **Database Security**: Use MongoDB Atlas with proper authentication
3. **API Security**: Implement rate limiting and input validation
4. **HTTPS**: App Engine automatically provides HTTPS

## Cost Optimization

1. **Instance Scaling**: Configure appropriate min/max instances in `app.yaml`
2. **Resource Limits**: Set appropriate CPU and memory limits
3. **Monitoring**: Use Cloud Monitoring to track usage and costs

## Support

For issues related to:
- **Google Cloud**: Check [Google Cloud Documentation](https://cloud.google.com/docs)
- **App Engine**: Check [App Engine Documentation](https://cloud.google.com/appengine/docs)
- **MongoDB**: Check [MongoDB Atlas Documentation](https://docs.atlas.mongodb.com/)
