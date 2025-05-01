// File upload limits
export const MAX_IMAGE_SIZE = 5 * 1024 * 1024; // 5MB
export const ACCEPTED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp'];

// Common error messages
export const ERROR_MESSAGES = {
  NETWORK_ERROR: 'Network error. Please check your connection and try again.',
  UNAUTHORIZED: 'You are not authorized to perform this action.',
  FILE_TOO_LARGE: `File size exceeds the maximum limit of ${MAX_IMAGE_SIZE / (1024 * 1024)}MB.`,
  INVALID_FILE_TYPE: 'Invalid file type. Please upload an image file (JPEG, PNG, or WebP).',
  UPLOAD_FAILED: 'Failed to upload image. Please try again.',
}; 