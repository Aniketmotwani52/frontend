import React, { useState, useEffect } from 'react';
import { Box, Typography, Grid, CircularProgress, Container, Button } from '@mui/material';
import { LocalizationProvider, DatePicker } from '@mui/x-date-pickers';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import dayjs, { Dayjs } from 'dayjs';
import AttachMoneyIcon from '@mui/icons-material/AttachMoney';
import EventAvailableIcon from '@mui/icons-material/EventAvailable';
import ScheduleIcon from '@mui/icons-material/Schedule';
import AccountBalanceWalletIcon from '@mui/icons-material/AccountBalanceWallet';

import { useAuth } from '../../../app/providers/AuthContext';
import { dashboardApi } from '../../../shared/api/dashboard.api';
import { appointmentApi } from '../../../shared/api/appointment.api';
import type { DashboardSummaryResponse } from '../../../shared/types/dashboard.types';
import { useRoleAccess } from '../../../shared/hooks/useRoleAccess';

import { KpiCard } from '../components/KpiCard';
import { UpcomingAppointmentsList } from '../components/UpcomingAppointmentsList';
import { StaffLeaderboard } from '../components/StaffLeaderboard';
import { RevenueChart } from '../components/RevenueChart';
import { PopularServicesChart } from '../components/PopularServicesChart';

export const OwnerDashboard: React.FC = () => {
  const { user } = useAuth();
  const { hasMinRole } = useRoleAccess();
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<DashboardSummaryResponse | null>(null);
  
  // Default to today
  const [fromDate, setFromDate] = useState<Dayjs | null>(dayjs().startOf('day'));
  const [toDate, setToDate] = useState<Dayjs | null>(dayjs().endOf('day'));

  const fetchDashboardData = async () => {
    if (!user?.orgId) return;
    try {
      setLoading(true);
      const from = fromDate ? fromDate.format('YYYY-MM-DDTHH:mm:ss') : undefined;
      const to = toDate ? toDate.format('YYYY-MM-DDTHH:mm:ss') : undefined;
      if (hasMinRole('MANAGER')) {
        const response = await dashboardApi.getSummary(user.orgId, from, to);
        setData(response);
      } else {
        // For staff, only fetch appointments to avoid 403 on financial data
        const appts = await appointmentApi.getFullByOrg(user.orgId);
        
        const filteredAppts = appts.filter(a => {
          const start = dayjs(a.appointmentStartTime);
          const isAfterFrom = fromDate ? start.isAfter(fromDate) || start.isSame(fromDate, 'day') : true;
          const isBeforeTo = toDate ? start.isBefore(toDate) || start.isSame(toDate, 'day') : true;
          return isAfterFrom && isBeforeTo;
        });
        
        // Isolate to just this staff member's appointments
        const myAppts = filteredAppts.filter(a => 
           a.serviceItems?.some(s => s.assignedStaff?.some(staff => staff.staffUserId === user.userId))
        );

        setData({
          totalRevenue: 0,
          totalAppointments: myAppts.length,
          completedAppointments: myAppts.filter(a => a.appointmentStatus === 'COMPLETED').length,
          pendingPaymentsAmount: 0,
          revenueTrend: [],
          popularServices: [],
          upcomingAppointments: myAppts
            .filter(a => a.appointmentStatus !== 'COMPLETED')
            .map(a => ({
              appointmentId: a.appointmentId,
              customerName: a.customerName,
              startTime: a.appointmentStartTime,
              endTime: a.appointmentEndTime,
              status: a.appointmentStatus,
              staffName: user.username
            })),
          staffPerformance: []
        });
      }
    } catch (error) {
      console.error('Failed to fetch dashboard data', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, [user?.orgId, fromDate, toDate]);

  if (!user) return null;

  return (
    <Box sx={{ 
      flexGrow: 1, 
      p: 3, 
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #fdfbfb 0%, #ebedee 100%)' 
    }}>
      <Container maxWidth="xl">
        {/* Header & Date Pickers */}
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4, flexWrap: 'wrap', gap: 2 }}>
          <Box>
            <Typography variant="h4" sx={{ fontWeight: 800 }} color="text.primary" gutterBottom>
              Dashboard
            </Typography>
            <Typography variant="subtitle1" color="text.secondary">
              Welcome back, {user.username}! Here's what's happening.
            </Typography>
          </Box>
          
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2, alignItems: 'center', background: 'rgba(255,255,255,0.6)', p: 1, borderRadius: 3, backdropFilter: 'blur(10px)' }}>
            <LocalizationProvider dateAdapter={AdapterDayjs}>
              <DatePicker
                label="From Date"
                value={fromDate}
                onChange={(newValue) => setFromDate(newValue)}
                slotProps={{ textField: { size: 'small', sx: { width: { xs: '100%', sm: 160 } } } }}
              />
              <DatePicker
                label="To Date"
                value={toDate}
                onChange={(newValue) => setToDate(newValue)}
                slotProps={{ textField: { size: 'small', sx: { width: { xs: '100%', sm: 160 } } } }}
              />
            </LocalizationProvider>
            <Button 
              variant="contained" 
              onClick={fetchDashboardData}
              sx={{ borderRadius: 2, textTransform: 'none', fontWeight: 600, px: 3 }}
            >
              Apply
            </Button>
          </Box>
        </Box>

        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', mt: 10 }}>
            <CircularProgress size={60} thickness={4} />
          </Box>
        ) : data ? (
          <Grid container spacing={3}>
            {/* KPI Row */}
            {hasMinRole('MANAGER') && (
              <Grid size={{ xs: 12, sm: 6, md: 4 }}>
                <KpiCard 
                  title="Revenue" 
                  value={`₹${data.totalRevenue}`} 
                  icon={<AttachMoneyIcon fontSize="large" />} 
                  color="#4caf50" 
                />
              </Grid>
            )}
            <Grid size={{ xs: 12, sm: 6, md: hasMinRole('MANAGER') ? 4 : 6 }}>
              <KpiCard 
                title="Appointments" 
                value={data.totalAppointments} 
                subtitle={`${data.completedAppointments} Completed`}
                icon={<EventAvailableIcon fontSize="large" />} 
                color="#1976d2" 
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 6, md: hasMinRole('MANAGER') ? 4 : 6 }}>
              <KpiCard 
                title="Upcoming" 
                value={data.upcomingAppointments.length} 
                icon={<ScheduleIcon fontSize="large" />} 
                color="#ff9800" 
              />
            </Grid>

            {/* Charts Row */}
            {hasMinRole('MANAGER') && (
              <>
                <Grid size={{ xs: 12, md: 8 }}>
                  <RevenueChart data={data.revenueTrend} />
                </Grid>
                <Grid size={{ xs: 12, md: 4 }}>
                  <PopularServicesChart data={data.popularServices} />
                </Grid>
              </>
            )}

            {/* Lists Row */}
            <Grid size={{ xs: 12, md: hasMinRole('MANAGER') ? 6 : 12 }}>
              <Box sx={{ height: 400 }}>
                <UpcomingAppointmentsList appointments={data.upcomingAppointments} />
              </Box>
            </Grid>
            {hasMinRole('MANAGER') && (
              <Grid size={{ xs: 12, md: 6 }}>
                <Box sx={{ height: 400 }}>
                  <StaffLeaderboard staff={data.staffPerformance} />
                </Box>
              </Grid>
            )}
          </Grid>
        ) : (
          <Typography color="error">Failed to load data</Typography>
        )}
      </Container>
    </Box>
  );
};
