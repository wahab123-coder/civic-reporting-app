import {
  Injectable, NotFoundException, ForbiddenException, BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { Report, ReportStatus, ReportCategory } from './entities/report.entity';
import { Department } from '../departments/entities/department.entity';
import { User, UserRole } from '../users/entities/user.entity';
import { CreateReportDto } from './dto/create-report.dto';
import { UpdateReportDto } from './dto/update-report.dto';
import { UpdateStatusDto } from './dto/update-status.dto';
import { QueryReportDto } from './dto/query-report.dto';
import { ConfirmResolutionDto } from './dto/confirm-resolution.dto';
import { NotificationsService } from '../notifications/notifications.service';
import { NotificationType } from '../notifications/entities/notification.entity';

// ── Category → Department name mapping ───────────────────
const CATEGORY_DEPARTMENT_MAP: Record<ReportCategory, string> = {
  [ReportCategory.POTHOLE]:              'Roads & Infrastructure',
  [ReportCategory.DRAINAGE]:             'Water & Sanitation',
  [ReportCategory.ILLEGAL_DUMPING]:      'Environment & Waste',
  [ReportCategory.TRAFFIC_LIGHT]:        'Roads & Infrastructure',
  [ReportCategory.WATER_LEAKAGE]:        'Water & Sanitation',
  [ReportCategory.POWER_OUTAGE]:         'Power & Utilities',
  [ReportCategory.ENVIRONMENTAL_HAZARD]: 'Environment & Waste',
  [ReportCategory.SECURITY]:             'Public Safety',
  [ReportCategory.CORRUPTION]:           'Anti-Corruption Unit',
  [ReportCategory.OTHER]:                'Roads & Infrastructure',
};

// ── Valid status transitions ──────────────────────────────
const STATUS_TRANSITIONS: Record<ReportStatus, ReportStatus[]> = {
  [ReportStatus.SUBMITTED]:   [ReportStatus.VERIFIED, ReportStatus.REJECTED],
  [ReportStatus.VERIFIED]:    [ReportStatus.ASSIGNED, ReportStatus.REJECTED],
  [ReportStatus.ASSIGNED]:    [ReportStatus.IN_PROGRESS, ReportStatus.REJECTED],
  [ReportStatus.IN_PROGRESS]: [ReportStatus.RESOLVED, ReportStatus.REJECTED],
  [ReportStatus.RESOLVED]:    [],
  [ReportStatus.REJECTED]:    [],
};

@Injectable()
export class ReportsService {
  constructor(
    @InjectRepository(Report) private reportsRepo: Repository<Report>,
    @InjectRepository(Department) private deptRepo: Repository<Department>,
    private dataSource: DataSource,
    private notificationsService: NotificationsService,
  ) {}

  // ── Generate tracking ID e.g. CIV-2024-000123 ────────────
  private async generateTrackingId(): Promise<string> {
    const year = new Date().getFullYear();
    const count = await this.reportsRepo.count();
    const seq = String(count + 1).padStart(6, '0');
    return `CIV-${year}-${seq}`;
  }

  // ── Auto-route to department based on category ────────────
  private async autoRoute(category: ReportCategory): Promise<string | null> {
    const deptName = CATEGORY_DEPARTMENT_MAP[category];
    if (!deptName) return null;
    const dept = await this.deptRepo.findOne({
      where: { name: deptName, isActive: true },
    });
    return dept?.id || null;
  }

  // ── Create ────────────────────────────────────────────────
  async create(dto: CreateReportDto, userId: string) {
    const trackingId = await this.generateTrackingId();
    const autoRoutedDepartmentId = await this.autoRoute(dto.category);

    const report = this.reportsRepo.create({
      ...dto,
      userId: dto.isAnonymous ? null : userId,
      trackingId,
      autoRoutedDepartmentId,
      status: ReportStatus.SUBMITTED,
    });
    await this.reportsRepo.save(report);

    // Auto-assign to department if found
    if (autoRoutedDepartmentId) {
      await this.dataSource.query(
        `INSERT INTO assignments (id, report_id, department_id, created_at, updated_at, "reportId", "departmentId")
         VALUES (uuid_generate_v4(), $1, $2, NOW(), NOW(), $1, $2)
         ON CONFLICT DO NOTHING`,
        [report.id, autoRoutedDepartmentId],
      );
      // Update status to assigned
      report.status = ReportStatus.ASSIGNED;
      await this.reportsRepo.save(report);
    }

    // Notify citizen
    if (!dto.isAnonymous && userId) {
      const user = await this.dataSource.query(
        'SELECT fcm_token FROM users WHERE id = $1', [userId],
      );
      await this.notificationsService.create({
        userId,
        title: '📬 Complaint Received!',
        body: `Your complaint "${dto.title}" has been received. Tracking ID: ${trackingId}`,
        type: NotificationType.REPORT_SUBMITTED,
        referenceId: report.id,
        referenceType: 'report',
        fcmToken: user[0]?.fcm_token,
      });
    }

    return {
      message: 'Complaint submitted successfully',
      data: {
        ...report,
        trackingId,
        autoRouted: !!autoRoutedDepartmentId,
        message: autoRoutedDepartmentId
          ? `Automatically routed to ${CATEGORY_DEPARTMENT_MAP[dto.category]}`
          : 'Pending manual assignment',
      },
    };
  }

  // ── Find All ──────────────────────────────────────────────
  async findAll(query: QueryReportDto, user: User) {
    const {
      page = 1, limit = 20, status, category, priority,
      search, city, state, dateFrom, dateTo, userId,
      lat, lng, radius = 5, sortBy = 'createdAt', sortOrder = 'DESC',
    } = query;

    const qb = this.reportsRepo
      .createQueryBuilder('r')
      .leftJoinAndSelect('r.user', 'user')
      .select([
        'r.id', 'r.trackingId', 'r.title', 'r.category', 'r.status', 'r.priority',
        'r.latitude', 'r.longitude', 'r.address', 'r.city', 'r.state',
        'r.isAnonymous', 'r.upvotes', 'r.citizenConfirmed', 'r.createdAt', 'r.updatedAt',
        'user.id', 'user.name', 'user.avatar',
      ]);

    if (user.role === UserRole.CITIZEN) {
      qb.where('r.userId = :uid', { uid: user.id });
    } else {
      if (userId) qb.andWhere('r.userId = :uid', { uid: userId });
    }

    if (status)   qb.andWhere('r.status = :status', { status });
    if (category) qb.andWhere('r.category = :category', { category });
    if (priority) qb.andWhere('r.priority = :priority', { priority });
    if (city)     qb.andWhere('r.city ILIKE :city', { city: `%${city}%` });
    if (state)    qb.andWhere('r.state ILIKE :state', { state: `%${state}%` });
    if (search)   qb.andWhere(
      '(r.title ILIKE :s OR r.trackingId ILIKE :s OR r.description ILIKE :s)',
      { s: `%${search}%` },
    );
    if (dateFrom) qb.andWhere('r.createdAt >= :dateFrom', { dateFrom: new Date(dateFrom) });
    if (dateTo)   qb.andWhere('r.createdAt <= :dateTo',   { dateTo:   new Date(dateTo) });
    if (lat && lng) {
      qb.andWhere(
        `ST_DWithin(r.location::geography, ST_SetSRID(ST_MakePoint(:lng,:lat),4326)::geography, :radius)`,
        { lat, lng, radius: radius * 1000 },
      );
    }

    const allowedSort = ['createdAt','updatedAt','status','priority','upvotes'];
    const safeSort = allowedSort.includes(sortBy) ? `r.${sortBy}` : 'r.createdAt';
    qb.orderBy(safeSort, sortOrder === 'ASC' ? 'ASC' : 'DESC');
    qb.skip((page - 1) * limit).take(limit);

    const [reports, total] = await qb.getManyAndCount();
    return {
      data: reports,
      meta: { total, page, limit, totalPages: Math.ceil(total / limit) },
    };
  }

  // ── Find One ──────────────────────────────────────────────
  async findOne(id: string, user?: User) {
    const report = await this.reportsRepo
      .createQueryBuilder('r')
      .leftJoinAndSelect('r.user', 'u')
      .where('r.id = :id OR r.trackingId = :id', { id })
      .getOne();

    if (!report) throw new NotFoundException(`Report not found`);

    if (user?.role === UserRole.CITIZEN && report.userId && report.userId !== user.id) {
      throw new ForbiddenException('Access denied');
    }

    return { data: report };
  }

  // ── Track by tracking ID (public) ─────────────────────────
  async trackById(trackingId: string) {
    const report = await this.reportsRepo.findOne({ where: { trackingId } });
    if (!report) throw new NotFoundException(`No complaint found with tracking ID: ${trackingId}`);
    return {
      data: {
        trackingId: report.trackingId,
        title: report.title,
        category: report.category,
        status: report.status,
        priority: report.priority,
        city: report.city,
        createdAt: report.createdAt,
        updatedAt: report.updatedAt,
        resolvedAt: report.resolvedAt,
        citizenConfirmed: report.citizenConfirmed,
      },
    };
  }

  // ── Update ────────────────────────────────────────────────
  async update(id: string, dto: UpdateReportDto, user: User) {
    const report = await this.reportsRepo.findOne({ where: { id } });
    if (!report) throw new NotFoundException(`Report not found`);
    if (user.role === UserRole.CITIZEN && report.userId !== user.id)
      throw new ForbiddenException('You can only update your own reports');
    if (user.role === UserRole.CITIZEN && report.status !== ReportStatus.SUBMITTED)
      throw new BadRequestException('Cannot edit a report already in processing');
    Object.assign(report, dto);
    await this.reportsRepo.save(report);
    return { message: 'Report updated', data: report };
  }

  // ── Update Status (with notification at every stage) ─────
  async updateStatus(id: string, dto: UpdateStatusDto, officer: User) {
    const report = await this.reportsRepo.findOne({ where: { id } });
    if (!report) throw new NotFoundException(`Report not found`);

    const allowed = STATUS_TRANSITIONS[report.status];
    if (!allowed.includes(dto.status)) {
      throw new BadRequestException(
        `Cannot transition from "${report.status}" to "${dto.status}". Allowed: ${allowed.join(', ') || 'none'}`,
      );
    }

    report.status = dto.status;
    if (dto.status === ReportStatus.RESOLVED) {
      report.resolvedAt = new Date();
      report.resolutionNote = dto.note;
      if (dto.evidenceUrl) report.resolutionEvidenceUrl = dto.evidenceUrl;
    }
    if (dto.status === ReportStatus.REJECTED) {
      report.rejectionReason = dto.note;
    }
    await this.reportsRepo.save(report);

    // Notify citizen at every stage
    if (report.userId) {
      const user = await this.dataSource.query(
        'SELECT fcm_token FROM users WHERE id = $1', [report.userId],
      );
      await this.notificationsService.notifyReportStatusChange(
        report.userId,
        report.id,
        dto.status,
        user[0]?.fcm_token,
      );
    }

    return {
      message: `Complaint status updated to "${dto.status}"`,
      data: report,
    };
  }

  // ── Citizen confirms resolution ───────────────────────────
  async confirmResolution(id: string, dto: ConfirmResolutionDto, user: User) {
    const report = await this.reportsRepo.findOne({ where: { id } });
    if (!report) throw new NotFoundException(`Report not found`);
    if (report.userId !== user.id)
      throw new ForbiddenException('You can only confirm your own reports');
    if (report.status !== ReportStatus.RESOLVED)
      throw new BadRequestException('This report has not been marked as resolved yet');
    if (report.citizenConfirmed !== null && report.citizenConfirmed !== undefined)
      throw new BadRequestException('You have already submitted your confirmation');

    report.citizenConfirmed   = dto.confirmed;
    report.citizenConfirmedAt = new Date();
    report.citizenFeedback    = dto.feedback;

    if (!dto.confirmed) {
      report.status     = ReportStatus.IN_PROGRESS;
      report.resolvedAt = null;
      // Notify admin
      const admins = await this.dataSource.query(
        `SELECT id, fcm_token FROM users WHERE role = 'admin' LIMIT 5`,
      );
      for (const admin of admins) {
        await this.notificationsService.create({
          userId: admin.id,
          title: '⚠️ Resolution Disputed',
          body: `Citizen disputed resolution for complaint ${report.trackingId}: "${report.title}"`,
          type: NotificationType.SYSTEM,
          referenceId: report.id,
          referenceType: 'report',
          fcmToken: admin.fcm_token,
        });
      }
    }

    await this.reportsRepo.save(report);
    return {
      message: dto.confirmed
        ? 'Thank you for confirming! The complaint is now closed.'
        : 'Noted. The complaint has been reopened for further action.',
      data: report,
    };
  }

  // ── Upload resolution evidence ────────────────────────────
  async uploadEvidence(id: string, evidenceUrl: string, officer: User) {
    const report = await this.reportsRepo.findOne({ where: { id } });
    if (!report) throw new NotFoundException(`Report not found`);
    report.resolutionEvidenceUrl = evidenceUrl;
    await this.reportsRepo.save(report);
    return { message: 'Evidence uploaded', data: report };
  }

  // ── Upvote ────────────────────────────────────────────────
  async upvote(id: string) {
    const report = await this.reportsRepo.findOne({ where: { id } });
    if (!report) throw new NotFoundException(`Report not found`);
    await this.reportsRepo.increment({ id }, 'upvotes', 1);
    return { message: 'Upvoted', data: { upvotes: report.upvotes + 1 } };
  }

  // ── Delete ────────────────────────────────────────────────
  async remove(id: string, user: User) {
    const report = await this.reportsRepo.findOne({ where: { id } });
    if (!report) throw new NotFoundException(`Report not found`);
    if (user.role === UserRole.CITIZEN && report.userId !== user.id)
      throw new ForbiddenException('You can only delete your own reports');
    if (user.role === UserRole.CITIZEN && report.status !== ReportStatus.SUBMITTED)
      throw new BadRequestException('Cannot delete a report already in processing');
    await this.reportsRepo.remove(report);
    return { message: 'Report deleted' };
  }

  // ── Map data ──────────────────────────────────────────────
  async getMapData() {
    const reports = await this.reportsRepo
      .createQueryBuilder('r')
      .select(['r.id','r.trackingId','r.title','r.category','r.status','r.latitude','r.longitude','r.priority'])
      .where('r.latitude IS NOT NULL AND r.longitude IS NOT NULL')
      .andWhere('r.status NOT IN (:...s)', { s: [ReportStatus.REJECTED] })
      .getMany();
    return { data: reports };
  }

  // ── Nearby ────────────────────────────────────────────────
  async getNearby(lat: number, lng: number, radius = 5) {
    const reports = await this.reportsRepo
      .createQueryBuilder('r')
      .select(['r.id','r.trackingId','r.title','r.category','r.status','r.latitude','r.longitude','r.address','r.createdAt'])
      .where(`ST_DWithin(r.location::geography, ST_SetSRID(ST_MakePoint(:lng,:lat),4326)::geography, :radius)`,
        { lat, lng, radius: radius * 1000 })
      .andWhere('r.status != :rej', { rej: ReportStatus.REJECTED })
      .orderBy('r.createdAt', 'DESC')
      .take(200)
      .getMany();
    return { data: reports };
  }
}
