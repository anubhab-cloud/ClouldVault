import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Alert, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as Linking from 'expo-linking';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/theme';
import { useAppStore } from '@/store/useAppStore';
import { AppHeader } from '@/components/common/AppHeader';
import { AppButton } from '@/components/common/AppButton';
import { AccountCard } from '@/components/accounts/AccountCard';
import { StorageCard } from '@/components/accounts/StorageCard';
import { accountService } from '@/services/accountService';
import { storageService } from '@/services/storageService';
import { googlePhotosService } from '@/services/googlePhotosService';
import { ConnectedAccount, CloudProvider, StorageDashboardSummary } from '@cloudvault/types';
import { useQuery, useQueryClient } from '@tanstack/react-query';

export default function AccountsScreen() {
  const { theme, spacing, typography } = useTheme();
  const { accounts, storage: storeStorage, disconnectAccount, addAccount, fetchAccounts } = useAppStore();
  const [isConnecting, setIsConnecting] = useState(false);
  const [isPicking, setIsPicking] = useState(false);
  const queryClient = useQueryClient();

  // Live storage summary query with fallback
  const { data: storage = storeStorage } = useQuery<StorageDashboardSummary>({
    queryKey: ['storageSummary'],
    queryFn: async () => {
      try {
        const live = await storageService.getStorageSummary();
        if (live && live.accounts && live.accounts.length > 0) {
          return {
            totalUsedBytes: Number(live.totalUsedBytes),
            totalQuotaBytes: Number(live.totalQuotaBytes),
            lastUpdated: live.lastUpdated,
            accounts: live.accounts.map((item: any) => ({
              account: {
                id: item.account.id,
                userId: 'usr-1',
                email: item.account.email,
                provider: item.account.provider,
                status: item.account.status,
                providerAccountId: item.account.id,
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString(),
              },
              usage: item.usage
                ? {
                    id: item.usage.id,
                    connectedAccountId: item.account.id,
                    usedBytes: Number(item.usage.usedBytes),
                    quotaBytes: item.usage.quotaBytes ? Number(item.usage.quotaBytes) : undefined,
                    availableBytes: item.usage.availableBytes ? Number(item.usage.availableBytes) : undefined,
                    source: item.usage.source,
                    measuredAt: item.usage.measuredAt,
                  }
                : undefined,
            })),
          };
        }
        return storeStorage;
      } catch {
        return storeStorage;
      }
    },
  });

  // Listen for OAuth deep link callback: cloudvault://auth/google/success?accountId=...&email=...
  useEffect(() => {
    fetchAccounts();

    const handleDeepLink = (event: { url: string }) => {
      const parsed = Linking.parse(event.url);
      if (parsed.path === 'auth/google/success' || parsed.hostname === 'auth') {
        const query = parsed.queryParams;
        if (query?.accountId && query?.email) {
          const newAccount: ConnectedAccount = {
            id: query.accountId as string,
            userId: 'usr-1',
            provider: 'google-drive',
            providerAccountId: `google-${Date.now()}`,
            email: decodeURIComponent(query.email as string),
            status: 'active',
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          };
          addAccount(newAccount);
          Alert.alert('Account Connected', `Successfully connected ${newAccount.email}`);
        }
      }
    };

    const subscription = Linking.addEventListener('url', handleDeepLink);
    return () => subscription.remove();
  }, [addAccount, fetchAccounts]);

  const initiateOAuth = async (provider: CloudProvider) => {
    setIsConnecting(true);
    try {
      // 1. Request signed authorization transaction from backend
      const { authUrl } = await accountService.startGoogleAuthorization(provider);

      // 2. Open authorization session
      const opened = await accountService.openAuthSession(authUrl);
      if (!opened) {
        throw new Error('Unable to open system browser');
      }
    } catch {
      // Fallback in local dev/demo environment: simulate successful connection
      Alert.alert(
        'Connect Account (Dev Mode)',
        'Local mock Google OAuth authorization code simulated. Connect test account?',
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Simulate Connect',
            onPress: () => {
              const newMockAccount: ConnectedAccount = {
                id: `acc-${Date.now()}`,
                userId: 'usr-1',
                provider,
                providerAccountId: `google-user-${Date.now()}`,
                email: `cloud.vault.user.${accounts.length + 1}@gmail.com`,
                status: 'active',
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString(),
              };
              addAccount(newMockAccount);
              Alert.alert('Connected', `Added ${newMockAccount.email}`);
            },
          },
        ]
      );
    } finally {
      setIsConnecting(false);
    }
  };

  const handleConnectAccount = () => {
    Alert.alert(
      'Connect Account',
      'Select provider to authorize with CloudVault (OAuth 2.0 PKCE):',
      [
        {
          text: 'Google Drive',
          onPress: () => initiateOAuth('google-drive'),
        },
        {
          text: 'Google Photos Picker',
          onPress: () => initiateOAuth('google-photos'),
        },
        { text: 'Cancel', style: 'cancel' },
      ]
    );
  };

  const handleDisconnect = (account: ConnectedAccount) => {
    Alert.alert(
      'Disconnect Account',
      `Are you sure you want to disconnect ${account.email}? All cached thumbnails from this account will be removed and Google tokens revoked.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Disconnect',
          style: 'destructive',
          onPress: async () => {
            await disconnectAccount(account.id);
            Alert.alert('Account Disconnected', `${account.email} has been removed.`);
          },
        },
      ]
    );
  };

  const handleReauthorize = (account: ConnectedAccount) => {
    Alert.alert(
      'Reauthorize Access',
      `Refresh session credentials for ${account.email} via Google OAuth.`,
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Reauthorize', onPress: () => initiateOAuth(account.provider) },
      ]
    );
  };

  const handlePickPhotos = async (account: ConnectedAccount) => {
    setIsPicking(true);
    try {
      const session = await googlePhotosService.createPickerSession(account.id);
      const sessionId = session.sessionId || session.id;
      await Linking.openURL(session.pickerUri).catch(() => {});

      Alert.alert(
        'Google Photos Picker',
        'Select photos in Google Photos, then tap Import to sync them into your unified gallery.',
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Import Selected',
            onPress: async () => {
              try {
                const result = await googlePhotosService.importSelectedMedia(account.id, sessionId);
                queryClient.invalidateQueries({ queryKey: ['gallery'] });
                queryClient.invalidateQueries({ queryKey: ['storageSummary'] });
                Alert.alert('Import Complete', `Successfully imported ${result.importedCount} media items.`);
              } catch (err: any) {
                Alert.alert('Import Failed', err.message || 'Unable to import selected media.');
              }
            },
          },
        ]
      );
    } catch (err: any) {
      Alert.alert('Picker Error', err.message || 'Failed to start Google Photos Picker session.');
    } finally {
      setIsPicking(false);
    }
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]} edges={['top']}>
      <AppHeader title="Accounts & Storage" subtitle="Manage connected cloud drives" />

      <ScrollView contentContainerStyle={{ padding: spacing.lg, paddingBottom: spacing.huge }}>
        {/* Storage Dashboard Card */}
        <StorageCard storage={storage} />

        {/* Section Title */}
        <View style={styles.sectionHeader}>
          <Text style={[typography.titleMedium, { color: theme.colors.text }]}>
            Connected Accounts ({accounts.length})
          </Text>
        </View>

        {/* Account Cards */}
        {accounts.map((account) => (
          <AccountCard
            key={account.id}
            account={account}
            onDisconnect={handleDisconnect}
            onReauthorize={handleReauthorize}
            onPickPhotos={handlePickPhotos}
          />
        ))}

        {/* Add Account CTA */}
        <View style={{ marginTop: spacing.md }}>
          <AppButton
            title={isConnecting ? 'Opening Google Auth...' : 'Connect Google Account'}
            variant="primary"
            size="lg"
            loading={isConnecting}
            icon={<Ionicons name="add-circle-outline" size={20} color="#FFFFFF" />}
            onPress={handleConnectAccount}
          />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  sectionHeader: {
    marginBottom: 12,
  },
});
