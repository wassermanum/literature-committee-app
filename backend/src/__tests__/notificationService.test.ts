import { NotificationService } from '../services/notificationService.js';
import { NotificationTemplateService } from '../services/notificationTemplateService.js';
import { 
  NotificationType, 
  NotificationChannel, 
  NotificationPriority 
} from '../types/notification.js';

// Mock dependencies
jest.mock('nodemailer');
jest.mock('../config/email.js');
jest.mock('../utils/logger.js');

const mockPrisma = {
  order: {
    findUnique: jest.fn(),
    findMany: jest.fn(),
  },
  user: {
    findMany: jest.fn(),
  },
  organization: {
    findUnique: jest.fn(),
  },
  inventory: {
    findUnique: jest.fn(),
    findMany: jest.fn(),
  },
} as any;

// Mock nodemailer
const mockSendMail = jest.fn();
jest.mock('../config/email.js', () => ({
  createEmailTransporter: () => ({
    sendMail: mockSendMail,
  }),
  emailDefaults: {
    from: 'test@example.com',
    replyTo: 'test@example.com',
  },
  emailTemplateConfig: {
    baseUrl: 'http://localhost:3000',
    logoUrl: '',
    supportEmail: 'support@test.com'
  }
}));

describe('NotificationService', () => {
  let notificationService: NotificationService;
  beforeEach(() => {
    jest.clearAllMocks();
    notificationService = new NotificationService(mockPrisma);
  });

  describe('sendNotification', () => {
    it('should send email notification successfully', async () => {
      mockSendMail.mockResolvedValue({ messageId: 'test-message-id' });

      const notificationData = {
        type: NotificationType.ORDER_CREATED,
        recipients: [{
          id: 'user1',
          email: 'test@example.com',
          firstName: 'Test',
          lastName: 'User',
          role: 'GROUP',
          organizationId: 'org1'
        }],
        subject: 'Test Subject',
        message: 'Test Message',
        htmlMessage: '<p>Test HTML Message</p>',
        channel: NotificationChannel.EMAIL,
        priority: NotificationPriority.MEDIUM
      };

      const result = await notificationService.sendNotification(notificationData);

      expect(result.success).toBe(true);
      expect(result.messageId).toBe('test-message-id');
      expect(result.channel).toBe(NotificationChannel.EMAIL);
      expect(result.recipientCount).toBe(1);
      expect(mockSendMail).toHaveBeenCalledWith({
        from: 'test@example.com',
        to: ['test@example.com'],
        subject: 'Test Subject',
        text: 'Test Message',
        html: '<p>Test HTML Message</p>',
        replyTo: 'test@example.com'
      });
    });

    it('should handle email sending failure', async () => {
      mockSendMail.mockRejectedValue(new Error('SMTP Error'));

      const notificationData = {
        type: NotificationType.ORDER_CREATED,
        recipients: [{
          id: 'user1',
          email: 'test@example.com',
          firstName: 'Test',
          lastName: 'User',
          role: 'GROUP',
          organizationId: 'org1'
        }],
        subject: 'Test Subject',
        message: 'Test Message',
        channel: NotificationChannel.EMAIL,
        priority: NotificationPriority.MEDIUM
      };

      const result = await notificationService.sendNotification(notificationData);

      expect(result.success).toBe(false);
      expect(result.error).toBe('SMTP Error');
      expect(result.channel).toBe(NotificationChannel.EMAIL);
    });

    it('should send internal notification successfully', async () => {
      const notificationData = {
        type: NotificationType.ORDER_CREATED,
        recipients: [{
          id: 'user1',
          email: 'test@example.com',
          firstName: 'Test',
          lastName: 'User',
          role: 'GROUP',
          organizationId: 'org1'
        }],
        subject: 'Test Subject',
        message: 'Test Message',
        channel: NotificationChannel.INTERNAL,
        priority: NotificationPriority.MEDIUM
      };

      const result = await notificationService.sendNotification(notificationData);

      expect(result.success).toBe(true);
      expect(result.channel).toBe(NotificationChannel.INTERNAL);
      expect(result.recipientCount).toBe(1);
    });

    it('should send both email and internal notifications', async () => {
      mockSendMail.mockResolvedValue({ messageId: 'test-message-id' });

      const notificationData = {
        type: NotificationType.ORDER_CREATED,
        recipients: [{
          id: 'user1',
          email: 'test@example.com',
          firstName: 'Test',
          lastName: 'User',
          role: 'GROUP',
          organizationId: 'org1'
        }],
        subject: 'Test Subject',
        message: 'Test Message',
        htmlMessage: '<p>Test HTML Message</p>',
        channel: NotificationChannel.BOTH,
        priority: NotificationPriority.MEDIUM
      };

      const result = await notificationService.sendNotification(notificationData);

      expect(result.success).toBe(true);
      expect(result.channel).toBe(NotificationChannel.BOTH);
      expect(mockSendMail).toHaveBeenCalled();
    });
  });

  describe('notifyOrderCreated', () => {
    it('should send order created notification', async () => {
      const mockOrder = {
        id: 'order1',
        orderNumber: 'ORD-001',
        fromOrganizationId: 'org1',
        toOrganizationId: 'org2',
        totalAmount: 1000,
        notes: 'Test order',
        createdAt: new Date(),
        fromOrganization: { name: 'Group A' },
        toOrganization: { name: 'Locality B' },
        items: [{
          literature: { title: 'Book 1' },
          quantity: 2,
          unitPrice: 500
        }]
      };

      const mockUsers = [{
        id: 'user1',
        email: 'test@example.com',
        firstName: 'Test',
        lastName: 'User',
        role: 'LOCALITY',
        organizationId: 'org2'
      }];

      mockPrisma.order.findUnique.mockResolvedValue(mockOrder);
      mockPrisma.user.findMany.mockResolvedValue(mockUsers);
      mockSendMail.mockResolvedValue({ messageId: 'test-message-id' });

      const result = await notificationService.notifyOrderCreated('order1');

      expect(result.success).toBe(true);
      expect(mockPrisma.order.findUnique).toHaveBeenCalledWith({
        where: { id: 'order1' },
        include: {
          fromOrganization: true,
          toOrganization: true,
          items: {
            include: {
              literature: true
            }
          }
        }
      });
      expect(mockPrisma.user.findMany).toHaveBeenCalledWith({
        where: {
          organizationId: 'org2',
          isActive: true
        },
        include: {
          organization: true
        }
      });
    });

    it('should throw error if order not found', async () => {
      mockPrisma.order.findUnique.mockResolvedValue(null);

      await expect(notificationService.notifyOrderCreated('nonexistent'))
        .rejects.toThrow('Order not found: nonexistent');
    });
  });

  describe('notifyOrderStatusChanged', () => {
    it('should send order status changed notification', async () => {
      const mockOrder = {
        id: 'order1',
        orderNumber: 'ORD-001',
        fromOrganizationId: 'org1',
        toOrganizationId: 'org2',
        status: 'APPROVED',
        totalAmount: 1000,
        notes: 'Test order',
        createdAt: new Date(),
        updatedAt: new Date(),
        fromOrganization: { name: 'Group A' },
        toOrganization: { name: 'Locality B' }
      };

      const mockUsers = [{
        id: 'user1',
        email: 'test@example.com',
        firstName: 'Test',
        lastName: 'User',
        role: 'LOCALITY',
        organizationId: 'org2'
      }];

      mockPrisma.order.findUnique.mockResolvedValue(mockOrder);
      mockPrisma.user.findMany.mockResolvedValue(mockUsers);
      mockSendMail.mockResolvedValue({ messageId: 'test-message-id' });

      const result = await notificationService.notifyOrderStatusChanged('order1', 'PENDING');

      expect(result.success).toBe(true);
      expect(mockSendMail).toHaveBeenCalled();
    });
  });

  describe('notifyLowInventory', () => {
    it('should send low inventory notification', async () => {
      const mockInventory = {
        organizationId: 'org1',
        literatureId: 'lit1',
        quantity: 5,
        lastUpdated: new Date(),
        organization: { name: 'Test Org' },
        literature: { title: 'Test Book', category: 'Books' }
      };

      const mockUsers = [{
        id: 'user1',
        email: 'test@example.com',
        firstName: 'Test',
        lastName: 'User',
        role: 'LOCALITY',
        organizationId: 'org1'
      }];

      mockPrisma.inventory.findUnique.mockResolvedValue(mockInventory);
      mockPrisma.user.findMany.mockResolvedValue(mockUsers);
      mockSendMail.mockResolvedValue({ messageId: 'test-message-id' });

      const result = await notificationService.notifyLowInventory('org1', 'lit1', 10);

      expect(result.success).toBe(true);
      expect(mockPrisma.inventory.findUnique).toHaveBeenCalledWith({
        where: {
          organizationId_literatureId: {
            organizationId: 'org1',
            literatureId: 'lit1'
          }
        },
        include: {
          organization: true,
          literature: true
        }
      });
    });

    it('should not send notification if inventory is above threshold', async () => {
      const mockInventory = {
        organizationId: 'org1',
        literatureId: 'lit1',
        quantity: 15,
        lastUpdated: new Date(),
        organization: { name: 'Test Org' },
        literature: { title: 'Test Book', category: 'Books' }
      };

      mockPrisma.inventory.findUnique.mockResolvedValue(mockInventory);

      const result = await notificationService.notifyLowInventory('org1', 'lit1', 10);

      expect(result.success).toBe(false);
      expect(result.error).toBe('Inventory not found or not below threshold');
    });
  });

  describe('sendOrderReminders', () => {
    it('should send reminders for old orders', async () => {
      const oldDate = new Date();
      oldDate.setDate(oldDate.getDate() - 5);

      const mockOrders = [{
        id: 'order1',
        orderNumber: 'ORD-001',
        fromOrganizationId: 'org1',
        toOrganizationId: 'org2',
        status: 'PENDING',
        totalAmount: 1000,
        createdAt: oldDate,
        fromOrganization: { name: 'Group A' },
        toOrganization: { name: 'Locality B' }
      }];

      const mockUsers = [{
        id: 'user1',
        email: 'test@example.com',
        firstName: 'Test',
        lastName: 'User',
        role: 'LOCALITY',
        organizationId: 'org2'
      }];

      mockPrisma.order.findMany.mockResolvedValue(mockOrders);
      mockPrisma.user.findMany.mockResolvedValue(mockUsers);
      mockSendMail.mockResolvedValue({ messageId: 'test-message-id' });

      const results = await notificationService.sendOrderReminders();

      expect(results).toHaveLength(1);
      expect(results[0].success).toBe(true);
      expect(mockPrisma.order.findMany).toHaveBeenCalledWith({
        where: {
          createdAt: {
            lt: expect.any(Date)
          },
          status: {
            notIn: ['COMPLETED', 'REJECTED', 'DELIVERED']
          }
        },
        include: {
          fromOrganization: true,
          toOrganization: true
        }
      });
    });
  });

  describe('checkLowInventoryAlerts', () => {
    it('should check and send low inventory alerts', async () => {
      const mockInventoryItems = [{
        id: 'inv1',
        organizationId: 'org1',
        literatureId: 'lit1',
        quantity: 5,
        lastUpdated: new Date(),
        organization: { name: 'Test Org' },
        literature: { title: 'Test Book', category: 'Books' }
      }];

      const mockUsers = [{
        id: 'user1',
        email: 'test@example.com',
        firstName: 'Test',
        lastName: 'User',
        role: 'LOCALITY',
        organizationId: 'org1'
      }];

      mockPrisma.inventory.findMany.mockResolvedValue(mockInventoryItems);
      mockPrisma.inventory.findUnique.mockResolvedValue(mockInventoryItems[0]);
      mockPrisma.user.findMany.mockResolvedValue(mockUsers);
      mockSendMail.mockResolvedValue({ messageId: 'test-message-id' });

      const results = await notificationService.checkLowInventoryAlerts(10);

      expect(results).toHaveLength(1);
      expect(results[0].success).toBe(true);
      expect(mockPrisma.inventory.findMany).toHaveBeenCalledWith({
        where: {
          quantity: {
            lte: 10
          }
        },
        include: {
          organization: true,
          literature: true
        }
      });
    });
  });
});

