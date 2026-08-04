import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { Report, ReportStatus } from '../reports/entities/report.entity';
import { User } from '../users/entities/user.entity';

@Injectable()
export class AnalyticsService {
  constructor(
    @InjectRepository(Report) private reportsRepo: Repository<Report>,
    @InjectRepository(User)   private usersRepo:   Repository<User>,
    private dataSource: DataSource,
  ) {}

  // ── Overview KPIs ─────────────────────────────────────────
  async getOverview() {
    const [totalReports, totalUsers] = await Promise.all([
      this.reportsRepo.count(),
      this.usersRepo.count(),
    ]);

    const byStatus = await this.reportsRepo
      .createQueryBuilder('r')
      .select('r.status', 'status')
      .addSelect('COUNT(*)', 'count')
      .groupBy('r.status')
      .getRawMany();

    const resolved = byStatus.find(s => s.status === ReportStatus.RESOLVED)?.count || 0;
    const pending  = byStatus
      .filter(s => ![ReportStatus.RESOLVED, ReportStatus.REJECTED].includes(s.status))
      .reduce((acc, s) => acc + parseInt(s.count), 0);

    // Use camelCase column names (TypeORM auto-maps)
    const resolutionTime = await this.reportsRepo
      .createQueryBuilder('r')
      .select(`AVG(EXTRACT(EPOCH FROM ("resolvedAt" - "createdAt")) / 3600)`, 'avg_hours')
      .where('"resolvedAt" IS NOT NULL')
      .andWhere('r.status = :status', { status: ReportStatus.RESOLVED })
      .getRawOne();

    return {
      data: {
        totalReports,
        totalUsers,
        resolved: parseInt(resolved),
        pending,
        avgResolutionHours: parseFloat(resolutionTime?.avg_hours || 0).toFixed(1),
        byStatus: byStatus.map(s => ({ status: s.status, count: parseInt(s.count) })),
      },
    };
  }

  // ── Reports by Month ──────────────────────────────────────
  async getReportsByMonth(year?: number) {
    const targetYear = year || new Date().getFullYear();

    const rows = await this.reportsRepo
      .createQueryBuilder('r')
      .select(`TO_CHAR("createdAt", 'Mon')`, 'month')
      .addSelect(`EXTRACT(MONTH FROM "createdAt")`, 'month_num')
      .addSelect('COUNT(*)', 'total')
      .addSelect(`SUM(CASE WHEN r.status = 'resolved' THEN 1 ELSE 0 END)`, 'resolved')
      .addSelect(`SUM(CASE WHEN r.status = 'rejected' THEN 1 ELSE 0 END)`, 'rejected')
      .where(`EXTRACT(YEAR FROM "createdAt") = :year`, { year: targetYear })
      .groupBy(`TO_CHAR("createdAt", 'Mon'), EXTRACT(MONTH FROM "createdAt")`)
      .orderBy(`EXTRACT(MONTH FROM "createdAt")`, 'ASC')
      .getRawMany();

    return {
      data: rows.map(r => ({
        month:    r.month,
        total:    parseInt(r.total),
        resolved: parseInt(r.resolved),
        rejected: parseInt(r.rejected),
      })),
    };
  }

  // ── By Category ───────────────────────────────────────────
  async getByCategory() {
    const rows = await this.reportsRepo
      .createQueryBuilder('r')
      .select('r.category', 'category')
      .addSelect('COUNT(*)', 'count')
      .addSelect(`SUM(CASE WHEN r.status = 'resolved' THEN 1 ELSE 0 END)`, 'resolved')
      .groupBy('r.category')
      .orderBy('count', 'DESC')
      .getRawMany();

    return {
      data: rows.map(r => ({
        category: r.category,
        count:    parseInt(r.count),
        resolved: parseInt(r.resolved),
      })),
    };
  }

  // ── Resolution Time by Category ───────────────────────────
  async getResolutionTime() {
    const rows = await this.reportsRepo
      .createQueryBuilder('r')
      .select('r.category', 'category')
      .addSelect(`ROUND(AVG(EXTRACT(EPOCH FROM ("resolvedAt" - "createdAt")) / 3600)::numeric, 1)`, 'avg_hours')
      .addSelect('COUNT(*)', 'total_resolved')
      .where('"resolvedAt" IS NOT NULL')
      .andWhere('r.status = :status', { status: ReportStatus.RESOLVED })
      .groupBy('r.category')
      .orderBy('avg_hours', 'ASC')
      .getRawMany();

    return {
      data: rows.map(r => ({
        category:      r.category,
        avgHours:      parseFloat(r.avg_hours || 0),
        totalResolved: parseInt(r.total_resolved),
      })),
    };
  }

