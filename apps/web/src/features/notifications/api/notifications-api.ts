import { api } from '@/lib/api';

export type NotificationType =
  | 'enrollment'
  | 'payment_success'
  | 'payment_failed'
  | 'course_approved'
  | 'course_rejected'
  | 'course_submitted'
  | 'course_completed'
  | 'quiz_submitted';

export interface Notification {
  id: string;
  title: string;
  message: string;
  type: 'info' | 'success' | 'warning' | 'error';
  notificationType: NotificationType | null;
  userId: string;
  isRead: boolean;
  link?: string | null;
  metadata?: Record<string, unknown>;
  createdAt: string;
}

export interface NotificationsResponse {
  items: Notification[];
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
  unreadCount: number;
}

export const notificationsApi = {
  getNotifications: async (
    page = 1,
    limit = 10,
  ): Promise<NotificationsResponse> => {
    const response = await api.get<NotificationsResponse>('/notifications', {
      params: { page, limit },
    });
    return response.data;
  },

  getUnreadCount: async (): Promise<{ count: number }> => {
    const response = await api.get<{ count: number }>(
      '/notifications/unread-count',
    );
    return response.data;
  },

  markAsRead: async (id: string): Promise<Notification> => {
    const response = await api.patch<Notification>(`/notifications/${id}/read`);
    return response.data;
  },

  markAllAsRead: async (): Promise<{ success: boolean }> => {
    const response = await api.patch<{ success: boolean }>(
      '/notifications/read-all',
    );
    return response.data;
  },
};
