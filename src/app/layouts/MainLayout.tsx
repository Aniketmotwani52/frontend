import React, { useState } from 'react';
import { Box, Toolbar, CssBaseline } from '@mui/material';
import { Outlet } from 'react-router-dom';
import { Header } from './Header';
import { Sidebar } from './Sidebar';

export const MainLayout = () => {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [desktopOpen, setDesktopOpen] = useState(true);

  const handleDrawerToggle = () => {
    // Determine screen size purely by checking window width or we just toggle both
    // Actually simpler to toggle both, the respective Drawers will handle it based on CSS breakpoints.
    setMobileOpen(!mobileOpen);
    setDesktopOpen(!desktopOpen);
  };

  return (
    <Box sx={{ display: 'flex', minHeight: '100vh', backgroundColor: 'var(--bg-default)' }}>
      <CssBaseline />
      
      <Sidebar mobileOpen={mobileOpen} desktopOpen={desktopOpen} onClose={handleDrawerToggle} />
      
      <Box sx={{ display: 'flex', flexDirection: 'column', flexGrow: 1, width: { xs: '100%', md: desktopOpen ? `calc(100% - var(--sidebar-width))` : '100%' }, transition: 'width 0.2s' }}>
        <Header onMenuClick={handleDrawerToggle} />
        
        <Box component="main" sx={{ p: 3, flexGrow: 1 }}>
          <Outlet />
        </Box>
      </Box>
    </Box>
  );
};
