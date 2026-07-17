import React, { useState } from 'react';
import { 
  Box, Typography, Paper, Table, TableBody, 
  TableCell, TableContainer, TableHead, TableRow, 
  CircularProgress, Collapse, IconButton, TextField 
} from '@mui/material';
import KeyboardArrowDownIcon from '@mui/icons-material/KeyboardArrowDown';
import KeyboardArrowUpIcon from '@mui/icons-material/KeyboardArrowUp';
import { useQuery } from '@tanstack/react-query';
import { dashboardApi } from '../../../shared/api/dashboard.api';
import { useAuth } from '../../../app/providers/AuthContext';
import type { StaffLedgerResponse } from '../../../shared/types/dashboard.types';
import dayjs from 'dayjs';

const Row = ({ row }: { row: StaffLedgerResponse }) => {
  const [open, setOpen] = useState(false);

  return (
    <React.Fragment>
      <TableRow sx={{ '& > *': { borderBottom: 'unset' }, background: open ? 'rgba(0,0,0,0.02)' : 'inherit' }}>
        <TableCell>
          <IconButton aria-label="expand row" size="small" onClick={() => setOpen(!open)}>
            {open ? <KeyboardArrowUpIcon /> : <KeyboardArrowDownIcon />}
          </IconButton>
        </TableCell>
        <TableCell component="th" scope="row">
          <Typography sx={{ fontWeight: 600 }}>{row.staffName}</Typography>
        </TableCell>
        <TableCell align="center">{row.servicesCompleted}</TableCell>
        <TableCell align="right">
          <Typography sx={{ fontWeight: 700, color: 'primary.main' }}>
            ₹{row.totalServiceValue.toFixed(2)}
          </Typography>
        </TableCell>
      </TableRow>
      <TableRow>
        <TableCell style={{ paddingBottom: 0, paddingTop: 0 }} colSpan={5}>
          <Collapse in={open} timeout="auto" unmountOnExit>
            <Box sx={{ margin: 2, p: 2, background: 'rgba(255,255,255,0.5)', borderRadius: 2 }}>
              <Typography variant="h6" gutterBottom component="div" sx={{ fontSize: '0.9rem', fontWeight: 600 }}>
                Service Execution History
              </Typography>
              <Table size="small" aria-label="purchases">
                <TableHead>
                  <TableRow>
                    <TableCell>Date</TableCell>
                    <TableCell>Service Name</TableCell>
                    <TableCell>Service Status</TableCell>
                    <TableCell align="right">Split Value</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {row.services.map((service, idx) => (
                    <TableRow key={idx}>
                      <TableCell>{dayjs(service.date).format('MMM DD, YYYY h:mm A')}</TableCell>
                      <TableCell>{service.serviceName}</TableCell>
                      <TableCell>{service.serviceStatus}</TableCell>
                      <TableCell align="right">
                        <Typography sx={{ fontWeight: 600 }}>
                          ₹{service.serviceValue.toFixed(2)}
                        </Typography>
                      </TableCell>
                    </TableRow>
                  ))}
                  {row.services.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={6} align="center" sx={{ color: 'text.secondary' }}>No completed services</TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </Box>
          </Collapse>
        </TableCell>
      </TableRow>
    </React.Fragment>
  );
};

export const StaffLedger = () => {
  const { user } = useAuth();
  
  const [fromDate, setFromDate] = useState<string>(dayjs().startOf('month').format('YYYY-MM-DDTHH:mm:ss'));
  const [toDate, setToDate] = useState<string>(dayjs().endOf('day').format('YYYY-MM-DDTHH:mm:ss'));
  
  const { data: ledgers, isLoading, isError } = useQuery({
    queryKey: ['staff-ledger', user?.orgId, fromDate, toDate],
    queryFn: () => dashboardApi.getStaffLedger(user!.orgId, fromDate, toDate),
    enabled: !!user?.orgId
  });

  if (isLoading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
        <CircularProgress />
      </Box>
    );
  }

  if (isError) {
    return <Typography color="error">Failed to load staff performance ledger.</Typography>;
  }

  return (
    <Box>
      <Box sx={{ display: 'flex', gap: 2, mb: 3, alignItems: 'center' }}>
        <Typography variant="body2" color="text.secondary">Filter by Date:</Typography>
        <TextField
          type="date"
          size="small"
          value={dayjs(fromDate).format('YYYY-MM-DD')}
          onChange={(e) => setFromDate(dayjs(e.target.value).startOf('day').format('YYYY-MM-DDTHH:mm:ss'))}
          sx={{ background: 'var(--bg-paper)' }}
        />
        <Typography variant="body2" color="text.secondary">to</Typography>
        <TextField
          type="date"
          size="small"
          value={dayjs(toDate).format('YYYY-MM-DD')}
          onChange={(e) => setToDate(dayjs(e.target.value).endOf('day').format('YYYY-MM-DDTHH:mm:ss'))}
          sx={{ background: 'var(--bg-paper)' }}
        />
      </Box>

      <TableContainer component={Paper} className="glass-panel" sx={{ boxShadow: 'none' }}>
        <Table aria-label="collapsible table">
          <TableHead>
            <TableRow>
              <TableCell />
              <TableCell sx={{ fontWeight: 600 }}>Staff Name</TableCell>
              <TableCell align="center" sx={{ fontWeight: 600 }}>Services Completed</TableCell>
              <TableCell align="right" sx={{ fontWeight: 600 }}>Total Service Value</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {ledgers?.length === 0 ? (
              <TableRow>
                <TableCell colSpan={4} align="center" sx={{ py: 4, color: 'text.secondary' }}>
                  No performance data available for this date range
                </TableCell>
              </TableRow>
            ) : (
              ledgers?.map((row) => (
                <Row key={row.staffId} row={row} />
              ))
            )}
          </TableBody>
        </Table>
      </TableContainer>
    </Box>
  );
};
