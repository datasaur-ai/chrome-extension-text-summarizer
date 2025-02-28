export class RateLimiter {
  private timestamps: number[] = [];
  private readonly windowMs: number;
  private readonly maxRequests: number;

  constructor(windowMs: number, maxRequests: number) {
    this.windowMs = windowMs;
    this.maxRequests = maxRequests;
  }

  public async throttle(): Promise<void> {
    const now = Date.now();
    this.timestamps = this.timestamps.filter(
      timestamp => now - timestamp < this.windowMs
    );

    if (this.timestamps.length >= this.maxRequests) {
      const oldestTimestamp = this.timestamps[0] ?? 0;
      const waitTime = this.windowMs - (now - oldestTimestamp);
      await new Promise(resolve => setTimeout(resolve, waitTime));
    }

    this.timestamps.push(now);
  }
}