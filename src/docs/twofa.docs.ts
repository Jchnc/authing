import { applyDecorators } from '@nestjs/common';
import { ApiOperation, ApiResponse } from '@nestjs/swagger';

export function SwaggerSend() {
  return applyDecorators(
    ApiOperation({ summary: '[Private] [Sends Email] Send 2FA verification code' }),
    ApiResponse({ status: 200, description: 'Verification code sent successfully to user email' }),
    ApiResponse({ status: 401, description: 'Unauthorized' }),
  );
}
export function SwaggerVerify() {
  return applyDecorators(
    ApiOperation({
      summary: '[Private] Verify 2FA code and optionally trust device (Code sent via email)',
    }),
    ApiResponse({ status: 200, description: 'Code verified successfully' }),
    ApiResponse({ status: 400, description: 'Invalid or expired code' }),
    ApiResponse({ status: 401, description: 'Unauthorized' }),
  );
}
