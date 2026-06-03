import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../providers/AuthContext';
import type { UserRole } from '../../shared/types/auth.types';
import { Box, CircularProgress } from '@mui/material';

interface ProtectedRouteProps {
  allowedRoles?: UserRole[];
}

export const ProtectedRoute = ({ allowedRoles }: ProtectedRouteProps) => {
  const { isAuthenticated, isLoading, user } = useAuth();

  if (isLoading) {
    return (
      <Box sx={{ display: 'flex', height: '100vh', alignItems: 'center', justifyContent: 'center' }}>
        <CircularProgress />
      </Box>
    );
  }

  // If not logged in, boot them to the login page
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  // If roles are provided, check if the user has permission
  if (allowedRoles && user && !allowedRoles.includes(user.role)) {
    // Redirect to a safe default page if they don't have permission
    return <Navigate to="/" replace />;
  }

  // User is authenticated and authorized! Render the child routes.
  return <Outlet />;
};
