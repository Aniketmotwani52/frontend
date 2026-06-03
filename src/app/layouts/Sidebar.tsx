import React from 'react';
import { Drawer, List, ListItem, ListItemButton, ListItemIcon, ListItemText, Box, Toolbar, Typography } from '@mui/material';
import DashboardIcon from '@mui/icons-material/Dashboard';
import EventIcon from '@mui/icons-material/Event';
import PeopleIcon from '@mui/icons-material/People';
import ContentCutIcon from '@mui/icons-material/ContentCut';
import { useNavigate, useLocation } from 'react-router-dom';

const DRAWER_WIDTH = 260;

const menuItems = [
  { text: 'Dashboard', icon: <DashboardIcon />, path: '/' },
  { text: 'Scheduler', icon: <EventIcon />, path: '/scheduler' },
  { text: 'Customers', icon: <PeopleIcon />, path: '/customers' },
  { text: 'Services', icon: <ContentCutIcon />, path: '/services' },
];

interface SidebarProps {
  mobileOpen: boolean;
  onClose: () => void;
}

export const Sidebar = ({ mobileOpen, onClose }: SidebarProps) => {
  const navigate = useNavigate();
  const location = useLocation();

  const drawerContent = (
    <>
      <Toolbar sx={{ height: 'var(--header-height)', display: 'flex', alignItems: 'center', px: 2 }}>
        <Typography variant="h6" sx={{ fontWeight: 800, color: 'var(--primary-main)' }}>
          SalonPro
        </Typography>
      </Toolbar>
      <Box sx={{ overflow: 'auto', mt: 2 }}>
      <List sx={{ px: 2 }}>
        {menuItems.map((item) => {
          const isActive = location.pathname === item.path;
          return (
            <ListItem key={item.text} disablePadding sx={{ mb: 1 }}>
              <ListItemButton
                onClick={() => {
                  navigate(item.path);
                  onClose();
                }}
                sx={{
                  borderRadius: 'var(--border-radius)',
                  backgroundColor: isActive ? 'var(--primary-light)' : 'transparent',
                  color: isActive ? 'var(--primary-contrastText)' : 'var(--text-secondary)',
                  '&:hover': {
                    backgroundColor: isActive ? 'var(--primary-main)' : 'rgba(0,0,0,0.04)',
                    color: isActive ? 'var(--primary-contrastText)' : 'var(--primary-main)',
                  }
                }}
              >
                <ListItemIcon sx={{ color: 'inherit', minWidth: 40 }}>
                  {item.icon}
                </ListItemIcon>
                <ListItemText primary={<Typography sx={{ fontWeight: isActive ? 600 : 500 }}>{item.text}</Typography>} />
              </ListItemButton>
            </ListItem>
          );
        })}
      </List>
      </Box>
    </>
  );

  return (
    <Box component="nav" sx={{ width: { md: DRAWER_WIDTH }, flexShrink: { md: 0 } }}>
      {/* Mobile Drawer */}
      <Drawer
        variant="temporary"
        open={mobileOpen}
        onClose={onClose}
        ModalProps={{ keepMounted: true }}
        sx={{
          display: { xs: 'block', md: 'none' },
          '& .MuiDrawer-paper': { boxSizing: 'border-box', width: DRAWER_WIDTH, backgroundColor: 'var(--bg-paper)', borderRight: '1px solid var(--border-color)' },
        }}
      >
        {drawerContent}
      </Drawer>
      
      {/* Desktop Drawer */}
      <Drawer
        variant="permanent"
        sx={{
          display: { xs: 'none', md: 'block' },
          '& .MuiDrawer-paper': { boxSizing: 'border-box', width: DRAWER_WIDTH, backgroundColor: 'var(--bg-paper)', borderRight: '1px solid var(--border-color)' },
        }}
        open
      >
        {drawerContent}
      </Drawer>
    </Box>
  );
};
