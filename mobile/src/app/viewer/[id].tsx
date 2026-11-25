import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  FlatList,
  useWindowDimensions,
  Alert,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/theme';
import { useAppStore } from '@/store/useAppStore';
import { albumService } from '@/services/albumService';
import { mockPhotos } from '@/store/mockData';
import { Photo } from '@cloudvault/types';

function formatFileSize(bytes: number): string {
  const mb = bytes / (1024 * 1024);
  if (mb >= 1) return `${mb.toFixed(1)} MB`;
  return `${(bytes / 1024).toFixed(0)} KB`;
}

function formatCaptureDate(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  }) + ' · ' + d.toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' });
}

const STRIP_GRADIENTS: [string, string][] = [
  ['#5BAEDB', '#3B6DC8'],
  ['#E8855A', '#8B4FA0'],
  ['#D4A45A', '#7A5B2E'],
  ['#F0855A', '#D44560'],
  ['#C77FDE', '#6B42C8'],
];

export default function MediaViewerModal() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { theme, spacing, radius } = useTheme();
  const { width } = useWindowDimensions();

  const [showInfo, setShowInfo] = useState(false);

  const storePhotos = useAppStore((state) => state.photos);
  const albums = useAppStore((state) => state.albums);
  const addPhotoToAlbum = useAppStore((state) => state.addPhotoToAlbum);
  const photo = storePhotos.find((p) => p.id === id) || mockPhotos.find((p) => p.id === id);

  // Build a "filmstrip" of nearby photos for the bottom strip
  const allPhotos = storePhotos.length > 0 ? storePhotos : mockPhotos;
  const currentIndex = allPhotos.findIndex((p) => p.id === id);

  if (!photo) {
    return (
      <SafeAreaView style={[styles.root, { backgroundColor: '#000' }]}>
        <View style={styles.notFound}>
          <Text style={{ color: '#FFF', fontSize: 16 }}>Media item not found</Text>
          <TouchableOpacity onPress={() => router.back()} style={{ marginTop: 16 }}>
            <Text style={{ color: theme.colors.primary, fontSize: 14 }}>Go Back</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  const handleAction = (type: 'Organize' | 'Download' | 'Open' | 'Adjust') => {
    if (type === 'Organize') {
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
              await albumService.addPhotoToAlbum(alb.id, photo.id).catch(() => {});
              addPhotoToAlbum(alb.id);
              Alert.alert('Photo Added', `Added ${photo.filename} to ${alb.name}`);
            },
          })),
          { text: 'Cancel', style: 'cancel' as const },
        ]
      );
      return;
    }
    Alert.alert(type, `Simulated ${type.toLowerCase()} for ${photo.filename}.`);
  };

  return (
    <View style={[styles.root, { backgroundColor: theme.colors.background }]}>
      {/* ── Top bar ── */}
      <SafeAreaView edges={['top']} style={styles.topBar}>
        <TouchableOpacity
          onPress={() => router.back()}
          style={[styles.iconBtn, { backgroundColor: theme.colors.surface, borderRadius: radius.md }]}
        >
          <Ionicons name="chevron-back" size={20} color={theme.colors.text} />
        </TouchableOpacity>

        <View style={styles.topCenter}>
          <Text style={[styles.topTitle, { color: theme.colors.text }]}>Media Viewer</Text>
          <Text style={[styles.topSub, { color: theme.colors.primary }]} numberOfLines={1}>
            {photo.accountEmail}
          </Text>
        </View>

        <TouchableOpacity
          onPress={() => Alert.alert('Options', 'Share / Move / Delete')}
          style={[styles.iconBtn, { backgroundColor: theme.colors.surface, borderRadius: radius.md }]}
        >
          <Ionicons name="ellipsis-horizontal" size={20} color={theme.colors.text} />
        </TouchableOpacity>
      </SafeAreaView>

      {/* ── Main image ── */}
      <View style={[styles.imageWrap, { borderRadius: radius.xl, margin: spacing.lg, marginTop: 80 }]}>
        {photo.previewUrl ? (
          <Image
            source={{ uri: photo.previewUrl }}
            style={[styles.mainImage, { borderRadius: radius.xl }]}
            contentFit="cover"
            transition={300}
            cachePolicy="memory-disk"
          />
        ) : (
          <LinearGradient
            colors={['#E8855A', '#8B4FA0']}
            style={[styles.mainImage, { borderRadius: radius.xl }]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
          />
        )}
        {/* Count overlay */}
        <View style={[styles.countBadge, { borderRadius: radius.pill, bottom: 14, left: 14 }]}>
          <Text style={styles.countText}>
            {currentIndex >= 0 ? `${currentIndex + 1} of ${allPhotos.length}` : '—'}
          </Text>
        </View>
      </View>

      {/* ── Filmstrip ── */}
      <FlatList
        data={allPhotos}
        horizontal
        showsHorizontalScrollIndicator={false}
        keyExtractor={(p) => p.id}
        contentContainerStyle={{ paddingHorizontal: spacing.lg }}
        style={{ maxHeight: 72, flexGrow: 0 }}
        renderItem={({ item, index }) => {
          const isActive = item.id === photo.id;
          return (
            <TouchableOpacity
              onPress={() =>
                router.replace({ pathname: '/viewer/[id]', params: { id: item.id } })
              }
              style={[
                styles.strip,
                {
                  borderRadius: radius.md,
                  borderWidth: isActive ? 2 : 0,
                  borderColor: isActive ? theme.colors.primary : 'transparent',
                  marginRight: 8,
                },
              ]}
            >
              {item.thumbnailUrl ? (
                <Image
                  source={{ uri: item.thumbnailUrl }}
                  style={[styles.stripImg, { borderRadius: radius.md }]}
                  contentFit="cover"
                  cachePolicy="memory-disk"
                />
              ) : (
                <LinearGradient
                  colors={STRIP_GRADIENTS[index % STRIP_GRADIENTS.length]}
                  style={[styles.stripImg, { borderRadius: radius.md }]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                />
              )}
            </TouchableOpacity>
          );
        }}
      />

      {/* ── Info card ── */}
      <View
        style={[
          styles.infoCard,
          {
            backgroundColor: theme.colors.surface,
            borderRadius: radius.xl,
            marginHorizontal: spacing.lg,
            marginTop: spacing.md,
            padding: spacing.lg,
          },
        ]}
      >
        <Text style={[styles.infoLabel, { color: theme.colors.textSubtle }]}>Capture date</Text>
        <Text style={[styles.infoDate, { color: theme.colors.text }]}>
          {formatCaptureDate(photo.capturedAt)}
        </Text>
        {photo.metadata?.locationName && (
          <Text style={[styles.infoLoc, { color: theme.colors.textMuted }]}>
            {photo.metadata.locationName}
          </Text>
        )}

        <View style={[styles.infoGrid, { marginTop: spacing.md }]}>
          <View>
            <Text style={[styles.infoLabel, { color: theme.colors.textSubtle }]}>Hardware</Text>
            <Text style={[styles.infoVal, { color: theme.colors.text }]}>
              {photo.metadata?.cameraModel ?? '—'}
            </Text>
          </View>
          <View>
            <Text style={[styles.infoLabel, { color: theme.colors.textSubtle }]}>File</Text>
            <Text style={[styles.infoVal, { color: theme.colors.text }]}>
              {`${formatFileSize(photo.sizeBytes)} · ${photo.mimeType.split('/')[1]?.toUpperCase() ?? 'FILE'}`}
            </Text>
          </View>
        </View>
      </View>

      {/* ── Action bar ── */}
      <SafeAreaView edges={['bottom']} style={[styles.actionBar, { marginHorizontal: spacing.lg, marginTop: spacing.md }]}>
        {(['Organize', 'Download', 'Open', 'Adjust'] as const).map((action) => (
          <TouchableOpacity
            key={action}
            activeOpacity={0.75}
            onPress={() => handleAction(action)}
            style={[
              styles.actionBtn,
              {
                backgroundColor: theme.colors.surface,
                borderRadius: radius.lg,
              },
            ]}
          >
            <Ionicons
              name={
                action === 'Organize'
                  ? 'folder-outline'
                  : action === 'Download'
                  ? 'download-outline'
                  : action === 'Open'
                  ? 'open-outline'
                  : 'options-outline'
              }
              size={20}
              color={theme.colors.text}
            />
            <Text style={[styles.actionLabel, { color: theme.colors.text }]}>{action}</Text>
          </TouchableOpacity>
        ))}
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  notFound: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  topBar: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  iconBtn: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center' },
  topCenter: { flex: 1, alignItems: 'center', marginHorizontal: 10 },
  topTitle: { fontSize: 16, fontWeight: '700' },
  topSub: { fontSize: 12, marginTop: 2 },
  imageWrap: { overflow: 'hidden', flex: 0, height: 340 },
  mainImage: { width: '100%' as const, height: '100%' as const },
  countBadge: {
    position: 'absolute',
    backgroundColor: 'rgba(10,10,20,0.6)',
    paddingHorizontal: 12,
    paddingVertical: 5,
  },
  countText: { color: '#FFF', fontSize: 13, fontWeight: '700' },
  strip: { width: 60, height: 60, overflow: 'hidden' },
  stripImg: { width: 60, height: 60 },
  infoCard: {},
  infoLabel: { fontSize: 12, fontWeight: '500', marginBottom: 2 },
  infoDate: { fontSize: 20, fontWeight: '700' },
  infoLoc: { fontSize: 13, marginTop: 2 },
  infoGrid: { flexDirection: 'row', justifyContent: 'space-between' },
  infoVal: { fontSize: 15, fontWeight: '700' },
  actionBar: { flexDirection: 'row', justifyContent: 'space-between' },
  actionBtn: { flex: 1, alignItems: 'center', paddingVertical: 14, marginHorizontal: 4 },
  actionLabel: { fontSize: 12, fontWeight: '500', marginTop: 4 },
});
