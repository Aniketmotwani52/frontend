import React, { useState, useEffect } from 'react';
import {
  Box, Typography, Paper, Table, TableBody, TableCell,
  TableContainer, TableHead, TableRow, Chip, CircularProgress,
  TextField, InputAdornment, FormControl, Select, MenuItem,
  Accordion, AccordionSummary, AccordionDetails, Button
} from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import FilterListIcon from '@mui/icons-material/FilterList';
import SearchIcon from '@mui/icons-material/Search';
import dayjs from 'dayjs';
import { useAuth } from '../../../app/providers/AuthContext';
import { appointmentApi } from '../../../shared/api/appointment.api';
import type { FullAppointment } from '../../../shared/types/appointment.types';

interface AppointmentsListProps {
  appointments: FullAppointment[];
  isLoading?: boolean;
  onRowClick: (appointment: FullAppointment) => void;
}

export const AppointmentsList: React.FC<AppointmentsListProps> = ({ appointments, isLoading = false, onRowClick }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  
  // Advanced filters
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [staffFilter, setStaffFilter] = useState<string>('ALL');
  const [serviceFilter, setServiceFilter] = useState<string>('ALL');
  const [minAmount, setMinAmount] = useState<string>('');
  const [maxAmount, setMaxAmount] = useState<string>('');
  
  const uniqueStaff = Array.from(new Set(appointments.flatMap(a => a.serviceItems?.flatMap(s => s.assignedStaff?.map(st => st.staffUserName)) || []).filter(Boolean)));
  const uniqueServices = Array.from(new Set(appointments.flatMap(a => a.serviceItems?.map(s => s.serviceName) || []).filter(Boolean)));

  const filteredAppointments = appointments.filter(a => {
    let matchesSearch = true;
    let matchesStatus = true;
    let matchesDate = true;
    let matchesStaff = true;
    let matchesService = true;
    let matchesAmount = true;
    
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      const cName = a.customerName?.toLowerCase() || '';
      matchesSearch = cName.includes(q);
    }
    
    if (statusFilter !== 'ALL') {
      matchesStatus = a.appointmentStatus === statusFilter;
    }
    
    if (dateFrom) {
      matchesDate = matchesDate && dayjs(a.appointmentStartTime).isAfter(dayjs(dateFrom).startOf('day'));
    }
    if (dateTo) {
      matchesDate = matchesDate && dayjs(a.appointmentStartTime).isBefore(dayjs(dateTo).endOf('day'));
    }
    
    if (staffFilter !== 'ALL') {
      const apptStaff = a.serviceItems?.flatMap(s => s.assignedStaff?.map(st => st.staffUserName)) || [];
      matchesStaff = apptStaff.includes(staffFilter);
    }
    
    if (serviceFilter !== 'ALL') {
      const apptServices = a.serviceItems?.map(s => s.serviceName) || [];
      matchesService = apptServices.includes(serviceFilter);
    }
    
    if (minAmount) {
      matchesAmount = matchesAmount && (a.finalAmount || 0) >= parseFloat(minAmount);
    }
    if (maxAmount) {
      matchesAmount = matchesAmount && (a.finalAmount || 0) <= parseFloat(maxAmount);
    }
    
    return matchesSearch && matchesStatus && matchesDate && matchesStaff && matchesService && matchesAmount;
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'SCHEDULED': return 'primary';
      case 'COMPLETED': return 'success';
      case 'CANCELLED': return 'error';
      case 'NO_SHOW': return 'warning';
      default: return 'default';
    }
  };



  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, height: 'calc(100vh - 140px)' }}>
      <Accordion elevation={0} sx={{ background: 'transparent', '&:before': { display: 'none' } }}>
        <AccordionSummary expandIcon={<ExpandMoreIcon />} sx={{ px: 2, background: 'var(--bg-subtle)', borderRadius: 1 }}>
          <Box sx={{ display: 'flex', gap: 2, alignItems: 'center', width: '100%' }}>
            <FilterListIcon color="action" />
            <Typography sx={{ fontWeight: 600 }}>Filters & Search</Typography>
            <TextField
              size="small"
              placeholder="Search by customer name..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onClick={(e) => e.stopPropagation()}
              slotProps={{
                input: {
                  startAdornment: (
                    <InputAdornment position="start">
                      <SearchIcon color="action" fontSize="small" />
                    </InputAdornment>
                  ),
                }
              }}
              sx={{ width: { xs: '100%', sm: 300 }, background: 'var(--bg-paper)' }}
            />
            <FormControl size="small" sx={{ minWidth: 150 }} onClick={(e) => e.stopPropagation()}>
              <Select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value as string)}
                displayEmpty
                sx={{ background: 'var(--bg-paper)' }}
              >
                <MenuItem value="ALL">All Statuses</MenuItem>
                <MenuItem value="SCHEDULED">Scheduled</MenuItem>
                <MenuItem value="IN_PROGRESS">In Progress</MenuItem>
                <MenuItem value="COMPLETED">Completed</MenuItem>
                <MenuItem value="CANCELLED">Cancelled</MenuItem>
                <MenuItem value="NO_SHOW">No Show</MenuItem>
              </Select>
            </FormControl>
          </Box>
        </AccordionSummary>
        <AccordionDetails sx={{ px: 2, pb: 2, pt: 2 }}>
          <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
            <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
              <Typography variant="body2" color="text.secondary">Date:</Typography>
              <TextField type="date" size="small" value={dateFrom} onChange={e => setDateFrom(e.target.value)} sx={{ background: 'var(--bg-paper)' }} />
              <Typography variant="body2" color="text.secondary">to</Typography>
              <TextField type="date" size="small" value={dateTo} onChange={e => setDateTo(e.target.value)} sx={{ background: 'var(--bg-paper)' }} />
            </Box>
            
            <FormControl size="small" sx={{ minWidth: 150 }}>
              <Select value={staffFilter} onChange={e => setStaffFilter(e.target.value as string)} displayEmpty sx={{ background: 'var(--bg-paper)' }}>
                <MenuItem value="ALL">All Staff</MenuItem>
                {uniqueStaff.map(s => <MenuItem key={s} value={s}>{s}</MenuItem>)}
              </Select>
            </FormControl>
            
            <FormControl size="small" sx={{ minWidth: 150 }}>
              <Select value={serviceFilter} onChange={e => setServiceFilter(e.target.value as string)} displayEmpty sx={{ background: 'var(--bg-paper)' }}>
                <MenuItem value="ALL">All Services</MenuItem>
                {uniqueServices.map(s => <MenuItem key={s} value={s}>{s}</MenuItem>)}
              </Select>
            </FormControl>
            
            <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
              <Typography variant="body2" color="text.secondary">Amount:</Typography>
              <TextField placeholder="Min" type="number" size="small" value={minAmount} onChange={e => setMinAmount(e.target.value)} sx={{ width: 100, background: 'var(--bg-paper)' }} />
              <Typography variant="body2" color="text.secondary">-</Typography>
              <TextField placeholder="Max" type="number" size="small" value={maxAmount} onChange={e => setMaxAmount(e.target.value)} sx={{ width: 100, background: 'var(--bg-paper)' }} />
            </Box>
            
            <Button size="small" onClick={() => {
              setSearchQuery(''); setStatusFilter('ALL'); setDateFrom(''); setDateTo('');
              setStaffFilter('ALL'); setServiceFilter('ALL'); setMinAmount(''); setMaxAmount('');
            }}>Clear All</Button>
          </Box>
        </AccordionDetails>
      </Accordion>

      {isLoading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', flexGrow: 1 }}>
          <CircularProgress />
        </Box>
      ) : (
        <TableContainer component={Paper} className="glass-panel" sx={{ flexGrow: 1, overflowY: 'auto' }}>
        <Table stickyHeader>
          <TableHead>
            <TableRow>
              <TableCell sx={{ fontWeight: 600 }}>Date & Time</TableCell>
              <TableCell sx={{ fontWeight: 600 }}>Customer</TableCell>
              <TableCell sx={{ fontWeight: 600 }}>Services</TableCell>
              <TableCell sx={{ fontWeight: 600 }}>Staff</TableCell>
              <TableCell sx={{ fontWeight: 600 }}>Amount</TableCell>
              <TableCell sx={{ fontWeight: 600 }}>Status</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {filteredAppointments.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} align="center" sx={{ py: 4, color: 'text.secondary' }}>
                  No appointments found.
                </TableCell>
              </TableRow>
            ) : (
              filteredAppointments.map((appt) => (
                <TableRow 
                  key={appt.appointmentId} 
                  hover 
                  onClick={() => onRowClick(appt)}
                  sx={{ cursor: 'pointer', '&:last-child td, &:last-child th': { border: 0 } }}
                >
                  <TableCell>
                    <Typography sx={{ fontWeight: 500 }}>{dayjs(appt.appointmentStartTime).format('MMM D, YYYY')}</Typography>
                    <Typography variant="body2" color="text.secondary">
                      {dayjs(appt.appointmentStartTime).format('h:mm A')} - {dayjs(appt.appointmentEndTime).format('h:mm A')}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Typography sx={{ fontWeight: 500 }}>{appt.customerName || 'Walk-in'}</Typography>
                  </TableCell>
                  <TableCell>
                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                      {appt.serviceItems?.map(s => (
                        <Chip key={s.serviceId} label={s.serviceName} size="small" variant="outlined" />
                      ))}
                    </Box>
                  </TableCell>
                  <TableCell>
                    {appt.serviceItems?.flatMap(s => s.assignedStaff?.map(st => st.staffUserName)).filter((v, i, a) => a.indexOf(v) === i).join(', ') || '-'}
                  </TableCell>
                  <TableCell>
                    <Typography sx={{ fontWeight: 600 }}>₹{appt.finalAmount || 0}</Typography>
                  </TableCell>
                  <TableCell>
                    <Chip 
                      label={appt.appointmentStatus} 
                      color={getStatusColor(appt.appointmentStatus)}
                      size="small"
                      sx={{ borderRadius: 1 }}
                    />
                  </TableCell>
                </TableRow>
              ))
            )}
            </TableBody>
          </Table>
        </TableContainer>
      )}
    </Box>
  );
};
