import request from 'supertest';
import express from 'express';
import notificationRoutes from '../routes/notifications.js';
import { NotificationService } from '../services/notificationService.js';
import { ScheduledNotificationService } from '../services/scheduledNotificationService.js';

// Mock dependencies
jest.mock('../services/notificationService.js');
jest.mock('../services/scheduledNotificationService.js');
jest.mock('../middleware/auth.js', () => ({
  authenticate: (req: any, _res: any, next: any) => {
    req.user = { id: 'user1', role: 'ADMIN', organizationId: 'org1' };
    next();
  }
}));
jest.mock('../utils/logger.js');

const mockNotificationService = {
  notifyOrderCreated: jest.fn(),
  notifyOrderStatusChanged: jest.fn(),
  notifyLowInventory: jest.fn(),
  sendNotification: jest.fn(),
} as any;

const mockScheduledService = {
  triggerOrderReminders: jest.fn(),
  triggerLowInventoryCheck: jest.fn(),
  getStatus: jest.fn(),
} as any;

// Mock service constructors
(NotificationService as jest.MockedClass<typeof NotificationService>).mockImplementation(() => mockNotificationService);
(ScheduledNotificationService as jest.MockedClass<typeof ScheduledNotificationService>).mockImplementation(() => mockScheduledService);

