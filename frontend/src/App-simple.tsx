// React import removed - not needed in React 17+ with new JSX transform
import { ThemeProvider } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import { Box, Typography, Button } from '@mui/material';
import theme from './theme/theme';

function App() {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Box
        sx={{
          minHeight: '100vh',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
          color: 'white',
          textAlign: 'center',
          p: 3,
        }}
      >
        <Typography variant="h2" component="h1" gutterBottom>
          Литературный комитет
        </Typography>
        <Typography variant="h5" component="h2" gutterBottom>
          Система управления заказами литературы
        </Typography>
        <Typography variant="body1" sx={{ mb: 4, maxWidth: 600 }}>
          Добро пожаловать в систему управления заказами литературы для региональной структуры обслуживания Сибирь сообщества Анонимные Наркоманы.
        </Typography>
        <Button
          variant="contained"
          size="large"
          sx={{
            background: 'rgba(255, 255, 255, 0.2)',
            backdropFilter: 'blur(10px)',
            border: '1px solid rgba(255, 255, 255, 0.3)',
            '&:hover': {
              background: 'rgba(255, 255, 255, 0.3)',
            },
          }}
        >
          Войти в систему
        </Button>
      </Box>
    </ThemeProvider>
  );
}

export default App;