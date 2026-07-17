import { useAuth } from '../../app/providers/AuthContext';
import { type UserRole, ROLE_HIERARCHY } from '../types/auth.types';

export const useRoleAccess = () => {
  const { user } = useAuth();

  const hasMinRole = (requiredRole: UserRole): boolean => {
    if (!user || !user.role) return false;

    const userRoleWeight = ROLE_HIERARCHY[user.role as UserRole] || 0;
    const requiredRoleWeight = ROLE_HIERARCHY[requiredRole];

    return userRoleWeight >= requiredRoleWeight;
  };

  return { hasMinRole };
};
