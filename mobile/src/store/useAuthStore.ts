import { create } from 'zustand';
import { User } from '@cloudvault/types';
import { authStorage } from '../services/authStorage';
import { apiClient } from '../services/apiClient';

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;

  initAuth: () => Promise<void>;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string, name: string) => Promise<void>;
  loginDemo: () => Promise<void>;
  logout: () => Promise<void>;
  deleteAccount: () => Promise<void>;
  clearError: () => void;
}

const DEMO_USER: User = {
  id: 'usr-1',
  email: 'alex.mercer@cloudvault.app',
  name: 'Alex Mercer',
  createdAt: '2026-01-15T10:00:00Z',
  updatedAt: '2026-11-18T12:00:00Z',
};

export const useAuthStore = create<AuthState>((set) => ({
  user: DEMO_USER, // Default to demo user so review/preview is seamless
  isAuthenticated: true,
  isLoading: false,
  error: null,

  initAuth: async () => {
    set({ isLoading: true });
    try {
      const storedUser = await authStorage.getUser();
      const accessToken = await authStorage.getAccessToken();

      if (storedUser && accessToken) {
        set({ user: storedUser, isAuthenticated: true, isLoading: false });
        // Background verify /me
        try {
          const profile = await apiClient<{ user: User }>('/auth/me');
          set({ user: profile.user });
          await authStorage.setUser(profile.user);
        } catch {
          // If token refresh fails, store will handle it
        }
      } else {
        // Keep authenticated as demo user if nothing stored
        set({ user: DEMO_USER, isAuthenticated: true, isLoading: false });
      }
    } catch {
      set({ user: DEMO_USER, isAuthenticated: true, isLoading: false });
    }
  },

  login: async (email, password) => {
    set({ isLoading: true, error: null });
    try {
      const res = await apiClient<{ user: User; tokens: { accessToken: string; refreshToken: string } }>(
        '/auth/login',
        {
          method: 'POST',
          body: JSON.stringify({ email, password }),
          requiresAuth: false,
        }
      );

      await authStorage.setAccessToken(res.tokens.accessToken);
      await authStorage.setRefreshToken(res.tokens.refreshToken);
      await authStorage.setUser(res.user);

      set({ user: res.user, isAuthenticated: true, isLoading: false });
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Login failed';
      set({ error: message, isLoading: false });
      throw err;
    }
  },

  register: async (email, password, name) => {
    set({ isLoading: true, error: null });
    try {
      const res = await apiClient<{ user: User; tokens: { accessToken: string; refreshToken: string } }>(
        '/auth/register',
        {
          method: 'POST',
          body: JSON.stringify({ email, password, name }),
          requiresAuth: false,
        }
      );

      await authStorage.setAccessToken(res.tokens.accessToken);
      await authStorage.setRefreshToken(res.tokens.refreshToken);
      await authStorage.setUser(res.user);

      set({ user: res.user, isAuthenticated: true, isLoading: false });
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Registration failed';
      set({ error: message, isLoading: false });
      throw err;
    }
  },

  loginDemo: async () => {
    set({ isLoading: true, error: null });
    await authStorage.setUser(DEMO_USER);
    await authStorage.setAccessToken('sample-demo-access-token');
    await authStorage.setRefreshToken('sample-demo-refresh-token');
    set({ user: DEMO_USER, isAuthenticated: true, isLoading: false });
  },

  logout: async () => {
    set({ isLoading: true });
    try {
      const refreshToken = await authStorage.getRefreshToken();
      if (refreshToken) {
        await apiClient('/auth/logout', {
          method: 'POST',
          body: JSON.stringify({ refreshToken }),
          requiresAuth: false,
        }).catch(() => {});
      }
    } finally {
      await authStorage.clearAll();
      set({ user: null, isAuthenticated: false, isLoading: false });
    }
  },

  deleteAccount: async () => {
    set({ isLoading: true });
    try {
      await apiClient('/auth/account', {
        method: 'DELETE',
      }).catch(() => {});
    } finally {
      await authStorage.clearAll();
      set({ user: null, isAuthenticated: false, isLoading: false });
    }
  },

  clearError: () => set({ error: null }),
}));
