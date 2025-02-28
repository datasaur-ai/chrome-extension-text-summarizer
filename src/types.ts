export interface Settings {
  apiUrl: string;
  apiKey: string;
  promptTemplate: string;
}

export interface APIResponse {
  choices: Array<{
    message: {
      content: string;
      role: string;
    };
  }>;
}

export interface Message {
  action: 'showSummary' | 'showLoader';
  summary?: string;
}

export type LogLevel = 'debug' | 'info' | 'warn' | 'error';