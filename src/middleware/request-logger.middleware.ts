import chalk from 'chalk';
import { Request, Response, NextFunction } from 'express';

export function requestLogger(req: Request, res: Response, next: NextFunction) {
  const start = Date.now();
  const requestId = Math.random().toString(36).substring(2, 8).toUpperCase();

  const methodColors = {
    GET: chalk.greenBright,
    POST: chalk.blueBright,
    PUT: chalk.yellowBright,
    PATCH: chalk.magentaBright,
    DELETE: chalk.redBright,
    OPTIONS: chalk.cyanBright,
    HEAD: chalk.gray,
  };

  // Human readable date/time formatting - 12h format
  const formatDateTime = () => {
    const now = new Date();
    return now.toLocaleTimeString('en-US', {
      hour12: true,
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    });
  };

  // Fixed width for all fields
  const formatField = (text: string, width: number) => {
    return text.padEnd(width, ' ');
  };

  const method = req.method || 'UNKNOWN';
  // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
  const colorMethod = methodColors[method] || chalk.white;

  res.on('finish', () => {
    const duration = Date.now() - start;
    const status = res.statusCode;

    const colorStatus =
      status >= 500 ? chalk.redBright
      : status >= 400 ? chalk.yellowBright
      : status >= 300 ? chalk.cyanBright
      : status >= 200 ? chalk.greenBright
      : chalk.white;

    const formatTime = (ms: number) => {
      if (ms < 1000) return `${ms}ms`;
      return `${(ms / 1000).toFixed(1)}s`;
    };

    const colorTime =
      duration > 5000 ? chalk.redBright.bold
      : duration > 1000 ? chalk.redBright
      : duration > 500 ? chalk.yellowBright
      : duration > 200 ? chalk.white
      : chalk.greenBright;

    console.log(
      `[${chalk.dim(formatDateTime())}] [${chalk.cyan(requestId)}] [${colorMethod(formatField(method, 4))}] [${colorTime(formatField(formatTime(duration), 4))}] [${colorStatus(formatField(status.toString(), 3))}] {${chalk.white(req.originalUrl)}}`,
    );
  });

  next();
}
