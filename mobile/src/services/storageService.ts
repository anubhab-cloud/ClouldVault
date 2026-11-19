import { apiClient } from './apiClient';
import { StorageDashboardSummary } from '@cloudvault/types';

export const storageService = {
  getStorageSummary: async (): Promise<StorageDashboardSummary> => {
    return apiClient<StorageDashboardSummary>('/storage/summary');
  },
};
