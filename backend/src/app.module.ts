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
        const isProduction = config.get('NODE_ENV') === 'production';
        const databaseUrl = process.env.DATABASE_URL;
        if (databaseUrl) {
          return {
            type: 'postgres',
            url: databaseUrl,
            entities: [__dirname + '/**/*.entity{.ts,.js}'],
            synchronize: !isProduction,
            logging: false,
            ssl: { rejectUnauthorized: false },
            extra: { max: 3 },
          };
        }
        return {
          type: 'postgres',
          host:     config.get('database.host'),
          port:     config.get<number>('database.port'),
          username: config.get('database.username'),
          password: config.get('database.password'),
          database: config.get('database.name'),
          entities:   [__dirname + '/**/*.entity{.ts,.js}'],
          synchronize: !isProduction,
          logging:     false,
          ssl: { rejectUnauthorized: false },
          extra: { max: 3 },
        };
      },
    }),
    ThrottlerModule.forRoot([{ ttl: 60000, limit: 100 }]),
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
