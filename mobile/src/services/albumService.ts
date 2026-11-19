import { apiClient } from './apiClient';
import { Album } from '@cloudvault/types';

export const albumService = {
  getAlbums: async (): Promise<Album[]> => {
    const res = await apiClient<{ albums: Album[] }>('/albums');
    return res.albums;
  },

  createAlbum: async (name: string, description?: string): Promise<Album> => {
    const res = await apiClient<{ album: Album }>('/albums', {
      method: 'POST',
      body: JSON.stringify({ name, description }),
    });
    return res.album;
  },

  getAlbumDetails: async (albumId: string) => {
    return apiClient(`/albums/${albumId}`);
  },

  addPhotoToAlbum: async (albumId: string, photoId: string) => {
    return apiClient(`/albums/${albumId}/photos`, {
      method: 'POST',
      body: JSON.stringify({ photoId }),
    });
  },

  deleteAlbum: async (albumId: string) => {
    return apiClient(`/albums/${albumId}`, {
      method: 'DELETE',
    });
  },
};
