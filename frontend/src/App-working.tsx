import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import { Box, Typography, Button, Container, Paper } from '@mui/material';
import { Toaster } from 'react-hot-toast';
import theme from './theme/theme';

// Простая страница входа
const LoginPage: React.FC = () => {
  const handleLogin = async () => {
    try {
      const response = await fetch('http://localhost:5000/api/health');
      const data = await response.json();
      alert(`Backend работает: ${data.message}`);
    } catch (error) {
      alert('Ошибка подключения к backend');
    }
  };

  return (
    <Container maxWidth="sm" sx={{ mt: 8 }}>
      <Paper elevation={3} sx={{ p: 4, textAlign: 'center' }}>
        <Typography variant="h4" component="h1" gutterBottom>
          Литературный комитет
        </Typography>
        <Typography variant="body1" sx={{ mb: 3 }}>
          Система управления заказами литературы
        </Typography>
        <Button
          variant="contained"
          size="large"
          onClick={handleLogin}
          sx={{ mb: 2 }}
        >
          Проверить подключение к серверу
        </Button>
        <Typography variant="body2" color="text.secondary">
          Frontend: http://localhost:3000<br />
          Backend: http://localhost:5000
        </Typography>
      </Paper>
    </Container>
  );
};

// Главная страница
const DashboardPage: React.FC = () => {
  return (
    <Container maxWidth="lg" sx={{ mt: 4 }}>
      <Typography variant="h4" component="h1" gutterBottom>
        Панель управления
      </Typography>
      <Typography variant="body1">
        Добро пожаловать в систему управления литературным комитетом!
      </Typography>
    </Container>
  );
};

function App() {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Router>
        <Box sx={{ minHeight: '100vh', bgcolor: 'background.default' }}>
          <Routes>
            <Route path="/" element={<Navigate to="/login" replace />} />
            <Route path="/login" element={<LoginPage />} />
            <Route path="/dashboard" element={<DashboardPage />} />
          </Routes>
        </Box>
      </Router>
      <Toaster position="top-right" />
    </ThemeProvider>
  );
}

export default App;