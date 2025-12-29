import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { CoursesService } from '../courses/courses.service';
import { Course } from '../courses/entities/course.entity';
import { NotificationsService } from '../notifications/notifications.service';

import { CreateCheckoutSessionDto, ProcessPaymentDto } from './dto/payment.dto';
import { Payment, PaymentStatus } from './entities/payment.entity';

@Injectable()
export class PaymentsService {
  constructor(
    @InjectRepository(Payment)
    private paymentsRepository: Repository<Payment>,
    @InjectRepository(Course)
    private coursesRepository: Repository<Course>,
    private coursesService: CoursesService,
    private notificationsService: NotificationsService,
  ) {}

  async createCheckoutSession(
    userId: string,
    createDto: CreateCheckoutSessionDto,
  ) {
    const course = await this.coursesRepository.findOne({
      where: { id: createDto.courseId },
    });

    if (!course) {
      throw new NotFoundException('Course not found');
    }

    // Check if user is already enrolled
    const existingEnrollment = await this.coursesService.checkEnrollment(
      userId,
      course.id,
    );
    if (existingEnrollment) {
      throw new BadRequestException('User is already enrolled in this course');
    }

    const payment = this.paymentsRepository.create({
      userId,
      courseId: course.id,
      amount: course.price,
      currency: 'USD',
      status: PaymentStatus.PENDING,
    });

    return await this.paymentsRepository.save(payment);
  }

  async processPayment(userId: string, processDto: ProcessPaymentDto) {
    const payment = await this.paymentsRepository.findOne({
      where: { id: processDto.paymentId, userId },
      relations: ['course', 'course.instructor'],
    });

    if (!payment) {
      throw new NotFoundException('Payment session not found');
    }

    if (payment.status === PaymentStatus.COMPLETED) {
      throw new BadRequestException('Payment already completed');
    }

    // SIMULATE PAYMENT PROCESSING
    // In a real app, we would talk to Stripe/PayPal here.
    // For this mock, we just check if the card number isn't "failure"

    // Check if the card number is the specific mock failure number
    // Front-end sends it clean (no spaces), so we check against clean version '4000000000000000'
    const isSuccess = processDto.cardDetails.cardNumber !== '4000000000000000'; // Mock failure card

    if (isSuccess) {
      payment.status = PaymentStatus.COMPLETED;
      payment.transactionId = `txn_${Date.now()}_${Math.floor(Math.random() * 1000)}`;
      payment.method = 'credit_card'; // Simplified

      await this.paymentsRepository.save(payment);

      // Enroll the user
      await this.coursesService.enroll(userId, payment.courseId);

      // Send payment success notifications to student and instructor
      await this.notificationsService.notifyPaymentSuccess(
        userId,
        payment.course.instructorId,
        payment.course.title,
        Number(payment.amount),
        payment.courseId,
      );

      return { success: true, payment };
    }
    payment.status = PaymentStatus.FAILED;
    await this.paymentsRepository.save(payment);

    // Send payment failed notification to student
    await this.notificationsService.notifyPaymentFailed(
      userId,
      payment.course.title,
      payment.courseId,
    );

    throw new BadRequestException('Payment rejected by card issuer');
  }

  async getUserPayments(userId: string) {
    return await this.paymentsRepository.find({
      where: { userId },
      relations: ['course'],
      order: { createdAt: 'DESC' },
    });
  }
}
