import {
  Injectable, NotFoundException, ForbiddenException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, ILike } from 'typeorm';
import { ConfigService } from '@nestjs/config';
import {
  S3Client, PutObjectCommand,
} from '@aws-sdk/client-s3';
import { v4 as uuidv4 } from 'uuid';
import { User, UserRole } from './entities/user.entity';
import { UpdateUserDto } from './dto/update-user.dto';

@Injectable()
export class UsersService {
  private s3: S3Client;
  private bucket: string;

  constructor(
    @InjectRepository(User) private usersRepo: Repository<User>,
    private configService: ConfigService,
  ) {
    this.s3 = new S3Client({
      region: this.configService.get('aws.region') || 'us-east-1',
      credentials: {
        accessKeyId:     this.configService.get('aws.accessKeyId')     || '',
        secretAccessKey: this.configService.get('aws.secretAccessKey') || '',
      },
    });
    this.bucket = this.configService.get('aws.s3BucketName') || 'civic-reporting-media';
  }

  async findAll(query: {
    page?: number; limit?: number; role?: UserRole;
    search?: string; isActive?: boolean;
  }) {
    const { page = 1, limit = 20, role, search, isActive } = query;
    const where: any = {};
    if (role) where.role = role;
    if (isActive !== undefined) where.isActive = isActive;
    if (search) where.name = ILike(`%${search}%`);

    const [users, total] = await this.usersRepo.findAndCount({
      where,
      order: { createdAt: 'DESC' },
      skip: (page - 1) * limit,
      take: limit,
      select: ['id', 'name', 'email', 'phone', 'role', 'avatar', 'isActive', 'createdAt'],
    });

    return {
      data: users,
      meta: { total, page, limit, totalPages: Math.ceil(total / limit) },
    };
  }

  async findOne(id: string): Promise<User> {
    const user = await this.usersRepo.findOne({
      where: { id },
      select: ['id', 'name', 'email', 'phone', 'role', 'avatar',
        'isActive', 'isEmailVerified', 'language', 'createdAt', 'updatedAt'],
    });
    if (!user) throw new NotFoundException(`User #${id} not found`);
    return user;
  }

  async update(id: string, dto: UpdateUserDto, requesterId: string, requesterRole: UserRole) {
    const user = await this.findOne(id);
    // Non-admins can only update their own profile, and cannot change role
    if (requesterRole !== UserRole.ADMIN) {
      if (id !== requesterId) throw new ForbiddenException('You can only update your own profile');
      delete dto.role;
      delete dto.isActive;
    }
    Object.assign(user, dto);
    await this.usersRepo.save(user);
    return { message: 'User updated', data: user };
  }

  async deactivate(id: string) {
    const user = await this.findOne(id);
    user.isActive = false;
    await this.usersRepo.save(user);
    return { message: 'User deactivated' };
  }

  async activate(id: string) {
    const user = await this.findOne(id);
    user.isActive = true;
    await this.usersRepo.save(user);
    return { message: 'User activated' };
  }

  async getStats() {
    const total = await this.usersRepo.count();
    const byRole = await this.usersRepo
      .createQueryBuilder('u')
      .select('u.role', 'role')
      .addSelect('COUNT(*)', 'count')
      .groupBy('u.role')
      .getRawMany();
    return { data: { total, byRole } };
  }

  async uploadAvatar(id: string, file: Express.Multer.File, requester: User) {
    if (requester.role !== UserRole.ADMIN && requester.id !== id) {
      throw new ForbiddenException('You can only update your own avatar');
    }

    const user = await this.findOne(id);
    let avatarUrl: string;

    // Try S3 upload, fall back to base64 data URL if no credentials
    const hasAwsCreds = !!(
      this.configService.get('aws.accessKeyId') &&
      this.configService.get('aws.secretAccessKey') &&
      this.configService.get('aws.accessKeyId') !== ''
    );

    if (hasAwsCreds) {
      const ext = file.originalname.split('.').pop() || 'jpg';
      const key = `avatars/${id}/${uuidv4()}.${ext}`;
      await this.s3.send(new PutObjectCommand({
        Bucket:      this.bucket,
        Key:         key,
        Body:        file.buffer,
        ContentType: file.mimetype,
        ACL:         'public-read' as any,
      }));
      const bucketUrl = this.configService.get('aws.s3BucketUrl') ||
        `https://${this.bucket}.s3.amazonaws.com`;
      avatarUrl = `${bucketUrl}/${key}`;
    } else {
      // Store as base64 data URL (works without AWS)
      const base64 = file.buffer.toString('base64');
      avatarUrl = `data:${file.mimetype};base64,${base64}`;
    }

    await this.usersRepo.update(id, { avatar: avatarUrl });
    return { message: 'Avatar updated', data: { avatar: avatarUrl } };
  }
}
