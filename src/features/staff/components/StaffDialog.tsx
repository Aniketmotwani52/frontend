import React, { useState, useEffect } from 'react';
import { 
  Dialog, DialogTitle, DialogContent, DialogActions, 
  Button, TextField, Box, CircularProgress, Alert, MenuItem, InputAdornment, Typography
} from '@mui/material';
import type { User, CreateUserRequest, UpdateUserRequest, UserRole, UserStatus } from '../../../shared/types/user.types';
import { userApi } from '../../../shared/api/user.api';
import { useAuth } from '../../../app/providers/AuthContext';

interface StaffDialogProps {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
  staffToEdit?: User | null;
}

const GENDER_OPTIONS = [
  { value: 'MALE', label: 'Male' },
  { value: 'FEMALE', label: 'Female' },
  { value: 'OTHER', label: 'Other' },
  { value: 'PREFER_NOT_TO_SAY', label: 'Prefer not to say' }
];

const ROLE_OPTIONS: { value: UserRole, label: string }[] = [
  { value: 'MANAGER', label: 'Manager' },
  { value: 'RECEPTIONIST', label: 'Receptionist' },
  { value: 'STAFF', label: 'Staff' }
];

const STATUS_OPTIONS: { value: UserStatus, label: string }[] = [
  { value: 'ACTIVE', label: 'Active' },
  { value: 'INACTIVE', label: 'Inactive' },
  { value: 'ON_LEAVE', label: 'On Leave' }
];

