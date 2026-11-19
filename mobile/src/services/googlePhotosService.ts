import { apiClient } from './apiClient';
import {
  GooglePhotosPickerSession,
  GooglePhotosImportResult,
  GooglePhotosMediaAccess,
} from '@cloudvault/types';

export const googlePhotosService = {
  /**
   * Create an interactive Google Photos Picker session
   */
  async createPickerSession(accountId: string): Promise<GooglePhotosPickerSession> {
    return apiClient<GooglePhotosPickerSession>('/google-photos/picker-sessions', {
      method: 'POST',
      body: JSON.stringify({ accountId }),
    });
  },

  /**
   * Check status of a picker session
   */
  async getPickerSessionStatus(accountId: string, sessionId: string): Promise<GooglePhotosPickerSession> {
    return apiClient<GooglePhotosPickerSession>(
      `/google-photos/picker-sessions/${encodeURIComponent(sessionId)}?accountId=${encodeURIComponent(accountId)}`
    );
  },

  /**
   * Import selected media items into CloudVault unified catalog
   */
  async importSelectedMedia(accountId: string, sessionId: string): Promise<GooglePhotosImportResult> {
    return apiClient<GooglePhotosImportResult>(
      `/google-photos/picker-sessions/${encodeURIComponent(sessionId)}/import`,
      {
        method: 'POST',
        body: JSON.stringify({ accountId }),
      }
    );
  },

  /**
   * Retrieve authorized media access
   */
  async getMediaAccess(photoId: string): Promise<GooglePhotosMediaAccess> {
    return apiClient<GooglePhotosMediaAccess>(
      `/google-photos/media/${encodeURIComponent(photoId)}/access`
    );
  },
};
