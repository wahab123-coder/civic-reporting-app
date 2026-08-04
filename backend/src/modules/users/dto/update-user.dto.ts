import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsEmail, IsEnum, IsOptional, IsString, IsBoolean } from 'class-validator';
import { UserRole } from '../entities/user.entity';

export class UpdateUserDto {
  @ApiPropertyOptional() @IsString() @IsOptional() name?: string;
  @ApiPropertyOptional() @IsEmail() @IsOptional() email?: string;
  @ApiPropertyOptional() @IsString() @IsOptional() phone?: string;
  @ApiPropertyOptional() @IsString() @IsOptional() avatar?: string;
  @ApiPropertyOptional() @IsString() @IsOptional() fcmToken?: string;
  @ApiPropertyOptional() @IsString() @IsOptional() language?: string;
  @ApiPropertyOptional({ enum: UserRole }) @IsEnum(UserRole) @IsOptional() role?: UserRole;
  @ApiPropertyOptional() @IsBoolean() @IsOptional() isActive?: boolean;
}
