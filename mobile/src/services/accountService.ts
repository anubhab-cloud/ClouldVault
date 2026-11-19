import * as Linking from 'expo-linking';
import { apiClient } from './apiClient';
import { ConnectedAccount } from '@cloudvault/types';

export interface AuthorizeResponse {
  authUrl: string;
  state: string;
}

export const accountService = {
  /**
   * Fetch connected accounts from backend
   */
  getAccounts: async (): Promise<ConnectedAccount[]> => {
    const res = await apiClient<{ accounts: ConnectedAccount[] }>('/accounts');
    return res.accounts;
  },

  /**
   * Initiate Google OAuth flow via backend authorization transaction
   */
  startGoogleAuthorization: async (
    provider: 'google-drive' | 'google-photos'
  ): Promise<{ authUrl: string; state: string }> => {
    const providerParam = provider === 'google-photos' ? 'GOOGLE_PHOTOS' : 'GOOGLE_DRIVE';
    return apiClient<AuthorizeResponse>('/accounts/google/authorize', {
      method: 'POST',
      body: JSON.stringify({ provider: providerParam }),
    });
  },

  /**
   * Open OAuth authorization session in browser / system tab
   */
  openAuthSession: async (authUrl: string): Promise<boolean> => {
    const canOpen = await Linking.canOpenURL(authUrl);
    if (canOpen) {
      await Linking.openURL(authUrl);
      return true;
    }
    return false;
  },

  /**
   * Disconnect account and purge credentials
   */
  disconnectAccount: async (accountId: string): Promise<void> => {
    await apiClient(`/accounts/${accountId}`, {
      method: 'DELETE',
    });
  },
};
