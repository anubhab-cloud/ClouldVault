import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useTheme } from '@/theme';

interface BadgeProps {
  label: string;
  variant?: 'primary' | 'success' | 'warning' | 'error' | 'neutral';
  icon?: React.ReactNode;
}

export const Badge: React.FC<BadgeProps> = ({ label, variant = 'neutral', icon }) => {
  const { theme, radius, spacing, typography } = useTheme();

  const getColors = () => {
    switch (variant) {
      case 'primary':
        return { bg: theme.colors.surfaceElevated, text: theme.colors.primary };
      case 'success':
        return { bg: 'rgba(16, 185, 129, 0.15)', text: theme.colors.success };
      case 'warning':
        return { bg: 'rgba(245, 158, 11, 0.15)', text: theme.colors.warning };
      case 'error':
        return { bg: 'rgba(239, 68, 68, 0.15)', text: theme.colors.error };
      case 'neutral':
      default:
        return { bg: theme.colors.surfaceElevated, text: theme.colors.textMuted };
    }
  };

  const colors = getColors();

  return (
    <View
      style={[
        styles.badge,
        {
          backgroundColor: colors.bg,
          borderRadius: radius.pill,
          paddingHorizontal: spacing.sm + 2,
          paddingVertical: spacing.xxs + 1,
        },
      ]}
    >
      {icon && <View style={{ marginRight: 4 }}>{icon}</View>}
      <Text style={[typography.micro, { color: colors.text }]}>{label}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
  },
});
