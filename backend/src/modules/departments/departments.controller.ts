import {
  Controller, Get, Post, Patch, Delete,
  Param, Body, UseGuards, ParseUUIDPipe,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { DepartmentsService } from './departments.service';
import { CreateDepartmentDto } from './dto/create-department.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { Public } from '../../common/decorators/public.decorator';
import { UserRole } from '../users/entities/user.entity';

@ApiTags('Departments')
@ApiBearerAuth('access-token')
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('departments')
export class DepartmentsController {
  constructor(private deptService: DepartmentsService) {}

  @Post()
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Create a department (admin only)' })
  create(@Body() dto: CreateDepartmentDto) {
    return this.deptService.create(dto);
  }

  @Public()
  @Get()
  @ApiOperation({ summary: 'List all active departments' })
  findAll() {
    return this.deptService.findAll();
  }

  @Public()
  @Get(':id')
  @ApiOperation({ summary: 'Get a department by ID' })
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.deptService.findOne(id);
  }

  @Patch(':id')
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Update a department (admin only)' })
  update(@Param('id', ParseUUIDPipe) id: string, @Body() dto: Partial<CreateDepartmentDto>) {
    return this.deptService.update(id, dto);
  }

  @Delete(':id')
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Deactivate a department (admin only)' })
  remove(@Param('id', ParseUUIDPipe) id: string) {
    return this.deptService.remove(id);
  }
}
