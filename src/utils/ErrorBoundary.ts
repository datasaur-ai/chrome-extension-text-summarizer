import { Logger } from './Logger';

export class ErrorBoundary {
  private static readonly MAX_RETRIES = 3;
  private static readonly RETRY_DELAY = 1000;
  private static readonly logger = Logger.getInstance();

  public static async wrap<T>(
    operation: () => Promise<T>,
    retries = this.MAX_RETRIES
  ): Promise<T> {
    try {
      return await operation();
    } catch (error) {
      this.logger.log('error', 'Operation failed:', error);
      
      if (retries > 0) {
        await new Promise(resolve => setTimeout(resolve, this.RETRY_DELAY));
        return this.wrap(operation, retries - 1);
      }
      throw error;
    }
  }

  public static async wrapWithFallback<T>(
    operation: () => Promise<T>,
    fallback: T
  ): Promise<T> {
    try {
      return await this.wrap(operation);
    } catch (error) {
      this.logger.log('error', 'Operation failed with fallback:', error);
      return fallback;
    }
  }
}