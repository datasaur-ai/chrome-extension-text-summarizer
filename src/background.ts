import { CONSTANTS } from './constants';
import type { Settings, APIResponse } from './types';
import { Disposable } from './utils/Disposable';
import { ErrorBoundary } from './utils/ErrorBoundary';
import { RateLimiter } from './utils/RateLimiter';
import { Logger } from './utils/Logger';
import { Performance } from './utils/Performance';
import { RequestQueue } from './utils/RequestQueue';
import { RetryStrategy } from './utils/RetryStrategy';
import { RuntimeChecks } from './utils/RuntimeChecks';
import { SecureStorage } from './utils/SecureStorage';
import { StateValidator } from './utils/StateValidator';
import { Validator } from './utils/Validator';

class SummaryService extends Disposable {
  private readonly rateLimiter: RateLimiter;
  private readonly logger: Logger;
  private readonly storage: SecureStorage;
  private readonly queue: RequestQueue;
  private readonly stateValidator: StateValidator;
  private readonly abortControllers: Map<string, AbortController>;

  private static readonly States = {
    IDLE: 'IDLE',
    LOADING: 'LOADING',
    SUMMARIZING: 'SUMMARIZING',
    ERROR: 'ERROR'
  } as const;

  constructor() {
    super();
    this.rateLimiter = new RateLimiter(60000, 10); // 10 requests per minute
    this.logger = Logger.getInstance();
    this.storage = SecureStorage.getInstance();
    this.queue = RequestQueue.getInstance();
    this.stateValidator = StateValidator.getInstance();
    this.abortControllers = new Map();

    this.initialize();
  }

  private initialize(): void {
    Object.values(SummaryService.States).forEach(state => 
      this.stateValidator.registerState(state)
    );
    this.stateValidator.transition(null, SummaryService.States.IDLE);

    chrome.runtime.onInstalled.addListener(() => {
      console.log('Extension installed');
      chrome.contextMenus.create({
        id: 'summarizeText',
        title: 'Summarize Selection',
        contexts: ['selection'],
      });
    });

    chrome.contextMenus.onClicked.addListener((info, tab) => {
      if (info.menuItemId === 'summarizeText' && tab?.id) {
        this.handleSummarizeRequest(info.selectionText || '', tab.id);
      }
    });

    // Listen for messages from popup or content script
    chrome.runtime.onMessage.addListener((request, _sender, sendResponse) => {
      if (request.action === 'popupClosed') {
        this.resetState();
      }
      sendResponse({ received: true });
      return true;
    });

    this._register({ 
      dispose: () => {
        this.abortControllers.forEach(controller => controller.abort());
        this.abortControllers.clear();
      }
    });
  }

  private async getSettings(): Promise<Settings> {
    return ErrorBoundary.wrapWithFallback(
      async () => {
        const settings = await this.storage.get<Settings>('settings');
        return settings || { apiUrl: '', apiKey: '', promptTemplate: CONSTANTS.DEFAULT_PROMPT };
      },
      {
        apiUrl: '',
        apiKey: '',
        promptTemplate: CONSTANTS.DEFAULT_PROMPT,
      }
    );
  }

  private async fetchSummary(
    apiUrl: string,
    apiKey: string,
    prompt: string
  ): Promise<string> {
    await this.rateLimiter.throttle();

    return this.queue.enqueue(async () => {
      return Performance.measure('api-request', async () => {
        const requestId = crypto.randomUUID();
        const controller = new AbortController();
        this.abortControllers.set(requestId, controller);

        try {
          const timeoutId = setTimeout(() => controller.abort(), 30000);
          const sanitizedPrompt = Validator.sanitizeInput(prompt);
          
          // Add source parameters to URL
          const url = new URL(apiUrl);
          url.searchParams.set('source', 'CHROME_EXTENSION');
          url.searchParams.set('sourceId', chrome.runtime.id);

          const response = await RetryStrategy.execute(async () => {
            const res = await fetch(url.toString(), {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${apiKey}`,
              },
              body: JSON.stringify({
                messages: [
                  {
                    role: 'user',
                    content: sanitizedPrompt,
                  },
                ],
              }),
              signal: controller.signal,
            });

            if (!res.ok) {
              throw new Error(`${CONSTANTS.ERROR_MESSAGES.API_ERROR}${res.status}`);
            }

            return res;
          });

          clearTimeout(timeoutId);

          const data = await response.json() as APIResponse;
          RuntimeChecks.ensureNonNull(data.choices?.[0]?.message?.content);
          
          return data.choices[0]?.message.content ?? 'no content';
        } finally {
          this.abortControllers.delete(requestId);
        }
      });
    });
  }

  private resetState(): void {
    const currentState = this.stateValidator.getCurrentState();
    if (currentState !== SummaryService.States.IDLE) {
      this.stateValidator.transition(currentState, SummaryService.States.IDLE);
    }
  }

  public async handleSummarizeRequest(
    selectedText: string,
    tabId: number
  ): Promise<void> {
    try {
      // Reset state before starting new request
      this.resetState();

      this.stateValidator.transition(
        SummaryService.States.IDLE,
        SummaryService.States.LOADING
      );

      RuntimeChecks.ensureCondition(
        Validator.validateText(selectedText),
        'Invalid text selection'
      );

      // Check settings before showing loader
      const settings = await this.getSettings();
      if (!settings.apiKey || !settings.apiUrl) {
        this.resetState();
        await this.showError(tabId, new Error('Please configure API settings in the extension popup'));
        // Open the popup for configuration
        await chrome.action.openPopup();
        return;
      }

      await this.showLoader(tabId);
      
      this.stateValidator.transition(
        SummaryService.States.LOADING,
        SummaryService.States.SUMMARIZING
      );

      const prompt = this.createPrompt(settings.promptTemplate, selectedText);
      const summary = await this.fetchSummary(
        settings.apiUrl,
        settings.apiKey,
        prompt
      );

      await this.showSummary(tabId, summary);
      this.resetState();
    } catch (error) {
      this.logger.log('error', 'Summarization failed:', error);
      this.resetState();
      await this.showError(tabId, error as Error);
    }
  }

  private createPrompt(template: string, text: string): string {
    return template.replace('{text}', Validator.sanitizeInput(text));
  }

  private async showLoader(tabId: number): Promise<void> {
    return ErrorBoundary.wrap(async () => {
      await chrome.tabs.sendMessage(tabId, { action: 'showLoader' });
    });
  }

  private async showSummary(tabId: number, summary: string): Promise<void> {
    return ErrorBoundary.wrap(async () => {
      await chrome.tabs.sendMessage(tabId, {
        action: 'showSummary',
        summary: Validator.sanitizeInput(summary),
      });
    });
  }

  private async showError(tabId: number, error: Error): Promise<void> {
    return ErrorBoundary.wrap(async () => {
      await chrome.tabs.sendMessage(tabId, {
        action: 'showSummary',
        summary: `Error: ${Validator.sanitizeInput(error.message)}`,
      });
    });
  }
}

// Initialize the service
new SummaryService();