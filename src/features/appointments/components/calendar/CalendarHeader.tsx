import React from 'react';
import { Box, Typography, Button, IconButton } from '@mui/material';
import ChevronLeftIcon from '@mui/icons-material/ChevronLeft';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';
import AddIcon from '@mui/icons-material/Add';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import dayjs, { Dayjs } from 'dayjs';
import { useRoleAccess } from '../../../../shared/hooks/useRoleAccess';

interface CalendarHeaderProps {
  selectedDate: Dayjs;
  setSelectedDate: (date: Dayjs) => void;
  onNewAppointment: () => void;
}

export const CalendarHeader: React.FC<CalendarHeaderProps> = ({ selectedDate, setSelectedDate, onNewAppointment }) => {
  const { hasMinRole } = useRoleAccess();

  return (
    <Box sx={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'center', mb: 3, gap: 2 }}>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
        <Typography variant="h4" sx={{ fontWeight: 800 }} color="text.primary">
          Appointments
        </Typography>
        
        <Box sx={{ display: 'flex', alignItems: 'center', background: 'var(--bg-paper)', borderRadius: '24px', p: 0.5, boxShadow: 'var(--shadow-sm)', border: '1px solid var(--border-color)' }}>
          <IconButton onClick={() => setSelectedDate(selectedDate.subtract(1, 'day'))} size="small">
            <ChevronLeftIcon />
          </IconButton>
          <Button 
            onClick={() => setSelectedDate(dayjs())}
            sx={{ minWidth: 'auto', px: 2, color: 'var(--text-primary)', fontWeight: 600 }}
          >
            Today
          </Button>
          <IconButton onClick={() => setSelectedDate(selectedDate.add(1, 'day'))} size="small">
            <ChevronRightIcon />
          </IconButton>
        </Box>
        
        <LocalizationProvider dateAdapter={AdapterDayjs}>
          <DatePicker
            value={selectedDate}
            onChange={(newValue) => { if (newValue) setSelectedDate(newValue) }}
            slotProps={{
              textField: {
                size: 'small',
                sx: { width: 140, '& .MuiOutlinedInput-root': { borderRadius: '20px', background: 'var(--bg-paper)' } }
              }
            }}
          />
        </LocalizationProvider>
      </Box>

      {hasMinRole('RECEPTIONIST') && (
        <Button 
          variant="contained" 
          startIcon={<AddIcon />}
          onClick={onNewAppointment}
          sx={{ borderRadius: '24px', px: 3, py: 1, boxShadow: '0 8px 16px rgba(25, 118, 210, 0.24)' }}
        >
          New Appointment
        </Button>
      )}
    </Box>
  );
};
