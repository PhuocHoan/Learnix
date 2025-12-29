import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

import { useAuth } from '@/contexts/use-auth';

import { notificationsApi } from '../api/notifications-api';

import { useNotificationSocket } from './use-notification-socket';

export function useNotifications(page = 1, limit = 10) {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  // Initialize WebSocket connection for real-time updates
  useNotificationSocket();

  const query = useQuery({
    queryKey: ['notifications', page, limit],
    queryFn: () => notificationsApi.getNotifications(page, limit),
    enabled: Boolean(user),
    refetchInterval: 60000, // Fallback poll every 60s (WebSocket handles real-time)
    staleTime: 30000,
  });

  const unreadCountQuery = useQuery({
    queryKey: ['notifications', 'unread-count'],
    queryFn: notificationsApi.getUnreadCount,
    enabled: Boolean(user),
    refetchInterval: 60000, // Fallback poll every 60s
    staleTime: 30000,
  });

  const markAsReadMutation = useMutation({
    mutationFn: notificationsApi.markAsRead,
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['notifications'] });
    },
  });

  const markAllAsReadMutation = useMutation({
    mutationFn: notificationsApi.markAllAsRead,
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['notifications'] });
    },
  });

  return {
    notifications: query.data,
    isLoading: query.isLoading,
    unreadCount: unreadCountQuery.data?.count ?? 0,
    markAsRead: markAsReadMutation.mutate,
    markAllAsRead: markAllAsReadMutation.mutate,
    refetch: query.refetch,
  };
}
