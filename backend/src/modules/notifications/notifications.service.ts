import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ConfigService } from '@nestjs/config';
import { Notification, NotificationType } from './entities/notification.entity';
import * as admin from 'firebase-admin';

@Injectable()
export class NotificationsService {
  private firebaseInitialized = false;

  constructor(
    @InjectRepository(Notification) private notifRepo: Repository<Notification>,
    private configService: ConfigService,
  ) {
    this.initFirebase();
  }

  private initFirebase() {
    const projectId = this.configService.get('firebase.projectId');
    const clientEmail = this.configService.get('firebase.clientEmail');
    const privateKey = this.configService.get('firebase.privateKey');

    if (!projectId || !clientEmail || !privateKey) {
      console.warn('[Firebase] Credentials not configured — push notifications disabled');
      return;
    }

    try {
      if (!admin.apps.length) {
        admin.initializeApp({
          credential: admin.credential.cert({ projectId, clientEmail, privateKey }),
        });
        this.firebaseInitialized = true;
        console.log('[Firebase] Initialized successfully');
      }
    } catch (err) {
      console.warn('[Firebase] Failed to initialize — push notifications disabled:', err.message);
    }
  }

  async create(payload: {
    userId: string;
    title: string;
    body: string;
    type: NotificationType;
    referenceId?: string;
    referenceType?: string;
    fcmToken?: string;
  }) {
    const notif = this.notifRepo.create({
      userId: payload.userId,
      title: payload.title,
      body: payload.body,
      type: payload.type,
      referenceId: payload.referenceId,
      referenceType: payload.referenceType,
    });
    await this.notifRepo.save(notif);

    // Push notification via FCM
    if (payload.fcmToken && this.firebaseInitialized) {
      try {
        await admin.messaging().send({
          token: payload.fcmToken,
          notification: { title: payload.title, body: payload.body },
          data: {
            type: payload.type,
            referenceId: payload.referenceId || '',
            referenceType: payload.referenceType || '',
          },
        });
      } catch (err) {
        console.warn('FCM push failed:', err.message);
      }
    }

    return notif;
  }

  async findByUser(userId: string, page = 1, limit = 20) {
    const [notifications, total] = await this.notifRepo.findAndCount({
      where: { userId },
      order: { createdAt: 'DESC' },
      skip: (page - 1) * limit,
      take: limit,
    });

    const unreadCount = await this.notifRepo.count({
      where: { userId, isRead: false },
    });

    return {
      data: notifications,
      meta: { total, page, limit, totalPages: Math.ceil(total / limit), unreadCount },
    };
  }

  async markAsRead(id: string, userId: string) {
    const notif = await this.notifRepo.findOne({ where: { id, userId } });
    if (!notif) throw new NotFoundException(`Notification #${id} not found`);
    notif.isRead = true;
    await this.notifRepo.save(notif);
    return { message: 'Notification marked as read' };
  }

  async markAllAsRead(userId: string) {
    await this.notifRepo.update({ userId, isRead: false }, { isRead: true });
    return { message: 'All notifications marked as read' };
  }

  async getUnreadCount(userId: string) {
    const count = await this.notifRepo.count({ where: { userId, isRead: false } });
    return { data: { count } };
  }

  async notifyReportStatusChange(
    userId: string,
    reportId: string,
    status: string,
    fcmToken?: string,
  ) {
    const messages: Record<string, { title: string; body: string; type: NotificationType }> = {
      verified: {
        title: 'Report Verified ✅',
        body: 'Your report has been verified and is being reviewed.',
        type: NotificationType.REPORT_VERIFIED,
      },
      assigned: {
        title: 'Report Assigned 📋',
        body: 'Your report has been assigned to the relevant department.',
        type: NotificationType.REPORT_ASSIGNED,
      },
      in_progress: {
        title: 'Work In Progress 🔧',
        body: 'Work has started on your reported issue.',
        type: NotificationType.REPORT_IN_PROGRESS,
      },
      resolved: {
        title: 'Issue Resolved ✅',
        body: 'Great news! Your reported issue has been resolved.',
        type: NotificationType.REPORT_RESOLVED,
      },
      rejected: {
        title: 'Report Rejected ❌',
        body: 'Your report was reviewed and could not be processed.',
        type: NotificationType.REPORT_REJECTED,
      },
    };

    const msg = messages[status];
    if (!msg) return;

    return this.create({
      userId,
      title: msg.title,
      body: msg.body,
      type: msg.type,
      referenceId: reportId,
      referenceType: 'report',
      fcmToken,
    });
  }
}
