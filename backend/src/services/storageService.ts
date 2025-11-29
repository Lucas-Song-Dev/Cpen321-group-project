import { Storage } from '@google-cloud/storage';
import { randomUUID } from 'crypto';
import { config } from '../config';

const storage = new Storage();

/**
 * Uploads a base64 image (data URI) to Google Cloud Storage and returns the public URL.
 */
export const uploadProfilePicture = async (
  dataUri: string,
  userId: string
): Promise<string> => {
  if (!config.GCS_BUCKET_NAME) {
    throw new Error('GCS bucket name is not configured');
  }

  const matches = dataUri.match(/^data:(image\/[a-zA-Z0-9.+-]+);base64,(.+)$/);
  if (!matches) {
    throw new Error('Invalid image data URI');
  }

  const mimeType = matches[1];
  const base64Data = matches[2];
  const buffer = Buffer.from(base64Data, 'base64');
  const extension = mimeType.split('/')[1] ?? 'jpg';
  const filename = `profile-pictures/${userId}/${randomUUID()}.${extension}`;

  const bucket = storage.bucket(config.GCS_BUCKET_NAME);
  const file = bucket.file(filename);

  await file.save(buffer, {
    metadata: {
      contentType: mimeType,
      cacheControl: 'public, max-age=31536000'
    },
    resumable: false
  });

  await file.makePublic();

  const publicUrl = `https://storage.googleapis.com/${bucket.name}/${filename}`;
  return publicUrl;
};

