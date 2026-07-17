import { api } from './axios';
import type { Appointment, CreateAppointmentRequest, FullAppointment } from '../types/appointment.types';

export const appointmentApi = {
  getAllByOrg: async (orgId: number): Promise<Appointment[]> => {
    const response = await api.get(`/appointments/organization/${orgId}`);
    return response.data;
  },

  getFullByOrg: async (orgId: number): Promise<FullAppointment[]> => {
    const response = await api.get(`/appointments/organization/${orgId}/full`);
    return response.data;
  },

  getCustomerHistory: async (customerId: number): Promise<FullAppointment[]> => {
    const response = await api.get(`/appointment-workflows/customer/${customerId}`);
    return response.data;
  },

  create: async (data: CreateAppointmentRequest): Promise<Appointment> => {
    const response = await api.post('/appointments', data);
    return response.data;
  },

  createServiceItem: async (data: any) => {
    const response = await api.post('/appointment-service-items', data);
    return response.data;
  },

  createServiceStaff: async (data: any) => {
    const response = await api.post('/appointment-service-staff', data);
    return response.data;
  },

  createFullWorkflow: async (data: any) => {
    const response = await api.post('/appointment-workflows/full', data);
    return response.data;
  },

  updateFullWorkflow: async (appointmentId: number, data: any) => {
    const response = await api.put(`/appointment-workflows/${appointmentId}`, data);
    return response.data;
  },

  updateStatus: async (appointmentId: number, status: string): Promise<Appointment> => {
    const response = await api.patch(`/appointments/${appointmentId}/status?status=${status}`);
    return response.data;
  },

  delete: async (appointmentId: number): Promise<void> => {
    await api.delete(`/appointments/${appointmentId}`);
  }
};
