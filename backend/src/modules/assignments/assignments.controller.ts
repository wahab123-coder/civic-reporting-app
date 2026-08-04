import {
  Controller, Get, Post, Patch, Param, Body,
  Query, UseGuards, ParseUUIDPipe,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { AssignmentsService } from './assignments.service';
import { CreateAssignmentDto } from './dto/create-assignment.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { User, UserRole } from '../users/entities/user.entity';

@ApiTags('Assignments')
@ApiBearerAuth('access-token')
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('assignments')
export class AssignmentsController {
  constructor(private assignmentsService: AssignmentsService) {}

  @Post()
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Assign a report to a department/officer (admin only)' })
  create(@Body() dto: CreateAssignmentDto, @CurrentUser() user: User) {
    return this.assignmentsService.create(dto, user.id);
  }

  @Get('report/:reportId')
  @ApiOperation({ summary: 'Get assignments for a report' })
  findByReport(@Param('reportId', ParseUUIDPipe) reportId: string) {
    return this.assignmentsService.findByReport(reportId);
  }

  @Get('department/:departmentId')
  @Roles(UserRole.ADMIN, UserRole.GOVERNMENT_OFFICER)
  @ApiOperation({ summary: 'Get assignments for a department' })
  findByDepartment(
    @Param('departmentId', ParseUUIDPipe) departmentId: string,
    @Query('page') page?: number,
    @Query('limit') limit?: number,
  ) {
    return this.assignmentsService.findByDepartment(departmentId, +page || 1, +limit || 20);
  }

  @Get('officer/my')
  @Roles(UserRole.GOVERNMENT_OFFICER)
  @ApiOperation({ summary: 'Get assignments for the current officer' })
  findMine(@CurrentUser() user: User, @Query('page') page?: number, @Query('limit') limit?: number) {
    return this.assignmentsService.findByOfficer(user.id, +page || 1, +limit || 20);
  }

  @Patch(':id')
  @Roles(UserRole.ADMIN, UserRole.GOVERNMENT_OFFICER)
  @ApiOperation({ summary: 'Update an assignment' })
  update(@Param('id', ParseUUIDPipe) id: string, @Body() dto: Partial<CreateAssignmentDto>) {
    return this.assignmentsService.update(id, dto);
  }
}
