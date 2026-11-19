import React from 'react';
import { View, StyleSheet, TouchableOpacity, Text } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/theme';
import { useAppStore } from '@/store/useAppStore';
import { useGalleryPhotos } from '@/hooks/useGalleryQuery';
import { photoService } from '@/services/photoService';
import { AppHeader } from '@/components/common/AppHeader';
import { SearchBar } from '@/components/common/SearchBar';
import { AccountFilterPills } from '@/components/gallery/AccountFilterPill';
import { PhotoGrid } from '@/components/gallery/PhotoGrid';
import { LoadingState } from '@/components/common/LoadingState';
import { Photo } from '@cloudvault/types';

export default function GalleryScreen() {
  const router = useRouter();
  const { theme, spacing, radius } = useTheme();

  const {
    accounts,
    selectedAccountId,
    setSelectedAccountId,
    searchQuery,
    setSearchQuery,
    isSyncing,
    triggerSync,
  } = useAppStore();

  // Query gallery photos using TanStack Query
  const {
    data: photos = [],
    isLoading,
    refetch,
    isFetching,
  } = useGalleryPhotos({
    accountId: selectedAccountId,
    search: searchQuery,
  });

  const handleSelectPhoto = (photo: Photo) => {
    router.push({
      pathname: '/viewer/[id]',
      params: { id: photo.id },
    });
  };

  const handleSync = async () => {
    triggerSync();
    if (selectedAccountId) {
      await photoService.triggerDriveSync(selectedAccountId).catch(() => {});
    }
    await refetch();
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]} edges={['top']}>
      {/* App Header with sync action */}
      <AppHeader
        title="CloudVault"
        subtitle={`${photos.length} photos & videos`}
        rightAction={
          <TouchableOpacity
            activeOpacity={0.7}
            onPress={handleSync}
            style={[
              styles.syncBtn,
              {
                backgroundColor: theme.colors.surfaceElevated,
                borderRadius: radius.pill,
                paddingHorizontal: spacing.md,
                paddingVertical: spacing.xs,
              },
            ]}
          >
            <Ionicons
              name={isSyncing || isFetching ? 'sync' : 'sync-outline'}
              size={14}
              color={theme.colors.primary}
              style={{ marginRight: 4 }}
            />
            <Text style={{ color: theme.colors.text, fontSize: 12, fontWeight: '600' }}>
              {isSyncing || isFetching ? 'Syncing...' : 'Sync'}
            </Text>
          </TouchableOpacity>
        }
      />

      {/* Search Input */}
      <SearchBar value={searchQuery} onChangeText={setSearchQuery} />

      {/* Account Filter Pills */}
      <View style={{ marginBottom: spacing.xs }}>
        <AccountFilterPills
          accounts={accounts}
          selectedAccountId={selectedAccountId}
          onSelectAccount={setSelectedAccountId}
        />
      </View>

      {/* Photo Grid */}
      {isLoading ? (
        <LoadingState message="Loading cloud gallery..." />
      ) : (
        <PhotoGrid
          photos={photos}
          onSelectPhoto={handleSelectPhoto}
          isRefreshing={isFetching || isSyncing}
          onRefresh={handleSync}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  syncBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
});