describe('NotificationTemplateService', () => {
  let templateService: NotificationTemplateService;

  beforeEach(() => {
    templateService = new NotificationTemplateService();
  });

  describe('Order Created Templates', () => {
    it('should generate correct order created subject', () => {
      const orderData = {
        orderNumber: 'ORD-001',
        fromOrganization: 'Group A',
        toOrganization: 'Locality B',
        totalAmount: 1000,
        createdAt: new Date()
      };

      const subject = templateService.getOrderCreatedSubject(orderData);
      expect(subject).toBe('Новый заказ #ORD-001 от Group A');
    });

    it('should generate order created text template', () => {
      const orderData = {
        orderNumber: 'ORD-001',
        fromOrganization: 'Group A',
        toOrganization: 'Locality B',
        totalAmount: 1000,
        items: [{
          title: 'Book 1',
          quantity: 2,
          unitPrice: 500
        }],
        notes: 'Test order',
        createdAt: new Date()
      };

      const text = templateService.getOrderCreatedText(orderData);
      expect(text).toContain('ORD-001');
      expect(text).toContain('Group A');
      expect(text).toContain('Locality B');
      expect(text).toContain('1000 руб.');
      expect(text).toContain('Book 1');
      expect(text).toContain('Test order');
    });

    it('should generate order created HTML template', () => {
      const orderData = {
        orderNumber: 'ORD-001',
        fromOrganization: 'Group A',
        toOrganization: 'Locality B',
        totalAmount: 1000,
        items: [{
          title: 'Book 1',
          quantity: 2,
          unitPrice: 500
        }],
        createdAt: new Date()
      };

      const html = templateService.getOrderCreatedHtml(orderData);
      expect(html).toContain('<html>');
      expect(html).toContain('ORD-001');
      expect(html).toContain('Group A');
      expect(html).toContain('Book 1');
      expect(html).toContain('<table');
    });
  });

  describe('Order Status Changed Templates', () => {
    it('should generate correct status changed subject', () => {
      const orderData = {
        orderNumber: 'ORD-001',
        fromOrganization: 'Group A',
        toOrganization: 'Locality B',
        status: 'APPROVED',
        totalAmount: 1000,
        createdAt: new Date()
      };

      const subject = templateService.getOrderStatusChangedSubject(orderData);
      expect(subject).toBe('Изменение статуса заказа #ORD-001: Одобрен');
    });
  });

  describe('Low Inventory Templates', () => {
    it('should generate correct low inventory subject', () => {
      const inventoryData = {
        literatureTitle: 'Test Book',
        organizationName: 'Test Org',
        currentQuantity: 5,
        threshold: 10,
        category: 'Books',
        lastUpdated: new Date()
      };

      const subject = templateService.getLowInventorySubject(inventoryData);
      expect(subject).toBe('Низкие остатки: Test Book в Test Org');
    });
  });

  describe('Order Reminder Templates', () => {
    it('should generate correct reminder subject', () => {
      const reminderData = {
        orderNumber: 'ORD-001',
        fromOrganization: 'Group A',
        toOrganization: 'Locality B',
        status: 'PENDING',
        daysSinceCreated: 5,
        totalAmount: 1000
      };

      const subject = templateService.getOrderReminderSubject(reminderData);
      expect(subject).toBe('Напоминание о заказе #ORD-001 (5 дней)');
    });
  });
});