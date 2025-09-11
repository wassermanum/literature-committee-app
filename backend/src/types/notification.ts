// Notification system types

export enum NotificationType {
  ORDER_CREATED = 'ORDER_CREATED',
  ORDER_STATUS_CHANGED = 'ORDER_STATUS_CHANGED',
  LOW_INVENTORY = 'LOW_INVENTORY',
  ORDER_REMINDER = 'ORDER_REMINDER',
  SYSTEM_ALERT = 'SYSTEM_ALERT'
}

export enum NotificationChannel {
  EMAIL = 'EMAIL',
  INTERNAL = 'INTERNAL',
  BOTH = 'BOTH'
}

export enum NotificationPriority {
  LOW = 'LOW',
  MEDIUM = 'MEDIUM',
  HIGH = 'HIGH',
  URGENT = 'URGENT'
}

export interface NotificationRecipient {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: string;
  organizationId: string;
}

export interface NotificationData {
  type: NotificationType;
  recipients: NotificationRecipient[];
  subject: string;
  message: string;
  htmlMessage?: string;
  channel: NotificationChannel;
  priority: NotificationPriority;
  metadata?: Record<string, any>;
  scheduledAt?: Date;
}

export interface EmailNotificationData {
  to: string[];
  subject: string;
  text: string;
  html?: string;
  attachments?: Array<{
    filename: string;
    content: Buffer | string;
    contentType?: string;
  }>;
}

export interface InternalNotificationData {
  userId: string;
  type: NotificationType;
  title: string;
  message: string;
  metadata?: Record<string, any>;
  isRead: boolean;
  expiresAt?: Date;
}

// Template data interfaces for different notification types
export interface OrderNotificationData {
  orderNumber: string;
  fromOrganization: string;
  toOrganization: string;
  totalAmount: number;
  status?: string;
  previousStatus?: string;
  items?: Array<{
    title: string;
    quantity: number;
    unitPrice: number;
  }>;
  notes?: string;
  createdAt: Date;
  updatedAt?: Date;
}

export interface InventoryNotificationData {
  literatureTitle: string;
  organizationName: string;
  currentQuantity: number;
  threshold: number;
  category: string;
  lastUpdated: Date;
}

export interface ReminderNotificationData {
  orderNumber: string;
  fromOrganization: string;
  toOrganization: string;
  status: string;
  daysSinceCreated: number;
  daysUntilDeadline?: number;
  totalAmount: number;
}

// Notification preferences
export interface NotificationPreferences {
  userId: string;
  emailEnabled: boolean;
  internalEnabled: boolean;
  orderCreated: boolean;
  orderStatusChanged: boolean;
  lowInventory: boolean;
  orderReminders: boolean;
  systemAlerts: boolean;
  reminderFrequency: 'DAILY' | 'WEEKLY' | 'NEVER';
}

// Notification queue item
export interface NotificationQueueItem {
  id: string;
  data: NotificationData;
  attempts: number;
  maxAttempts: number;
  nextAttempt: Date;
  createdAt: Date;
  processedAt?: Date;
  error?: string;
}

// Notification result
export interface NotificationResult {
  success: boolean;
  messageId?: string;
  error?: string;
  sentAt: Date;
  channel: NotificationChannel;
  recipientCount: number;
}

// Notification template
export interface NotificationTemplate {
  type: NotificationType;
  subject: string;
  textTemplate: string;
  htmlTemplate?: string;
  variables: string[];
}

// Notification statistics
export interface NotificationStats {
  totalSent: number;
  totalFailed: number;
  byType: Record<NotificationType, number>;
  byChannel: Record<NotificationChannel, number>;
  successRate: number;
  lastSent?: Date;
}