  // ── Department Performance ────────────────────────────────
  async getDepartmentPerformance() {
    const rows = await this.dataSource.query(`
      SELECT
        d.name AS department,
        COUNT(a.id) AS total_assigned,
        SUM(CASE WHEN r.status = 'resolved' THEN 1 ELSE 0 END) AS resolved,
        ROUND(
          SUM(CASE WHEN r.status = 'resolved' THEN 1 ELSE 0 END)::numeric
          / NULLIF(COUNT(a.id), 0) * 100, 1
        ) AS resolution_rate,
        ROUND(AVG(
          CASE WHEN r."resolvedAt" IS NOT NULL
            THEN EXTRACT(EPOCH FROM (r."resolvedAt" - r."createdAt")) / 3600
          END
        )::numeric, 1) AS avg_resolution_hours
      FROM assignments a
      JOIN departments d ON a.department_id = d.id
      JOIN reports r ON a.report_id = r.id
      GROUP BY d.name
      ORDER BY resolved DESC
    `);

    return {
      data: rows.map((r: any) => ({
        department:         r.department,
        totalAssigned:      parseInt(r.total_assigned),
        resolved:           parseInt(r.resolved),
        resolutionRate:     parseFloat(r.resolution_rate  || 0),
        avgResolutionHours: parseFloat(r.avg_resolution_hours || 0),
      })),
    };
  }

  // ── Status Trend ──────────────────────────────────────────
  async getStatusTrend() {
    const rows = await this.reportsRepo
      .createQueryBuilder('r')
      .select(`DATE_TRUNC('week', "createdAt")`, 'week')
      .addSelect('r.status', 'status')
      .addSelect('COUNT(*)', 'count')
      .where(`"createdAt" >= NOW() - INTERVAL '12 weeks'`)
      .groupBy(`DATE_TRUNC('week', "createdAt"), r.status`)
      .orderBy('week', 'ASC')
      .getRawMany();

    return { data: rows };
  }

  // ── Top Cities ────────────────────────────────────────────
  async getTopCities(limit = 10) {
    const rows = await this.reportsRepo
      .createQueryBuilder('r')
      .select('r.city', 'city')
      .addSelect('COUNT(*)', 'count')
      .where('r.city IS NOT NULL')
      .groupBy('r.city')
      .orderBy('count', 'DESC')
      .limit(limit)
      .getRawMany();

    return { data: rows.map(r => ({ city: r.city, count: parseInt(r.count) })) };
  }

  // ── Priority Breakdown ────────────────────────────────────
  async getPriorityBreakdown() {
    const rows = await this.reportsRepo
      .createQueryBuilder('r')
      .select('r.priority', 'priority')
      .addSelect('COUNT(*)', 'count')
      .groupBy('r.priority')
      .orderBy('count', 'DESC')
      .getRawMany();

    return { data: rows.map(r => ({ priority: r.priority, count: parseInt(r.count) })) };
  }

  // ── Recent Activity ───────────────────────────────────────
  async getRecentActivity(limit = 10) {
    const reports = await this.reportsRepo.find({
      order: { updatedAt: 'DESC' },
      take: limit,
      select: ['id', 'trackingId', 'title', 'category', 'status', 'city', 'updatedAt'],
    });
    return { data: reports };
  }

  // ── All Complaints with full details (admin) ──────────────
  async getAllComplaints(page = 1, limit = 20, status?: string) {
    const qb = this.reportsRepo
      .createQueryBuilder('r')
      .leftJoinAndSelect('r.user', 'u')
      .orderBy('r.createdAt', 'DESC')
      .skip((page - 1) * limit)
      .take(limit);

    if (status) qb.where('r.status = :status', { status });

    const [reports, total] = await qb.getManyAndCount();

    // Get comments for each report
    const result = await Promise.all(reports.map(async (r) => {
      const comments = await this.dataSource.query(
        `SELECT c.*, u.name as user_name, u.role as user_role
         FROM comments c
         LEFT JOIN users u ON c.user_id = u.id
         WHERE c.report_id = $1
         ORDER BY c."createdAt" ASC`,
        [r.id],
      );
      return { ...r, comments };
    }));

    return {
      data: result,
      meta: { total, page, limit, totalPages: Math.ceil(total / limit) },
    };
  }

  // ── Citizen complaint summary ─────────────────────────────
  async getCitizenSummary(userId: string) {
    const reports = await this.reportsRepo.find({
      where: { userId },
      order: { createdAt: 'DESC' },
      take: 5,
    });

    const counts = await this.reportsRepo
      .createQueryBuilder('r')
      .select('r.status', 'status')
      .addSelect('COUNT(*)', 'count')
      .where('r.userId = :userId', { userId })
      .groupBy('r.status')
      .getRawMany();

    return {
      data: {
        recentReports: reports,
        statusCounts: counts.map(c => ({ status: c.status, count: parseInt(c.count) })),
      },
    };
  }
}
