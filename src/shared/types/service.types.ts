export interface ServiceCategory {
  categoryId: number;
  orgId: number;
  name: string;
  description?: string;
  isActive: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface CreateServiceCategoryRequest {
  orgId: number;
  name: string;
  description?: string;
}

export interface UpdateServiceCategoryRequest {
  name: string;
  description?: string;
}

export interface Service {
  serviceId: number;
  orgId: number;
  orgName?: string;
  name: string;
  description?: string;
  categoryId?: number;
  categoryName?: string;
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
  categoryId?: number;
  defaultPrice: number;
  estimatedDurationMinutes: number;
}

export interface UpdateServiceRequest {
  name?: string;
  description?: string;
  categoryId?: number;
  defaultPrice?: number;
  estimatedDurationMinutes?: number;
}
