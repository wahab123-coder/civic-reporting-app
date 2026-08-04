import {
  Injectable, BadRequestException, UnauthorizedException,
  ConflictException, NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcryptjs';
import * as crypto from 'crypto';
import { User, AuthProvider, UserRole } from '../users/entities/user.entity';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { ForgotPasswordDto } from './dto/forgot-password.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(User) private usersRepo: Repository<User>,
    private jwtService: JwtService,
    private configService: ConfigService,
  ) {}

  // ── Register ──────────────────────────────────────────────
  async register(dto: RegisterDto) {
    if (!dto.email && !dto.phone) {
      throw new BadRequestException('Email or phone number is required');
    }

    if (dto.email) {
      const exists = await this.usersRepo.findOne({ where: { email: dto.email } });
      if (exists) throw new ConflictException('Email already registered');
    }

    if (dto.phone) {
      const exists = await this.usersRepo.findOne({ where: { phone: dto.phone } });
      if (exists) throw new ConflictException('Phone number already registered');
    }

    const user = this.usersRepo.create({
      name: dto.name,
      email: dto.email,
      phone: dto.phone,
      password: dto.password,
      role: dto.role || UserRole.CITIZEN,
      emailVerificationToken: crypto.randomBytes(32).toString('hex'),
    });

    await this.usersRepo.save(user);
    const tokens = await this.generateTokens(user);
    await this.saveRefreshToken(user.id, tokens.refreshToken);

    const { password, refreshToken, ...safeUser } = user as any;
    return { message: 'Registration successful', data: { user: safeUser, ...tokens } };
  }

  // ── Login ─────────────────────────────────────────────────
  async login(dto: LoginDto) {
    if (!dto.email && !dto.phone) {
      throw new BadRequestException('Email or phone is required');
    }

    const user = await this.usersRepo.findOne({
      where: dto.email ? { email: dto.email } : { phone: dto.phone },
      select: ['id', 'name', 'email', 'phone', 'role', 'password', 'isActive', 'avatar'],
    });

    if (!user) throw new UnauthorizedException('Invalid credentials');
    if (!user.isActive) throw new UnauthorizedException('Account is deactivated');

    const valid = await bcrypt.compare(dto.password, user.password);
    if (!valid) throw new UnauthorizedException('Invalid credentials');

    const tokens = await this.generateTokens(user);
    await this.saveRefreshToken(user.id, tokens.refreshToken);

    const { password, ...safeUser } = user as any;
    return { message: 'Login successful', data: { user: safeUser, ...tokens } };
  }

  // ── Validate user (for local strategy) ───────────────────
  async validateUser(email: string, password: string): Promise<User | null> {
    const user = await this.usersRepo.findOne({
      where: { email },
      select: ['id', 'name', 'email', 'role', 'password', 'isActive'],
    });
    if (!user || !user.isActive) return null;
    const valid = await bcrypt.compare(password, user.password);
    return valid ? user : null;
  }

  // ── Google OAuth ──────────────────────────────────────────
  async validateGoogleUser(profile: {
    providerId: string; name: string; email: string; avatar: string;
  }) {
    let user = await this.usersRepo.findOne({
      where: [{ email: profile.email }, { providerId: profile.providerId }],
    });

    if (!user) {
      user = this.usersRepo.create({
        name: profile.name,
        email: profile.email,
        avatar: profile.avatar,
        provider: AuthProvider.GOOGLE,
        providerId: profile.providerId,
        isEmailVerified: true,
        role: UserRole.CITIZEN,
      });
      await this.usersRepo.save(user);
    }

    return user;
  }

  async googleLogin(user: User) {
    const tokens = await this.generateTokens(user);
    await this.saveRefreshToken(user.id, tokens.refreshToken);
    return { message: 'Google login successful', data: { user, ...tokens } };
  }

  // ── Refresh Tokens ────────────────────────────────────────
  async refreshTokens(userId: string, refreshToken: string) {
    const user = await this.usersRepo.findOne({
      where: { id: userId },
      select: ['id', 'name', 'email', 'role', 'refreshToken', 'isActive'],
    });
    if (!user || !user.refreshToken) throw new UnauthorizedException('Access denied');

    const match = await bcrypt.compare(refreshToken, user.refreshToken);
    if (!match) throw new UnauthorizedException('Access denied');

    const tokens = await this.generateTokens(user);
    await this.saveRefreshToken(user.id, tokens.refreshToken);
    return { message: 'Tokens refreshed', data: tokens };
  }

  // ── Logout ────────────────────────────────────────────────
  async logout(userId: string) {
    await this.usersRepo.update(userId, { refreshToken: null });
    return { message: 'Logged out successfully' };
  }

  // ── Forgot Password ───────────────────────────────────────
  async forgotPassword(dto: ForgotPasswordDto) {
    const user = await this.usersRepo.findOne({ where: { email: dto.email } });
    // Always return success to prevent email enumeration
    if (!user) return { message: 'If that email exists, a reset link has been sent' };

    const token = crypto.randomBytes(32).toString('hex');
    user.passwordResetToken = await bcrypt.hash(token, 10);
    user.passwordResetExpires = new Date(Date.now() + 60 * 60 * 1000); // 1h
    await this.usersRepo.save(user);

    // TODO: send email with token
    console.log(`Password reset token for ${dto.email}: ${token}`);
    return { message: 'If that email exists, a reset link has been sent' };
  }

  // ── Reset Password ────────────────────────────────────────
  async resetPassword(dto: ResetPasswordDto) {
    const users = await this.usersRepo.find({
      where: { passwordResetExpires: undefined },
      select: ['id', 'passwordResetToken', 'passwordResetExpires', 'password'],
    });

    let targetUser: User | null = null;
    for (const u of users) {
      if (u.passwordResetToken && u.passwordResetExpires > new Date()) {
        const match = await bcrypt.compare(dto.token, u.passwordResetToken);
        if (match) { targetUser = u; break; }
      }
    }

    if (!targetUser) throw new BadRequestException('Invalid or expired reset token');

    targetUser.password = dto.password;
    targetUser.passwordResetToken = null;
    targetUser.passwordResetExpires = null;
    await this.usersRepo.save(targetUser);
    return { message: 'Password reset successful' };
  }

  // ── Helpers ───────────────────────────────────────────────
  private async generateTokens(user: User) {
    const payload = { sub: user.id, email: user.email, role: user.role };

    const [accessToken, refreshToken] = await Promise.all([
      this.jwtService.signAsync(payload, {
        secret: this.configService.get('jwt.secret'),
        expiresIn: this.configService.get('jwt.expiresIn'),
      }),
      this.jwtService.signAsync(payload, {
        secret: this.configService.get('jwt.refreshSecret'),
        expiresIn: this.configService.get('jwt.refreshExpiresIn'),
      }),
    ]);

    return { accessToken, refreshToken };
  }

  private async saveRefreshToken(userId: string, refreshToken: string) {
    const hashed = await bcrypt.hash(refreshToken, 10);
    await this.usersRepo.update(userId, { refreshToken: hashed });
  }
}
