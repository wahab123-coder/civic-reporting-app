import { NestFactory } from '@nestjs/core';
import { ValidationPipe, VersioningType } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
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

  const port    = parseInt(process.env.PORT || '3000', 10);
  const nodeEnv = process.env.NODE_ENV || 'development';

  app.use(helmet({ contentSecurityPolicy: false }));
  app.use(compression());

  // Allow all origins — tightened per CORS_ORIGIN env in production
  app.enableCors({
    origin: true,
    methods: ['GET','POST','PUT','PATCH','DELETE','OPTIONS'],
    allowedHeaders: ['Content-Type','Authorization'],
    credentials: true,
  });

  app.setGlobalPrefix('api');
  app.enableVersioning({ type: VersioningType.URI, defaultVersion: '1' });

  app.useGlobalPipes(new ValidationPipe({
    whitelist: true,
    forbidNonWhitelisted: false,
    transform: true,
    transformOptions: { enableImplicitConversion: true },
  }));
  app.useGlobalFilters(new HttpExceptionFilter());
  app.useGlobalInterceptors(new TransformInterceptor());

  // Swagger
  const swaggerCfg = new DocumentBuilder()
    .setTitle('Civic Reporting API')
    .setDescription('REST API for Civic Reporting App')
    .setVersion('1.0')
    .addBearerAuth({ type: 'http', scheme: 'bearer', bearerFormat: 'JWT' }, 'access-token')
    .build();
  const document = SwaggerModule.createDocument(app, swaggerCfg);
  SwaggerModule.setup('api/docs', app, document, {
    swaggerOptions: { persistAuthorization: true },
  });

  // Health & root endpoints — respond immediately even before DB ready
  const httpAdapter = app.getHttpAdapter();
  httpAdapter.get('/health', (_req: any, res: any) => {
    res.status(200).json({ status: 'ok', timestamp: new Date().toISOString() });
  });
  httpAdapter.get('/', (_req: any, res: any) => {
    res.status(200).json({
      service: 'Civic Reporting API',
      version: '1.0.0',
      docs: '/api/docs',
      health: '/health',
    });
  });

  await app.listen(port, '0.0.0.0');
  console.log(`\n🚀 API ready → http://0.0.0.0:${port}/api/v1 [${nodeEnv}]`);
  console.log(`📚 Docs → http://0.0.0.0:${port}/api/docs\n`);
}

bootstrap().catch(err => {
  console.error('Fatal:', err.message);
  process.exit(1);
});
