import { ErrorBoundary } from './ErrorBoundary';
import { Logger } from './Logger';
import { RuntimeChecks } from './RuntimeChecks';

export class SecureStorage {
  private static instance: SecureStorage;
  private readonly logger = Logger.getInstance();

  private constructor() {}

  public static getInstance(): SecureStorage {
    if (!this.instance) {
      this.instance = new SecureStorage();
    }
    return this.instance;
  }

  public async get<T>(key: string): Promise<T | null> {
    RuntimeChecks.ensureNonNull(key, 'Storage key cannot be null');
    
    return ErrorBoundary.wrap(async () => {
      const result = await chrome.storage.sync.get(key);
      return result[key] as T || null;
    });
  }

  public async set<T>(key: string, value: T): Promise<void> {
    RuntimeChecks.ensureNonNull(key, 'Storage key cannot be null');
    RuntimeChecks.ensureNonNull(value, 'Storage value cannot be null');

    return ErrorBoundary.wrap(async () => {
      await chrome.storage.sync.set({ [key]: value });
      this.logger.log('debug', `Stored value for key: ${key}`);
    });
  }

  public async remove(key: string): Promise<void> {
    RuntimeChecks.ensureNonNull(key, 'Storage key cannot be null');

    return ErrorBoundary.wrap(async () => {
      await chrome.storage.sync.remove(key);
      this.logger.log('debug', `Removed value for key: ${key}`);
    });
  }
}