import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/theme';
import { useAuthStore } from '@/store/useAuthStore';
import { AppButton } from '@/components/common/AppButton';

export default function LoginScreen() {
  const router = useRouter();
  const { theme, spacing, radius, typography } = useTheme();
  const { login, loginDemo, isLoading, error, clearError } = useAuthStore();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const handleLogin = async () => {
    if (!email || !password) return;
    try {
      await login(email, password);
      router.replace('/(tabs)');
    } catch {
      // Error handled by store
    }
  };

  const handleDemoLogin = async () => {
    await loginDemo();
    router.replace('/(tabs)');
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      style={[styles.container, { backgroundColor: theme.colors.background }]}
    >
      <ScrollView contentContainerStyle={[styles.scrollContent, { padding: spacing.xl }]}>
        {/* Brand Header */}
        <View style={styles.brandHeader}>
          <View
            style={[
              styles.logoCircle,
              {
                backgroundColor: theme.colors.primary,
                borderRadius: radius.pill,
                marginBottom: spacing.md,
              },
            ]}
          >
            <Ionicons name="cloud-circle-outline" size={40} color="#FFFFFF" />
          </View>
          <Text style={[typography.display, { color: theme.colors.text }]}>CloudVault</Text>
          <Text style={[typography.bodyMedium, { color: theme.colors.textSubtle, marginTop: 4 }]}>
            All your memories. One place.
          </Text>
        </View>

        {/* Error Banner */}
        {error && (
          <View
            style={[
              styles.errorBanner,
              {
                backgroundColor: 'rgba(239, 68, 68, 0.12)',
                borderColor: theme.colors.error,
                borderRadius: radius.md,
                padding: spacing.md,
                marginBottom: spacing.lg,
              },
            ]}
          >
            <Ionicons name="alert-circle" size={18} color={theme.colors.error} style={{ marginRight: 8 }} />
            <Text style={[typography.caption, { color: theme.colors.error, flex: 1 }]}>{error}</Text>
            <TouchableOpacity onPress={clearError}>
              <Ionicons name="close" size={16} color={theme.colors.error} />
            </TouchableOpacity>
          </View>
        )}

        {/* Inputs */}
        <View style={styles.formContainer}>
          <Text style={[typography.titleSmall, { color: theme.colors.text, marginBottom: spacing.xs }]}>
            Email Address
          </Text>
          <TextInput
            style={[
              styles.input,
              typography.bodyMedium,
              {
                color: theme.colors.text,
                backgroundColor: theme.colors.surfaceElevated,
                borderColor: theme.colors.borderSubtle,
                borderRadius: radius.md,
                padding: spacing.md,
                marginBottom: spacing.lg,
              },
            ]}
            placeholder="you@domain.com"
            placeholderTextColor={theme.colors.textSubtle}
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoCapitalize="none"
            autoCorrect={false}
          />

          <Text style={[typography.titleSmall, { color: theme.colors.text, marginBottom: spacing.xs }]}>
            Password
          </Text>
          <View
            style={[
              styles.passwordWrapper,
              {
                backgroundColor: theme.colors.surfaceElevated,
                borderColor: theme.colors.borderSubtle,
                borderRadius: radius.md,
                marginBottom: spacing.xl,
              },
            ]}
          >
            <TextInput
              style={[
                styles.passwordInput,
                typography.bodyMedium,
                {
                  color: theme.colors.text,
                  padding: spacing.md,
                },
              ]}
              placeholder="Enter password"
              placeholderTextColor={theme.colors.textSubtle}
              value={password}
              onChangeText={setPassword}
              secureTextEntry={!showPassword}
              autoCapitalize="none"
            />
            <TouchableOpacity
              onPress={() => setShowPassword(!showPassword)}
              style={{ paddingHorizontal: spacing.md }}
            >
              <Ionicons
                name={showPassword ? 'eye-off-outline' : 'eye-outline'}
                size={20}
                color={theme.colors.textSubtle}
              />
            </TouchableOpacity>
          </View>

          <AppButton
            title="Log In"
            variant="primary"
            size="lg"
            onPress={handleLogin}
            loading={isLoading}
            disabled={!email || !password}
          />

          <View style={{ marginVertical: spacing.md }}>
            <AppButton
              title="Quick Demo Access"
              variant="secondary"
              size="md"
              onPress={handleDemoLogin}
            />
          </View>
        </View>

        {/* Switch to Register */}
        <View style={styles.footerRow}>
          <Text style={[typography.bodyMedium, { color: theme.colors.textSubtle }]}>
            Don't have a CloudVault account?
          </Text>
          <TouchableOpacity onPress={() => router.push('/(auth)/register')} style={{ marginLeft: 6 }}>
            <Text style={[typography.bodyMedium, { color: theme.colors.primary, fontWeight: '600' }]}>
              Register
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
  },
  brandHeader: {
    alignItems: 'center',
    marginBottom: 32,
  },
  logoCircle: {
    width: 64,
    height: 64,
    alignItems: 'center',
    justifyContent: 'center',
  },
  errorBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
  },
  formContainer: {
    width: '100%',
  },
  input: {
    borderWidth: 1,
  },
  passwordWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
  },
  passwordInput: {
    flex: 1,
  },
  footerRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 24,
  },
});
