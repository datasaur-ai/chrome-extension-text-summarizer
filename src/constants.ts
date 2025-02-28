export const CONSTANTS = {
  STORAGE_KEYS: {
    API_URL: 'apiUrl',
    API_KEY: 'apiKey',
    PROMPT_TEMPLATE: 'promptTemplate',
  },
  DEFAULT_PROMPT: 'Please provide a concise summary of the following text: {text}',
  ERROR_MESSAGES: {
    MISSING_SETTINGS: 'Please set up your API URL and API Key in the extension settings.',
    NETWORK_ERROR: 'Network error occurred. Please check your connection.',
    API_ERROR: 'API error occurred: ',
    INVALID_RESPONSE: 'Invalid response from API',
  },
} as const;