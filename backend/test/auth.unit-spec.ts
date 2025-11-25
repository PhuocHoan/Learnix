import { Test, TestingModule } from '@nestjs/testing';
import { JwtService } from '@nestjs/jwt';
import { getRepositoryToken } from '@nestjs/typeorm';
import { ExternalAuth } from '../src/auth/entities/external-auth.entity';
import * as bcrypt from 'bcrypt';
import type { Response } from 'express';
import { ConfigService } from '@nestjs/config';

import { AuthService } from '../src/auth/auth.service';
import { AuthController } from '../src/auth/auth.controller';
import { UsersService } from '../src/users/users.service';
import { AdminController } from '../src/admin/admin.controller';
import { AdminService } from '../src/admin/admin.service';
import { LoginDto } from '../src/auth/dto/login.dto';
import { User } from '../src/users/entities/user.entity';
import { UserRole } from '../src/users/enums/user-role.enum';
import { UpdateUserRoleDto } from '../src/admin/dto/update-user-role.dto';
import { UpdateUserStatusDto } from '../src/admin/dto/update-user-status.dto';

describe('Auth unit tests (mocked DB)', () => {
  let module: TestingModule;
  let authService: AuthService;

  const userId = '1111-2222-3333';

  const mockUsersService: Partial<UsersService> = {
    create: jest.fn(),
    findByEmail: jest.fn(),
    findAll: jest.fn(),
    updateRole: jest.fn(),
    updateStatus: jest.fn(),
  };

  const mockJwtService: Partial<JwtService> = {
    sign: jest.fn().mockReturnValue('signed-jwt-token'),
  };

  beforeAll(async () => {
    module = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: UsersService, useValue: mockUsersService },
        { provide: JwtService, useValue: mockJwtService },
        { provide: getRepositoryToken(ExternalAuth), useValue: {} },
      ],
    }).compile();

    authService = module.get<AuthService>(AuthService);
  });

  afterAll(async () => {
    if (module) await module.close();
  });

  it('validateUser returns user when password matches (mocked)', async () => {
    const plain = 'Password123!';
    const hashed = await bcrypt.hash(plain, 1);
    const storedUser: Partial<User> = {
      id: userId,
      email: 'u@example.com',
      password: hashed,
      role: UserRole.STUDENT,
    };

    (mockUsersService.findByEmail as jest.Mock).mockResolvedValue(storedUser);

    const result = await authService.validateUser('u@example.com', plain);
    expect(result).toBeDefined();
    expect(result?.email).toBe('u@example.com');
    // password removed in service
    expect((result as Partial<User>).password).toBeUndefined();
  });

  it('login returns signed token and user', async () => {
    const user: Partial<User> = {
      id: userId,
      email: 'u@example.com',
      role: UserRole.STUDENT,
    };
    // mock validateUser to return user
    jest
      .spyOn(authService, 'validateUser')
      .mockResolvedValue(user as Omit<User, 'password'>);

    const loginDto: LoginDto = {
      email: 'u@example.com',
      password: 'x',
    };
    const res = await authService.login(loginDto);
    expect(res).toBeDefined();
    expect(res.access_token).toBe('signed-jwt-token');
    expect(res.user).toEqual(user);
  });

  it('AuthController.signIn sets cookie and returns user (mocked)', async () => {
    const fakeUser: Partial<User> = { id: userId, email: 'c@example.com' };
    const mockAuthServiceForController: Partial<AuthService> = {
      login: jest.fn().mockResolvedValue({
        access_token: 'signed-jwt-token',
        user: fakeUser,
      }),
    };

    const mockConfigService: Partial<ConfigService> = {
      get: jest.fn().mockReturnValue('http://localhost:5173'),
    };

    const controller = new AuthController(
      mockAuthServiceForController as AuthService,
      mockConfigService as ConfigService,
    );

    const fakeRes: Partial<Response> = {
      cookie: jest.fn(),
    };

    const loginDto: LoginDto = { email: 'c@example.com', password: 'x' };
    const returnVal = await controller.signIn(loginDto, fakeRes as Response);

    expect(fakeRes.cookie).toHaveBeenCalledWith(
      'access_token',
      'signed-jwt-token',
      expect.any(Object),
    );
    expect(returnVal).toEqual({ user: fakeUser, message: 'Login successful' });
  });

  it('AdminController methods call UsersService (mocked)', async () => {
    const mockAdminServiceForController: Partial<AdminService> = {
      getSystemStats: jest.fn().mockResolvedValue({ users: 1 }),
    };
    const mockUsersServiceForAdmin: Partial<UsersService> = {
      findAll: jest.fn().mockResolvedValue([{ id: '1', email: 'a@a' }]),
      updateRole: jest
        .fn()
        .mockResolvedValue({ id: '1', role: UserRole.ADMIN }),
      updateStatus: jest.fn().mockResolvedValue({ id: '1', isActive: false }),
    };

    const adminController = new AdminController(
      mockAdminServiceForController as AdminService,
      mockUsersServiceForAdmin as UsersService,
    );

    const users = await adminController.getAllUsers();
    expect(users).toEqual([{ id: '1', email: 'a@a' }]);

    const updateRoleDto: UpdateUserRoleDto = { role: UserRole.ADMIN };
    const updatedRole = await adminController.updateUserRole(
      '1',
      updateRoleDto,
    );
    expect(updatedRole).toEqual({ id: '1', role: UserRole.ADMIN });

    const updateStatusDto: UpdateUserStatusDto = { isActive: false };
    const updatedStatus = await adminController.updateUserStatus(
      '1',
      updateStatusDto,
    );
    expect(updatedStatus).toEqual({ id: '1', isActive: false });

    const stats = await adminController.getSystemStats();
    expect(stats).toEqual({ users: 1 });
  });
});
