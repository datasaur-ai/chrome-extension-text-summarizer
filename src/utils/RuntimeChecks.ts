export class RuntimeChecks {
  public static ensureNonNull<T>(
    value: T | null | undefined,
    message = 'Value cannot be null or undefined'
  ): T {
    if (value === null || value === undefined) {
      throw new Error(message);
    }
    return value;
  }

  public static ensureCondition(
    condition: boolean,
    message: string
  ): void {
    if (!condition) {
      throw new Error(message);
    }
  }

  public static ensureType<T>(
    value: unknown,
    typeGuard: (value: unknown) => value is T,
    message = 'Invalid type'
  ): T {
    if (!typeGuard(value)) {
      throw new Error(message);
    }
    return value;
  }
}