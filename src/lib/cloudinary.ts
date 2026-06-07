import { v2 as cloudinary } from 'cloudinary';
import { writeFile, mkdir } from 'fs/promises';
import path from 'path';

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

function isCloudinaryConfigured(): boolean {
  const { CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, CLOUDINARY_API_SECRET } = process.env;
  return !!(
    CLOUDINARY_CLOUD_NAME &&
    CLOUDINARY_CLOUD_NAME !== 'your_cloud_name' &&
    CLOUDINARY_API_KEY &&
    CLOUDINARY_API_KEY !== 'your_api_key' &&
    CLOUDINARY_API_SECRET &&
    CLOUDINARY_API_SECRET !== 'your_api_secret'
  );
}

async function saveLocalAvatar(fileBuffer: Buffer, userId: string): Promise<string> {
  const dir = path.join(process.cwd(), 'public', 'uploads', 'avatars');
  await mkdir(dir, { recursive: true });
  await writeFile(path.join(dir, `${userId}.jpg`), fileBuffer);
  // Cache-bust so the browser shows the new image immediately
  return `/uploads/avatars/${userId}.jpg?t=${Date.now()}`;
}

export async function uploadAvatar(fileBuffer: Buffer, userId: string): Promise<string> {
  if (!isCloudinaryConfigured()) {
    return saveLocalAvatar(fileBuffer, userId);
  }

  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      {
        folder: 'skillforge/avatars',
        public_id: userId,
        overwrite: true,
        invalidate: true,
        transformation: [
          { width: 300, height: 300, crop: 'fill', gravity: 'face', quality: 'auto:good', fetch_format: 'auto' },
        ],
      },
      (error, result) => {
        if (error || !result) return reject(error);
        resolve(result.secure_url);
      },
    );
    stream.end(fileBuffer);
  });
}
