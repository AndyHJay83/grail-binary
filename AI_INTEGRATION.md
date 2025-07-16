# AI Reading Integration

This app includes an AI-powered reading feature that generates personalized psychological insights based on user responses to psychological profiling questions.

## Features

- **Personalized Readings**: AI generates unique readings based on psychological profile answers
- **Multiple AI Providers**: Support for OpenAI, Claude, Ollama, and mock AI
- **Easy Configuration**: Simple setup for different AI services
- **Fallback Support**: Graceful error handling with user-friendly messages

## Setup

### 1. OpenAI (ChatGPT)

1. Get an API key from [OpenAI](https://platform.openai.com/api-keys)
2. Add to your environment variables:
   ```bash
   REACT_APP_OPENAI_API_KEY=your_api_key_here
   ```
3. Update the configuration in `src/utils/aiService.ts`:
   ```typescript
   export const defaultAiConfig: AiServiceConfig = {
     provider: 'openai',
     apiKey: process.env.REACT_APP_OPENAI_API_KEY,
     model: 'gpt-3.5-turbo'
   };
   ```

### 2. Claude (Anthropic)

1. Get an API key from [Anthropic](https://console.anthropic.com/)
2. Add to your environment variables:
   ```bash
   REACT_APP_CLAUDE_API_KEY=your_api_key_here
   ```
3. Update the configuration:
   ```typescript
   export const defaultAiConfig: AiServiceConfig = {
     provider: 'claude',
     apiKey: process.env.REACT_APP_CLAUDE_API_KEY,
     model: 'claude-3-sonnet-20240229'
   };
   ```

### 3. Ollama (Local Models)

1. Install [Ollama](https://ollama.ai/)
2. Pull a model: `ollama pull llama2`
3. Start Ollama server (usually runs on `http://localhost:11434`)
4. Update the configuration:
   ```typescript
   export const defaultAiConfig: AiServiceConfig = {
     provider: 'ollama',
     baseUrl: 'http://localhost:11434',
     model: 'llama2'
   };
   ```

### 4. Mock AI (Development)

For development and testing, the app uses a sophisticated mock AI that provides realistic readings:

```typescript
export const defaultAiConfig: AiServiceConfig = {
  provider: 'mock',
  model: 'mock-ai-v1'
};
```

## Usage

1. **Enable Psychological Profiling**: Go to Settings and enable psychological profiling
2. **Answer Questions**: Complete the psychological questions during the filtering process
3. **Generate Reading**: After long-press confirmation, click the "🤖 AI Reading" button
4. **View Results**: The personalized reading appears below the wordlists

## Customization

### Adding New AI Providers

1. Add the provider to the `AiServiceConfig` interface
2. Implement the generation function in `aiService.ts`
3. Add the case to the switch statement in `generateAiReading`

### Customizing Prompts

Modify the prompt in `FilterPage.tsx` to change how the AI interprets the psychological profile:

```typescript
const prompt = `Your custom prompt here...`;
```

### Environment-Specific Configuration

You can set different AI providers for different environments:

```typescript
const config = process.env.NODE_ENV === 'production' 
  ? { provider: 'openai', apiKey: process.env.REACT_APP_OPENAI_API_KEY }
  : { provider: 'mock' };
```

## Error Handling

The AI reading feature includes comprehensive error handling:

- **API Errors**: Graceful fallback with user-friendly messages
- **Network Issues**: Automatic retry logic
- **Invalid Responses**: Validation and sanitization
- **Rate Limiting**: Respectful API usage with delays

## Security

- API keys are stored in environment variables
- No sensitive data is logged
- All API calls use HTTPS
- User data is not stored or transmitted unnecessarily

## Cost Considerations

- **OpenAI**: ~$0.002 per reading (GPT-3.5-turbo)
- **Claude**: ~$0.015 per reading (Claude-3-Sonnet)
- **Ollama**: Free (local processing)
- **Mock**: Free (no external calls)

## Troubleshooting

### Common Issues

1. **"Unable to generate reading"**: Check API key and network connection
2. **Slow responses**: Consider using a faster model or local Ollama
3. **Generic readings**: Ensure psychological questions are properly answered

### Debug Mode

Enable debug logging by adding to your environment:

```bash
REACT_APP_DEBUG_AI=true
```

This will log detailed information about AI requests and responses. 