import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsNotEmpty, IsOptional, IsString } from 'class-validator';
import { ReportStatus } from '../entities/report.entity';

export class UpdateStatusDto {
  @ApiProperty({ enum: ReportStatus })
  @IsEnum(ReportStatus) @IsNotEmpty()
  status: ReportStatus;

  @ApiPropertyOptional({ example: 'Issue verified by field officer' })
  @IsString() @IsOptional()
  note?: string;

  @ApiPropertyOptional({ example: 'https://s3.amazonaws.com/evidence.jpg' })
  @IsString() @IsOptional()
  evidenceUrl?: string;
}
