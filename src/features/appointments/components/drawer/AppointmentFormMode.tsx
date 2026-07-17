import React from 'react';
import { Box, Typography, Button, TextField, Autocomplete, Divider, IconButton, CircularProgress, Alert, Chip, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper } from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import AddIcon from '@mui/icons-material/Add';
import MenuItem from '@mui/material/MenuItem';
import { useRoleAccess } from '../../../../shared/hooks/useRoleAccess';
import { useQuery } from '@tanstack/react-query';
import { packageApi } from '../../../packages/api/package.api';
import type { Customer } from '../../../../shared/types/customer.types';
import type { User } from '../../../../shared/types/user.types';
import type { Service } from '../../../../shared/types/service.types';

export interface ServiceSelection {
  id: string; // frontend key
  serviceId: number | '';
  notes: string;
  assignedStaffIds: number[];
  redeemedFromPackageId?: number;
  startTime: string;
  endTime: string;
  serviceStatus?: string;
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

  const customerIdNumber = formData.customerId ? Number(formData.customerId) : null;
  const { data: customerPackages = [] } = useQuery({
    queryKey: ['customerPackages', customerIdNumber],
    queryFn: () => packageApi.getCustomerPackages(customerIdNumber!),
    enabled: !!customerIdNumber,
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleAddService = () => {
    let defaultStartTime = formData.startTime || '12:00';
    if (selectedServices.length > 0) {
      const lastService = selectedServices[selectedServices.length - 1];
      if (lastService.endTime) {
        defaultStartTime = lastService.endTime;
      }
    }

    setSelectedServices([
      ...selectedServices,
      { id: Date.now().toString(), serviceId: '', notes: '', assignedStaffIds: [], startTime: defaultStartTime, endTime: defaultStartTime }
    ]);
  };

  const handleRemoveService = (id: string) => {
    setSelectedServices(selectedServices.filter(s => s.id !== id));
  };

  const handleServiceChange = (id: string, field: keyof ServiceSelection, value: any) => {
    setSelectedServices(selectedServices.map(s => {
      if (s.id !== id) return s;
      
      const updated = { ...s, [field]: value };
      
      // Auto-calculate endTime based on duration when service or startTime changes
      if (field === 'serviceId' || field === 'startTime') {
        const serviceIdToUse = field === 'serviceId' ? value : s.serviceId;
        const startTimeToUse = field === 'startTime' ? value : s.startTime;
        const serviceObj = services.find(srv => srv.serviceId === serviceIdToUse);
        
        if (serviceObj && startTimeToUse) {
          const duration = serviceObj.estimatedDurationMinutes || 30;
          const [hours, mins] = startTimeToUse.split(':').map(Number);
          const totalMins = hours * 60 + mins + duration;
          const newHours = Math.floor(totalMins / 60) % 24;
          const newMins = totalMins % 60;
          updated.endTime = `${newHours.toString().padStart(2, '0')}:${newMins.toString().padStart(2, '0')}`;
        }
      }
      return updated;
    }));
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
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
            <Typography variant="caption" color="text.secondary">Global Status (Auto-calculated)</Typography>
            <Box sx={{ display: 'flex', alignItems: 'center', height: '40px' }}>
              <Chip 
                label={formData.appointmentStatus} 
                size="small" 
                color={
                  formData.appointmentStatus === 'COMPLETED' ? 'primary' :
                  formData.appointmentStatus === 'IN_PROGRESS' ? 'secondary' :
                  formData.appointmentStatus === 'SCHEDULED' ? 'info' :
                  formData.appointmentStatus === 'NO_SHOW' ? 'error' :
                  'default'
                }
                sx={{ fontWeight: 600 }} 
              />
            </Box>
          </Box>
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
            
            const applicablePackages = customerPackages.filter(pkg => 
              pkg.status !== 'CANCELLED' && 
              pkg.balances.some(bal => bal.serviceId === svc.serviceId && bal.totalQuantity > bal.usedQuantity)
            );
            
            return (
              <Box key={svc.id} sx={{ p: 2, border: '1px solid var(--border-color)', borderRadius: '12px', background: 'rgba(255,255,255,0.02)' }}>
                {/* Top Row: Service, Staff */}
                <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2, alignItems: 'start' }}>
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
                </Box>

                {/* Middle Row: Times, Status, Duration, Price, Delete */}
                <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr auto auto auto', gap: 2, alignItems: 'center', mt: 2 }}>
                  <TextField 
                    label="Start Time" 
                    type="time" 
                    value={svc.startTime || ''} 
                    onChange={(e) => handleServiceChange(svc.id, 'startTime', e.target.value)} 
                    required 
                    size="small" 
                  />
                  <TextField 
                    label="End Time" 
                    type="time" 
                    value={svc.endTime || ''} 
                    onChange={(e) => handleServiceChange(svc.id, 'endTime', e.target.value)} 
                    required 
                    size="small" 
                  />

                  <TextField
                    select
                    label="Status"
                    size="small"
                    value={svc.serviceStatus || 'PENDING'}
                    onChange={(e) => handleServiceChange(svc.id, 'serviceStatus', e.target.value)}
                  >
                    <MenuItem value="PENDING">Pending</MenuItem>
                    <MenuItem value="IN_PROGRESS">In Progress</MenuItem>
                    <MenuItem value="COMPLETED">Completed</MenuItem>
                    <MenuItem value="CANCELLED">Cancelled</MenuItem>
                  </TextField>

                  <Box sx={{ minWidth: '60px', textAlign: 'center' }}>
                    <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>Duration</Typography>
                    <Typography variant="body2" sx={{ fontWeight: 600, color: 'var(--text-primary)' }}>
                      {selectedSvcObj ? `${selectedSvcObj.estimatedDurationMinutes}m` : '-'}
                    </Typography>
                  </Box>

                  <Box sx={{ minWidth: '60px', textAlign: 'center' }}>
                    <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>Price</Typography>
                    <Typography variant="body2" sx={{ fontWeight: 600, color: svc.redeemedFromPackageId ? 'success.main' : 'var(--text-primary)' }}>
                      {svc.redeemedFromPackageId ? '₹0 (Package)' : (selectedSvcObj ? `₹${selectedSvcObj.defaultPrice}` : '-')}
                    </Typography>
                  </Box>

                  <IconButton size="small" color="error" onClick={() => handleRemoveService(svc.id)} sx={{ mt: 1 }}>
                    <DeleteIcon fontSize="small" />
                  </IconButton>
                </Box>

                {/* Bottom Row: Notes and Packages */}
                <Box sx={{ mt: 2, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2 }}>
                  <TextField
                    value={svc.notes}
                    onChange={(e) => handleServiceChange(svc.id, 'notes', e.target.value)}
                    size="small"
                    placeholder="Add any special notes or requests for this service..."
                    fullWidth
                  />
                  {applicablePackages.length > 0 && (
                    <TextField
                      select
                      size="small"
                      label="Redeem from Package?"
                      value={svc.redeemedFromPackageId || ''}
                      onChange={(e) => handleServiceChange(svc.id, 'redeemedFromPackageId', e.target.value ? Number(e.target.value) : undefined)}
                    >
                      <MenuItem value="">Do not redeem</MenuItem>
                      {applicablePackages.map(pkg => (
                        <MenuItem key={pkg.customerPackageId} value={pkg.customerPackageId}>
                          {pkg.name} (Available)
                        </MenuItem>
                      ))}
                    </TextField>
                  )}
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
