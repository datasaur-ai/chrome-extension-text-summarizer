import { CONSTANTS } from '../constants';
import type { Settings } from '../types';
import { Disposable } from '../utils/Disposable';
import { ErrorBoundary } from '../utils/ErrorBoundary';
import { Logger } from '../utils/Logger';
import { RuntimeChecks } from '../utils/RuntimeChecks';
import { SecureStorage } from '../utils/SecureStorage';
import { Validator } from '../utils/Validator';

import './popup.scss';

class PopupManager extends Disposable {
  private readonly form: HTMLFormElement;
  private readonly status: HTMLElement;
  private readonly storage: SecureStorage;
  private readonly logger: Logger;
  private saveInProgress = false;

  constructor() {
    super();
    this.form = RuntimeChecks.ensureNonNull(
      document.querySelector<HTMLFormElement>('#settingsForm'),
      'Settings form not found'
    );
    this.status = RuntimeChecks.ensureNonNull(
      document.querySelector<HTMLElement>('#status'),
      'Status element not found'
    );
    this.storage = SecureStorage.getInstance();
    this.logger = Logger.getInstance();
    this.initialize();
  }

  private initialize(): void {
    this._register({
      dispose: () => {
        this.form.removeEventListener('submit', this.handleSubmit);
      }
    });
    this.form.addEventListener('submit', (e) => this.handleSubmit(e));
    
    this.loadSettings().catch(this.handleError.bind(this));
  }

  private async loadSettings(): Promise<void> {
    return ErrorBoundary.wrap(async () => {
      const settings = await this.storage.get<Settings>('settings');
      if (settings) {
        Object.entries(settings).forEach(([key, value]) => {
          const input = this.form.elements.namedItem(key) as HTMLInputElement;
          if (input) {
            input.value = value;
          }
        });
      } else {
        (this.form.elements.namedItem('promptTemplate') as HTMLTextAreaElement)
          .value = CONSTANTS.DEFAULT_PROMPT;
      }
    });
  }

  private async handleSubmit(event: Event): Promise<void> {
    event.preventDefault();
    if (this.saveInProgress) return;

    try {
      this.saveInProgress = true;
      await this.saveSettings();
      this.showSuccess('Settings saved successfully');
    } catch (error) {
      this.handleError(error);
    } finally {
      this.saveInProgress = false;
    }
  }

  private async saveSettings(): Promise<void> {
    const formData = new FormData(this.form);
    const settings: Settings = {
      apiUrl: formData.get('apiUrl') as string,
      apiKey: formData.get('apiKey') as string,
      promptTemplate: formData.get('promptTemplate') as string,
    };

    RuntimeChecks.ensureCondition(
      Validator.validateUrl(settings.apiUrl),
      'Invalid API URL'
    );
    RuntimeChecks.ensureCondition(
      Validator.validateApiKey(settings.apiKey),
      'Invalid API Key'
    );

    await this.storage.set('settings', settings);
  }

  private showSuccess(message: string): void {
    this.status.className = 'status success';
    this.status.textContent = message;
  }

  private handleError(error: unknown): void {
    const message = error instanceof Error ? error.message : String(error);
    this.status.className = 'status error';
    this.status.textContent = `Error: ${message}`;
    this.logger.log('error', 'Settings error:', error);
  }
}

// Initialize popup
document.addEventListener('DOMContentLoaded', () => {
  const popup = new PopupManager();
  
  // Cleanup on window unload
  window.addEventListener('unload', () => {
    popup.dispose();
  });
});