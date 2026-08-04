import {
  Entity, PrimaryGeneratedColumn, Column, CreateDateColumn,
  UpdateDateColumn, OneToMany, BeforeInsert, BeforeUpdate,
} from 'typeorm';
import * as bcrypt from 'bcryptjs';

export enum UserRole {
  CITIZEN = 'citizen',
  ADMIN = 'admin',
  GOVERNMENT_OFFICER = 'government_officer',
  NGO = 'ngo',
}

export enum AuthProvider {
  LOCAL = 'local',
  GOOGLE = 'google',
}

@Entity('users')
export class User {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ length: 100 })
  name: string;

  @Column({ unique: true, nullable: true })
  email: string;

  @Column({ unique: true, nullable: true })
  phone: string;

  @Column({ type: 'enum', enum: UserRole, default: UserRole.CITIZEN })
  role: UserRole;

  @Column({ select: false, nullable: true })
  password: string;

  @Column({ type: 'enum', enum: AuthProvider, default: AuthProvider.LOCAL })
  provider: AuthProvider;

  @Column({ nullable: true })
  providerId: string;

  @Column({ nullable: true })
  avatar: string;

  @Column({ nullable: true })
  fcmToken: string;

  @Column({ default: true })
  isActive: boolean;

  @Column({ default: false })
  isEmailVerified: boolean;

  @Column({ nullable: true })
  emailVerificationToken: string;

  @Column({ nullable: true })
  passwordResetToken: string;

  @Column({ type: 'timestamp', nullable: true })
  passwordResetExpires: Date;

  @Column({ nullable: true })
  refreshToken: string;

  @Column({ type: 'varchar', length: 10, default: 'en' })
  language: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @BeforeInsert()
  @BeforeUpdate()
  async hashPassword() {
    if (this.password) {
      this.password = await bcrypt.hash(this.password, 12);
    }
  }

  async validatePassword(password: string): Promise<boolean> {
    return bcrypt.compare(password, this.password);
  }
}
