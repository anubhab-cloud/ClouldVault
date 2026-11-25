import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
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
import { useTheme, palette, shadows3D } from '@/theme';
import { useAppStore } from '@/store/useAppStore';
import { albumService } from '@/services/albumService';
import { AppButton } from '@/components/common/AppButton';
import { EmptyState } from '@/components/common/EmptyState';
import { Album } from '@cloudvault/types';
import { mockAlbums } from '@/store/mockData';

const ALBUM_GRADIENTS: [string, string][] = [
  ['#E8855A', '#2B2B5C'],
  ['#D4A45A', '#4A3418'],
  ['#D5DAE8', '#8A90B0'],
  ['#DE7FD5', '#4D38C8'],
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
  const cardHeight = Math.round(cardWidth * 0.98);

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

  const displayAlbums = albums.filter((album, idx) => {
    if (filter === 'Shared') return album.description?.toLowerCase().includes('account') || idx % 2 === 0;
    if (filter === 'Favorites') return idx < 2;
    return true;
  });

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
    <LinearGradient colors={palette.pageGradient} style={styles.root}>
      <SafeAreaView style={styles.root} edges={['top']}>
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 110 }}>
          {/* ── Header ── */}
          <View style={[styles.headerRow, { paddingHorizontal: spacing.lg, paddingTop: spacing.md }]}>
            <View>
              <Text style={[styles.headerSub, { color: theme.colors.textMuted }]}>Across all accounts</Text>
              <Text style={[styles.headerTitle, { color: theme.colors.text }]}>Albums</Text>
            </View>
            <TouchableOpacity activeOpacity={0.85} onPress={() => setIsModalVisible(true)}>
              <LinearGradient
                colors={palette.indigoGradient}
                start={{ x: 0, y: 0 }}
                end={{ x: 0, y: 1 }}
                style={[styles.newBtn, shadows3D.button]}
              >
                <Ionicons name="add" size={18} color="#FFF" style={{ marginRight: 4 }} />
                <Text style={styles.newBtnText}>New</Text>
              </LinearGradient>
            </TouchableOpacity>
          </View>

          {/* ── Filter tabs ── */}
          <View style={[styles.filterRow, { paddingHorizontal: spacing.lg, marginTop: spacing.md }]}>
            {filters.map((f) => {
              const isSelected = filter === f;
              return (
                <TouchableOpacity
                  key={f}
                  activeOpacity={0.75}
                  onPress={() => setFilter(f)}
                  style={[
                    styles.filterPill,
                    shadows3D.soft,
                    {
                      backgroundColor: isSelected ? theme.colors.text : theme.colors.surface,
                      borderRadius: radius.pill,
                      borderColor: isSelected ? theme.colors.text : 'rgba(255, 255, 255, 0.9)',
                      marginRight: spacing.sm,
                    },
                  ]}
                >
                  <Text style={[styles.filterText, { color: isSelected ? theme.colors.surface : theme.colors.text }]}>
                    {f === 'All' ? `All ${albums.length}` : f}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>

          {/* ── Stacked 3D Album Grid ── */}
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
                  activeOpacity={0.88}
                  onPress={() => handleOpenAlbum(album)}
                  style={[
                    styles.albumItem,
                    {
                      width: cardWidth,
                      marginBottom: spacing.lg,
                      marginLeft: i % 2 === 1 ? spacing.md : 0,
                    },
                  ]}
                >
                  {/* Stacked Folder Peek Layer */}
                  <View style={styles.stackLayerWrap}>
                    <View
                      style={[
                        styles.stackBackLayer,
                        { backgroundColor: i % 2 === 0 ? '#E8C5B5' : '#C9D0E8' },
                      ]}
                    />
                    <View style={[styles.coverWrap, shadows3D.card, { height: cardHeight, borderRadius: 22 }]}>
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
                      {i === 1 && (
                        <View style={[styles.pinnedBadge, { borderRadius: radius.pill }]}>
                          <Text style={styles.pinnedText}>Pinned</Text>
                        </View>
                      )}
                    </View>
                  </View>

                  {/* Title & Subtitle directly below cover on page background */}
                  <View style={{ paddingTop: 10, paddingHorizontal: 2 }}>
                    <Text style={[styles.albumName, { color: theme.colors.text }]} numberOfLines={1}>
                      {album.name}
                    </Text>
                    <Text style={[styles.albumMeta, { color: theme.colors.textMuted }]} numberOfLines={2}>
                      {album.photoCount} items{album.description ? ` · ${album.description}` : ''}
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
                activeOpacity={0.85}
                onPress={() => Alert.alert(col.label, `${col.count} ${col.sub}`)}
                style={[
                  styles.smartRow,
                  shadows3D.soft,
                  {
                    backgroundColor: theme.colors.surface,
                    borderRadius: 20,
                    marginBottom: spacing.sm + 2,
                  },
                ]}
              >
                <View style={{ flex: 1 }}>
                  <Text style={[styles.smartTitle, { color: theme.colors.text }]}>{col.label}</Text>
                  <Text style={[styles.smartSub, { color: theme.colors.textMuted }]}>
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
                  borderRadius: 26,
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
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  headerRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  headerSub: { fontSize: 13, fontWeight: '500' },
  headerTitle: { fontSize: 32, fontWeight: '800', letterSpacing: -0.6, marginTop: 2 },
  newBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 18,
    paddingVertical: 11,
    borderRadius: 18,
    borderBottomWidth: 3,
    borderBottomColor: '#3A3EB5',
  },
  newBtnText: { color: '#FFFFFF', fontSize: 15, fontWeight: '700' },
  filterRow: { flexDirection: 'row' },
  filterPill: { paddingHorizontal: 16, paddingVertical: 8, borderWidth: 1 },
  filterText: { fontSize: 13, fontWeight: '700' },
  grid: { flexDirection: 'row', flexWrap: 'wrap' },
  albumItem: {},
  stackLayerWrap: { paddingTop: 6 },
  stackBackLayer: {
    position: 'absolute',
    top: 0,
    left: '8%',
    right: '8%',
    height: 18,
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    opacity: 0.75,
  },
  coverWrap: { overflow: 'hidden', backgroundColor: '#FFFFFF' },
  coverImg: { width: '100%' as const, height: '100%' as const },
  pinnedBadge: {
    position: 'absolute',
    bottom: 10,
    left: 10,
    backgroundColor: 'rgba(14, 16, 30, 0.74)',
    paddingHorizontal: 11,
    paddingVertical: 4,
  },
  pinnedText: { color: '#FFFFFF', fontSize: 12, fontWeight: '700' },
  albumName: { fontSize: 14, fontWeight: '800', marginBottom: 2 },
  albumMeta: { fontSize: 12, lineHeight: 16 },
  sectionTitle: { fontSize: 20, fontWeight: '800', letterSpacing: -0.3 },
  smartRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 18,
    paddingVertical: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.9)',
  },
  smartTitle: { fontSize: 15, fontWeight: '700' },
  smartSub: { fontSize: 12, marginTop: 2 },
  smartCount: { fontSize: 20, fontWeight: '800' },
  modalOverlay: { flex: 1, justifyContent: 'flex-end' },
  modalCard: { width: '100%' },
  modalTitle: { fontSize: 18, fontWeight: '700' },
  input: { borderWidth: 1 },
  modalBtns: { flexDirection: 'row' },
});
