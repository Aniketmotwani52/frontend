import { api } from './axios';
import type { Service, CreateServiceRequest, UpdateServiceRequest } from '../types/service.types';

export const serviceApi = {
  getAllByOrg: async (orgId: number): Promise<Service[]> => {
    const response = await api.get(`/services/organization/${orgId}`);
    return response.data;
  },
  
  getActiveByOrg: async (orgId: number): Promise<Service[]> => {
    const response = await api.get(`/services/organization/${orgId}/active`);
    return response.data;
  },

  getByCategory: async (orgId: number, category: string): Promise<Service[]> => {
    const response = await api.get(`/services/organization/${orgId}/category/${category}`);
    return response.data;
  },

  create: async (data: CreateServiceRequest): Promise<Service> => {
    const response = await api.post('/services', data);
    return response.data;
  },

  update: async (serviceId: number, data: UpdateServiceRequest): Promise<Service> => {
    const response = await api.put(`/services/${serviceId}`, data);
    return response.data;
  },

  delete: async (serviceId: number): Promise<Service> => {
    const response = await api.delete(`/services/${serviceId}`);
    return response.data;
  }
};
