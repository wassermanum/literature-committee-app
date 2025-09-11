import React, { useState } from 'react';
import {
  Box,
  Typography,
  Avatar,
  Button,
  Divider,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
} from '@mui/material';
import {
  Person as PersonIcon,
  Email as EmailIcon,
  Business as BusinessIcon,
  AdminPanelSettings as AdminIcon,
  Group as GroupIcon,
  LocationCity as LocalityIcon,
  Public as RegionIcon,
  Logout as LogoutIcon,
  Settings as SettingsIcon,
} from '@mui/icons-material';
import { useAuth } from '../../contexts/AuthContext';
import { UserRole } from '../../types/auth';
import { GradientCard } from '../ui/GradientCard';
import { GradientButton } from '../ui/GradientButton';
import { format } from 'date-fns';
import { ru } from 'date-fns/locale';

interface UserProfileProps {
  compact?: boolean;
  showLogoutButton?: boolean;
}

export const UserProfile: React.FC<UserProfileProps> = ({
  compact = false,
  showLogoutButton = true,
}) => {
  const { user, logout } = useAuth();
  const [logoutDialogOpen, setLogoutDialogOpen] = useState(false);

  if (!user) {
    return null;
  }

  const handleLogoutClick = () => {
    setLogoutDialogOpen(true);
  };

  const handleLogoutConfirm = async () => {
    await logout();
    setLogoutDialogOpen(false);
  };

  const handleLogoutCancel = () => {
    setLogoutDialogOpen(false);
  };

  const getRoleIcon = (role: UserRole) => {
    switch (role) {
      case UserRole.ADMIN:
        return <AdminIcon />;
      case UserRole.REGION:
        return <RegionIcon />;
      case UserRole.LOCALITY:
        return <LocalityIcon />;
      case UserRole.LOCAL_SUBCOMMITTEE:
      case UserRole.GROUP:
        return <GroupIcon />;
      default:
        return <PersonIcon />;
    }
  };

  const getRoleDisplayName = (role: UserRole): string => {
    const roleNames: Record<UserRole, string> = {
      [UserRole.GROUP]: 'Группа',
      [UserRole.LOCAL_SUBCOMMITTEE]: 'Местный подкомитет',
      [UserRole.LOCALITY]: 'Местность',
      [UserRole.REGION]: 'Регион',
      [UserRole.ADMIN]: 'Администратор',
    };
    return roleNames[role] || role;
  };

  const getRoleColor = (role: UserRole) => {
    switch (role) {
      case UserRole.ADMIN:
        return 'error';
      case UserRole.REGION:
        return 'primary';
      case UserRole.LOCALITY:
        return 'secondary';
      case UserRole.LOCAL_SUBCOMMITTEE:
        return 'info';
      case UserRole.GROUP:
        return 'success';
      default:
        return 'default';
    }
  };

  const getInitials = (firstName: string, lastName: string): string => {
    return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase();
  };

  if (compact) {
    return (
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
        <Avatar
          sx={{
            width: 32,
            height: 32,
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
          }}
        >
          {getInitials(user.firstName, user.lastName)}
        </Avatar>
        <Box sx={{ minWidth: 0 }}>
          <Typography variant="body2" noWrap>
            {user.firstName} {user.lastName}
          </Typography>
          <Typography variant="caption" color="text.secondary" noWrap>
            {getRoleDisplayName(user.role)}
          </Typography>
        </Box>
      </Box>
    );
  }

  return (
    <>
      <GradientCard sx={{ maxWidth: 400, margin: 'auto' }}>
        <Box sx={{ textAlign: 'center', mb: 3 }}>
          <Avatar
            sx={{
              width: 80,
              height: 80,
              margin: '0 auto 16px',
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              fontSize: '2rem',
            }}
          >
            {getInitials(user.firstName, user.lastName)}
          </Avatar>
          <Typography variant="h5" gutterBottom>
            {user.firstName} {user.lastName}
          </Typography>
          <Chip
            icon={getRoleIcon(user.role)}
            label={getRoleDisplayName(user.role)}
            color={getRoleColor(user.role) as any}
            variant="outlined"
          />
        </Box>

        <Divider sx={{ mb: 2 }} />

        <List dense>
          <ListItem>
            <ListItemIcon>
              <EmailIcon />
            </ListItemIcon>
            <ListItemText
              primary="Email"
              secondary={user.email}
            />
          </ListItem>
          
          <ListItem>
            <ListItemIcon>
              <BusinessIcon />
            </ListItemIcon>
            <ListItemText
              primary="ID организации"
              secondary={user.organizationId}
            />
          </ListItem>

          <ListItem>
            <ListItemIcon>
              <SettingsIcon />
            </ListItemIcon>
            <ListItemText
              primary="Статус"
              secondary={user.isActive ? 'Активен' : 'Неактивен'}
            />
          </ListItem>

          <ListItem>
            <ListItemIcon>
              <PersonIcon />
            </ListItemIcon>
            <ListItemText
              primary="Дата регистрации"
              secondary={format(new Date(user.createdAt), 'dd MMMM yyyy', { locale: ru })}
            />
          </ListItem>
        </List>

        {showLogoutButton && (
          <>
            <Divider sx={{ my: 2 }} />
            <Box sx={{ textAlign: 'center' }}>
              <Button
                variant="outlined"
                color="error"
                startIcon={<LogoutIcon />}
                onClick={handleLogoutClick}
                fullWidth
              >
                Выйти из системы
              </Button>
            </Box>
          </>
        )}
      </GradientCard>

      {/* Диалог подтверждения выхода */}
      <Dialog
        open={logoutDialogOpen}
        onClose={handleLogoutCancel}
        maxWidth="xs"
        fullWidth
      >
        <DialogTitle>Подтверждение выхода</DialogTitle>
        <DialogContent>
          <Typography>
            Вы уверены, что хотите выйти из системы?
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleLogoutCancel}>
            Отмена
          </Button>
          <GradientButton onClick={handleLogoutConfirm} autoFocus>
            Выйти
          </GradientButton>
        </DialogActions>
      </Dialog>
    </>
  );
};

export default UserProfile;