describe('Notification Routes', () => {
  let app: express.Application;

  beforeEach(() => {
    jest.clearAllMocks();
    app = express();
    app.use(express.json());
    app.use('/api/notifications', notificationRoutes);
  });

  describe('POST /api/notifications/orders/:orderId/created', () => {
    it('should send order created notification successfully', async () => {
      const mockResult = {
        success: true,
        messageId: 'test-message-id',
        sentAt: new Date(),
        channel: 'EMAIL',
        recipientCount: 1
      };

      mockNotificationService.notifyOrderCreated.mockResolvedValue(mockResult);

      const response = await request(app)
        .post('/api/notifications/orders/order123/created')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe('Order creation notification sent successfully');
      expect(response.body.result).toEqual(mockResult);
      expect(mockNotificationService.notifyOrderCreated).toHaveBeenCalledWith('order123');
    });

    it('should handle notification failure', async () => {
      const mockResult = {
        success: false,
        error: 'Email sending failed',
        sentAt: new Date(),
        channel: 'EMAIL',
        recipientCount: 1
      };

      mockNotificationService.notifyOrderCreated.mockResolvedValue(mockResult);

      const response = await request(app)
        .post('/api/notifications/orders/order123/created')
        .expect(500);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Failed to send order creation notification');
      expect(response.body.error).toBe('Email sending failed');
    });

    it('should handle service errors', async () => {
      mockNotificationService.notifyOrderCreated.mockRejectedValue(new Error('Service error'));

      const response = await request(app)
        .post('/api/notifications/orders/order123/created')
        .expect(500);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Internal server error');
      expect(response.body.error).toBe('Service error');
    });
  });

  describe('POST /api/notifications/orders/:orderId/status-changed', () => {
    it('should send order status changed notification successfully', async () => {
      const mockResult = {
        success: true,
        messageId: 'test-message-id',
        sentAt: new Date(),
        channel: 'EMAIL',
        recipientCount: 2
      };

      mockNotificationService.notifyOrderStatusChanged.mockResolvedValue(mockResult);

      const response = await request(app)
        .post('/api/notifications/orders/order123/status-changed')
        .send({ previousStatus: 'PENDING' })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe('Order status change notification sent successfully');
      expect(mockNotificationService.notifyOrderStatusChanged).toHaveBeenCalledWith('order123', 'PENDING');
    });

    it('should require previousStatus parameter', async () => {
      const response = await request(app)
        .post('/api/notifications/orders/order123/status-changed')
        .send({})
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Previous status is required');
    });
  });

  describe('POST /api/notifications/inventory/low-stock', () => {
    it('should send low inventory notification successfully', async () => {
      const mockResult = {
        success: true,
        messageId: 'test-message-id',
        sentAt: new Date(),
        channel: 'EMAIL',
        recipientCount: 1
      };

      mockNotificationService.notifyLowInventory.mockResolvedValue(mockResult);

      const response = await request(app)
        .post('/api/notifications/inventory/low-stock')
        .send({
          organizationId: 'org1',
          literatureId: 'lit1',
          threshold: 5
        })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe('Low inventory notification sent successfully');
      expect(mockNotificationService.notifyLowInventory).toHaveBeenCalledWith('org1', 'lit1', 5);
    });

    it('should use default threshold if not provided', async () => {
      const mockResult = {
        success: true,
        messageId: 'test-message-id',
        sentAt: new Date(),
        channel: 'EMAIL',
        recipientCount: 1
      };

      mockNotificationService.notifyLowInventory.mockResolvedValue(mockResult);

      const response = await request(app)
        .post('/api/notifications/inventory/low-stock')
        .send({
          organizationId: 'org1',
          literatureId: 'lit1'
        })
        .expect(200);

      expect(mockNotificationService.notifyLowInventory).toHaveBeenCalledWith('org1', 'lit1', 10);
    });

    it('should require organizationId and literatureId', async () => {
      const response = await request(app)
        .post('/api/notifications/inventory/low-stock')
        .send({ organizationId: 'org1' })
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Organization ID and Literature ID are required');
    });
  });

  describe('POST /api/notifications/scheduled/order-reminders/trigger', () => {
    it('should trigger order reminders successfully', async () => {
      mockScheduledService.triggerOrderReminders.mockResolvedValue(undefined);

      const response = await request(app)
        .post('/api/notifications/scheduled/order-reminders/trigger')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe('Order reminders triggered successfully');
      expect(mockScheduledService.triggerOrderReminders).toHaveBeenCalled();
    });

    it('should handle trigger errors', async () => {
      mockScheduledService.triggerOrderReminders.mockRejectedValue(new Error('Trigger failed'));

      const response = await request(app)
        .post('/api/notifications/scheduled/order-reminders/trigger')
        .expect(500);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Failed to trigger order reminders');
      expect(response.body.error).toBe('Trigger failed');
    });
  });

  describe('POST /api/notifications/scheduled/low-inventory/trigger', () => {
    it('should trigger low inventory check successfully', async () => {
      mockScheduledService.triggerLowInventoryCheck.mockResolvedValue(undefined);

      const response = await request(app)
        .post('/api/notifications/scheduled/low-inventory/trigger')
        .send({ threshold: 15 })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe('Low inventory check triggered successfully');
      expect(mockScheduledService.triggerLowInventoryCheck).toHaveBeenCalledWith(15);
    });

    it('should work without threshold parameter', async () => {
      mockScheduledService.triggerLowInventoryCheck.mockResolvedValue(undefined);

      const response = await request(app)
        .post('/api/notifications/scheduled/low-inventory/trigger')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(mockScheduledService.triggerLowInventoryCheck).toHaveBeenCalledWith(undefined);
    });
  });

  describe('GET /api/notifications/scheduled/status', () => {
    it('should return scheduled service status', async () => {
      const mockStatus = {
        orderReminders: true,
        lowInventoryCheck: false
      };

      mockScheduledService.getStatus.mockReturnValue(mockStatus);

      const response = await request(app)
        .get('/api/notifications/scheduled/status')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.status).toEqual(mockStatus);
      expect(mockScheduledService.getStatus).toHaveBeenCalled();
    });
  });

  describe('Development test endpoint', () => {
    beforeEach(() => {
      process.env.NODE_ENV = 'development';
    });

    afterEach(() => {
      delete process.env.NODE_ENV;
    });

    it('should send test email in development mode', async () => {
      const mockResult = {
        success: true,
        messageId: 'test-message-id',
        sentAt: new Date(),
        channel: 'EMAIL',
        recipientCount: 1
      };

      mockNotificationService.sendNotification.mockResolvedValue(mockResult);

      const response = await request(app)
        .post('/api/notifications/test/email')
        .send({
          to: 'test@example.com',
          subject: 'Test Subject',
          message: 'Test Message'
        })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe('Test email sent successfully');
      expect(mockNotificationService.sendNotification).toHaveBeenCalledWith({
        type: 'SYSTEM_ALERT',
        recipients: [{
          id: 'test',
          email: 'test@example.com',
          firstName: 'Test',
          lastName: 'User',
          role: 'ADMIN',
          organizationId: 'test'
        }],
        subject: 'Test Subject',
        message: 'Test Message',
        channel: 'EMAIL',
        priority: 'MEDIUM'
      });
    });

    it('should require all parameters for test email', async () => {
      const response = await request(app)
        .post('/api/notifications/test/email')
        .send({
          to: 'test@example.com',
          subject: 'Test Subject'
          // missing message
        })
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('to, subject, and message are required');
    });
  });
});