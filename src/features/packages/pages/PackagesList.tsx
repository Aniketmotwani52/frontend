import React, { useState, useEffect } from 'react';
import {
  Box, Typography, Button, Paper, Table, TableBody,
  TableCell, TableContainer, TableHead, TableRow, IconButton,
  CircularProgress, Chip, TextField, InputAdornment, FormControl, Select, MenuItem
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import AddIcon from '@mui/icons-material/Add';
import DeleteIcon from '@mui/icons-material/Delete';
import EditIcon from '@mui/icons-material/Edit';
import type { Package } from '../types/package.types';
import { packageApi } from '../api/package.api';
import { PackageDialog } from '../components/PackageDialog';

interface PackagesListProps {
  orgId: number;
}

export const PackagesList: React.FC<PackagesListProps> = ({ orgId }) => {
  const [packages, setPackages] = useState<Package[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedPackage, setSelectedPackage] = useState<Package | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [validityFilter, setValidityFilter] = useState<string>('ALL');

  const handleOpenDialog = (pkg?: Package) => {
    setSelectedPackage(pkg || null);
    setDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setDialogOpen(false);
    setSelectedPackage(null);
  };

  const loadPackages = async () => {
    try {
      setLoading(true);
      const data = await packageApi.getPackages(orgId, true);
      setPackages(data);
    } catch (err) {
      console.error('Failed to load packages', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPackages();
  }, [orgId]);

  const handleDelete = async (id: number) => {
    if (!window.confirm('Are you sure you want to delete this package?')) return;
    try {
      await packageApi.deletePackage(id);
      loadPackages();
    } catch (err) {
      console.error('Failed to delete package', err);
    }
  };

  if (loading) {
    return <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}><CircularProgress /></Box>;
  }

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h6">Package Catalog</Typography>
        <Box sx={{ display: 'flex', gap: 2 }}>
          <TextField
            size="small"
            placeholder="Search packages..."
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
              value={validityFilter}
              onChange={(e) => setValidityFilter(e.target.value as string)}
              displayEmpty
              sx={{ background: 'var(--bg-paper)' }}
            >
              <MenuItem value="ALL">All Validity</MenuItem>
              <MenuItem value="UNLIMITED">Unlimited</MenuItem>
              <MenuItem value="LIMITED">Limited</MenuItem>
            </Select>
          </FormControl>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => handleOpenDialog()}
          >
            Create Package
          </Button>
        </Box>
      </Box>

      <TableContainer component={Paper} elevation={0} sx={{ border: '1px solid', borderColor: 'divider' }}>
        <Table>
          <TableHead>
            <TableRow sx={{ backgroundColor: 'var(--bg-subtle)' }}>
              <TableCell>Package Name</TableCell>
              <TableCell>Contents</TableCell>
              <TableCell>Base Price</TableCell>
              <TableCell>Validity</TableCell>
              <TableCell align="right">Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {packages.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} align="center" sx={{ py: 4 }}>
                  No packages defined yet.
                </TableCell>
              </TableRow>
            ) : (
              packages.filter(p => {
                let matchesSearch = true;
                let matchesValidity = true;
                
                if (searchQuery) {
                  const q = searchQuery.toLowerCase();
                  matchesSearch = p.name.toLowerCase().includes(q) || 
                                 (p.description && p.description.toLowerCase().includes(q)) || false;
                }
                
                if (validityFilter === 'UNLIMITED') {
                  matchesValidity = !p.validityDays;
                } else if (validityFilter === 'LIMITED') {
                  matchesValidity = !!p.validityDays;
                }
                
                return matchesSearch && matchesValidity;
              }).map((pkg) => (
                <TableRow key={pkg.packageId} hover>
                  <TableCell>
                    <Typography variant="body2" sx={{ fontWeight: 'bold' }}>{pkg.name}</Typography>
                    <Typography variant="caption" color="text.secondary">{pkg.description}</Typography>
                  </TableCell>
                  <TableCell>
                    <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                      {pkg.services?.map(s => (
                        <Chip
                          key={s.serviceId}
                          label={`${s.quantity}x ${s.serviceName}`}
                          size="small"
                          variant="outlined"
                        />
                      ))}
                    </Box>
                  </TableCell>
                  <TableCell>₹{pkg.basePrice}</TableCell>
                  <TableCell>{pkg.validityDays ? `${pkg.validityDays} Days` : 'Unlimited'}</TableCell>
                  <TableCell align="right">
                    <IconButton size="small" color="primary" onClick={() => handleOpenDialog(pkg)} sx={{ mr: 1 }}>
                      <EditIcon fontSize="small" />
                    </IconButton>
                    <IconButton size="small" color="error" onClick={() => handleDelete(pkg.packageId)}>
                      <DeleteIcon fontSize="small" />
                    </IconButton>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </TableContainer>

      <PackageDialog
        open={dialogOpen}
        onClose={handleCloseDialog}
        onSuccess={loadPackages}
        orgId={orgId}
        initialData={selectedPackage}
      />
    </Box>
  );
};
