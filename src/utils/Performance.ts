import { Logger } from './Logger';

export class Performance {
  private static readonly metrics: Map<string, number[]> = new Map();
  private static readonly logger = Logger.getInstance();

  public static async measure<T>(
    name: string,
    operation: () => Promise<T>
  ): Promise<T> {
    const start = performance.now();
    try {
      return await operation();
    } finally {
      const duration = performance.now() - start;
      this.recordMetric(name, duration);
    }
  }

  private static recordMetric(name: string, duration: number): void {
    const metrics = this.metrics.get(name) || [];
    metrics.push(duration);
    this.metrics.set(name, metrics.slice(-100)); // Keep last 100 measurements

    const average = metrics.reduce((a, b) => a + b, 0) / metrics.length;
    this.logger.log(
      'debug',
      `Performance metric - ${name}: ${duration.toFixed(2)}ms (avg: ${average.toFixed(2)}ms)`
    );
  }
}