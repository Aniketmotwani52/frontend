import { api } from './axios';
import type { User, CreateUserRequest, UpdateUserRequest } from '../types/user.types';

export const userApi = {
  getAllByOrg: async (orgId: number): Promise<User[]> => {
    const response = await api.get(`/users/org/${orgId}`);
    return response.data;
  },
  
  getActiveByOrg: async (orgId: number): Promise<User[]> => {
    const response = await api.get(`/users/org/${orgId}/active`);
    return response.data;
  },

  getActiveStaffByOrg: async (orgId: number): Promise<User[]> => {
    const response = await api.get(`/users/org/${orgId}/staff/active`);
    return response.data;
  },

  create: async (data: CreateUserRequest): Promise<User> => {
    const response = await api.post('/users', data);
    return response.data;
  },

  update: async (userId: number, data: UpdateUserRequest): Promise<User> => {
    const response = await api.put(`/users/${userId}`, data);
    return response.data;
  },

  delete: async (userId: number): Promise<User> => {
    const response = await api.delete(`/users/${userId}`);
    return response.data;
  }
};
