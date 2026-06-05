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
import { serviceCategoryApi } from '../../../shared/api/service.api';
import { useAuth } from '../../../app/providers/AuthContext';
import type { ServiceCategory } from '../../../shared/types/service.types';
import { ServiceCategoryDialog } from '../components/ServiceCategoryDialog';

export const ServiceCategoryList = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const [dialogOpen, setDialogOpen] = useState(false);
  const [categoryToEdit, setCategoryToEdit] = useState<ServiceCategory | null>(null);

  // Fetch all categories for the org
  const { data: categories, isLoading, isError } = useQuery({
    queryKey: ['serviceCategories', user?.orgId],
    queryFn: () => serviceCategoryApi.getAllByOrg(user!.orgId),
    enabled: !!user?.orgId
  });

  const handleAddClick = () => {
    setCategoryToEdit(null);
    setDialogOpen(true);
  };

  const handleEditClick = (category: ServiceCategory) => {
    setCategoryToEdit(category);
    setDialogOpen(true);
  };

  const handleDeleteClick = async (categoryId: number) => {
    if (window.confirm('Are you sure you want to delete this category? Services in this category will become uncategorized.')) {
      try {
        await serviceCategoryApi.delete(categoryId);
        // Refresh the list after deleting
        queryClient.invalidateQueries({ queryKey: ['serviceCategories', user?.orgId] });
      } catch (err) {
        alert('Failed to delete category.');
      }
    }
  };

  const handleDialogSuccess = () => {
    queryClient.invalidateQueries({ queryKey: ['serviceCategories', user?.orgId] });
  };

  if (isLoading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
        <CircularProgress />
      </Box>
    );
  }

  if (isError) {
    return <Typography color="error">Failed to load categories.</Typography>;
  }

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
        <Typography variant="h5" sx={{ fontWeight: 600, color: 'var(--text-primary)' }}>
          Manage Categories
        </Typography>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={handleAddClick}
          sx={{ borderRadius: '24px', px: 3 }}
        >
          Add Category
        </Button>
      </Box>

      <TableContainer component={Paper} className="glass-panel" sx={{ boxShadow: 'none' }}>
        <Table sx={{ minWidth: 650 }}>
          <TableHead>
            <TableRow>
              <TableCell sx={{ fontWeight: 600 }}>Category Name</TableCell>
              <TableCell sx={{ fontWeight: 600 }}>Status</TableCell>
              <TableCell align="right" sx={{ fontWeight: 600 }}>Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {categories?.length === 0 ? (
              <TableRow>
                <TableCell colSpan={3} align="center" sx={{ py: 4, color: 'var(--text-secondary)' }}>
                  No categories found.
                </TableCell>
              </TableRow>
            ) : (
              categories?.map((category) => (
                <TableRow key={category.categoryId} sx={{ '&:last-child td, &:last-child th': { border: 0 } }}>
                  <TableCell component="th" scope="row">
                    <Typography sx={{ fontWeight: 500 }}>{category.name}</Typography>
                    {category.description && (
                      <Typography variant="body2" color="text.secondary">
                        {category.description}
                      </Typography>
                    )}
                  </TableCell>
                  <TableCell>
                    <Chip
                      label={category.isActive ? 'Active' : 'Inactive'}
                      color={category.isActive ? 'success' : 'default'}
                      size="small"
                      sx={{ borderRadius: 1 }}
                    />
                  </TableCell>
                  <TableCell align="right">
                    <IconButton color="primary" onClick={() => handleEditClick(category)}>
                      <EditIcon fontSize="small" />
                    </IconButton>
                    <IconButton color="error" onClick={() => handleDeleteClick(category.categoryId)}>
                      <DeleteIcon fontSize="small" />
                    </IconButton>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </TableContainer>

      <ServiceCategoryDialog
        open={dialogOpen}
        onClose={() => setDialogOpen(false)}
        onSuccess={handleDialogSuccess}
        categoryToEdit={categoryToEdit}
      />
    </Box>
  );
};
