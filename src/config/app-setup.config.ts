import { ValidationPipe } from '@nestjs/common';
import { NestExpressApplication } from '@nestjs/platform-express';
import * as cookieParser from 'cookie-parser';
import { GlobalExceptionFilter } from '../common/filters/global-exception.filter';
import { requestLogger } from '../middleware/request-logger.middleware';
import { AppConfig } from './app.config';

/**
 * Setup core middleware (cookie parser, etc.)
 */
export function setupMiddleware(app: NestExpressApplication): void {
  app.use(cookieParser());
}

/**
 * Setup global validation pipes with strict validation rules
 */
export function setupGlobalPipes(app: NestExpressApplication): void {
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );
}

/**
 * Setup global exception filters for consistent error handling
 */
export function setupGlobalFilters(app: NestExpressApplication): void {
  app.useGlobalFilters(new GlobalExceptionFilter());
}

/**
 * Setup CORS configuration based on environment
 */
export function setupCors(app: NestExpressApplication, config: AppConfig): void {
  app.enableCors({
    origin: config.isProd ? config.frontendUrl : '*',
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
    credentials: true,
  });
}

/**
 * Setup global API prefix with route exclusions
 */
export function setupGlobalPrefix(app: NestExpressApplication, config: AppConfig): void {
  app.setGlobalPrefix(config.prefix);
}

/**
 * Setup request logging middleware (debug mode only)
 */
export function setupRequestLogging(app: NestExpressApplication, logLevel: string): void {
  if (logLevel === 'debug') {
    app.use(requestLogger);
  }
}
