import React, { useState } from 'react';
import { Drawer, Box, Typography, IconButton, Tabs, Tab, CircularProgress, Paper, Chip, Accordion, AccordionSummary, AccordionDetails, Table, TableBody, TableCell, TableHead, TableRow, TableContainer, Divider } from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import CloseIcon from '@mui/icons-material/Close';
import PersonIcon from '@mui/icons-material/Person';
import { useQuery } from '@tanstack/react-query';
import { appointmentApi } from '../../../shared/api/appointment.api';
import { packageApi } from '../../packages/api/package.api';
import { userApi } from '../../../shared/api/user.api';
import { useAuth } from '../../../app/providers/AuthContext';
import type { Customer } from '../../../shared/types/customer.types';
import dayjs from 'dayjs';

interface CustomerProfileDrawerProps {
  open: boolean;
  onClose: () => void;
  customer: Customer | null;
}

export const CustomerProfileDrawer: React.FC<CustomerProfileDrawerProps> = ({ open, onClose, customer }) => {
  const [tabValue, setTabValue] = useState(0);

  const { data: history, isLoading: historyLoading } = useQuery({
    queryKey: ['customerHistory', customer?.customerId],
    queryFn: () => appointmentApi.getCustomerHistory(customer!.customerId),
    enabled: !!customer?.customerId
  });

  const { data: packages, isLoading: packagesLoading } = useQuery({
    queryKey: ['customerPackages', customer?.customerId],
    queryFn: () => packageApi.getCustomerPackages(customer!.customerId),
    enabled: !!customer?.customerId
  });

  const { user } = useAuth();
  const { data: staffList } = useQuery({
    queryKey: ['staffList', user?.orgId],
    queryFn: () => userApi.getAllByOrg(user!.orgId),
    enabled: !!user?.orgId
  });

  if (!customer) return null;

  const totalSpent = history?.filter(a => a.appointmentStatus === 'COMPLETED').reduce((acc, curr) => acc + (curr.finalAmount || 0), 0) || 0;
  const noShowCount = history?.filter(a => a.appointmentStatus === 'NO_SHOW').length || 0;
  
  // Calculate outstanding balance: any amount unpaid from appointments that aren't cancelled
  // Since we don't have exact amountPaid on the history DTO, we sum the total finalAmount of unpaid appointments
  const outstandingBalance = history?.filter(a => ['PENDING', 'PARTIALLY_PAID'].includes(a.paymentStatus || '') && a.appointmentStatus !== 'CANCELLED')
    .reduce((acc, curr) => acc + (curr.finalAmount || 0), 0) || 0;

  const activePackages = packages?.filter((p: any) => p.status !== 'CANCELLED' && (!p.expiresAt || dayjs(p.expiresAt).isAfter(dayjs()))) || [];

  return (
    <Drawer 
      anchor="right" 
      open={open} 
      onClose={onClose} 
      sx={{ '& .MuiDrawer-paper': { width: { xs: '100%', sm: 700 }, p: 0, bgcolor: 'background.default' } }}
    >
      <Box sx={{ p: 3, display: 'flex', justifyContent: 'space-between', alignItems: 'center', bgcolor: 'primary.main', color: 'primary.contrastText' }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <Box sx={{ bgcolor: 'rgba(255,255,255,0.2)', p: 1, borderRadius: '50%' }}>
            <PersonIcon />
          </Box>
          <Box>
            <Typography variant="h6" sx={{ fontWeight: 700 }}>{customer.customerName}</Typography>
            <Typography variant="body2">{customer.phoneNumber} | {customer.email || 'No email'}</Typography>
          </Box>
        </Box>
        <IconButton onClick={onClose} sx={{ color: 'primary.contrastText' }}>
          <CloseIcon />
        </IconButton>
      </Box>

      <Box sx={{ borderBottom: 1, borderColor: 'divider', px: 3, pt: 2 }}>
        <Tabs value={tabValue} onChange={(e, v) => setTabValue(v)}>
          <Tab label="Snapshot" />
          <Tab label="History" />
          <Tab label="Packages" />
        </Tabs>
      </Box>

      <Box sx={{ p: 3, overflowY: 'auto', flexGrow: 1 }}>
        {(historyLoading || packagesLoading) ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}><CircularProgress /></Box>
        ) : (
          <>
            {tabValue === 0 && (
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 2 }}>
                  <Paper className="glass-panel" sx={{ p: 2, textAlign: 'center' }}>
                    <Typography variant="body2" color="text.secondary">Total Spent</Typography>
                    <Typography variant="h5" sx={{ fontWeight: 700, color: 'primary.main' }}>₹{totalSpent}</Typography>
                  </Paper>
                  <Paper className="glass-panel" sx={{ p: 2, textAlign: 'center' }}>
                    <Typography variant="body2" color="text.secondary">Appointments</Typography>
                    <Typography variant="h5" sx={{ fontWeight: 700 }}>{history?.length || 0}</Typography>
                  </Paper>
                  <Paper className="glass-panel" sx={{ p: 2, textAlign: 'center' }}>
                    <Typography variant="body2" color="text.secondary">No-Shows</Typography>
                    <Typography variant="h5" sx={{ fontWeight: 700, color: noShowCount > 0 ? 'error.main' : 'text.primary' }}>{noShowCount}</Typography>
                  </Paper>
                  <Paper className="glass-panel" sx={{ p: 2, textAlign: 'center' }}>
                    <Typography variant="body2" color="text.secondary">Outstanding Balance</Typography>
                    <Typography variant="h5" sx={{ fontWeight: 700, color: outstandingBalance > 0 ? 'warning.main' : 'text.primary' }}>₹{outstandingBalance}</Typography>
                  </Paper>
                </Box>
                
                {outstandingBalance > 0 && (
                  <Paper sx={{ p: 2, borderLeft: '4px solid', borderColor: 'warning.main', bgcolor: 'warning.light', color: 'warning.contrastText' }}>
                    <Typography sx={{ fontWeight: 600 }}>Action Required</Typography>
                    <Typography variant="body2">This customer owes ₹{outstandingBalance} for past services.</Typography>
                  </Paper>
                )}
              </Box>
            )}

            {tabValue === 1 && (
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                {history?.length === 0 ? (
                  <Typography color="text.secondary" align="center">No appointment history found.</Typography>
                ) : (
                  history?.slice().reverse().map(appt => (
                    <Accordion key={appt.appointmentId} elevation={0} sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 1, '&:before': { display: 'none' } }}>
                      <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', width: '100%', pr: 2, alignItems: 'center' }}>
                          <Box>
                            <Typography sx={{ fontWeight: 600 }}>{dayjs(appt.appointmentStartTime).format('MMM DD, YYYY')}</Typography>
                            <Typography variant="caption" color="text.secondary">{dayjs(appt.appointmentStartTime).format('h:mm A')}</Typography>
                          </Box>
                          <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
                            <Typography variant="body2" sx={{ fontWeight: 600 }}>₹{appt.finalAmount || 0}</Typography>
                            <Chip label={`Appnt: ${appt.appointmentStatus}`} size="small" color={appt.appointmentStatus === 'COMPLETED' ? 'success' : appt.appointmentStatus === 'CANCELLED' ? 'error' : 'default'} />
                            <Chip label={`Payment: ${appt.paymentStatus}`} size="small" variant="outlined" color={appt.paymentStatus === 'PAID' ? 'success' : 'warning'} />
                          </Box>
                        </Box>
                      </AccordionSummary>
                      <AccordionDetails sx={{ pt: 0 }}>
                        <Divider sx={{ mb: 2 }} />
                        <Typography variant="subtitle2" sx={{ mb: 1, color: 'text.secondary' }}>Services Rendered</Typography>
                        <TableContainer component={Paper} elevation={0} sx={{ border: '1px solid', borderColor: 'divider', mb: 2 }}>
                          <Table size="small">
                            <TableHead>
                              <TableRow sx={{ bgcolor: 'var(--bg-subtle)' }}>
                                <TableCell>Service</TableCell>
                                <TableCell>Staff</TableCell>
                                <TableCell>Status</TableCell>
                                <TableCell align="right">Price</TableCell>
                              </TableRow>
                            </TableHead>
                            <TableBody>
                              {((appt as any).services || appt.serviceItems || []).map((s: any) => {
                                const staffNames = s.assignedStaff 
                                  ? s.assignedStaff.map((st: any) => st.staffUserName).join(', ') 
                                  : s.staffIds?.length 
                                    ? s.staffIds.map((id: number) => staffList?.find(u => u.userId === id)?.userName || `Staff #${id}`).join(', ') 
                                    : '-';

                                return (
                                  <TableRow key={s.serviceId || s.appointmentServiceItemId}>
                                    <TableCell>{s.serviceName}</TableCell>
                                    <TableCell>{staffNames}</TableCell>
                                    <TableCell><Chip label={`Service: ${s.serviceStatus}`} size="small" sx={{ height: 20, fontSize: '0.7rem' }} /></TableCell>
                                    <TableCell align="right">₹{s.defaultPrice || s.priceAtBooking || 0}</TableCell>
                                  </TableRow>
                                );
                              })}
                            </TableBody>
                          </Table>
                        </TableContainer>
                        
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', bgcolor: 'var(--bg-subtle)', p: 1.5, borderRadius: 1 }}>
                          <Typography variant="body2" color="text.secondary">Discount: ₹{appt.discountAmount || 0}</Typography>
                          <Typography variant="body2" sx={{ fontWeight: 600 }}>Final Total: ₹{appt.finalAmount || 0}</Typography>
                        </Box>
                      </AccordionDetails>
                    </Accordion>
                  ))
                )}
              </Box>
            )}

            {tabValue === 2 && (
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                {activePackages.length === 0 ? (
                  <Typography color="text.secondary" align="center">No active packages.</Typography>
                ) : (
                  activePackages.map((pkg: any) => (
                    <Accordion key={pkg.customerPackageId} elevation={0} defaultExpanded sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 1, '&:before': { display: 'none' } }}>
                      <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', width: '100%', pr: 2, alignItems: 'center' }}>
                          <Box>
                            <Typography sx={{ fontWeight: 600 }}>{pkg.packageName || pkg.name}</Typography>
                            <Typography variant="caption" color="text.secondary">Purchased: {dayjs(pkg.purchaseDate || pkg.createdAt).format('MMM DD, YYYY')}</Typography>
                          </Box>
                          <Chip label={pkg.status} size="small" color="primary" />
                        </Box>
                      </AccordionSummary>
                      <AccordionDetails sx={{ pt: 0 }}>
                        <Divider sx={{ mb: 2 }} />
                        <Typography variant="subtitle2" sx={{ mb: 1, color: 'text.secondary' }}>Service Balances</Typography>
                        <TableContainer component={Paper} elevation={0} sx={{ border: '1px solid', borderColor: 'divider' }}>
                          <Table size="small">
                            <TableHead>
                              <TableRow sx={{ bgcolor: 'var(--bg-subtle)' }}>
                                <TableCell>Service</TableCell>
                                <TableCell align="center">Total Quantity</TableCell>
                                <TableCell align="center">Remaining</TableCell>
                              </TableRow>
                            </TableHead>
                            <TableBody>
                              {pkg.balances?.map((bal: any) => {
                                const remaining = bal.totalQuantity - bal.usedQuantity;
                                return (
                                  <TableRow key={bal.serviceId}>
                                    <TableCell>{bal.serviceName}</TableCell>
                                    <TableCell align="center">{bal.totalQuantity}</TableCell>
                                    <TableCell align="center">
                                      <Chip 
                                        label={remaining} 
                                        size="small" 
                                        color={remaining > 0 ? 'success' : 'default'}
                                        sx={{ height: 24, minWidth: 30, fontWeight: 600 }}
                                      />
                                    </TableCell>
                                  </TableRow>
                                );
                              })}
                            </TableBody>
                          </Table>
                        </TableContainer>
                        
                        {pkg.expiresAt && (
                          <Typography variant="body2" color="warning.main" sx={{ mt: 2, textAlign: 'right' }}>
                            Expires: {dayjs(pkg.expiresAt).format('MMM DD, YYYY')}
                          </Typography>
                        )}
                      </AccordionDetails>
                    </Accordion>
                  ))
                )}
              </Box>
            )}
          </>
        )}
      </Box>
    </Drawer>
  );
};
