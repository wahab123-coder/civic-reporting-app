import { DataSource } from 'typeorm';
import * as dotenv from 'dotenv';

dotenv.config();

const databaseUrl = process.env.DATABASE_URL || process.env.SUPABASE_DB_URL;

export const AppDataSource = new DataSource({
  type: 'postgres',
  url: databaseUrl || undefined,
  host: databaseUrl ? undefined : (process.env.DB_HOST || 'localhost'),
  port: databaseUrl ? undefined : (parseInt(process.env.DB_PORT || '5432', 10)),
  username: databaseUrl ? undefined : (process.env.DB_USERNAME || 'postgres'),
  password: databaseUrl ? undefined : (process.env.DB_PASSWORD || 'postgres'),
  database: databaseUrl ? undefined : (process.env.DB_NAME || 'civic_reporting'),
  synchronize: false,
  logging: true,
  entities: [__dirname + '/../**/*.entity{.ts,.js}'],
  migrations: [__dirname + '/migrations/*{.ts,.js}'],
  ssl: process.env.DB_SSL !== 'false' && (process.env.NODE_ENV === 'production' || Boolean(databaseUrl))
    ? { rejectUnauthorized: false }
    : false,
});
