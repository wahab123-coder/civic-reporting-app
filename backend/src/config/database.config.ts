import { registerAs } from '@nestjs/config';

export default registerAs('database', () => {
  const url = process.env.DATABASE_URL || process.env.SUPABASE_DB_URL;

  return {
    url: url || undefined,
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '5432', 10),
    username: process.env.DB_USERNAME || 'postgres',
    password: process.env.DB_PASSWORD || 'postgres',
    name: process.env.DB_NAME || 'civic_reporting',
    ssl: process.env.DB_SSL !== 'false',
  };
});
