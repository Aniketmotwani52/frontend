import { api } from '../../../shared/api/axios';
import type {
  Package,
  CreatePackageRequest,
  CustomerPackage,
  SellPackageRequest
} from '../types/package.types';

export const packageApi = {
  // Package Templates (Catalog)
  getPackages: async (orgId: number, activeOnly: boolean = true): Promise<Package[]> => {
    const response = await api.get(`/packages/org/${orgId}?activeOnly=${activeOnly}`);
    return response.data;
  },

  getPackageById: async (packageId: number): Promise<Package> => {
    const response = await api.get(`/packages/${packageId}`);
    return response.data;
  },

  createPackage: async (data: CreatePackageRequest): Promise<Package> => {
    const response = await api.post(`/packages`, data);
    return response.data;
  },

  deletePackage: async (packageId: number): Promise<void> => {
    await api.delete(`/packages/${packageId}`);
  },

  updatePackage: async (packageId: number, data: any): Promise<Package> => {
    const response = await api.put(`/packages/${packageId}`, data);
    return response.data;
  },

  // Customer Packages (Instances)
  getCustomerPackages: async (customerId: number): Promise<CustomerPackage[]> => {
    const response = await api.get(`/customer-packages/customer/${customerId}`);
    return response.data;
  },

  getCustomerPackageById: async (customerPackageId: number): Promise<CustomerPackage> => {
    const response = await api.get(`/customer-packages/${customerPackageId}`);
    return response.data;
  },

  cancelCustomerPackage: async (customerPackageId: number): Promise<void> => {
    await api.post(`/customer-packages/${customerPackageId}/cancel`);
  },

  sellPackage: async (data: SellPackageRequest): Promise<CustomerPackage> => {
    const response = await api.post(`/customer-packages/sell`, data);
    return response.data;
  }
};
