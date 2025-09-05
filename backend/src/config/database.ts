import { PrismaClient } from '@prisma/client';
import { logger } from '../utils/logger.js';

// Prisma client configuration
const prisma = new PrismaClient({
  log: [
    {
      emit: 'event',
      level: 'query',
    },
    {
      emit: 'event',
      level: 'error',
    },
    {
      emit: 'event',
      level: 'info',
    },
    {
      emit: 'event',
      level: 'warn',
    },
  ],
});

// Log database queries in development
if (process.env.NODE_ENV === 'development') {
  prisma.$on('query', (e) => {
    logger.debug('Query: ' + e.query);
    logger.debug('Params: ' + e.params);
    logger.debug('Duration: ' + e.duration + 'ms');
  });
}

// Log database errors
prisma.$on('error', (e) => {
  logger.error('Database error:', e);
});

// Log database info
prisma.$on('info', (e) => {
  logger.info('Database info:', e.message);
});

// Log database warnings
prisma.$on('warn', (e) => {
  logger.warn('Database warning:', e.message);
});

// Graceful shutdown
process.on('beforeExit', async () => {
  logger.info('Disconnecting from database...');
  await prisma.$disconnect();
});

process.on('SIGINT', async () => {
  logger.info('Received SIGINT, disconnecting from database...');
  await prisma.$disconnect();
  process.exit(0);
});

process.on('SIGTERM', async () => {
  logger.info('Received SIGTERM, disconnecting from database...');
  await prisma.$disconnect();
  process.exit(0);
});

export { prisma };

// Database connection health check
export async function checkDatabaseConnection(): Promise<boolean> {
  try {
    await prisma.$queryRaw`SELECT 1`;
    logger.info('Database connection successful');
    return true;
  } catch (error) {
    logger.error('Database connection failed:', error);
    return false;
  }
}

// Database migration status check
export async function checkMigrationStatus(): Promise<boolean> {
  try {
    // Try to query a table that should exist after migrations
    await prisma.user.findFirst();
    logger.info('Database migrations are up to date');
    return true;
  } catch (error) {
    logger.warn('Database migrations may not be applied:', error);
    return false;
  }
}

// Initialize database connection
export async function initializeDatabase(): Promise<void> {
  try {
    logger.info('Initializing database connection...');
    
    const isConnected = await checkDatabaseConnection();
    if (!isConnected) {
      throw new Error('Failed to connect to database');
    }

    const migrationsApplied = await checkMigrationStatus();
    if (!migrationsApplied) {
      logger.warn('Database migrations may not be applied. Please run: npm run db:migrate');
    }

    logger.info('Database initialized successfully');
  } catch (error) {
    logger.error('Failed to initialize database:', error);
    throw error;
  }
}