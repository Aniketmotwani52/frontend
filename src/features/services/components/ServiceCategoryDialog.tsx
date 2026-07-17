import React, { useState, useEffect } from 'react';
import { 
  Dialog, DialogTitle, DialogContent, DialogActions, 
  Button, TextField, Box, CircularProgress, Alert
} from '@mui/material';
import type { ServiceCategory, CreateServiceCategoryRequest, UpdateServiceCategoryRequest } from '../../../shared/types/service.types';
import { serviceCategoryApi } from '../../../shared/api/service.api';
import { useAuth } from '../../../app/providers/AuthContext';

interface ServiceCategoryDialogProps {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
  categoryToEdit?: ServiceCategory | null;
}

export const ServiceCategoryDialog = ({ open, onClose, onSuccess, categoryToEdit }: ServiceCategoryDialogProps) => {
  const { user } = useAuth();
  
  const [formData, setFormData] = useState({
    name: '',
    description: ''
  });
  
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  // Reset form when dialog opens/closes
  useEffect(() => {
    if (categoryToEdit) {
      setFormData({
        name: categoryToEdit.name || '',
        description: categoryToEdit.description || ''
      });
    } else {
      setFormData({ 
        name: '', description: ''
      });
    }
    setError('');
  }, [categoryToEdit, open]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    
    setIsLoading(true);
    setError('');

    try {
      if (categoryToEdit) {
        const payload: UpdateServiceCategoryRequest = { 
          ...formData
        };
        await serviceCategoryApi.update(categoryToEdit.categoryId, payload);
      } else {
        const payload: CreateServiceCategoryRequest = {
          orgId: user.orgId,
          ...formData
        };
        await serviceCategoryApi.create(payload);
      }
      onSuccess();
      onClose();
    } catch (err: any) {
      setError(err.response?.data?.message || 'An error occurred while saving the category.');
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
        {categoryToEdit ? 'Edit Category' : 'Add New Category'}
      </DialogTitle>
      
      <form onSubmit={handleSubmit}>
        <DialogContent dividers sx={{ borderColor: 'var(--border-color)' }}>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3, mt: 1 }}>
            {error && <Alert severity="error">{error}</Alert>}
            
            <TextField
              label="Category Name"
              name="name"
              value={formData.name}
              onChange={handleChange}
              required
              fullWidth
            />

            <TextField
              label="Description"
              name="description"
              value={formData.description}
              onChange={handleChange}
              multiline
              rows={3}
              fullWidth
              placeholder="E.g., Haircut services"
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
            {categoryToEdit ? 'Save Changes' : 'Create Category'}
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  );
};
