import React, { useState, useEffect } from 'react';
import {
  Box, Typography, Paper, CircularProgress, useTheme
} from '@mui/material';
import dayjs from 'dayjs';
import { useAuth } from '../../../app/providers/AuthContext';
import { useRoleAccess } from '../../../shared/hooks/useRoleAccess';
import { userApi } from '../../../shared/api/user.api';
import { appointmentApi } from '../../../shared/api/appointment.api';
import { AppointmentDrawer } from '../components/AppointmentDrawer';
import type { DrawerMode } from '../components/AppointmentDrawer';
import { CalendarHeader } from '../components/calendar/CalendarHeader';
import { CalendarAppointmentBlock } from '../components/calendar/CalendarAppointmentBlock';
import type { User } from '../../../shared/types/user.types';

// Time config: 24 hours
const START_HOUR = 0;
const END_HOUR = 23;
const TIME_SLOTS = Array.from({ length: END_HOUR - START_HOUR + 1 }, (_, i) => START_HOUR + i);


export const AppointmentsCalendar = () => {
  const { user } = useAuth();
  const { hasMinRole } = useRoleAccess();
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

      let staff = await userApi.getActiveStaffByOrg(user.orgId);

      // Isolate STAFF view: non-managers only see themselves
      if (!hasMinRole('MANAGER')) {
        staff = staff.filter(s => s.userId === user.userId);
      } else {
        // Managers+ see everyone except ADMIN
        staff = staff.filter(s => s.role !== 'ADMIN');
      }

      setStaffList(staff);

      // In a real app, this would be filtered by date on the backend
      const appts = await appointmentApi.getFullByOrg(user.orgId);
      // Filter for current day only
      const todaysAppts = appts.filter(a => dayjs(a.appointmentStartTime).isSame(selectedDate, 'day'));
      setAppointments(todaysAppts);
    } catch (error) {
      console.error("Failed to load calendar data:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleNewAppointment = () => {
    setInitialStartTime(undefined);
    setInitialStaffId(undefined);
    setSelectedAppointment(null);
    setDrawerMode('CREATE');
    setDrawerOpen(true);
  };

  const handleDragStart = (e: React.DragEvent, app: import('../../../shared/types/appointment.types').FullAppointment, sourceStaffId: number) => {
    if (!hasMinRole('RECEPTIONIST')) {
      e.preventDefault();
      return;
    }
    e.stopPropagation();
    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
    const grabOffset = e.clientY - rect.top;
    e.dataTransfer.setData('text/plain', JSON.stringify({
      id: app.appointmentId,
      sourceStaffId: sourceStaffId,
      offsetY: grabOffset
    }));
    e.dataTransfer.effectAllowed = 'move';
  };

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
      setIsLoading(false);
    }
  };

  const [initialStartTime, setInitialStartTime] = useState<string | undefined>();
  const [initialStaffId, setInitialStaffId] = useState<number | undefined>();

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%', p: 2, pb: 0, gap: 2 }}>

      <CalendarHeader
        selectedDate={selectedDate}
        setSelectedDate={setSelectedDate}
        onNewAppointment={handleNewAppointment}
      />

      {/* Calendar Grid Area */}
      <Paper
        className="glass-panel"
        sx={{
          flexGrow: 1,
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
          borderRadius: '16px',
          height: 'calc(100vh - 140px)'
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
                const staffApps = appointments.filter(appt =>
                  appt.serviceItems?.some(item =>
                    item.assignedStaff?.some(assign => assign.staffUserId === staff.userId)
                  )
                );

                return (
                  <Box
                    key={staff.userId}
                    sx={{ flex: 1, minWidth: '200px', position: 'relative', borderRight: '1px solid var(--border-color)' }}
                    onClick={(e) => {
                      if (!hasMinRole('RECEPTIONIST')) return;
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
                      if (!hasMinRole('RECEPTIONIST')) return;
                      e.preventDefault();
                      e.dataTransfer.dropEffect = 'move';
                    }}
                    onDrop={(e) => {
                      if (!hasMinRole('RECEPTIONIST')) return;
                      e.preventDefault();
                      const rawData = e.dataTransfer.getData('text/plain');
                      if (!rawData) return;

                      const data = JSON.parse(rawData);
                      const apptId = parseInt(data.id, 10);
                      const grabOffset = parseFloat(data.offsetY);

                      const rect = e.currentTarget.getBoundingClientRect();
                      const mouseOffsetY = e.clientY - rect.top;

                      const actualTopY = mouseOffsetY - grabOffset;

                      const totalMinutes = Math.max(0, Math.floor(actualTopY));
                      const hours = Math.floor(totalMinutes / 60) + START_HOUR;
                      const mins = totalMinutes % 60;

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
                    {staffApps.map(app => (
                      <CalendarAppointmentBlock
                        key={app.appointmentId}
                        app={app}
                        staffUserId={staff.userId}
                        TIME_SLOTS={TIME_SLOTS.length}
                        START_HOUR={START_HOUR}
                        onSelect={(selectedApp) => {
                          setSelectedAppointment(selectedApp);
                          setDrawerMode('VIEW');
                          setDrawerOpen(true);
                        }}
                        onDragStart={handleDragStart}
                      />
                    ))}
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
        initialDate={selectedDate.format('YYYY-MM-DD')}
      />
    </Box>
  );
};
