import React from 'react';
import { Routes, Route } from 'react-router-dom';
import { MainLayout } from '../layouts/MainLayout';
import { Typography, Box } from '@mui/material';
import { ProtectedRoute } from './ProtectedRoute';
import { LoginPage } from '../../features/auth/pages/LoginPage';

import { CustomerList } from '../../features/customers/pages/CustomerList';

import { ServiceList } from '../../features/services/pages/ServiceList';

// Temporary Placeholder Pages
const Dashboard = () => (
  <Box className="glass-panel" sx={{ p: 4, height: '100%' }}>
    <Typography variant="h4" color="primary">Dashboard</Typography>
    <Typography color="text.secondary" sx={{ mt: 2 }}>Welcome to the Salon Management System.</Typography>
  </Box>
);

const Scheduler = () => (
  <Box className="glass-panel" sx={{ p: 4, height: '100%' }}>
    <Typography variant="h4" color="primary">Scheduler</Typography>
    <Typography color="text.secondary" sx={{ mt: 2 }}>Calendar view goes here.</Typography>
  </Box>
);

export const AppRouter = () => {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      
      {/* All routes inside this wrapper require authentication */}
      <Route element={<ProtectedRoute />}>
        <Route path="/" element={<MainLayout />}>
          <Route index element={<Dashboard />} />
          <Route path="scheduler" element={<Scheduler />} />
          
          {/* Customers & Services Route - configured for future RBAC by passing allowedRoles={['OWNER', 'ADMIN']} */}
          <Route element={<ProtectedRoute allowedRoles={['OWNER', 'ADMIN']} />}>
            <Route path="customers" element={<CustomerList />} />
            <Route path="services" element={<ServiceList />} />
          </Route>
        </Route>
      </Route>
    </Routes>
  );
};
