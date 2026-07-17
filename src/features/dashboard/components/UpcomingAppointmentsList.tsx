import React from 'react';
import { Box, Typography, Paper, List, ListItem, ListItemText, ListItemAvatar, Avatar, Chip } from '@mui/material';
import EventIcon from '@mui/icons-material/Event';
import dayjs from 'dayjs';
import type { DashboardAppointmentDto } from '../../../shared/types/dashboard.types';

interface UpcomingAppointmentsListProps {
  appointments: DashboardAppointmentDto[];
}

export const UpcomingAppointmentsList: React.FC<UpcomingAppointmentsListProps> = ({ appointments }) => {
  return (
    <Paper
      elevation={0}
      sx={{
        p: 3,
        borderRadius: 4,
        background: 'rgba(255, 255, 255, 0.7)',
        backdropFilter: 'blur(10px)',
        border: '1px solid rgba(255, 255, 255, 0.5)',
        boxShadow: '0 8px 32px rgba(0, 0, 0, 0.05)',
        height: '100%',
        display: 'flex',
        flexDirection: 'column'
      }}
    >
      <Typography variant="h6" sx={{ fontWeight: 700 }} color="text.primary" gutterBottom>
        Upcoming Appointments
      </Typography>
      
      {appointments.length === 0 ? (
        <Box sx={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <Typography color="text.secondary">No upcoming appointments</Typography>
        </Box>
      ) : (
        <List sx={{ flex: 1, overflow: 'auto', pr: 1 }}>
          {appointments.map((appt) => (
            <ListItem 
              key={appt.appointmentId}
              sx={{ 
                mb: 2, 
                borderRadius: 2, 
                bgcolor: 'rgba(25, 118, 210, 0.04)',
                '&:hover': { bgcolor: 'rgba(25, 118, 210, 0.08)' }
              }}
            >
              <ListItemAvatar>
                <Avatar sx={{ bgcolor: 'primary.main' }}>
                  <EventIcon />
                </Avatar>
              </ListItemAvatar>
              <ListItemText 
                disableTypography
                primary={
                  <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
                    {appt.customerName}
                  </Typography>
                }
                secondary={
                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5, mt: 0.5 }}>
                    <Typography variant="caption" color="text.secondary">
                      {dayjs(appt.startTime).format('h:mm A')} - {dayjs(appt.endTime).format('h:mm A')}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      Staff: {appt.staffName}
                    </Typography>
                  </Box>
                }
              />
              <Chip 
                label={appt.status.replace('_', ' ')} 
                size="small"
                color={appt.status === 'IN_PROGRESS' ? 'warning' : 'info'}
                sx={{ ml: 2, fontSize: '0.7rem', fontWeight: 600 }}
              />
            </ListItem>
          ))}
        </List>
      )}
    </Paper>
  );
};
