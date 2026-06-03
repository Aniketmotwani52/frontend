import React, { useState, useEffect } from 'react';
import {
  Dialog, DialogTitle, DialogContent, DialogActions,
  Button, TextField, Box, CircularProgress, Alert, MenuItem
} from '@mui/material';
import type { Customer, CreateCustomerRequest, UpdateCustomerRequest } from '../../../shared/types/customer.types';
import { customerApi } from '../../../shared/api/customer.api';
import { useAuth } from '../../../app/providers/AuthContext';

interface CustomerDialogProps {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
  customerToEdit?: Customer | null;
}

const GENDER_OPTIONS = [
  { value: 'MALE', label: 'Male' },
  { value: 'FEMALE', label: 'Female' },
  { value: 'OTHER', label: 'Other' },
  { value: 'PREFER_NOT_TO_SAY', label: 'Prefer not to say' }
];

export const CustomerDialog = ({ open, onClose, onSuccess, customerToEdit }: CustomerDialogProps) => {
  const { user } = useAuth();

  const [formData, setFormData] = useState({
    customerName: '',
    phoneNumber: '',
    email: '',
    gender: '',
    dateOfBirth: '',
    anniversaryDate: '',
    notes: ''
  });

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  // Reset form when dialog opens/closes
  useEffect(() => {
    if (customerToEdit) {
      setFormData({
        customerName: customerToEdit.customerName || '',
        phoneNumber: customerToEdit.phoneNumber || '',
        email: customerToEdit.email || '',
        gender: customerToEdit.gender || '',
        dateOfBirth: customerToEdit.dateOfBirth || '',
        anniversaryDate: customerToEdit.anniversaryDate || '',
        notes: customerToEdit.notes || ''
      });
    } else {
      setFormData({
        customerName: '', phoneNumber: '', email: '',
        gender: '', dateOfBirth: '', anniversaryDate: '', notes: ''
      });
    }
    setError('');
  }, [customerToEdit, open]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    setIsLoading(true);
    setError('');

    try {
      if (customerToEdit) {
        const payload: UpdateCustomerRequest = { ...formData };
        await customerApi.update(customerToEdit.customerId, payload);
      } else {
        const payload: CreateCustomerRequest = {
          orgId: user.orgId,
          ...formData
        };
        await customerApi.create(payload);
      }
      onSuccess();
      onClose();
    } catch (err: any) {
      setError(err.response?.data?.message || 'An error occurred while saving the customer.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      sx={{
        '& .MuiDialog-paper': {
          background: 'var(--glass-bg)',
          backdropFilter: 'blur(16px)',
          border: '1px solid var(--border-color)',
          borderRadius: 'var(--border-radius)',
          boxShadow: 'var(--shadow-lg)'
        }
      }}
      maxWidth="md"
      fullWidth
    >
      <DialogTitle sx={{ fontWeight: 700, color: 'var(--primary-main)' }}>
        {customerToEdit ? 'Edit Customer' : 'Add New Customer'}
      </DialogTitle>

      <form onSubmit={handleSubmit}>
        <DialogContent dividers sx={{ borderColor: 'var(--border-color)' }}>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3, mt: 1 }}>
            {error && <Alert severity="error">{error}</Alert>}

            {/* ROW 1: Basic Info */}
            <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' }, gap: 3 }}>
              <TextField
                label="Full Name"
                name="customerName"
                value={formData.customerName}
                onChange={handleChange}
                required
                fullWidth
              />
              <TextField
                label="Phone Number"
                name="phoneNumber"
                value={formData.phoneNumber}
                onChange={handleChange}
                fullWidth
              />
            </Box>

            {/* ROW 2: Contact & Demographics */}
            <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' }, gap: 3 }}>
              <TextField
                label="Email Address"
                name="email"
                type="email"
                value={formData.email}
                onChange={handleChange}
                fullWidth
              />
              <TextField
                select
                label="Gender"
                name="gender"
                value={formData.gender}
                onChange={handleChange}
                fullWidth
              >
                {GENDER_OPTIONS.map((option) => (
                  <MenuItem key={option.value} value={option.value}>
                    {option.label}
                  </MenuItem>
                ))}
              </TextField>
            </Box>

            {/* ROW 3: Important Dates */}
            <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' }, gap: 3 }}>
              <TextField
                label="Date of Birth"
                name="dateOfBirth"
                type="date"
                value={formData.dateOfBirth}
                onChange={handleChange}
                fullWidth
                slotProps={{
                  inputLabel: { shrink: true }
                }}
              />
              <TextField
                label="Anniversary Date"
                name="anniversaryDate"
                type="date"
                value={formData.anniversaryDate}
                onChange={handleChange}
                fullWidth
                slotProps={{
                  inputLabel: { shrink: true }
                }}
              />
            </Box>

            {/* ROW 4: Additional Info */}
            <TextField
              label="Notes"
              name="notes"
              value={formData.notes}
              onChange={handleChange}
              multiline
              rows={3}
              fullWidth
              placeholder="Allergies, preferences, favorite stylist, etc."
            />
          </Box>
        </DialogContent>

        <DialogActions sx={{ p: 3 }}>
          <Button onClick={onClose} disabled={isLoading} sx={{ color: 'var(--text-secondary)' }}>
            Cancel
          </Button>
          <Button
            type="submit"
            variant="contained"
            disabled={isLoading}
            startIcon={isLoading ? <CircularProgress size={20} /> : undefined}
            sx={{ px: 4 }}
          >
            {customerToEdit ? 'Save Changes' : 'Create Customer'}
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  );
};
