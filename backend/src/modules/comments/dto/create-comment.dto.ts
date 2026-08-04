import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsBoolean, IsNotEmpty, IsOptional, IsString, IsUUID } from 'class-validator';

export class CreateCommentDto {
  @ApiProperty({ example: 'We have dispatched a team to fix this issue.' })
  @IsString() @IsNotEmpty()
  content: string;

  @ApiProperty({ example: '3fa85f64-5717-4562-b3fc-2c963f66afa6' })
  @IsUUID() @IsNotEmpty()
  reportId: string;

  @ApiPropertyOptional({ default: false, description: 'Internal comment visible only to staff' })
  @IsBoolean() @IsOptional()
  isInternal?: boolean;
}
