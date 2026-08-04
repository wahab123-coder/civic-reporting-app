import {
  Entity, PrimaryGeneratedColumn, Column,
  CreateDateColumn, UpdateDateColumn, ManyToOne, JoinColumn,
} from 'typeorm';
import { Report } from '../../reports/entities/report.entity';
import { Department } from '../../departments/entities/department.entity';
import { User } from '../../users/entities/user.entity';

@Entity('assignments')
export class Assignment {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => Report, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'report_id' })
  report: Report;

  @Column()
  reportId: string;

  @ManyToOne(() => Department, { eager: true })
  @JoinColumn({ name: 'department_id' })
  department: Department;

  @Column()
  departmentId: string;

  @ManyToOne(() => User, { nullable: true, eager: true })
  @JoinColumn({ name: 'assigned_to' })
  assignedTo: User;

  @Column({ nullable: true })
  assignedToId: string;

  @Column({ nullable: true })
  assignedById: string;

  @Column({ nullable: true, type: 'text' })
  notes: string;

  @Column({ type: 'timestamp', nullable: true })
  dueDate: Date;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
