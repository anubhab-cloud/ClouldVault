import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { ConnectedAccount } from '@cloudvault/types';
import { useTheme } from '@/theme';
import { Badge } from '../common/Badge';

interface AccountCardProps {
  account: ConnectedAccount;
  onDisconnect?: (account: ConnectedAccount) => void;
  onReauthorize?: (account: ConnectedAccount) => void;
  onPickPhotos?: (account: ConnectedAccount) => void;
}

export const AccountCard: React.FC<AccountCardProps> = ({
  account,
  onDisconnect,
  onReauthorize,
  onPickPhotos,
}) => {
  const { theme, radius, spacing, typography } = useTheme();

  const getStatusBadge = () => {
    switch (account.status) {
      case 'active':
        return <Badge label="Active" variant="success" />;
      case 'expired':
        return <Badge label="Needs Auth" variant="warning" />;
      case 'revoked':
        return <Badge label="Revoked" variant="error" />;
      case 'error':
        return <Badge label="Sync Error" variant="error" />;
    }
  };

  return (
    <View
      style={[
        styles.card,
        {
          backgroundColor: theme.colors.surfaceElevated,
          borderRadius: radius.lg,
          borderColor: theme.colors.borderSubtle,
          padding: spacing.lg,
          marginBottom: spacing.md,
        },
      ]}
    >
      <View style={styles.headerRow}>
        <View style={styles.providerRow}>
          <View
            style={[
              styles.iconWrapper,
              {
                backgroundColor: theme.colors.surfaceSubtle,
                borderRadius: radius.md,
              },
            ]}
          >
            <Ionicons
              name={account.provider === 'google-drive' ? 'logo-google' : 'images'}
              size={20}
              color={theme.colors.primary}
            />
          </View>
          <View style={styles.infoCol}>
            <Text style={[typography.titleSmall, { color: theme.colors.text }]} numberOfLines={1}>
              {account.email}
            </Text>
            <Text style={[typography.caption, { color: theme.colors.textSubtle }]}>
              {account.provider === 'google-drive' ? 'Google Drive' : 'Google Photos Picker'}
            </Text>
          </View>
        </View>

        {getStatusBadge()}
      </View>

      <View style={[styles.divider, { backgroundColor: theme.colors.borderSubtle, marginVertical: spacing.md }]} />

      <View style={styles.actionsRow}>
        <Text style={[typography.caption, { color: theme.colors.textSubtle }]}>
          Added {new Date(account.createdAt).toLocaleDateString()}
        </Text>

        <View style={styles.buttonGroup}>
          {account.provider === 'google-photos' && onPickPhotos && (
            <TouchableOpacity
              onPress={() => onPickPhotos(account)}
              style={[styles.actionBtn, { marginRight: spacing.md }]}
            >
              <Text style={[typography.caption, { color: theme.colors.primary, fontWeight: '600' }]}>
                Pick Photos
              </Text>
            </TouchableOpacity>
          )}

          {account.status === 'expired' && onReauthorize && (
            <TouchableOpacity
              onPress={() => onReauthorize(account)}
              style={[styles.actionBtn, { marginRight: spacing.md }]}
            >
              <Text style={[typography.caption, { color: theme.colors.primary, fontWeight: '600' }]}>
                Reauthorize
              </Text>
            </TouchableOpacity>
          )}

          {onDisconnect && (
            <TouchableOpacity onPress={() => onDisconnect(account)} style={styles.actionBtn}>
              <Text style={[typography.caption, { color: theme.colors.error, fontWeight: '600' }]}>
                Disconnect
              </Text>
            </TouchableOpacity>
          )}
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    borderWidth: 1,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  providerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginRight: 8,
  },
  iconWrapper: {
    width: 38,
    height: 38,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  infoCol: {
    flex: 1,
  },
  divider: {
    height: 1,
  },
  actionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  buttonGroup: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  actionBtn: {
    paddingVertical: 4,
    paddingHorizontal: 8,
  },
});
