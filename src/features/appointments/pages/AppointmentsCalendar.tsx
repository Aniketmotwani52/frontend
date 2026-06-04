import React, { useState, useEffect } from 'react';
import {
  Box, Typography, IconButton, Paper, CircularProgress,
  Button, useTheme, Chip
} from '@mui/material';
import ChevronLeftIcon from '@mui/icons-material/ChevronLeft';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';
import AddIcon from '@mui/icons-material/Add';
import dayjs from 'dayjs';
import { useAuth } from '../../../app/providers/AuthContext';
import { userApi } from '../../../shared/api/user.api';
import { appointmentApi } from '../../../shared/api/appointment.api';
import { AppointmentDrawer } from '../components/AppointmentDrawer';
import type { DrawerMode } from '../components/AppointmentDrawer';
import type { User } from '../../../shared/types/user.types';
import type { Appointment } from '../../../shared/types/appointment.types';

// Time config: 24 hours
const START_HOUR = 0;
const END_HOUR = 23;
const TIME_SLOTS = Array.from({ length: END_HOUR - START_HOUR + 1 }, (_, i) => START_HOUR + i);

const STAFF_COLORS = [
  '#E3F2FD', // Light Blue
  '#F3E5F5', // Light Purple
  '#E8F5E9', // Light Green
  '#FFF3E0', // Light Orange
  '#FFEBEE', // Light Red
  '#E0F7FA', // Light Cyan
  '#FCE4EC', // Light Pink
  '#FFF8E1', // Light Amber
];

