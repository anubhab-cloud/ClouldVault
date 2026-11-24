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
  ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useQuery } from '@tanstack/react-query';
import { useTheme } from '@/theme';
import { useAppStore } from '@/store/useAppStore';
import { albumService } from '@/services/albumService';
import { AppButton } from '@/components/common/AppButton';
import { EmptyState } from '@/components/common/EmptyState';
import { Album } from '@cloudvault/types';
import { mockAlbums } from '@/store/mockData';

const ALBUM_GRADIENTS: [string, string][] = [
  ['#E8855A', '#8B4FA0'],
  ['#D4A45A', '#7A5B2E'],
  ['#C4C9DC', '#8A90B0'],
  ['#C77FDE', '#6B42C8'],
];

function albumGradient(i: number): [string, string] {
  return ALBUM_GRADIENTS[i % ALBUM_GRADIENTS.length];
}

type FilterTab = 'All' | 'Shared' | 'Favorites';

const SMART_COLLECTIONS = [
  { id: 'videos', label: 'Videos across all accounts', sub: 'streamable references', count: 214 },
  { id: 'screenshots', label: 'Screenshots & documents', sub: 'synced files', count: 98 },
];

export default function AlbumsScreen() {
  const { theme, spacing, radius } = useTheme();
  const { width } = useWindowDimensions();
  const { albums: storeAlbums, createAlbum: createStoreAlbum } = useAppStore();

  const [filter, setFilter] = useState<FilterTab>('All');
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [newAlbumName, setNewAlbumName] = useState('');
  const [newAlbumDesc, setNewAlbumDesc] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const cardWidth = Math.floor((width - spacing.lg * 2 - spacing.md) / 2);
  const cardHeight = Math.round(cardWidth * 1.1);

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

  const displayAlbums = albums; // could filter by `filter` tab once backend supports it

  const handleCreateAlbum = async () => {
    if (!newAlbumName.trim()) return;
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

  const filters: FilterTab[] = ['All', 'Shared', 'Favorites'];

  return (
    <SafeAreaView style={[styles.root, { backgroundColor: theme.colors.background }]} edges={['top']}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 100 }}>
        {/* ── Header ── */}
        <View style={[styles.headerRow, { paddingHorizontal: spacing.lg, paddingTop: spacing.md }]}>
          <View>
            <Text style={[styles.headerSub, { color: theme.colors.textSubtle }]}>Across all accounts</Text>
            <Text style={[styles.headerTitle, { color: theme.colors.text }]}>Albums</Text>
          </View>
          <TouchableOpacity
            activeOpacity={0.8}
            onPress={() => setIsModalVisible(true)}
            style={[styles.newBtn, { backgroundColor: theme.colors.primary, borderRadius: radius.pill }]}
          >
            <Ionicons name="add" size={16} color="#FFF" style={{ marginRight: 4 }} />
            <Text style={styles.newBtnText}>New</Text>
          </TouchableOpacity>
        </View>

        {/* ── Filter tabs ── */}
        <View style={[styles.filterRow, { paddingHorizontal: spacing.lg, marginTop: spacing.md }]}>
          {filters.map((f) => (
            <TouchableOpacity
              key={f}
              activeOpacity={0.75}
              onPress={() => setFilter(f)}
              style={[
                styles.filterPill,
                {
                  backgroundColor: filter === f ? theme.colors.text : theme.colors.surface,
                  borderRadius: radius.pill,
                  borderColor: filter === f ? theme.colors.text : theme.colors.border,
                  marginRight: spacing.sm,
                },
              ]}
            >
              <Text
                style={[
                  styles.filterText,
                  { color: filter === f ? theme.colors.surface : theme.colors.text },
                ]}
              >
                {f === 'All' ? `All ${albums.length}` : f}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* ── Album grid ── */}
        {displayAlbums.length === 0 ? (
          <EmptyState
            icon={<Ionicons name="folder-open-outline" size={48} color={theme.colors.textSubtle} />}
            title="No Albums Yet"
            description="Group your memories into virtual albums across all connected accounts."
            actionTitle="Create Album"
            onAction={() => setIsModalVisible(true)}
          />
        ) : (
          <View style={[styles.grid, { paddingHorizontal: spacing.lg, marginTop: spacing.lg }]}>
            {displayAlbums.map((album, i) => (
              <TouchableOpacity
                key={album.id}
                activeOpacity={0.85}
                onPress={() => handleOpenAlbum(album)}
                style={[
                  styles.albumCard,
                  {
                    width: cardWidth,
                    backgroundColor: theme.colors.surface,
                    borderRadius: radius.xl,
                    marginBottom: spacing.lg,
                    marginLeft: i % 2 === 1 ? spacing.md : 0,
                  },
                ]}
              >
                {/* Cover */}
                <View style={[styles.coverWrap, { height: cardHeight, borderRadius: radius.xl, overflow: 'hidden' }]}>
                  {album.coverPhotoUrl ? (
                    <Image source={{ uri: album.coverPhotoUrl }} style={styles.coverImg} contentFit="cover" />
                  ) : (
                    <LinearGradient
                      colors={albumGradient(i)}
                      style={styles.coverImg}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 1 }}
                    />
                  )}
                  {/* Pinned badge */}
                  {i === 1 && (
                    <View style={[styles.pinnedBadge, { borderRadius: radius.sm, bottom: 10, left: 10 }]}>
                      <Text style={styles.pinnedText}>Pinned</Text>
                    </View>
                  )}
                </View>

                {/* Info */}
                <View style={{ padding: spacing.sm, paddingTop: spacing.xs }}>
                  <Text style={[styles.albumName, { color: theme.colors.text }]} numberOfLines={2}>
                    {album.name}
                  </Text>
                  <Text style={[styles.albumMeta, { color: theme.colors.textSubtle }]} numberOfLines={1}>
                    {album.photoCount} items
                    {album.description ? ` · ${album.description}` : ''}
                  </Text>
                </View>
              </TouchableOpacity>
            ))}
          </View>
        )}

        {/* ── Smart Collections ── */}
        <View style={{ marginHorizontal: spacing.lg, marginTop: spacing.sm }}>
          <Text style={[styles.sectionTitle, { color: theme.colors.text, marginBottom: spacing.md }]}>
            Smart collections
          </Text>
          {SMART_COLLECTIONS.map((col) => (
            <TouchableOpacity
              key={col.id}
              activeOpacity={0.8}
              style={[
                styles.smartRow,
                {
                  backgroundColor: theme.colors.surface,
                  borderRadius: radius.lg,
                  marginBottom: spacing.sm,
                },
              ]}
            >
              <View style={{ flex: 1 }}>
                <Text style={[styles.smartTitle, { color: theme.colors.text }]}>{col.label}</Text>
                <Text style={[styles.smartSub, { color: theme.colors.textSubtle }]}>
                  {col.count} {col.sub}
                </Text>
              </View>
              <Text style={[styles.smartCount, { color: theme.colors.text }]}>{col.count}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>

      {/* ── New Album Modal ── */}
      <Modal visible={isModalVisible} transparent animationType="slide">
        <View style={[styles.modalOverlay, { backgroundColor: theme.colors.overlay }]}>
          <View
            style={[
              styles.modalCard,
              {
                backgroundColor: theme.colors.surface,
                borderRadius: radius.xl,
                padding: spacing.xl,
              },
            ]}
          >
            <Text style={[styles.modalTitle, { color: theme.colors.text, marginBottom: spacing.md }]}>
              Create New Album
            </Text>

            <TextInput
              placeholder="Album title (e.g. Pacific Roadtrip)"
              placeholderTextColor={theme.colors.textSubtle}
              value={newAlbumName}
              onChangeText={setNewAlbumName}
              style={[
                styles.input,
                {
                  color: theme.colors.text,
                  backgroundColor: theme.colors.surfaceSubtle,
                  borderRadius: radius.md,
                  borderColor: theme.colors.border,
                  padding: spacing.md,
                  marginBottom: spacing.md,
                  fontSize: 15,
                },
              ]}
            />
            <TextInput
              placeholder="Description (optional)"
              placeholderTextColor={theme.colors.textSubtle}
              value={newAlbumDesc}
              onChangeText={setNewAlbumDesc}
              style={[
                styles.input,
                {
                  color: theme.colors.text,
                  backgroundColor: theme.colors.surfaceSubtle,
                  borderRadius: radius.md,
                  borderColor: theme.colors.border,
                  padding: spacing.md,
                  marginBottom: spacing.lg,
                  fontSize: 15,
                },
              ]}
            />

            <View style={styles.modalBtns}>
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
                disabled={!newAlbumName.trim()}
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
  root: { flex: 1 },
  headerRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  headerSub: { fontSize: 13 },
  headerTitle: { fontSize: 32, fontWeight: '800', letterSpacing: -0.5, marginTop: 2 },
  newBtn: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 10 },
  newBtnText: { color: '#FFF', fontSize: 15, fontWeight: '700' },
  filterRow: { flexDirection: 'row' },
  filterPill: { paddingHorizontal: 14, paddingVertical: 8, borderWidth: 1 },
  filterText: { fontSize: 14, fontWeight: '600' },
  grid: { flexDirection: 'row', flexWrap: 'wrap' },
  albumCard: { overflow: 'hidden' },
  coverWrap: {},
  coverImg: { width: '100%' as const, height: '100%' as const },  pinnedBadge: {
    position: 'absolute',
    backgroundColor: 'rgba(10,10,20,0.65)',
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  pinnedText: { color: '#FFF', fontSize: 12, fontWeight: '700' },
  albumName: { fontSize: 14, fontWeight: '700', marginBottom: 2 },
  albumMeta: { fontSize: 12 },
  sectionTitle: { fontSize: 20, fontWeight: '700' },
  smartRow: { flexDirection: 'row', alignItems: 'center', padding: 16 },
  smartTitle: { fontSize: 15, fontWeight: '600' },
  smartSub: { fontSize: 12, marginTop: 2 },
  smartCount: { fontSize: 20, fontWeight: '700' },
  modalOverlay: { flex: 1, justifyContent: 'flex-end' },
  modalCard: { width: '100%' },
  modalTitle: { fontSize: 18, fontWeight: '700' },
  input: { borderWidth: 1 },
  modalBtns: { flexDirection: 'row' },
});
