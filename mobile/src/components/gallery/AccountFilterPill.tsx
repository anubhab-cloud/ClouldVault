import React from 'react';
import { ScrollView, TouchableOpacity, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { ConnectedAccount } from '@cloudvault/types';
import { useTheme } from '@/theme';

interface AccountFilterPillsProps {
  accounts: ConnectedAccount[];
  selectedAccountId: string | null;
  onSelectAccount: (accountId: string | null) => void;
}

export const AccountFilterPills: React.FC<AccountFilterPillsProps> = ({
  accounts,
  selectedAccountId,
  onSelectAccount,
}) => {
  const { theme, radius, spacing, typography } = useTheme();

  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={[styles.container, { paddingHorizontal: spacing.lg, paddingBottom: spacing.sm }]}
    >
      {/* All Accounts Option */}
      <TouchableOpacity
        activeOpacity={0.7}
        onPress={() => onSelectAccount(null)}
        style={[
          styles.pill,
          {
            borderRadius: radius.pill,
            backgroundColor: selectedAccountId === null ? theme.colors.primary : theme.colors.surfaceElevated,
            borderColor: selectedAccountId === null ? theme.colors.primary : theme.colors.borderSubtle,
            paddingHorizontal: spacing.md,
            paddingVertical: spacing.xs + 2,
            marginRight: spacing.sm,
          },
        ]}
      >
        <Ionicons
          name="layers-outline"
          size={14}
          color={selectedAccountId === null ? theme.colors.primaryContent : theme.colors.textMuted}
          style={styles.icon}
        />
        <Text
          style={[
            typography.caption,
            {
              fontWeight: '600',
              color: selectedAccountId === null ? theme.colors.primaryContent : theme.colors.textMuted,
            },
          ]}
        >
          All Accounts
        </Text>
      </TouchableOpacity>

      {/* Individual Account Options */}
      {accounts.map((acc) => {
        const isSelected = selectedAccountId === acc.id;
        const shortName = acc.email.split('@')[0];

        return (
          <TouchableOpacity
            key={acc.id}
            activeOpacity={0.7}
            onPress={() => onSelectAccount(acc.id)}
            style={[
              styles.pill,
              {
                borderRadius: radius.pill,
                backgroundColor: isSelected ? theme.colors.primary : theme.colors.surfaceElevated,
                borderColor: isSelected ? theme.colors.primary : theme.colors.borderSubtle,
                paddingHorizontal: spacing.md,
                paddingVertical: spacing.xs + 2,
                marginRight: spacing.sm,
              },
            ]}
          >
            <Ionicons
              name={acc.provider === 'google-drive' ? 'logo-google' : 'images-outline'}
              size={13}
              color={isSelected ? theme.colors.primaryContent : theme.colors.textMuted}
              style={styles.icon}
            />
            <Text
              style={[
                typography.caption,
                {
                  fontWeight: '600',
                  color: isSelected ? theme.colors.primaryContent : theme.colors.textMuted,
                },
              ]}
              numberOfLines={1}
            >
              {shortName}
            </Text>
          </TouchableOpacity>
        );
      })}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
  },
  icon: {
    marginRight: 6,
  },
});
