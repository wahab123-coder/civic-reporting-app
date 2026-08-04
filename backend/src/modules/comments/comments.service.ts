import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Comment } from './entities/comment.entity';
import { CreateCommentDto } from './dto/create-comment.dto';
import { User, UserRole } from '../users/entities/user.entity';

@Injectable()
export class CommentsService {
  constructor(
    @InjectRepository(Comment) private commentsRepo: Repository<Comment>,
  ) {}

  async create(dto: CreateCommentDto, user: User) {
    // Only staff can post internal comments
    if (dto.isInternal && user.role === UserRole.CITIZEN) {
      dto.isInternal = false;
    }
    const comment = this.commentsRepo.create({
      content: dto.content,
      reportId: dto.reportId,
      userId: user.id,
      isInternal: dto.isInternal ?? false,
    });
    await this.commentsRepo.save(comment);
    return { message: 'Comment added', data: comment };
  }

  async findByReport(reportId: string, user: User) {
    const qb = this.commentsRepo
      .createQueryBuilder('c')
      .leftJoinAndSelect('c.user', 'u')
      .where('c.reportId = :reportId', { reportId })
      .orderBy('c.createdAt', 'ASC');

    // Citizens cannot see internal comments
    if (user.role === UserRole.CITIZEN) {
      qb.andWhere('c.isInternal = false');
    }

    const comments = await qb.getMany();
    return { data: comments };
  }

  async remove(id: string, user: User) {
    const comment = await this.commentsRepo.findOne({ where: { id } });
    if (!comment) throw new NotFoundException(`Comment #${id} not found`);

    if (user.role !== UserRole.ADMIN && comment.userId !== user.id) {
      throw new ForbiddenException('You can only delete your own comments');
    }

    await this.commentsRepo.remove(comment);
    return { message: 'Comment deleted' };
  }
}
