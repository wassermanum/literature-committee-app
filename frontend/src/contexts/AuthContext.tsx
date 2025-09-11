import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { User, LoginCredentials, AuthContextType } from '@/types/auth';
import { authService } from '@/services/authService';
import toast from 'react-hot-toast';

const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Проверяем аутентификацию при загрузке приложения
  useEffect(() => {
    const initializeAuth = async () => {
      try {
        const storedUser = authService.getStoredUser();
        const storedToken = authService.getStoredToken();

        if (storedUser && storedToken) {
          // Проверяем валидность токена, запросив профиль пользователя
          try {
            const currentUser = await authService.getProfile();
            setUser(currentUser);
          } catch (error) {
            // Если токен недействителен, очищаем данные
            authService.clearAuthData();
            setUser(null);
          }
        }
      } catch (error) {
        console.error('Auth initialization error:', error);
        authService.clearAuthData();
        setUser(null);
      } finally {
        setIsLoading(false);
      }
    };

    initializeAuth();
  }, []);

  const login = async (credentials: LoginCredentials): Promise<void> => {
    try {
      setIsLoading(true);
      const authData = await authService.login(credentials);
      
      // Сохраняем данные аутентификации
      authService.storeAuthData(authData);
      setUser(authData.user);
      
      toast.success(`Добро пожаловать, ${authData.user.firstName}!`);
    } catch (error: any) {
      const errorMessage = error.response?.data?.message || 'Ошибка входа в систему';
      toast.error(errorMessage);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async (): Promise<void> => {
    try {
      setIsLoading(true);
      await authService.logout();
      setUser(null);
      toast.success('Вы успешно вышли из системы');
    } catch (error) {
      console.error('Logout error:', error);
      // Даже если запрос logout не удался, очищаем локальное состояние
      authService.clearAuthData();
      setUser(null);
    } finally {
      setIsLoading(false);
    }
  };

  const refreshToken = async (): Promise<void> => {
    try {
      const newToken = await authService.refreshToken();
      localStorage.setItem('accessToken', newToken);
    } catch (error) {
      console.error('Token refresh error:', error);
      // Если обновление токена не удалось, выходим из системы
      await logout();
      throw error;
    }
  };

  const value: AuthContextType = {
    user,
    isAuthenticated: !!user,
    isLoading,
    login,
    logout,
    refreshToken,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

// Хук для использования контекста аутентификации
export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export default AuthContext;