import React from 'react';
import { Box, Typography, Button, IconButton, Divider, Chip, Alert, Menu, MenuItem } from '@mui/material';
import EditIcon from '@mui/icons-material/Edit';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import PersonIcon from '@mui/icons-material/Person';
import NotesIcon from '@mui/icons-material/Notes';
import MoreVertIcon from '@mui/icons-material/MoreVert';
import dayjs from 'dayjs';
import { useRoleAccess } from '../../../../shared/hooks/useRoleAccess';
import type { FullAppointment } from '../../../../shared/types/appointment.types';
import type { PaymentTransaction } from '../../../../shared/types/payment.types';

interface AppointmentViewModeProps {
  appointment: FullAppointment | null;
  error: string;
  isLoading: boolean;
  payments: PaymentTransaction[];
  amountPaid: number;
  remainingBalance: number;
  handleQuickStatusUpdate: (status: string) => void;
  setMode: (mode: 'EDIT') => void;
  setIsPaymentDialogOpen: (open: boolean) => void;
  handleUpdateTransactionStatus: (status: string) => void;
  anchorEl: HTMLElement | null;
  setAnchorEl: (el: HTMLElement | null) => void;
  selectedTransactionId: number | null;
  setSelectedTransactionId: (id: number | null) => void;
}

export const AppointmentViewMode: React.FC<AppointmentViewModeProps> = ({
  appointment,
  error,
  isLoading,
  payments,
  amountPaid,
  remainingBalance,
  handleQuickStatusUpdate,
  setMode,
  setIsPaymentDialogOpen,
  handleUpdateTransactionStatus,
  anchorEl,
  setAnchorEl,
  setSelectedTransactionId
}) => {
  const { hasMinRole } = useRoleAccess();

  const handleMenuClick = (event: React.MouseEvent<HTMLButtonElement>, transactionId: number) => {
    setAnchorEl(event.currentTarget);
    setSelectedTransactionId(transactionId);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
    setSelectedTransactionId(null);
  };

  if (!appointment) return null;

  return (
    <Box sx={{ p: 4, display: 'flex', flexDirection: 'column', gap: 3 }}>
      {error && <Alert severity="error">{error}</Alert>}

      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Typography variant="h5" sx={{ fontWeight: 700 }} color="primary">{appointment.customerName}</Typography>
        <Box sx={{ display: 'flex', gap: 1 }}>
          {appointment.appointmentStatus === 'SCHEDULED' && (
            <>
              <Button variant="outlined" color="info" size="small" sx={{ borderRadius: '24px' }} disabled={isLoading} onClick={() => handleQuickStatusUpdate('IN_PROGRESS')}>
                Start
              </Button>
              <Button variant="outlined" color="error" size="small" sx={{ borderRadius: '24px' }} disabled={isLoading} onClick={() => handleQuickStatusUpdate('NO_SHOW')}>
                No Show
              </Button>
            </>
          )}
          {appointment.appointmentStatus === 'IN_PROGRESS' && (
            <Button variant="outlined" color="success" size="small" sx={{ borderRadius: '24px' }} disabled={isLoading} onClick={() => handleQuickStatusUpdate('COMPLETED')}>
              Complete
            </Button>
          )}
          {hasMinRole('RECEPTIONIST') && (
            <Button startIcon={<EditIcon />} variant="contained" size="small" sx={{ borderRadius: '24px' }} onClick={() => setMode('EDIT')}>
              Edit
            </Button>
          )}
        </Box>
      </Box>

      <Divider />

      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <AccessTimeIcon color="action" />
          <Typography variant="body1">
            {dayjs(appointment.appointmentStartTime).format('dddd, MMM D, YYYY')} <br />
            {dayjs(appointment.appointmentStartTime).format('h:mm A')} - {dayjs(appointment.appointmentEndTime).format('h:mm A')}
          </Typography>
        </Box>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <PersonIcon color="action" />
          <Typography variant="body1">Customer ID: {appointment.customerId}</Typography>
        </Box>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <NotesIcon color="action" />
          <Typography variant="body1">{appointment.notes || 'No notes provided.'}</Typography>
        </Box>
      </Box>

      <Divider />

      <Typography variant="h6" sx={{ fontWeight: 600 }}>Services</Typography>
      {appointment.serviceItems.map((si) => (
        <Box key={si.appointmentServiceItemId} sx={{ p: 2, background: 'rgba(0,0,0,0.03)', borderRadius: '12px' }}>
          <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>{si.serviceName}</Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>{si.notes || 'No specific notes'}</Typography>
          <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
            {si.assignedStaff.map(staff => (
              <Chip key={staff.appointmentServiceStaffId} label={staff.staffUserName} size="small" color="primary" variant="outlined" />
            ))}
          </Box>
        </Box>
      ))}

      <Divider />

      {hasMinRole('RECEPTIONIST') && (
        <>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Typography variant="h6" sx={{ fontWeight: 600 }}>Payments & Billing</Typography>
          </Box>

          <Box sx={{ p: 2, borderRadius: '12px', background: 'rgba(25, 118, 210, 0.05)', border: '1px solid rgba(25, 118, 210, 0.2)', display: 'flex', flexDirection: 'column', gap: 2 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Typography variant="body1" color="text.secondary">Final Amount:</Typography>
              <Typography variant="h6" sx={{ fontWeight: 700 }}>₹{appointment.finalAmount || 0}</Typography>
            </Box>

            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Typography variant="body1" color="text.secondary">Amount Paid:</Typography>
              <Typography variant="h6" color="success.main" sx={{ fontWeight: 700 }}>₹{amountPaid}</Typography>
            </Box>

            <Divider sx={{ borderStyle: 'dashed' }} />

            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Typography variant="body1" sx={{ fontWeight: 600 }}>
                {remainingBalance < 0 ? 'Overpaid (Refund Due):' : 'Balance Due:'}
              </Typography>
              <Typography variant="h5" color={remainingBalance !== 0 ? "error.main" : "text.primary"} sx={{ fontWeight: 700 }}>
                ₹{Math.abs(remainingBalance)}
              </Typography>
            </Box>

            {remainingBalance > 0 && (
              <Button
                variant="contained"
                fullWidth
                size="large"
                sx={{ mt: 1, borderRadius: '24px' }}
                onClick={() => setIsPaymentDialogOpen(true)}
              >
                Record Payment
              </Button>
            )}
          </Box>

          {payments.length > 0 && (
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
              <Typography variant="subtitle2" color="text.secondary">Transaction History</Typography>
              {payments.map(payment => (
                <Box key={payment.transactionId} sx={{ p: 2, background: 'rgba(0,0,0,0.03)', borderRadius: '12px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Box>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>{payment.paymentMode}</Typography>
                      {payment.transactionStatus !== 'SUCCESS' && (
                        <Chip label={payment.transactionStatus} size="small" color={payment.transactionStatus === 'REFUNDED' ? 'warning' : 'error'} sx={{ height: 20, fontSize: '0.7rem' }} />
                      )}
                    </Box>
                    <Typography variant="caption" color="text.secondary">{dayjs(payment.createdAt).format('MMM D, YYYY h:mm A')}</Typography>
                  </Box>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Typography variant="subtitle1" sx={{ fontWeight: 700, textDecoration: payment.transactionStatus !== 'SUCCESS' ? 'line-through' : 'none', color: payment.transactionStatus !== 'SUCCESS' ? 'text.secondary' : 'text.primary' }}>
                      ₹{payment.amount}
                    </Typography>
                    {payment.transactionStatus === 'SUCCESS' && (
                      <IconButton size="small" onClick={(e) => handleMenuClick(e, payment.transactionId)}>
                        <MoreVertIcon fontSize="small" />
                      </IconButton>
                    )}
                  </Box>
                </Box>
              ))}
            </Box>
          )}
        </>
      )}

      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleMenuClose}
      >
        <MenuItem onClick={() => { handleUpdateTransactionStatus('REFUNDED'); handleMenuClose(); }}>Mark as Refunded</MenuItem>
        <MenuItem onClick={() => { handleUpdateTransactionStatus('FAILED'); handleMenuClose(); }}>Mark as Failed</MenuItem>
      </Menu>
    </Box>
  );
};
