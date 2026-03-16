import { Controller, Get, Post, Param, Body, Query } from '@nestjs/common';
import { NotificationService } from '../services/notification.service';

@Controller('notifications')
export class NotificationController {
  constructor(private readonly notificationService: NotificationService) {}

  @Get()
  getUserNotifications(@Query('userId') userId: string) {
    return { notifications: this.notificationService.getNotifications(userId) };
  }

  @Post()
  sendNotification(@Body() body: { userId: string; message: string; type?: 'info' | 'success' | 'warning' | 'error'; metadata?: any }) {
    return this.notificationService.sendNotification(body.userId, body.message, body.type, body.metadata);
  }

  @Post(':id/read')
  markAsRead(@Param('id') id: string) {
    return this.notificationService.markAsRead(id);
  }

  @Post(':id/delete')
  deleteNotification(@Param('id') id: string) {
    return this.notificationService.deleteNotification(id);
  }

  @Get('all')
  getAllNotifications() {
    return { notifications: this.notificationService.getAllNotifications() };
  }

  // ... (extend with endpoints for push/email/SMS, scheduling, templates, analytics, etc.)
}
