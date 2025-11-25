import { Test, TestingModule } from '@nestjs/testing';
import { JwtService } from '@nestjs/jwt';
import { getRepositoryToken } from '@nestjs/typeorm';
import { ExternalAuth } from '../src/auth/entities/external-auth.entity';
import * as bcrypt from 'bcrypt';

import { AuthService } from '../src/auth/auth.service';
import { AuthController } from '../src/auth/auth.controller';
import { UsersService } from '../src/users/users.service';
import { AdminController } from '../src/admin/admin.controller';

describe('Auth unit tests (mocked DB)', () => {
  let module: TestingModule;
  let authService: AuthService;

  const userId = '1111-2222-3333';

  const mockUsersService = {
    create: jest.fn(),
    findByEmail: jest.fn(),
    findAll: jest.fn(),
    updateRole: jest.fn(),
    updateStatus: jest.fn(),
  } as unknown as UsersService;

  const mockJwtService = {
    sign: jest.fn().mockReturnValue('signed-jwt-token'),
  } as unknown as JwtService;

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
    const storedUser = {
      id: userId,
      email: 'u@example.com',
      password: hashed,
      role: 'student',
    } as any;

    (mockUsersService.findByEmail as jest.Mock).mockResolvedValue(storedUser);

    const result = await authService.validateUser('u@example.com', plain);
    expect(result).toBeDefined();
    expect((result as any).email).toBe('u@example.com');
    // password removed in service
    expect((result as any).password).toBeUndefined();
  });

  it('login returns signed token and user', async () => {
    const user = { id: userId, email: 'u@example.com', role: 'student' } as any;
    // mock validateUser to return user
    jest.spyOn(authService, 'validateUser' as any).mockResolvedValue(user);

    const res = await authService.login({ email: 'u@example.com', password: 'x' } as any);
    expect(res).toBeDefined();
    expect(res.access_token).toBe('signed-jwt-token');
    expect(res.user).toEqual(user);
  });

  it('AuthController.signIn sets cookie and returns user (mocked)', async () => {
    const fakeUser = { id: userId, email: 'c@example.com' };
    const mockAuthService = {
      login: jest.fn().mockResolvedValue({ access_token: 'signed-jwt-token', user: fakeUser }),
    } as any;

    const controller = new AuthController(mockAuthService, ({ get: () => 'http://localhost:5173' } as any));

    const fakeRes = {
      cookie: jest.fn(),
    } as any;

    const returnVal = await controller.signIn({ email: 'c@example.com', password: 'x' } as any, fakeRes);
    expect(fakeRes.cookie).toHaveBeenCalledWith('access_token', 'signed-jwt-token', expect.any(Object));
    expect(returnVal).toEqual({ user: fakeUser, message: 'Login successful' });
  });

  it('AdminController methods call UsersService (mocked)', async () => {
    const mockAdminService = { getSystemStats: jest.fn().mockResolvedValue({ users: 1 }) } as any;
    const mockUsers = {
      findAll: jest.fn().mockResolvedValue([{ id: '1', email: 'a@a' }]),
      updateRole: jest.fn().mockResolvedValue({ id: '1', role: 'admin' }),
      updateStatus: jest.fn().mockResolvedValue({ id: '1', isActive: false }),
    } as any;

    const adminController = new AdminController(mockAdminService, mockUsers);

    const users = await adminController.getAllUsers();
    expect(users).toEqual([{ id: '1', email: 'a@a' }]);

    const updatedRole = await adminController.updateUserRole('1', { role: 'admin' } as any);
    expect(updatedRole).toEqual({ id: '1', role: 'admin' });

    const updatedStatus = await adminController.updateUserStatus('1', { isActive: false } as any);
    expect(updatedStatus).toEqual({ id: '1', isActive: false });

    const stats = await adminController.getSystemStats();
    expect(stats).toEqual({ users: 1 });
  });
});
