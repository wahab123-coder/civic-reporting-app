import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsNumber, IsOptional, IsString, Min } from 'class-validator';
import { Type } from 'class-transformer';
import { ReportCategory, ReportPriority, ReportStatus } from '../entities/report.entity';

export class QueryReportDto {
  @ApiPropertyOptional({ default: 1 })
  @Type(() => Number) @IsNumber() @Min(1) @IsOptional()
  page?: number = 1;

  @ApiPropertyOptional({ default: 20 })
  @Type(() => Number) @IsNumber() @Min(1) @IsOptional()
  limit?: number = 20;

  @ApiPropertyOptional({ enum: ReportStatus })
  @IsEnum(ReportStatus) @IsOptional()
  status?: ReportStatus;

  @ApiPropertyOptional({ enum: ReportCategory })
  @IsEnum(ReportCategory) @IsOptional()
  category?: ReportCategory;

  @ApiPropertyOptional({ enum: ReportPriority })
  @IsEnum(ReportPriority) @IsOptional()
  priority?: ReportPriority;

  @ApiPropertyOptional({ example: 'pothole' })
  @IsString() @IsOptional()
  search?: string;

  @ApiPropertyOptional({ example: 'Lagos' })
  @IsString() @IsOptional()
  city?: string;

  @ApiPropertyOptional({ example: 'Lagos State' })
  @IsString() @IsOptional()
  state?: string;

  @ApiPropertyOptional({ example: '2024-01-01' })
  @IsString() @IsOptional()
  dateFrom?: string;

  @ApiPropertyOptional({ example: '2024-12-31' })
  @IsString() @IsOptional()
  dateTo?: string;

  @ApiPropertyOptional({ description: 'Filter by user ID' })
  @IsString() @IsOptional()
  userId?: string;

  // Geo-proximity search
  @ApiPropertyOptional({ example: 6.5244 })
  @Type(() => Number) @IsNumber() @IsOptional()
  lat?: number;

  @ApiPropertyOptional({ example: 3.3792 })
  @Type(() => Number) @IsNumber() @IsOptional()
  lng?: number;

  @ApiPropertyOptional({ example: 5, description: 'Radius in km for proximity search' })
  @Type(() => Number) @IsNumber() @IsOptional()
  radius?: number;

  @ApiPropertyOptional({ example: 'createdAt', default: 'createdAt' })
  @IsString() @IsOptional()
  sortBy?: string = 'createdAt';

  @ApiPropertyOptional({ example: 'DESC', default: 'DESC' })
  @IsString() @IsOptional()
  sortOrder?: 'ASC' | 'DESC' = 'DESC';
}
