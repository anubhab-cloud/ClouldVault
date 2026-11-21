import React from 'react';
import { TouchableOpacity, StyleSheet, View, Text } from 'react-native';
import { Image } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';
import { Photo } from '@cloudvault/types';
import { useTheme } from '@/theme';

interface PhotoThumbnailProps {
  photo: Photo;
  size: number;
  onPress: (photo: Photo) => void;
}

export const PhotoThumbnail: React.FC<PhotoThumbnailProps> = ({ photo, size, onPress }) => {
  const { theme, radius } = useTheme();

  return (
    <TouchableOpacity
      activeOpacity={0.85}
      onPress={() => onPress(photo)}
      style={[
        styles.container,
        {
          width: size,
          height: size,
          backgroundColor: theme.colors.surfaceElevated,
        },
      ]}
    >
      <Image
        source={{ uri: photo.thumbnailUrl }}
        style={styles.image}
        contentFit="cover"
        transition={200}
        cachePolicy="memory-disk"
      />

      {/* Provider badge overlay */}
      <View style={[styles.badge, { borderRadius: radius.xs }]}>
        <Ionicons
          name={photo.provider === 'google-drive' ? 'logo-google' : 'images-outline'}
          size={10}
          color="#FFFFFF"
        />
      </View>

      {/* Video duration indicator */}
      {photo.mediaType === 'video' && photo.metadata?.durationSeconds && (
        <View style={[styles.durationBadge, { borderRadius: radius.xs }]}>
          <Ionicons name="play" size={10} color="#FFFFFF" style={{ marginRight: 2 }} />
          <Text style={styles.durationText}>
            {Math.floor(photo.metadata.durationSeconds / 60)}:
            {(photo.metadata.durationSeconds % 60).toString().padStart(2, '0')}
          </Text>
        </View>
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    margin: 1,
    overflow: 'hidden',
  },
  image: {
    width: '100%' as const,
    height: '100%' as const,
  },
  badge: {
    position: 'absolute',
    top: 4,
    left: 4,
    backgroundColor: 'rgba(0, 0, 0, 0.55)',
    paddingHorizontal: 4,
    paddingVertical: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  durationBadge: {
    position: 'absolute',
    bottom: 4,
    right: 4,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.65)',
    paddingHorizontal: 5,
    paddingVertical: 2,
  },
  durationText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '600',
  },
});
