import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/theme';
import { useAuthStore } from '@/store/useAuthStore';
import { AppHeader } from '@/components/common/AppHeader';

export default function SettingsScreen() {
  const router = useRouter();
  const { theme, themeMode, setThemeMode, spacing, radius, typography } = useTheme();
  const { user, logout, deleteAccount } = useAuthStore();

  const handleToggleTheme = () => {
    const nextMode = themeMode === 'dark' ? 'light' : themeMode === 'light' ? 'system' : 'dark';
    setThemeMode(nextMode);
  };

  const handleLogout = () => {
    Alert.alert('Log Out', 'Are you sure you want to log out of CloudVault?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Log Out',
        style: 'destructive',
        onPress: async () => {
          await logout();
          router.replace('/(auth)/login');
        },
      },
    ]);
  };

  const handleDeleteAccount = () => {
    Alert.alert(
      'Delete CloudVault Account',
      'This will permanently revoke all connected provider tokens and delete your CloudVault profile and metadata. Cloud files on Google will remain intact.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Permanently Delete',
          style: 'destructive',
          onPress: async () => {
            await deleteAccount();
            router.replace('/(auth)/login');
          },
        },
      ]
    );
  };

  const initial = user?.name ? user.name.charAt(0).toUpperCase() : 'U';

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]} edges={['top']}>
      <AppHeader title="Settings" subtitle="Preferences & Security" />

      <ScrollView contentContainerStyle={{ padding: spacing.lg, paddingBottom: spacing.huge }}>
        {/* Profile Card */}
        <View
          style={[
            styles.sectionCard,
            {
              backgroundColor: theme.colors.surfaceElevated,
              borderRadius: radius.lg,
              borderColor: theme.colors.borderSubtle,
              padding: spacing.lg,
              marginBottom: spacing.xl,
            },
          ]}
        >
          <View style={styles.profileRow}>
            <View
              style={[
                styles.avatar,
                {
                  backgroundColor: theme.colors.primary,
                  borderRadius: radius.pill,
                },
              ]}
            >
              <Text style={[typography.titleMedium, { color: '#FFFFFF' }]}>{initial}</Text>
            </View>
            <View style={{ marginLeft: 12 }}>
              <Text style={[typography.titleSmall, { color: theme.colors.text }]}>
                {user?.name || 'CloudVault User'}
              </Text>
              <Text style={[typography.caption, { color: theme.colors.textSubtle }]}>
                {user?.email || 'user@cloudvault.app'}
              </Text>
            </View>
          </View>
        </View>

        {/* Section: Appearance */}
        <Text style={[typography.titleSmall, { color: theme.colors.text, marginBottom: spacing.sm }]}>
          Appearance
        </Text>
        <View
          style={[
            styles.sectionCard,
            {
              backgroundColor: theme.colors.surfaceElevated,
              borderRadius: radius.md,
              borderColor: theme.colors.borderSubtle,
              marginBottom: spacing.xl,
            },
          ]}
        >
          <TouchableOpacity onPress={handleToggleTheme} style={[styles.settingRow, { padding: spacing.md }]}>
            <View style={styles.settingLabelRow}>
              <Ionicons name="moon-outline" size={20} color={theme.colors.text} style={{ marginRight: 12 }} />
              <Text style={[typography.bodyMedium, { color: theme.colors.text }]}>Theme</Text>
            </View>
            <Text style={[typography.bodyMedium, { color: theme.colors.primary, textTransform: 'capitalize' }]}>
              {themeMode}
            </Text>
          </TouchableOpacity>
        </View>

        {/* Section: Privacy & Compliance */}
        <Text style={[typography.titleSmall, { color: theme.colors.text, marginBottom: spacing.sm }]}>
          Privacy & Security
        </Text>
        <View
          style={[
            styles.sectionCard,
            {
              backgroundColor: theme.colors.surfaceElevated,
              borderRadius: radius.md,
              borderColor: theme.colors.borderSubtle,
              marginBottom: spacing.xl,
            },
          ]}
        >
          <View style={[styles.settingRow, { padding: spacing.md }]}>
            <View style={styles.settingLabelRow}>
              <Ionicons name="shield-checkmark-outline" size={20} color={theme.colors.success} style={{ marginRight: 12 }} />
              <Text style={[typography.bodyMedium, { color: theme.colors.text }]}>Zero Refresh Tokens on Device</Text>
            </View>
            <Ionicons name="checkmark" size={18} color={theme.colors.success} />
          </View>

          <View style={[styles.divider, { backgroundColor: theme.colors.borderSubtle }]} />

          <View style={[styles.settingRow, { padding: spacing.md }]}>
            <View style={styles.settingLabelRow}>
              <Ionicons name="lock-closed-outline" size={20} color={theme.colors.primary} style={{ marginRight: 12 }} />
              <Text style={[typography.bodyMedium, { color: theme.colors.text }]}>AES-256 Backend Encryption</Text>
            </View>
            <Ionicons name="checkmark" size={18} color={theme.colors.success} />
          </View>

          <View style={[styles.divider, { backgroundColor: theme.colors.borderSubtle }]} />

          <TouchableOpacity
            onPress={() => Alert.alert('Privacy Policy', 'CloudVault complies with Google API Services User Data Policy.')}
            style={[styles.settingRow, { padding: spacing.md }]}
          >
            <View style={styles.settingLabelRow}>
              <Ionicons name="document-text-outline" size={20} color={theme.colors.text} style={{ marginRight: 12 }} />
              <Text style={[typography.bodyMedium, { color: theme.colors.text }]}>Privacy Policy & Terms</Text>
            </View>
            <Ionicons name="chevron-forward" size={18} color={theme.colors.textSubtle} />
          </TouchableOpacity>
        </View>

        {/* Section: Account Actions */}
        <Text style={[typography.titleSmall, { color: theme.colors.error, marginBottom: spacing.sm }]}>
          Account Session
        </Text>
        <View
          style={[
            styles.sectionCard,
            {
              backgroundColor: theme.colors.surfaceElevated,
              borderRadius: radius.md,
              borderColor: theme.colors.borderSubtle,
              marginBottom: spacing.xl,
            },
          ]}
        >
          <TouchableOpacity onPress={handleLogout} style={[styles.settingRow, { padding: spacing.md }]}>
            <View style={styles.settingLabelRow}>
              <Ionicons name="log-out-outline" size={20} color={theme.colors.warning} style={{ marginRight: 12 }} />
              <Text style={[typography.bodyMedium, { color: theme.colors.warning, fontWeight: '600' }]}>
                Log Out
              </Text>
            </View>
            <Ionicons name="chevron-forward" size={18} color={theme.colors.textSubtle} />
          </TouchableOpacity>

          <View style={[styles.divider, { backgroundColor: theme.colors.borderSubtle }]} />

          <TouchableOpacity onPress={handleDeleteAccount} style={[styles.settingRow, { padding: spacing.md }]}>
            <View style={styles.settingLabelRow}>
              <Ionicons name="trash-outline" size={20} color={theme.colors.error} style={{ marginRight: 12 }} />
              <Text style={[typography.bodyMedium, { color: theme.colors.error, fontWeight: '600' }]}>
                Delete Account & Revoke Tokens
              </Text>
            </View>
            <Ionicons name="chevron-forward" size={18} color={theme.colors.error} />
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  sectionCard: {
    borderWidth: 1,
    overflow: 'hidden',
  },
  profileRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatar: {
    width: 48,
    height: 48,
    alignItems: 'center',
    justifyContent: 'center',
  },
  settingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  settingLabelRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  divider: {
    height: 1,
  },
});
