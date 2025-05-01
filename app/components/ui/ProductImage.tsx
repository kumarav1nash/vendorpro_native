import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ActivityIndicator } from 'react-native';
import { Image } from 'expo-image';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useImages } from '../../../src/contexts/ImageContext';

interface ProductImageProps {
  filename?: string;
  fallbackUrl?: string;
  width?: number;
  height?: number;
  borderRadius?: number;
  resizeMode?: 'cover' | 'contain' | 'stretch' | 'center';
  quality?: number;
  showPlaceholder?: boolean;
  placeholderIconName?: string;
  placeholderIconSize?: number;
  placeholderIconColor?: string;
}

export function ProductImage({
  filename,
  fallbackUrl,
  width = 100,
  height = 100,
  borderRadius = 8,
  resizeMode = 'cover',
  quality = 80,
  showPlaceholder = true,
  placeholderIconName = 'package-variant',
  placeholderIconSize = 24,
  placeholderIconColor = '#9CA3AF',
}: ProductImageProps) {
  const { currentImage,fetchResizedImageByFilename } = useImages();
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(false);
  
  // The base styling for the image/placeholder container
  const containerStyle = {
    width,
    height,
    borderRadius,
  };

  useEffect(() => {
    // If we have a filename, try to load it from the API
    if (filename) {
      setLoading(true);
      setError(false);
      
      // Calculate appropriate dimensions for this device/screen size
      const targetWidth = width * 2; // For higher resolution screens
      const targetHeight = height * 2;
      
      // Try to fetch the resized image
      fetchResizedImageByFilename(filename, {
        width: targetWidth,
        height: targetHeight,
        quality,
      })
        .then(() => {
          if (currentImage && currentImage.url) {
            setImageUrl(currentImage.url);
            setError(false);
          } else {
            // If the API doesn't return a URL, use the fallback
            setImageUrl(fallbackUrl || null);
            if (!fallbackUrl) setError(true);
          }
        })
        .catch(() => {
          // On error, use the fallback URL if available
          setImageUrl(fallbackUrl || null);
          if (!fallbackUrl) setError(true);
        })
        .finally(() => {
          setLoading(false);
        });
    } else if (fallbackUrl) {
      // If we don't have a filename but have a fallback, use it
      setImageUrl(fallbackUrl);
      setLoading(false);
      setError(false);
    } else {
      // No image available
      setImageUrl(null);
      setLoading(false);
      setError(true);
    }
  }, [filename, fallbackUrl, width, height, quality]);

  // Show loading indicator while fetching the image
  if (loading) {
    return (
      <View style={[styles.container, containerStyle, styles.loadingContainer]}>
        <ActivityIndicator size="small" color="#0066cc" />
      </View>
    );
  }

  // Show the image if we have a URL
  if (imageUrl) {
    return (
      <Image
        source={{ uri: imageUrl }}
        style={[styles.image, containerStyle]}
        contentFit={resizeMode as any}
        transition={200}
        cachePolicy="memory-disk"
      />
    );
  }

  // Show placeholder if requested and we have no image
  if (showPlaceholder || error) {
    return (
      <View style={[styles.container, containerStyle, styles.placeholderContainer]}>
        <MaterialCommunityIcons
          name={placeholderIconName as any}
          size={placeholderIconSize}
          color={placeholderIconColor}
        />
      </View>
    );
  }

  // Empty view as fallback
  return <View style={[styles.container, containerStyle]} />;
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#F1F5F9',
    overflow: 'hidden',
  },
  image: {
    backgroundColor: '#F1F5F9',
  },
  loadingContainer: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  placeholderContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderStyle: 'dashed',
  },
}); 