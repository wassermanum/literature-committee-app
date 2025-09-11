import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import {
  Box,
  TextField,
  // Button, // Unused import
  Typography,
  // Paper, // Unused import
  InputAdornment,
  IconButton,
  Alert,
} from '@mui/material';
import {
  Email as EmailIcon,
  Lock as LockIcon,
  Visibility,
  VisibilityOff,
} from '@mui/icons-material';
import { useAuth } from '@/contexts/AuthContext';
import { LoginCredentials } from '@/types/auth';
import { GradientCard } from '@/components/ui/GradientCard';
import { GradientButton } from '@/components/ui/GradientButton';
import { AnimatedContainer } from '@/components/ui/AnimatedContainer';

// Схема валидации для формы входа
const loginSchema = yup.object({
  email: yup
    .string()
    .email('Введите корректный email адрес')
    .required('Email обязателен для заполнения'),
  password: yup
    .string()
    .min(6, 'Пароль должен содержать минимум 6 символов')
    .required('Пароль обязателен для заполнения'),
});

interface LoginFormProps {
  onSuccess?: () => void;
}

export const LoginForm: React.FC<LoginFormProps> = ({ onSuccess }) => {
  const { login, isLoading } = useAuth();
  const [showPassword, setShowPassword] = useState(false);
  const [loginError, setLoginError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginCredentials>({
    resolver: yupResolver(loginSchema),
    mode: 'onBlur',
  });

  const onSubmit = async (data: LoginCredentials) => {
    try {
      setLoginError(null);
      await login(data);
      onSuccess?.();
    } catch (error: any) {
      const errorMessage = error.response?.data?.message || 'Ошибка входа в систему';
      setLoginError(errorMessage);
    }
  };

  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };

  return (
    <AnimatedContainer>
      <Box
        sx={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          minHeight: '100vh',
          padding: 2,
        }}
      >
        <GradientCard
          sx={{
            width: '100%',
            maxWidth: 400,
            padding: 4,
          }}
        >
          <Box sx={{ textAlign: 'center', mb: 3 }}>
            <Typography
              variant="h4"
              component="h1"
              sx={{
                fontWeight: 'bold',
                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                backgroundClip: 'text',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                mb: 1,
              }}
            >
              Вход в систему
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Литературный комитет АН Сибирь
            </Typography>
          </Box>

          {loginError && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {loginError}
            </Alert>
          )}

          <Box component="form" onSubmit={handleSubmit(onSubmit)} noValidate>
            <TextField
              {...register('email')}
              fullWidth
              label="Email"
              type="email"
              autoComplete="email"
              autoFocus
              error={!!errors.email}
              helperText={errors.email?.message}
              sx={{ mb: 2 }}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <EmailIcon color="action" />
                  </InputAdornment>
                ),
              }}
            />

            <TextField
              {...register('password')}
              fullWidth
              label="Пароль"
              type={showPassword ? 'text' : 'password'}
              autoComplete="current-password"
              error={!!errors.password}
              helperText={errors.password?.message}
              sx={{ mb: 3 }}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <LockIcon color="action" />
                  </InputAdornment>
                ),
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton
                      aria-label="toggle password visibility"
                      onClick={togglePasswordVisibility}
                      edge="end"
                    >
                      {showPassword ? <VisibilityOff /> : <Visibility />}
                    </IconButton>
                  </InputAdornment>
                ),
              }}
            />

            <GradientButton
              type="submit"
              fullWidth
              size="large"
              disabled={isSubmitting || isLoading}
              sx={{ mb: 2 }}
            >
              {isSubmitting || isLoading ? 'Вход...' : 'Войти'}
            </GradientButton>
          </Box>

          <Box sx={{ textAlign: 'center', mt: 2 }}>
            <Typography variant="body2" color="text.secondary">
              Нет доступа к системе? Обратитесь к администратору
            </Typography>
          </Box>
        </GradientCard>
      </Box>
    </AnimatedContainer>
  );
};

export default LoginForm;