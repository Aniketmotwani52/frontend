export type PaymentMode = 'CASH' | 'UPI' | 'CARD' | 'BANK_TRANSFER';
export type TransactionStatus = 'SUCCESS' | 'FAILED' | 'REFUNDED';

export interface PaymentTransaction {
  transactionId: number;
  appointmentId?: number;
  customerPackageId?: number;
  customerPackageName?: string;
  customerName?: string;
  amount: number;
  paymentMode: PaymentMode;
  transactionStatus: TransactionStatus;
  transactionReference?: string;
  notes?: string;
  createdAt: string;
}

export interface CreatePaymentRequest {
  appointmentId: number;
  createdByUserId: number;
  amount: number;
  paymentMode: PaymentMode;
  transactionReference?: string;
  notes?: string;
}

export interface PendingDue {
  sourceId: number;
  sourceType: 'APPOINTMENT' | 'PACKAGE';
  sourceName: string;
  customerId: number;
  customerName: string;
  date: string;
  finalAmount: number;
  amountPaid: number;
  remainingBalance: number;
}
