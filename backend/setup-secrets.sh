#!/bin/bash
# Script to create secrets in Google Cloud Secret Manager for RoomSync backend

# Set your project ID
PROJECT_ID=${PROJECT_ID:-"your-project-id"}

echo "Setting up secrets for RoomSync backend in project: $PROJECT_ID"

# Set the project
gcloud config set project $PROJECT_ID

# Create MongoDB URI secret
echo "Creating MongoDB URI secret..."
echo -n "mongodb+srv://roomsync-user:roommate@roomsync.bijkxqe.mongodb.net/?retryWrites=true&w=majority&appName=RoomSync" | \
  gcloud secrets create mongodb-uri \
    --data-file=- \
    --replication-policy="automatic" \
    --project=$PROJECT_ID

# Create Google Client ID secret
echo "Creating Google Client ID secret..."
echo -n "445076519627-97j67dhhi8pqvkqsts8luanr6pttltbv.apps.googleusercontent.com" | \
  gcloud secrets create google-client-id \
    --data-file=- \
    --replication-policy="automatic" \
    --project=$PROJECT_ID

# Create JWT Secret
echo "Creating JWT Secret..."
echo -n "roomsync-super-secret-jwt-key-2024-make-it-very-long-and-secure" | \
  gcloud secrets create jwt-secret \
    --data-file=- \
    --replication-policy="automatic" \
    --project=$PROJECT_ID

# Grant Cloud Run service account access to secrets
echo "Granting Cloud Run service account access to secrets..."
PROJECT_NUMBER=$(gcloud projects describe $PROJECT_ID --format="value(projectNumber)")
SERVICE_ACCOUNT="${PROJECT_NUMBER}-compute@developer.gserviceaccount.com"

gcloud secrets add-iam-policy-binding mongodb-uri \
  --member="serviceAccount:${SERVICE_ACCOUNT}" \
  --role="roles/secretmanager.secretAccessor" \
  --project=$PROJECT_ID

gcloud secrets add-iam-policy-binding google-client-id \
  --member="serviceAccount:${SERVICE_ACCOUNT}" \
  --role="roles/secretmanager.secretAccessor" \
  --project=$PROJECT_ID

gcloud secrets add-iam-policy-binding jwt-secret \
  --member="serviceAccount:${SERVICE_ACCOUNT}" \
  --role="roles/secretmanager.secretAccessor" \
  --project=$PROJECT_ID

echo "✅ Secrets created and permissions granted!"
echo "You can now deploy using Cloud Build."

