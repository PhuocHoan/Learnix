export interface INotificationsService {
  notifyRoleChange(userId: string, newRole: string): Promise<unknown>;
}
