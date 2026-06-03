import React, { useState } from 'react';
import { Box, Toolbar, CssBaseline } from '@mui/material';
import { Outlet } from 'react-router-dom';
import { Header } from './Header';
import { Sidebar } from './Sidebar';

export const MainLayout = () => {
  const [mobileOpen, setMobileOpen] = useState(false);

  const handleDrawerToggle = () => {
    setMobileOpen(!mobileOpen);
  };

  return (
    <Box sx={{ display: 'flex', minHeight: '100vh', backgroundColor: 'var(--bg-default)' }}>
      <CssBaseline />
      
      <Sidebar mobileOpen={mobileOpen} onClose={handleDrawerToggle} />
      
      <Box sx={{ display: 'flex', flexDirection: 'column', flexGrow: 1, width: { md: `calc(100% - var(--sidebar-width))` } }}>
        <Header onMenuClick={handleDrawerToggle} />
        
        <Box component="main" sx={{ p: 3, flexGrow: 1 }}>
          <Outlet />
        </Box>
      </Box>
    </Box>
  );
};
