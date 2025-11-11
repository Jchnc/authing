import chalk from 'chalk';
import { AppConfig } from '../config/app.config';

/**
 * Display application startup information in the console
 */
export function displayStartupInfo(config: AppConfig): void {
  console.log(chalk.bold.green(`✓ Server running on ${config.appUrl}/${config.prefix}`));

  if (!config.isProd) {
    console.log(chalk.bold.cyan(`✓ Swagger available at ${config.appUrl}/${config.prefix}/docs`));
  }

  console.log(chalk.gray(`\nEnvironment: ${config.nodeEnv}`));
  console.log(chalk.gray(`Log Level: ${config.logLevel}\n`));
}
