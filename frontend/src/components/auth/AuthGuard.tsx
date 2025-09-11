import { ReactNode } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { Box, Typography } from '@mui/material';
import { useAuth } from '../../contexts/AuthContext';
import { UserRole } from '../../types/auth';
import { LoadingSpinner } from '../ui/LoadingSpinner';

interface AuthGuardProps {
  children: ReactNode;
  requiredRoles?: UserRole[];
  fallbackPath?: string;
}

export const AuthGuard: React.FC<AuthGuardProps> = ({
  children,
  requiredRoles = [],
  fallbackPath = '/login',
}) => {
  const { user, isAuthenticated, isLoading } = useAuth();
  const location = useLocation();

  // Показываем загрузку пока проверяется аутентификация
  if (isLoading) {
    return (
      <Box
        sx={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          minHeight: '100vh',
          gap: 2,
        }}
      >
        <LoadingSpinner size={60} />
        <Typography variant="body1" color="text.secondary">
          Проверка аутентификации...
        </Typography>
      </Box>
    );
  }

  // Если пользователь не аутентифицирован, перенаправляем на страницу входа
  if (!isAuthenticated || !user) {
    return (
      <Navigate
        to={fallbackPath}
        state={{ from: location }}
        replace
      />
    );
  }

  // Проверяем роли, если они указаны
  if (requiredRoles.length > 0 && !requiredRoles.includes(user.role)) {
    return (
      <Box
        sx={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          minHeight: '100vh',
          padding: 3,
          textAlign: 'center',
        }}
      >
        <Typography variant="h5" color="error" gutterBottom>
          Доступ запрещен
        </Typography>
        <Typography variant="body1" color="text.secondary" sx={{ mb: 2 }}>
          У вас недостаточно прав для доступа к этой странице.
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Ваша роль: <strong>{getRoleDisplayName(user.role)}</strong>
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Требуемые роли: <strong>{requiredRoles.map(getRoleDisplayName).join(', ')}</strong>
        </Typography>
      </Box>
    );
  }

  // Если все проверки пройдены, отображаем дочерние компоненты
  return <>{children}</>;
};

// Утилитарная функция для получения отображаемого имени роли
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

// Компонент для защиты маршрутов с проверкой конкретных ролей
interface RoleGuardProps {
  children: ReactNode;
  allowedRoles: UserRole[];
  fallbackComponent?: ReactNode;
}

export const RoleGuard: React.FC<RoleGuardProps> = ({
  children,
  allowedRoles,
  fallbackComponent,
}) => {
  const { user } = useAuth();

  if (!user || !allowedRoles.includes(user.role)) {
    if (fallbackComponent) {
      return <>{fallbackComponent}</>;
    }

    return (
      <Box
        sx={{
          padding: 2,
          textAlign: 'center',
          backgroundColor: 'background.paper',
          borderRadius: 1,
          border: '1px solid',
          borderColor: 'divider',
        }}
      >
        <Typography variant="body2" color="text.secondary">
          Эта функция недоступна для вашей роли
        </Typography>
      </Box>
    );
  }

  return <>{children}</>;
};

export default AuthGuard;