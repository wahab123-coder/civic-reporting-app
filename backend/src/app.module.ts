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
        const databaseUrl = process.env.DATABASE_URL || process.env.SUPABASE_DB_URL;
        const shouldUseSsl = process.env.DB_SSL !== 'false' && (process.env.NODE_ENV === 'production' || Boolean(databaseUrl));

        return {
          type: 'postgres' as const,
          url: databaseUrl || undefined,
          host: databaseUrl ? undefined : (process.env.DB_HOST || config.get<string>('database.host')),
          port: databaseUrl ? undefined : parseInt(process.env.DB_PORT || config.get<string>('database.port') || '5432', 10),
          username: databaseUrl ? undefined : (process.env.DB_USERNAME || config.get<string>('database.username')),
          password: databaseUrl ? undefined : (process.env.DB_PASSWORD || config.get<string>('database.password')),
          database: databaseUrl ? undefined : (process.env.DB_NAME || config.get<string>('database.name')),
          entities: [__dirname + '/**/*.entity{.ts,.js}'],
          synchronize: false,
          logging: false,
          ssl: shouldUseSsl ? { rejectUnauthorized: false } : false,
          extra: {
            max: 5,
            connectionTimeoutMillis: 20000,
            idleTimeoutMillis: 60000,
            statement_timeout: 30000,
          },
          retryAttempts: 99,
          retryDelay: 10000,
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
