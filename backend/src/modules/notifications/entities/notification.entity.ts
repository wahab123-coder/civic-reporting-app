import {
  Entity, PrimaryGeneratedColumn, Column,
  CreateDateColumn, ManyToOne, JoinColumn,
} from 'typeorm';
import { User } from '../../users/entities/user.entity';

export enum NotificationType {
  REPORT_SUBMITTED = 'report_submitted',
  REPORT_VERIFIED = 'report_verified',
  REPORT_ASSIGNED = 'report_assigned',
  REPORT_IN_PROGRESS = 'report_in_progress',
  REPORT_RESOLVED = 'report_resolved',
  REPORT_REJECTED = 'report_rejected',
  COMMENT_ADDED = 'comment_added',
  SYSTEM = 'system',
}

@Entity('notifications')
export class Notification {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ length: 200 })
  title: string;

  @Column({ type: 'text' })
  body: string;

  @Column({ type: 'enum', enum: NotificationType, default: NotificationType.SYSTEM })
  type: NotificationType;

  @Column({ default: false })
  isRead: boolean;

  @Column({ nullable: true })
  referenceId: string;

  @Column({ nullable: true })
  referenceType: string;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user: User;

  @Column()
  userId: string;

  @CreateDateColumn()
  createdAt: Date;
}
