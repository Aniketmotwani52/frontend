import React, { useState } from 'react';
import { 
  Box, Typography, Button, Paper, Table, TableBody, 
  TableCell, TableContainer, TableHead, TableRow, IconButton, 
  CircularProgress, Chip 
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { userApi } from '../../../shared/api/user.api';
import { useAuth } from '../../../app/providers/AuthContext';
import type { User } from '../../../shared/types/user.types';
import { StaffDialog } from '../components/StaffDialog';

export const StaffList = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  
  const [dialogOpen, setDialogOpen] = useState(false);
  const [staffToEdit, setStaffToEdit] = useState<User | null>(null);

  // Fetch all users for the org
  const { data: allUsers, isLoading, isError } = useQuery({
    queryKey: ['staff', user?.orgId],
    queryFn: () => userApi.getAllByOrg(user!.orgId),
    enabled: !!user?.orgId
  });

  // Filter out ADMIN role so they don't show in the Salon Staff list
  const staffMembers = allUsers?.filter(u => u.role !== 'ADMIN') || [];

  const handleAddClick = () => {
    setStaffToEdit(null);
    setDialogOpen(true);
  };

  const handleEditClick = (staff: User) => {
    setStaffToEdit(staff);
    setDialogOpen(true);
  };

  const handleDeleteClick = async (userId: number) => {
    if (window.confirm('Are you sure you want to completely remove this staff member?')) {
      try {
        await userApi.delete(userId);
        queryClient.invalidateQueries({ queryKey: ['staff', user?.orgId] });
      } catch (err) {
        alert('Failed to delete staff member.');
      }
    }
  };

  const handleDialogSuccess = () => {
    queryClient.invalidateQueries({ queryKey: ['staff', user?.orgId] });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'ACTIVE': return 'success';
      case 'INACTIVE': return 'default';
      case 'ON_LEAVE': return 'warning';
      default: return 'default';
    }
  };

  if (isLoading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
        <CircularProgress />
      </Box>
    );
  }

  if (isError) {
    return <Typography color="error">Failed to load staff members.</Typography>;
  }

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
        <Typography variant="h4" sx={{ fontWeight: 700, color: 'var(--text-primary)' }}>
          Staff Management
        </Typography>
        <Button 
          variant="contained" 
          startIcon={<AddIcon />}
          onClick={handleAddClick}
          sx={{ borderRadius: '24px', px: 3 }}
        >
          Add Staff Member
        </Button>
      </Box>

      <TableContainer component={Paper} className="glass-panel" sx={{ boxShadow: 'none' }}>
        <Table sx={{ minWidth: 650 }}>
          <TableHead>
            <TableRow>
              <TableCell sx={{ fontWeight: 600 }}>Employee Name</TableCell>
              <TableCell sx={{ fontWeight: 600 }}>Role</TableCell>
              <TableCell sx={{ fontWeight: 600 }}>Contact</TableCell>
              <TableCell sx={{ fontWeight: 600 }}>Shift (Start - End)</TableCell>
              <TableCell sx={{ fontWeight: 600 }}>Login Details</TableCell>
              <TableCell sx={{ fontWeight: 600 }}>Status</TableCell>
              <TableCell align="right" sx={{ fontWeight: 600 }}>Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {staffMembers.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} align="center" sx={{ py: 4, color: 'var(--text-secondary)' }}>
                  No staff members found.
                </TableCell>
              </TableRow>
            ) : (
              staffMembers.map((staff) => (
                <TableRow key={staff.userId} sx={{ '&:last-child td, &:last-child th': { border: 0 } }}>
                  <TableCell component="th" scope="row">
                    <Typography sx={{ fontWeight: 500 }}>{staff.userName}</Typography>
                    {staff.userSalary !== undefined && staff.userSalary !== null && (
                      <Typography variant="caption" color="text.secondary">
                        Salary: {staff.userSalary}
                      </Typography>
                    )}
                  </TableCell>
                  <TableCell>
                    <Chip label={staff.role} size="small" variant="outlined" color="primary" />
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2">{staff.phoneNumber || '-'}</Typography>
                    <Typography variant="caption" color="text.secondary">{staff.email || ''}</Typography>
                  </TableCell>
                  <TableCell>
                    {(staff.workStartTime && staff.workEndTime) 
                      ? `${staff.workStartTime} - ${staff.workEndTime}`
                      : 'Not Scheduled'}
                  </TableCell>
                  <TableCell>
                    {staff.authUsername ? (
                      <Box>
                        <Typography variant="body2" sx={{ fontWeight: 500 }}>{staff.authUsername}</Typography>
                        <Typography variant="caption" color="text.secondary">********</Typography>
                      </Box>
                    ) : (
                      <Typography variant="body2" color="text.secondary">Not Set</Typography>
                    )}
                  </TableCell>
                  <TableCell>
                    <Chip 
                      label={staff.status} 
                      color={getStatusColor(staff.status) as any}
                      size="small"
                      sx={{ borderRadius: 1 }}
                    />
                  </TableCell>
                  <TableCell align="right">
                    <IconButton color="primary" onClick={() => handleEditClick(staff)}>
                      <EditIcon fontSize="small" />
                    </IconButton>
                    <IconButton color="error" onClick={() => handleDeleteClick(staff.userId)}>
                      <DeleteIcon fontSize="small" />
                    </IconButton>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </TableContainer>

      <StaffDialog 
        open={dialogOpen} 
        onClose={() => setDialogOpen(false)} 
        onSuccess={handleDialogSuccess}
        staffToEdit={staffToEdit}
      />
    </Box>
  );
};
