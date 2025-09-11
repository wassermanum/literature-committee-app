import React from 'react';
import { Navigate } from 'react-router-dom';
import { Box } from '@mui/material';
import { LoginForm } from '@/components/auth/LoginForm';
import { useAuth } from '@/contexts/AuthContext';

export const LoginPage: React.FC = () => {
  const { isAuthenticated } = useAuth();

  // Если пользователь уже аутентифицирован, перенаправляем на главную страницу
  if (isAuthenticated) {
    return <Navigate to="/dashboard" replace />;
  }

  return (
    <Box
      sx={{
        minHeight: '100vh',
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <LoginForm onSuccess={() => {
        // Перенаправление будет обработано автоматически через Navigate выше
      }} />
    </Box>
  );
};

export default LoginPage;