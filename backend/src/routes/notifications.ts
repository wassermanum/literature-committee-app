import { Router } from 'express';
import { NotificationService } from '../services/notificationService.js';
import { ScheduledNotificationService } from '../services/scheduledNotificationService.js';
import { authenticate } from '../middleware/auth.js';
import { logger } from '../utils/logger.js';

const router = Router();
const notificationService = new NotificationService();
const scheduledService = new ScheduledNotificationService();

// Apply authentication middleware to all routes
router.use(authenticate);

// Manual notification triggers (admin only)
router.post('/orders/:orderId/created', async (req, res) => {
  try {
    const { orderId } = req.params;
    
    // Check if user has admin rights or is from the receiving organization
    // This would need proper authorization logic based on your auth system
    
    const result = await notificationService.notifyOrderCreated(orderId);
    
    if (result.success) {
      res.json({
        success: true,
        message: 'Order creation notification sent successfully',
        result
      });
    } else {
      res.status(500).json({
        success: false,
        message: 'Failed to send order creation notification',
        error: result.error
      });
    }
  } catch (error) {
    logger.error('Error in order created notification endpoint:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

router.post('/orders/:orderId/status-changed', async (req, res) => {
  try {
    const { orderId } = req.params;
    const { previousStatus } = req.body;
    
    if (!previousStatus) {
      res.status(400).json({
        success: false,
        message: 'Previous status is required'
      });
      return;
    }
    
    const result = await notificationService.notifyOrderStatusChanged(orderId, previousStatus);
    
    if (result.success) {
      res.json({
        success: true,
        message: 'Order status change notification sent successfully',
        result
      });
    } else {
      res.status(500).json({
        success: false,
        message: 'Failed to send order status change notification',
        error: result.error
      });
    }
  } catch (error) {
    logger.error('Error in order status changed notification endpoint:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

router.post('/inventory/low-stock', async (req, res) => {
  try {
    const { organizationId, literatureId, threshold } = req.body;
    
    if (!organizationId || !literatureId) {
      res.status(400).json({
        success: false,
        message: 'Organization ID and Literature ID are required'
      });
      return;
    }
    
    const result = await notificationService.notifyLowInventory(
      organizationId, 
      literatureId, 
      threshold || 10
    );
    
    if (result.success) {
      res.json({
        success: true,
        message: 'Low inventory notification sent successfully',
        result
      });
    } else {
      res.status(500).json({
        success: false,
        message: 'Failed to send low inventory notification',
        error: result.error
      });
    }
  } catch (error) {
    logger.error('Error in low inventory notification endpoint:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Scheduled notification management (admin only)
router.post('/scheduled/order-reminders/trigger', async (_req, res) => {
  try {
    // Check admin permissions here
    
    await scheduledService.triggerOrderReminders();
    
    res.json({
      success: true,
      message: 'Order reminders triggered successfully'
    });
  } catch (error) {
    logger.error('Error triggering order reminders:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to trigger order reminders',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

router.post('/scheduled/low-inventory/trigger', async (req, res) => {
  try {
    // Check admin permissions here
    
    const { threshold } = req.body;
    await scheduledService.triggerLowInventoryCheck(threshold);
    
    res.json({
      success: true,
      message: 'Low inventory check triggered successfully'
    });
  } catch (error) {
    logger.error('Error triggering low inventory check:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to trigger low inventory check',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

router.get('/scheduled/status', async (_req, res) => {
  try {
    const status = scheduledService.getStatus();
    
    res.json({
      success: true,
      status
    });
  } catch (error) {
    logger.error('Error getting scheduled notification status:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get scheduled notification status',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Test notification endpoint (development only)
if (process.env.NODE_ENV === 'development') {
  router.post('/test/email', async (req, res) => {
    try {
      const { to, subject, message } = req.body;
      
      if (!to || !subject || !message) {
        res.status(400).json({
          success: false,
          message: 'to, subject, and message are required'
        });
        return;
      }
      
      const testNotification = {
        type: 'SYSTEM_ALERT' as any,
        recipients: [{ 
          id: 'test', 
          email: to, 
          firstName: 'Test', 
          lastName: 'User', 
          role: 'ADMIN', 
          organizationId: 'test' 
        }],
        subject,
        message,
        channel: 'EMAIL' as any,
        priority: 'MEDIUM' as any
      };
      
      const result = await notificationService.sendNotification(testNotification);
      
      res.json({
        success: result.success,
        message: result.success ? 'Test email sent successfully' : 'Failed to send test email',
        result
      });
    } catch (error) {
      logger.error('Error sending test email:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to send test email',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  });
}

export default router;