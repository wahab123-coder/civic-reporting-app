import {
  Controller, Get, Post, Put, Patch, Delete,
  Param, Body, Query, UseGuards, ParseUUIDPipe, HttpCode, HttpStatus,
} from '@nestjs/common';
import {
  ApiTags, ApiBearerAuth, ApiOperation, ApiQuery,
} from '@nestjs/swagger';
import { ReportsService } from './reports.service';
import { CreateReportDto } from './dto/create-report.dto';
import { UpdateReportDto } from './dto/update-report.dto';
import { UpdateStatusDto } from './dto/update-status.dto';
import { QueryReportDto } from './dto/query-report.dto';
import { ConfirmResolutionDto } from './dto/confirm-resolution.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Public } from '../../common/decorators/public.decorator';
import { User, UserRole } from '../users/entities/user.entity';

@ApiTags('Reports')
@ApiBearerAuth('access-token')
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('reports')
export class ReportsController {
  constructor(private reportsService: ReportsService) {}

  @Post()
  @ApiOperation({ summary: 'Submit a new civic report' })
  create(@Body() dto: CreateReportDto, @CurrentUser() user: User) {
    return this.reportsService.create(dto, user.id);
  }

  @Get()
  @ApiOperation({ summary: 'List reports with filters' })
  findAll(@Query() query: QueryReportDto, @CurrentUser() user: User) {
    return this.reportsService.findAll(query, user);
  }

  @Public()
  @Get('track/:trackingId')
  @ApiOperation({ summary: 'Track complaint by tracking ID (public)' })
  track(@Param('trackingId') trackingId: string) {
    return this.reportsService.trackById(trackingId);
  }

  @Public()
  @Get('map')
  @ApiOperation({ summary: 'Get all report locations for map (public)' })
  getMapData() {
    return this.reportsService.getMapData();
  }

  @Public()
  @Get('nearby')
  @ApiOperation({ summary: 'Get reports near a coordinate (public)' })
  @ApiQuery({ name: 'lat', required: true })
  @ApiQuery({ name: 'lng', required: true })
  @ApiQuery({ name: 'radius', required: false, description: 'Radius in km (default 5)' })
  getNearby(
    @Query('lat') lat: number,
    @Query('lng') lng: number,
    @Query('radius') radius?: number,
  ) {
    return this.reportsService.getNearby(+lat, +lng, radius ? +radius : 5);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a single report by ID' })
  findOne(@Param('id', ParseUUIDPipe) id: string, @CurrentUser() user: User) {
    return this.reportsService.findOne(id, user);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update report details' })
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateReportDto,
    @CurrentUser() user: User,
  ) {
    return this.reportsService.update(id, dto, user);
  }

  @Patch(':id/status')
  @Roles(UserRole.ADMIN, UserRole.GOVERNMENT_OFFICER)
  @ApiOperation({ summary: 'Update report status (admin/officer only)' })
  updateStatus(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateStatusDto,
    @CurrentUser() user: User,
  ) {
    return this.reportsService.updateStatus(id, dto, user);
  }

  @Post(':id/confirm-resolution')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Citizen confirms whether issue is resolved' })
  confirmResolution(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: ConfirmResolutionDto,
    @CurrentUser() user: User,
  ) {
    return this.reportsService.confirmResolution(id, dto, user);
  }

  @Post(':id/evidence')
  @Roles(UserRole.ADMIN, UserRole.GOVERNMENT_OFFICER)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Officer uploads resolution evidence URL' })
  uploadEvidence(
    @Param('id', ParseUUIDPipe) id: string,
    @Body('evidenceUrl') evidenceUrl: string,
    @CurrentUser() user: User,
  ) {
    return this.reportsService.uploadEvidence(id, evidenceUrl, user);
  }

  @Post(':id/upvote')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Upvote a report' })
  upvote(@Param('id', ParseUUIDPipe) id: string) {
    return this.reportsService.upvote(id);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete a report' })
  remove(@Param('id', ParseUUIDPipe) id: string, @CurrentUser() user: User) {
    return this.reportsService.remove(id, user);
  }
}
