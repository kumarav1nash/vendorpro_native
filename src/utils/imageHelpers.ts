import * as FileSystem from 'expo-file-system';
import * as ImagePicker from 'expo-image-picker';
import { Platform } from 'react-native';
import { ACCEPTED_IMAGE_TYPES, MAX_IMAGE_SIZE, ERROR_MESSAGES } from './constants';

/**
 * Interface for image picker result
 */
export interface ImagePickerResult {
  uri: string;
  name: string;
  type: string;
  size: number;
}

/**
 * Request camera and gallery permissions for image picking
 */
export async function requestImagePickerPermissions(): Promise<boolean> {
  if (Platform.OS !== 'web') {
    const { status: cameraStatus } = await ImagePicker.requestCameraPermissionsAsync();
    const { status: libraryStatus } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    
    if (cameraStatus !== 'granted' || libraryStatus !== 'granted') {
      console.warn('Camera or media library permissions not granted');
      return false;
    }
    
    return true;
  }
  
  return true; // Web doesn't need permissions
}

/**
 * Pick an image from the device camera
 */
export async function takePhoto(): Promise<ImagePickerResult | null> {
  const hasPermissions = await requestImagePickerPermissions();
  if (!hasPermissions) return null;
  
  const result = await ImagePicker.launchCameraAsync({
    mediaTypes: ImagePicker.MediaTypeOptions.Images,
    allowsEditing: true,
    aspect: [4, 3],
    quality: 0.8,
  });
  
  if (result.canceled || !result.assets || result.assets.length === 0) return null;
  
  const asset = result.assets[0];
  const fileInfo = await FileSystem.getInfoAsync(asset.uri);
  
  return {
    uri: asset.uri,
    name: asset.uri.split('/').pop() || `image_${Date.now()}.jpg`,
    type: asset.mimeType || 'image/jpeg',
    size: fileInfo.exists ? fileInfo.size : 0,
  };
}

/**
 * Pick an image from the device gallery
 */
export async function pickImage(): Promise<ImagePickerResult | null> {
  const hasPermissions = await requestImagePickerPermissions();
  if (!hasPermissions) return null;
  
  const result = await ImagePicker.launchImageLibraryAsync({
    mediaTypes: ImagePicker.MediaTypeOptions.Images,
    allowsEditing: true,
    aspect: [4, 3],
    quality: 0.8,
  });
  
  if (result.canceled || !result.assets || result.assets.length === 0) return null;
  
  const asset = result.assets[0];
  const fileInfo = await FileSystem.getInfoAsync(asset.uri);
  
  return {
    uri: asset.uri,
    name: asset.uri.split('/').pop() || `image_${Date.now()}.jpg`,
    type: asset.mimeType || 'image/jpeg',
    size: fileInfo.exists ? fileInfo.size : 0,
  };
}

/**
 * Validate an image file
 * @param file Image file to validate
 * @returns An object with validation result and error message if any
 */
export function validateImage(file: ImagePickerResult): { valid: boolean; error?: string } {
  // Check file size
  if (file.size > MAX_IMAGE_SIZE) {
    return { valid: false, error: ERROR_MESSAGES.FILE_TOO_LARGE };
  }
  
  // Check file type
  if (!ACCEPTED_IMAGE_TYPES.includes(file.type)) {
    return { valid: false, error: ERROR_MESSAGES.INVALID_FILE_TYPE };
  }
  
  return { valid: true };
}

/**
 * Convert image picker result to FormData for API upload
 */
export function createImageFormData(image: ImagePickerResult): FormData {
  const formData = new FormData();
  
  // @ts-ignore - FormData append expects a different type than TypeScript definition
  formData.append('file', {
    uri: Platform.OS === 'android' ? image.uri : image.uri.replace('file://', ''),
    name: image.name,
    type: image.type,
  });
  
  return formData;
} 