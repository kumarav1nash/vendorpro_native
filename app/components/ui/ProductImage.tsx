import React from 'react';
import { View, StyleSheet, StyleProp, ViewStyle, ImageStyle } from 'react-native';
import { Image } from 'expo-image';
import { MaterialCommunityIcons } from '@expo/vector-icons';

interface ProductImageProps {
  imageUrl?: string;
  width?: number | string;
  height?: number | string;
  borderRadius?: number;
  resizeMode?: 'cover' | 'contain' | 'stretch' | 'center';
  showPlaceholder?: boolean;
  placeholderIconName?: string;
  placeholderIconSize?: number;
  placeholderIconColor?: string;
}

export function ProductImage({
  imageUrl,
  width = 100,
  height = 100,
  borderRadius = 8,
  resizeMode = 'cover',
  showPlaceholder = true,
  placeholderIconName = 'package-variant',
  placeholderIconSize = 24,
  placeholderIconColor = '#9CA3AF',
}: ProductImageProps) {
  // The base styling for the image/placeholder container
  const containerStyle = {
    width,
    height,
    borderRadius,
  } as StyleProp<ViewStyle>;

  // Show the image if we have a URL
  if (imageUrl) {
    return (
      <Image
        source={{ uri: imageUrl }}
        style={[styles.image, containerStyle as StyleProp<ImageStyle>]}
        contentFit={resizeMode as any}
        transition={200}
        cachePolicy="memory-disk"
      />
    );
  }

  // Show placeholder if requested or no image
  if (showPlaceholder) {
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
  placeholderContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderStyle: 'dashed',
  },
}); 