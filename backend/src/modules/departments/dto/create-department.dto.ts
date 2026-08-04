import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEmail, IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class CreateDepartmentDto {
  @ApiProperty({ example: 'Roads & Infrastructure' })
  @IsString() @IsNotEmpty()
  name: string;

  @ApiPropertyOptional({ example: 'Handles potholes, road damage, traffic lights' })
  @IsString() @IsOptional()
  description?: string;

  @ApiPropertyOptional({ example: 'roads@govt.ng' })
  @IsEmail() @IsOptional()
  contactEmail?: string;

  @ApiPropertyOptional({ example: '+2348012345678' })
  @IsString() @IsOptional()
  contactPhone?: string;

  @ApiPropertyOptional({ example: 'Engr. Adebayo' })
  @IsString() @IsOptional()
  headName?: string;
}
