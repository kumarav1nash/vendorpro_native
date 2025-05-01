import React, { createContext, useContext, useState, useMemo, ReactNode } from 'react';
import { 
  uploadImage, 
  getAnImageByFilename, 
  getResizedImageByFilename,
  getAllImages,
  deleteImage
} from '../services/imageService';
import { 
  ImageResponse, 
  ImageDeleteResponse,
  ImageUploadRequest
} from '../types/image';
import { 
  validateImage, 
  pickImage, 
  takePhoto, 
  createImageFormData, 
  ImagePickerResult 
} from '../utils/imageHelpers';
import { Platform } from 'react-native';

interface ImageContextProps {
  isLoading: boolean;
  error: string | null;
  uploadError: string | null;
  entityImages: Record<string, ImageResponse[]>;
  images: ImageResponse[];
  currentImage: FormData | null;
  
  // Image selection and upload operations
  pickImageFromGallery: () => Promise<ImagePickerResult | null>;
  captureImageFromCamera: () => Promise<ImagePickerResult | null>;
  uploadImageWithPicker: (description?: string) => Promise<ImageResponse | null>;
  captureAndUploadImage: (description?: string) => Promise<ImageResponse | null>;
  uploadImageForEntity: (image: ImagePickerResult, description?: string) => Promise<ImageResponse>;
  
  // Image management
  fetchAnImageByFilename: (filename: string) => Promise<void>;
  fetchAllImages: () => Promise<void>;
  fetchResizedImageByFilename: (filename: string, params: {width: number, height: number, quality: number}) => Promise<void>;
  removeImage: (imageId: string) => Promise<boolean>;
  
  // State management
  clearError: () => void;
}

const ImageContext = createContext<ImageContextProps | undefined>(undefined);

export function useImages(): ImageContextProps {
  const context = useContext(ImageContext);
  if (context === undefined) {
    throw new Error('useImages must be used within an ImageProvider');
  }
  return context;
}

export function ImageProvider({ children }: { children: ReactNode }) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [entityImages, setEntityImages] = useState<Record<string, ImageResponse[]>>({});
  const [images, setImages] = useState<ImageResponse[]>([]);
  const [currentImage, setCurrentImage] = useState<FormData | null>(null);

  // Helper to generate entity key
  function getEntityKey(entityId: string, entityType: string) {
    return `${entityType}_${entityId}`;
  }

  // Image selection
  const pickImageFromGallery = async () => {
    try {
      const result = await pickImage();
      return result;
    } catch (err: any) {
      setError(err.message || 'Failed to pick image from gallery');
      return null;
    }
  };

  const captureImageFromCamera = async () => {
    try {
      const result = await takePhoto();
      return result;
    } catch (err: any) {
      setError(err.message || 'Failed to capture image from camera');
      return null;
    }
  };

  // Image upload
  const uploadImageForEntity = async (
    image: ImagePickerResult,
    description?: string
  ): Promise<ImageResponse> => {
    setIsLoading(true);
    setError(null);
    setUploadError(null);
    
    try {
      // Validate image
      const validation = validateImage(image);
      if (!validation.valid) {
        const errorMsg = validation.error || 'Invalid image';
        setUploadError(errorMsg);
        setError(errorMsg);
        throw new Error(errorMsg);
      }
      
      // Create a simple FormData object
      const formData = new FormData();
      
      // Add the file with just the 'file' field name as expected by the API
      formData.append('file', {
        uri: Platform.OS === 'android' ? image.uri : image.uri.replace('file://', ''),
        name: image.name,
        type: image.type,
      } as any);
      
      console.log('Uploading image with URI:', image.uri);
      
      // Upload image directly using fetch to match the curl command exactly
      const uploadedImage = await uploadImage(formData);
      
      // Log the complete response structure
      console.log('Upload successful, complete response:', JSON.stringify(uploadedImage, null, 2));
      
      // Verify we have a URL in the response
      if (!uploadedImage || !uploadedImage.url) {
        console.error('Error: Upload response missing URL property', uploadedImage);
        setError('Upload response missing URL property');
        throw new Error('Upload response missing URL property');
      }
      
      // Update local state
      setImages(prev => [...prev, uploadedImage]);
      
      return uploadedImage;
    } catch (err: any) {
      const errorMsg = err.message || 'Failed to upload image';
      console.error('Upload error:', errorMsg);
      setUploadError(errorMsg);
      setError(errorMsg);
      throw new Error(errorMsg);
    } finally {
      setIsLoading(false);
    }
  };

  // Convenience methods that combine selection and upload
  const uploadImageWithPicker = async (description?: string): Promise<ImageResponse | null> => {
    try {
      const image = await pickImageFromGallery();
      if (!image) return null;
      
      return await uploadImageForEntity(image, description);
    } catch (err: any) {
      const errorMsg = err.message || 'Failed to pick and upload image';
      setUploadError(errorMsg);
      setError(errorMsg);
      return null;
    }
  };

  const captureAndUploadImage = async (description?: string): Promise<ImageResponse | null> => {
    try {
      const image = await captureImageFromCamera();
      if (!image) return null;
      
      return await uploadImageForEntity(image, description);
    } catch (err: any) {
      const errorMsg = err.message || 'Failed to capture and upload image';
      setUploadError(errorMsg);
      setError(errorMsg);
      return null;
    }
  };

  // Fetch a single image by filename
  const fetchAnImageByFilename = async (filename: string): Promise<void> => {
    setIsLoading(true);
    setError(null);
    
    try {
      const image = await getAnImageByFilename(filename);
      setCurrentImage(image);
    } catch (err: any) {
      setError(err.message || 'Failed to fetch image');
    } finally {
      setIsLoading(false);
    }
  };

  // Fetch all images
  const fetchAllImages = async (): Promise<void> => {
    setIsLoading(true);
    setError(null);
    
    try {
      const allImages = await getAllImages();
      setImages(allImages);
    } catch (err: any) {
      setError(err.message || 'Failed to fetch all images');
    } finally {
      setIsLoading(false);
    }
  };

  // Fetch resized image by filename
  const fetchResizedImageByFilename = async (
    filename: string, 
    params: {width: number, height: number, quality: number}
  ): Promise<void> => {
    setIsLoading(true);
    setError(null);
    
    try {
      const resizedImage = await getResizedImageByFilename(filename, params);
      setCurrentImage(resizedImage);
    } catch (err: any) {
      setError(err.message || 'Failed to fetch resized image');
    } finally {
      setIsLoading(false);
    }
  };

  // Delete image
  const removeImage = async (imageId: string): Promise<boolean> => {
    setIsLoading(true);
    setError(null);
    
    try {
      const result = await deleteImage(imageId);
      
      if (result.success) {
        // Update images state
        setImages(prev => prev.filter(img => img.id !== imageId));
        
        return true;
      }
      
      return false;
    } catch (err: any) {
      setError(err.message || 'Failed to delete image');
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  // Clear error
  const clearError = () => {
    setError(null);
    setUploadError(null);
  };

  const value = useMemo(() => ({
    isLoading,
    error,
    uploadError,
    entityImages,
    images,
    currentImage,
    pickImageFromGallery,
    captureImageFromCamera,
    uploadImageWithPicker,
    captureAndUploadImage,
    uploadImageForEntity,
    fetchAnImageByFilename,
    fetchAllImages,
    fetchResizedImageByFilename,
    removeImage,
    clearError,
  }), [isLoading, error, uploadError, entityImages, images, currentImage]);

  return (
    <ImageContext.Provider value={value}>
      {children}
    </ImageContext.Provider>
  );
} 