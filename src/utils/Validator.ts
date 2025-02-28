export class Validator {
  public static readonly URL_REGEX = /^https?:\/\/[^\s/$.?#].[^\s]*$/i;
  public static readonly API_KEY_REGEX = /^[A-Za-z0-9-_]+$/;

  public static validateUrl(url: string): boolean {
    return this.URL_REGEX.test(url.trim());
  }

  public static validateApiKey(apiKey: string): boolean {
    return this.API_KEY_REGEX.test(apiKey.trim());
  }

  public static validateText(text: string, maxLength = 5000): boolean {
    const trimmed = text.trim();
    return trimmed.length > 0 && trimmed.length <= maxLength;
  }

  public static sanitizeInput(input: string): string {
    return input
      .trim()
      .replace(/[<>]/g, '') // Basic XSS prevention
      .slice(0, 5000); // Prevent too long inputs
  }
}