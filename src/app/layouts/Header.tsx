import React from 'react';
import { AppBar, Toolbar, Typography, IconButton, Avatar, Box } from '@mui/material';
import MenuIcon from '@mui/icons-material/Menu';
import NotificationsIcon from '@mui/icons-material/Notifications';

interface HeaderProps {
  onMenuClick: () => void;
}

export const Header = ({ onMenuClick }: HeaderProps) => {
  return (
    <AppBar 
      position="static" 
      elevation={0}
      sx={{ 
        backgroundColor: 'var(--glass-bg)',
        backdropFilter: 'blur(12px)',
        borderBottom: '1px solid var(--border-color)',
        color: 'var(--text-primary)'
      }}
    >
      <Toolbar sx={{ height: 'var(--header-height)' }}>
        <IconButton
          edge="start"
          color="inherit"
          aria-label="menu"
          onClick={onMenuClick}
          sx={{ mr: 2, display: { md: 'none' } }}
        >
          <MenuIcon />
        </IconButton>
        
        <Typography variant="h6" component="div" sx={{ flexGrow: 1, fontWeight: 700, color: 'var(--primary-main)' }}>
          SalonPro
        </Typography>

        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <IconButton color="inherit">
            <NotificationsIcon />
          </IconButton>
          <Avatar sx={{ bgcolor: 'var(--primary-main)' }}>A</Avatar>
        </Box>
      </Toolbar>
    </AppBar>
  );
};
