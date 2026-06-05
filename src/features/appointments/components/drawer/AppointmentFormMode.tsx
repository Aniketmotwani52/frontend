import React from 'react';
import { Box, Typography, Button, TextField, Autocomplete, Divider, IconButton, CircularProgress, Alert, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper } from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import AddIcon from '@mui/icons-material/Add';
import MenuItem from '@mui/material/MenuItem';
import { useRoleAccess } from '../../../../shared/hooks/useRoleAccess';
import type { Customer } from '../../../../shared/types/customer.types';
import type { User } from '../../../../shared/types/user.types';
import type { Service } from '../../../../shared/types/service.types';

export interface ServiceSelection {
  id: string; // frontend key
  serviceId: number | '';
  notes: string;
  assignedStaffIds: number[];
}

interface AppointmentFormModeProps {
  mode: 'CREATE' | 'EDIT';
  formData: any;
  setFormData: (data: any) => void;
  selectedServices: ServiceSelection[];
  setSelectedServices: (services: ServiceSelection[]) => void;
  customers: Customer[];
  services: Service[];
  staffList: User[];
  subtotal: number;
  finalAmount: number;
  isLoading: boolean;
  error: string;
  handleSubmit: (e: React.FormEvent) => void;
  onCancel: () => void;
}

export const AppointmentFormMode: React.FC<AppointmentFormModeProps> = ({
  mode,
  formData,
  setFormData,
  selectedServices,
  setSelectedServices,
  customers,
  services,
  staffList,
  subtotal,
  finalAmount,
  isLoading,
  error,
  handleSubmit,
  onCancel
}) => {
  const { hasMinRole } = useRoleAccess();

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleAddService = () => {
    setSelectedServices([
      ...selectedServices,
      { id: Date.now().toString(), serviceId: '', notes: '', assignedStaffIds: [] }
    ]);
  };

  const handleRemoveService = (id: string) => {
    setSelectedServices(selectedServices.filter(s => s.id !== id));
  };

  const handleServiceChange = (id: string, field: keyof ServiceSelection, value: any) => {
    setSelectedServices(selectedServices.map(s => s.id === id ? { ...s, [field]: value } : s));
  };

  const sortedServices = React.useMemo(() => {
    return [...services].sort((a, b) => {
      const catA = (a.categoryName || 'Uncategorized').toUpperCase();
      const catB = (b.categoryName || 'Uncategorized').toUpperCase();
      if (catA < catB) return -1;
      if (catA > catB) return 1;
      return a.name.localeCompare(b.name);
    });
  }, [services]);

  return (
    <Box component="form" onSubmit={handleSubmit} sx={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <Box sx={{ flexGrow: 1, overflowY: 'auto', p: 4, display: 'flex', flexDirection: 'column', gap: 3 }}>
        <Typography variant="h5" sx={{ fontWeight: 700 }} color="primary">
          {mode === 'CREATE' ? 'New Appointment' : 'Edit Appointment'}
        </Typography>

        {error && <Alert severity="error">{error}</Alert>}

        <Typography variant="subtitle1" sx={{ fontWeight: 600 }} color="text.primary">1. Appointment Details</Typography>

        <Autocomplete
          options={customers}
          getOptionLabel={(option) => `${option.customerName} - ${option.phoneNumber || 'No Phone'}`}
          value={customers.find(c => c.customerId.toString() === formData.customerId) || null}
          onChange={(e, newValue) => {
            setFormData({ ...formData, customerId: newValue ? newValue.customerId.toString() : '' });
          }}
          renderInput={(params) => (
            <TextField {...params} label="Search & Select Customer" required fullWidth />
          )}
        />

        <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2 }}>
          <TextField label="Date" name="appointmentDate" type="date" value={formData.appointmentDate} onChange={handleChange} required fullWidth />
          <TextField
            select
            label="Status"
            name="appointmentStatus"
            value={formData.appointmentStatus}
            onChange={handleChange}
            fullWidth
            disabled={mode === 'CREATE'}
          >
            <MenuItem value="SCHEDULED">Scheduled</MenuItem>
            <MenuItem value="IN_PROGRESS">In Progress</MenuItem>
            <MenuItem value="COMPLETED">Completed</MenuItem>
            <MenuItem value="NO_SHOW">No Show</MenuItem>
            <MenuItem value="CANCELLED">Cancelled</MenuItem>
          </TextField>
          <TextField label="Start Time" name="startTime" type="time" value={formData.startTime} onChange={handleChange} required fullWidth />
          <TextField label="End Time" name="endTime" type="time" value={formData.endTime} onChange={handleChange} required fullWidth />
        </Box>

        <TextField label="Notes" name="notes" value={formData.notes} onChange={handleChange} multiline rows={2} fullWidth />

        <Divider sx={{ my: 1 }} />

        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Typography variant="subtitle1" sx={{ fontWeight: 600 }} color="text.primary">2. Services & Staff</Typography>
          <Button startIcon={<AddIcon />} variant="outlined" onClick={handleAddService} size="small" sx={{ borderRadius: '24px' }}>
            Add Service
          </Button>
        </Box>

        {selectedServices.length === 0 && (
          <Typography variant="body2" color="text.secondary" sx={{ fontStyle: 'italic', textAlign: 'center', py: 2 }}>
            Please add at least one service to this appointment.
          </Typography>
        )}

        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          {selectedServices.map((svc, index) => {
            const selectedSvcObj = services.find(s => s.serviceId === svc.serviceId);
            return (
              <Box key={svc.id} sx={{ p: 2, border: '1px solid var(--border-color)', borderRadius: '12px', background: 'rgba(255,255,255,0.02)' }}>
                {/* Top Row: Service, Staff, Duration, Price, Delete */}
                <Box sx={{ display: 'grid', gridTemplateColumns: '2fr 2fr auto auto auto', gap: 2, alignItems: 'center' }}>
                  <Autocomplete
                    options={sortedServices}
                    groupBy={(option) => option.categoryName || 'Uncategorized'}
                    getOptionLabel={(option) => `${option.name}`}
                    value={selectedSvcObj || null}
                    onChange={(e, newValue) => {
                      handleServiceChange(svc.id, 'serviceId', newValue ? newValue.serviceId : '');
                    }}
                    renderInput={(params) => (
                      <TextField {...params} required size="small" placeholder="Select Service" label={`Service ${index + 1}`} />
                    )}
                    slotProps={{
                      popper: { sx: { zIndex: 9999 } }
                    }}
                  />

                  <Autocomplete
                    multiple
                    limitTags={2}
                    options={staffList}
                    getOptionLabel={(option) => `${option.userName}`}
                    value={staffList.filter(s => svc.assignedStaffIds.includes(s.userId))}
                    onChange={(e, newValue) => {
                      handleServiceChange(svc.id, 'assignedStaffIds', newValue.map(v => v.userId));
                    }}
                    renderInput={(params) => (
                      <TextField {...params} required={svc.assignedStaffIds.length === 0} size="small" placeholder="Select Staff" label="Assigned Staff" />
                    )}
                  />

                  <Box sx={{ minWidth: '60px', textAlign: 'center' }}>
                    <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>Duration</Typography>
                    <Typography variant="body2" sx={{ fontWeight: 600, color: 'var(--text-primary)' }}>
                      {selectedSvcObj ? `${selectedSvcObj.estimatedDurationMinutes}m` : '-'}
                    </Typography>
                  </Box>

                  <Box sx={{ minWidth: '60px', textAlign: 'center' }}>
                    <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>Price</Typography>
                    <Typography variant="body2" sx={{ fontWeight: 600, color: 'var(--text-primary)' }}>
                      {selectedSvcObj ? `₹${selectedSvcObj.defaultPrice}` : '-'}
                    </Typography>
                  </Box>

                  <IconButton size="small" color="error" onClick={() => handleRemoveService(svc.id)} sx={{ mt: 1 }}>
                    <DeleteIcon fontSize="small" />
                  </IconButton>
                </Box>

                {/* Bottom Row: Notes */}
                <Box sx={{ mt: 2 }}>
                  <TextField
                    value={svc.notes}
                    onChange={(e) => handleServiceChange(svc.id, 'notes', e.target.value)}
                    size="small"
                    placeholder="Add any special notes or requests for this service..."
                    fullWidth
                  />
                </Box>
              </Box>
            )
          })}
        </Box>

        <Divider sx={{ my: 1 }} />

        {hasMinRole('RECEPTIONIST') && (
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1, alignItems: 'flex-end', mr: 2 }}>
            <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
              <Typography variant="body1" color="text.secondary">Subtotal:</Typography>
              <Typography variant="h6">₹{subtotal}</Typography>
            </Box>
            <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
              <Typography variant="body1" color="text.secondary">Discount (₹):</Typography>
              <TextField
                name="discountAmount"
                type="number"
                size="small"
                sx={{ width: '120px' }}
                value={formData.discountAmount}
                onChange={handleChange}
                onWheel={(e) => (e.target as HTMLElement).blur()}
              />
            </Box>
            <Box sx={{ display: 'flex', gap: 2, alignItems: 'center', mt: 1 }}>
              <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>Final Amount:</Typography>
              <Typography variant="h5" color="primary" sx={{ fontWeight: 700 }}>₹{finalAmount}</Typography>
            </Box>
          </Box>
        )}
      </Box>

      <Box sx={{ p: 3, borderTop: '1px solid var(--border-color)', display: 'flex', justifyContent: 'flex-end', gap: 2, background: 'var(--bg-paper)' }}>
        <Button onClick={onCancel} disabled={isLoading} sx={{ color: 'var(--text-secondary)' }}>
          Cancel
        </Button>
        <Button
          type="submit"
          variant="contained"
          disabled={isLoading}
          startIcon={isLoading ? <CircularProgress size={20} /> : undefined}
          sx={{ px: 4 }}
        >
          {mode === 'CREATE' ? 'Create Appointment' : 'Save Changes'}
        </Button>
      </Box>
    </Box>
  );
};
