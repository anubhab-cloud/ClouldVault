import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Alert,
  Switch,
  TouchableOpacity,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as Linking from 'expo-linking';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/theme';
import { useAppStore } from '@/store/useAppStore';
import { accountService } from '@/services/accountService';
import { storageService } from '@/services/storageService';
import { googlePhotosService } from '@/services/googlePhotosService';
import { ConnectedAccount, CloudProvider, StorageDashboardSummary } from '@cloudvault/types';
import { useQuery, useQueryClient } from '@tanstack/react-query';

function formatBytes(bytes: number): string {
  if (!bytes) return '0 B';
  const gb = bytes / (1024 ** 3);
  if (gb >= 1) return `${gb.toFixed(1)} GB`;
  const mb = bytes / (1024 ** 2);
  return `${mb.toFixed(0)} MB`;
}

function avatarLetter(email: string): string {
  return (email?.[0] ?? '?').toUpperCase();
}

function avatarColor(email: string): string {
  const palette = ['#5A5FE0', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#EC4899'];
  let hash = 0;
  for (let i = 0; i < email.length; i++) hash = email.charCodeAt(i) + ((hash << 5) - hash);
  return palette[Math.abs(hash) % palette.length];
}

export default function AccountsScreen() {
  const { theme, spacing, radius } = useTheme();
  const { accounts, storage: storeStorage, disconnectAccount, addAccount, fetchAccounts } = useAppStore();
  const [isConnecting, setIsConnecting] = useState(false);
  const [isPicking, setIsPicking] = useState(false);
  const queryClient = useQueryClient();

  // Sync preferences local state
  const [wifiOnly, setWifiOnly] = useState(true);
  const [batterySaver, setBatterySaver] = useState(true);
  const [bgSync, setBgSync] = useState(false);

  // Live storage summary
  const { data: storage = storeStorage } = useQuery<StorageDashboardSummary>({
    queryKey: ['storageSummary'],
    queryFn: async () => {
      try {
        const live = await storageService.getStorageSummary();
        if (live?.accounts?.length > 0) {
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

  // Listen for OAuth deep link callback
  useEffect(() => {
    fetchAccounts();
    const handleDeepLink = (event: { url: string }) => {
      const parsed = Linking.parse(event.url);
      if (parsed.path === 'auth/google/success' || parsed.hostname === 'auth') {
        const q = parsed.queryParams;
        if (q?.accountId && q?.email) {
          const acc: ConnectedAccount = {
            id: q.accountId as string,
            userId: 'usr-1',
            provider: 'google-drive',
            providerAccountId: `google-${Date.now()}`,
            email: decodeURIComponent(q.email as string),
            status: 'active',
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          };
          addAccount(acc);
          Alert.alert('Account Connected', `Successfully connected ${acc.email}`);
        }
      }
    };
    const sub = Linking.addEventListener('url', handleDeepLink);
    return () => sub.remove();
  }, [addAccount, fetchAccounts]);

  const initiateOAuth = async (provider: CloudProvider) => {
    setIsConnecting(true);
    try {
      const { authUrl } = await accountService.startGoogleAuthorization(provider);
      const opened = await accountService.openAuthSession(authUrl);
      if (!opened) throw new Error('Unable to open system browser');
    } catch {
      Alert.alert(
        'Connect Account (Dev Mode)',
        'Simulate a successful Google OAuth connection?',
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Simulate Connect',
            onPress: () => {
              const mock: ConnectedAccount = {
                id: `acc-${Date.now()}`,
                userId: 'usr-1',
                provider,
                providerAccountId: `google-user-${Date.now()}`,
                email: `cloud.vault.user.${accounts.length + 1}@gmail.com`,
                status: 'active',
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString(),
              };
              addAccount(mock);
              Alert.alert('Connected', `Added ${mock.email}`);
            },
          },
        ]
      );
    } finally {
      setIsConnecting(false);
    }
  };

  const handleConnectAccount = () => {
    Alert.alert('Connect Account', 'Select provider to authorize (OAuth 2.0 PKCE):', [
      { text: 'Google Drive', onPress: () => initiateOAuth('google-drive') },
      { text: 'Google Photos Picker', onPress: () => initiateOAuth('google-photos') },
      { text: 'Cancel', style: 'cancel' },
    ]);
  };

  const handleDisconnect = (account: ConnectedAccount) => {
    Alert.alert(
      'Disconnect Account',
      `Disconnect ${account.email}? All cached thumbnails and tokens will be removed.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Disconnect',
          style: 'destructive',
          onPress: async () => {
            await disconnectAccount(account.id);
            Alert.alert('Disconnected', `${account.email} removed.`);
          },
        },
      ]
    );
  };

  const handleReauthorize = (account: ConnectedAccount) => {
    Alert.alert('Reauthorize', `Refresh OAuth session for ${account.email}?`, [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Reauthorize', onPress: () => initiateOAuth(account.provider) },
    ]);
  };

  const handlePickPhotos = async (account: ConnectedAccount) => {
    setIsPicking(true);
    try {
      const session = await googlePhotosService.createPickerSession(account.id);
      const sessionId = session.sessionId || session.id;
      await Linking.openURL(session.pickerUri).catch(() => {});
      Alert.alert(
        'Google Photos Picker',
        'Select photos in Google Photos, then tap Import.',
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Import Selected',
            onPress: async () => {
              try {
                const result = await googlePhotosService.importSelectedMedia(account.id, sessionId);
                queryClient.invalidateQueries({ queryKey: ['gallery'] });
                queryClient.invalidateQueries({ queryKey: ['storageSummary'] });
                Alert.alert('Import Complete', `Imported ${result.importedCount} items.`);
              } catch (err: any) {
                Alert.alert('Import Failed', err.message || 'Unable to import.');
              }
            },
          },
        ]
      );
    } catch (err: any) {
      Alert.alert('Picker Error', err.message || 'Failed to start Picker session.');
    } finally {
      setIsPicking(false);
    }
  };

  return (
    <SafeAreaView style={[styles.root, { backgroundColor: theme.colors.background }]} edges={['top']}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 100 }}>
        {/* ── Header ── */}
        <View style={[styles.headerRow, { paddingHorizontal: spacing.lg, paddingTop: spacing.md }]}>
          <View>
            <Text style={[styles.headerSub, { color: theme.colors.textSubtle }]}>
              {accounts.length} connected
            </Text>
            <Text style={[styles.headerTitle, { color: theme.colors.text }]}>Accounts</Text>
          </View>
          <TouchableOpacity
            activeOpacity={0.75}
            onPress={() => queryClient.invalidateQueries({ queryKey: ['storageSummary'] })}
            style={[styles.refreshBtn, { backgroundColor: theme.colors.surface, borderRadius: radius.pill }]}
          >
            <Ionicons name="sync-outline" size={18} color={theme.colors.textMuted} />
          </TouchableOpacity>
        </View>

        <View style={{ paddingHorizontal: spacing.lg, marginTop: spacing.md }}>
          {/* ── Connect button ── */}
          <TouchableOpacity
            activeOpacity={0.85}
            onPress={handleConnectAccount}
            style={[
              styles.connectBtn,
              {
                backgroundColor: theme.colors.primary,
                borderRadius: radius.lg,
                marginBottom: spacing.lg,
              },
            ]}
          >
            <Ionicons name="add" size={18} color="#FFF" style={{ marginRight: 8 }} />
            <Text style={styles.connectBtnText}>
              {isConnecting ? 'Opening Google Auth…' : '+ Connect Google Account'}
            </Text>
          </TouchableOpacity>

          {/* ── Account cards ── */}
          {accounts.map((account) => {
            const isExpired = account.status === 'expired' || account.status === 'revoked';
            const storageEntry = storage?.accounts?.find((s) => s.account.email === account.email);
            const usedBytes = storageEntry?.usage?.usedBytes ?? 0;
            const quotaBytes = storageEntry?.usage?.quotaBytes ?? 1;
            const usedRatio = Math.min(1, usedBytes / quotaBytes);
            const letter = avatarLetter(account.email);
            const bg = avatarColor(account.email);

            return (
              <View
                key={account.id}
                style={[
                  styles.accountCard,
                  {
                    backgroundColor: isExpired ? '#FFF5F5' : theme.colors.surface,
                    borderRadius: radius.lg,
                    marginBottom: spacing.md,
                  },
                ]}
              >
                {/* Row: Avatar + info + status */}
                <View style={styles.cardTopRow}>
                  <View style={[styles.avatar, { backgroundColor: bg, borderRadius: radius.md }]}>
                    <Text style={styles.avatarText}>{letter}</Text>
                  </View>
                  <View style={{ flex: 1, marginLeft: spacing.md }}>
                    <Text style={[styles.cardEmail, { color: theme.colors.text }]} numberOfLines={1}>
                      {account.email}
                    </Text>
                    <Text style={[styles.cardMeta, { color: theme.colors.textSubtle }]}>
                      {storageEntry
                        ? `${formatBytes(usedBytes)} used`
                        : account.provider === 'google-drive'
                        ? 'Google Drive'
                        : 'Google Photos Picker'}
                    </Text>
                  </View>
                  <View
                    style={[
                      styles.statusBadge,
                      {
                        backgroundColor: isExpired ? '#FEE2E2' : '#D1FAE5',
                        borderRadius: radius.pill,
                      },
                    ]}
                  >
                    <Text
                      style={[
                        styles.statusText,
                        { color: isExpired ? '#DC2626' : '#059669' },
                      ]}
                    >
                      {isExpired ? 'Halted' : 'Synced'}
                    </Text>
                  </View>
                </View>

                {/* Storage progress */}
                <View style={[styles.progressTrack, { backgroundColor: theme.colors.borderSubtle, marginTop: 12, borderRadius: 4 }]}>
                  <View
                    style={[
                      styles.progressFill,
                      {
                        width: `${Math.round(usedRatio * 100)}%` as `${number}%`,
                        backgroundColor: isExpired ? '#F87171' : theme.colors.primary,
                        borderRadius: 4,
                      },
                    ]}
                  />
                </View>
                <View style={[styles.storageRow, { marginTop: 6 }]}>
                  <Text style={[styles.storageText, { color: theme.colors.textSubtle }]}>
                    {quotaBytes > 0 ? `${formatBytes(usedBytes)} of ${formatBytes(quotaBytes)}` : '—'}
                  </Text>
                  <TouchableOpacity onPress={() => handleDisconnect(account)}>
                    <Text style={[styles.manageText, { color: theme.colors.textSubtle }]}>Manage</Text>
                  </TouchableOpacity>
                </View>

                {/* Reauthorize CTA when halted */}
                {isExpired && (
                  <TouchableOpacity
                    activeOpacity={0.85}
                    onPress={() => handleReauthorize(account)}
                    style={[
                      styles.reauthorizeBtn,
                      { backgroundColor: '#F87171', borderRadius: radius.md, marginTop: 12 },
                    ]}
                  >
                    <Text style={styles.reauthorizeBtnText}>Reauthorize Google Account</Text>
                  </TouchableOpacity>
                )}

                {/* Pick photos shortcut for Google Photos accounts */}
                {account.provider === 'google-photos' && !isExpired && (
                  <TouchableOpacity
                    activeOpacity={0.8}
                    onPress={() => handlePickPhotos(account)}
                    style={{ marginTop: 10, alignSelf: 'flex-start' }}
                  >
                    <Text style={{ color: theme.colors.primary, fontSize: 13, fontWeight: '600' }}>
                      {isPicking ? 'Opening Picker…' : 'Pick Photos'}
                    </Text>
                  </TouchableOpacity>
                )}
              </View>
            );
          })}

          {/* ── Sync preferences ── */}
          <View
            style={[
              styles.prefCard,
              {
                backgroundColor: theme.colors.surface,
                borderRadius: radius.lg,
                marginTop: spacing.sm,
              },
            ]}
          >
            <Text style={[styles.prefTitle, { color: theme.colors.text, marginBottom: spacing.md }]}>
              Sync preferences
            </Text>
            {[
              { label: 'Sync over Wi-Fi only', value: wifiOnly, onChange: setWifiOnly },
              { label: 'Respect battery saver', value: batterySaver, onChange: setBatterySaver },
              { label: 'Background sync every 4h', value: bgSync, onChange: setBgSync },
            ].map((pref) => (
              <View key={pref.label} style={styles.prefRow}>
                <Text style={[styles.prefLabel, { color: theme.colors.text }]}>{pref.label}</Text>
                <Switch
                  value={pref.value}
                  onValueChange={pref.onChange}
                  trackColor={{ false: theme.colors.borderSubtle, true: theme.colors.primary }}
                  thumbColor="#FFF"
                />
              </View>
            ))}
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  headerRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  headerSub: { fontSize: 13 },
  headerTitle: { fontSize: 32, fontWeight: '800', letterSpacing: -0.5, marginTop: 2 },
  refreshBtn: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center' },
  connectBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 16 },
  connectBtnText: { color: '#FFF', fontSize: 16, fontWeight: '700' },
  accountCard: { padding: 16 },
  cardTopRow: { flexDirection: 'row', alignItems: 'center' },
  avatar: { width: 42, height: 42, alignItems: 'center', justifyContent: 'center' },
  avatarText: { color: '#FFF', fontSize: 18, fontWeight: '700' },
  cardEmail: { fontSize: 15, fontWeight: '700' },
  cardMeta: { fontSize: 12, marginTop: 2 },
  statusBadge: { paddingHorizontal: 10, paddingVertical: 4 },
  statusText: { fontSize: 12, fontWeight: '700' },
  progressTrack: { height: 6 },
  progressFill: { height: 6 },
  storageRow: { flexDirection: 'row', justifyContent: 'space-between' },
  storageText: { fontSize: 12 },
  manageText: { fontSize: 12, fontWeight: '600' },
  reauthorizeBtn: { paddingVertical: 13, alignItems: 'center' },
  reauthorizeBtnText: { color: '#FFF', fontSize: 15, fontWeight: '700' },
  prefCard: { padding: 16 },
  prefTitle: { fontSize: 18, fontWeight: '700' },
  prefRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 10 },
  prefLabel: { fontSize: 15 },
});
