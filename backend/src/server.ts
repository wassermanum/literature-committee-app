import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import compression from 'compression';
import dotenv from 'dotenv';
import authRoutes from './routes/authRoutes.js';
import userRoutes from './routes/userRoutes.js';
import organizationRoutes from './routes/organizationRoutes.js';
import literatureRoutes from './routes/literatureRoutes.js';
import inventoryRoutes from './routes/inventoryRoutes.js';
import orderRoutes from './routes/orderRoutes.js';
import transactionRoutes from './routes/transactionRoutes.js';
import reportRoutes from './routes/reportRoutes.js';

// Загружаем переменные окружения
dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(helmet());
app.use(cors());
app.use(compression());
app.use(morgan('combined'));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/organizations', organizationRoutes);
app.use('/api/literature', literatureRoutes);
app.use('/api/inventory', inventoryRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/transactions', transactionRoutes);
app.use('/api/reports', reportRoutes);

// Базовый маршрут для проверки работы сервера
app.get('/api/health', (_req, res) => {
  res.json({
    status: 'OK',
    message: 'Literature Committee API is running',
    timestamp: new Date().toISOString(),
  });
});

// Обработка 404
app.use('*', (req, res) => {
  res.status(404).json({
    error: 'Route not found',
    path: req.originalUrl,
  });
});

// Глобальная обработка ошибок
app.use((err: any, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  console.error('Error:', err);
  res.status(500).json({
    error: 'Internal server error',
    message: process.env.NODE_ENV === 'development' ? err.message : 'Something went wrong',
  });
});

// Запуск сервера только если файл запущен напрямую
if (process.env.NODE_ENV !== 'test') {
  app.listen(PORT, () => {
    console.log(`🚀 Server is running on port ${PORT}`);
    console.log(`📊 Health check: http://localhost:${PORT}/api/health`);
  });
}

export default app;