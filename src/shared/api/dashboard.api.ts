import { api } from './axios';
import type { DashboardSummaryResponse } from '../types/dashboard.types';

export const dashboardApi = {
  getSummary: async (orgId: number, from?: string, to?: string): Promise<DashboardSummaryResponse> => {
    let url = `/dashboard/organization/${orgId}/summary`;
    const params = new URLSearchParams();
    if (from) params.append('from', from);
    if (to) params.append('to', to);
    
    if (params.toString()) {
      url += `?${params.toString()}`;
    }
    
    const response = await api.get(url);
    return response.data;
  }
};
