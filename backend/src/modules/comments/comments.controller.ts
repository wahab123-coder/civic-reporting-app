import {
  Controller, Post, Get, Delete, Param, Body,
  UseGuards, ParseUUIDPipe,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { CommentsService } from './comments.service';
import { CreateCommentDto } from './dto/create-comment.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { User } from '../users/entities/user.entity';

@ApiTags('Comments')
@ApiBearerAuth('access-token')
@UseGuards(JwtAuthGuard)
@Controller('comments')
export class CommentsController {
  constructor(private commentsService: CommentsService) {}

  @Post()
  @ApiOperation({ summary: 'Add a comment to a report' })
  create(@Body() dto: CreateCommentDto, @CurrentUser() user: User) {
    return this.commentsService.create(dto, user);
  }

  @Get('report/:reportId')
  @ApiOperation({ summary: 'Get all comments for a report' })
  findByReport(@Param('reportId', ParseUUIDPipe) reportId: string, @CurrentUser() user: User) {
    return this.commentsService.findByReport(reportId, user);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete a comment' })
  remove(@Param('id', ParseUUIDPipe) id: string, @CurrentUser() user: User) {
    return this.commentsService.remove(id, user);
  }
}
