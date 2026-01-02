import { Logger, Inject, forwardRef } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import {
  WebSocketGateway,
  WebSocketServer,
  OnGatewayConnection,
  OnGatewayDisconnect,
  OnGatewayInit,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';

import { decryptTokenFromCookie } from '../auth/utils/token-encryption';
import { UsersService } from '../users/users.service';

import { Notification } from './entities/notification.entity';

interface AuthenticatedSocket extends Socket {
  userId?: string;
}

@WebSocketGateway({
  cors: {
    origin: true,
    credentials: true,
  },
  namespace: '/notifications',
})
export class NotificationsGateway
  implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect
{
  @WebSocketServer()
  server: Server;

  private readonly logger = new Logger(NotificationsGateway.name);

  constructor(
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
    @Inject(forwardRef(() => UsersService))
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    private readonly usersService: any,
  ) {}

  afterInit(server: Server) {
    // Apply JWT authentication middleware
    server.use((socket: AuthenticatedSocket, next) => {
      void (async () => {
        try {
          const token = this.extractToken(socket);

          if (!token) {
            this.logger.warn('No token provided for WebSocket connection');
            const error: Error & { data?: unknown } = new Error(
              'Authentication error: No token provided',
            );
            return next(error);
          }

          const secret =
            this.configService.get<string>('JWT_SECRET') ?? 'supersecretkey';
          const payload = this.jwtService.verify<{ sub: string }>(token, {
            secret,
          });

          // Verify user still exists and is active
          // eslint-disable-next-line @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-assignment
          const user = await this.usersService.findOne(payload.sub);
          // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
          if (!user?.isActive) {
            const error: Error & { data?: unknown } = new Error(
              'Authentication error: User not found or inactive',
            );
            return next(error);
          }

          // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-assignment
          socket.userId = user.id;
          next();
        } catch (error) {
          this.logger.warn(
            `WebSocket auth failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
          );
          const authError: Error & { data?: unknown } = new Error(
            'Authentication error: Invalid token',
          );
          next(authError);
        }
      })();
    });

    this.logger.log('Notifications WebSocket Gateway initialized');
  }

  handleConnection(client: AuthenticatedSocket) {
    // Re-verify userId if not present on socket object directly (in case middleware attached it to handshake)
    // The middleware attaches it to `socket.userId`.
    if (!client.userId) {
      // Attempt to recover from handshake auth if possible, or just log warning
      this.logger.warn(`Client ${client.id} connected without userId attached`);
    }

    if (client.userId) {
      // Join user-specific room
      const room = `user:${client.userId}`;
      void client.join(room);
      this.logger.log(`Client ${client.id} connected and joined room ${room}`);
    }
  }

  handleDisconnect(client: AuthenticatedSocket) {
    this.logger.log(`Client ${client.id} disconnected`);
  }

  /**
   * Emit a notification to a specific user
   */
  emitToUser(userId: string, notification: Notification) {
    const room = `user:${userId}`;
    this.server.to(room).emit('notification', notification);
    this.logger.debug(`Emitted notification to ${room}`);
  }

  /**
   * Emit unread count update to a specific user
   */
  emitUnreadCount(userId: string, count: number) {
    const room = `user:${userId}`;
    this.server.to(room).emit('unread-count', { count });
  }

  private extractToken(socket: Socket): string | null {
    // Try to get token from auth object (preferred for socket.io)
    const authToken = (socket.handshake.auth as { token?: string })?.token;
    if (authToken) {
      return authToken;
    }

    // Fallback to Authorization header
    const authHeader = socket.handshake.headers.authorization;
    if (authHeader?.startsWith('Bearer ')) {
      return authHeader.substring(7);
    }

    // Fallback to cookie (if using cookies for auth)
    const cookies = socket.handshake.headers.cookie;
    if (cookies) {
      const match = /access_token=([^;]+)/.exec(cookies);
      if (match) {
        const encryptedToken = decodeURIComponent(match[1]);
        const secret =
          this.configService.get<string>('OAUTH_TOKEN_COOKIE_SECRET') ??
          this.configService.get<string>('JWT_SECRET') ??
          'dev-secret-key';

        const decrypted = decryptTokenFromCookie(encryptedToken, secret);
        if (decrypted) {
          return decrypted;
        }
        return encryptedToken;
      }
    }

    return null;
  }
}
