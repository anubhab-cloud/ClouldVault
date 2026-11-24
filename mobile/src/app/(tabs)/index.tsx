import React, { useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  FlatList,
  useWindowDimensions,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '@/theme';
import { useAppStore } from '@/store/useAppStore';
import { useGalleryPhotos } from '@/hooks/useGalleryQuery';
import { photoService } from '@/services/photoService';
import { SearchBar } from '@/components/common/SearchBar';
import { AccountFilterPills } from '@/components/gallery/AccountFilterPill';
import { LoadingState } from '@/components/common/LoadingState';
import { Photo } from '@cloudvault/types';

// 8 gradients for "stacked card" hero thumbnails
const HERO_GRADIENTS: [string, string][] = [
  ['#E8855A', '#8B4FA0'],
  ['#5BAEDB', '#3B6DC8'],
  ['#D4A45A', '#7A5B2E'],
  ['#C77FDE', '#6B42C8'],
  ['#C4C9DC', '#8A90B0'],
  ['#F0855A', '#D44560'],
  ['#5BC4AE', '#2B7E6E'],
  ['#E8C55A', '#B08020'],
];

function heroGradient(index: number): [string, string] {
  return HERO_GRADIENTS[index % HERO_GRADIENTS.length];
}

function formatSyncAgo(date: Date): string {
  const mins = Math.floor((Date.now() - date.getTime()) / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins} min ago`;
  return `${Math.floor(mins / 60)}h ago`;
}

function groupByDate(photos: Photo[]): { label: string; count: number; items: Photo[] }[] {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const yesterday = new Date(today);
  yesterday.setDate(today.getDate() - 1);

  const map = new Map<string, Photo[]>();
  photos.forEach((p) => {
    const d = new Date(p.capturedAt);
    d.setHours(0, 0, 0, 0);
    const key = d.getTime().toString();
    if (!map.has(key)) map.set(key, []);
    map.get(key)!.push(p);
  });

  const result: { label: string; count: number; items: Photo[]; ts: number }[] = [];
  map.forEach((items, key) => {
    const ts = Number(key);
    const d = new Date(ts);
    let label: string;
    if (ts === today.getTime()) label = 'Today';
    else if (ts === yesterday.getTime()) label = 'Yesterday';
    else
      label = d.toLocaleDateString(undefined, {
        weekday: 'short',
        month: 'short',
        day: 'numeric',
      });
    result.push({ label, count: items.length, items, ts });
  });

  return result.sort((a, b) => b.ts - a.ts);
}

export default function GalleryScreen() {
  const router = useRouter();
  const { theme, spacing, radius } = useTheme();
  const { width } = useWindowDimensions();

  const { accounts, selectedAccountId, setSelectedAccountId, searchQuery, setSearchQuery, isSyncing, triggerSync } =
    useAppStore();

  const { data: photos = [], isLoading, refetch, isFetching } = useGalleryPhotos({
    accountId: selectedAccountId,
    search: searchQuery,
  });

  const groups = useMemo(() => groupByDate(photos), [photos]);

  const cols = 3;
  const thumbSize = Math.floor((width - (cols - 1) * 2) / cols);

  const handleSelectPhoto = (photo: Photo) => {
    router.push({ pathname: '/viewer/[id]', params: { id: photo.id } });
  };

  const handleSync = async () => {
    triggerSync();
    if (selectedAccountId) await photoService.triggerDriveSync(selectedAccountId).catch(() => {});
    await refetch();
  };

  // "today" hero group for the stacked 3D card at the top
  const heroGroup = groups[0];

  return (
    <SafeAreaView style={[styles.root, { backgroundColor: theme.colors.background }]} edges={['top']}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={isFetching || isSyncing}
            onRefresh={handleSync}
            tintColor={theme.colors.primary}
          />
        }
        contentContainerStyle={{ paddingBottom: 100 }}
      >
        {/* ── Header ── */}
        <View style={[styles.headerRow, { paddingHorizontal: spacing.lg, paddingTop: spacing.md }]}>
          <View>
            <Text style={[styles.headerSub, { color: theme.colors.textSubtle }]}>
              {accounts.length} account{accounts.length !== 1 ? 's' : ''} · {isSyncing ? 'syncing…' : 'live sync'}
            </Text>
            <Text style={[styles.headerTitle, { color: theme.colors.text }]}>Your Vault</Text>
          </View>
          {/* Avatar / sync button */}
          <TouchableOpacity
            activeOpacity={0.75}
            onPress={handleSync}
            style={[styles.avatarBtn, { backgroundColor: theme.colors.primary }]}
          >
            <Ionicons name={isSyncing || isFetching ? 'sync' : 'sync-outline'} size={16} color="#FFF" />
          </TouchableOpacity>
        </View>

        {/* ── Search ── */}
        <View style={{ marginHorizontal: spacing.lg, marginTop: spacing.md }}>
          <SearchBar value={searchQuery} onChangeText={setSearchQuery} />
        </View>

        {/* ── Account filter pills ── */}
        <View style={{ marginTop: spacing.sm }}>
          <AccountFilterPills
            accounts={accounts}
            selectedAccountId={selectedAccountId}
            onSelectAccount={setSelectedAccountId}
          />
        </View>

        {isLoading ? (
          <LoadingState message="Loading cloud gallery…" />
        ) : (
          <>
            {/* ── Hero stacked card (most recent group) ── */}
            {heroGroup && (
              <View style={[styles.heroSection, { marginHorizontal: spacing.lg, marginTop: spacing.xl }]}>
                {/* Back cards */}
                {[2, 1].map((offset) => {
                  const idx = heroGroup.items.length - 1 - offset;
                  const item = heroGroup.items[idx] || heroGroup.items[0];
                  const rot = offset === 2 ? '-10deg' : '8deg';
                  const marginLeft = offset === 2 ? -20 : 0;
                  return (
                    <View
                      key={`hero-bg-${offset}`}
                      style={[
                        styles.heroCardBg,
                        {
                          transform: [{ rotate: rot }],
                          marginLeft,
                          borderRadius: radius.xl,
                          zIndex: offset,
                        },
                      ]}
                    >
                      {item.previewUrl ? (
                        <Image
                          source={{ uri: item.previewUrl }}
                          style={[styles.heroCardBg, { borderRadius: radius.xl }]}
                          contentFit="cover"
                        />
                      ) : (
                        <LinearGradient
                          colors={heroGradient(offset + 1)}
                          style={[styles.heroCardBg, { borderRadius: radius.xl }]}
                          start={{ x: 0, y: 0 }}
                          end={{ x: 1, y: 1 }}
                        />
                      )}
                    </View>
                  );
                })}

                {/* Front card */}
                <View style={[styles.heroCardFront, { borderRadius: radius.xl, zIndex: 10 }]}>
                  {heroGroup.items[0].previewUrl ? (
                    <Image
                      source={{ uri: heroGroup.items[0].previewUrl }}
                      style={[styles.heroCardFront, { borderRadius: radius.xl }]}
                      contentFit="cover"
                    />
                  ) : (
                    <LinearGradient
                      colors={heroGradient(0)}
                      style={[styles.heroCardFront, { borderRadius: radius.xl }]}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 1 }}
                    />
                  )}
                  {/* Label */}
                  <View style={[styles.heroLabel, { borderRadius: radius.pill, bottom: 16, left: 16 }]}>
                    <Text style={styles.heroLabelText}>
                      {heroGroup.label} · {heroGroup.count} item{heroGroup.count !== 1 ? 's' : ''}
                    </Text>
                  </View>
                </View>
              </View>
            )}

            {/* ── Remaining groups ── */}
            {groups.slice(1).map((group) => (
              <View key={group.label} style={{ marginTop: spacing.xl }}>
                <View style={[styles.groupHeader, { paddingHorizontal: spacing.lg }]}>
                  <Text style={[styles.groupTitle, { color: theme.colors.text }]}>{group.label}</Text>
                  <Text style={[styles.groupCount, { color: theme.colors.textSubtle }]}>
                    {group.count} item{group.count !== 1 ? 's' : ''}
                  </Text>
                </View>
                <View style={styles.thumbRow}>
                  {group.items.slice(0, 3).map((photo, i) => (
                    <TouchableOpacity
                      key={photo.id}
                      activeOpacity={0.85}
                      onPress={() => handleSelectPhoto(photo)}
                      style={[
                        styles.thumb,
                        {
                          width: thumbSize,
                          height: thumbSize,
                          borderRadius: radius.md,
                          backgroundColor: theme.colors.surfaceSubtle,
                          marginLeft: i === 0 ? spacing.lg : spacing.sm,
                        },
                      ]}
                    >
                      {photo.thumbnailUrl ? (
                        <Image
                          source={{ uri: photo.thumbnailUrl }}
                          style={[styles.thumbImg, { borderRadius: radius.md }]}
                          contentFit="cover"
                          transition={150}
                          cachePolicy="memory-disk"
                        />
                      ) : (
                        <LinearGradient
                          colors={heroGradient(i)}
                          style={[styles.thumbImg, { borderRadius: radius.md }]}
                          start={{ x: 0, y: 0 }}
                          end={{ x: 1, y: 1 }}
                        />
                      )}
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
            ))}

            {/* ── Sync status banner ── */}
            <View
              style={[
                styles.syncBanner,
                {
                  backgroundColor: theme.colors.surface,
                  borderRadius: radius.lg,
                  marginHorizontal: spacing.lg,
                  marginTop: spacing.xl,
                },
              ]}
            >
              <View style={[styles.syncIconWrap, { backgroundColor: '#EEF0FF', borderRadius: radius.md }]}>
                <Ionicons name="sync-circle" size={24} color={theme.colors.primary} />
              </View>
              <View style={{ flex: 1, marginLeft: spacing.md }}>
                <Text style={[styles.syncTitle, { color: theme.colors.text }]}>Cross-cloud sync active</Text>
                <Text style={[styles.syncSub, { color: theme.colors.textSubtle }]}>
                  {`Synced ${formatSyncAgo(new Date())} · originals untouched`}
                </Text>
              </View>
            </View>
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  headerRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  headerSub: { fontSize: 13, fontWeight: '400' },
  headerTitle: { fontSize: 32, fontWeight: '800', letterSpacing: -0.5, marginTop: 2 },
  avatarBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  // Hero stacked card
  heroSection: { height: 320, alignItems: 'center' as const, justifyContent: 'center' as const },
  heroCardBg: { position: 'absolute' as const, width: 240, height: 300 },
  heroCardFront: { width: 260, height: 308, overflow: 'hidden' as const },
  heroLabel: {
    position: 'absolute',
    backgroundColor: 'rgba(10,10,20,0.68)',
    paddingHorizontal: 14,
    paddingVertical: 7,
  },
  heroLabelText: { color: '#FFF', fontSize: 14, fontWeight: '700' },
  // Group rows
  groupHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 },
  groupTitle: { fontSize: 20, fontWeight: '700' },
  groupCount: { fontSize: 13 },
  thumbRow: { flexDirection: 'row' },
  thumb: { overflow: 'hidden' },
  thumbImg: { width: '100%' as const, height: '100%' as const },
  // Sync banner
  syncBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
  },
  syncIconWrap: { width: 44, height: 44, alignItems: 'center', justifyContent: 'center' },
  syncTitle: { fontSize: 15, fontWeight: '700' },
  syncSub: { fontSize: 12, marginTop: 2 },
});
