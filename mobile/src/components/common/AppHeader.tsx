import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useTheme } from '@/theme';

interface AppHeaderProps {
  title: string;
  subtitle?: string;
  rightAction?: React.ReactNode;
  leftAction?: React.ReactNode;
}

export const AppHeader: React.FC<AppHeaderProps> = ({
  title,
  subtitle,
  rightAction,
  leftAction,
}) => {
  const { theme, spacing, typography } = useTheme();

  return (
    <View
      style={[
        styles.container,
        {
          paddingHorizontal: spacing.lg,
          paddingTop: spacing.md,
          paddingBottom: spacing.sm,
          backgroundColor: theme.colors.background,
        },
      ]}
    >
      <View style={styles.contentRow}>
        {leftAction && <View style={styles.actionContainer}>{leftAction}</View>}
        <View style={styles.titleContainer}>
          <Text style={[typography.titleLarge, { color: theme.colors.text }]}>{title}</Text>
          {subtitle && (
            <Text style={[typography.caption, { color: theme.colors.textSubtle, marginTop: 2 }]}>
              {subtitle}
            </Text>
          )}
        </View>
        {rightAction && <View style={styles.actionContainer}>{rightAction}</View>}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: '100%',
  },
  contentRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  titleContainer: {
    flex: 1,
  },
  actionContainer: {
    marginLeft: 8,
  },
});
