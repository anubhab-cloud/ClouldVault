import React, { useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  useWindowDimensions,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme, palette, shadows3D } from '@/theme';
import { useAppStore } from '@/store/useAppStore';
import { useGalleryPhotos } from '@/hooks/useGalleryQuery';
import { photoService } from '@/services/photoService';
import { SearchBar } from '@/components/common/SearchBar';
import { AccountFilterPills } from '@/components/gallery/AccountFilterPill';
import { LoadingState } from '@/components/common/LoadingState';
import { EmptyState } from '@/components/common/EmptyState';
import { Photo } from '@cloudvault/types';

const HERO_GRADIENTS: [string, string][] = [
  ['#E8855A', '#2B2B5C'],
  ['#C77FDE', '#6B42C8'],
  ['#D4A45A', '#4A3418'],
  ['#5BAEDB', '#3B6DC8'],
  ['#F0855A', '#D44560'],
  ['#C4C9DC', '#8A90B0'],
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

  const {
    accounts,
    selectedAccountId,
    setSelectedAccountId,
    searchQuery,
    setSearchQuery,
    isSyncing,
    lastSyncedAt,
    triggerSync,
  } = useAppStore();

  const { data: photos = [], isLoading, refetch, isFetching } = useGalleryPhotos({
    accountId: selectedAccountId,
    search: searchQuery,
  });

  const groups = useMemo(() => groupByDate(photos), [photos]);

  const cols = 3;
  const thumbSize = Math.floor((width - spacing.lg * 2 - spacing.sm * (cols - 1)) / cols);

  const handleSelectPhoto = (photo: Photo) => {
    router.push({ pathname: '/viewer/[id]', params: { id: photo.id } });
  };

  const handleSync = async () => {
    triggerSync();
    if (selectedAccountId) await photoService.triggerDriveSync(selectedAccountId).catch(() => {});
    await refetch();
  };

  const heroGroup = groups[0];

  return (
    <LinearGradient colors={palette.pageGradient} style={styles.root}>
      <SafeAreaView style={styles.root} edges={['top']}>
        <ScrollView
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={isFetching || isSyncing}
              onRefresh={handleSync}
              tintColor={theme.colors.primary}
            />
          }
          contentContainerStyle={{ paddingBottom: 110 }}
        >
          {/* ── Header ── */}
          <View style={[styles.headerRow, { paddingHorizontal: spacing.lg, paddingTop: spacing.md }]}>
            <View>
              <Text style={[styles.headerSub, { color: theme.colors.textMuted }]}>
                {accounts.length} account{accounts.length !== 1 ? 's' : ''} · {isSyncing || isFetching ? 'syncing…' : 'live sync'}
              </Text>
              <Text style={[styles.headerTitle, { color: theme.colors.text }]}>Your Vault</Text>
            </View>
            {/* 3D Coral Sphere Avatar / Sync trigger */}
            <TouchableOpacity activeOpacity={0.85} onPress={handleSync} style={shadows3D.soft}>
              <LinearGradient
                colors={palette.coralGradient}
                start={{ x: 0.2, y: 0.1 }}
                end={{ x: 0.85, y: 0.9 }}
                style={styles.coralAvatar}
              />
            </TouchableOpacity>
          </View>

          {/* ── Search Pill ── */}
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
          ) : photos.length === 0 ? (
            <View style={{ marginTop: spacing.xxl }}>
              <EmptyState
                icon={<Ionicons name="images-outline" size={48} color={theme.colors.textSubtle} />}
                title="No Media Found"
                description="Connect a Google account or adjust your filters to view photos."
              />
            </View>
          ) : (
            <>
              {/* ── 3D Stacked Hero Cards ── */}
              {heroGroup && heroGroup.items && heroGroup.items.length > 0 && (
                <View style={[styles.heroSection, { marginHorizontal: spacing.lg, marginTop: spacing.lg }]}>
                  {/* Left tilted card */}
                  <View
                    style={[
                      styles.heroCardSide,
                      shadows3D.card,
                      {
                        left: 10,
                        transform: [{ rotate: '-8deg' }, { scale: 0.92 }],
                        borderRadius: 24,
                        zIndex: 1,
                      },
                    ]}
                  >
                    {heroGroup.items[1]?.previewUrl ? (
                      <Image
                        source={{ uri: heroGroup.items[1].previewUrl }}
                        style={styles.fillImg}
                        contentFit="cover"
                      />
                    ) : (
                      <LinearGradient
                        colors={heroGradient(1)}
                        style={styles.fillImg}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 1 }}
                      />
                    )}
                  </View>

                  {/* Right tilted card */}
                  <View
                    style={[
                      styles.heroCardSide,
                      shadows3D.card,
                      {
                        right: 10,
                        transform: [{ rotate: '7deg' }, { scale: 0.92 }],
                        borderRadius: 24,
                        zIndex: 2,
                      },
                    ]}
                  >
                    {heroGroup.items[2]?.previewUrl ? (
                      <Image
                        source={{ uri: heroGroup.items[2].previewUrl }}
                        style={styles.fillImg}
                        contentFit="cover"
                      />
                    ) : (
                      <LinearGradient
                        colors={heroGradient(2)}
                        style={styles.fillImg}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 1 }}
                      />
                    )}
                  </View>

                  {/* Front Center Card */}
                  {heroGroup.items[0] && (
                    <TouchableOpacity
                      activeOpacity={0.92}
                      onPress={() => handleSelectPhoto(heroGroup.items[0])}
                      style={[styles.heroCardFront, shadows3D.hero, { borderRadius: 26, zIndex: 10 }]}
                    >
                      {heroGroup.items[0].previewUrl ? (
                        <Image
                          source={{ uri: heroGroup.items[0].previewUrl }}
                          style={styles.fillImg}
                          contentFit="cover"
                        />
                      ) : (
                        <LinearGradient
                          colors={heroGradient(0)}
                          style={styles.fillImg}
                          start={{ x: 0.1, y: 0 }}
                          end={{ x: 0.9, y: 1 }}
                        />
                      )}
                      {/* Dark Pill Label */}
                      <View style={[styles.heroLabel, { borderRadius: radius.pill }]}>
                        <Text style={styles.heroLabelText}>
                          {heroGroup.label} · {heroGroup.count} item{heroGroup.count !== 1 ? 's' : ''}
                        </Text>
                      </View>
                    </TouchableOpacity>
                  )}
                </View>
              )}

              {/* ── Remaining Date Groups ── */}
              {groups.slice(1).map((group) => (
                <View key={group.label} style={{ marginTop: spacing.xl }}>
                  <View style={[styles.groupHeader, { paddingHorizontal: spacing.lg }]}>
                    <Text style={[styles.groupTitle, { color: theme.colors.text }]}>{group.label}</Text>
                    <Text style={[styles.groupCount, { color: theme.colors.textMuted }]}>
                      {group.count} item{group.count !== 1 ? 's' : ''}
                    </Text>
                  </View>
                  <View style={[styles.thumbRow, { paddingHorizontal: spacing.lg }]}>
                    {group.items.slice(0, 3).map((photo, i) => (
                      <TouchableOpacity
                        key={photo.id}
                        activeOpacity={0.88}
                        onPress={() => handleSelectPhoto(photo)}
                        style={[
                          styles.thumb,
                          shadows3D.soft,
                          {
                            width: thumbSize,
                            height: thumbSize,
                            borderRadius: 20,
                            backgroundColor: theme.colors.surface,
                            marginLeft: i === 0 ? 0 : spacing.sm,
                          },
                        ]}
                      >
                        {photo.thumbnailUrl ? (
                          <Image
                            source={{ uri: photo.thumbnailUrl }}
                            style={styles.fillImg}
                            contentFit="cover"
                            transition={150}
                            cachePolicy="memory-disk"
                          />
                        ) : (
                          <LinearGradient
                            colors={heroGradient(i + 3)}
                            style={styles.fillImg}
                            start={{ x: 0, y: 0 }}
                            end={{ x: 1, y: 1 }}
                          />
                        )}
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>
              ))}

              {/* ── Cross-Cloud Sync Active Banner ── */}
              <TouchableOpacity
                activeOpacity={0.88}
                onPress={handleSync}
                style={[
                  styles.syncBanner,
                  shadows3D.soft,
                  {
                    backgroundColor: theme.colors.surface,
                    borderRadius: 22,
                    marginHorizontal: spacing.lg,
                    marginTop: spacing.xl,
                  },
                ]}
              >
                <LinearGradient
                  colors={palette.indigoGradient}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 0, y: 1 }}
                  style={[styles.syncIconWrap, shadows3D.button]}
                >
                  <Ionicons name="sync" size={20} color="#FFFFFF" />
                </LinearGradient>
                <View style={{ flex: 1, marginLeft: spacing.md }}>
                  <Text style={[styles.syncTitle, { color: theme.colors.text }]}>Cross-cloud sync active</Text>
                  <Text style={[styles.syncSub, { color: theme.colors.textMuted }]}>
                    {`Synced ${formatSyncAgo(lastSyncedAt)} · originals untouched`}
                  </Text>
                </View>
              </TouchableOpacity>
            </>
          )}
        </ScrollView>
      </SafeAreaView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  headerRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  headerSub: { fontSize: 13, fontWeight: '500' },
  headerTitle: { fontSize: 32, fontWeight: '800', letterSpacing: -0.6, marginTop: 2 },
  coralAvatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    borderBottomWidth: 3,
    borderBottomColor: 'rgba(180, 40, 90, 0.35)',
  },
  heroSection: {
    height: 295,
    alignItems: 'center',
    justifyContent: 'center',
  },
  heroCardSide: {
    position: 'absolute',
    width: 195,
    height: 255,
    overflow: 'hidden',
    backgroundColor: '#FFFFFF',
  },
  heroCardFront: {
    width: 225,
    height: 275,
    overflow: 'hidden',
    backgroundColor: '#FFFFFF',
  },
  fillImg: {
    width: '100%' as const,
    height: '100%' as const,
  },
  heroLabel: {
    position: 'absolute',
    bottom: 14,
    left: 14,
    backgroundColor: 'rgba(14, 16, 30, 0.72)',
    paddingHorizontal: 14,
    paddingVertical: 6,
  },
  heroLabelText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '700',
  },
  groupHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  groupTitle: { fontSize: 19, fontWeight: '800', letterSpacing: -0.3 },
  groupCount: { fontSize: 13, fontWeight: '500' },
  thumbRow: { flexDirection: 'row' },
  thumb: { overflow: 'hidden' },
  syncBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.9)',
  },
  syncIconWrap: {
    width: 44,
    height: 44,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    borderBottomWidth: 2,
    borderBottomColor: '#3A3EB5',
  },
  syncTitle: { fontSize: 15, fontWeight: '700' },
  syncSub: { fontSize: 12, marginTop: 2 },
});
