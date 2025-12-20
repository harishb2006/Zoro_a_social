import cloudinary from '../cloudinary';

export function validateFileType(file: File): boolean {
  const allowedTypes = /jpeg|jpg|png|gif|mp4|mov|avi|webm/;
  const mimeType = file.type.toLowerCase();

  return (
    mimeType.startsWith('image/') || mimeType.startsWith('video/')
  );
}

export async function uploadToCloudinary(
  file: File,
  resourceType: 'image' | 'video'
): Promise<string> {
  const bytes = await file.arrayBuffer();
  const buffer = Buffer.from(bytes);

  return new Promise((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(
      {
        resource_type: resourceType,
        folder: 'zoro',
        transformation: resourceType === 'image' 
          ? [{ width: 1000, height: 1000, crop: 'limit', quality: 'auto' }]
          : [{ width: 1920, height: 1080, crop: 'limit', quality: 'auto' }],
      },
      (error, result) => {
        if (error) {
          reject(error);
        } else {
          resolve(result?.secure_url || '');
        }
      }
    );

    uploadStream.end(buffer);
  });
}

export async function handleFileUploads(
  formData: FormData
): Promise<{ image: string | null; video: string | null }> {
  const imageFile = formData.get('image') as File | null;
  const videoFile = formData.get('video') as File | null;
  const profilePicFile = formData.get('profilePic') as File | null;

  let imageURL = null;
  let videoURL = null;

  // Handle profile picture
  if (profilePicFile && profilePicFile.size > 0) {
    if (!validateFileType(profilePicFile)) {
      throw new Error('Invalid profile picture file type');
    }
    imageURL = await uploadToCloudinary(profilePicFile, 'image');
  }

  // Handle regular image
  if (imageFile && imageFile.size > 0) {
    if (!validateFileType(imageFile)) {
      throw new Error('Invalid image file type');
    }
    imageURL = await uploadToCloudinary(imageFile, 'image');
  }

  if (videoFile && videoFile.size > 0) {
    if (!validateFileType(videoFile)) {
      throw new Error('Invalid video file type');
    }
    videoURL = await uploadToCloudinary(videoFile, 'video');
  }

  return { image: imageURL, video: videoURL };
}
