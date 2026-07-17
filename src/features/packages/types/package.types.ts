export interface PackageServiceItem {
  id?: number;
  serviceId: number;
  serviceName?: string;
  quantity: number;
}

export interface Package {
  packageId: number;
  orgId: number;
  name: string;
  description?: string;
  basePrice: number;
  validityDays?: number;
  isActive: boolean;
  services: PackageServiceItem[];
}

export interface CreatePackageRequest {
  orgId: number;
  name: string;
  description?: string;
  basePrice: number;
  validityDays?: number;
  isActive: boolean;
  services: PackageServiceItem[];
}

export interface CustomerPackageBalance {
  id: number;
  serviceId: number;
  serviceName: string;
  totalQuantity: number;
  usedQuantity: number;
}

export interface CustomerPackage {
  customerPackageId: number;
  customerId: number;
  packageId?: number;
  name: string;
  totalAmount: number;
  discountAmount: number;
  finalAmount: number;
  amountPaid: number;
  status: 'PAID' | 'PARTIALLY_PAID' | 'UNPAID' | 'CANCELLED';
  expiresAt?: string;
  createdAt: string;
  balances: CustomerPackageBalance[];
}

export interface SellPackageRequest {
  orgId: number;
  customerId: number;
  packageId: number;
  name?: string;
  discountAmount: number;
  initialPaymentAmount: number;
  paymentMode: 'CASH' | 'CARD' | 'UPI';
  notes?: string;
}
