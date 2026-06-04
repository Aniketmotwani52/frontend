import React, { useState, useEffect } from 'react';
import { 
  Dialog, DialogTitle, DialogContent, DialogActions, 
  Button, TextField, Box, CircularProgress, Alert, MenuItem, InputAdornment
} from '@mui/material';
import type { Service, CreateServiceRequest, UpdateServiceRequest } from '../../../shared/types/service.types';
import { serviceApi } from '../../../shared/api/service.api';
import { useAuth } from '../../../app/providers/AuthContext';

interface ServiceDialogProps {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
  serviceToEdit?: Service | null;
}

const CATEGORY_OPTIONS = [
  'Haircut', 'Coloring', 'Styling', 'Makeup', 'Nails', 'Spa', 'Massage', 'Other'
];

export const ServiceDialog = ({ open, onClose, onSuccess, serviceToEdit }: ServiceDialogProps) => {
  const { user } = useAuth();
  
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    category: '',
    defaultPrice: '',
    estimatedDurationMinutes: ''
  });
  
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  // Reset form when dialog opens/closes
  useEffect(() => {
    if (serviceToEdit) {
      setFormData({
        name: serviceToEdit.name || '',
        description: serviceToEdit.description || '',
        category: serviceToEdit.category || '',
        defaultPrice: serviceToEdit.defaultPrice?.toString() || '',
        estimatedDurationMinutes: serviceToEdit.estimatedDurationMinutes?.toString() || ''
      });
    } else {
      setFormData({ 
        name: '', description: '', category: '', defaultPrice: '', estimatedDurationMinutes: '' 
      });
    }
    setError('');
  }, [serviceToEdit, open]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    
    setIsLoading(true);
    setError('');
    
    // Convert strings to numbers before sending
    const price = parseFloat(formData.defaultPrice);
    const duration = parseInt(formData.estimatedDurationMinutes, 10);

    if (isNaN(price) || price <= 0) {
      setError("Price must be a valid number greater than 0");
      setIsLoading(false);
      return;
    }

    if (isNaN(duration) || duration < 1) {
      setError("Duration must be a valid number of minutes (at least 1)");
      setIsLoading(false);
      return;
    }

    try {
      if (serviceToEdit) {
        const payload: UpdateServiceRequest = { 
          ...formData,
          defaultPrice: price,
          estimatedDurationMinutes: duration
        };
        await serviceApi.update(serviceToEdit.serviceId, payload);
      } else {
        const payload: CreateServiceRequest = {
          orgId: user.orgId,
          ...formData,
          defaultPrice: price,
          estimatedDurationMinutes: duration
        };
        await serviceApi.create(payload);
      }
      onSuccess();
      onClose();
    } catch (err: any) {
      setError(err.response?.data?.message || 'An error occurred while saving the service.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog 
      open={open} 
      onClose={onClose}
      slotProps={{
        backdrop: {
          sx: { backgroundColor: 'rgba(0, 0, 0, 0.2)' }
        }
      }}
      sx={{
        '& .MuiDialog-paper': {
          background: 'var(--glass-bg)',
          backdropFilter: 'blur(16px)',
          border: '1px solid var(--border-color)',
          borderRadius: 'var(--border-radius)',
          boxShadow: 'var(--shadow-lg)'
        }
      }}
      maxWidth="sm"
      fullWidth
    >
      <DialogTitle sx={{ fontWeight: 700, color: 'var(--primary-main)' }}>
        {serviceToEdit ? 'Edit Service' : 'Add New Service'}
      </DialogTitle>
      
      <form onSubmit={handleSubmit}>
        <DialogContent dividers sx={{ borderColor: 'var(--border-color)' }}>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3, mt: 1 }}>
            {error && <Alert severity="error">{error}</Alert>}
            
            <TextField
              label="Service Name"
              name="name"
              value={formData.name}
              onChange={handleChange}
              required
              fullWidth
            />

            <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 3 }}>
              <TextField
                label="Default Price"
                name="defaultPrice"
                type="number"
                value={formData.defaultPrice}
                onChange={handleChange}
                onWheel={(e) => (e.target as HTMLElement).blur()}
                required
                fullWidth
                slotProps={{
                  htmlInput: { min: "0", step: "0.01" }
                }}
              />
              <TextField
                label="Estimated Duration (minutes)"
                name="estimatedDurationMinutes"
                type="number"
                value={formData.estimatedDurationMinutes}
                onChange={handleChange}
                onWheel={(e) => (e.target as HTMLElement).blur()}
                required
                fullWidth
                slotProps={{
                  htmlInput: { min: "1", step: "1" }
                }}
              />
            </Box>

            <TextField
              select
              label="Category"
              name="category"
              value={formData.category}
              onChange={handleChange}
              fullWidth
            >
              {CATEGORY_OPTIONS.map((cat) => (
                <MenuItem key={cat} value={cat}>{cat}</MenuItem>
              ))}
            </TextField>

            <TextField
              label="Description"
              name="description"
              value={formData.description}
              onChange={handleChange}
              multiline
              rows={3}
              fullWidth
              placeholder="What does this service include?"
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
            {serviceToEdit ? 'Save Changes' : 'Create Service'}
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  );
};
