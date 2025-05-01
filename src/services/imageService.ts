import apiClient from './api-client';
import { ImageResponse, ImageDeleteResponse, ImageUploadRequest } from '../types/image';

/**
 * Upload an image to the server
 * @param formData - FormData containing the image file with 'file' field
 */
export async function uploadImage(
  formData: FormData
): Promise<ImageResponse> {
  console.log('Sending image upload request to API');
  
  try {
    const res = await apiClient.post<ImageResponse>(
      'images/upload',
      formData,
      {
        headers: {
          'Content-Type': 'multipart/form-data',
          'Accept': '*/*'
        },
      }
    );
    
    console.log('Image upload response status:', res.status);
    
    // Validate that we have a URL in the response
    if (!res.data || !res.data.url) {
      console.error('Missing URL in image upload response:', res.data);
      throw new Error('Missing URL in image upload response');
    }
    
    return res.data;
  } catch (error: any) {
    console.error('Image upload error:', error.message);
    if (error.response) {
      console.error('Response data:', error.response.data);
      console.error('Response status:', error.response.status);
    }
    throw error;
  }
}

/**
 * Get images associated with a specific entity
 * @param entityId - ID of the entity
 * @param entityType - Type of entity
 */
export async function getAnImageByFilename(
  filename: string
): Promise<FormData> {
  const res = await apiClient.get<FormData>(`images/filename/${filename}`);
  return res.data;
}

/**
 * Get an image by its ID
 * @param imageId - ID of the image to fetch
 */
export async function getResizedImageByFilename(filename: string,params: {width: number, height: number,quality: number}): Promise<FormData> {
  const res = await apiClient.get<FormData>(`images/${filename}/resize`,{params});
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