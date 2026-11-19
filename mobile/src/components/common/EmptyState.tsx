import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useTheme } from '@/theme';
import { AppButton } from './AppButton';

interface EmptyStateProps {
  icon?: React.ReactNode;
  title: string;
  description: string;
  actionTitle?: string;
  onAction?: () => void;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  icon,
  title,
  description,
  actionTitle,
  onAction,
}) => {
  const { theme, spacing, typography } = useTheme();

  return (
    <View style={[styles.container, { padding: spacing.xxl }]}>
      {icon && <View style={[styles.iconWrapper, { marginBottom: spacing.lg }]}>{icon}</View>}
      <Text style={[typography.titleMedium, { color: theme.colors.text, textAlign: 'center' }]}>
        {title}
      </Text>
      <Text
        style={[
          typography.bodyMedium,
          {
            color: theme.colors.textSubtle,
            textAlign: 'center',
            marginTop: spacing.xs,
            marginBottom: actionTitle ? spacing.xl : 0,
          },
        ]}
      >
        {description}
      </Text>
      {actionTitle && onAction && (
        <AppButton title={actionTitle} onPress={onAction} variant="primary" size="md" />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconWrapper: {
    alignItems: 'center',
    justifyContent: 'center',
  },
});
