import apiClient from './api-client';
import { ImageResponse, ImageDeleteResponse, ImageUploadRequest } from '../types/image';

/**
 * Upload an image to the server
 * @param file - FormData containing the image file
 * @param entityId - Optional ID of the entity this image is associated with
 * @param entityType - Optional type of entity (e.g., 'product', 'user')
 */
export async function uploadImage(
  imageUploadRequest: ImageUploadRequest
): Promise<ImageResponse> {
  // In a FormData object, the file should already be properly formatted
  const res = await apiClient.post<ImageResponse>(
    'images/upload',
    imageUploadRequest,
    {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    }
  );
  return res.data;
}

/**
 * Get images associated with a specific entity
 * @param entityId - ID of the entity
 * @param entityType - Type of entity
 */
export async function getAnImageByFilename(
  filename: string
): Promise<ImageResponse> {
  const res = await apiClient.get<ImageResponse>(`images/filename/${filename}`);
  return res.data;
}

/**
 * Get an image by its ID
 * @param imageId - ID of the image to fetch
 */
export async function getResizedImageByFilename(filename: string,params: {width: number, height: number,quality: number}): Promise<ImageResponse> {
  const res = await apiClient.get<ImageResponse>(`images/${filename}/resize`,{params});
  return res.data;
}

/**
 * Delete an image by its ID
 * @param imageId - ID of the image to delete
 */
export async function deleteImage(imageId: string): Promise<ImageDeleteResponse> {
  const res = await apiClient.delete<ImageDeleteResponse>(`images/${imageId}`);
  return res.data;
}

/**
 * Get all images
 */
export async function getAllImages(): Promise<ImageResponse[]> {
  const res = await apiClient.get<ImageResponse[]>('images');
  return res.data;
} 