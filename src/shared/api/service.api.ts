import { api } from './axios';
import type { Service, CreateServiceRequest, UpdateServiceRequest, ServiceCategory, CreateServiceCategoryRequest, UpdateServiceCategoryRequest } from '../types/service.types';

export const serviceApi = {
  getAllByOrg: async (orgId: number): Promise<Service[]> => {
    const response = await api.get(`/services/organization/${orgId}`);
    return response.data;
  },
  
  getActiveByOrg: async (orgId: number): Promise<Service[]> => {
    const response = await api.get(`/services/organization/${orgId}/active`);
    return response.data;
  },

  getByCategory: async (orgId: number, categoryId: number): Promise<Service[]> => {
    const response = await api.get(`/services/organization/${orgId}/category/${categoryId}`);
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

export const serviceCategoryApi = {
  getAllByOrg: async (orgId: number): Promise<ServiceCategory[]> => {
    const response = await api.get(`/service-categories/organization/${orgId}`);
    return response.data;
  },

  getActiveByOrg: async (orgId: number): Promise<ServiceCategory[]> => {
    const response = await api.get(`/service-categories/organization/${orgId}/active`);
    return response.data;
  },

  create: async (data: CreateServiceCategoryRequest): Promise<ServiceCategory> => {
    const response = await api.post('/service-categories', data);
    return response.data;
  },

  update: async (categoryId: number, data: UpdateServiceCategoryRequest): Promise<ServiceCategory> => {
    const response = await api.put(`/service-categories/${categoryId}`, data);
    return response.data;
  },

  delete: async (categoryId: number): Promise<ServiceCategory> => {
    const response = await api.delete(`/service-categories/${categoryId}`);
    return response.data;
  }
};
