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

export default function RegisterScreen() {
  const router = useRouter();
  const { theme, spacing, radius, typography } = useTheme();
  const { register, isLoading, error, clearError } = useAuthStore();

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const handleRegister = async () => {
    if (!name || !email || !password) return;
    try {
      await register(email, password, name);
      router.replace('/(tabs)');
    } catch {
      // Error handled by store
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      style={[styles.container, { backgroundColor: theme.colors.background }]}
    >
      <ScrollView contentContainerStyle={[styles.scrollContent, { padding: spacing.xl }]}>
        <View style={styles.brandHeader}>
          <Text style={[typography.titleLarge, { color: theme.colors.text }]}>Create Account</Text>
          <Text style={[typography.bodyMedium, { color: theme.colors.textSubtle, marginTop: 4 }]}>
            Join CloudVault to organize all your cloud memories
          </Text>
        </View>

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

        <View style={styles.formContainer}>
          <Text style={[typography.titleSmall, { color: theme.colors.text, marginBottom: spacing.xs }]}>
            Full Name
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
            placeholder="Alex Mercer"
            placeholderTextColor={theme.colors.textSubtle}
            value={name}
            onChangeText={setName}
            autoCapitalize="words"
          />

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
            Password (min 8 characters)
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
            title="Create Account"
            variant="primary"
            size="lg"
            onPress={handleRegister}
            loading={isLoading}
            disabled={!name || !email || password.length < 8}
          />
        </View>

        <View style={styles.footerRow}>
          <Text style={[typography.bodyMedium, { color: theme.colors.textSubtle }]}>
            Already have an account?
          </Text>
          <TouchableOpacity onPress={() => router.back()} style={{ marginLeft: 6 }}>
            <Text style={[typography.bodyMedium, { color: theme.colors.primary, fontWeight: '600' }]}>
              Log In
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
    marginBottom: 28,
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
