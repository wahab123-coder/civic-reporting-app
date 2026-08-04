import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsEnum, IsNotEmpty, IsNumber, IsOptional,
  IsString, IsBoolean, MaxLength, Min, Max,
} from 'class-validator';
import { ReportCategory, ReportPriority } from '../entities/report.entity';

export class CreateReportDto {
  @ApiProperty({ example: 'Large pothole on Lagos-Ibadan Expressway' })
  @IsString() @IsNotEmpty() @MaxLength(200)
  title: string;

  @ApiProperty({ example: 'There is a large pothole near the Total filling station causing accidents.' })
  @IsString() @IsNotEmpty()
  description: string;

  @ApiProperty({ enum: ReportCategory })
  @IsEnum(ReportCategory)
  category: ReportCategory;

  @ApiPropertyOptional({ enum: ReportPriority, default: ReportPriority.MEDIUM })
  @IsEnum(ReportPriority) @IsOptional()
  priority?: ReportPriority;

  @ApiPropertyOptional({ example: 6.5244 })
  @IsNumber() @Min(-90) @Max(90) @IsOptional()
  latitude?: number;

  @ApiPropertyOptional({ example: 3.3792 })
  @IsNumber() @Min(-180) @Max(180) @IsOptional()
  longitude?: number;

  @ApiPropertyOptional({ example: '123 Lagos Street, Ikeja' })
  @IsString() @IsOptional()
  address?: string;

  @ApiPropertyOptional({ example: 'Near First Bank' })
  @IsString() @IsOptional()
  landmark?: string;

  @ApiPropertyOptional({ example: 'Lagos' })
  @IsString() @IsOptional()
  city?: string;

  @ApiPropertyOptional({ example: 'Lagos State' })
  @IsString() @IsOptional()
  state?: string;

  @ApiPropertyOptional({ default: false })
  @IsBoolean() @IsOptional()
  isAnonymous?: boolean;
}
