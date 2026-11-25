import React from 'react';
import { ScrollView, TouchableOpacity, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { ConnectedAccount } from '@cloudvault/types';
import { useTheme, shadows3D } from '@/theme';

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
      contentContainerStyle={[styles.container, { paddingHorizontal: spacing.lg, paddingVertical: spacing.xs }]}
    >
      {/* All Accounts Option */}
      <TouchableOpacity
        activeOpacity={0.75}
        onPress={() => onSelectAccount(null)}
        style={[
          styles.pill,
          shadows3D.soft,
          {
            borderRadius: radius.pill,
            backgroundColor: selectedAccountId === null ? theme.colors.text : theme.colors.surface,
            borderColor: selectedAccountId === null ? theme.colors.text : 'rgba(255, 255, 255, 0.9)',
            paddingHorizontal: spacing.lg,
            paddingVertical: spacing.sm + 1,
            marginRight: spacing.sm,
          },
        ]}
      >
        <Text
          style={[
            typography.caption,
            {
              fontWeight: '700',
              color: selectedAccountId === null ? theme.colors.surface : theme.colors.text,
            },
          ]}
        >
          All accounts
        </Text>
      </TouchableOpacity>

      {/* Individual Account Options */}
      {accounts.map((acc) => {
        const isSelected = selectedAccountId === acc.id;
        const shortName = acc.email.split('@')[0];

        return (
          <TouchableOpacity
            key={acc.id}
            activeOpacity={0.75}
            onPress={() => onSelectAccount(acc.id)}
            style={[
              styles.pill,
              shadows3D.soft,
              {
                borderRadius: radius.pill,
                backgroundColor: isSelected ? theme.colors.text : theme.colors.surface,
                borderColor: isSelected ? theme.colors.text : 'rgba(255, 255, 255, 0.9)',
                paddingHorizontal: spacing.lg,
                paddingVertical: spacing.sm + 1,
                marginRight: spacing.sm,
              },
            ]}
          >
            <Text
              style={[
                typography.caption,
                {
                  fontWeight: '600',
                  color: isSelected ? theme.colors.surface : theme.colors.text,
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
