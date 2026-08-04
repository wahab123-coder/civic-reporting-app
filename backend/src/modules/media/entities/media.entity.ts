import {
  Entity, PrimaryGeneratedColumn, Column,
  CreateDateColumn, ManyToOne, JoinColumn,
} from 'typeorm';
import { Report } from '../../reports/entities/report.entity';
import { User } from '../../users/entities/user.entity';

export enum MediaType {
  IMAGE = 'image',
  VIDEO = 'video',
  DOCUMENT = 'document',
}

@Entity('media')
export class Media {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  fileUrl: string;

  @Column({ nullable: true })
  thumbnailUrl: string;

  @Column({ type: 'enum', enum: MediaType, default: MediaType.IMAGE })
  type: MediaType;

  @Column({ nullable: true })
  mimeType: string;

  @Column({ nullable: true })
  originalName: string;

  @Column({ type: 'bigint', nullable: true })
  fileSize: number;

  @Column({ nullable: true })
  s3Key: string;

  @ManyToOne(() => Report, { nullable: true, onDelete: 'CASCADE' })
  @JoinColumn({ name: 'report_id' })
  report: Report;

  @Column({ nullable: true })
  reportId: string;

  @ManyToOne(() => User, { nullable: true })
  @JoinColumn({ name: 'uploaded_by' })
  uploadedBy: User;

  @Column({ nullable: true })
  uploadedById: string;

  @CreateDateColumn()
  createdAt: Date;
}
