import { cloudinary, cloudinaryEnabled } from '../config/cloudinary';
import { ApiError } from '../utils/ApiError';

export async function uploadImage(buffer: Buffer, userId: string): Promise<{ url: string; publicId: string }> {
  if (!cloudinaryEnabled) throw ApiError.badRequest('Cloudinary is not configured on the server');
  return new Promise((resolve, reject) => {
    cloudinary.uploader
      .upload_stream(
        {
          folder: `trade-journal/${userId}`,
          resource_type: 'image',
          transformation: [{ width: 2000, crop: 'limit', quality: 'auto', fetch_format: 'auto' }],
        },
        (err, result) => (err || !result ? reject(err ?? new Error('Upload failed')) : resolve({ url: result.secure_url, publicId: result.public_id })),
      )
      .end(buffer);
  });
}

export async function destroyAssets(publicIds: string[]): Promise<void> {
  if (!cloudinaryEnabled || !publicIds.length) return;
  await Promise.allSettled(publicIds.map((id) => cloudinary.uploader.destroy(id)));
}
