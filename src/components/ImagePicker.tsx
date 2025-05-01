import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { Image } from 'expo-image';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useImages } from '../contexts/ImageContext';
import { ImageResponse } from '../types/image';

interface ImagePickerProps {
  description?: string;
  onImageSelected?: (response: ImageResponse) => void;
  imageUrl?: string;
  placeholder?: string;
  width?: number;
  height?: number;
  borderRadius?: number;
}

export function ImagePicker({
  description,
  onImageSelected,
  imageUrl,
  placeholder = 'Select Image',
  width = 120,
  height = 120,
  borderRadius = 8,
}: ImagePickerProps) {
  const {
    isLoading,
    uploadError,
    uploadImageWithPicker,
    captureAndUploadImage,
    clearError
  } = useImages();

  async function handleOpenCamera() {
    const response = await captureAndUploadImage(description);
    if (response && onImageSelected) {
      onImageSelected(response);
    }
  }

  async function handleOpenGallery() {
    const response = await uploadImageWithPicker(description);
    if (response && onImageSelected) {
      onImageSelected(response);
    }
  }

  const containerStyle = {
    width,
    height,
    borderRadius,
  };

  return (
    <View style={[styles.container, containerStyle]}>
      {imageUrl ? (
        <Image
          source={{ uri: imageUrl }}
          style={[styles.image, { borderRadius }]}
          contentFit="cover"
        />
      ) : (
        <View style={[styles.placeholder, { borderRadius }]}>
          <MaterialCommunityIcons
            name="image-outline"
            size={24}
            color="#9CA3AF"
          />
          <Text style={styles.placeholderText}>{placeholder}</Text>
        </View>
      )}

      {isLoading && (
        <View style={[styles.overlay, { borderRadius }]}>
          <ActivityIndicator size="large" color="#FFFFFF" />
        </View>
      )}

      {uploadError && (
        <View style={[styles.errorOverlay, { borderRadius }]}>
          <MaterialCommunityIcons
            name="alert-circle"
            size={24}
            color="#FFFFFF"
          />
          <Text style={styles.errorText}>{uploadError}</Text>
          <TouchableOpacity
            style={styles.retryButton}
            onPress={clearError}
          >
            <Text style={styles.retryButtonText}>Retry</Text>
          </TouchableOpacity>
        </View>
      )}

      <View style={styles.actionButtons}>
        <TouchableOpacity
          style={styles.actionButton}
          onPress={handleOpenCamera}
          disabled={isLoading}
        >
          <MaterialCommunityIcons name="camera" size={20} color="#FFFFFF" />
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.actionButton}
          onPress={handleOpenGallery}
          disabled={isLoading}
        >
          <MaterialCommunityIcons name="image" size={20} color="#FFFFFF" />
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'relative',
    overflow: 'hidden',
  },
  image: {
    width: '100%',
    height: '100%',
  },
  placeholder: {
    width: '100%',
    height: '100%',
    backgroundColor: '#F1F5F9',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderStyle: 'dashed',
  },
  placeholderText: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 4,
    textAlign: 'center',
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(220, 38, 38, 0.8)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 8,
  },
  errorText: {
    color: '#FFFFFF',
    fontSize: 10,
    textAlign: 'center',
    marginTop: 4,
    marginBottom: 8,
  },
  retryButton: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 4,
  },
  retryButtonText: {
    color: '#DC2626',
    fontSize: 12,
    fontWeight: '600',
  },
  actionButtons: {
    position: 'absolute',
    bottom: 8,
    right: 8,
    flexDirection: 'row',
  },
  actionButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(0, 123, 255, 0.8)',
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 8,
  },
}); 