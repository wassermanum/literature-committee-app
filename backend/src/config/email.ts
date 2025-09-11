import nodemailer from 'nodemailer';
import { logger } from '../utils/logger.js';

// Email configuration
export interface EmailConfig {
  host: string;
  port: number;
  secure: boolean;
  auth: {
    user: string;
    pass: string;
  };
}

// Create email transporter
export function createEmailTransporter(): nodemailer.Transporter {
  // Если email отключен для разработки, создаем тестовый транспортер
  if (process.env.DISABLE_EMAIL_NOTIFICATIONS === 'true' || !process.env.SMTP_HOST) {
    logger.info('Email notifications disabled for development');
    return nodemailer.createTransport({
      streamTransport: true,
      newline: 'unix',
      buffer: true
    });
  }

  const config: EmailConfig = {
    host: process.env.SMTP_HOST,
    port: parseInt(process.env.SMTP_PORT || '587'),
    secure: process.env.SMTP_PORT === '465', // true for 465, false for other ports
    auth: {
      user: process.env.SMTP_USER || '',
      pass: process.env.SMTP_PASS || ''
    }
  };

  const transporter = nodemailer.createTransport(config);

  // Verify connection configuration only if not disabled
  transporter.verify((error: any) => {
    if (error) {
      logger.error('Email transporter verification failed:', error);
    } else {
      logger.info('Email transporter is ready to send messages');
    }
  });

  return transporter;
}

// Default email settings
export const emailDefaults = {
  from: process.env.SMTP_USER || 'noreply@literature-committee.org',
  replyTo: process.env.SMTP_USER || 'noreply@literature-committee.org'
};

// Email templates configuration
export const emailTemplateConfig = {
  baseUrl: process.env.BASE_URL || 'http://localhost:3000',
  logoUrl: process.env.LOGO_URL || '',
  supportEmail: process.env.SUPPORT_EMAIL || process.env.SMTP_USER || 'support@literature-committee.org'
};