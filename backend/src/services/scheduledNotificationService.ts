import { NotificationService } from './notificationService.js';
import { logger } from '../utils/logger.js';

export class ScheduledNotificationService {
  private notificationService: NotificationService;
  private intervals: Map<string, NodeJS.Timeout> = new Map();

  constructor() {
    this.notificationService = new NotificationService();
  }

  // Start all scheduled notification jobs
  start(): void {
    logger.info('Starting scheduled notification services...');

    // Check for order reminders every 6 hours
    this.scheduleOrderReminders();

    // Check for low inventory every 12 hours
    this.scheduleLowInventoryChecks();

    logger.info('Scheduled notification services started');
  }

  // Stop all scheduled jobs
  stop(): void {
    logger.info('Stopping scheduled notification services...');
    
    this.intervals.forEach((interval, name) => {
      clearInterval(interval);
      logger.info(`Stopped scheduled job: ${name}`);
    });
    
    this.intervals.clear();
    logger.info('All scheduled notification services stopped');
  }

  // Schedule order reminder checks
  private scheduleOrderReminders(): void {
    const intervalMs = 6 * 60 * 60 * 1000; // 6 hours
    
    const interval = setInterval(async () => {
      try {
        logger.info('Running scheduled order reminders check...');
        const results = await this.notificationService.sendOrderReminders();
        
        const successCount = results.filter(r => r.success).length;
        const failureCount = results.filter(r => !r.success).length;
        
        logger.info(`Order reminders completed: ${successCount} sent, ${failureCount} failed`);
      } catch (error) {
        logger.error('Error in scheduled order reminders:', error);
      }
    }, intervalMs);

    this.intervals.set('orderReminders', interval);
    logger.info(`Scheduled order reminders every ${intervalMs / 1000 / 60 / 60} hours`);
  }

  // Schedule low inventory checks
  private scheduleLowInventoryChecks(): void {
    const intervalMs = 12 * 60 * 60 * 1000; // 12 hours
    const threshold = parseInt(process.env.LOW_INVENTORY_THRESHOLD || '10');
    
    const interval = setInterval(async () => {
      try {
        logger.info('Running scheduled low inventory check...');
        const results = await this.notificationService.checkLowInventoryAlerts(threshold);
        
        const successCount = results.filter(r => r.success).length;
        const failureCount = results.filter(r => !r.success).length;
        
        logger.info(`Low inventory alerts completed: ${successCount} sent, ${failureCount} failed`);
      } catch (error) {
        logger.error('Error in scheduled low inventory check:', error);
      }
    }, intervalMs);

    this.intervals.set('lowInventoryCheck', interval);
    logger.info(`Scheduled low inventory checks every ${intervalMs / 1000 / 60 / 60} hours`);
  }

  // Manual trigger methods for testing/admin use
  async triggerOrderReminders(): Promise<void> {
    try {
      logger.info('Manually triggering order reminders...');
      const results = await this.notificationService.sendOrderReminders();
      
      const successCount = results.filter(r => r.success).length;
      const failureCount = results.filter(r => !r.success).length;
      
      logger.info(`Manual order reminders completed: ${successCount} sent, ${failureCount} failed`);
    } catch (error) {
      logger.error('Error in manual order reminders trigger:', error);
      throw error;
    }
  }

  async triggerLowInventoryCheck(threshold?: number): Promise<void> {
    try {
      const checkThreshold = threshold || parseInt(process.env.LOW_INVENTORY_THRESHOLD || '10');
      logger.info(`Manually triggering low inventory check with threshold: ${checkThreshold}`);
      
      const results = await this.notificationService.checkLowInventoryAlerts(checkThreshold);
      
      const successCount = results.filter(r => r.success).length;
      const failureCount = results.filter(r => !r.success).length;
      
      logger.info(`Manual low inventory check completed: ${successCount} sent, ${failureCount} failed`);
    } catch (error) {
      logger.error('Error in manual low inventory check trigger:', error);
      throw error;
    }
  }

  // Get status of scheduled services
  getStatus(): { [key: string]: boolean } {
    return {
      orderReminders: this.intervals.has('orderReminders'),
      lowInventoryCheck: this.intervals.has('lowInventoryCheck')
    };
  }
}