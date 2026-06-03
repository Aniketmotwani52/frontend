export interface Customer {
  customerId: number;
  orgId: number;
  orgName?: string;
  customerName: string;
  phoneNumber?: string;
  email?: string;
  gender?: string;
  dateOfBirth?: string; // ISO String (YYYY-MM-DD)
  anniversaryDate?: string;
  notes?: string;
  loyaltyPoints?: number;
  isActive: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface CreateCustomerRequest {
  orgId: number;
  customerName: string;
  phoneNumber?: string;
  email?: string;
  gender?: string;
  dateOfBirth?: string;
  anniversaryDate?: string;
  notes?: string;
}

export interface UpdateCustomerRequest {
  customerName?: string;
  phoneNumber?: string;
  email?: string;
  gender?: string;
  dateOfBirth?: string;
  anniversaryDate?: string;
  notes?: string;
}
