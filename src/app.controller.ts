import { Controller, Get } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiOkResponse } from '@nestjs/swagger';
import { AppService } from './app.service';

@ApiTags('system')
@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Get()
  @ApiOperation({
    summary: 'Root endpoint',
    description: 'Returns a simple OK message',
  })
  @ApiOkResponse({
    description: 'OK response',
    schema: {
      example: {
        message: 'OK',
      },
    },
  })
  getApiInfo() {
    return this.appService.getApiInfo();
  }

  @Get('health')
  @ApiOperation({
    summary: 'Health check',
    description:
      'Returns API health status. Detailed information only available in development mode.',
  })
  @ApiOkResponse({
    description: 'Health check response',
    content: {
      'application/json': {
        examples: {
          production: {
            summary: 'Production response',
            value: {
              status: 'ok',
              timestamp: '2024-11-08T12:00:00.000Z',
            },
          },
          development: {
            summary: 'Development response',
            value: {
              status: 'ok',
              timestamp: '2024-11-08T12:00:00.000Z',
              uptime: 3600.5,
              environment: 'development',
              services: {
                database: {
                  status: 'healthy',
                  responseTime: '5ms',
                },
              },
              responseTime: '10ms',
            },
          },
        },
      },
    },
  })
  async getHealth(): Promise<unknown> {
    return await this.appService.getHealth();
  }
}
