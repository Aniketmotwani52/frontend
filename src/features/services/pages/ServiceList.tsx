import React, { useState } from 'react';
import {
  Box, Typography, Button, Paper, Table, TableBody,
  TableCell, TableContainer, TableHead, TableRow, IconButton,
  CircularProgress, Chip, TextField, InputAdornment, FormControl, Select, MenuItem
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { serviceApi } from '../../../shared/api/service.api';
import { useAuth } from '../../../app/providers/AuthContext';
import type { Service } from '../../../shared/types/service.types';
import { ServiceDialog } from '../components/ServiceDialog';

export const ServiceList = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const [dialogOpen, setDialogOpen] = useState(false);
  const [serviceToEdit, setServiceToEdit] = useState<Service | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('ALL');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');

  // Fetch all services for the org
  const { data: services, isLoading, isError } = useQuery({
    queryKey: ['services', user?.orgId],
    queryFn: () => serviceApi.getAllByOrg(user!.orgId),
    enabled: !!user?.orgId
  });

  const uniqueCategories = Array.from(new Set(services?.filter(s => s.categoryName).map(s => s.categoryName) || []));

  const handleAddClick = () => {
    setServiceToEdit(null);
    setDialogOpen(true);
  };

  const handleEditClick = (service: Service) => {
    setServiceToEdit(service);
    setDialogOpen(true);
  };

  const handleDeleteClick = async (serviceId: number) => {
    if (window.confirm('Are you sure you want to delete this service?')) {
      try {
        await serviceApi.delete(serviceId);
        // Refresh the list after deleting
        queryClient.invalidateQueries({ queryKey: ['services', user?.orgId] });
      } catch (err) {
        alert('Failed to delete service.');
      }
    }
  };

  const handleDialogSuccess = () => {
    // Refresh the list after add/edit
    queryClient.invalidateQueries({ queryKey: ['services', user?.orgId] });
  };

  if (isLoading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
        <CircularProgress />
      </Box>
    );
  }

  if (isError) {
    return <Typography color="error">Failed to load services.</Typography>;
  }

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
        <Typography variant="h4" sx={{ fontWeight: 700, color: 'var(--text-primary)' }}>
          Services Menu
        </Typography>
        <Box sx={{ display: 'flex', gap: 2 }}>
          <TextField
            size="small"
            placeholder="Search services..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            slotProps={{
              input: {
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon color="action" fontSize="small" />
                  </InputAdornment>
                ),
              }
            }}
            sx={{ width: 250, background: 'var(--bg-paper)', borderRadius: 1 }}
          />
          <FormControl size="small" sx={{ minWidth: 150 }}>
            <Select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value as string)}
              displayEmpty
              sx={{ background: 'var(--bg-paper)' }}
            >
              <MenuItem value="ALL">All Categories</MenuItem>
              {uniqueCategories.map(cat => (
                <MenuItem key={cat} value={cat}>{cat}</MenuItem>
              ))}
            </Select>
          </FormControl>
          <FormControl size="small" sx={{ minWidth: 120 }}>
            <Select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as string)}
              displayEmpty
              sx={{ background: 'var(--bg-paper)' }}
            >
              <MenuItem value="ALL">All Status</MenuItem>
              <MenuItem value="ACTIVE">Active</MenuItem>
              <MenuItem value="INACTIVE">Inactive</MenuItem>
            </Select>
          </FormControl>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={handleAddClick}
            sx={{ borderRadius: '24px', px: 3 }}
          >
            Add Service
          </Button>
        </Box>
      </Box>

      <TableContainer component={Paper} className="glass-panel" sx={{ boxShadow: 'none' }}>
        <Table sx={{ minWidth: 650 }}>
          <TableHead>
            <TableRow>
              <TableCell sx={{ fontWeight: 600 }}>Service Name</TableCell>
              <TableCell sx={{ fontWeight: 600 }}>Category</TableCell>
              <TableCell sx={{ fontWeight: 600 }}>Duration</TableCell>
              <TableCell sx={{ fontWeight: 600 }}>Price</TableCell>
              <TableCell sx={{ fontWeight: 600 }}>Status</TableCell>
              <TableCell align="right" sx={{ fontWeight: 600 }}>Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {services?.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} align="center" sx={{ py: 4, color: 'var(--text-secondary)' }}>
                  No services found.
                </TableCell>
              </TableRow>
            ) : (
              services?.filter(s => {
                let matchesSearch = true;
                let matchesCategory = true;
                let matchesStatus = true;
                
                if (searchQuery) {
                  const q = searchQuery.toLowerCase();
                  matchesSearch = s.name.toLowerCase().includes(q) || 
                                 (s.categoryName && s.categoryName.toLowerCase().includes(q)) || false;
                }
                
                if (categoryFilter !== 'ALL') {
                  matchesCategory = s.categoryName === categoryFilter;
                }
                
                if (statusFilter !== 'ALL') {
                  matchesStatus = statusFilter === 'ACTIVE' ? s.isActive : !s.isActive;
                }
                
                return matchesSearch && matchesCategory && matchesStatus;
              }).map((service) => (
                <TableRow key={service.serviceId} sx={{ '&:last-child td, &:last-child th': { border: 0 } }}>
                  <TableCell component="th" scope="row">
                    <Typography sx={{ fontWeight: 500 }}>{service.name}</Typography>
                    {service.description && (
                      <Typography variant="body2" color="text.secondary">
                        {service.description.substring(0, 50)}{service.description.length > 50 ? '...' : ''}
                      </Typography>
                    )}
                  </TableCell>
                  <TableCell>
                    {service.categoryName ? (
                      <Chip label={service.categoryName} size="small" variant="outlined" />
                    ) : (
                      '-'
                    )}
                  </TableCell>
                  <TableCell>{service.estimatedDurationMinutes} min</TableCell>
                  <TableCell>{service.defaultPrice.toFixed(2)}</TableCell>
                  <TableCell>
                    <Chip
                      label={service.isActive ? 'Active' : 'Inactive'}
                      color={service.isActive ? 'success' : 'default'}
                      size="small"
                      sx={{ borderRadius: 1 }}
                    />
                  </TableCell>
                  <TableCell align="right">
                    <IconButton color="primary" onClick={() => handleEditClick(service)}>
                      <EditIcon fontSize="small" />
                    </IconButton>
                    <IconButton color="error" onClick={() => handleDeleteClick(service.serviceId)}>
                      <DeleteIcon fontSize="small" />
                    </IconButton>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </TableContainer>

      <ServiceDialog
        open={dialogOpen}
        onClose={() => setDialogOpen(false)}
        onSuccess={handleDialogSuccess}
        serviceToEdit={serviceToEdit}
      />
    </Box>
  );
};
