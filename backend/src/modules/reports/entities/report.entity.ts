import {
  Entity, PrimaryGeneratedColumn, Column, CreateDateColumn,
  UpdateDateColumn, ManyToOne, JoinColumn, Index,
} from 'typeorm';
import { User } from '../../users/entities/user.entity';

export enum ReportStatus {
  SUBMITTED   = 'submitted',
  VERIFIED    = 'verified',
  ASSIGNED    = 'assigned',
  IN_PROGRESS = 'in_progress',
  RESOLVED    = 'resolved',
  REJECTED    = 'rejected',
}

export enum ReportCategory {
  POTHOLE              = 'pothole',
  DRAINAGE             = 'drainage',
  ILLEGAL_DUMPING      = 'illegal_dumping',
  TRAFFIC_LIGHT        = 'traffic_light',
  WATER_LEAKAGE        = 'water_leakage',
  POWER_OUTAGE         = 'power_outage',
  ENVIRONMENTAL_HAZARD = 'environmental_hazard',
  SECURITY             = 'security',
  CORRUPTION           = 'corruption',
  OTHER                = 'other',
}

export enum ReportPriority {
  LOW    = 'low',
  MEDIUM = 'medium',
  HIGH   = 'high',
  URGENT = 'urgent',
}

@Entity('reports')
@Index(['status'])
@Index(['category'])
export class Report {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ length: 200 })
  title: string;

  @Column({ type: 'text' })
  description: string;

  @Column({ type: 'enum', enum: ReportCategory })
  category: ReportCategory;

  @Column({ type: 'enum', enum: ReportStatus, default: ReportStatus.SUBMITTED })
  status: ReportStatus;

  @Column({ type: 'enum', enum: ReportPriority, default: ReportPriority.MEDIUM })
  priority: ReportPriority;

  @Column({ type: 'decimal', precision: 10, scale: 8, nullable: true })
  latitude: number;

  @Column({ type: 'decimal', precision: 11, scale: 8, nullable: true })
  longitude: number;

  @Column({ nullable: true })
  address: string;

  @Column({ nullable: true })
  landmark: string;

  @Column({ nullable: true })
  city: string;

  @Column({ nullable: true })
  state: string;

  @Column({ default: false })
  isAnonymous: boolean;

  @Column({ default: 0 })
  upvotes: number;

  @Column({ nullable: true, type: 'text' })
  rejectionReason: string;

  @Column({ type: 'timestamp', nullable: true })
  resolvedAt: Date;

  @Column({ nullable: true, type: 'text' })
  resolutionNote: string;

  @Column({ nullable: true })
  resolutionEvidenceUrl: string;

  // Tracking ID e.g. CIV-2024-000123
  @Column({ unique: true, nullable: true })
  trackingId: string;

  @Column({ nullable: true })
  autoRoutedDepartmentId: string;

  // Citizen resolution confirmation
  @Column({ nullable: true, type: 'boolean' })
  citizenConfirmed: boolean;

  @Column({ type: 'timestamp', nullable: true })
  citizenConfirmedAt: Date;

  @Column({ nullable: true, type: 'text' })
  citizenFeedback: string;

  // Relations
  @ManyToOne(() => User, { nullable: true, eager: false, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'userId' })
  user: User;

  @Column({ nullable: true })
  userId: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
