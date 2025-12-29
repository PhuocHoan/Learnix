import { Controller, Post, Body, UseGuards, Req, Get } from '@nestjs/common';

import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RequestWithUser } from '../types/request.interface';

import { CreateCheckoutSessionDto, ProcessPaymentDto } from './dto/payment.dto';
import { PaymentsService } from './payments.service';

@Controller('payments')
@UseGuards(JwtAuthGuard)
export class PaymentsController {
  constructor(private readonly paymentsService: PaymentsService) {}

  @Post('checkout')
  createCheckoutSession(
    @Req() req: RequestWithUser,
    @Body() createDto: CreateCheckoutSessionDto,
  ) {
    return this.paymentsService.createCheckoutSession(req.user.id, createDto);
  }

  @Post('process')
  processPayment(
    @Req() req: RequestWithUser,
    @Body() processDto: ProcessPaymentDto,
  ) {
    return this.paymentsService.processPayment(req.user.id, processDto);
  }

  @Get('history')
  getUserPayments(@Req() req: RequestWithUser) {
    return this.paymentsService.getUserPayments(req.user.id);
  }
}
