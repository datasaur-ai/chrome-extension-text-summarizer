# Text Summarizer Chrome Extension

A Chrome extension that uses Datasaur's LLM Labs to summarize selected text on any webpage.

## Features

- Summarize any selected text with right-click context menu
- Clean and modern popup interface for settings
- Real-time text summarization using Datasaur's LLM Labs
- Configurable API settings
- Error handling and validation
- Loading indicators and status messages

## Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/datasaur-ai/chrome-extension-text-summarizer.git
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Build the extension:
   ```bash
   npm run build
   ```

4. Load the extension in Chrome:
   - Open Chrome and navigate to `chrome://extensions/`
   - Enable "Developer mode" in the top right
   - Click "Load unpacked" and select the `dist` folder from the project

## Configuration

Before using the extension, you need to configure your Datasaur LLM Labs API settings:

1. Create and deploy your LLM application in [Datasaur LLM Labs](https://docs.datasaur.ai/llm-projects/deployment)
2. In the deployment details page:
   - Click "Create API Key" to generate your API key
   - Copy the API endpoint URL
3. In the Chrome extension:
   - Click the extension icon in the toolbar
   - Enter the API URL and API key from Datasaur LLM Labs
   - Click "Save Settings"

Note: Make sure your deployed application is active and not suspended to use the summarization feature.

## Usage

1. Select any text on a webpage
2. Right-click and select "Summarize Selection" from the context menu
3. Wait for the summary to appear in a popup
4. Click the "×" button to close the summary popup

## Development

### Prerequisites

- Node.js (v14 or higher)
- npm (v6 or higher)
- Datasaur LLM Labs account

### Available Scripts

- `npm run dev` - Start development mode with hot reload
- `npm run build` - Build the extension for production
- `npm run test` - Run tests
- `npm run lint` - Run linting
- `npm run format` - Format code with Prettier

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## References

- [Datasaur LLM Labs Deployment Documentation](https://docs.datasaur.ai/llm-projects/deployment)

