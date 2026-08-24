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

  const port = parseInt(process.env.PORT || '3000', 10);

  app.use(helmet({ contentSecurityPolicy: false }));
  app.use(compression());

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
  SwaggerModule.setup('api/docs', app, document);

  // Health endpoints — MUST respond even if DB is not connected
  const http = app.getHttpAdapter();
  http.get('/health', (_req: any, res: any) => {
    res.status(200).json({ status: 'ok', timestamp: new Date().toISOString() });
  });
  http.get('/', (_req: any, res: any) => {
    res.status(200).json({ service: 'Civic Reporting API', docs: '/api/docs' });
  });

  // Listen FIRST — then DB connects in background
  await app.listen(port, '0.0.0.0');
  console.log(`\n🚀 API ready on port ${port}`);
}

bootstrap().catch(err => {
  console.error('Fatal:', err.message);
  process.exit(1);
});
