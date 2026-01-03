import { type Notification } from '../entities/notification.entity';

export interface INotificationsGateway {
  emitToUser(userId: string, notification: Notification): void;
  emitUnreadCount(userId: string, count: number): void;
}
