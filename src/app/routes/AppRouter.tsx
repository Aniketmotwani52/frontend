import React from 'react';
import { Routes, Route } from 'react-router-dom';
import { MainLayout } from '../layouts/MainLayout';
import { Typography, Box } from '@mui/material';
import { ProtectedRoute } from '../providers/ProtectedRoute';
import { LoginPage } from '../../features/auth/pages/LoginPage';

import { CustomerList } from '../../features/customers/pages/CustomerList';

import { ServicesPage } from '../../features/services/pages/ServicesPage';
import { StaffList } from '../../features/staff/pages/StaffList';
import { AppointmentsCalendar } from '../../features/appointments/pages/AppointmentsCalendar';
import { PaymentList } from '../../features/payments/pages/PaymentList';

import { OwnerDashboard } from '../../features/dashboard/pages/OwnerDashboard';

export const AppRouter = () => {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      
      {/* All routes inside this wrapper require authentication */}
      <Route element={<ProtectedRoute />}>
        <Route path="/" element={<MainLayout />}>
          <Route index element={<OwnerDashboard />} />
          <Route path="scheduler" element={<AppointmentsCalendar />} />
          {/* Customers & Payments Route - RECEPTIONIST and above */}
          <Route element={<ProtectedRoute minRole="RECEPTIONIST" />}>
            <Route path="customers" element={<CustomerList />} />
            <Route path="payments" element={<PaymentList />} />
          </Route>

          {/* Services & Staff Route - MANAGER and above */}
          <Route element={<ProtectedRoute minRole="MANAGER" />}>
            <Route path="services" element={<ServicesPage />} />
            <Route path="staff" element={<StaffList />} />
          </Route>
        </Route>
      </Route>
    </Routes>
  );
};
