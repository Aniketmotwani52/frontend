import { api } from './axios';
import type { PaymentTransaction, CreatePaymentRequest, PendingDue } from '../types/payment.types';

export const paymentApi = {
  create: async (data: CreatePaymentRequest): Promise<PaymentTransaction> => {
    const response = await api.post('/payments', data);
    return response.data;
  },

  createPackagePayment: async (data: any): Promise<PaymentTransaction> => {
    const response = await api.post('/payments/package', data);
    return response.data;
  },

  getByAppointmentId: async (appointmentId: number): Promise<PaymentTransaction[]> => {
    const response = await api.get(`/payments/appointment/${appointmentId}`);
    return response.data;
  },

  getByOrgId: async (orgId: number, from?: string, to?: string): Promise<PaymentTransaction[]> => {
    let url = `/payments/org/${orgId}`;
    if (from && to) {
      url += `?from=${from}&to=${to}`;
    }
    const response = await api.get(url);
    return response.data;
  },

  getPendingDues: async (orgId: number): Promise<number> => {
    const response = await api.get(`/payments/org/${orgId}/pending`);
    return response.data;
  },

  getPendingDuesDetails: async (orgId: number): Promise<PendingDue[]> => {
    const response = await api.get(`/payments/org/${orgId}/pending-details`);
    return response.data;
  },

  updateStatus: async (transactionId: number, status: string): Promise<PaymentTransaction> => {
    const response = await api.put(`/payments/${transactionId}/status`, { transactionStatus: status });
    return response.data;
  }
};
