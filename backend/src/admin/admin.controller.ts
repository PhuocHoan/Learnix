import { Controller, Get, Patch, Param, Body, UseGuards } from '@nestjs/common';

import { AdminService, SystemStats } from './admin.service';
import { UpdateUserRoleDto } from './dto/update-user-role.dto';
import { UpdateUserStatusDto } from './dto/update-user-status.dto';
import { Roles } from '../auth/decorators/roles.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { User } from '../users/entities/user.entity';
import { UserRole } from '../users/enums/user-role.enum';
import { UsersService } from '../users/users.service';

@Controller('admin')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.ADMIN)
export class AdminController {
  constructor(
    private readonly adminService: AdminService,
    private readonly usersService: UsersService,
  ) {}

  @Get('users')
  async getAllUsers(): Promise<User[]> {
    return this.usersService.findAll();
  }

  @Patch('users/:id/role')
  async updateUserRole(
    @Param('id') id: string,
    @Body() updateRoleDto: UpdateUserRoleDto,
  ): Promise<User> {
    return this.usersService.updateRole(id, updateRoleDto.role);
  }

  @Patch('users/:id/status')
  async updateUserStatus(
    @Param('id') id: string,
    @Body() updateStatusDto: UpdateUserStatusDto,
  ): Promise<User> {
    return this.usersService.updateStatus(id, updateStatusDto.isActive);
  }

  @Get('stats')
  async getSystemStats(): Promise<SystemStats> {
    return this.adminService.getSystemStats();
  }
}
