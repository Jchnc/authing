/**
 * Global exception filter
 * Handles all (or most) exceptions thrown by the application
 * Don't touch this unless you know what you're doing or unless really needed :)
 */
import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { PrismaClientKnownRequestError } from '@prisma/client/runtime/library';
import { Response } from 'express';

@Catch()
export class GlobalExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(GlobalExceptionFilter.name);

  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    this.logger.error(exception);

    let status = HttpStatus.INTERNAL_SERVER_ERROR;
    let message: string | string[] = 'Internal server error';
    let error = 'Internal Server Error';
    let details: Record<string, unknown> | undefined;

    if (exception instanceof PrismaClientKnownRequestError) {
      status = this.mapPrismaError(exception);
      message = this.getPrismaErrorMessage(exception);
      error = this.getPrismaErrorType(exception);
      details = this.getPrismaErrorDetails(exception);
    } else if (exception instanceof HttpException) {
      status = exception.getStatus();
      const responseObj = exception.getResponse();
      if (typeof responseObj === 'string') {
        message = responseObj;
      } else if (typeof responseObj === 'object' && responseObj !== null) {
        const objResponse = responseObj as Record<string, unknown>;
        message = (objResponse.message as string | string[]) || exception.message;
        details =
          (objResponse.details as Record<string, unknown>)
          || (objResponse.errors as Record<string, unknown>);
      }
      error = this.mapHttpExceptionName(exception.constructor.name);
    } else if (exception instanceof Error) {
      status = this.mapNativeError(exception);
      message = exception.message;
      error = this.mapNativeErrorName(exception.constructor.name);
    } else {
      message = 'An unknown error occurred';
      error = 'Unknown Error';
    }

    response.status(status).json({
      statusCode: status,
      error,
      message,
      details,
    });
  }

  private mapHttpExceptionName(exceptionName: string): string {
    switch (exceptionName) {
      case 'BadRequestException':
        return 'Bad Request';
      case 'UnauthorizedException':
        return 'Unauthorized';
      case 'ForbiddenException':
        return 'Forbidden';
      case 'NotFoundException':
        return 'Not Found';
      case 'ConflictException':
        return 'Conflict';
      default:
        return exceptionName
          .replace('Exception', '')
          .replace(/([A-Z])/g, ' $1')
          .trim();
    }
  }

  private mapNativeError(error: Error): number {
    if (error.constructor.name === 'TypeError') return HttpStatus.BAD_REQUEST;
    if (error.constructor.name === 'RangeError') return HttpStatus.BAD_REQUEST;
    if (error.constructor.name === 'ReferenceError') return HttpStatus.INTERNAL_SERVER_ERROR;
    return HttpStatus.INTERNAL_SERVER_ERROR;
  }

  private mapNativeErrorName(errorName: string): string {
    switch (errorName) {
      case 'TypeError':
        return 'Type Error';
      case 'RangeError':
        return 'Range Error';
      case 'ReferenceError':
        return 'Reference Error';
      default:
        return errorName.replace(/([A-Z])/g, ' $1').trim();
    }
  }

  private mapPrismaError(error: PrismaClientKnownRequestError): number {
    switch (error.code) {
      case 'P2002':
        return HttpStatus.CONFLICT;
      case 'P2025':
        return HttpStatus.NOT_FOUND;
      default:
        return HttpStatus.BAD_REQUEST;
    }
  }

  private getPrismaErrorMessage(error: PrismaClientKnownRequestError): string {
    const { model, field } = this.extractModelAndField(error);
    const friendlyModel =
      model ?
        model
          .replace(/([A-Z])/g, ' $1')
          .trim()
          .toLowerCase()
      : 'record';

    switch (error.code) {
      case 'P2002':
        return `${friendlyModel} with this ${field} already exists`;
      case 'P2025':
        return `${this.capitalizeFirstLetter(friendlyModel)} not found`;
      default:
        return `Database error: ${error.message}`;
    }
  }

  private getPrismaErrorType(error: PrismaClientKnownRequestError): string {
    switch (error.code) {
      case 'P2002':
        return 'Conflict';
      case 'P2025':
        return 'Not Found';
      default:
        return 'Database Error';
    }
  }

  private getPrismaErrorDetails(
    error: PrismaClientKnownRequestError,
  ): Record<string, unknown> | undefined {
    const { model, field } = this.extractModelAndField(error);
    return {
      model,
      field,
      constraint: error.meta?.target,
      code: error.code,
    };
  }

  private extractModelAndField(error: PrismaClientKnownRequestError): {
    model: string;
    field: string;
  } {
    let model = 'record';
    let field = 'field';

    if (error.meta?.modelName && typeof error.meta.modelName === 'string') {
      model = error.meta.modelName;
    }

    if (error.meta?.target) {
      let target: string;
      if (Array.isArray(error.meta.target)) {
        const firstElement: unknown = error.meta.target[0];
        target = typeof firstElement === 'string' ? firstElement : String(firstElement);
      } else if (typeof error.meta.target === 'string') {
        target = error.meta.target;
      } else {
        target = 'field';
      }

      const match = target.match(/^(?<model>[A-Za-z0-9]+)?_?(?<field>[A-Za-z0-9]+)_key$/);
      if (match?.groups) {
        if (match.groups.model) model = match.groups.model;
        if (match.groups.field) field = match.groups.field;
      } else {
        field = target;
      }
    }

    model = model.toLowerCase();
    field = field.toLowerCase();

    return { model, field };
  }

  private capitalizeFirstLetter(text: string): string {
    return text.charAt(0).toUpperCase() + text.slice(1);
  }
}
