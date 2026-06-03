export interface Service {
  serviceId: number;
  orgId: number;
  orgName?: string;
  name: string;
  description?: string;
  category?: string;
  defaultPrice: number;
  estimatedDurationMinutes: number;
  isActive: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface CreateServiceRequest {
  orgId: number;
  name: string;
  description?: string;
  category?: string;
  defaultPrice: number;
  estimatedDurationMinutes: number;
}

export interface UpdateServiceRequest {
  name?: string;
  description?: string;
  category?: string;
  defaultPrice?: number;
  estimatedDurationMinutes?: number;
}
