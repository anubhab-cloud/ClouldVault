import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  useWindowDimensions,
  Alert,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Image } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/theme';
import { useAppStore } from '@/store/useAppStore';
import { mockPhotos } from '@/store/mockData';

export default function MediaViewerModal() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { theme, spacing, radius, typography } = useTheme();
  const { width, height } = useWindowDimensions();

  const [isInfoExpanded, setIsInfoExpanded] = useState(false);

  const storePhotos = useAppStore((state) => state.photos);
  const photo = storePhotos.find((p) => p.id === id) || mockPhotos.find((p) => p.id === id);

  if (!photo) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: '#000000' }]}>
        <View style={styles.notFound}>
          <Text style={{ color: '#FFFFFF', fontSize: 16 }}>Media item not found</Text>
          <TouchableOpacity onPress={() => router.back()} style={{ marginTop: 16 }}>
            <Text style={{ color: theme.colors.primary, fontSize: 14 }}>Go Back</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  const formatFileSize = (bytes: number): string => {
    const mb = bytes / (1024 * 1024);
    return `${mb.toFixed(2)} MB`;
  };

  const albums = useAppStore((state) => state.albums);

  const handleAction = async (type: string) => {
    if (type === 'Add to Album') {
      if (albums.length === 0) {
        Alert.alert('No Albums', 'Create an album in the Albums tab first.');
        return;
      }
      Alert.alert(
        'Add to Album',
        `Select an album for ${photo.filename}:`,
        [
          ...albums.map((alb) => ({
            text: alb.name,
            onPress: async () => {
              Alert.alert('Photo Added', `Added ${photo.filename} to ${alb.name}`);
            },
          })),
          { text: 'Cancel', style: 'cancel' as const },
        ]
      );
      return;
    }
    Alert.alert(type, `Simulated ${type.toLowerCase()} action for ${photo.filename}.`);
  };

  return (
    <View style={[styles.container, { backgroundColor: '#000000' }]}>
      {/* Top Overlay Bar */}
      <SafeAreaView edges={['top']} style={styles.topBar}>
        <TouchableOpacity
          onPress={() => router.back()}
          style={[styles.iconButton, { backgroundColor: 'rgba(0, 0, 0, 0.55)', borderRadius: radius.pill }]}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <Ionicons name="close" size={22} color="#FFFFFF" />
        </TouchableOpacity>

        <View style={styles.topTitleContainer}>
          <Text style={[typography.caption, { color: '#FFFFFF', fontWeight: '600' }]} numberOfLines={1}>
            {photo.filename}
          </Text>
          <Text style={[typography.micro, { color: 'rgba(255, 255, 255, 0.7)' }]} numberOfLines={1}>
            {photo.accountEmail}
          </Text>
        </View>

        <TouchableOpacity
          onPress={() => setIsInfoExpanded(!isInfoExpanded)}
          style={[
            styles.iconButton,
            {
              backgroundColor: isInfoExpanded ? theme.colors.primary : 'rgba(0, 0, 0, 0.55)',
              borderRadius: radius.pill,
            },
          ]}
        >
          <Ionicons name="information-circle-outline" size={22} color="#FFFFFF" />
        </TouchableOpacity>
      </SafeAreaView>

      {/* Main Media Preview */}
      <View style={[styles.imageWrapper, { width, height: height * 0.75 }]}>
        <Image
          source={{ uri: photo.previewUrl }}
          style={styles.mainImage}
          contentFit="contain"
          transition={300}
          cachePolicy="memory-disk"
        />
      </View>

      {/* Bottom Metadata Drawer / Action Bar */}
      <SafeAreaView edges={['bottom']} style={[styles.bottomBar, { backgroundColor: theme.colors.surface }]}>
        {/* Quick Actions */}
        <View style={[styles.quickActionsRow, { paddingHorizontal: spacing.xl, paddingVertical: spacing.md }]}>
          <TouchableOpacity onPress={() => handleAction('Share')} style={styles.actionItem}>
            <Ionicons name="share-outline" size={20} color={theme.colors.text} />
            <Text style={[typography.micro, { color: theme.colors.textSubtle, marginTop: 4 }]}>Share</Text>
          </TouchableOpacity>

          <TouchableOpacity onPress={() => handleAction('Add to Album')} style={styles.actionItem}>
            <Ionicons name="folder-outline" size={20} color={theme.colors.text} />
            <Text style={[typography.micro, { color: theme.colors.textSubtle, marginTop: 4 }]}>Album</Text>
          </TouchableOpacity>

          <TouchableOpacity onPress={() => handleAction('Download')} style={styles.actionItem}>
            <Ionicons name="download-outline" size={20} color={theme.colors.text} />
            <Text style={[typography.micro, { color: theme.colors.textSubtle, marginTop: 4 }]}>Export</Text>
          </TouchableOpacity>

          <TouchableOpacity onPress={() => setIsInfoExpanded(!isInfoExpanded)} style={styles.actionItem}>
            <Ionicons name="list-outline" size={20} color={theme.colors.primary} />
            <Text style={[typography.micro, { color: theme.colors.primary, marginTop: 4 }]}>Details</Text>
          </TouchableOpacity>
        </View>

        {/* Expandable EXIF Info Sheet */}
        {isInfoExpanded && (
          <ScrollView
            style={[
              styles.infoSheet,
              {
                maxHeight: 220,
                borderTopColor: theme.colors.borderSubtle,
                paddingHorizontal: spacing.lg,
                paddingBottom: spacing.lg,
              },
            ]}
          >
            <Text style={[typography.titleSmall, { color: theme.colors.text, marginVertical: spacing.sm }]}>
              Details & Metadata
            </Text>

            <View style={styles.metaRow}>
              <Text style={[typography.caption, { color: theme.colors.textSubtle }]}>Captured Date</Text>
              <Text style={[typography.caption, { color: theme.colors.text, fontWeight: '600' }]}>
                {new Date(photo.capturedAt).toLocaleString()}
              </Text>
            </View>

            <View style={styles.metaRow}>
              <Text style={[typography.caption, { color: theme.colors.textSubtle }]}>File Size</Text>
              <Text style={[typography.caption, { color: theme.colors.text, fontWeight: '600' }]}>
                {formatFileSize(photo.sizeBytes)} ({photo.mimeType})
              </Text>
            </View>

            {photo.metadata?.cameraModel && (
              <View style={styles.metaRow}>
                <Text style={[typography.caption, { color: theme.colors.textSubtle }]}>Camera</Text>
                <Text style={[typography.caption, { color: theme.colors.text, fontWeight: '600' }]}>
                  {photo.metadata.cameraModel} ({photo.metadata.focalLength}mm, {photo.metadata.exposureTime}, ISO {photo.metadata.iso})
                </Text>
              </View>
            )}

            {photo.metadata?.locationName && (
              <View style={styles.metaRow}>
                <Text style={[typography.caption, { color: theme.colors.textSubtle }]}>Location</Text>
                <Text style={[typography.caption, { color: theme.colors.text, fontWeight: '600' }]}>
                  {photo.metadata.locationName}
                </Text>
              </View>
            )}

            <View style={styles.metaRow}>
              <Text style={[typography.caption, { color: theme.colors.textSubtle }]}>Provider Account</Text>
              <Text style={[typography.caption, { color: theme.colors.primary, fontWeight: '600' }]}>
                {photo.accountEmail} ({photo.provider === 'google-drive' ? 'Google Drive' : 'Google Photos'})
              </Text>
            </View>
          </ScrollView>
        )}
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  notFound: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  topBar: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 10,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  iconButton: {
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
  },
  topTitleContainer: {
    flex: 1,
    alignItems: 'center',
    marginHorizontal: 12,
  },
  imageWrapper: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  mainImage: {
    width: '100%' as const,
    height: '100%' as const,
  },
  bottomBar: {
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    overflow: 'hidden',
  },
  quickActionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
  },
  actionItem: {
    alignItems: 'center',
  },
  infoSheet: {
    borderTopWidth: 1,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 6,
  },
});
