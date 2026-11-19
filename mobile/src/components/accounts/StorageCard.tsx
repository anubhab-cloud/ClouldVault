import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { StorageDashboardSummary } from '@cloudvault/types';
import { useTheme } from '@/theme';

interface StorageCardProps {
  storage: StorageDashboardSummary;
}

export const StorageCard: React.FC<StorageCardProps> = ({ storage }) => {
  const { theme, radius, spacing, typography } = useTheme();

  const formatBytes = (bytes: number): string => {
    if (bytes === 0) return '0 GB';
    const gb = bytes / (1024 * 1024 * 1024);
    return `${gb.toFixed(1)} GB`;
  };

  const usedPercentage = Math.min(
    Math.round((storage.totalUsedBytes / (storage.totalQuotaBytes || 1)) * 100),
    100
  );

  return (
    <View
      style={[
        styles.card,
        {
          backgroundColor: theme.colors.surfaceElevated,
          borderRadius: radius.lg,
          borderColor: theme.colors.borderSubtle,
          padding: spacing.lg,
          marginBottom: spacing.xl,
        },
      ]}
    >
      <View style={styles.titleRow}>
        <Text style={[typography.titleSmall, { color: theme.colors.text }]}>
          Total Cloud Storage
        </Text>
        <Text style={[typography.caption, { color: theme.colors.textSubtle }]}>
          Updated {new Date(storage.lastUpdated).toLocaleDateString()}
        </Text>
      </View>

      <View style={[styles.statRow, { marginVertical: spacing.md }]}>
        <Text style={[typography.display, { color: theme.colors.text }]}>
          {formatBytes(storage.totalUsedBytes)}
        </Text>
        <Text style={[typography.bodyLarge, { color: theme.colors.textSubtle, marginLeft: spacing.xs }]}>
          / {formatBytes(storage.totalQuotaBytes)}
        </Text>
      </View>

      {/* Progress Bar */}
      <View
        style={[
          styles.track,
          {
            backgroundColor: theme.colors.surfaceSubtle,
            borderRadius: radius.pill,
            height: 10,
          },
        ]}
      >
        <View
          style={[
            styles.fill,
            {
              width: `${usedPercentage}%`,
              backgroundColor: usedPercentage > 85 ? theme.colors.warning : theme.colors.primary,
              borderRadius: radius.pill,
            },
          ]}
        />
      </View>

      {/* Per-account breakdowns */}
      <View style={[styles.breakdownList, { marginTop: spacing.lg }]}>
        {storage.accounts.map(({ account, usage }) => {
          if (!usage) return null;
          const accPercent = usage.quotaBytes
            ? Math.round((usage.usedBytes / usage.quotaBytes) * 100)
            : 0;

          return (
            <View key={account.id} style={[styles.accountUsageRow, { marginTop: spacing.sm }]}>
              <View style={styles.accLabel}>
                <View
                  style={[
                    styles.dot,
                    {
                      backgroundColor:
                        account.provider === 'google-drive' ? theme.colors.primary : theme.colors.info,
                    },
                  ]}
                />
                <Text style={[typography.caption, { color: theme.colors.text }]} numberOfLines={1}>
                  {account.email}
                </Text>
              </View>
              <Text style={[typography.caption, { color: theme.colors.textMuted }]}>
                {formatBytes(usage.usedBytes)} ({accPercent}%)
              </Text>
            </View>
          );
        })}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    borderWidth: 1,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  statRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
  },
  track: {
    width: '100%',
    overflow: 'hidden',
  },
  fill: {
    height: '100%',
  },
  breakdownList: {
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.06)',
    paddingTop: 12,
  },
  accountUsageRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  accLabel: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginRight: 12,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 8,
  },
});
