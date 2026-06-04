import React from 'react';
import { Box, Typography, Chip } from '@mui/material';
import dayjs from 'dayjs';
import type { FullAppointment } from '../../../../shared/types/appointment.types';
import { useRoleAccess } from '../../../../shared/hooks/useRoleAccess';

interface CalendarAppointmentBlockProps {
  app: FullAppointment;
  staffUserId: number;
  TIME_SLOTS: number;
  START_HOUR: number;
  onSelect: (app: FullAppointment) => void;
  onDragStart: (e: React.DragEvent, app: FullAppointment, sourceStaffId: number) => void;
}

export const CalendarAppointmentBlock: React.FC<CalendarAppointmentBlockProps> = ({
  app,
  staffUserId,
  TIME_SLOTS,
  START_HOUR,
  onSelect,
  onDragStart
}) => {
  const { hasMinRole } = useRoleAccess();

  const start = dayjs(app.appointmentStartTime);
  const end = dayjs(app.appointmentEndTime);
  const durationMins = end.diff(start, 'minute');
  const startMins = start.hour() * 60 + start.minute() - (START_HOUR * 60);

  const topPos = (startMins / (TIME_SLOTS * 60)) * 100;
  const heightPct = (durationMins / (TIME_SLOTS * 60)) * 100;

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

  const staffColor = STAFF_COLORS[staffUserId % STAFF_COLORS.length];

  return (
    <Box
      className="appointment-block"
      draggable={hasMinRole('RECEPTIONIST')}
      onDragStart={(e) => onDragStart(e, app, staffUserId)}
      onClick={(e) => { e.stopPropagation(); onSelect(app); }}
      sx={{
        position: 'absolute',
        top: `${topPos}%`,
        left: '4px',
        right: '4px',
        height: `${heightPct}%`,
        backgroundColor: staffColor,
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
    >
      <Typography variant="body2" sx={{ fontWeight: 600, lineHeight: 1.2 }}>
        {app.customerName}
      </Typography>
      
      <Typography variant="caption" sx={{ display: 'block', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
        {app.serviceItems?.filter(item => item.assignedStaff?.some(assign => assign.staffUserId === staffUserId)).map(s => s.serviceName).join(', ') || 'No Services'}
      </Typography>

      <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap', mt: 'auto' }}>
        <Chip 
          label={app.appointmentStatus} 
          size="small" 
          color={
            app.appointmentStatus === 'COMPLETED' ? 'primary' :
            app.appointmentStatus === 'IN_PROGRESS' ? 'secondary' :
            app.appointmentStatus === 'SCHEDULED' ? 'info' :
            app.appointmentStatus === 'NO_SHOW' ? 'error' :
            'default'
          }
          sx={{ height: 18, fontSize: '0.65rem', fontWeight: 600 }} 
        />
        <Chip 
          label={app.paymentStatus} 
          size="small" 
          color={app.paymentStatus === 'PAID' ? 'success' : app.paymentStatus === 'OVERPAID' ? 'warning' : 'default'}
          sx={{ height: 18, fontSize: '0.65rem', fontWeight: 600 }} 
        />
      </Box>
    </Box>
  );
};
