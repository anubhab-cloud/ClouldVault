import { authStorage } from './authStorage';
import Constants from 'expo-constants';
import { Platform } from 'react-native';

const getBaseUrl = (): string => {
  // 1. If running via Expo (Expo Go or dev client), connect using host machine LAN IP
  const hostUri = Constants.expoConfig?.hostUri;
  if (hostUri) {
    const ip = hostUri.split(':')[0];
    if (ip && ip !== 'localhost' && ip !== '127.0.0.1') {
      return `http://${ip}:4000/api/v1`;
    }
  }
  // 2. Android emulator loopback alias
  if (Platform.OS === 'android') {
    return 'http://10.0.2.2:4000/api/v1';
  }
  // 3. Web or iOS simulator
  return 'http://localhost:4000/api/v1';
};

interface RequestOptions extends RequestInit {
  requiresAuth?: boolean;
}

export class ApiError extends Error {
  code: string;
  statusCode: number;

  constructor(code: string, message: string, statusCode: number) {
    super(message);
    this.name = 'ApiError';
    this.code = code;
    this.statusCode = statusCode;
  }
}

let isRefreshing = false;
let refreshSubscribers: ((token: string | null) => void)[] = [];

function onRefreshed(token: string | null) {
  refreshSubscribers.forEach((callback) => callback(token));
  refreshSubscribers = [];
}

function addRefreshSubscriber(callback: (token: string | null) => void) {
  refreshSubscribers.push(callback);
}

export async function apiClient<T>(endpoint: string, options: RequestOptions = {}): Promise<T> {
  const { requiresAuth = true, headers = {}, ...rest } = options;

  const baseUrl = getBaseUrl();
  const url = endpoint.startsWith('http') ? endpoint : `${baseUrl}${endpoint}`;
  const requestHeaders: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(headers as Record<string, string>),
  };

  if (requiresAuth) {
    const token = await authStorage.getAccessToken();
    if (token) {
      requestHeaders['Authorization'] = `Bearer ${token}`;
    }
  }

  let response = await fetch(url, {
    headers: requestHeaders,
    ...rest,
  });

  // Handle 401 Unauthorized -> Attempt refresh token rotation
  if (response.status === 401 && requiresAuth) {
    if (!isRefreshing) {
      isRefreshing = true;
      const refreshToken = await authStorage.getRefreshToken();

      if (refreshToken) {
        try {
          const refreshRes = await fetch(`${baseUrl}/auth/refresh`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ refreshToken }),
          });

          const refreshJson = await refreshRes.json();
          if (refreshRes.ok && refreshJson.success && refreshJson.data) {
            const { accessToken, refreshToken: newRefresh } = refreshJson.data;
            await authStorage.setAccessToken(accessToken);
            await authStorage.setRefreshToken(newRefresh);
            isRefreshing = false;
            onRefreshed(accessToken);

            // Retry original request with new token
            requestHeaders['Authorization'] = `Bearer ${accessToken}`;
            response = await fetch(url, { headers: requestHeaders, ...rest });
          } else {
            isRefreshing = false;
            await authStorage.clearAll();
            onRefreshed(null);
          }
        } catch {
          isRefreshing = false;
          await authStorage.clearAll();
          onRefreshed(null);
        }
      } else {
        isRefreshing = false;
        onRefreshed(null);
      }
    } else {
      // Queue requests until refresh completes
      const newToken = await new Promise<string | null>((resolve) => {
        addRefreshSubscriber((token) => resolve(token));
      });
      if (newToken) {
        requestHeaders['Authorization'] = `Bearer ${newToken}`;
        response = await fetch(url, { headers: requestHeaders, ...rest });
      }
    }
  }

  let json: any = null;
  try {
    json = await response.json();
  } catch {
    throw new ApiError('INVALID_RESPONSE', `Server returned status ${response.status}`, response.status);
  }

  if (!response.ok || !json?.success) {
    const code = json?.error?.code || 'REQUEST_FAILED';
    const message = json?.error?.message || 'API request failed';
    throw new ApiError(code, message, response.status);
  }

  return json.data as T;
}