export const AppointmentsCalendar = () => {
  const { user } = useAuth();
  const theme = useTheme();

  const [selectedDate, setSelectedDate] = useState(dayjs());
  const [staffList, setStaffList] = useState<User[]>([]);
  const [appointments, setAppointments] = useState<import('../../../shared/types/appointment.types').FullAppointment[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const [drawerOpen, setDrawerOpen] = useState(false);
  const [drawerMode, setDrawerMode] = useState<DrawerMode>('VIEW');
  const [selectedAppointment, setSelectedAppointment] = useState<import('../../../shared/types/appointment.types').FullAppointment | null>(null);

  useEffect(() => {
    if (user?.orgId) {
      loadData();
    }
  }, [user, selectedDate]);

  const loadData = async () => {
    try {
      setIsLoading(true);
      if (!user) return;

      const staff = await userApi.getActiveStaffByOrg(user.orgId);
      console.log(staff);
      // Filter out ADMIN role
      setStaffList(staff.filter(s => s.role !== 'ADMIN'));

      // In a real app, this would be filtered by date on the backend
      const appts = await appointmentApi.getFullByOrg(user.orgId);
      console.log(appts);
      // Filter for current day only
      const todaysAppts = appts.filter(a => dayjs(a.appointmentStartTime).isSame(selectedDate, 'day'));
      setAppointments(todaysAppts);
    } catch (error) {
      console.error("Failed to load calendar data:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handlePrevDay = () => setSelectedDate(prev => prev.subtract(1, 'day'));
  const handleNextDay = () => setSelectedDate(prev => prev.add(1, 'day'));
  const handleToday = () => setSelectedDate(dayjs());

  const handleDropAppointment = async (appointmentId: number, newStaffId: number, hours: number, mins: number) => {
    try {
      setIsLoading(true);
      const appt = appointments.find(a => a.appointmentId === appointmentId);
      if (!appt) return;

      const oldStart = dayjs(appt.appointmentStartTime);
      const oldEnd = dayjs(appt.appointmentEndTime);
      const durationMinutes = oldEnd.diff(oldStart, 'minute');

      const newStart = oldStart.hour(hours).minute(mins);
      const newEnd = newStart.add(durationMinutes, 'minute');

      const updateData = {
        customerId: appt.customerId,
        appointmentStartTime: newStart.format('YYYY-MM-DDTHH:mm:ss'),
        appointmentEndTime: newEnd.format('YYYY-MM-DDTHH:mm:ss'),
        notes: appt.notes || '',
        appointmentStatus: appt.appointmentStatus,
        discountAmount: appt.discountAmount || 0,
        services: appt.serviceItems?.map(s => ({
          serviceId: s.serviceId,
          notes: s.notes || '',
          staffIds: [newStaffId]
        })) || []
      };

      await appointmentApi.updateFullWorkflow(appt.appointmentId, updateData);
      await loadData();
    } catch (err) {
      console.error('Failed to move appointment', err);
      setIsLoading(false); // only needed if loadData fails, otherwise loadData handles it
    }
  };

  const [initialStartTime, setInitialStartTime] = useState<string | undefined>();
  const [initialStaffId, setInitialStaffId] = useState<number | undefined>();



  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%', p: 2, pb: 0, gap: 2 }}>

      {/* Header Controls */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 2 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, flexWrap: 'wrap' }}>
          <Typography variant="h5" sx={{ fontWeight: 700, color: 'var(--text-primary)' }}>
            Appointments
          </Typography>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, ml: 2, background: 'var(--glass-bg)', p: 0.5, borderRadius: '24px', border: '1px solid var(--border-color)' }}>
            <IconButton onClick={handlePrevDay} size="small"><ChevronLeftIcon /></IconButton>
            <Typography sx={{ fontWeight: 600, minWidth: '150px', textAlign: 'center' }}>
              {selectedDate.format('dddd, MMM D, YYYY')}
            </Typography>
            <IconButton onClick={handleNextDay} size="small"><ChevronRightIcon /></IconButton>
          </Box>
          <Button variant="outlined" size="small" onClick={handleToday} sx={{ borderRadius: '16px' }}>
            Move to Today
          </Button>
        </Box>

        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => {
            setInitialStartTime(undefined);
            setInitialStaffId(undefined);
            setSelectedAppointment(null);
            setDrawerMode('CREATE');
            setDrawerOpen(true);
          }}
          sx={{ borderRadius: '24px', px: 3 }}
        >
          New Appointment
        </Button>
      </Box>

      {/* Calendar Grid Area */}
      <Paper
        className="glass-panel"
        sx={{
          flexGrow: 1,
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
          borderRadius: '16px',
          height: 'calc(100vh - 140px)' // Force internal scrolling
        }}
      >
        {isLoading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%' }}>
            <CircularProgress size={48} sx={{ color: 'var(--primary-main)' }} />
          </Box>
        ) : (
          <Box sx={{ flexGrow: 1, overflowY: 'auto', overflowX: 'auto', display: 'flex', flexDirection: 'column', position: 'relative' }}>

          {/* Grid Header (Staff Names) - Sticky Top */}
          <Box sx={{
            display: 'flex',
            borderBottom: '1px solid var(--border-color)',
            background: 'var(--glass-bg)',
            position: 'sticky',
            top: 0,
            zIndex: 10,
            backdropFilter: 'blur(10px)'
          }}>
            <Box sx={{ 
              width: '80px', 
              minWidth: '80px', 
              flexShrink: 0, 
              borderRight: '1px solid var(--border-color)', 
              background: 'var(--bg-paper)',
              position: 'sticky',
              left: 0,
              zIndex: 11
            }} />
            {staffList.map(staff => (
              <Box key={staff.userId} sx={{ flex: 1, minWidth: '200px', p: 2, textAlign: 'center', borderRight: '1px solid var(--border-color)' }}>
                <Typography sx={{ fontWeight: 600 }}>{staff.userName}</Typography>
                <Typography variant="caption" color="text.secondary">{staff.role}</Typography>
              </Box>
            ))}
          </Box>

          {/* Grid Body */}
          <Box sx={{ display: 'flex', flexGrow: 1, position: 'relative', pt: 2 }}>

            {/* Time Labels Column - Sticky Left */}
            <Box sx={{ width: '80px', minWidth: '80px', flexShrink: 0, borderRight: '1px solid var(--border-color)', position: 'sticky', left: 0, background: 'var(--bg-paper)', zIndex: 5 }}>
              {TIME_SLOTS.map(hour => (
                <Box key={hour} sx={{ height: '60px', position: 'relative' }}>
                  <Typography
                    variant="caption"
                    sx={{
                      position: 'absolute',
                      top: '-10px',
                      right: '12px',
                      color: 'text.secondary',
                      fontWeight: 500,
                      background: 'var(--glass-bg)',
                      px: 0.5
                    }}
                  >
                    {dayjs().hour(hour).minute(0).format('h A')}
                  </Typography>
                </Box>
              ))}
            </Box>

            {/* Staff Columns Area */}
            {staffList.map((staff, index) => {
              const staffColor = STAFF_COLORS[staff.userId % STAFF_COLORS.length];

              return (
                <Box 
                  key={staff.userId} 
                  sx={{ flex: 1, minWidth: '200px', position: 'relative', borderRight: '1px solid var(--border-color)' }}
                  onClick={(e) => {
                    if ((e.target as HTMLElement).closest('.appointment-block')) return;
                    
                    const rect = e.currentTarget.getBoundingClientRect();
                    const offsetY = e.clientY - rect.top;
                    
                    const totalMinutes = Math.floor(offsetY);
                    const hours = Math.floor(totalMinutes / 60) + START_HOUR;
                    const mins = totalMinutes % 60;
                    
                    const snappedMins = Math.round(mins / 30) * 30;
                    
                    let finalHours = hours;
                    let finalMins = snappedMins;
                    if (finalMins === 60) {
                      finalHours += 1;
                      finalMins = 0;
                    }
                    
                    const timeStr = `${finalHours.toString().padStart(2, '0')}:${finalMins.toString().padStart(2, '0')}`;
                    
                    setInitialStartTime(timeStr);
                    setInitialStaffId(staff.userId);
                    setSelectedAppointment(null);
                    setDrawerMode('CREATE');
                    setDrawerOpen(true);
                  }}
                  onDragOver={(e) => {
                    e.preventDefault();
                    e.dataTransfer.dropEffect = 'move';
                  }}
                  onDrop={(e) => {
                    e.preventDefault();
                    const rawData = e.dataTransfer.getData('text/plain');
                    if (!rawData) return;
                    
                    const data = JSON.parse(rawData);
                    const apptId = parseInt(data.id, 10);
                    const grabOffset = parseFloat(data.offsetY);
                    
                    const rect = e.currentTarget.getBoundingClientRect();
                    const mouseOffsetY = e.clientY - rect.top;
                    
                    // The actual top of the appointment block
                    const actualTopY = mouseOffsetY - grabOffset;
                    
                    const totalMinutes = Math.max(0, Math.floor(actualTopY));
                    const hours = Math.floor(totalMinutes / 60) + START_HOUR;
                    const mins = totalMinutes % 60;
                    
                    // Snap grid wise (nearest 30 minutes)
                    const snappedMins = Math.round(mins / 30) * 30;
                    
                    let finalHours = hours;
                    let finalMins = snappedMins;
                    if (finalMins === 60) {
                      finalHours += 1;
                      finalMins = 0;
                    }
                    
                    handleDropAppointment(apptId, staff.userId, finalHours, finalMins);
                  }}
                >

                  {/* Horizontal Grid Lines */}
                  {TIME_SLOTS.map(hour => (
                    <Box
                      key={hour}
                      sx={{
                        height: '60px',
                        borderBottom: '1px solid var(--border-color)',
                        '&:hover': { background: 'rgba(0,0,0,0.02)', cursor: 'pointer' }
                      }}
                    />
                  ))}

                  {/* Render Appointments */}
                  {appointments
                    .filter(appt =>
                      appt.serviceItems?.some(item =>
                        item.assignedStaff?.some(assign => assign.staffUserId === staff.userId)
                      )
                    )
                    .map(appt => {
                      const start = dayjs(appt.appointmentStartTime);
                      const end = dayjs(appt.appointmentEndTime);
                      const startHour = start.hour();
                      const startMinute = start.minute();
                      const durationMinutes = end.diff(start, 'minute');

                      // Calculate position
                      const topPx = (startHour - START_HOUR) * 60 + startMinute;
                      const heightPx = durationMinutes;

                      // Only show if it falls within the visible calendar hours
                      if (startHour < START_HOUR || startHour > END_HOUR) return null;

                      return (
                        <Box
                          key={appt.appointmentId}
                          className="appointment-block"
                          draggable={true}
                          onDragStart={(e) => {
                            e.stopPropagation();
                            const rect = e.currentTarget.getBoundingClientRect();
                            const grabOffset = e.clientY - rect.top;
                            e.dataTransfer.setData('text/plain', JSON.stringify({
                              id: appt.appointmentId,
                              offsetY: grabOffset
                            }));
                            e.dataTransfer.effectAllowed = 'move';
                          }}
                          sx={{
                            position: 'absolute',
                            top: `${topPx}px`,
                            height: `${heightPx}px`,
                            left: '4px',
                            right: '4px',
                            background: staffColor,
                            borderRadius: '8px',
                            p: 1,
                            color: 'rgba(0,0,0,0.87)',
                            boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
                            border: '1px solid rgba(0,0,0,0.05)',
                            opacity: 0.9,
                            overflow: 'hidden',
                            display: 'flex',
                            flexDirection: 'column',
                            gap: 0.5,
                            cursor: 'pointer',
                            '&:hover': { opacity: 1, zIndex: 10, boxShadow: '0 4px 8px rgba(0,0,0,0.15)' }
                          }}
                          onClick={() => {
                            setSelectedAppointment(appt);
                            setDrawerMode('VIEW');
                            setDrawerOpen(true);
                          }}
                        >
                          <Typography variant="body2" sx={{ fontWeight: 600, lineHeight: 1.2 }}>
                            {appt.customerName}
                          </Typography>
                          
                          <Typography variant="caption" sx={{ display: 'block', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                            {appt.serviceItems?.filter(item => item.assignedStaff?.some(assign => assign.staffUserId === staff.userId)).map(s => s.serviceName).join(', ') || 'No Services'}
                          </Typography>

                          <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap', mt: 'auto' }}>
                            <Chip 
                              label={appt.appointmentStatus} 
                              size="small" 
                              color={
                                appt.appointmentStatus === 'COMPLETED' ? 'primary' :
                                appt.appointmentStatus === 'IN_PROGRESS' ? 'secondary' :
                                appt.appointmentStatus === 'SCHEDULED' ? 'info' :
                                appt.appointmentStatus === 'NO_SHOW' ? 'error' :
                                'default'
                              }
                              sx={{ height: 18, fontSize: '0.65rem', fontWeight: 600 }} 
                            />
                            <Chip 
                              label={appt.paymentStatus} 
                              size="small" 
                              color={appt.paymentStatus === 'PAID' ? 'success' : appt.paymentStatus === 'OVERPAID' ? 'warning' : 'default'}
                              sx={{ height: 18, fontSize: '0.65rem', fontWeight: 600 }} 
                            />
                          </Box>
                        </Box>
                      );
                    })}
                </Box>
              );
            })}
          </Box>
        </Box>
        )}
      </Paper>

      <AppointmentDrawer
        open={drawerOpen}
        mode={drawerMode}
        setMode={setDrawerMode}
        appointment={selectedAppointment}
        onClose={() => setDrawerOpen(false)}
        onSuccess={() => {
          setDrawerOpen(false);
          loadData();
        }}
        staffList={staffList}
        initialStartTime={initialStartTime}
        initialStaffId={initialStaffId}
      />
    </Box>
  );
};
