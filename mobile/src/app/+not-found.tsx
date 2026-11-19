import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Link, Stack } from 'expo-router';
import { useTheme } from '@/theme';

export default function NotFoundScreen() {
  const { theme, spacing, typography } = useTheme();

  return (
    <>
      <Stack.Screen options={{ title: 'Oops!' }} />
      <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
        <Text style={[typography.titleLarge, { color: theme.colors.text }]}>This screen doesn't exist.</Text>
        <Link href="/" style={[styles.link, { marginTop: spacing.lg }]}>
          <Text style={[typography.bodyMedium, { color: theme.colors.primary }]}>Go to home screen</Text>
        </Link>
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  link: {
    paddingVertical: 15,
  },
});
