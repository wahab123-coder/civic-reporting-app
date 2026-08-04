import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Department } from './entities/department.entity';
import { CreateDepartmentDto } from './dto/create-department.dto';

@Injectable()
export class DepartmentsService {
  constructor(
    @InjectRepository(Department) private deptRepo: Repository<Department>,
  ) {}

  async create(dto: CreateDepartmentDto) {
    const exists = await this.deptRepo.findOne({ where: { name: dto.name } });
    if (exists) throw new ConflictException(`Department "${dto.name}" already exists`);
    const dept = this.deptRepo.create(dto);
    await this.deptRepo.save(dept);
    return { message: 'Department created', data: dept };
  }

  async findAll() {
    const depts = await this.deptRepo.find({
      where: { isActive: true },
      order: { name: 'ASC' },
    });
    return { data: depts };
  }

  async findOne(id: string) {
    const dept = await this.deptRepo.findOne({ where: { id } });
    if (!dept) throw new NotFoundException(`Department #${id} not found`);
    return { data: dept };
  }

  async update(id: string, dto: Partial<CreateDepartmentDto>) {
    const dept = await this.deptRepo.findOne({ where: { id } });
    if (!dept) throw new NotFoundException(`Department #${id} not found`);
    Object.assign(dept, dto);
    await this.deptRepo.save(dept);
    return { message: 'Department updated', data: dept };
  }

  async remove(id: string) {
    const dept = await this.deptRepo.findOne({ where: { id } });
    if (!dept) throw new NotFoundException(`Department #${id} not found`);
    dept.isActive = false;
    await this.deptRepo.save(dept);
    return { message: 'Department deactivated' };
  }
}
