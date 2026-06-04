import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from './AuthContext';
import { useRoleAccess } from '../../shared/hooks/useRoleAccess';
import type { UserRole } from '../../shared/types/auth.types';
import { Box, Typography } from '@mui/material';

interface ProtectedRouteProps {
  minRole?: UserRole;
}

export const ProtectedRoute = ({ minRole }: ProtectedRouteProps) => {
  const { isAuthenticated, isLoading } = useAuth();
  const { hasMinRole } = useRoleAccess();

  if (isLoading) {
    return null; // Or a loading spinner
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (minRole && !hasMinRole(minRole)) {
    return (
      <Box sx={{ p: 4, textAlign: 'center' }}>
        <Typography variant="h5" color="error" gutterBottom>
          Access Denied
        </Typography>
        <Typography variant="body1" color="text.secondary">
          You do not have permission to view this page.
        </Typography>
      </Box>
    );
  }

  return <Outlet />;
};
