import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsDateString, IsNotEmpty, IsOptional, IsString, IsUUID } from 'class-validator';

export class CreateAssignmentDto {
  @ApiProperty() @IsUUID() @IsNotEmpty() reportId: string;
  @ApiProperty() @IsUUID() @IsNotEmpty() departmentId: string;
  @ApiPropertyOptional() @IsUUID() @IsOptional() assignedToId?: string;
  @ApiPropertyOptional() @IsString() @IsOptional() notes?: string;
  @ApiPropertyOptional() @IsDateString() @IsOptional() dueDate?: string;
}
