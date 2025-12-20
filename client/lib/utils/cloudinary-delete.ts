import cloudinary from '../cloudinary';

/**
 * Extract the public ID from a Cloudinary URL
 * Example: https://res.cloudinary.com/djvqpzwgi/image/upload/v1234567890/zoro/abc123.jpg
 * Returns: zoro/abc123
 */
export function extractPublicId(url: string): string | null {
  try {
    const matches = url.match(/\/upload\/(?:v\d+\/)?(.+)\.[^.]+$/);
    return matches ? matches[1] : null;
  } catch {
    return null;
  }
}

/**
 * Delete a file from Cloudinary
 */
export async function deleteFromCloudinary(
  url: string,
  resourceType: 'image' | 'video' = 'image'
): Promise<boolean> {
  try {
    const publicId = extractPublicId(url);
    if (!publicId) {
      console.error('Could not extract public ID from URL:', url);
      return false;
    }

    const result = await cloudinary.uploader.destroy(publicId, {
      resource_type: resourceType,
    });

    return result.result === 'ok';
  } catch (error) {
    console.error('Error deleting from Cloudinary:', error);
    return false;
  }
}

/**
 * Delete both image and video from Cloudinary
 */
export async function deleteItemAssets(
  imageURL?: string | null,
  videoURL?: string | null
): Promise<void> {
  const deletePromises: Promise<boolean>[] = [];

  if (imageURL && imageURL.includes('cloudinary.com')) {
    deletePromises.push(deleteFromCloudinary(imageURL, 'image'));
  }

  if (videoURL && videoURL.includes('cloudinary.com')) {
    deletePromises.push(deleteFromCloudinary(videoURL, 'video'));
  }

  if (deletePromises.length > 0) {
    await Promise.all(deletePromises);
  }
}
