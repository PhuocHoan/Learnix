import {
  Injectable,
  NotFoundException,
  Inject,
  forwardRef,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { Notification } from './entities/notification.entity';
import { NotificationType } from './enums/notification-type.enum';
import { NotificationsGateway } from './notifications.gateway';

@Injectable()
export class NotificationsService {
  constructor(
    @InjectRepository(Notification)
    private readonly notificationRepository: Repository<Notification>,
    @Inject(forwardRef(() => NotificationsGateway))
    private readonly gateway: NotificationsGateway,
  ) {}

  async create(
    userId: string,
    title: string,
    message: string,
    type: 'info' | 'success' | 'warning' | 'error' = 'info',
    notificationType?: NotificationType,
    metadata?: Record<string, unknown>,
    link?: string,
  ) {
    const notification = this.notificationRepository.create({
      userId,
      title,
      message,
      type,
      notificationType: notificationType ?? null,
      metadata,
      link: link ?? null,
    });
    const savedNotification =
      await this.notificationRepository.save(notification);

    // Emit via WebSocket for real-time delivery
    this.gateway.emitToUser(userId, savedNotification);

    // Also emit updated unread count
    const { count } = await this.getUnreadCount(userId);
    this.gateway.emitUnreadCount(userId, count);

    return savedNotification;
  }

  async findAll(userId: string, page = 1, limit = 10) {
    const [items, total] = await this.notificationRepository.findAndCount({
      where: { userId },
      order: { createdAt: 'DESC' },
      take: limit,
      skip: (page - 1) * limit,
    });

    const unreadCount = await this.notificationRepository.count({
      where: { userId, isRead: false },
    });

    return {
      items,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
      unreadCount,
    };
  }

  async getUnreadCount(userId: string) {
    const count = await this.notificationRepository.count({
      where: { userId, isRead: false },
    });
    return { count };
  }

  async markAsRead(userId: string, id: string) {
    const notification = await this.notificationRepository.findOne({
      where: { id, userId },
    });

    if (!notification) {
      throw new NotFoundException('Notification not found');
    }

    notification.isRead = true;
    return await this.notificationRepository.save(notification);
  }

  async markAllAsRead(userId: string) {
    await this.notificationRepository.update(
      { userId, isRead: false },
      { isRead: true },
    );
    return { success: true };
  }

  // ===============================================
  // Helper methods for specific notification types
  // ===============================================

  async notifyEnrollment(
    userId: string,
    courseTitle: string,
    courseId: string,
  ) {
    return await this.create(
      userId,
      'Enrolled Successfully! 🎉',
      `You have successfully enrolled in "${courseTitle}". Start learning now!`,
      'success',
      NotificationType.ENROLLMENT,
      { courseTitle, courseId },
      `/courses/${courseId}/learn`,
    );
  }

  async notifyPaymentSuccess(
    studentId: string,
    instructorId: string,
    courseTitle: string,
    amount: number,
    courseId: string,
  ) {
    // Notify student
    await this.create(
      studentId,
      'Payment Successful! 🎉',
      `Your payment of $${amount.toFixed(2)} for "${courseTitle}" was successful. You are now enrolled!`,
      'success',
      NotificationType.PAYMENT_SUCCESS,
      { courseTitle, amount, courseId },
      `/courses/${courseId}/learn`,
    );

    // Notify instructor
    await this.create(
      instructorId,
      'New Student Enrolled! 💰',
      `A student has enrolled in your course "${courseTitle}". Payment: $${amount.toFixed(2)}`,
      'info',
      NotificationType.PAYMENT_SUCCESS,
      { courseTitle, amount, courseId },
      `/instructor/courses/${courseId}/edit`,
    );
  }

  async notifyPaymentFailed(
    userId: string,
    courseTitle: string,
    courseId: string,
  ) {
    return await this.create(
      userId,
      'Payment Failed ❌',
      `Your payment for "${courseTitle}" could not be processed. Please try again or use a different payment method.`,
      'error',
      NotificationType.PAYMENT_FAILED,
      { courseTitle, courseId },
      `/courses/${courseId}`,
    );
  }

  async notifyCourseApproved(
    instructorId: string,
    courseTitle: string,
    courseId: string,
  ) {
    return await this.create(
      instructorId,
      'Course Approved! 🎉',
      `Congratulations! Your course "${courseTitle}" has been approved and is now published.`,
      'success',
      NotificationType.COURSE_APPROVED,
      { courseTitle, courseId },
      `/instructor/courses/${courseId}/edit`,
    );
  }

  async notifyCourseRejected(
    instructorId: string,
    courseTitle: string,
    courseId: string,
    reason?: string,
  ) {
    const message = reason
      ? `Your course "${courseTitle}" was not approved. Reason: ${reason}. Please review and resubmit.`
      : `Your course "${courseTitle}" was not approved. Please review the course content and resubmit.`;

    return await this.create(
      instructorId,
      'Course Needs Revision',
      message,
      'warning',
      NotificationType.COURSE_REJECTED,
      { courseTitle, reason, courseId },
      `/instructor/courses/${courseId}/edit`,
    );
  }

  async notifyCourseSubmitted(
    adminIds: string[],
    courseTitle: string,
    instructorName: string,
    courseId: string,
  ) {
    const notifications = adminIds.map((adminId) =>
      this.create(
        adminId,
        'Course Pending Review 📋',
        `"${courseTitle}" by ${instructorName} is awaiting your review.`,
        'info',
        NotificationType.COURSE_SUBMITTED,
        { courseTitle, instructorName, courseId },
        `/admin/courses?pending=true`,
      ),
    );
    return await Promise.all(notifications);
  }

  async notifyCourseCompleted(
    userId: string,
    courseTitle: string,
    courseId: string,
  ) {
    return await this.create(
      userId,
      'Course Completed! 🏆',
      `Congratulations! You have completed "${courseTitle}". Great job!`,
      'success',
      NotificationType.COURSE_COMPLETED,
      { courseTitle, courseId },
      `/courses/${courseId}`,
    );
  }

  async notifyQuizSubmitted(
    userId: string,
    quizTitle: string,
    score: number,
    percentage: number,
    courseId: string,
    lessonId: string,
  ) {
    const emoji = percentage >= 80 ? '🌟' : percentage >= 60 ? '👍' : '📝';
    return await this.create(
      userId,
      `Quiz Completed ${emoji}`,
      `You scored ${score.toFixed(1)} points (${percentage.toFixed(0)}%) on "${quizTitle}".`,
      'info',
      NotificationType.QUIZ_SUBMITTED,
      { quizTitle, score, percentage, courseId, lessonId },
      `/courses/${courseId}/learn?lesson=${lessonId}`,
    );
  }
}
