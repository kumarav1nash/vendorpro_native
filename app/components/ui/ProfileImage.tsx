import React, { useState, useEffect } from 'react';
import { View, StyleSheet, TouchableOpacity, ActivityIndicator } from 'react-native';
import { Image } from 'expo-image';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useImages } from '../../../src/contexts/ImageContext';

interface ProfileImageProps {
  filename?: string;
  fallbackUrl?: string;
  size?: number;
  editable?: boolean;
  onPress?: () => void;
  showEditIcon?: boolean;
  editIconName?: string;
  editIconSize?: number;
  editIconColor?: string;
  editIconBackgroundColor?: string;
  placeholderIconName?: string;
  placeholderIconSize?: number;
  placeholderIconColor?: string;
}

export function ProfileImage({
  filename,
  fallbackUrl,
  size = 100,
  editable = false,
  onPress,
  showEditIcon = true,
  editIconName = 'camera',
  editIconSize = 16,
  editIconColor = '#FFFFFF',
  editIconBackgroundColor = '#0066cc',
  placeholderIconName = 'account',
  placeholderIconSize = 40,
  placeholderIconColor = '#9CA3AF',
}: ProfileImageProps) {
  const { currentImage,fetchResizedImageByFilename } = useImages();
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(false);
  
  // The base styling for the container
  const containerStyle = {
    width: size,
    height: size,
    borderRadius: size / 2, // Circle for profile pictures
  };

  useEffect(() => {
    // If we have a filename, try to load it from the API
    if (filename) {
      setLoading(true);
      setError(false);
      
      // For profile images, we want square images with some extra resolution
      const targetSize = size * 2; // For higher resolution screens
      
      // Try to fetch the resized image
      fetchResizedImageByFilename(filename, {
        width: targetSize,
        height: targetSize,
        quality: 90, // Higher quality for profile images
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
  }, [filename, fallbackUrl, size]);

  // Base component to render based on image state
  const renderContent = () => {
    if (loading) {
      return (
        <View style={[styles.container, containerStyle, styles.loadingContainer]}>
          <ActivityIndicator size="small" color="#0066cc" />
        </View>
      );
    }

    if (imageUrl) {
      return (
        <View style={[styles.container, containerStyle]}>
          <Image
            source={{ uri: imageUrl }}
            style={[styles.image, containerStyle]}
            contentFit="cover"
            transition={200}
            cachePolicy="memory-disk"
          />
          
          {editable && showEditIcon && (
            <View 
              style={[
                styles.editIconContainer, 
                { backgroundColor: editIconBackgroundColor }
              ]}
            >
              <MaterialCommunityIcons
                name={editIconName as any}
                size={editIconSize}
                color={editIconColor}
              />
            </View>
          )}
        </View>
      );
    }

    // Placeholder
    return (
      <View style={[styles.container, containerStyle, styles.placeholderContainer]}>
        <MaterialCommunityIcons
          name={placeholderIconName as any}
          size={placeholderIconSize}
          color={placeholderIconColor}
        />
        
        {editable && showEditIcon && (
          <View 
            style={[
              styles.editIconContainer, 
              { backgroundColor: editIconBackgroundColor }
            ]}
          >
            <MaterialCommunityIcons
              name={editIconName as any}
              size={editIconSize}
              color={editIconColor}
            />
          </View>
        )}
      </View>
    );
  };

  // If editable and has an onPress handler, make it a TouchableOpacity
  if (editable && onPress) {
    return (
      <TouchableOpacity
        style={styles.wrapper}
        onPress={onPress}
        activeOpacity={0.8}
      >
        {renderContent()}
      </TouchableOpacity>
    );
  }

  // Otherwise, just render the content
  return renderContent();
}

const styles = StyleSheet.create({
  wrapper: {
    // No specific styles needed, just a wrapper for the TouchableOpacity
  },
  container: {
    backgroundColor: '#F1F5F9',
    overflow: 'hidden',
    position: 'relative', // For positioning the edit icon
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
  editIconContainer: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    backgroundColor: '#0066cc',
    width: 30,
    height: 30,
    borderRadius: 15,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
}); 