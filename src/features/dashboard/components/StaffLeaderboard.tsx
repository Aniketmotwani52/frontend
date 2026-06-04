import React from 'react';
import { Box, Typography, Paper, List, ListItem, ListItemText, ListItemAvatar, Avatar } from '@mui/material';
import EmojiEventsIcon from '@mui/icons-material/EmojiEvents';
import type { StaffPerformanceDto } from '../../../shared/types/dashboard.types';

interface StaffLeaderboardProps {
  staff: StaffPerformanceDto[];
}

export const StaffLeaderboard: React.FC<StaffLeaderboardProps> = ({ staff }) => {
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
        Staff Leaderboard
      </Typography>
      
      {staff.length === 0 ? (
        <Box sx={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <Typography color="text.secondary">No staff performance data</Typography>
        </Box>
      ) : (
        <List sx={{ flex: 1, overflow: 'auto', pr: 1 }}>
          {staff.map((member, index) => (
            <ListItem 
              key={member.staffId}
              sx={{ 
                mb: 2, 
                borderRadius: 2, 
                bgcolor: index === 0 ? 'rgba(255, 215, 0, 0.1)' : 'rgba(0, 0, 0, 0.02)',
                border: index === 0 ? '1px solid rgba(255, 215, 0, 0.3)' : 'none',
              }}
            >
              <ListItemAvatar>
                <Avatar sx={{ 
                  bgcolor: index === 0 ? '#FFD700' : index === 1 ? '#C0C0C0' : index === 2 ? '#CD7F32' : 'grey.300',
                  color: index < 3 ? '#fff' : 'text.secondary'
                }}>
                  {index < 3 ? <EmojiEventsIcon /> : index + 1}
                </Avatar>
              </ListItemAvatar>
              <ListItemText 
                disableTypography
                primary={
                  <Typography variant="subtitle2" sx={{ fontWeight: index === 0 ? 700 : 600 }}>
                    {member.staffName}
                  </Typography>
                }
                secondary={
                  <Typography variant="caption" color="text.secondary">
                    {member.appointmentsCompleted} Appointments
                  </Typography>
                }
              />
              <Typography variant="subtitle2" sx={{ fontWeight: 700 }} color="primary.main">
                ₹{member.revenueGenerated}
              </Typography>
            </ListItem>
          ))}
        </List>
      )}
    </Paper>
  );
};
