import React, { useState } from 'react';
import {
  Dialog, DialogTitle, DialogContent, DialogActions,
  Button, TextField, MenuItem, Box, Typography,
  CircularProgress, Alert, Stack
} from '@mui/material';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { paymentApi } from '../../../shared/api/payment.api';
import { useAuth } from '../../../app/providers/AuthContext';
import type { CustomerPackage } from '../types/package.types';

interface RecordPackagePaymentDialogProps {
  open: boolean;
  onClose: () => void;
  customerPackage: CustomerPackage | null;
}

export const RecordPackagePaymentDialog: React.FC<RecordPackagePaymentDialogProps> = ({ open, onClose, customerPackage }) => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [amount, setAmount] = useState('');
  const [paymentMode, setPaymentMode] = useState('CASH');
  const [transactionReference, setTransactionReference] = useState('');
  const [notes, setNotes] = useState('');
  const [error, setError] = useState<string | null>(null);

  const remainingBalance = customerPackage ? customerPackage.finalAmount - customerPackage.amountPaid : 0;

  // Initialize amount with remaining balance when opened
  React.useEffect(() => {
    if (open && customerPackage) {
      setAmount(remainingBalance.toString());
      setPaymentMode('CASH');
      setTransactionReference('');
      setNotes('');
      setError(null);
    }
  }, [open, customerPackage]);

  const mutation = useMutation({
    mutationFn: (data: any) => paymentApi.createPackagePayment(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['customerPackages'] });
      onClose();
    },
    onError: (err: any) => {
      setError(err.response?.data?.message || 'Failed to record payment');
    }
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customerPackage) return;

    if (Number(amount) <= 0) {
      setError('Amount must be greater than zero');
      return;
    }
    if (Number(amount) > remainingBalance) {
      setError(`Amount cannot exceed the remaining balance (₹${remainingBalance})`);
      return;
    }

    const payload = {
      customerPackageId: customerPackage.customerPackageId,
      createdByUserId: user?.userId,
      amount: Number(amount),
      paymentMode,
      transactionReference,
      notes
    };

    mutation.mutate(payload);
  };

  if (!customerPackage) return null;

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>Record Package Payment</DialogTitle>
      <form onSubmit={handleSubmit}>
        <DialogContent dividers>
          {error && <Alert severity="error" sx={{ mb: 3 }}>{error}</Alert>}

          <Stack spacing={3}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', p: 2, bgcolor: 'background.default', borderRadius: 1, border: '1px solid var(--border-color)' }}>
              <Box>
                <Typography variant="body2" color="text.secondary">Total Package Cost</Typography>
                <Typography variant="h6">₹{customerPackage.finalAmount}</Typography>
              </Box>
              <Box>
                <Typography variant="body2" color="text.secondary">Amount Paid</Typography>
                <Typography variant="h6" color="success.main">₹{customerPackage.amountPaid}</Typography>
              </Box>
              <Box>
                <Typography variant="body2" color="text.secondary">Remaining Balance</Typography>
                <Typography variant="h6" color="error.main">₹{remainingBalance}</Typography>
              </Box>
            </Box>

            <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2 }}>
              <TextField
                label="Payment Amount"
                type="number"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                required
                fullWidth
                slotProps={{ htmlInput: { step: "0.01", min: "0" } }}
              />
              <TextField
                select
                label="Payment Mode"
                value={paymentMode}
                onChange={(e) => setPaymentMode(e.target.value)}
                required
                fullWidth
              >
                <MenuItem value="CASH">Cash</MenuItem>
                <MenuItem value="CREDIT_CARD">Credit Card</MenuItem>
                <MenuItem value="DEBIT_CARD">Debit Card</MenuItem>
                <MenuItem value="UPI">UPI</MenuItem>
                <MenuItem value="BANK_TRANSFER">Bank Transfer</MenuItem>
              </TextField>
            </Box>

            <TextField
              label="Transaction Reference (Optional)"
              value={transactionReference}
              onChange={(e) => setTransactionReference(e.target.value)}
              fullWidth
              placeholder="e.g. UPI Ref Number"
            />

            <TextField
              label="Notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              multiline
              rows={2}
              fullWidth
            />
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={onClose} disabled={mutation.isPending}>Cancel</Button>
          <Button 
            type="submit" 
            variant="contained" 
            disabled={mutation.isPending}
            startIcon={mutation.isPending ? <CircularProgress size={20} /> : undefined}
          >
            Record Payment
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  );
};
