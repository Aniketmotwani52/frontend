import React, { useState, useEffect } from 'react';
import { Box, Typography, Card, CardContent, Chip, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper, CircularProgress } from '@mui/material';
import { useAuth } from '../../../app/providers/AuthContext';
import { paymentApi } from '../../../shared/api/payment.api';
import type { PaymentTransaction } from '../../../shared/types/payment.types';
import dayjs from 'dayjs';
import PaymentsIcon from '@mui/icons-material/Payments';

export const PaymentList = () => {
  const { user } = useAuth();
  const [payments, setPayments] = useState<PaymentTransaction[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (user?.orgId) {
      loadPayments();
    }
  }, [user]);

  const loadPayments = async () => {
    setIsLoading(true);
    try {
      const data = await paymentApi.getByOrgId(user!.orgId);
      setPayments(data);
    } catch (error) {
      console.error("Failed to load payments", error);
    } finally {
      setIsLoading(false);
    }
  };

  const todayRevenue = payments
    .filter(p => p.transactionStatus === 'SUCCESS' && dayjs(p.createdAt).isSame(dayjs(), 'day'))
    .reduce((sum, p) => sum + p.amount, 0);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'SUCCESS': return 'success';
      case 'FAILED': return 'error';
      case 'REFUNDED': return 'warning';
      default: return 'default';
    }
  };

  return (
    <Box sx={{ p: 4, display: 'flex', flexDirection: 'column', gap: 4 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Box>
          <Typography variant="h4" sx={{ fontWeight: 800, color: 'var(--text-primary)', mb: 1 }}>
            Payments & Ledger
          </Typography>
          <Typography variant="body1" color="text.secondary">
            View all incoming transactions and financial history.
          </Typography>
        </Box>
      </Box>

      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1fr 1fr 1fr' }, gap: 3 }}>
        <Card sx={{ background: 'linear-gradient(135deg, #1976d2 0%, #1565c0 100%)', color: 'white', borderRadius: '16px' }}>
          <CardContent sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <PaymentsIcon />
              <Typography variant="h6" sx={{ fontWeight: 600 }}>Today's Revenue</Typography>
            </Box>
            <Typography variant="h3" sx={{ fontWeight: 800 }}>₹{todayRevenue}</Typography>
          </CardContent>
        </Card>
      </Box>

      {isLoading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', p: 5 }}><CircularProgress /></Box>
      ) : (
        <TableContainer component={Paper} sx={{ borderRadius: '16px', border: '1px solid var(--border-color)', boxShadow: 'none' }}>
          <Table>
            <TableHead sx={{ background: 'rgba(0,0,0,0.02)' }}>
              <TableRow>
                <TableCell sx={{ fontWeight: 700 }}>Date</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>Appt ID</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>Mode</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>Amount</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>Status</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>Reference / Notes</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {payments.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} align="center" sx={{ py: 4, color: 'text.secondary' }}>No payments found.</TableCell>
                </TableRow>
              ) : (
                payments.map((p) => (
                  <TableRow key={p.transactionId} hover>
                    <TableCell>{dayjs(p.createdAt).format('MMM D, YYYY h:mm A')}</TableCell>
                    <TableCell>#{p.appointmentId}</TableCell>
                    <TableCell><Chip label={p.paymentMode} size="small" variant="outlined" /></TableCell>
                    <TableCell sx={{ fontWeight: 600 }}>₹{p.amount}</TableCell>
                    <TableCell>
                      <Chip label={p.transactionStatus} size="small" color={getStatusColor(p.transactionStatus) as any} />
                    </TableCell>
                    <TableCell>{p.transactionReference || p.notes || '-'}</TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </TableContainer>
      )}
    </Box>
  );
};
