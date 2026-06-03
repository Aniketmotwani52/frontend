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
import { customerApi } from '../../../shared/api/customer.api';
import { useAuth } from '../../../app/providers/AuthContext';
import type { Customer } from '../../../shared/types/customer.types';
import { CustomerDialog } from '../components/CustomerDialog';

export const CustomerList = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  
  const [customerDialogOpen, setCustomerDialogOpen] = useState(false);
  const [customerToEdit, setCustomerToEdit] = useState<Customer | null>(null);

  // Fetch all customers for the org
  const { data: customers, isLoading, isError } = useQuery({
    queryKey: ['customers', user?.orgId],
    queryFn: () => customerApi.getAllByOrg(user!.orgId),
    enabled: !!user?.orgId
  });

  const handleAddClick = () => {
    setCustomerToEdit(null);
    setCustomerDialogOpen(true);
  };

  const handleEditClick = (customer: Customer) => {
    setCustomerToEdit(customer);
    setCustomerDialogOpen(true);
  };

  const handleDeleteClick = async (customerId: number) => {
    if (window.confirm('Are you sure you want to delete this customer?')) {
      try {
        await customerApi.delete(customerId);
        // Refresh the list after deleting
        queryClient.invalidateQueries({ queryKey: ['customers', user?.orgId] });
      } catch (err) {
        alert('Failed to delete customer.');
      }
    }
  };

  const handleDialogSuccess = () => {
    // Refresh the list after add/edit
    queryClient.invalidateQueries({ queryKey: ['customers', user?.orgId] });
  };

  if (isLoading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
        <CircularProgress />
      </Box>
    );
  }

  if (isError) {
    return <Typography color="error">Failed to load customers.</Typography>;
  }

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
        <Typography variant="h4" sx={{ fontWeight: 700, color: 'var(--text-primary)' }}>
          Customers
        </Typography>
        <Button 
          variant="contained" 
          startIcon={<AddIcon />}
          onClick={handleAddClick}
          sx={{ borderRadius: '24px', px: 3 }}
        >
          Add Customer
        </Button>
      </Box>

      <TableContainer component={Paper} className="glass-panel" sx={{ boxShadow: 'none' }}>
        <Table sx={{ minWidth: 650 }}>
          <TableHead>
            <TableRow>
              <TableCell sx={{ fontWeight: 600 }}>Name</TableCell>
              <TableCell sx={{ fontWeight: 600 }}>Phone</TableCell>
              <TableCell sx={{ fontWeight: 600 }}>Email</TableCell>
              <TableCell sx={{ fontWeight: 600 }}>Status</TableCell>
              <TableCell align="right" sx={{ fontWeight: 600 }}>Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {customers?.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} align="center" sx={{ py: 4, color: 'var(--text-secondary)' }}>
                  No customers found. Click 'Add Customer' to get started!
                </TableCell>
              </TableRow>
            ) : (
              customers?.map((customer) => (
                <TableRow key={customer.customerId} sx={{ '&:last-child td, &:last-child th': { border: 0 } }}>
                  <TableCell component="th" scope="row">
                    <Typography sx={{ fontWeight: 500 }}>{customer.customerName}</Typography>
                  </TableCell>
                  <TableCell>{customer.phoneNumber}</TableCell>
                  <TableCell>{customer.email || '-'}</TableCell>
                  <TableCell>
                    <Chip 
                      label={customer.isActive ? 'Active' : 'Inactive'} 
                      color={customer.isActive ? 'success' : 'default'}
                      size="small"
                      sx={{ borderRadius: 1 }}
                    />
                  </TableCell>
                  <TableCell align="right">
                    <IconButton color="primary" onClick={() => handleEditClick(customer)}>
                      <EditIcon fontSize="small" />
                    </IconButton>
                    <IconButton color="error" onClick={() => handleDeleteClick(customer.customerId)}>
                      <DeleteIcon fontSize="small" />
                    </IconButton>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </TableContainer>

      <CustomerDialog 
        open={customerDialogOpen} 
        onClose={() => setCustomerDialogOpen(false)} 
        onSuccess={handleDialogSuccess}
        customerToEdit={customerToEdit}
      />
    </Box>
  );
};
