import React, { useState, useEffect } from 'react';
import { Box, Typography, Card, CardContent, Chip, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper, CircularProgress, Tabs, Tab, MenuItem, Select, FormControl, InputLabel, Button } from '@mui/material';
import { useAuth } from '../../../app/providers/AuthContext';
import { paymentApi } from '../../../shared/api/payment.api';
import type { PaymentTransaction, PendingDue } from '../../../shared/types/payment.types';
import { PaymentDialog } from '../components/PaymentDialog';
import { LocalizationProvider, DatePicker } from '@mui/x-date-pickers';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import dayjs, { Dayjs } from 'dayjs';
import PaymentsIcon from '@mui/icons-material/Payments';
import AccountBalanceWalletIcon from '@mui/icons-material/AccountBalanceWallet';
import CreditCardIcon from '@mui/icons-material/CreditCard';
import QrCode2Icon from '@mui/icons-material/QrCode2';
import SearchIcon from '@mui/icons-material/Search';
import { TextField, InputAdornment } from '@mui/material';

export const PaymentList = () => {
  const { user } = useAuth();
  const [payments, setPayments] = useState<PaymentTransaction[]>([]);
  const [pendingDuesDetails, setPendingDuesDetails] = useState<PendingDue[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [fromDate, setFromDate] = useState<Dayjs | null>(dayjs());
  const [toDate, setToDate] = useState<Dayjs | null>(dayjs());
  const [searchQuery, setSearchQuery] = useState('');
  const [paymentModeFilter, setPaymentModeFilter] = useState('ALL');
  const [tabIndex, setTabIndex] = useState(0);
  
  // Payment Collection state
  const [isPaymentDialogOpen, setIsPaymentDialogOpen] = useState(false);
  const [selectedPendingDue, setSelectedPendingDue] = useState<PendingDue | null>(null);

  useEffect(() => {
    if (user?.orgId) {
      loadPayments();
    }
  }, [user, fromDate, toDate]);

  const loadPayments = async () => {
    setIsLoading(true);
    try {
      const fromStr = fromDate ? fromDate.startOf('day').format('YYYY-MM-DDTHH:mm:ss') : undefined;
      const toStr = toDate ? toDate.endOf('day').format('YYYY-MM-DDTHH:mm:ss') : undefined;
      const [data, duesDetails] = await Promise.all([
        paymentApi.getByOrgId(user!.orgId, fromStr, toStr),
        paymentApi.getPendingDuesDetails(user!.orgId)
      ]);
      setPayments(data);
      setPendingDuesDetails(duesDetails);
    } catch (error) {
      console.error("Failed to load payments", error);
    } finally {
      setIsLoading(false);
    }
  };

  const pendingDuesTotal = pendingDuesDetails.reduce((sum, p) => sum + p.remainingBalance, 0);

  const successfulPayments = payments.filter(p => p.transactionStatus === 'SUCCESS');
  
  const totalRevenue = successfulPayments.reduce((sum, p) => sum + p.amount, 0);
  const cashRevenue = successfulPayments.filter(p => p.paymentMode === 'CASH').reduce((sum, p) => sum + p.amount, 0);
  const cardRevenue = successfulPayments.filter(p => p.paymentMode === 'CARD').reduce((sum, p) => sum + p.amount, 0);
  const upiRevenue = successfulPayments.filter(p => p.paymentMode === 'UPI').reduce((sum, p) => sum + p.amount, 0);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'SUCCESS': return 'success';
      case 'FAILED': return 'error';
      case 'REFUNDED': return 'warning';
      default: return 'default';
    }
  };

  const handleCollectPayment = (due: PendingDue) => {
    setSelectedPendingDue(due);
    setIsPaymentDialogOpen(true);
  };

  const handlePaymentSuccess = () => {
    loadPayments();
  };

  return (
    <Box sx={{ p: 4, display: 'flex', flexDirection: 'column', gap: 4 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 2 }}>
        <Box>
          <Typography variant="h4" sx={{ fontWeight: 800, color: 'var(--text-primary)', mb: 1 }}>
            Payments & Ledger
          </Typography>
          <Typography variant="body1" color="text.secondary">
            View all incoming transactions and financial history.
          </Typography>
        </Box>
        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2, alignItems: 'center', background: 'rgba(255,255,255,0.6)', p: 1, borderRadius: 3 }}>
          <TextField
            size="small"
            placeholder="Search customer/phone..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            slotProps={{
              input: {
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon color="action" fontSize="small" />
                  </InputAdornment>
                ),
              }
            }}
            sx={{ width: { xs: '100%', sm: 200 }, background: 'var(--bg-paper)' }}
          />
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
        </Box>
      </Box>

      <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 3 }}>
        <Card sx={{ background: 'linear-gradient(135deg, #1976d2 0%, #1565c0 100%)', color: 'white', borderRadius: '16px' }}>
          <CardContent sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <PaymentsIcon />
              <Typography variant="h6" sx={{ fontWeight: 600 }}>Total Revenue</Typography>
            </Box>
            <Typography variant="h4" sx={{ fontWeight: 800 }}>₹{totalRevenue}</Typography>
          </CardContent>
        </Card>

        <Card sx={{ background: 'linear-gradient(135deg, #d32f2f 0%, #c62828 100%)', color: 'white', borderRadius: '16px' }}>
          <CardContent sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <AccountBalanceWalletIcon />
              <Typography variant="h6" sx={{ fontWeight: 600 }}>Pending Dues</Typography>
            </Box>
            <Typography variant="h4" sx={{ fontWeight: 800 }}>₹{pendingDuesTotal}</Typography>
          </CardContent>
        </Card>
        
        <Card sx={{ background: 'linear-gradient(135deg, #2e7d32 0%, #1b5e20 100%)', color: 'white', borderRadius: '16px' }}>
          <CardContent sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <AccountBalanceWalletIcon />
              <Typography variant="h6" sx={{ fontWeight: 600 }}>Cash</Typography>
            </Box>
            <Typography variant="h4" sx={{ fontWeight: 800 }}>₹{cashRevenue}</Typography>
          </CardContent>
        </Card>

        <Card sx={{ background: 'linear-gradient(135deg, #ed6c02 0%, #e65100 100%)', color: 'white', borderRadius: '16px' }}>
          <CardContent sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <CreditCardIcon />
              <Typography variant="h6" sx={{ fontWeight: 600 }}>Card</Typography>
            </Box>
            <Typography variant="h4" sx={{ fontWeight: 800 }}>₹{cardRevenue}</Typography>
          </CardContent>
        </Card>

        <Card sx={{ background: 'linear-gradient(135deg, #9c27b0 0%, #6a1b9a 100%)', color: 'white', borderRadius: '16px' }}>
          <CardContent sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <QrCode2Icon />
              <Typography variant="h6" sx={{ fontWeight: 600 }}>UPI</Typography>
            </Box>
            <Typography variant="h4" sx={{ fontWeight: 800 }}>₹{upiRevenue}</Typography>
          </CardContent>
        </Card>
      </Box>

      <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
        <Tabs value={tabIndex} onChange={(_, newVal) => setTabIndex(newVal)}>
          <Tab label="Transaction History" />
          <Tab label={`Pending Dues (${pendingDuesDetails.length})`} />
        </Tabs>
      </Box>

      {isLoading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', p: 5 }}><CircularProgress /></Box>
      ) : tabIndex === 0 ? (
        <Box>
          <Box sx={{ mb: 2, display: 'flex', justifyContent: 'flex-end' }}>
            <FormControl size="small" sx={{ width: 200, background: 'var(--bg-paper)' }}>
              <InputLabel>Payment Mode</InputLabel>
              <Select value={paymentModeFilter} label="Payment Mode" onChange={e => setPaymentModeFilter(e.target.value)}>
                <MenuItem value="ALL">All Modes</MenuItem>
                <MenuItem value="CASH">Cash</MenuItem>
                <MenuItem value="CARD">Card</MenuItem>
                <MenuItem value="UPI">UPI</MenuItem>
              </Select>
            </FormControl>
          </Box>
          <TableContainer component={Paper} sx={{ borderRadius: '16px', border: '1px solid var(--border-color)', boxShadow: 'none' }}>
          <Table>
            <TableHead sx={{ background: 'rgba(0,0,0,0.02)' }}>
              <TableRow>
                <TableCell sx={{ fontWeight: 700 }}>Date</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>Customer</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>Source</TableCell>
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
                payments.filter(p => {
                  if (paymentModeFilter !== 'ALL' && p.paymentMode !== paymentModeFilter) return false;
                  if (!searchQuery) return true;
                  const q = searchQuery.toLowerCase();
                  const customerName = p.customerName || '';
                  const amount = p.amount.toString();
                  return customerName.toLowerCase().includes(q) || amount.includes(q);
                }).map((p) => (
                  <TableRow key={p.transactionId} hover>
                    <TableCell>{dayjs(p.createdAt).format('MMM D, YYYY h:mm A')}</TableCell>
                    <TableCell sx={{ fontWeight: 600 }}>{p.customerName || 'Unknown'}</TableCell>
                    <TableCell>
                      {p.customerPackageId 
                        ? <Chip label={`Package: ${p.customerPackageName}`} size="small" color="secondary" variant="outlined" />
                        : <Chip label={`Appointment #${p.appointmentId}`} size="small" color="primary" variant="outlined" />
                      }
                    </TableCell>
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
        </Box>
      ) : (
        <TableContainer component={Paper} sx={{ borderRadius: '16px', border: '1px solid var(--border-color)', boxShadow: 'none' }}>
          <Table>
            <TableHead sx={{ background: 'rgba(0,0,0,0.02)' }}>
              <TableRow>
                <TableCell sx={{ fontWeight: 700 }}>Date</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>Customer</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>Source</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>Total</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>Paid</TableCell>
                <TableCell sx={{ fontWeight: 700, color: 'error.main' }}>Due</TableCell>
                <TableCell sx={{ fontWeight: 700, align: 'right' }}>Action</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {pendingDuesDetails.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} align="center" sx={{ py: 4, color: 'text.secondary' }}>No pending dues.</TableCell>
                </TableRow>
              ) : (
                pendingDuesDetails.filter(p => {
                  if (!searchQuery) return true;
                  const q = searchQuery.toLowerCase();
                  const customerName = p.customerName || '';
                  const amount = p.remainingBalance.toString();
                  return customerName.toLowerCase().includes(q) || amount.includes(q);
                }).map((p, i) => (
                  <TableRow key={i} hover>
                    <TableCell>{dayjs(p.date).format('MMM D, YYYY')}</TableCell>
                    <TableCell sx={{ fontWeight: 600 }}>{p.customerName || 'Unknown'}</TableCell>
                    <TableCell>
                      <Chip 
                        label={p.sourceName} 
                        size="small" 
                        color={p.sourceType === 'PACKAGE' ? "secondary" : "primary"} 
                        variant="outlined" 
                      />
                    </TableCell>
                    <TableCell>₹{p.finalAmount}</TableCell>
                    <TableCell>₹{p.amountPaid}</TableCell>
                    <TableCell sx={{ fontWeight: 700, color: 'error.main' }}>₹{p.remainingBalance}</TableCell>
                    <TableCell align="right">
                      {p.sourceType === 'APPOINTMENT' ? (
                        <Button variant="contained" size="small" onClick={() => handleCollectPayment(p)}>Collect Payment</Button>
                      ) : (
                        <Typography variant="caption" color="text.secondary">Go to Packages to collect</Typography>
                      )}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </TableContainer>
      )}

      {selectedPendingDue && selectedPendingDue.sourceType === 'APPOINTMENT' && (
        <PaymentDialog
          open={isPaymentDialogOpen}
          onClose={() => {
            setIsPaymentDialogOpen(false);
            setSelectedPendingDue(null);
          }}
          onSuccess={handlePaymentSuccess}
          appointmentId={selectedPendingDue.sourceId}
          userId={user?.userId!}
          remainingBalance={selectedPendingDue.remainingBalance}
        />
      )}
    </Box>
  );
};
