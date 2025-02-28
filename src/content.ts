import { Disposable } from './utils/Disposable';
import { ErrorBoundary } from './utils/ErrorBoundary';
import { Logger } from './utils/Logger';
import { RuntimeChecks } from './utils/RuntimeChecks';
import type { Message } from './types';

import './content.scss';

class ContentScript extends Disposable {
  private readonly popups: Set<HTMLElement> = new Set();
  private readonly logger = Logger.getInstance();
  private currentPopup: HTMLElement | null = null;

  constructor() {
    super();
    this.initialize();
  }

  private initialize(): void {
    this._register({
      dispose: () => {
        this.popups.forEach(popup => popup.remove());
        this.popups.clear();
        this.currentPopup = null;
      }
    });

    chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
      try {
        this.handleMessage(message);
        sendResponse({ success: true });
      } catch (error) {
        this.logger.log('error', 'Message handling failed:', error);
        sendResponse({ success: false, error: String(error) });
      }
      return true; // Keep the message channel open for async response
    });
  }

  private handleMessage(message: any): void {
    RuntimeChecks.ensureType<Message>(
      message,
      (m): m is Message => 
        typeof m === 'object' && 
        m !== null && 
        'action' in m &&
        typeof m.action === 'string',
      'Invalid message format'
    );

    switch (message.action) {
      case 'showSummary':
        this.showSummary(message.summary || '');
        break;
      case 'showLoader':
        this.showLoader();
        break;
      default:
        throw new Error(`Unknown action: ${message.action}`);
    }
  }

  private createPopup(): HTMLElement {
    const popup = document.createElement('div');
    popup.className = 'text-summarizer-popup';
    popup.style.cssText = `
      position: fixed;
      top: 20px;
      right: 20px;
      max-width: 400px;
      padding: 16px;
      background: white;
      border-radius: 8px;
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
      z-index: 2147483647;
      font-family: system-ui, -apple-system, sans-serif;
      font-size: 14px;
      line-height: 1.5;
      color: #333;
    `;

    const buttonContainer = document.createElement('div');
    buttonContainer.className = 'button-container';

    const copyButton = document.createElement('button');
    copyButton.className = 'action-button copy-button';
    copyButton.title = 'Copy to clipboard';
    copyButton.innerHTML = `
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
        <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
      </svg>
      <span class="copy-feedback"></span>
    `;

    const closeButton = document.createElement('button');
    closeButton.className = 'action-button close-button';
    closeButton.title = 'Close';
    closeButton.innerHTML = `
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <path d="M18 6L6 18"></path>
        <path d="M6 6l12 12"></path>
      </svg>
    `;
    closeButton.addEventListener('click', () => this.removePopup(popup));

    buttonContainer.appendChild(copyButton);
    buttonContainer.appendChild(closeButton);
    popup.appendChild(buttonContainer);
    this.popups.add(popup);
    
    return popup;
  }

  private showSummary(summary: string): void {
    ErrorBoundary.wrap(async () => {
      const popup = this.getOrCreatePopup();
      const copyButton = popup.querySelector('.copy-button');
      const copyFeedback = popup.querySelector('.copy-feedback');
      
      popup.insertAdjacentHTML('beforeend', `
        <div class="summary-content">${summary}</div>
      `);

      if (copyButton && copyFeedback) {
        copyButton.addEventListener('click', () => {
          navigator.clipboard.writeText(summary).then(() => {
            copyFeedback.textContent = 'Copied!';
            copyButton.classList.add('copied');
            setTimeout(() => {
              copyFeedback.textContent = '';
              copyButton.classList.remove('copied');
            }, 2000);
          });
        });
      }
      
      document.body.appendChild(popup);
    });
  }

  private showLoader(): void {
    ErrorBoundary.wrap(async () => {
      const popup = this.getOrCreatePopup();
      const copyButton = popup.querySelector('.copy-button');
      if (copyButton && copyButton instanceof HTMLElement) {
        copyButton.style.display = 'none';
      }
      
      popup.insertAdjacentHTML('beforeend', `
        <div class="loader">Summarizing...</div>
      `);
      
      document.body.appendChild(popup);
    });
  }

  private getOrCreatePopup(): HTMLElement {
    if (this.currentPopup) {
      this.removePopup(this.currentPopup);
    }
    this.currentPopup = this.createPopup();
    return this.currentPopup;
  }

  private removePopup(popup: HTMLElement): void {
    popup.remove();
    this.popups.delete(popup);
    if (this.currentPopup === popup) {
      this.currentPopup = null;
      // Notify background service that popup was closed
      chrome.runtime.sendMessage({ action: 'popupClosed' });
    }
  }
}

// Initialize content script
const script = new ContentScript();

// Cleanup on window unload
window.addEventListener('unload', () => {
  script.dispose();
});