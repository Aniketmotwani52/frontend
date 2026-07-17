import React, { useState, useEffect } from 'react';
import {
  Dialog, DialogTitle, DialogContent, DialogActions,
  Button, TextField, Box, CircularProgress, Alert,
  Typography, Autocomplete, IconButton, Divider, Table, TableBody, TableCell, TableHead, TableRow
} from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import type { CreatePackageRequest, PackageServiceItem, Package } from '../types/package.types';
import type { Service } from '../../../shared/types/service.types';
import { serviceApi } from '../../../shared/api/service.api';
import { packageApi } from '../api/package.api';

interface PackageDialogProps {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
  orgId: number;
  initialData?: Package | null;
}

export const PackageDialog: React.FC<PackageDialogProps> = ({
  open, onClose, onSuccess, orgId, initialData
}) => {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [basePrice, setBasePrice] = useState<number | ''>('');
  const [validityDays, setValidityDays] = useState<number | ''>('');

  const [services, setServices] = useState<Service[]>([]);
  const [selectedServices, setSelectedServices] = useState<PackageServiceItem[]>([]);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (open) {
      loadServices();
      if (initialData) {
        setName(initialData.name);
        setDescription(initialData.description || '');
        setBasePrice(initialData.basePrice);
        setValidityDays(initialData.validityDays || '');
        setSelectedServices(initialData.services || []);
      } else {
        setName('');
        setDescription('');
        setBasePrice('');
        setValidityDays('');
        setSelectedServices([]);
      }
      setError(null);
    }
  }, [open, orgId, initialData]);

  const loadServices = async () => {
    try {
      const data = await serviceApi.getActiveByOrg(orgId);
      // Group services by category alphabetically
      const sorted = data.sort((a, b) => {
        const catA = a.categoryName || 'Uncategorized';
        const catB = b.categoryName || 'Uncategorized';
        return catA.localeCompare(catB);
      });
      setServices(sorted);
    } catch (err) {
      console.error('Failed to load services', err);
    }
  };

  const handleAddService = (service: Service | null) => {
    if (!service) return;

    // Check if already added
    if (selectedServices.find(s => s.serviceId === service.serviceId)) {
      return;
    }

    setSelectedServices([
      ...selectedServices,
      { serviceId: service.serviceId, serviceName: service.name, quantity: 1 }
    ]);
  };

  const handleRemoveService = (serviceId: number) => {
    setSelectedServices(selectedServices.filter(s => s.serviceId !== serviceId));
  };

  const handleUpdateQuantity = (serviceId: number, quantity: number) => {
    if (quantity < 0) return;
    setSelectedServices(selectedServices.map(s =>
      s.serviceId === serviceId ? { ...s, quantity } : s
    ));
  };

  const calculateDefaultValue = () => {
    let sum = 0;
    selectedServices.forEach(item => {
      const svc = services.find(s => s.serviceId === item.serviceId);
      if (svc) {
        sum += svc.defaultPrice * item.quantity;
      }
    });
    return sum;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!name || basePrice === '') {
      setError('Name and Base Price are required');
      return;
    }

    if (selectedServices.length === 0) {
      setError('Please add at least one service to the package');
      return;
    }

    if (selectedServices.some(s => s.quantity < 1)) {
      setError('All services must have a quantity of at least 1');
      return;
    }

    setLoading(true);
    try {
      const request: CreatePackageRequest = {
        orgId,
        name,
        description,
        basePrice: Number(basePrice),
        validityDays: validityDays === '' ? undefined : Number(validityDays),
        isActive: true,
        services: selectedServices
      };

      if (initialData) {
        await packageApi.updatePackage(initialData.packageId, request);
      } else {
        await packageApi.createPackage(request);
      }
      
      onSuccess();
      onClose();
    } catch (err: any) {
      setError(err.response?.data?.message || `Failed to ${initialData ? 'update' : 'create'} package`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <form onSubmit={handleSubmit}>
        <DialogTitle>{initialData ? 'Edit Package' : 'Create New Package'}</DialogTitle>
        <DialogContent dividers>
          {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

          <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2, mb: 3 }}>
            <TextField
              label="Package Name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              fullWidth
            />
            <TextField
              label="Base Price (₹)"
              type="number"
              value={basePrice}
              onChange={(e) => setBasePrice(e.target.value ? Number(e.target.value) : '')}
              required
              fullWidth
              helperText={`Total Value: ₹${calculateDefaultValue()}`}
            />
            <TextField
              label="Validity (Days)"
              type="number"
              value={validityDays}
              onChange={(e) => setValidityDays(e.target.value ? Number(e.target.value) : '')}
              fullWidth
              helperText="Leave empty for unlimited validity"
            />
            <TextField
              label="Description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              fullWidth
              multiline
              rows={1}
            />
          </Box>

          <Divider sx={{ my: 2 }} />
          <Typography variant="subtitle1" sx={{ fontWeight: 'bold', mb: 2 }}>Package Contents</Typography>

          <Autocomplete
            options={services}
            groupBy={(option) => option.categoryName || 'Uncategorized'}
            getOptionLabel={(option) => option.name}
            onChange={(_, newValue) => handleAddService(newValue)}
            renderInput={(params) => <TextField {...params} label="Search & Add Service" />}
            sx={{ mb: 2 }}
            value={null}
            blurOnSelect
          />

          {selectedServices.length > 0 && (
            <Table size="small" sx={{ mt: 2 }}>
              <TableHead>
                <TableRow>
                  <TableCell>Service</TableCell>
                  <TableCell>Price</TableCell>
                  <TableCell align="center">Quantity</TableCell>
                  <TableCell align="center">Total Value</TableCell>
                  <TableCell align="center">Action</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {selectedServices.map(item => {
                  const svc = services.find(s => s.serviceId === item.serviceId);
                  return (
                    <TableRow key={item.serviceId}>
                      <TableCell>{item.serviceName}</TableCell>
                      <TableCell>₹{svc?.defaultPrice}</TableCell>
                      <TableCell align="center">
                        <TextField
                          type="number"
                          size="small"
                          value={item.quantity === 0 ? '' : item.quantity}
                          onChange={(e) => handleUpdateQuantity(item.serviceId, e.target.value === '' ? 0 : Number(e.target.value))}
                          sx={{ width: 80 }}
                          slotProps={{ htmlInput: { min: 1 } }}
                        />
                      </TableCell>
                      <TableCell align="center">₹{(svc?.defaultPrice || 0) * item.quantity}</TableCell>
                      <TableCell align="center">
                        <IconButton size="small" color="error" onClick={() => handleRemoveService(item.serviceId)}>
                          <DeleteIcon fontSize="small" />
                        </IconButton>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={onClose} disabled={loading}>Cancel</Button>
          <Button
            type="submit"
            variant="contained"
            disabled={loading}
            startIcon={loading ? <CircularProgress size={20} /> : null}
          >
            Create Package
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  );
};
