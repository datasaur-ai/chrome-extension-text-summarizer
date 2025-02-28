import type { LogLevel } from '../types';

export class Logger {
  private static instance: Logger;
  private readonly isDevelopment: boolean;

  private constructor() {
    this.isDevelopment = process.env.NODE_ENV === 'development';
  }

  public static getInstance(): Logger {
    if (!Logger.instance) {
      Logger.instance = new Logger();
    }
    return Logger.instance;
  }

  public log(level: LogLevel, message: string, ...args: unknown[]): void {
    if (this.isDevelopment || level === 'error') {
      const timestamp = new Date().toISOString();
      console[level](`[${timestamp}] ${message}`, ...args);
    }
  }
}