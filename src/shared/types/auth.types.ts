export type UserRole = 'ADMIN' | 'MANAGER' | 'OWNER' | 'RECEPTIONIST' | 'STYLIST';

export interface LoginResponse {
  token: string;
}

export interface JwtPayload {
  sub: string; // username
  userId: number;
  orgId: number;
  role: UserRole;
  iat: number;
  exp: number;
}

export interface UserContextData {
  username: string;
  userId: number;
  orgId: number;
  role: UserRole;
}
