import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  ScrollView,
  Alert,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useTheme, palette, shadows3D } from '@/theme';
import { useAppStore } from '@/store/useAppStore';
import { albumService } from '@/services/albumService';
import { mockPhotos } from '@/store/mockData';

function formatFileSize(bytes: number): string {
  const mb = bytes / (1024 * 1024);
  if (mb >= 1) return `${mb.toFixed(1)} MB`;
  return `${(bytes / 1024).toFixed(0)} KB`;
}

function formatCaptureDate(iso: string): string {
  const d = new Date(iso);
  return (
    d.toLocaleDateString(undefined, {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    }) +
    ' · ' +
    d.toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' })
  );
}

const STRIP_GRADIENTS: [string, string][] = [
  ['#5BAEDB', '#3B6DC8'],
  ['#E8855A', '#2B2B5C'],
  ['#D4A45A', '#4A3418'],
  ['#F0855A', '#D44560'],
  ['#C77FDE', '#6B42C8'],
];

export default function MediaViewerModal() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { theme, spacing, radius } = useTheme();

  const storePhotos = useAppStore((state) => state.photos);
  const albums = useAppStore((state) => state.albums);
  const addPhotoToAlbum = useAppStore((state) => state.addPhotoToAlbum);
  const photo = storePhotos.find((p) => p.id === id) || mockPhotos.find((p) => p.id === id);

  const allPhotos = storePhotos.length > 0 ? storePhotos : mockPhotos;
  const currentIndex = allPhotos.findIndex((p) => p.id === id);

  if (!photo) {
    return (
      <LinearGradient colors={palette.pageGradient} style={styles.root}>
        <SafeAreaView style={styles.root}>
          <View style={styles.notFound}>
            <Text style={{ color: theme.colors.text, fontSize: 16, fontWeight: '600' }}>
              Media item not found
            </Text>
            <TouchableOpacity onPress={() => router.back()} style={{ marginTop: 16 }}>
              <Text style={{ color: theme.colors.primary, fontSize: 14, fontWeight: '700' }}>Go Back</Text>
            </TouchableOpacity>
          </View>
        </SafeAreaView>
      </LinearGradient>
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
    <LinearGradient colors={palette.pageGradient} style={styles.root}>
      <SafeAreaView style={styles.root} edges={['top', 'bottom']}>
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 20 }}>
          {/* ── Clean Top Bar Above Media ── */}
          <View style={[styles.topBar, { paddingHorizontal: spacing.lg }]}>
            <TouchableOpacity
              onPress={() => router.back()}
              style={[styles.iconBtn, shadows3D.soft, { backgroundColor: theme.colors.surface }]}
            >
              <Ionicons name="chevron-back" size={20} color={theme.colors.text} />
            </TouchableOpacity>

            <View style={styles.topCenter}>
              <Text style={[styles.topTitle, { color: theme.colors.text }]}>Media Viewer</Text>
              <Text style={[styles.topSub, { color: theme.colors.textMuted }]} numberOfLines={1}>
                {photo.accountEmail}
              </Text>
            </View>

            <TouchableOpacity
              onPress={() => Alert.alert('Options', 'Share / Move / Delete')}
              style={[styles.iconBtn, shadows3D.soft, { backgroundColor: theme.colors.surface }]}
            >
              <Ionicons name="ellipsis-horizontal" size={20} color={theme.colors.text} />
            </TouchableOpacity>
          </View>

          {/* ── Main Media Card ── */}
          <View style={[styles.imageWrap, shadows3D.hero, { marginHorizontal: spacing.lg, marginTop: spacing.md }]}>
            {photo.previewUrl ? (
              <Image
                source={{ uri: photo.previewUrl }}
                style={styles.mainImage}
                contentFit="cover"
                transition={300}
                cachePolicy="memory-disk"
              />
            ) : (
              <LinearGradient
                colors={['#E8855A', '#2B2B5C']}
                style={styles.mainImage}
                start={{ x: 0.1, y: 0 }}
                end={{ x: 0.9, y: 1 }}
              />
            )}
            <View style={[styles.countBadge, { borderRadius: radius.pill }]}>
              <Text style={styles.countText}>
                {currentIndex >= 0 ? `${currentIndex + 1} of ${allPhotos.length}` : '—'}
              </Text>
            </View>
          </View>

          {/* ── Horizontal Filmstrip ── */}
          <FlatList
            data={allPhotos}
            horizontal
            showsHorizontalScrollIndicator={false}
            keyExtractor={(p) => p.id}
            contentContainerStyle={{ paddingHorizontal: spacing.lg, paddingVertical: 14 }}
            style={{ flexGrow: 0 }}
            renderItem={({ item, index }) => {
              const isActive = item.id === photo.id;
              return (
                <TouchableOpacity
                  activeOpacity={0.85}
                  onPress={() => router.replace({ pathname: '/viewer/[id]', params: { id: item.id } })}
                  style={[
                    styles.stripOuter,
                    shadows3D.soft,
                    {
                      borderWidth: isActive ? 2.5 : 0,
                      borderColor: isActive ? theme.colors.primary : 'transparent',
                      padding: isActive ? 2 : 0,
                      marginRight: 10,
                    },
                  ]}
                >
                  <View style={styles.stripInner}>
                    {item.thumbnailUrl ? (
                      <Image
                        source={{ uri: item.thumbnailUrl }}
                        style={styles.stripImg}
                        contentFit="cover"
                        cachePolicy="memory-disk"
                      />
                    ) : (
                      <LinearGradient
                        colors={STRIP_GRADIENTS[index % STRIP_GRADIENTS.length]}
                        style={styles.stripImg}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 1 }}
                      />
                    )}
                  </View>
                </TouchableOpacity>
              );
            }}
          />

          {/* ── Capture Date & Info Card ── */}
          <View
            style={[
              styles.infoCard,
              shadows3D.soft,
              {
                backgroundColor: theme.colors.surface,
                borderRadius: 22,
                marginHorizontal: spacing.lg,
                padding: 18,
              },
            ]}
          >
            <Text style={[styles.infoLabel, { color: theme.colors.textMuted }]}>Capture date</Text>
            <Text style={[styles.infoDate, { color: theme.colors.text }]}>
              {formatCaptureDate(photo.capturedAt)}
            </Text>
            {photo.metadata?.locationName && (
              <Text style={[styles.infoLoc, { color: theme.colors.textMuted }]}>
                {photo.metadata.locationName}
              </Text>
            )}

            <View style={[styles.infoGrid, { marginTop: spacing.md }]}>
              <View style={{ flex: 1 }}>
                <Text style={[styles.infoLabel, { color: theme.colors.textMuted }]}>Hardware</Text>
                <Text style={[styles.infoVal, { color: theme.colors.text }]}>
                  {photo.metadata?.cameraModel ?? '—'}
                </Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[styles.infoLabel, { color: theme.colors.textMuted }]}>File</Text>
                <Text style={[styles.infoVal, { color: theme.colors.text }]}>
                  {`${formatFileSize(photo.sizeBytes)} · ${photo.mimeType.split('/')[1]?.toUpperCase() ?? 'FILE'}`}
                </Text>
              </View>
            </View>
          </View>

          {/* ── 3D Action Tiles ── */}
          <View style={[styles.actionBar, { marginHorizontal: spacing.lg, marginTop: spacing.md }]}>
            {(['Organize', 'Download', 'Open', 'Adjust'] as const).map((action, idx) => (
              <TouchableOpacity
                key={action}
                activeOpacity={0.8}
                onPress={() => handleAction(action)}
                style={[
                  styles.actionBtn,
                  shadows3D.soft,
                  {
                    backgroundColor: theme.colors.surface,
                    borderRadius: 18,
                    marginLeft: idx === 0 ? 0 : 8,
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
          </View>
        </ScrollView>
      </SafeAreaView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  notFound: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 10,
  },
  iconBtn: {
    width: 42,
    height: 42,
    borderRadius: 21,
    alignItems: 'center',
    justifyContent: 'center',
  },
  topCenter: { flex: 1, alignItems: 'center', marginHorizontal: 10 },
  topTitle: { fontSize: 16, fontWeight: '800' },
  topSub: { fontSize: 12, marginTop: 2 },
  imageWrap: {
    height: 340,
    borderRadius: 26,
    overflow: 'hidden',
    backgroundColor: '#FFFFFF',
  },
  mainImage: { width: '100%' as const, height: '100%' as const },
  countBadge: {
    position: 'absolute',
    bottom: 14,
    left: 14,
    backgroundColor: 'rgba(14, 16, 30, 0.72)',
    paddingHorizontal: 12,
    paddingVertical: 5,
  },
  countText: { color: '#FFFFFF', fontSize: 13, fontWeight: '700' },
  stripOuter: {
    width: 60,
    height: 60,
    borderRadius: 16,
    backgroundColor: '#FFFFFF',
  },
  stripInner: {
    flex: 1,
    borderRadius: 13,
    overflow: 'hidden',
  },
  stripImg: { width: '100%' as const, height: '100%' as const },
  infoCard: {
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.9)',
  },
  infoLabel: { fontSize: 12, fontWeight: '500', marginBottom: 2 },
  infoDate: { fontSize: 18, fontWeight: '800' },
  infoLoc: { fontSize: 13, marginTop: 2 },
  infoGrid: { flexDirection: 'row', justifyContent: 'space-between' },
  infoVal: { fontSize: 14, fontWeight: '700' },
  actionBar: { flexDirection: 'row', justifyContent: 'space-between' },
  actionBtn: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 14,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.9)',
  },
  actionLabel: { fontSize: 12, fontWeight: '600', marginTop: 5 },
});
