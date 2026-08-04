import {
  Injectable, BadRequestException, NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ConfigService } from '@nestjs/config';
import {
  S3Client, PutObjectCommand, DeleteObjectCommand,
} from '@aws-sdk/client-s3';
import { v4 as uuidv4 } from 'uuid';
import { Media, MediaType } from './entities/media.entity';

@Injectable()
export class MediaService {
  private s3: S3Client;
  private bucket: string;

  constructor(
    @InjectRepository(Media) private mediaRepo: Repository<Media>,
    private configService: ConfigService,
  ) {
    this.s3 = new S3Client({
      region: this.configService.get('aws.region'),
      credentials: {
        accessKeyId: this.configService.get('aws.accessKeyId'),
        secretAccessKey: this.configService.get('aws.secretAccessKey'),
      },
    });
    this.bucket = this.configService.get('aws.s3BucketName');
  }

  async uploadFile(
    file: Express.Multer.File,
    reportId: string,
    uploadedById: string,
  ): Promise<Media> {
    const allowedMime = [
      'image/jpeg', 'image/png', 'image/webp', 'image/gif',
      'video/mp4', 'video/quicktime', 'video/x-msvideo',
      'application/pdf',
    ];
    if (!allowedMime.includes(file.mimetype)) {
      throw new BadRequestException(`File type "${file.mimetype}" is not allowed`);
    }

    const maxSize = 50 * 1024 * 1024; // 50 MB
    if (file.size > maxSize) {
      throw new BadRequestException('File size must not exceed 50 MB');
    }

    const ext = file.originalname.split('.').pop();
    const key = `reports/${reportId}/${uuidv4()}.${ext}`;

    await this.s3.send(
      new PutObjectCommand({
        Bucket: this.bucket,
        Key: key,
        Body: file.buffer,
        ContentType: file.mimetype,
        ACL: 'public-read',
      }),
    );

    const bucketUrl = this.configService.get('aws.s3BucketUrl') ||
      `https://${this.bucket}.s3.amazonaws.com`;
    const fileUrl = `${bucketUrl}/${key}`;

    const type = file.mimetype.startsWith('video/')
      ? MediaType.VIDEO
      : file.mimetype === 'application/pdf'
        ? MediaType.DOCUMENT
        : MediaType.IMAGE;

    const media = this.mediaRepo.create({
      fileUrl,
      s3Key: key,
      type,
      mimeType: file.mimetype,
      originalName: file.originalname,
      fileSize: file.size,
      reportId,
      uploadedById,
    });

    return this.mediaRepo.save(media);
  }

  async uploadMultiple(
    files: Express.Multer.File[],
    reportId: string,
    uploadedById: string,
  ) {
    if (!files || files.length === 0) {
      throw new BadRequestException('No files provided');
    }
    if (files.length > 10) {
      throw new BadRequestException('Maximum 10 files per upload');
    }

    const uploaded = await Promise.all(
      files.map((f) => this.uploadFile(f, reportId, uploadedById)),
    );
    return { message: `${uploaded.length} file(s) uploaded`, data: uploaded };
  }

  async getByReport(reportId: string) {
    const media = await this.mediaRepo.find({
      where: { reportId },
      order: { createdAt: 'ASC' },
    });
    return { data: media };
  }

  async remove(id: string, userId: string) {
    const media = await this.mediaRepo.findOne({ where: { id } });
    if (!media) throw new NotFoundException(`Media #${id} not found`);

    if (media.s3Key) {
      try {
        await this.s3.send(
          new DeleteObjectCommand({ Bucket: this.bucket, Key: media.s3Key }),
        );
      } catch (err) {
        console.warn(`Could not delete S3 object ${media.s3Key}:`, err.message);
      }
    }

    await this.mediaRepo.remove(media);
    return { message: 'Media deleted' };
  }
}
