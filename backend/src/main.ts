import { NestFactory } from '@nestjs/core';
import { ValidationPipe, VersioningType } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { ConfigService } from '@nestjs/config';
import helmet from 'helmet';
import * as compression from 'compression';
import { AppModule } from './app.module';
import { HttpExceptionFilter } from './common/filters/http-exception.filter';
import { TransformInterceptor } from './common/interceptors/transform.interceptor';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, {
    logger: ['log', 'error', 'warn'],
    abortOnError: false,
  });

  const configService = app.get(ConfigService);
  const port = parseInt(process.env.PORT || '3000', 10);
  const nodeEnv = process.env.NODE_ENV || 'development';

  app.use(helmet());
  app.use(compression());

  app.enableCors({
    origin: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    credentials: true,
  });

  app.setGlobalPrefix('api');
  app.enableVersioning({ type: VersioningType.URI, defaultVersion: '1' });

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: false,
      transform: true,
      transformOptions: { enableImplicitConversion: true },
    }),
  );
  app.useGlobalFilters(new HttpExceptionFilter());
  app.useGlobalInterceptors(new TransformInterceptor());

  // Swagger docs
  const config = new DocumentBuilder()
    .setTitle('Civic Reporting API')
    .setDescription('Civic Reporting App REST API')
    .setVersion('1.0')
    .addBearerAuth({ type: 'http', scheme: 'bearer', bearerFormat: 'JWT' }, 'access-token')
    .build();
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api/docs', app, document);

  // Health check — must respond before DB is ready
  app.getHttpAdapter().get('/health', (req: any, res: any) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString(), env: nodeEnv });
  });
  app.getHttpAdapter().get('/', (req: any, res: any) => {
    res.json({ status: 'ok', service: 'Civic Reporting API', docs: '/api/docs' });
  });

  await app.listen(port, '0.0.0.0');

  console.log(`\n🚀 API: http://0.0.0.0:${port}/api/v1`);
  console.log(`📚 Docs: http://0.0.0.0:${port}/api/docs`);
  console.log(`🌍 Env: ${nodeEnv}\n`);
}

bootstrap().catch(err => {
  console.error('Bootstrap failed:', err);
  process.exit(1);
});