export const StaffDialog = ({ open, onClose, onSuccess, staffToEdit }: StaffDialogProps) => {
  const { user } = useAuth();
  
  const [formData, setFormData] = useState({
    userName: '',
    phoneNumber: '',
    email: '',
    gender: '',
    dateOfBirth: '',
    role: 'STAFF' as UserRole,
    status: 'ACTIVE' as UserStatus,
    userSalary: '',
    workStartTime: '',
    workEndTime: '',
    authUsername: '',
    authPassword: ''
  });
  
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  // Reset form when dialog opens/closes
  useEffect(() => {
    if (staffToEdit) {
      setFormData({
        userName: staffToEdit.userName || '',
        phoneNumber: staffToEdit.phoneNumber || '',
        email: staffToEdit.email || '',
        gender: staffToEdit.gender || '',
        dateOfBirth: staffToEdit.dateOfBirth || '',
        role: staffToEdit.role || 'STAFF',
        status: staffToEdit.status || 'ACTIVE',
        userSalary: staffToEdit.userSalary?.toString() || '',
        workStartTime: staffToEdit.workStartTime || '',
        workEndTime: staffToEdit.workEndTime || '',
        authUsername: '',
        authPassword: ''
      });
    } else {
      setFormData({ 
        userName: '', phoneNumber: '', email: '', gender: '', dateOfBirth: '', 
        role: 'STAFF', status: 'ACTIVE', userSalary: '', workStartTime: '', workEndTime: '',
        authUsername: '', authPassword: ''
      });
    }
    setError('');
  }, [staffToEdit, open]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    
    setIsLoading(true);
    setError('');
    
    try {
      if (staffToEdit) {
        const payload: UpdateUserRequest = { 
          ...formData,
          userSalary: formData.userSalary ? parseFloat(formData.userSalary) : undefined
        };
        // Don't send empty auth fields on update
        if (!payload.authUsername) delete payload.authUsername;
        if (!payload.authPassword) delete payload.authPassword;
        
        await userApi.update(staffToEdit.userId, payload);
      } else {
        if (!formData.authUsername || !formData.authPassword) {
          throw new Error("Username and Password are required for new staff members.");
        }
        
        const payload: CreateUserRequest = {
          ...formData,
          orgId: user.orgId,
          userSalary: formData.userSalary ? parseFloat(formData.userSalary) : undefined
        };
        await userApi.create(payload);
      }
      onSuccess();
      onClose();
    } catch (err: any) {
      setError(err.response?.data?.message || err.message || 'An error occurred while saving the staff member.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog 
      open={open} 
      onClose={onClose}
      maxWidth="sm"
      fullWidth
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
      maxWidth="md"
      fullWidth
    >
      <DialogTitle sx={{ fontWeight: 700, color: 'var(--primary-main)' }}>
        {staffToEdit ? 'Edit Staff Member' : 'Add New Staff Member'}
      </DialogTitle>
      
      <form onSubmit={handleSubmit}>
        <DialogContent dividers sx={{ borderColor: 'var(--border-color)' }}>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            {error && <Alert severity="error">{error}</Alert>}
            
            {/* Section: Basic Info */}
            <Box>
              <Typography variant="subtitle2" color="primary" sx={{ mb: 2, fontWeight: 600, textTransform: 'uppercase' }}>
                Personal Information
              </Typography>
              <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' }, gap: 3 }}>
                <TextField
                  label="Full Name"
                  name="userName"
                  value={formData.userName}
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
                <TextField
                  label="Date of Birth"
                  name="dateOfBirth"
                  type="date"
                  value={formData.dateOfBirth}
                  onChange={handleChange}
                  fullWidth
                  slotProps={{ inputLabel: { shrink: true } }}
                />
              </Box>
            </Box>

            {/* Section: Employment Details */}
            <Box>
              <Typography variant="subtitle2" color="primary" sx={{ mb: 2, fontWeight: 600, textTransform: 'uppercase' }}>
                Employment Details
              </Typography>
              <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' }, gap: 3 }}>
                <TextField
                  select
                  label="Role"
                  name="role"
                  value={formData.role}
                  onChange={handleChange}
                  required
                  fullWidth
                >
                  {ROLE_OPTIONS.map((option) => (
                    <MenuItem key={option.value} value={option.value}>
                      {option.label}
                    </MenuItem>
                  ))}
                </TextField>
                
                <TextField
                  select
                  label="Status"
                  name="status"
                  value={formData.status}
                  onChange={handleChange}
                  required
                  fullWidth
                >
                  {STATUS_OPTIONS.map((option) => (
                    <MenuItem key={option.value} value={option.value}>
                      {option.label}
                    </MenuItem>
                  ))}
                </TextField>
                
                <TextField
                  label="Salary"
                  name="userSalary"
                  type="number"
                  value={formData.userSalary}
                  onChange={handleChange}
                  onWheel={(e) => (e.target as HTMLElement).blur()}
                  fullWidth
                  slotProps={{ htmlInput: { min: "0" } }}
                />
              </Box>
            </Box>

            {/* Section: Work Hours */}
            <Box>
              <Typography variant="subtitle2" color="primary" sx={{ mb: 2, fontWeight: 600, textTransform: 'uppercase' }}>
                Working Hours
              </Typography>
              <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' }, gap: 3 }}>
                <TextField
                  label="Shift Start Time"
                  name="workStartTime"
                  type="time"
                  value={formData.workStartTime}
                  onChange={handleChange}
                  fullWidth
                  slotProps={{ inputLabel: { shrink: true } }}
                />
                <TextField
                  label="Shift End Time"
                  name="workEndTime"
                  type="time"
                  value={formData.workEndTime}
                  onChange={handleChange}
                  fullWidth
                  slotProps={{ inputLabel: { shrink: true } }}
                />
              </Box>
            </Box>

            {/* Section: System Login (Only required on creation, optional on edit to reset) */}
            <Box>
              <Typography variant="subtitle2" color="primary" sx={{ mb: 2, fontWeight: 600, textTransform: 'uppercase' }}>
                System Login Credentials
              </Typography>
              <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' }, gap: 3 }}>
                <TextField
                  label="Username"
                  name="authUsername"
                  value={formData.authUsername}
                  onChange={handleChange}
                  required={!staffToEdit}
                  fullWidth
                  autoComplete="new-username"
                  helperText={staffToEdit ? "Leave blank to keep existing username" : "Required for login"}
                />
                <TextField
                  label="Password"
                  name="authPassword"
                  type="password"
                  value={formData.authPassword}
                  onChange={handleChange}
                  required={!staffToEdit}
                  fullWidth
                  autoComplete="new-password"
                  helperText={staffToEdit ? "Leave blank to keep existing password" : "Required for login"}
                />
              </Box>
            </Box>

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
            {staffToEdit ? 'Save Changes' : 'Create Staff Member'}
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  );
};
