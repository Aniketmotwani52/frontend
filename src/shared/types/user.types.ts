export type UserRole = 'ADMIN' | 'MANAGER' | 'OWNER' | 'RECEPTIONIST' | 'STAFF';
export type UserStatus = 'ACTIVE' | 'INACTIVE' | 'ON_LEAVE';

export interface User {
  userId: number;
  orgId: number;
  orgName?: string;
  userName: string;
  phoneNumber?: string;
  email?: string;
  gender?: string;
  dateOfBirth?: string;
  role: UserRole;
  status: UserStatus;
  userSalary?: number;
  workStartTime?: string; // HH:mm format
  workEndTime?: string; // HH:mm format
  authUsername?: string;
  isActive: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface CreateUserRequest {
  orgId: number;
  userName: string;
  phoneNumber?: string;
  email?: string;
  gender?: string;
  dateOfBirth?: string;
  role: UserRole;
  status: UserStatus;
  userSalary?: number;
  workStartTime?: string;
  workEndTime?: string;
  authUsername?: string;
  authPassword?: string;
}

export interface UpdateUserRequest {
  userName?: string;
  phoneNumber?: string;
  email?: string;
  gender?: string;
  dateOfBirth?: string;
  role?: UserRole;
  status?: UserStatus;
  userSalary?: number;
  workStartTime?: string;
  workEndTime?: string;
  authUsername?: string;
  authPassword?: string;
}
