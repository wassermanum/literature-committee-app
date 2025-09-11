import { PrismaClient } from '@prisma/client';
import nodemailer from 'nodemailer';
import { 
  NotificationType, 
  NotificationChannel, 
  NotificationPriority,
  NotificationData, 
  NotificationResult,
  NotificationRecipient,
  EmailNotificationData,
  OrderNotificationData,
  InventoryNotificationData,
  ReminderNotificationData
} from '../types/notification.js';
import { NotificationTemplateService } from './notificationTemplateService.js';
import { createEmailTransporter, emailDefaults } from '../config/email.js';
import { logger } from '../utils/logger.js';

export class NotificationService {
  private emailTransporter: nodemailer.Transporter;
  private templateService: NotificationTemplateService;
  private prisma: PrismaClient;

  constructor(prismaClient?: PrismaClient) {
    this.emailTransporter = createEmailTransporter();
    this.templateService = new NotificationTemplateService();
    this.prisma = prismaClient || new PrismaClient();
  }

  // Main notification sending method
  async sendNotification(data: NotificationData): Promise<NotificationResult> {
    try {
      logger.info(`Sending notification: ${data.type} to ${data.recipients.length} recipients`);

      let result: NotificationResult = {
        success: false,
        sentAt: new Date(),
        channel: data.channel,
        recipientCount: data.recipients.length
      };

      switch (data.channel) {
        case NotificationChannel.EMAIL:
          result = await this.sendEmailNotification(data);
          break;
        case NotificationChannel.INTERNAL:
          result = await this.sendInternalNotification(data);
          break;
        case NotificationChannel.BOTH:
          const emailResult = await this.sendEmailNotification(data);
          const internalResult = await this.sendInternalNotification(data);
          result = {
            success: emailResult.success && internalResult.success,
            sentAt: new Date(),
            channel: NotificationChannel.BOTH,
            recipientCount: data.recipients.length,
            error: emailResult.error || internalResult.error
          };
          break;
      }

      // Log notification result
      if (result.success) {
        logger.info(`Notification sent successfully: ${data.type}`);
      } else {
        logger.error(`Failed to send notification: ${data.type}`, { error: result.error });
      }

      return result;
    } catch (error) {
      logger.error('Error sending notification:', error);
      return {
        success: false,
        sentAt: new Date(),
        channel: data.channel,
        recipientCount: data.recipients.length,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  // Send email notification
  private async sendEmailNotification(data: NotificationData): Promise<NotificationResult> {
    try {
      const emailData: EmailNotificationData = {
        to: data.recipients.map(r => r.email),
        subject: data.subject,
        text: data.message,
        html: data.htmlMessage
      };

      const info = await this.emailTransporter.sendMail({
        from: emailDefaults.from,
        to: emailData.to,
        subject: emailData.subject,
        text: emailData.text,
        html: emailData.html,
        replyTo: emailDefaults.replyTo
      });

      return {
        success: true,
        messageId: info.messageId,
        sentAt: new Date(),
        channel: NotificationChannel.EMAIL,
        recipientCount: emailData.to.length
      };
    } catch (error) {
      return {
        success: false,
        sentAt: new Date(),
        channel: NotificationChannel.EMAIL,
        recipientCount: data.recipients.length,
        error: error instanceof Error ? error.message : 'Email sending failed'
      };
    }
  }

  // Send internal notification (store in database)
  private async sendInternalNotification(data: NotificationData): Promise<NotificationResult> {
    try {
      // Note: This would require a notifications table in the database
      // For now, we'll just log it as internal notifications
      // In a real implementation, you'd store these in a notifications table
      
      for (const recipient of data.recipients) {
        logger.info(`Internal notification for user ${recipient.id}:`, {
          type: data.type,
          subject: data.subject,
          message: data.message,
          priority: data.priority,
          metadata: data.metadata
        });
      }

      return {
        success: true,
        sentAt: new Date(),
        channel: NotificationChannel.INTERNAL,
        recipientCount: data.recipients.length
      };
    } catch (error) {
      return {
        success: false,
        sentAt: new Date(),
        channel: NotificationChannel.INTERNAL,
        recipientCount: data.recipients.length,
        error: error instanceof Error ? error.message : 'Internal notification failed'
      };
    }
  }

  // Order-related notifications
  async notifyOrderCreated(orderId: string): Promise<NotificationResult> {
    try {
      const order = await this.getOrderWithDetails(orderId);
      if (!order) {
        throw new Error(`Order not found: ${orderId}`);
      }

      // Get recipients (users from the receiving organization)
      const recipients = await this.getOrganizationUsers(order.toOrganizationId);

      const orderData: OrderNotificationData = {
        orderNumber: order.orderNumber,
        fromOrganization: order.fromOrganization.name,
        toOrganization: order.toOrganization.name,
        totalAmount: order.totalAmount,
        items: order.items.map(item => ({
          title: item.literature.title,
          quantity: item.quantity,
          unitPrice: item.unitPrice
        })),
        notes: order.notes || undefined,
        createdAt: order.createdAt
      };

      const notificationData: NotificationData = {
        type: NotificationType.ORDER_CREATED,
        recipients,
        subject: this.templateService.getOrderCreatedSubject(orderData),
        message: this.templateService.getOrderCreatedText(orderData),
        htmlMessage: this.templateService.getOrderCreatedHtml(orderData),
        channel: NotificationChannel.BOTH,
        priority: NotificationPriority.MEDIUM,
        metadata: { orderId, orderNumber: order.orderNumber }
      };

      return await this.sendNotification(notificationData);
    } catch (error) {
      logger.error('Error sending order created notification:', error);
      throw error;
    }
  }

  async notifyOrderStatusChanged(orderId: string, previousStatus: string): Promise<NotificationResult> {
    try {
      const order = await this.getOrderWithDetails(orderId);
      if (!order) {
        throw new Error(`Order not found: ${orderId}`);
      }

      // Get recipients (users from both organizations)
      const fromOrgUsers = await this.getOrganizationUsers(order.fromOrganizationId);
      const toOrgUsers = await this.getOrganizationUsers(order.toOrganizationId);
      const recipients = [...fromOrgUsers, ...toOrgUsers];

      const orderData: OrderNotificationData = {
        orderNumber: order.orderNumber,
        fromOrganization: order.fromOrganization.name,
        toOrganization: order.toOrganization.name,
        totalAmount: order.totalAmount,
        status: order.status,
        previousStatus,
        notes: order.notes || undefined,
        createdAt: order.createdAt,
        updatedAt: order.updatedAt
      };

      const notificationData: NotificationData = {
        type: NotificationType.ORDER_STATUS_CHANGED,
        recipients,
        subject: this.templateService.getOrderStatusChangedSubject(orderData),
        message: this.templateService.getOrderStatusChangedText(orderData),
        htmlMessage: this.templateService.getOrderStatusChangedHtml(orderData),
        channel: NotificationChannel.BOTH,
        priority: NotificationPriority.MEDIUM,
        metadata: { orderId, orderNumber: order.orderNumber, status: order.status, previousStatus }
      };

      return await this.sendNotification(notificationData);
    } catch (error) {
      logger.error('Error sending order status changed notification:', error);
      throw error;
    }
  }

  // Inventory-related notifications
  async notifyLowInventory(organizationId: string, literatureId: string, threshold: number = 10): Promise<NotificationResult> {
    try {
      const inventory = await this.prisma.inventory.findUnique({
        where: {
          organizationId_literatureId: {
            organizationId,
            literatureId
          }
        },
        include: {
          organization: true,
          literature: true
        }
      });

      if (!inventory || inventory.quantity > threshold) {
        return {
          success: false,
          sentAt: new Date(),
          channel: NotificationChannel.EMAIL,
          recipientCount: 0,
          error: 'Inventory not found or not below threshold'
        };
      }

      // Get recipients (users from the organization and parent organizations)
      const recipients = await this.getInventoryNotificationRecipients(organizationId);

      const inventoryData: InventoryNotificationData = {
        literatureTitle: inventory.literature.title,
        organizationName: inventory.organization.name,
        currentQuantity: inventory.quantity,
        threshold,
        category: inventory.literature.category,
        lastUpdated: inventory.lastUpdated
      };

      const notificationData: NotificationData = {
        type: NotificationType.LOW_INVENTORY,
        recipients,
        subject: this.templateService.getLowInventorySubject(inventoryData),
        message: this.templateService.getLowInventoryText(inventoryData),
        htmlMessage: this.templateService.getLowInventoryHtml(inventoryData),
        channel: NotificationChannel.BOTH,
        priority: NotificationPriority.HIGH,
        metadata: { organizationId, literatureId, currentQuantity: inventory.quantity, threshold }
      };

      return await this.sendNotification(notificationData);
    } catch (error) {
      logger.error('Error sending low inventory notification:', error);
      throw error;
    }
  }

  // Order reminder notifications
  async sendOrderReminders(): Promise<NotificationResult[]> {
    try {
      // Find orders that need reminders (older than 3 days and not completed)
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - 3);

      const orders = await this.prisma.order.findMany({
        where: {
          createdAt: {
            lt: cutoffDate
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

      const results: NotificationResult[] = [];

      for (const order of orders) {
        try {
          const daysSinceCreated = Math.floor(
            (new Date().getTime() - order.createdAt.getTime()) / (1000 * 60 * 60 * 24)
          );

          // Get recipients (users from the receiving organization)
          const recipients = await this.getOrganizationUsers(order.toOrganizationId);

          const reminderData: ReminderNotificationData = {
            orderNumber: order.orderNumber,
            fromOrganization: order.fromOrganization.name,
            toOrganization: order.toOrganization.name,
            status: order.status,
            daysSinceCreated,
            totalAmount: order.totalAmount
          };

          const notificationData: NotificationData = {
            type: NotificationType.ORDER_REMINDER,
            recipients,
            subject: this.templateService.getOrderReminderSubject(reminderData),
            message: this.templateService.getOrderReminderText(reminderData),
            htmlMessage: this.templateService.getOrderReminderHtml(reminderData),
            channel: NotificationChannel.EMAIL,
            priority: NotificationPriority.MEDIUM,
            metadata: { orderId: order.id, daysSinceCreated }
          };

          const result = await this.sendNotification(notificationData);
          results.push(result);
        } catch (error) {
          logger.error(`Error sending reminder for order ${order.id}:`, error);
          results.push({
            success: false,
            sentAt: new Date(),
            channel: NotificationChannel.EMAIL,
            recipientCount: 0,
            error: error instanceof Error ? error.message : 'Unknown error'
          });
        }
      }

      return results;
    } catch (error) {
      logger.error('Error sending order reminders:', error);
      throw error;
    }
  }

  // Check for low inventory across all organizations
  async checkLowInventoryAlerts(threshold: number = 10): Promise<NotificationResult[]> {
    try {
      const lowInventoryItems = await this.prisma.inventory.findMany({
        where: {
          quantity: {
            lte: threshold
          }
        },
        include: {
          organization: true,
          literature: true
        }
      });

      const results: NotificationResult[] = [];

      for (const item of lowInventoryItems) {
        try {
          const result = await this.notifyLowInventory(
            item.organizationId, 
            item.literatureId, 
            threshold
          );
          results.push(result);
        } catch (error) {
          logger.error(`Error sending low inventory alert for ${item.id}:`, error);
          results.push({
            success: false,
            sentAt: new Date(),
            channel: NotificationChannel.EMAIL,
            recipientCount: 0,
            error: error instanceof Error ? error.message : 'Unknown error'
          });
        }
      }

      return results;
    } catch (error) {
      logger.error('Error checking low inventory alerts:', error);
      throw error;
    }
  }

  // Helper methods
  private async getOrderWithDetails(orderId: string) {
    return await this.prisma.order.findUnique({
      where: { id: orderId },
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
  }

  private async getOrganizationUsers(organizationId: string): Promise<NotificationRecipient[]> {
    const users = await this.prisma.user.findMany({
      where: {
        organizationId,
        isActive: true
      },
      include: {
        organization: true
      }
    });

    return users.map(user => ({
      id: user.id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      role: user.role,
      organizationId: user.organizationId
    }));
  }

  private async getInventoryNotificationRecipients(organizationId: string): Promise<NotificationRecipient[]> {
    // Get users from the organization and its parent organizations
    const organization = await this.prisma.organization.findUnique({
      where: { id: organizationId },
      include: {
        parent: true,
        users: {
          where: { isActive: true }
        }
      }
    });

    if (!organization) {
      return [];
    }

    let recipients: NotificationRecipient[] = organization.users.map(user => ({
      id: user.id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      role: user.role,
      organizationId: user.organizationId
    }));

    // Also notify parent organization users if exists
    if (organization.parent) {
      const parentUsers = await this.getOrganizationUsers(organization.parent.id);
      recipients = [...recipients, ...parentUsers];
    }

    return recipients;
  }
}