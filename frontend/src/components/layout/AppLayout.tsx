import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  AppBar,
  Toolbar,
  Typography,
  Drawer,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  IconButton,
  Box,
  Avatar,
  Menu,
  MenuItem,
  Divider,
  useTheme,
  alpha,
  Dialog,
  DialogTitle,
  DialogContent,
} from '@mui/material';
import {
  Menu as MenuIcon,
  Dashboard,
  ShoppingCart,
  Inventory,
  Assessment,
  People,
  // Settings, // Unused import
  AccountCircle,
  Logout,
} from '@mui/icons-material';
import { SmoothScrollContainer } from '../ui';
import { useAuth } from '../../contexts/AuthContext';
import { UserProfile } from '../auth';
import { UserRole } from '../../types/auth';

interface AppLayoutProps {
  children: React.ReactNode;
}

const drawerWidth = 280;

const menuItems = [
  { text: 'Панель управления', icon: <Dashboard />, path: '/dashboard' },
  { text: 'Заказы', icon: <ShoppingCart />, path: '/orders' },
  { text: 'Каталог литературы', icon: <Inventory />, path: '/literature' },
  { text: 'Отчеты', icon: <Assessment />, path: '/reports' },
  { 
    text: 'Администрирование', 
    icon: <People />, 
    path: '/admin',
    requiredRoles: [UserRole.ADMIN, UserRole.REGION]
  },
];

export const AppLayout: React.FC<AppLayoutProps> = ({ children }) => {
  const theme = useTheme();
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout } = useAuth();
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [profileDialogOpen, setProfileDialogOpen] = useState(false);

  const handleDrawerToggle = () => {
    setDrawerOpen(!drawerOpen);
  };

  const handleProfileMenuOpen = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleProfileMenuClose = () => {
    setAnchorEl(null);
  };

  const handleProfileClick = () => {
    setProfileDialogOpen(true);
    handleProfileMenuClose();
  };

  const handleLogoutClick = async () => {
    await logout();
    handleProfileMenuClose();
  };

  const handleMenuItemClick = (path: string) => {
    navigate(path);
    setDrawerOpen(false);
  };

  const getInitials = (firstName: string, lastName: string): string => {
    return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase();
  };

  const isActivePath = (path: string): boolean => {
    return location.pathname === path;
  };

  return (
    <Box sx={{ display: 'flex', minHeight: '100vh' }}>
      {/* App Bar */}
      <AppBar
        position="fixed"
        sx={{
          zIndex: theme.zIndex.drawer + 1,
          background: theme.colors.gradients.neutral,
        }}
      >
        <Toolbar>
          <IconButton
            color="inherit"
            aria-label="open drawer"
            edge="start"
            onClick={handleDrawerToggle}
            sx={{ mr: 2 }}
          >
            <MenuIcon />
          </IconButton>
          <Typography variant="h6" noWrap component="div" sx={{ flexGrow: 1 }}>
            Литературный комитет
          </Typography>
          <IconButton
            size="large"
            edge="end"
            aria-label="account of current user"
            aria-controls="profile-menu"
            aria-haspopup="true"
            onClick={handleProfileMenuOpen}
            color="inherit"
          >
            <Avatar 
              sx={{ 
                width: 32, 
                height: 32, 
                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              }}
            >
              {user ? getInitials(user.firstName, user.lastName) : 'U'}
            </Avatar>
          </IconButton>
          <Menu
            id="profile-menu"
            anchorEl={anchorEl}
            open={Boolean(anchorEl)}
            onClose={handleProfileMenuClose}
            PaperProps={{
              sx: {
                borderRadius: 2,
                mt: 1,
                minWidth: 200,
              },
            }}
          >
            <MenuItem onClick={handleProfileClick}>
              <ListItemIcon>
                <AccountCircle fontSize="small" />
              </ListItemIcon>
              Профиль
            </MenuItem>
            <Divider />
            <MenuItem onClick={handleLogoutClick}>
              <ListItemIcon>
                <Logout fontSize="small" />
              </ListItemIcon>
              Выйти
            </MenuItem>
          </Menu>
        </Toolbar>
      </AppBar>

      {/* Drawer */}
      <Drawer
        variant="temporary"
        open={drawerOpen}
        onClose={handleDrawerToggle}
        ModalProps={{
          keepMounted: true,
        }}
        sx={{
          '& .MuiDrawer-paper': {
            width: drawerWidth,
            boxSizing: 'border-box',
            background: `linear-gradient(180deg, ${alpha(
              theme.colors.primary[50],
              0.8
            )} 0%, ${alpha(theme.colors.brown[50], 0.8)} 100%)`,
            backdropFilter: 'blur(10px)',
          },
        }}
      >
        <Toolbar />
        <Box sx={{ overflow: 'auto', p: 2 }}>
          <List>
            {menuItems.map((item) => {
              // Проверяем права доступа к пункту меню
              if (item.requiredRoles && user && !item.requiredRoles.includes(user.role)) {
                return null;
              }

              const isActive = isActivePath(item.path);

              return (
                <ListItem
                  key={item.text}
                  onClick={() => handleMenuItemClick(item.path)}
                  sx={{
                    borderRadius: 2,
                    mb: 1,
                    cursor: 'pointer',
                    transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                    background: isActive 
                      ? alpha(theme.colors.primary[500], 0.15)
                      : 'transparent',
                    '&:hover': {
                      background: alpha(theme.colors.primary[500], 0.1),
                      transform: 'translateX(4px)',
                    },
                  }}
                >
                  <ListItemIcon
                    sx={{
                      color: isActive 
                        ? theme.colors.primary[600] 
                        : theme.colors.neutral[600],
                      minWidth: 40,
                    }}
                  >
                    {item.icon}
                  </ListItemIcon>
                  <ListItemText
                    primary={item.text}
                    sx={{
                      '& .MuiListItemText-primary': {
                        fontWeight: isActive ? 600 : 500,
                        color: isActive 
                          ? theme.colors.primary[700]
                          : theme.colors.neutral[700],
                      },
                    }}
                  />
                </ListItem>
              );
            })}
          </List>
        </Box>
      </Drawer>

      {/* Main content */}
      <Box
        component="main"
        sx={{
          flexGrow: 1,
          bgcolor: 'background.default',
          minHeight: '100vh',
        }}
      >
        <Toolbar />
        <SmoothScrollContainer
          sx={{
            height: 'calc(100vh - 64px)',
            overflow: 'auto',
            p: 3,
          }}
        >
          {children}
        </SmoothScrollContainer>
      </Box>

      {/* Диалог профиля пользователя */}
      <Dialog
        open={profileDialogOpen}
        onClose={() => setProfileDialogOpen(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Профиль пользователя</DialogTitle>
        <DialogContent>
          <UserProfile showLogoutButton={false} />
        </DialogContent>
      </Dialog>
    </Box>
  );
};