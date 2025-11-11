import { ConfigService } from '@nestjs/config';
import { NestFactory } from '@nestjs/core';
import { NestExpressApplication } from '@nestjs/platform-express';

import { AppModule } from './app.module';
import {
  loadAppConfig,
  setupCors,
  setupGlobalFilters,
  setupGlobalPipes,
  setupGlobalPrefix,
  setupMiddleware,
  setupRequestLogging,
  setupSwagger,
} from './config';
import { displayStartupInfo } from './utils/logger.util';

/**
 * Bootstrap the NestJS application
 */
async function bootstrap(): Promise<void> {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);
  const configService = app.get(ConfigService);
  const config = loadAppConfig(configService);

  // Apply core configurations
  setupMiddleware(app);
  setupGlobalPipes(app);
  setupGlobalFilters(app);
  setupCors(app, config);

  // Setup API documentation (non-production only)
  if (!config.isProd) {
    setupSwagger(app);
  }

  // Configure routing (must be after Swagger)
  setupGlobalPrefix(app, config);

  // Configure logging
  setupRequestLogging(app, config.logLevel);

  // Start the server
  await app.listen(config.port);

  // Display startup information
  displayStartupInfo(config);
}

void bootstrap();
