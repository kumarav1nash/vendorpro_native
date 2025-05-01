export interface ImageResponse {
  id: string;
  url: string;
  originalFilename: string;
  filename: string;
  mimetype: string;
  size: number;
  description?: string;
  createdAt: string;
  updatedAt: string;
}
export interface ImageUploadRequest {
  file: FormData;
  description?: string;
}

export interface ImageDeleteResponse {
  success: boolean;
  message: string;
} 