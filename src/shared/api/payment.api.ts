import { api } from './axios';
import type { PaymentTransaction, CreatePaymentRequest } from '../types/payment.types';

export const paymentApi = {
  create: async (data: CreatePaymentRequest): Promise<PaymentTransaction> => {
    const response = await api.post('/payments', data);
    return response.data;
  },

  getByAppointmentId: async (appointmentId: number): Promise<PaymentTransaction[]> => {
    const response = await api.get(`/payments/appointment/${appointmentId}`);
    return response.data;
  },

  getByOrgId: async (orgId: number): Promise<PaymentTransaction[]> => {
    const response = await api.get(`/payments/organization/${orgId}`);
    return response.data;
  },

  updateStatus: async (transactionId: number, status: string): Promise<PaymentTransaction> => {
    const response = await api.put(`/payments/${transactionId}/status`, { transactionStatus: status });
    return response.data;
  }
};
