import { useQuery } from '@tanstack/react-query';
import { photoService, GetPhotosParams } from '../services/photoService';
import { Photo } from '@cloudvault/types';
import { mockPhotos } from '../store/mockData';

export function useGalleryPhotos(params: GetPhotosParams) {
  return useQuery<Photo[]>({
    queryKey: ['gallery', params],
    queryFn: async () => {
      try {
        const response = await photoService.getPhotos(params);
        if (response.photos && response.photos.length > 0) {
          return response.photos;
        }
        // Fallback to local mock data if no photos returned yet
        return filterMockPhotos(mockPhotos, params);
      } catch {
        // Fallback to local mock data if offline or dev mode
        return filterMockPhotos(mockPhotos, params);
      }
    },
    staleTime: 1000 * 60 * 2, // 2 minutes cache
  });
}

function filterMockPhotos(photos: Photo[], params: GetPhotosParams): Photo[] {
  return photos.filter((photo) => {
    if (params.accountId && photo.connectedAccountId !== params.accountId) {
      return false;
    }
    if (params.mediaType && photo.mediaType !== params.mediaType.toLowerCase()) {
      return false;
    }
    if (params.search && params.search.trim().length > 0) {
      const q = params.search.toLowerCase();
      const matchName = photo.filename.toLowerCase().includes(q);
      const matchLoc = photo.metadata?.locationName?.toLowerCase().includes(q);
      const matchCam = photo.metadata?.cameraModel?.toLowerCase().includes(q);
      return matchName || matchLoc || matchCam;
    }
    return true;
  });
}
