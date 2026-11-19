import { apiClient } from './apiClient';
import { Photo } from '@cloudvault/types';

export interface GetPhotosParams {
  cursor?: string;
  limit?: number;
  accountId?: string | null;
  provider?: string;
  mediaType?: string;
  search?: string;
}

export interface GetPhotosResponse {
  photos: Photo[];
  meta: {
    nextCursor?: string | null;
    hasMore: boolean;
    count: number;
  };
}

export const photoService = {
  /**
   * Fetch paginated photos from unified gallery
   */
  getPhotos: async (params: GetPhotosParams = {}): Promise<GetPhotosResponse> => {
    const searchParams = new URLSearchParams();

    if (params.cursor) searchParams.set('cursor', params.cursor);
    if (params.limit) searchParams.set('limit', params.limit.toString());
    if (params.accountId) searchParams.set('accountId', params.accountId);
    if (params.provider) searchParams.set('provider', params.provider);
    if (params.mediaType) searchParams.set('mediaType', params.mediaType);
    if (params.search && params.search.trim().length > 0) searchParams.set('search', params.search.trim());

    const queryString = searchParams.toString();
    const endpoint = `/photos${queryString ? `?${queryString}` : ''}`;

    const res = await apiClient<{ photos: Photo[] }>(endpoint);
    return {
      photos: res.photos,
      meta: {
        hasMore: false,
        count: res.photos.length,
      },
    };
  },

  /**
   * Get single photo details
   */
  getPhotoById: async (photoId: string): Promise<Photo> => {
    const res = await apiClient<{ photo: Photo }>(`/photos/${photoId}`);
    return res.photo;
  },

  /**
   * Delete photo metadata from CloudVault
   */
  deletePhoto: async (photoId: string): Promise<void> => {
    await apiClient(`/photos/${photoId}`, {
      method: 'DELETE',
    });
  },

  /**
   * Trigger Drive sync for an account
   */
  triggerDriveSync: async (accountId: string): Promise<void> => {
    await apiClient('/drive/sync', {
      method: 'POST',
      body: JSON.stringify({ accountId }),
    });
  },
};
