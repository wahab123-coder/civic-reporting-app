import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiQuery } from '@nestjs/swagger';
import { AnalyticsService } from './analytics.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { UserRole } from '../users/entities/user.entity';

@ApiTags('Analytics')
@ApiBearerAuth('access-token')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.ADMIN, UserRole.GOVERNMENT_OFFICER)
@Controller('analytics')
export class AnalyticsController {
  constructor(private analyticsService: AnalyticsService) {}

  @Get('overview')
  @ApiOperation({ summary: 'Get high-level KPIs: totals, resolution rate, avg time' })
  getOverview() {
    return this.analyticsService.getOverview();
  }

  @Get('reports-by-month')
  @ApiOperation({ summary: 'Reports submitted and resolved per month' })
  @ApiQuery({ name: 'year', required: false, example: 2024 })
  getReportsByMonth(@Query('year') year?: number) {
    return this.analyticsService.getReportsByMonth(year ? +year : undefined);
  }

  @Get('by-category')
  @ApiOperation({ summary: 'Report counts grouped by category' })
  getByCategory() {
    return this.analyticsService.getByCategory();
  }

  @Get('resolution-time')
  @ApiOperation({ summary: 'Average resolution time per category (hours)' })
  getResolutionTime() {
    return this.analyticsService.getResolutionTime();
  }

  @Get('department-performance')
  @ApiOperation({ summary: 'Department assignment and resolution performance' })
  getDepartmentPerformance() {
    return this.analyticsService.getDepartmentPerformance();
  }

  @Get('status-trend')
  @ApiOperation({ summary: 'Report status counts over last 12 weeks' })
  getStatusTrend() {
    return this.analyticsService.getStatusTrend();
  }

  @Get('top-cities')
  @ApiOperation({ summary: 'Cities with most reports' })
  @ApiQuery({ name: 'limit', required: false, example: 10 })
  getTopCities(@Query('limit') limit?: number) {
    return this.analyticsService.getTopCities(limit ? +limit : 10);
  }

  @Get('priority-breakdown')
  @ApiOperation({ summary: 'Reports grouped by priority' })
  getPriorityBreakdown() {
    return this.analyticsService.getPriorityBreakdown();
  }

  @Get('recent-activity')
  @ApiOperation({ summary: 'Latest updated reports for activity feed' })
  @ApiQuery({ name: 'limit', required: false, example: 10 })
  getRecentActivity(@Query('limit') limit?: number) {
    return this.analyticsService.getRecentActivity(limit ? +limit : 10);
  }
}
