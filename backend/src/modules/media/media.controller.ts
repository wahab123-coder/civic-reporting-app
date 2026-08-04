import {
  Controller, Post, Get, Delete, Param, UseGuards,
  UseInterceptors, UploadedFiles, ParseUUIDPipe,
} from '@nestjs/common';
import { FilesInterceptor } from '@nestjs/platform-express';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiConsumes } from '@nestjs/swagger';
import { memoryStorage } from 'multer';
import { MediaService } from './media.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { User } from '../users/entities/user.entity';

@ApiTags('Media')
@ApiBearerAuth('access-token')
@UseGuards(JwtAuthGuard)
@Controller('media')
export class MediaController {
  constructor(private mediaService: MediaService) {}

  @Post('upload/:reportId')
  @ApiOperation({ summary: 'Upload media files for a report (max 10)' })
  @ApiConsumes('multipart/form-data')
  @UseInterceptors(FilesInterceptor('files', 10, { storage: memoryStorage() }))
  upload(
    @Param('reportId', ParseUUIDPipe) reportId: string,
    @UploadedFiles() files: Express.Multer.File[],
    @CurrentUser() user: User,
  ) {
    return this.mediaService.uploadMultiple(files, reportId, user.id);
  }

  @Get('report/:reportId')
  @ApiOperation({ summary: 'Get all media for a report' })
  getByReport(@Param('reportId', ParseUUIDPipe) reportId: string) {
    return this.mediaService.getByReport(reportId);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete a media file' })
  remove(@Param('id', ParseUUIDPipe) id: string, @CurrentUser() user: User) {
    return this.mediaService.remove(id, user.id);
  }
}
