import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ThemeProvider } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import { Toaster } from 'react-hot-toast';

import theme from './theme/theme';
import { AppLayout } from './components/layout/AppLayout';
import { OrdersPage } from './pages/OrdersPage';
import { LiteraturePage } from './pages/LiteraturePage';
import { ReportsPage } from './pages/ReportsPage';
import { AdminPage } from './pages/AdminPage';
import { DashboardPage } from './pages/DashboardPage';

// Создаем клиент для React Query
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider theme={theme}>
        <CssBaseline />
        <Router>
          <AppLayout>
            <Routes>
              <Route path="/" element={<Navigate to="/dashboard" replace />} />
              <Route path="/dashboard" element={<DashboardPage />} />
              <Route path="/orders" element={<OrdersPage />} />
              <Route path="/literature" element={<LiteraturePage />} />
              <Route path="/reports" element={<ReportsPage />} />
              <Route path="/admin" element={<AdminPage />} />
            </Routes>
          </AppLayout>
        </Router>
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
      </ThemeProvider>
    </QueryClientProvider>
  );
}

export default App;