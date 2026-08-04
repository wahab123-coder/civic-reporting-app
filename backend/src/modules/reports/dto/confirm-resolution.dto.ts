import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsBoolean, IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class ConfirmResolutionDto {
  @ApiProperty({ description: 'true = confirmed resolved, false = not resolved' })
  @IsBoolean() @IsNotEmpty()
  confirmed: boolean;

  @ApiPropertyOptional({ example: 'The pothole has been filled, thank you!' })
  @IsString() @IsOptional()
  feedback?: string;
}
