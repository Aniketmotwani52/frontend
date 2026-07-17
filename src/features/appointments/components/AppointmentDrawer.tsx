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



const DRAWER_WIDTH = 750; // Increased drawer width for table layout

export const AppointmentDrawer = ({ open, mode, setMode, appointment, onClose, onSuccess, staffList, initialStartTime, initialStaffId, initialDate }: AppointmentDrawerProps) => {
  const { user } = useAuth();
  const { hasMinRole } = useRoleAccess();
  const [isLoading, setIsLoading] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
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

  const handleServiceQuickStatusUpdate = async (serviceItemId: number, status: string) => {
    if (!appointment) return;
    try {
      setIsLoading(true);
      
      // Map the current appointment to a full update payload, but ONLY change this one service's status
      const payload = {
        customerId: Number(appointment.customerId),
        appointmentStartTime: appointment.appointmentStartTime,
        appointmentEndTime: appointment.appointmentEndTime,
        notes: appointment.notes || '',
        appointmentStatus: appointment.appointmentStatus,
        discountAmount: Number(appointment.discountAmount || 0),
        services: appointment.serviceItems.map(svc => ({
          appointmentServiceItemId: svc.appointmentServiceItemId,
          serviceId: Number(svc.serviceId),
          notes: svc.notes || '',
          serviceStartTime: svc.serviceStartTime || appointment.appointmentStartTime,
          serviceEndTime: svc.serviceEndTime || appointment.appointmentEndTime,
          serviceStatus: svc.appointmentServiceItemId === serviceItemId ? status : (svc.serviceStatus || 'PENDING'),
          staffIds: svc.assignedStaff.map(as => as.staffUserId),
          redeemedFromPackageId: svc.redeemedFromPackageId || undefined
        }))
      };

      await appointmentApi.updateFullWorkflow(appointment.appointmentId, payload);
      onSuccess();
    } catch (err: any) {
      setError(err.message || 'Failed to update service status');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteAppointment = async () => {
    if (!appointment) return;
    
    let confirmMsg = "Are you sure you want to delete this appointment? This action cannot be undone.";
    if (appointment.paymentStatus === 'PAID' || appointment.paymentStatus === 'PARTIAL') {
        confirmMsg = "Are you sure you want to delete this appointment?\n\nWARNING: This appointment has payments associated with it. Deleting it will automatically mark those payments as REFUNDED internally.";
    }

    if (!window.confirm(confirmMsg)) return;
    
    try {
      setIsDeleting(true);
      await appointmentApi.delete(appointment.appointmentId);
      onSuccess();
      onClose();
    } catch (err: any) {
      setError(err.message || 'Failed to delete appointment');
    } finally {
      setIsDeleting(false);
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
            notes: '',
            startTime: defaultStartTime,
            endTime: dayjs(now.format('YYYY-MM-DD') + 'T' + defaultStartTime).add(1, 'hour').format('HH:mm'),
            serviceStatus: 'PENDING'
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
          assignedStaffIds: si.assignedStaff.map(as => as.staffUserId),
          startTime: si.serviceStartTime ? dayjs(si.serviceStartTime).format('HH:mm') : start.format('HH:mm'),
          endTime: si.serviceEndTime ? dayjs(si.serviceEndTime).format('HH:mm') : end.format('HH:mm'),
          serviceStatus: si.serviceStatus || 'PENDING'
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
      const price = svc.redeemedFromPackageId ? 0 : (service?.defaultPrice || 0);
      return sum + price;
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
      { id: Date.now().toString(), serviceId: '', notes: '', assignedStaffIds: [], startTime: '12:00', endTime: '12:00', serviceStatus: 'PENDING' }
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
            serviceStartTime: `${formData.appointmentDate}T${svc.startTime}:00`,
            serviceEndTime: `${formData.appointmentDate}T${svc.endTime}:00`,
            serviceStatus: svc.serviceStatus || 'PENDING',
            staffIds: svc.assignedStaffIds,
            redeemedFromPackageId: svc.redeemedFromPackageId || undefined
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
            appointmentServiceItemId: svc.id && !svc.id.includes(Date.now().toString().substring(0, 5)) ? Number(svc.id) : undefined,
            serviceId: Number(svc.serviceId),
            notes: svc.notes,
            serviceStartTime: `${formData.appointmentDate}T${svc.startTime}:00`,
            serviceEndTime: `${formData.appointmentDate}T${svc.endTime}:00`,
            serviceStatus: svc.serviceStatus || 'PENDING',
            staffIds: svc.assignedStaffIds,
            redeemedFromPackageId: svc.redeemedFromPackageId || undefined
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
          handleServiceQuickStatusUpdate={handleServiceQuickStatusUpdate}
          setMode={setMode}
          setIsPaymentDialogOpen={setIsPaymentDialogOpen}
          handleUpdateTransactionStatus={handleUpdateTransactionStatus}
          anchorEl={anchorEl}
          setAnchorEl={setAnchorEl}
          selectedTransactionId={selectedTransactionId}
          setSelectedTransactionId={setSelectedTransactionId}
          handleDeleteAppointment={handleDeleteAppointment}
          isDeleting={isDeleting}
          customers={customers}
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
