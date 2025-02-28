import { Logger } from './Logger';

export class RetryStrategy {
  private static readonly MAX_RETRIES = 3;
  private static readonly INITIAL_DELAY = 1000;
  private static readonly MAX_DELAY = 10000;
  private static readonly logger = Logger.getInstance();

  public static async execute<T>(
    operation: () => Promise<T>,
    options: {
      maxRetries?: number;
      initialDelay?: number;
      maxDelay?: number;
      onRetry?: (error: Error, attempt: number) => void;
    } = {}
  ): Promise<T> {
    const maxRetries = options.maxRetries ?? this.MAX_RETRIES;
    const initialDelay = options.initialDelay ?? this.INITIAL_DELAY;
    const maxDelay = options.maxDelay ?? this.MAX_DELAY;

    let lastError: Error | undefined;
    let delay = initialDelay;

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        return await operation();
      } catch (error) {
        lastError = error instanceof Error ? error : new Error(String(error));
        
        if (attempt === maxRetries) break;
        
        this.logger.log('warn', `Attempt ${attempt} failed:`, lastError);
        options.onRetry?.(lastError, attempt);
        await new Promise(resolve => setTimeout(resolve, delay));
        delay = Math.min(delay * 2, maxDelay);
      }
    }

    throw lastError;
  }
}