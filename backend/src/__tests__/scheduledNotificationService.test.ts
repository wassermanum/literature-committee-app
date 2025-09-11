import { ScheduledNotificationService } from '../services/scheduledNotificationService.js';
import { NotificationService } from '../services/notificationService.js';

// Mock dependencies
jest.mock('../services/notificationService.js');
jest.mock('../utils/logger.js');

const mockNotificationService = {
  sendOrderReminders: jest.fn(),
  checkLowInventoryAlerts: jest.fn(),
} as any;

// Mock NotificationService constructor
(NotificationService as jest.MockedClass<typeof NotificationService>).mockImplementation(() => mockNotificationService);

describe('ScheduledNotificationService', () => {
  let scheduledService: ScheduledNotificationService;

  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers();
    scheduledService = new ScheduledNotificationService();
  });

  afterEach(() => {
    scheduledService.stop();
    jest.useRealTimers();
  });

  describe('start and stop', () => {
    it('should start scheduled services', () => {
      scheduledService.start();
      const status = scheduledService.getStatus();
      
      expect(status.orderReminders).toBe(true);
      expect(status.lowInventoryCheck).toBe(true);
    });

    it('should stop scheduled services', () => {
      scheduledService.start();
      scheduledService.stop();
      const status = scheduledService.getStatus();
      
      expect(status.orderReminders).toBe(false);
      expect(status.lowInventoryCheck).toBe(false);
    });
  });

  describe('manual triggers', () => {
    it('should trigger order reminders manually', async () => {
      const mockResults = [{ success: true, sentAt: new Date(), channel: 'EMAIL', recipientCount: 1 }];
      mockNotificationService.sendOrderReminders.mockResolvedValue(mockResults);

      await scheduledService.triggerOrderReminders();

      expect(mockNotificationService.sendOrderReminders).toHaveBeenCalled();
    });

    it('should trigger low inventory check manually', async () => {
      const mockResults = [{ success: true, sentAt: new Date(), channel: 'EMAIL', recipientCount: 1 }];
      mockNotificationService.checkLowInventoryAlerts.mockResolvedValue(mockResults);

      await scheduledService.triggerLowInventoryCheck(5);

      expect(mockNotificationService.checkLowInventoryAlerts).toHaveBeenCalledWith(5);
    });

    it('should use default threshold if not provided', async () => {
      const mockResults = [{ success: true, sentAt: new Date(), channel: 'EMAIL', recipientCount: 1 }];
      mockNotificationService.checkLowInventoryAlerts.mockResolvedValue(mockResults);

      await scheduledService.triggerLowInventoryCheck();

      expect(mockNotificationService.checkLowInventoryAlerts).toHaveBeenCalledWith(10);
    });

    it('should handle errors in manual triggers', async () => {
      mockNotificationService.sendOrderReminders.mockRejectedValue(new Error('Test error'));

      await expect(scheduledService.triggerOrderReminders()).rejects.toThrow('Test error');
    });
  });

  describe('scheduled execution', () => {
    it('should execute order reminders on schedule', async () => {
      const mockResults = [{ success: true, sentAt: new Date(), channel: 'EMAIL', recipientCount: 1 }];
      mockNotificationService.sendOrderReminders.mockResolvedValue(mockResults);

      scheduledService.start();

      // Fast-forward 6 hours
      jest.advanceTimersByTime(6 * 60 * 60 * 1000);

      // Wait for async operations
      await new Promise(resolve => setTimeout(resolve, 100));

      expect(mockNotificationService.sendOrderReminders).toHaveBeenCalled();
    }, 10000);

    it('should execute low inventory check on schedule', async () => {
      const mockResults = [{ success: true, sentAt: new Date(), channel: 'EMAIL', recipientCount: 1 }];
      mockNotificationService.checkLowInventoryAlerts.mockResolvedValue(mockResults);

      scheduledService.start();

      // Fast-forward 12 hours
      jest.advanceTimersByTime(12 * 60 * 60 * 1000);

      // Wait for async operations
      await new Promise(resolve => setTimeout(resolve, 100));

      expect(mockNotificationService.checkLowInventoryAlerts).toHaveBeenCalledWith(10);
    }, 10000);

    it('should handle errors in scheduled execution', async () => {
      mockNotificationService.sendOrderReminders.mockRejectedValue(new Error('Scheduled error'));

      scheduledService.start();

      // Fast-forward 6 hours
      jest.advanceTimersByTime(6 * 60 * 60 * 1000);

      // Wait for async operations
      await new Promise(resolve => setTimeout(resolve, 100));

      // Should not throw, just log the error
      expect(mockNotificationService.sendOrderReminders).toHaveBeenCalled();
    }, 10000);
  });

  describe('getStatus', () => {
    it('should return correct status when services are stopped', () => {
      const status = scheduledService.getStatus();
      
      expect(status.orderReminders).toBe(false);
      expect(status.lowInventoryCheck).toBe(false);
    });

    it('should return correct status when services are running', () => {
      scheduledService.start();
      const status = scheduledService.getStatus();
      
      expect(status.orderReminders).toBe(true);
      expect(status.lowInventoryCheck).toBe(true);
    });
  });
});