import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { Assignment } from './entities/assignment.entity';
import { Report, ReportStatus } from '../reports/entities/report.entity';
import { CreateAssignmentDto } from './dto/create-assignment.dto';

@Injectable()
export class AssignmentsService {
  constructor(
    @InjectRepository(Assignment) private assignRepo: Repository<Assignment>,
    @InjectRepository(Report) private reportRepo: Repository<Report>,
  ) {}

  async create(dto: CreateAssignmentDto, assignedById: string) {
    // Update the report status to ASSIGNED
    const report = await this.reportRepo.findOne({ where: { id: dto.reportId } });
    if (!report) throw new NotFoundException(`Report #${dto.reportId} not found`);

    const assignment = this.assignRepo.create({
      reportId: dto.reportId,
      departmentId: dto.departmentId,
      assignedToId: dto.assignedToId,
      assignedById,
      notes: dto.notes,
      dueDate: dto.dueDate ? new Date(dto.dueDate) : null,
    });

    report.status = ReportStatus.ASSIGNED;
    await this.reportRepo.save(report);
    await this.assignRepo.save(assignment);

    return { message: 'Report assigned successfully', data: assignment };
  }

  async findByReport(reportId: string) {
    const assignments = await this.assignRepo.find({
      where: { reportId },
      order: { createdAt: 'DESC' },
    });
    return { data: assignments };
  }

  async findByDepartment(departmentId: string, page = 1, limit = 20) {
    const [assignments, total] = await this.assignRepo.findAndCount({
      where: { departmentId },
      order: { createdAt: 'DESC' },
      skip: (page - 1) * limit,
      take: limit,
    });
    return {
      data: assignments,
      meta: { total, page, limit, totalPages: Math.ceil(total / limit) },
    };
  }

  async findByOfficer(assignedToId: string, page = 1, limit = 20) {
    const [assignments, total] = await this.assignRepo.findAndCount({
      where: { assignedToId },
      order: { createdAt: 'DESC' },
      skip: (page - 1) * limit,
      take: limit,
    });
    return {
      data: assignments,
      meta: { total, page, limit, totalPages: Math.ceil(total / limit) },
    };
  }

  async update(id: string, dto: Partial<CreateAssignmentDto>) {
    const assignment = await this.assignRepo.findOne({ where: { id } });
    if (!assignment) throw new NotFoundException(`Assignment #${id} not found`);
    Object.assign(assignment, dto);
    await this.assignRepo.save(assignment);
    return { message: 'Assignment updated', data: assignment };
  }
}
