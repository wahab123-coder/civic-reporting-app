import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ThrottlerModule } from '@nestjs/throttler';
import { ScheduleModule } from '@nestjs/schedule';
import { AuthModule } from './modules/auth/auth.module';
import { UsersModule } from './modules/users/users.module';
import { ReportsModule } from './modules/reports/reports.module';
import { MediaModule } from './modules/media/media.module';
import { CommentsModule } from './modules/comments/comments.module';
import { NotificationsModule } from './modules/notifications/notifications.module';
import { DepartmentsModule } from './modules/departments/departments.module';
import { AssignmentsModule } from './modules/assignments/assignments.module';
import { AnalyticsModule } from './modules/analytics/analytics.module';
import appConfig from './config/app.config';
import databaseConfig from './config/database.config';
import jwtConfig from './config/jwt.config';
import awsConfig from './config/aws.config';
import firebaseConfig from './config/firebase.config';

// Force IPv4 DNS resolution globally — prevents ENETUNREACH IPv6 errors on Render
import * as dns from 'dns';
dns.setDefaultResultOrder('ipv4first');

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [appConfig, databaseConfig, jwtConfig, awsConfig, firebaseConfig],
      envFilePath: ['.env.local', '.env'],
    }),
    TypeOrmModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => {
        const host     = process.env.DB_HOST     || config.get<string>('database.host')     || 'localhost';
        const port     = parseInt(process.env.DB_PORT     || '5432', 10);
        const username = process.env.DB_USERNAME  || config.get<string>('database.username') || 'postgres';
        const password = process.env.DB_PASSWORD  || config.get<string>('database.password') || 'postgres';
        const database = process.env.DB_NAME      || config.get<string>('database.name')     || 'postgres';
        const isProd   = process.env.NODE_ENV === 'production';

        console.log(`[DB] Connecting to ${host}:${port}/${database} as ${username}`);

        return {
          type:     'postgres' as const,
          host,
          port,
          username,
          password,
          database,
          entities:   [__dirname + '/**/*.entity{.ts,.js}'],
          synchronize: !isProd,
          logging:     false,
          ssl:         isProd ? { rejectUnauthorized: false } : false,
          extra: {
            max: 3,
            connectionTimeoutMillis: 30000,
            idleTimeoutMillis: 30000,
            family: 4,
          },
          retryAttempts: 30,
          retryDelay:    5000,
          keepConnectionAlive: false,
          autoLoadEntities: true,
        };
      },
    }),
    ThrottlerModule.forRoot([{ ttl: 60000, limit: 200 }]),
    ScheduleModule.forRoot(),
    AuthModule,
    UsersModule,
    ReportsModule,
    MediaModule,
    CommentsModule,
    NotificationsModule,
    DepartmentsModule,
    AssignmentsModule,
    AnalyticsModule,
  ],
})
export class AppModule {}
