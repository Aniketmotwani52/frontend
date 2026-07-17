import React, { useState, useEffect } from 'react';
import {
  Dialog, DialogTitle, DialogContent, DialogActions,
  Button, TextField, Box, CircularProgress, Alert, MenuItem, Typography
} from '@mui/material';
import type { SellPackageRequest, Package } from '../../packages/types/package.types';
import { packageApi } from '../../packages/api/package.api';

interface AssignPackageDialogProps {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
  orgId: number;
  customerId: number;
}

export function AssignPackageDialog({
  open, onClose, onSuccess, orgId, customerId
}: AssignPackageDialogProps) {
  const [packages, setPackages] = useState<Package[]>([]);
  const [selectedPackageId, setSelectedPackageId] = useState<number | ''>('');

  const [discountAmount, setDiscountAmount] = useState<number | ''>(0);
  const [initialPaymentAmount, setInitialPaymentAmount] = useState<number | ''>('');
  const [paymentMode, setPaymentMode] = useState<'CASH' | 'CARD' | 'UPI'>('CASH');
  const [notes, setNotes] = useState('');

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (open) {
      loadPackages();
      // Reset
      setSelectedPackageId('');
      setDiscountAmount(0);
      setInitialPaymentAmount('');
      setPaymentMode('CASH');
      setNotes('');
      setError(null);
    }
  }, [open, orgId]);

  const loadPackages = async () => {
    try {
      const data = await packageApi.getPackages(orgId, true);
      setPackages(data);
    } catch (err) {
      console.error('Failed to load package catalog', err);
    }
  };

  const selectedPackage = packages.find(p => p.packageId === selectedPackageId);
  const finalAmount = selectedPackage ? Math.max(0, selectedPackage.basePrice - (discountAmount === '' ? 0 : discountAmount)) : 0;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (selectedPackageId === '') {
      setError('Please select a package');
      return;
    }

    setLoading(true);
    try {
      const request: SellPackageRequest = {
        orgId,
        customerId,
        packageId: Number(selectedPackageId),
        discountAmount: discountAmount === '' ? 0 : discountAmount,
        initialPaymentAmount: initialPaymentAmount === '' ? 0 : Number(initialPaymentAmount),
        paymentMode,
        notes
      };

      await packageApi.sellPackage(request);
      onSuccess();
      onClose();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to assign package');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <form onSubmit={handleSubmit}>
        <DialogTitle>Assign Package</DialogTitle>
        <DialogContent dividers>
          {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
            <TextField
              select
              label="Select Package"
              value={selectedPackageId}
              onChange={(e) => setSelectedPackageId(Number(e.target.value))}
              required
              fullWidth
            >
              <MenuItem value="" disabled>Select a package</MenuItem>
              {packages.map(pkg => (
                <MenuItem key={pkg.packageId} value={pkg.packageId}>
                  {pkg.name} (₹{pkg.basePrice})
                </MenuItem>
              ))}
            </TextField>

            {selectedPackage && (
              <Box sx={{ p: 2, bgcolor: 'var(--bg-subtle)', borderRadius: 1 }}>
                <Typography variant="body2" color="text.secondary">Base Price</Typography>
                <Typography variant="h6" sx={{ mb: 2 }}>₹{selectedPackage.basePrice}</Typography>

                <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2 }}>
                  <TextField
                    label="Discount (₹)"
                    type="number"
                    value={discountAmount}
                    onChange={(e) => setDiscountAmount(e.target.value === '' ? '' : Number(e.target.value))}
                    slotProps={{ htmlInput: { min: 0, max: selectedPackage.basePrice } }}
                  />
                  <TextField
                    label="Final Amount"
                    value={`₹${finalAmount}`}
                    disabled
                  />
                </Box>
              </Box>
            )}

            <Typography variant="subtitle2">Payment Details</Typography>
            <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2 }}>
              <TextField
                label="Amount Paid Now (₹)"
                type="number"
                value={initialPaymentAmount}
                onChange={(e) => setInitialPaymentAmount(e.target.value ? Number(e.target.value) : '')}
                required
              />
              <TextField
                select
                label="Payment Mode"
                value={paymentMode}
                onChange={(e) => setPaymentMode(e.target.value as 'CASH' | 'CARD' | 'UPI')}
                required
              >
                <MenuItem value="CASH">Cash</MenuItem>
                <MenuItem value="CARD">Card</MenuItem>
                <MenuItem value="UPI">UPI</MenuItem>
              </TextField>
            </Box>

            <TextField
              label="Notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              multiline
              rows={2}
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={onClose} disabled={loading}>Cancel</Button>
          <Button
            type="submit"
            variant="contained"
            disabled={loading || selectedPackageId === ''}
            startIcon={loading ? <CircularProgress size={20} /> : null}
          >
            Confirm Assignment
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  );
};
