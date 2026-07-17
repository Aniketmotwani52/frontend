import React, { useState, useEffect } from 'react';
import {
  Dialog, DialogTitle, DialogContent, DialogActions,
  Button, Typography, Box, CircularProgress, Chip,
  Table, TableBody, TableCell, TableHead, TableRow, Paper, TableContainer
} from '@mui/material';
import AddShoppingCartIcon from '@mui/icons-material/AddShoppingCart';
import type { CustomerPackage } from '../../packages/types/package.types';
import { packageApi } from '../../packages/api/package.api';
import { AssignPackageDialog } from './AssignPackageDialog';
import { RecordPackagePaymentDialog } from '../../packages/components/RecordPackagePaymentDialog';

interface CustomerPackagesDialogProps {
  open: boolean;
  onClose: () => void;
  customerId: number | null;
  customerName: string;
  orgId: number;
}

export const CustomerPackagesDialog: React.FC<CustomerPackagesDialogProps> = ({
  open, onClose, customerId, customerName, orgId
}) => {
  const [packages, setPackages] = useState<CustomerPackage[]>([]);
  const [loading, setLoading] = useState(false);
  const [sellDialogOpen, setSellDialogOpen] = useState(false);
  const [selectedPackageForPayment, setSelectedPackageForPayment] = useState<CustomerPackage | null>(null);

  const loadPackages = async () => {
    if (!customerId) return;
    setLoading(true);
    try {
      const data = await packageApi.getCustomerPackages(customerId);
      setPackages(data);
    } catch (err) {
      console.error('Failed to load customer packages', err);
    } finally {
      setLoading(false);
    }
  };

  const handleCancelPackage = async (packageId: number) => {
    if (window.confirm('Are you sure you want to cancel this package? Any future redemptions will not be allowed.')) {
      try {
        await packageApi.cancelCustomerPackage(packageId);
        loadPackages();
      } catch (err) {
        console.error('Failed to cancel package', err);
        alert('Failed to cancel package.');
      }
    }
  };

  useEffect(() => {
    if (open) {
      loadPackages();
    }
  }, [open, customerId]);

  return (
    <>
      <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
        <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          Packages for {customerName}
          <Button
            variant="contained"
            startIcon={<AddShoppingCartIcon />}
            onClick={() => setSellDialogOpen(true)}
            size="small"
          >
            Sell Package
          </Button>
        </DialogTitle>
        <DialogContent dividers>
          {loading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}><CircularProgress /></Box>
          ) : packages.length === 0 ? (
            <Typography color="text.secondary" align="center" sx={{ py: 4 }}>
              This customer currently has no active packages.
            </Typography>
          ) : (
            <TableContainer component={Paper} elevation={0} sx={{ border: '1px solid', borderColor: 'divider' }}>
              <Table size="small">
                <TableHead>
                  <TableRow sx={{ backgroundColor: 'var(--bg-subtle)' }}>
                    <TableCell>Package</TableCell>
                    <TableCell>Amount / Paid</TableCell>
                    <TableCell>Status</TableCell>
                    <TableCell>Balances</TableCell>
                    <TableCell>Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {packages.map(pkg => (
                    <TableRow key={pkg.customerPackageId}>
                      <TableCell>
                        <Typography variant="body2" sx={{ fontWeight: 'bold' }}>{pkg.name}</Typography>
                        {pkg.expiresAt && <Typography variant="caption" color="text.secondary">Expires: {new Date(pkg.expiresAt).toLocaleDateString()}</Typography>}
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2">₹{pkg.finalAmount} / ₹{pkg.amountPaid}</Typography>
                      </TableCell>
                      <TableCell>
                        <Chip
                          label={pkg.status}
                          size="small"
                          color={pkg.status === 'PAID' ? 'success' : pkg.status === 'PARTIALLY_PAID' ? 'warning' : 'error'}
                        />
                      </TableCell>
                      <TableCell>
                        <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                          {pkg.balances.map(bal => {
                            const remaining = bal.totalQuantity - bal.usedQuantity;
                            return (
                              <Chip
                                key={bal.id}
                                label={`${remaining} left of ${bal.serviceName}`}
                                size="small"
                                color={remaining > 0 ? 'primary' : 'default'}
                                variant={remaining > 0 ? 'filled' : 'outlined'}
                              />
                            );
                          })}
                        </Box>
                      </TableCell>
                      <TableCell>
                        <Box sx={{ display: 'flex', gap: 1, flexDirection: 'column' }}>
                          {(pkg.status === 'PARTIALLY_PAID' || pkg.status === 'UNPAID') && (
                            <Button 
                              size="small" 
                              variant="outlined" 
                              color="primary"
                              onClick={() => setSelectedPackageForPayment(pkg)}
                            >
                              Record Payment
                            </Button>
                          )}
                          {pkg.status !== 'CANCELLED' && !pkg.balances.some(b => b.usedQuantity > 0) && (
                            <Button 
                              size="small" 
                              variant="outlined" 
                              color="error"
                              onClick={() => handleCancelPackage(pkg.customerPackageId)}
                            >
                              Cancel Package
                            </Button>
                          )}
                        </Box>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={onClose}>Close</Button>
        </DialogActions>
      </Dialog>

      {customerId && (
        <AssignPackageDialog
          open={sellDialogOpen}
          onClose={() => setSellDialogOpen(false)}
          onSuccess={loadPackages}
          orgId={orgId}
          customerId={customerId}
        />
      )}

      <RecordPackagePaymentDialog
        open={!!selectedPackageForPayment}
        onClose={() => {
          setSelectedPackageForPayment(null);
          loadPackages();
        }}
        customerPackage={selectedPackageForPayment}
      />
    </>
  );
};
