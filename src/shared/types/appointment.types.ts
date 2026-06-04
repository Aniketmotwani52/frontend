export type AppointmentStatus = 'SCHEDULED' | 'CONFIRMED' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED' | 'NO_SHOW';
export type PaymentStatus = 'PENDING' | 'PARTIAL' | 'PAID' | 'REFUNDED' | 'OVERPAID';

export interface Appointment {
  appointmentId: number;
  orgId: number;
  orgName: string;
  customerId: number;
  customerName: string;
  appointmentStatus: AppointmentStatus;
  appointmentStartTime: string;
  appointmentEndTime: string;
  notes?: string;
  paymentStatus: PaymentStatus;
  totalAmount: number;
  discountAmount: number;
  finalAmount: number;
  createdByUserId: number;
  createdByUserName: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CreateAppointmentRequest {
  orgId: number;
  customerId: number;
  appointmentStatus: AppointmentStatus;
  appointmentStartTime: string; // ISO String
  appointmentEndTime: string; // ISO String
  notes?: string;
  paymentStatus: PaymentStatus;
}

export interface CreateAppointmentServiceItemRequest {
  appointmentId: number;
  serviceId: number;
  notes?: string;
  serviceStatus?: string;
}

export interface CreateAppointmentServiceStaffRequest {
  appointmentServiceItemId: number;
  staffUserId: number;
  assignedStartTime?: string;
  assignedEndTime?: string;
  notes?: string;
}

export interface FullAppointmentServiceStaff {
  appointmentServiceStaffId: number;
  appointmentServiceItemId: number;
  staffUserId: number;
  staffUserName: string;
  assignedStartTime?: string;
  assignedEndTime?: string;
  notes?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface FullAppointmentServiceItem {
  appointmentServiceItemId: number;
  appointmentId: number;
  serviceId: number;
  serviceName: string;
  priceAtBooking: number;
  serviceStatus: string;
  serviceStartTime?: string;
  serviceEndTime?: string;
  notes?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  assignedStaff: FullAppointmentServiceStaff[];
}

export interface FullAppointment extends Appointment {
  serviceItems: FullAppointmentServiceItem[];
}
