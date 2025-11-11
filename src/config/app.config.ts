import { ConfigService } from '@nestjs/config';

export interface AppConfig {
  port: number;
  prefix: string;
  logLevel: string;
  nodeEnv: string;
  appUrl: string;
  frontendUrl: string;
  isProd: boolean;
  isDev: boolean;
}

/**
 * Load and validate application configuration from environment variables
 */
export function loadAppConfig(configService: ConfigService): AppConfig {
  const nodeEnv = configService.get<string>('NODE_ENV') || 'development';
  const isProd = nodeEnv === 'production';
  const isDev = nodeEnv === 'development';
  const port = configService.get<number>('PORT') || 3000;

  return {
    port,
    prefix: configService.get<string>('API_PREFIX') || 'api',
    logLevel: configService.get<string>('LOG_LEVEL') || 'info',
    nodeEnv,
    appUrl: configService.get<string>('APP_URL') || `http://localhost:${port}`,
    frontendUrl: configService.get<string>('FRONTEND_URL') || 'http://localhost:5173',
    isProd,
    isDev,
  };
}
