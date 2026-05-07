import { Injectable, Logger } from '@nestjs/common';

@Injectable()
export class AppLogger extends Logger {
  private formatMessage(message: string, meta?: Record<string, unknown>): string {
    if (!meta || Object.keys(meta).length === 0) {
      return message;
    }
    return `${message} | ${JSON.stringify(meta)}`;
  }

  log(message: string, context?: string, meta?: Record<string, unknown>) {
    super.log(this.formatMessage(message, meta), context);
  }

  error(message: string, trace?: string, context?: string, meta?: Record<string, unknown>) {
    super.error(this.formatMessage(message, meta), trace, context);
  }

  warn(message: string, context?: string, meta?: Record<string, unknown>) {
    super.warn(this.formatMessage(message, meta), context);
  }
}
