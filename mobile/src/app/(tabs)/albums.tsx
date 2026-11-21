import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  useWindowDimensions,
  Modal,
  TextInput,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Image } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';
import { useQuery } from '@tanstack/react-query';
import { useTheme } from '@/theme';
import { useAppStore } from '@/store/useAppStore';
import { albumService } from '@/services/albumService';
import { AppHeader } from '@/components/common/AppHeader';
import { AppButton } from '@/components/common/AppButton';
import { EmptyState } from '@/components/common/EmptyState';
import { Album } from '@cloudvault/types';
import { mockAlbums } from '@/store/mockData';

export default function AlbumsScreen() {
  const { theme, spacing, radius, typography } = useTheme();
  const { width } = useWindowDimensions();
  const { albums: storeAlbums, createAlbum: createStoreAlbum } = useAppStore();

  const [isModalVisible, setIsModalVisible] = useState(false);
  const [newAlbumName, setNewAlbumName] = useState('');
  const [newAlbumDesc, setNewAlbumDesc] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // 2-column album card width
  const cardWidth = Math.floor((width - spacing.lg * 2 - spacing.md) / 2);

  // Query live albums with fallback
  const { data: albums = storeAlbums, refetch } = useQuery<Album[]>({
    queryKey: ['albums'],
    queryFn: async () => {
      try {
        const live = await albumService.getAlbums();
        if (live && live.length > 0) return live;
        return storeAlbums.length > 0 ? storeAlbums : mockAlbums;
      } catch {
        return storeAlbums.length > 0 ? storeAlbums : mockAlbums;
      }
    },
  });

  const handleCreateAlbum = async () => {
    if (newAlbumName.trim().length === 0) return;
    setIsSubmitting(true);
    try {
      await albumService.createAlbum(newAlbumName.trim(), newAlbumDesc.trim() || undefined).catch(() => {});
      createStoreAlbum(newAlbumName.trim(), newAlbumDesc.trim() || undefined);
      setNewAlbumName('');
      setNewAlbumDesc('');
      setIsModalVisible(false);
      refetch();
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleOpenAlbum = (album: Album) => {
    Alert.alert(album.name, `${album.description || 'Collection'}\n${album.photoCount} items.`);
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]} edges={['top']}>
      <AppHeader
        title="Albums"
        subtitle={`${albums.length} collections`}
        rightAction={
          <TouchableOpacity
            onPress={() => setIsModalVisible(true)}
            style={[
              styles.createBtn,
              {
                backgroundColor: theme.colors.surfaceElevated,
                borderRadius: radius.pill,
                paddingHorizontal: spacing.md,
                paddingVertical: spacing.xs,
              },
            ]}
          >
            <Ionicons name="add" size={16} color={theme.colors.primary} style={{ marginRight: 4 }} />
            <Text style={[typography.caption, { color: theme.colors.text, fontWeight: '600' }]}>
              New Album
            </Text>
          </TouchableOpacity>
        }
      />

      {albums.length === 0 ? (
        <EmptyState
          icon={<Ionicons name="folder-open-outline" size={48} color={theme.colors.textSubtle} />}
          title="No Albums Created"
          description="Group your memories into virtual albums across all connected accounts."
          actionTitle="Create Album"
          onAction={() => setIsModalVisible(true)}
        />
      ) : (
        <FlatList
          data={albums}
          keyExtractor={(item) => item.id}
          numColumns={2}
          contentContainerStyle={{ padding: spacing.lg, paddingBottom: spacing.huge }}
          columnWrapperStyle={{ justifyContent: 'space-between', marginBottom: spacing.lg }}
          renderItem={({ item }) => (
            <TouchableOpacity
              activeOpacity={0.8}
              onPress={() => handleOpenAlbum(item)}
              style={[
                styles.albumCard,
                {
                  width: cardWidth,
                  backgroundColor: theme.colors.surfaceElevated,
                  borderRadius: radius.md,
                  borderColor: theme.colors.borderSubtle,
                },
              ]}
            >
              <View style={[styles.coverContainer, { borderTopLeftRadius: radius.md, borderTopRightRadius: radius.md }]}>
                {item.coverPhotoUrl ? (
                  <Image source={{ uri: item.coverPhotoUrl }} style={styles.coverImage} contentFit="cover" />
                ) : (
                  <View style={[styles.coverFallback, { backgroundColor: theme.colors.surfaceSubtle }]}>
                    <Ionicons name="images-outline" size={32} color={theme.colors.textSubtle} />
                  </View>
                )}
              </View>

              <View style={[styles.albumInfo, { padding: spacing.md }]}>
                <Text style={[typography.titleSmall, { color: theme.colors.text }]} numberOfLines={1}>
                  {item.name}
                </Text>
                <Text style={[typography.caption, { color: theme.colors.textSubtle, marginTop: 2 }]}>
                  {item.photoCount} photos
                </Text>
              </View>
            </TouchableOpacity>
          )}
        />
      )}

      {/* New Album Modal */}
      <Modal visible={isModalVisible} transparent animationType="fade">
        <View style={[styles.modalOverlay, { backgroundColor: theme.colors.overlay }]}>
          <View
            style={[
              styles.modalCard,
              {
                backgroundColor: theme.colors.surface,
                borderRadius: radius.lg,
                padding: spacing.xl,
                borderColor: theme.colors.borderSubtle,
              },
            ]}
          >
            <Text style={[typography.titleMedium, { color: theme.colors.text, marginBottom: spacing.md }]}>
              Create New Album
            </Text>

            <TextInput
              placeholder="Album title (e.g. Summer Roadtrip)"
              placeholderTextColor={theme.colors.textSubtle}
              value={newAlbumName}
              onChangeText={setNewAlbumName}
              style={[
                styles.modalInput,
                typography.bodyMedium,
                {
                  color: theme.colors.text,
                  backgroundColor: theme.colors.surfaceElevated,
                  borderRadius: radius.sm,
                  borderColor: theme.colors.borderSubtle,
                  padding: spacing.md,
                  marginBottom: spacing.md,
                },
              ]}
            />

            <TextInput
              placeholder="Description (optional)"
              placeholderTextColor={theme.colors.textSubtle}
              value={newAlbumDesc}
              onChangeText={setNewAlbumDesc}
              style={[
                styles.modalInput,
                typography.bodyMedium,
                {
                  color: theme.colors.text,
                  backgroundColor: theme.colors.surfaceElevated,
                  borderRadius: radius.sm,
                  borderColor: theme.colors.borderSubtle,
                  padding: spacing.md,
                  marginBottom: spacing.lg,
                },
              ]}
            />

            <View style={styles.modalBtnRow}>
              <AppButton
                title="Cancel"
                variant="ghost"
                size="md"
                onPress={() => setIsModalVisible(false)}
                style={{ flex: 1, marginRight: spacing.sm }}
              />
              <AppButton
                title="Create"
                variant="primary"
                size="md"
                loading={isSubmitting}
                onPress={handleCreateAlbum}
                disabled={newAlbumName.trim().length === 0}
                style={{ flex: 1 }}
              />
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  createBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  albumCard: {
    borderWidth: 1,
    overflow: 'hidden',
  },
  coverContainer: {
    width: '100%',
    height: 120,
    overflow: 'hidden',
  },
  coverImage: {
    width: '100%' as const,
    height: '100%' as const,
  },
  coverFallback: {
    width: '100%' as const,
    height: '100%' as const,
    alignItems: 'center',
    justifyContent: 'center',
  },
  albumInfo: {},
  modalOverlay: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  modalCard: {
    width: '100%',
    maxWidth: 400,
    borderWidth: 1,
  },
  modalInput: {
    borderWidth: 1,
  },
  modalBtnRow: {
    flexDirection: 'row',
  },
});
