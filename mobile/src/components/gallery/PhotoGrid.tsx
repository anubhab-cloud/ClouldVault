import React, { useMemo } from 'react';
import {
  View,
  Text,
  FlatList,
  useWindowDimensions,
  StyleSheet,
  RefreshControl,
} from 'react-native';
import { Photo } from '@cloudvault/types';
import { useTheme } from '@/theme';
import { PhotoThumbnail } from './PhotoThumbnail';
import { EmptyState } from '../common/EmptyState';
import { Ionicons } from '@expo/vector-icons';

interface PhotoGridProps {
  photos: Photo[];
  onSelectPhoto: (photo: Photo) => void;
  isRefreshing?: boolean;
  onRefresh?: () => void;
}

interface DateGroup {
  dateKey: string;
  displayDate: string;
  items: Photo[];
}

export const PhotoGrid: React.FC<PhotoGridProps> = ({
  photos,
  onSelectPhoto,
  isRefreshing = false,
  onRefresh,
}) => {
  const { theme, spacing, typography } = useTheme();
  const { width } = useWindowDimensions();

  // 3-column grid calculation
  const columns = 3;
  const itemSize = Math.floor((width - (columns - 1) * 2) / columns);

  // Group photos by human-readable date
  const groups: DateGroup[] = useMemo(() => {
    const map = new Map<string, Photo[]>();

    photos.forEach((photo) => {
      const d = new Date(photo.capturedAt);
      const dateKey = d.toISOString().split('T')[0];
      if (!map.has(dateKey)) {
        map.set(dateKey, []);
      }
      map.get(dateKey)!.push(photo);
    });

    const result: DateGroup[] = [];
    map.forEach((items, dateKey) => {
      const date = new Date(dateKey);
      const displayDate = date.toLocaleDateString(undefined, {
        weekday: 'short',
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      });
      result.push({ dateKey, displayDate, items });
    });

    return result;
  }, [photos]);

  if (photos.length === 0) {
    return (
      <EmptyState
        icon={<Ionicons name="images-outline" size={48} color={theme.colors.textSubtle} />}
        title="No Media Found"
        description="Connect a Google account or adjust your search filter to see photos."
      />
    );
  }

  return (
    <FlatList
      data={groups}
      keyExtractor={(item) => item.dateKey}
      refreshControl={
        onRefresh ? (
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={onRefresh}
            tintColor={theme.colors.primary}
            colors={[theme.colors.primary]}
          />
        ) : undefined
      }
      contentContainerStyle={{ paddingBottom: spacing.huge }}
      renderItem={({ item }) => (
        <View style={styles.groupContainer}>
          <View style={[styles.dateHeader, { paddingHorizontal: spacing.lg, paddingVertical: spacing.sm }]}>
            <Text style={[typography.titleSmall, { color: theme.colors.text }]}>
              {item.displayDate}
            </Text>
            <Text style={[typography.caption, { color: theme.colors.textSubtle }]}>
              {item.items.length} {item.items.length === 1 ? 'item' : 'items'}
            </Text>
          </View>

          <View style={styles.gridRow}>
            {item.items.map((photo) => (
              <PhotoThumbnail
                key={photo.id}
                photo={photo}
                size={itemSize}
                onPress={onSelectPhoto}
              />
            ))}
          </View>
        </View>
      )}
    />
  );
};

const styles = StyleSheet.create({
  groupContainer: {
    marginBottom: 12,
  },
  dateHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  gridRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
});
