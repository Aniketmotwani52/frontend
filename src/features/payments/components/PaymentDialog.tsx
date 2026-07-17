import React, { useState } from 'react';
import { Dialog, DialogTitle, DialogContent, DialogActions, Button, TextField, Select, MenuItem, FormControl, InputLabel, Box, CircularProgress, Alert } from '@mui/material';
import { paymentApi } from '../../../shared/api/payment.api';
import type { PaymentMode } from '../../../shared/types/payment.types';

interface PaymentDialogProps {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
  appointmentId: number;
  userId: number;
  remainingBalance: number;
}

export const PaymentDialog = ({ open, onClose, onSuccess, appointmentId, userId, remainingBalance }: PaymentDialogProps) => {
  const [amount, setAmount] = useState(remainingBalance.toString());
  const [paymentMode, setPaymentMode] = useState<PaymentMode>('CASH');
  const [transactionReference, setTransactionReference] = useState('');
  const [notes, setNotes] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (Number(amount) <= 0) {
      setError('Amount must be greater than 0');
      return;
    }
    if (Number(amount) > remainingBalance) {
      setError('Amount cannot exceed the remaining balance');
      return;
    }

    setIsLoading(true);
    setError('');
    
    try {
      await paymentApi.create({
        appointmentId,
        createdByUserId: userId,
        amount: Number(amount),
        paymentMode,
        transactionReference,
        notes
      });
      onSuccess();
      onClose();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to record payment');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth slotProps={{ backdrop: { sx: { backgroundColor: 'rgba(0,0,0,0.2)' } } }}>
      <form onSubmit={handleSubmit}>
        <DialogTitle sx={{ fontWeight: 700 }}>Record Payment</DialogTitle>
        <DialogContent>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 1 }}>
            {error && <Alert severity="error">{error}</Alert>}
            
            <TextField
              label="Amount (₹)"
              type="number"
              required
              fullWidth
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              onWheel={(e) => (e.target as HTMLElement).blur()}
              helperText={`Remaining Balance: ₹${remainingBalance}`}
            />

            <FormControl fullWidth required>
              <InputLabel>Payment Mode</InputLabel>
              <Select
                value={paymentMode}
                label="Payment Mode"
                onChange={(e) => setPaymentMode(e.target.value as PaymentMode)}
              >
                <MenuItem value="CASH">Cash</MenuItem>
                <MenuItem value="UPI">UPI</MenuItem>
                <MenuItem value="CARD">Card</MenuItem>
                <MenuItem value="BANK_TRANSFER">Bank Transfer</MenuItem>
              </Select>
            </FormControl>

            <TextField
              label="Transaction Reference (Optional)"
              fullWidth
              value={transactionReference}
              onChange={(e) => setTransactionReference(e.target.value)}
              placeholder="UPI Ref, Cheque No, etc."
            />

            <TextField
              label="Notes (Optional)"
              fullWidth
              multiline
              rows={2}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
            />
          </Box>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 3 }}>
          <Button onClick={onClose} disabled={isLoading}>Cancel</Button>
          <Button 
            type="submit" 
            variant="contained" 
            disabled={isLoading}
            startIcon={isLoading ? <CircularProgress size={20} /> : undefined}
          >
            Record Payment
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  );
};
