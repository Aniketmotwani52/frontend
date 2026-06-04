export type UserRole = 'ADMIN' | 'MANAGER' | 'OWNER' | 'HAIR_STYLIST' | 'BEAUTY_ARTIST' | 'STAFF' | 'RECEPTIONIST';

export const ROLE_HIERARCHY: Record<UserRole, number> = {
  ADMIN: 100,
  OWNER: 80,
  MANAGER: 60,
  RECEPTIONIST: 40,
  STAFF: 20,
  HAIR_STYLIST: 20,
  BEAUTY_ARTIST: 20
};

export interface LoginResponse {
  token: string;
}

export interface JwtPayload {
  sub: string; // userId as subject
  username?: string;
  userId?: number;
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
