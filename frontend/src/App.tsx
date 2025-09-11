// React import removed - not needed in React 17+ with new JSX transform
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import { ThemeProvider } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import { Toaster } from 'react-hot-toast';

import { theme } from '@/theme';
import { AuthProvider } from '@/contexts/AuthContext';
import { AuthGuard } from '@/components/auth/AuthGuard';
import { AppLayout } from '@/components/layout/AppLayout';
import { LoginPage } from '@/pages/LoginPage';
import { OrdersPage } from '@/pages/OrdersPage';
import { LiteraturePage } from '@/pages/LiteraturePage';
import { ReportsPage } from '@/pages/ReportsPage';
import { AdminPage } from '@/pages/AdminPage';
import { DashboardPage } from '@/pages/DashboardPage';
import { UserRole } from '@/types/auth';
import ErrorBoundary from '@/components/common/ErrorBoundary';
import NotificationProvider from '@/components/common/NotificationProvider';
import createQueryClient from '@/config/queryClient';

// Создаем оптимизированный клиент для React Query
const queryClient = createQueryClient();

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider theme={theme}>
        <CssBaseline />
        <ErrorBoundary>
          <NotificationProvider>
            <Router>
              <AuthProvider>
            <Routes>
              {/* Публичные маршруты */}
              <Route path="/login" element={<LoginPage />} />
              
              {/* Защищенные маршруты */}
              <Route path="/" element={
                <AuthGuard>
                  <AppLayout>
                    <Navigate to="/dashboard" replace />
                  </AppLayout>
                </AuthGuard>
              } />
              
              <Route path="/dashboard" element={
                <AuthGuard>
                  <AppLayout>
                    <DashboardPage />
                  </AppLayout>
                </AuthGuard>
              } />
              
              <Route path="/orders" element={
                <AuthGuard>
                  <AppLayout>
                    <OrdersPage />
                  </AppLayout>
                </AuthGuard>
              } />
              
              <Route path="/literature" element={
                <AuthGuard>
                  <AppLayout>
                    <LiteraturePage />
                  </AppLayout>
                </AuthGuard>
              } />
              
              <Route path="/reports" element={
                <AuthGuard>
                  <AppLayout>
                    <ReportsPage />
                  </AppLayout>
                </AuthGuard>
              } />
              
              <Route path="/admin" element={
                <AuthGuard requiredRoles={[UserRole.ADMIN, UserRole.REGION]}>
                  <AppLayout>
                    <AdminPage />
                  </AppLayout>
                </AuthGuard>
              } />
            </Routes>
          </AuthProvider>
        </Router>
      </NotificationProvider>
    </ErrorBoundary>
        <Toaster 
          position="top-right"
          toastOptions={{
            style: {
              borderRadius: '12px',
              background: theme.colors.neutral[800],
              color: '#fff',
            },
          }}
        />
        {process.env.NODE_ENV === 'development' && <ReactQueryDevtools initialIsOpen={false} />}
      </ThemeProvider>
    </QueryClientProvider>
  );
}

export default App;