import { NestExpressApplication } from '@nestjs/platform-express';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { ApiErrorDto } from '../common/dto/api-error.dto';

/**
 * Setup Swagger API documentation
 * Only enabled in non-production environments
 */
export function setupSwagger(app: NestExpressApplication): void {
  const config = new DocumentBuilder()
    .setTitle('Authing API')
    .setDescription('Authentication and User Management API')
    .setVersion('1.0')
    .addTag('auth', 'Authentication endpoints')
    .addTag('users', 'User management endpoints')
    .addServer('/api', 'API')
    .addBearerAuth(
      {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        name: 'JWT',
        description: 'Enter JWT token',
        in: 'header',
      },
      'JWT-auth',
    )
    .build();

  const document = SwaggerModule.createDocument(app, config, {
    extraModels: [ApiErrorDto],
  });

  // Setup Swagger at 'api/docs' path (includes the global prefix)
  SwaggerModule.setup('api/docs', app, document);
}
