import { api } from './axios';
import type { Customer, CreateCustomerRequest, UpdateCustomerRequest } from '../types/customer.types';

export const customerApi = {
  getAllByOrg: async (orgId: number): Promise<Customer[]> => {
    const response = await api.get(`/customers/organization/${orgId}`);
    return response.data;
  },
  
  getActiveByOrg: async (orgId: number): Promise<Customer[]> => {
    const response = await api.get(`/customers/organization/${orgId}/active`);
    return response.data;
  },

  searchByOrg: async (orgId: number, query: string): Promise<Customer[]> => {
    const response = await api.get(`/customers/organization/${orgId}/search`, { params: { query } });
    return response.data;
  },

  create: async (data: CreateCustomerRequest): Promise<Customer> => {
    const response = await api.post('/customers', data);
    return response.data;
  },

  update: async (customerId: number, data: UpdateCustomerRequest): Promise<Customer> => {
    const response = await api.put(`/customers/${customerId}`, data);
    return response.data;
  },

  delete: async (customerId: number): Promise<Customer> => {
    const response = await api.delete(`/customers/${customerId}`);
    return response.data;
  }
};
