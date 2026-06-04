import React from 'react';
import { Drawer, List, ListItem, ListItemButton, ListItemIcon, ListItemText, Box, Toolbar, Typography, IconButton } from '@mui/material';
import MenuIcon from '@mui/icons-material/Menu';
import DashboardIcon from '@mui/icons-material/Dashboard';
import EventIcon from '@mui/icons-material/Event';
import PeopleIcon from '@mui/icons-material/People';
import ContentCutIcon from '@mui/icons-material/ContentCut';
import GroupIcon from '@mui/icons-material/Group';
import PaymentsIcon from '@mui/icons-material/Payments';
import { useNavigate, useLocation } from 'react-router-dom';

const DRAWER_WIDTH = 260;
const MINI_DRAWER_WIDTH = 72;

const menuItems = [
  { text: 'Dashboard', icon: <DashboardIcon />, path: '/' },
  { text: 'Appointments', icon: <EventIcon />, path: '/scheduler' },
  { text: 'Customers', icon: <PeopleIcon />, path: '/customers' },
  { text: 'Services', icon: <ContentCutIcon />, path: '/services' },
  { text: 'Staff', icon: <GroupIcon />, path: '/staff' },
  { text: 'Payments', icon: <PaymentsIcon />, path: '/payments' },
];

interface SidebarProps {
  mobileOpen: boolean;
  desktopOpen: boolean;
  onClose: () => void;
}

export const Sidebar = ({ mobileOpen, desktopOpen, onClose }: SidebarProps) => {
  const navigate = useNavigate();
  const location = useLocation();

  const currentWidth = desktopOpen ? DRAWER_WIDTH : MINI_DRAWER_WIDTH;

  const renderDrawerContent = (isExpanded: boolean) => (
    <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden' }}>
      <Toolbar sx={{ height: 'var(--header-height)', display: 'flex', alignItems: 'center', px: 2, justifyContent: isExpanded ? 'space-between' : 'center' }}>
        {isExpanded && (
          <Typography variant="h6" sx={{ fontWeight: 800, color: 'var(--primary-main)' }}>
            SalonPro
          </Typography>
        )}
        <IconButton onClick={onClose} sx={{ display: { xs: 'flex', md: 'flex' } }}>
          <MenuIcon />
        </IconButton>
      </Toolbar>
      <Box sx={{ overflowX: 'hidden', overflowY: 'auto', mt: 2, flexGrow: 1 }}>
      <List sx={{ px: 2 }}>
        {menuItems.map((item) => {
          const isActive = location.pathname === item.path;
          return (
            <ListItem key={item.text} disablePadding sx={{ mb: 1, display: 'block' }}>
              <ListItemButton
                onClick={() => {
                  navigate(item.path);
                  if (window.innerWidth < 900) onClose(); // Only close on mobile
                }}
                sx={{
                  minHeight: 48,
                  justifyContent: isExpanded ? 'initial' : 'center',
                  px: 2.5,
                  borderRadius: 'var(--border-radius)',
                  backgroundColor: isActive ? 'var(--primary-light)' : 'transparent',
                  color: isActive ? 'var(--primary-contrastText)' : 'var(--text-secondary)',
                  '&:hover': {
                    backgroundColor: isActive ? 'var(--primary-main)' : 'rgba(0,0,0,0.04)',
                    color: isActive ? 'var(--primary-contrastText)' : 'var(--primary-main)',
                  }
                }}
              >
                <ListItemIcon sx={{ color: 'inherit', minWidth: 0, mr: isExpanded ? 3 : 'auto', justifyContent: 'center' }}>
                  {item.icon}
                </ListItemIcon>
                <ListItemText primary={<Typography sx={{ fontWeight: isActive ? 600 : 500 }}>{item.text}</Typography>} sx={{ opacity: isExpanded ? 1 : 0 }} />
              </ListItemButton>
            </ListItem>
          );
        })}
      </List>
      </Box>
    </Box>
  );

  return (
    <Box component="nav" sx={{ width: { md: currentWidth }, flexShrink: { md: 0 }, transition: 'width 0.2s' }}>
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
        {renderDrawerContent(true)}
      </Drawer>
      
      {/* Desktop Drawer */}
      <Drawer
        variant="permanent"
        sx={{
          display: { xs: 'none', md: 'block' },
          width: currentWidth,
          flexShrink: 0,
          whiteSpace: 'nowrap',
          '& .MuiDrawer-paper': { 
            boxSizing: 'border-box', 
            width: currentWidth, 
            backgroundColor: 'var(--bg-paper)', 
            borderRight: '1px solid var(--border-color)',
            transition: 'width 0.2s',
            overflowX: 'hidden'
          },
        }}
        open
      >
        {renderDrawerContent(desktopOpen)}
      </Drawer>
    </Box>
  );
};
