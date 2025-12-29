import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { Test, type TestingModule } from '@nestjs/testing';
import { type Server } from 'socket.io';

import { UsersService } from '../users/users.service';

import { type Notification } from './entities/notification.entity';
import { NotificationsGateway } from './notifications.gateway';

describe('NotificationsGateway', () => {
  let gateway: NotificationsGateway;
  let jwtService: jest.Mocked<JwtService>;
  let configService: jest.Mocked<ConfigService>;
  let usersService: jest.Mocked<UsersService>;
  let mockServer: jest.Mocked<Server>;
  let mockSocket: any;

  beforeEach(async () => {
    const mockJwtService = {
      verify: jest.fn(),
    };
    const mockConfigService = {
      get: jest.fn(),
    };
    const mockUsersService = {
      findOne: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        NotificationsGateway,
        { provide: JwtService, useValue: mockJwtService },
        { provide: ConfigService, useValue: mockConfigService },
        { provide: UsersService, useValue: mockUsersService },
      ],
    }).compile();

    gateway = module.get<NotificationsGateway>(NotificationsGateway);
    jwtService = module.get(JwtService);
    configService = module.get(ConfigService);
    usersService = module.get(UsersService);

    mockServer = {
      use: jest.fn(),
      to: jest.fn().mockReturnThis(),
      emit: jest.fn(),
    } as any;

    gateway.server = mockServer;

    mockSocket = {
      join: jest.fn(),
      handshake: {
        auth: {},
        headers: {},
      },
      id: 'socket-id',
      userId: undefined,
    };
  });

  it('should be defined', () => {
    expect(gateway).toBeDefined();
  });

  describe('afterInit', () => {
    it('should set up authentication middleware', () => {
      gateway.afterInit(mockServer);
      expect(mockServer.use).toHaveBeenCalled();
    });

    it('should authenticate correctly with valid token in auth object', async () => {
      gateway.afterInit(mockServer);
      const authMiddleware = mockServer.use.mock.calls[0][0];

      mockSocket.handshake.auth.token = 'valid-token';
      configService.get.mockReturnValue('secret');
      jwtService.verify.mockReturnValue({ sub: 'user-1' });
      usersService.findOne.mockResolvedValue({
        id: 'user-1',
        isActive: true,
      } as any);

      const next = jest.fn();
      // authMiddleware is sync (returns void), but internally runs async IIFE
      authMiddleware(mockSocket, next);

      // Wait for the async IIFE to complete
      await new Promise((resolve) => setImmediate(resolve));

      expect(next).toHaveBeenCalledWith();
      expect(mockSocket.userId).toBe('user-1');
    });

    it('should fail authentication if user is inactive', async () => {
      gateway.afterInit(mockServer);
      const authMiddleware = mockServer.use.mock.calls[0][0];

      mockSocket.handshake.auth.token = 'valid-token';
      configService.get.mockReturnValue('secret');
      jwtService.verify.mockReturnValue({ sub: 'user-1' });
      usersService.findOne.mockResolvedValue({
        id: 'user-1',
        isActive: false,
      } as any);

      const next = jest.fn();
      // authMiddleware is sync (returns void), but internally runs async IIFE
      authMiddleware(mockSocket, next);

      // Wait for the async IIFE to complete
      await new Promise((resolve) => setImmediate(resolve));

      expect(next).toHaveBeenCalledWith(expect.any(Error));
      expect(next.mock.calls[0][0].message).toContain(
        'User not found or inactive',
      );
    });
  });

  describe('handleConnection', () => {
    it('should join user-specific room if userId is present', () => {
      mockSocket.userId = 'user-1';
      gateway.handleConnection(mockSocket);
      expect(mockSocket.join).toHaveBeenCalledWith('user:user-1');
    });

    it('should not join room if userId is absent', () => {
      gateway.handleConnection(mockSocket);
      expect(mockSocket.join).not.toHaveBeenCalled();
    });
  });

  describe('emitToUser', () => {
    it('should emit notification to user room', () => {
      const notification = { id: 'notif-1', title: 'Test' } as Notification;
      gateway.emitToUser('user-1', notification);

      expect(mockServer.to).toHaveBeenCalledWith('user:user-1');
      expect(mockServer.emit).toHaveBeenCalledWith(
        'notification',
        notification,
      );
    });
  });

  describe('emitUnreadCount', () => {
    it('should emit unread count to user room', () => {
      gateway.emitUnreadCount('user-1', 5);

      expect(mockServer.to).toHaveBeenCalledWith('user:user-1');
      expect(mockServer.emit).toHaveBeenCalledWith('unread-count', {
        count: 5,
      });
    });
  });
});
