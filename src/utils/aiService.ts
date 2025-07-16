// AI Service Configuration and Integration
// This file handles AI reading generation with support for multiple AI providers

export interface AiServiceConfig {
  provider: 'openai' | 'claude' | 'mock' | 'ollama';
  apiKey?: string;
  baseUrl?: string;
  model?: string;
}

// Default configuration
export const defaultAiConfig: AiServiceConfig = {
  provider: 'mock', // Change to 'openai' when ready to use real AI
  model: 'gpt-3.5-turbo'
};

export interface AiReadingRequest {
  prompt: string;
  profileAnswers: string[];
  config?: AiServiceConfig;
}

export interface AiReadingResponse {
  reading: string;
  provider: string;
  model?: string;
}

// Generate AI reading using the configured service
export async function generateAiReading(request: AiReadingRequest): Promise<AiReadingResponse> {
  const config = request.config || defaultAiConfig;
  
  switch (config.provider) {
    case 'openai':
      return await generateOpenAiReading(request, config);
    case 'claude':
      return await generateClaudeReading(request, config);
    case 'ollama':
      return await generateOllamaReading(request, config);
    case 'mock':
    default:
      return await generateMockReading(request, config);
  }
}

// OpenAI API integration
async function generateOpenAiReading(request: AiReadingRequest, config: AiServiceConfig): Promise<AiReadingResponse> {
  if (!config.apiKey) {
    throw new Error('OpenAI API key required');
  }

  try {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${config.apiKey}`
      },
      body: JSON.stringify({
        model: config.model || 'gpt-3.5-turbo',
        messages: [
          {
            role: 'system',
            content: 'You are a compassionate AI that provides personalized psychological readings based on user responses. Keep readings positive, insightful, and 2-3 sentences long. Focus on personality traits and patterns revealed by the answers.'
          },
          {
            role: 'user',
            content: request.prompt
          }
        ],
        max_tokens: 150,
        temperature: 0.7
      })
    });

    if (!response.ok) {
      throw new Error(`OpenAI API error: ${response.status}`);
    }

    const data = await response.json();
    return {
      reading: data.choices[0].message.content,
      provider: 'openai',
      model: config.model
    };
  } catch (error) {
    console.error('OpenAI API error:', error);
    throw error;
  }
}

// Claude API integration (Anthropic)
async function generateClaudeReading(request: AiReadingRequest, config: AiServiceConfig): Promise<AiReadingResponse> {
  if (!config.apiKey) {
    throw new Error('Claude API key required');
  }

  try {
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': config.apiKey,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: config.model || 'claude-3-sonnet-20240229',
        max_tokens: 150,
        messages: [
          {
            role: 'user',
            content: request.prompt
          }
        ]
      })
    });

    if (!response.ok) {
      throw new Error(`Claude API error: ${response.status}`);
    }

    const data = await response.json();
    return {
      reading: data.content[0].text,
      provider: 'claude',
      model: config.model
    };
  } catch (error) {
    console.error('Claude API error:', error);
    throw error;
  }
}

// Ollama local model integration
async function generateOllamaReading(request: AiReadingRequest, config: AiServiceConfig): Promise<AiReadingResponse> {
  try {
    const response = await fetch(`${config.baseUrl || 'http://localhost:11434'}/api/generate`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: config.model || 'llama2',
        prompt: request.prompt,
        stream: false
      })
    });

    if (!response.ok) {
      throw new Error(`Ollama API error: ${response.status}`);
    }

    const data = await response.json();
    return {
      reading: data.response,
      provider: 'ollama',
      model: config.model
    };
  } catch (error) {
    console.error('Ollama API error:', error);
    throw error;
  }
}

// Mock AI reading for development/testing
async function generateMockReading(request: AiReadingRequest, config: AiServiceConfig): Promise<AiReadingResponse> {
  // Simulate API delay
  await new Promise(resolve => setTimeout(resolve, 2000));
  
  const { profileAnswers } = request;
  
  // Parse the answers to create an intelligent response
  const yesCount = profileAnswers.filter(answer => answer.includes(': YES')).length;
  const totalQuestions = profileAnswers.length;
  const positiveRatio = yesCount / totalQuestions;
  
  // Create sophisticated readings based on patterns
  const readings = [
    {
      condition: positiveRatio > 0.7,
      text: "Your responses reveal an optimistic and outgoing personality. You embrace new experiences with enthusiasm and tend to see the positive in most situations. This natural positivity serves you well in building connections and pursuing your goals."
    },
    {
      condition: positiveRatio < 0.3,
      text: "You have a thoughtful and introspective nature. Your careful consideration of choices reflects a deep understanding of yourself and others. This contemplative approach gives you unique insights that others often miss."
    },
    {
      condition: positiveRatio >= 0.3 && positiveRatio <= 0.7,
      text: "You display a balanced approach to life, weighing both logic and intuition in your decisions. This equilibrium allows you to adapt to different situations while staying true to your core values."
    }
  ];
  
  const selectedReading = readings.find(r => r.condition) || readings[2];
  
  // Add personalization based on specific answers
  let personalization = '';
  if (profileAnswers.some(a => a.includes('introvert'))) {
    personalization = " Your preference for meaningful connections over large social gatherings shows wisdom in choosing quality over quantity.";
  }
  if (profileAnswers.some(a => a.includes('morning person'))) {
    personalization = " Your natural early-rising energy suggests you're someone who values structure and makes the most of each day.";
  }
  if (profileAnswers.some(a => a.includes('traveling'))) {
    personalization = " Your love for exploration indicates a curious spirit that finds growth in new experiences and perspectives.";
  }
  
  return {
    reading: selectedReading.text + personalization,
    provider: 'mock',
    model: 'mock-ai-v1'
  };
} 