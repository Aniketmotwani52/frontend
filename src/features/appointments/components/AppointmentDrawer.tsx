import React, { useState, useEffect } from 'react';
import {
  Drawer, Box, CircularProgress, Typography, Alert, Button, IconButton, TextField, Autocomplete, Divider, Chip, Menu, MenuItem
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import AddIcon from '@mui/icons-material/Add';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import PersonIcon from '@mui/icons-material/Person';
import NotesIcon from '@mui/icons-material/Notes';
import MoreVertIcon from '@mui/icons-material/MoreVert';
import dayjs from 'dayjs';
import { useAuth } from '../../../app/providers/AuthContext';
import { appointmentApi } from '../../../shared/api/appointment.api';
import { customerApi } from '../../../shared/api/customer.api';
import { serviceApi } from '../../../shared/api/service.api';
import type { Customer } from '../../../shared/types/customer.types';
import type { User } from '../../../shared/types/user.types';
import type { Service } from '../../../shared/types/service.types';
import type { FullAppointment, CreateAppointmentRequest, CreateAppointmentServiceItemRequest, CreateAppointmentServiceStaffRequest } from '../../../shared/types/appointment.types';
import type { PaymentTransaction } from '../../../shared/types/payment.types';
import { paymentApi } from '../../../shared/api/payment.api';
import { PaymentDialog } from '../../payments/components/PaymentDialog';

export type DrawerMode = 'VIEW' | 'EDIT' | 'CREATE';

interface AppointmentDrawerProps {
  open: boolean;
  mode: DrawerMode;
  setMode: (mode: DrawerMode) => void;
  appointment: FullAppointment | null;
  onClose: () => void;
  onSuccess: () => void;
  staffList: User[];
  initialStartTime?: string;
  initialStaffId?: number;
}

interface ServiceSelection {
  id: string; // frontend key
  serviceId: number | '';
  notes: string;
  assignedStaffIds: number[];
}

const DRAWER_WIDTH = 500; // Wide drawer for complex forms

export const AppointmentDrawer = ({ open, mode, setMode, appointment, onClose, onSuccess, staffList, initialStartTime, initialStaffId }: AppointmentDrawerProps) => {
  const { user } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const [customers, setCustomers] = useState<Customer[]>([]);
  const [services, setServices] = useState<Service[]>([]);

  const [formData, setFormData] = useState({
    customerId: '',
    appointmentDate: dayjs().format('YYYY-MM-DD'),
    startTime: '10:00',
    endTime: '11:00',
    notes: '',
    discountAmount: 0,
    appointmentStatus: 'SCHEDULED'
  });

  const [selectedServices, setSelectedServices] = useState<ServiceSelection[]>([]);

  const [payments, setPayments] = useState<PaymentTransaction[]>([]);
  const [isPaymentDialogOpen, setIsPaymentDialogOpen] = useState(false);
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [selectedTransactionId, setSelectedTransactionId] = useState<number | null>(null);

  const handleMenuClick = (event: React.MouseEvent<HTMLButtonElement>, transactionId: number) => {
    setAnchorEl(event.currentTarget);
    setSelectedTransactionId(transactionId);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
    setSelectedTransactionId(null);
  };

  const handleUpdateTransactionStatus = async (status: string) => {
    if (!selectedTransactionId) return;
    try {
      await paymentApi.updateStatus(selectedTransactionId, status);
      loadPayments();
      onSuccess();
    } catch (err) {
      console.error("Failed to update status", err);
    } finally {
      handleMenuClose();
    }
  };

  const handleQuickStatusUpdate = async (status: string) => {
    if (!appointment) return;
    try {
      setIsLoading(true);
      await appointmentApi.updateStatus(appointment.appointmentId, status);
      onSuccess();
    } catch (err: any) {
      setError(err.message || 'Failed to update status');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (open && user) {
      loadData();
      setError('');
      if (mode === 'CREATE') {
        const now = dayjs();
        let defaultStartTime = now.format('HH:mm');
        let defaultDate = now.format('YYYY-MM-DD');
        let defaultServices: ServiceSelection[] = [];

        if (initialStartTime) {
          defaultStartTime = initialStartTime;
        }

        if (initialStaffId) {
          defaultServices = [{
            id: crypto.randomUUID(),
            serviceId: '',
            assignedStaffIds: [initialStaffId],
            notes: ''
          }];
        }

        setFormData({
          customerId: '',
          appointmentDate: defaultDate,
          startTime: defaultStartTime,
          endTime: dayjs(now.format('YYYY-MM-DD') + 'T' + defaultStartTime).add(1, 'hour').format('HH:mm'),
          notes: '',
          discountAmount: 0,
          appointmentStatus: 'SCHEDULED'
        });
        setSelectedServices(defaultServices);
      } else if ((mode === 'VIEW' || mode === 'EDIT') && appointment) {
        // Prepopulate data
        const start = dayjs(appointment.appointmentStartTime);
        const end = dayjs(appointment.appointmentEndTime);

        setFormData({
          customerId: appointment.customerId.toString(),
          appointmentDate: start.format('YYYY-MM-DD'),
          startTime: start.format('HH:mm'),
          endTime: end.format('HH:mm'),
          notes: appointment.notes || '',
          discountAmount: appointment.discountAmount || 0,
          appointmentStatus: appointment.appointmentStatus || 'SCHEDULED'
        });

        // Map services
        const mappedServices: ServiceSelection[] = appointment.serviceItems.map(si => ({
          id: si.appointmentServiceItemId.toString(),
          serviceId: si.serviceId,
          notes: si.notes || '',
          assignedStaffIds: si.assignedStaff.map(as => as.staffUserId)
        }));
        setSelectedServices(mappedServices);
      }
    }
  }, [open, user, mode, appointment]);

  const loadPayments = async () => {
    if (appointment && mode === 'VIEW') {
      try {
        const data = await paymentApi.getByAppointmentId(appointment.appointmentId);
        setPayments(data);
      } catch (err) {
        console.error("Failed to load payments", err);
      }
    }
  };

  useEffect(() => {
    loadPayments();
  }, [appointment?.appointmentId, mode]);

  const loadData = async () => {
    if (!user) return;
    try {
      const [customersData, servicesData] = await Promise.all([
        customerApi.getActiveByOrg(user.orgId),
        serviceApi.getAllByOrg(user.orgId)
      ]);
      setCustomers(customersData);
      setServices(servicesData);
    } catch (err) {
      console.error("Failed to load reference data", err);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const subtotal = React.useMemo(() => {
    return selectedServices.reduce((sum, svc) => {
      const service = services.find(s => s.serviceId === svc.serviceId);
      return sum + (service?.defaultPrice || 0);
    }, 0);
  }, [selectedServices, services]);

  const finalAmount = Math.max(0, subtotal - Number(formData.discountAmount || 0));

  const amountPaid = React.useMemo(() => {
    return payments
      .filter(p => p.transactionStatus === 'SUCCESS')
      .reduce((sum, p) => sum + p.amount, 0);
  }, [payments]);

  const remainingBalance = appointment ? (appointment.finalAmount || 0) - amountPaid : 0;

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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    if (selectedServices.length === 0) {
      setError("Please add at least one service.");
      return;
    }

    for (const svc of selectedServices) {
      if (!svc.serviceId) {
        setError("Please select a valid service for all entries.");
        return;
      }
      if (svc.assignedStaffIds.length === 0) {
        setError("Please assign at least one staff member to each service.");
        return;
      }
    }

    setIsLoading(true);
    setError('');

    try {
      const startDateTime = `${formData.appointmentDate}T${formData.startTime}:00`;
      const endDateTime = `${formData.appointmentDate}T${formData.endTime}:00`;

      if (mode === 'CREATE') {
        const payload = {
          orgId: user.orgId,
          customerId: Number(formData.customerId),
          createdByUserId: user.userId,
          appointmentStartTime: startDateTime,
          appointmentEndTime: endDateTime,
          notes: formData.notes,
          discountAmount: Number(formData.discountAmount || 0),
          services: selectedServices.map(svc => ({
            serviceId: Number(svc.serviceId),
            notes: svc.notes,
            staffIds: svc.assignedStaffIds
          }))
        };
        await appointmentApi.createFullWorkflow(payload);
      } else if (mode === 'EDIT' && appointment) {
        const payload = {
          customerId: Number(formData.customerId),
          appointmentStartTime: startDateTime,
          appointmentEndTime: endDateTime,
          notes: formData.notes,
          appointmentStatus: formData.appointmentStatus,
          discountAmount: Number(formData.discountAmount || 0),
          services: selectedServices.map(svc => ({
            serviceId: Number(svc.serviceId),
            notes: svc.notes,
            serviceStatus: 'PENDING',
            serviceStartTime: startDateTime,
            serviceEndTime: endDateTime,
            staffIds: svc.assignedStaffIds
          }))
        };
        await appointmentApi.updateFullWorkflow(appointment.appointmentId, payload);
      }

      onSuccess();
    } catch (err: any) {
      setError(err.response?.data?.message || err.message || "Failed to save appointment");
    } finally {
      setIsLoading(false);
    }
  };

  const renderViewMode = () => {
    if (!appointment) return null;
    return (
      <Box sx={{ p: 4, display: 'flex', flexDirection: 'column', gap: 3 }}>
        {error && <Alert severity="error">{error}</Alert>}

        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Typography variant="h5" sx={{ fontWeight: 700 }} color="primary">{appointment.customerName}</Typography>
          <Box sx={{ display: 'flex', gap: 1 }}>
            {appointment.appointmentStatus === 'SCHEDULED' && (
              <>
                <Button variant="outlined" color="info" size="small" sx={{ borderRadius: '24px' }} disabled={isLoading} onClick={() => handleQuickStatusUpdate('IN_PROGRESS')}>
                  Start
                </Button>
                <Button variant="outlined" color="error" size="small" sx={{ borderRadius: '24px' }} disabled={isLoading} onClick={() => handleQuickStatusUpdate('NO_SHOW')}>
                  No Show
                </Button>
              </>
            )}
            {appointment.appointmentStatus === 'IN_PROGRESS' && (
              <Button variant="outlined" color="success" size="small" sx={{ borderRadius: '24px' }} disabled={isLoading} onClick={() => handleQuickStatusUpdate('COMPLETED')}>
                Complete
              </Button>
            )}
            <Button startIcon={<EditIcon />} variant="contained" size="small" sx={{ borderRadius: '24px' }} onClick={() => setMode('EDIT')}>
              Edit
            </Button>
          </Box>
        </Box>

        <Divider />

        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <AccessTimeIcon color="action" />
            <Typography variant="body1">
              {dayjs(appointment.appointmentStartTime).format('dddd, MMM D, YYYY')} <br />
              {dayjs(appointment.appointmentStartTime).format('h:mm A')} - {dayjs(appointment.appointmentEndTime).format('h:mm A')}
            </Typography>
          </Box>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <PersonIcon color="action" />
            <Typography variant="body1">Customer ID: {appointment.customerId}</Typography>
          </Box>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <NotesIcon color="action" />
            <Typography variant="body1">{appointment.notes || 'No notes provided.'}</Typography>
          </Box>
        </Box>

        <Divider />

        <Typography variant="h6" sx={{ fontWeight: 600 }}>Services</Typography>
        {appointment.serviceItems.map((si, i) => (
          <Box key={si.appointmentServiceItemId} sx={{ p: 2, background: 'rgba(0,0,0,0.03)', borderRadius: '12px' }}>
            <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>{si.serviceName}</Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>{si.notes || 'No specific notes'}</Typography>
            <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
              {si.assignedStaff.map(staff => (
                <Chip key={staff.appointmentServiceStaffId} label={staff.staffUserName} size="small" color="primary" variant="outlined" />
              ))}
            </Box>
          </Box>
        ))}

        <Divider />

        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Typography variant="h6" sx={{ fontWeight: 600 }}>Payments & Billing</Typography>
        </Box>

        <Box sx={{ p: 2, borderRadius: '12px', background: 'rgba(25, 118, 210, 0.05)', border: '1px solid rgba(25, 118, 210, 0.2)', display: 'flex', flexDirection: 'column', gap: 2 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Typography variant="body1" color="text.secondary">Final Amount:</Typography>
            <Typography variant="h6" sx={{ fontWeight: 700 }}>₹{appointment.finalAmount || 0}</Typography>
          </Box>

          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Typography variant="body1" color="text.secondary">Amount Paid:</Typography>
            <Typography variant="h6" color="success.main" sx={{ fontWeight: 700 }}>₹{amountPaid}</Typography>
          </Box>

          <Divider sx={{ borderStyle: 'dashed' }} />

          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Typography variant="body1" sx={{ fontWeight: 600 }}>
              {remainingBalance < 0 ? 'Overpaid (Refund Due):' : 'Balance Due:'}
            </Typography>
            <Typography variant="h5" color={remainingBalance !== 0 ? "error.main" : "text.primary"} sx={{ fontWeight: 700 }}>
              ₹{Math.abs(remainingBalance)}
            </Typography>
          </Box>

          {remainingBalance > 0 && (
            <Button
              variant="contained"
              fullWidth
              size="large"
              sx={{ mt: 1, borderRadius: '24px' }}
              onClick={() => setIsPaymentDialogOpen(true)}
            >
              Record Payment
            </Button>
          )}
        </Box>

        {payments.length > 0 && (
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
            <Typography variant="subtitle2" color="text.secondary">Transaction History</Typography>
            {payments.map(payment => (
              <Box key={payment.transactionId} sx={{ p: 2, background: 'rgba(0,0,0,0.03)', borderRadius: '12px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Box>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>{payment.paymentMode}</Typography>
                    {payment.transactionStatus !== 'SUCCESS' && (
                      <Chip label={payment.transactionStatus} size="small" color={payment.transactionStatus === 'REFUNDED' ? 'warning' : 'error'} sx={{ height: 20, fontSize: '0.7rem' }} />
                    )}
                  </Box>
                  <Typography variant="caption" color="text.secondary">{dayjs(payment.createdAt).format('MMM D, YYYY h:mm A')}</Typography>
                </Box>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Typography variant="subtitle1" sx={{ fontWeight: 700, textDecoration: payment.transactionStatus !== 'SUCCESS' ? 'line-through' : 'none', color: payment.transactionStatus !== 'SUCCESS' ? 'text.secondary' : 'text.primary' }}>
                    ₹{payment.amount}
                  </Typography>
                  {payment.transactionStatus === 'SUCCESS' && (
                    <IconButton size="small" onClick={(e) => handleMenuClick(e, payment.transactionId)}>
                      <MoreVertIcon fontSize="small" />
                    </IconButton>
                  )}
                </Box>
              </Box>
            ))}
          </Box>
        )}

        <Menu
          anchorEl={anchorEl}
          open={Boolean(anchorEl)}
          onClose={handleMenuClose}
        >
          <MenuItem onClick={() => handleUpdateTransactionStatus('REFUNDED')}>Mark as Refunded</MenuItem>
          <MenuItem onClick={() => handleUpdateTransactionStatus('FAILED')}>Mark as Failed</MenuItem>
        </Menu>
      </Box>
    );
  };

  const renderFormMode = () => (
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

        {selectedServices.map((svc, index) => {
          const selectedSvcObj = services.find(s => s.serviceId === svc.serviceId);
          return (
            <Box key={svc.id} sx={{ p: 2, border: '1px solid var(--border-color)', borderRadius: '12px', background: 'rgba(255,255,255,0.02)', display: 'flex', flexDirection: 'column', gap: 2 }}>
              <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr auto', gap: 2, alignItems: 'center' }}>
                <Autocomplete
                  options={services}
                  getOptionLabel={(option) => `${option.name}`}
                  value={selectedSvcObj || null}
                  onChange={(e, newValue) => {
                    handleServiceChange(svc.id, 'serviceId', newValue ? newValue.serviceId : '');
                  }}
                  renderInput={(params) => (
                    <TextField {...params} label="Service" required size="small" />
                  )}
                />

                <Autocomplete
                  multiple
                  options={staffList}
                  getOptionLabel={(option) => `${option.userName}`}
                  value={staffList.filter(s => svc.assignedStaffIds.includes(s.userId))}
                  onChange={(e, newValue) => {
                    handleServiceChange(svc.id, 'assignedStaffIds', newValue.map(v => v.userId));
                  }}
                  renderInput={(params) => (
                    <TextField {...params} label="Staff" required={svc.assignedStaffIds.length === 0} size="small" />
                  )}
                />

                <IconButton size="small" color="error" onClick={() => handleRemoveService(svc.id)}>
                  <DeleteIcon fontSize="small" />
                </IconButton>
              </Box>

              <Box sx={{ display: 'flex', gap: 3, px: 1, alignItems: 'center' }}>
                <Typography variant="body2" color="text.secondary">
                  Duration: <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{selectedSvcObj ? `${selectedSvcObj.estimatedDurationMinutes}m` : '-'}</span>
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Price: <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{selectedSvcObj ? `₹${selectedSvcObj.defaultPrice}` : '-'}</span>
                </Typography>
                <TextField
                  label="Notes (Optional)"
                  value={svc.notes}
                  onChange={(e) => handleServiceChange(svc.id, 'notes', e.target.value)}
                  size="small"
                  variant="standard"
                  sx={{ flexGrow: 1, ml: 2 }}
                />
              </Box>
            </Box>
          )
        })}

        <Divider sx={{ my: 1 }} />

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
      </Box>

      <Box sx={{ p: 3, borderTop: '1px solid var(--border-color)', display: 'flex', justifyContent: 'flex-end', gap: 2, background: 'var(--bg-paper)' }}>
        <Button onClick={mode === 'EDIT' ? () => setMode('VIEW') : onClose} disabled={isLoading} sx={{ color: 'var(--text-secondary)' }}>
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

  return (
    <Drawer
      anchor="right"
      open={open}
      onClose={onClose}
      slotProps={{
        backdrop: {
          sx: { backgroundColor: 'rgba(0, 0, 0, 0.2)' }
        }
      }}
      sx={{
        '& .MuiDrawer-paper': {
          width: { xs: '100%', sm: DRAWER_WIDTH },
          background: 'var(--bg-default)',
          boxShadow: 'var(--shadow-lg)'
        }
      }}
    >
      <Box sx={{ display: 'flex', justifyContent: 'space-between', p: 2, borderBottom: '1px solid var(--border-color)' }}>
        <IconButton onClick={onClose} size="small"><CloseIcon /></IconButton>
      </Box>
      {mode === 'VIEW' ? renderViewMode() : renderFormMode()}

      {appointment && user && (
        <PaymentDialog
          open={isPaymentDialogOpen}
          onClose={() => setIsPaymentDialogOpen(false)}
          onSuccess={() => {
            loadPayments();
            onSuccess(); // Refresh the parent calendar/list too!
          }}
          appointmentId={appointment.appointmentId}
          userId={user.userId}
          remainingBalance={remainingBalance}
        />
      )}
    </Drawer>
  );
};
