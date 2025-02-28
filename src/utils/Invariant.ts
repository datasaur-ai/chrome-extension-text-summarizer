export class Invariant {
  public static assert(
    condition: boolean,
    message: string,
    errorCode?: string
  ): asserts condition {
    if (!condition) {
      const error = new Error(`Invariant violation: ${message}`);
      if (errorCode) {
        (error as any).code = errorCode;
      }
      Error.captureStackTrace(error, this.assert);
      throw error;
    }
  }

  public static assertNonNull<T>(
    value: T | null | undefined,
    message: string
  ): asserts value is T {
    this.assert(value != null, message);
  }

  public static assertType<T>(
    value: unknown,
    check: (value: unknown) => value is T,
    message: string
  ): asserts value is T {
    this.assert(check(value), message);
  }
}