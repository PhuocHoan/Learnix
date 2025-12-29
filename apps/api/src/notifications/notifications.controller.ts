import {
  Controller,
  Get,
  Patch,
  Param,
  Query,
  UseGuards,
  Req,
  ParseIntPipe,
  DefaultValuePipe,
} from '@nestjs/common';
import { Request } from 'express';

import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

import { NotificationsService } from './notifications.service';

@Controller('notifications')
@UseGuards(JwtAuthGuard)
export class NotificationsController {
  constructor(private readonly notificationsService: NotificationsService) {}

  @Get()
  findAll(
    @Req() req: Request,
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number,
    @Query('limit', new DefaultValuePipe(10), ParseIntPipe) limit: number,
  ) {
    return this.notificationsService.findAll(
      (req.user as { id: string }).id,
      page,
      limit,
    );
  }

  @Get('unread-count')
  getUnreadCount(@Req() req: Request) {
    return this.notificationsService.getUnreadCount(
      (req.user as { id: string }).id,
    );
  }

  @Patch('read-all')
  markAllAsRead(@Req() req: Request) {
    return this.notificationsService.markAllAsRead(
      (req.user as { id: string }).id,
    );
  }

  @Patch(':id/read')
  markAsRead(@Req() req: Request, @Param('id') id: string) {
    return this.notificationsService.markAsRead(
      (req.user as { id: string }).id,
      id,
    );
  }
}
