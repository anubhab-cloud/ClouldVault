import { create } from 'zustand';
import { ConnectedAccount, Photo, Album, StorageDashboardSummary } from '@cloudvault/types';
import { mockAccounts, mockPhotos, mockAlbums, mockStorageDashboard } from './mockData';
import { accountService } from '../services/accountService';

interface AppState {
  // Accounts
  accounts: ConnectedAccount[];
  selectedAccountId: string | null; // null means 'all accounts'
  setSelectedAccountId: (accountId: string | null) => void;
  addAccount: (account: ConnectedAccount) => void;
  disconnectAccount: (accountId: string) => Promise<void>;
  fetchAccounts: () => Promise<void>;

  // Photos
  photos: Photo[];
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  isSyncing: boolean;
  triggerSync: () => void;

  // Albums
  albums: Album[];
  createAlbum: (name: string, description?: string) => void;

  // Storage
  storage: StorageDashboardSummary;
}

export const useAppStore = create<AppState>((set, get) => ({
  accounts: mockAccounts,
  selectedAccountId: null,
  setSelectedAccountId: (accountId) => set({ selectedAccountId: accountId }),
  addAccount: (account) =>
    set((state) => ({
      accounts: [account, ...state.accounts],
    })),
  disconnectAccount: async (accountId) => {
    try {
      await accountService.disconnectAccount(accountId).catch(() => {});
    } finally {
      set((state) => ({
        accounts: state.accounts.filter((a) => a.id !== accountId),
        photos: state.photos.filter((p) => p.connectedAccountId !== accountId),
      }));
    }
  },
  fetchAccounts: async () => {
    try {
      const serverAccounts = await accountService.getAccounts();
      if (serverAccounts && serverAccounts.length > 0) {
        set({ accounts: serverAccounts });
      }
    } catch {
      // Fallback to existing accounts
    }
  },

  photos: mockPhotos,
  searchQuery: '',
  setSearchQuery: (query) => set({ searchQuery: query }),
  isSyncing: false,
  triggerSync: () => {
    set({ isSyncing: true });
    setTimeout(() => {
      set({ isSyncing: false });
    }, 1500);
  },

  albums: mockAlbums,
  createAlbum: (name, description) =>
    set((state) => {
      const newAlbum: Album = {
        id: `alb-${Date.now()}`,
        userId: 'usr-1',
        name,
        description,
        photoCount: 0,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      return { albums: [newAlbum, ...state.albums] };
    }),

  storage: mockStorageDashboard,
}));
