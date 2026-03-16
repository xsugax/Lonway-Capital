import { Injectable, Logger } from '@nestjs/common';
import { v4 as uuidv4 } from 'uuid';

export interface Notification {
  id: string;
  userId: string;
  message: string;
  type: 'info' | 'success' | 'warning' | 'error';
  date: Date;
  read: boolean;
  metadata?: Record<string, any>;
}

@Injectable()
export class NotificationService {
  private notifications: Notification[] = [];
  private logger = new Logger('NotificationService');

  sendNotification(userId: string, message: string, type: Notification['type'] = 'info', metadata?: Record<string, any>) {
    const notification: Notification = {
      id: uuidv4(),
      userId,
      message,
      type,
      date: new Date(),
      read: false,
      metadata,
    };
    this.notifications.push(notification);
    this.logger.log(`Notification sent to ${userId}: ${message}`);
    return notification;
  }

  getNotifications(userId: string): Notification[] {
    return this.notifications.filter(n => n.userId === userId);
  }

  markAsRead(notificationId: string) {
    const notification = this.notifications.find(n => n.id === notificationId);
    if (notification) notification.read = true;
    return notification;
  }

  deleteNotification(notificationId: string) {
    const idx = this.notifications.findIndex(n => n.id === notificationId);
    if (idx !== -1) this.notifications.splice(idx, 1);
    return true;
  }

  getAllNotifications(): Notification[] {
    return this.notifications;
  }

  // ... (extend with push/email/SMS, scheduling, templates, analytics, etc.)
}
