import React, { useState, useEffect } from 'react';
import {
  Drawer, Box, CircularProgress, Typography, Alert, Button, IconButton, TextField, Autocomplete, Divider, Chip, Menu, MenuItem
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import dayjs from 'dayjs';
import { useAuth } from '../../../app/providers/AuthContext';
import { useRoleAccess } from '../../../shared/hooks/useRoleAccess';
import { appointmentApi } from '../../../shared/api/appointment.api';
import { customerApi } from '../../../shared/api/customer.api';
import { serviceApi } from '../../../shared/api/service.api';
import type { Customer } from '../../../shared/types/customer.types';
import type { User } from '../../../shared/types/user.types';
import type { Service } from '../../../shared/types/service.types';
import type { FullAppointment } from '../../../shared/types/appointment.types';
import type { PaymentTransaction } from '../../../shared/types/payment.types';
import { paymentApi } from '../../../shared/api/payment.api';
import { PaymentDialog } from '../../payments/components/PaymentDialog';

import { AppointmentViewMode } from './drawer/AppointmentViewMode';
import { AppointmentFormMode } from './drawer/AppointmentFormMode';
import type { ServiceSelection } from './drawer/AppointmentFormMode';

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
  initialDate?: string;
}



const DRAWER_WIDTH = 500; // Wide drawer for complex forms

export const AppointmentDrawer = ({ open, mode, setMode, appointment, onClose, onSuccess, staffList, initialStartTime, initialStaffId, initialDate }: AppointmentDrawerProps) => {
  const { user } = useAuth();
  const { hasMinRole } = useRoleAccess();
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
        let defaultDate = initialDate || now.format('YYYY-MM-DD');
        let defaultServices: ServiceSelection[] = [];

        if (initialStartTime) {
          defaultStartTime = initialStartTime;
        }

        if (initialStaffId) {
          defaultServices = [{
            id: Date.now().toString(),
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
    if (appointment && mode === 'VIEW' && hasMinRole('RECEPTIONIST')) {
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
      {mode === 'VIEW' ? (
        <AppointmentViewMode
          appointment={appointment}
          error={error}
          isLoading={isLoading}
          payments={payments}
          amountPaid={amountPaid}
          remainingBalance={remainingBalance}
          handleQuickStatusUpdate={handleQuickStatusUpdate}
          setMode={setMode}
          setIsPaymentDialogOpen={setIsPaymentDialogOpen}
          handleUpdateTransactionStatus={handleUpdateTransactionStatus}
          anchorEl={anchorEl}
          setAnchorEl={setAnchorEl}
          selectedTransactionId={selectedTransactionId}
          setSelectedTransactionId={setSelectedTransactionId}
        />
      ) : (
        <AppointmentFormMode
          mode={mode}
          formData={formData}
          setFormData={setFormData}
          selectedServices={selectedServices}
          setSelectedServices={setSelectedServices}
          customers={customers}
          services={services}
          staffList={staffList}
          subtotal={subtotal}
          finalAmount={finalAmount}
          isLoading={isLoading}
          error={error}
          handleSubmit={handleSubmit}
          onCancel={mode === 'EDIT' ? () => setMode('VIEW') : onClose}
        />
      )}

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
