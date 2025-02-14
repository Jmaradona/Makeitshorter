import { AIResponse } from '../types';
import { countWords } from '../utils/textUtils';

interface EnhanceEmailPayload {
  content: string;
  tone: string;
  targetWords: number;
  inputType: string;
}

export async function enhanceEmail(payload: EnhanceEmailPayload): Promise<AIResponse> {
  try {
    // Get the backend URL from environment variables
    const apiUrl = import.meta.env.VITE_BACKEND_URL;
    
    if (!apiUrl) {
      return {
        enhancedContent: '',
        error: 'Backend URL is not configured. Please check your environment variables.'
      };
    }

    // First check if the server is running
    const healthCheck = await fetch(`${apiUrl}/api/health`).catch(() => null);
    if (!healthCheck?.ok) {
      return {
        enhancedContent: '',
        error: 'Cannot connect to the server. Please try again later.'
      };
    }

    // Use our consistent word counting function
    const currentWords = countWords(payload.content);
    const action = payload.targetWords > currentWords ? "expand" : "shorten";

    const enhancedPayload = {
      ...payload,
      content: `CRITICAL WORD COUNT REQUIREMENT: ${payload.targetWords} WORDS EXACTLY

Current text (${currentWords} words):
${payload.content}

STRICT REQUIREMENTS:
1. Your response MUST be EXACTLY ${payload.targetWords} words
2. Not ${payload.targetWords - 1} words
3. Not ${payload.targetWords + 1} words
4. EXACTLY ${payload.targetWords} words

Word counting rules (these are exact, do not deviate):
- "don't" = ONE word
- "2024" = ONE word
- "state-of-the-art" = ONE word
- "AI" = ONE word
- "high school" = TWO words
- "New York City" = THREE words

Required action: ${action.toUpperCase()} from ${currentWords} to ${payload.targetWords} words

FORMAT:
- Plain text only
- No markdown
- No bullet points
- No numbered lists
- Natural paragraphs only

Tone: ${payload.tone}

REMEMBER: Count your words carefully. The output MUST be EXACTLY ${payload.targetWords} words.`
    };

    const response = await fetch(`${apiUrl}/api/enhance`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(enhancedPayload),
    });

    const data = await response.json();

    if (!response.ok) {
      return {
        enhancedContent: '',
        error: data.error || 'Failed to enhance content'
      };
    }

    return { enhancedContent: data.enhancedContent };
  } catch (error) {
    console.error('AI Service Error:', error);
    return {
      enhancedContent: '',
      error: error instanceof Error 
        ? error.message 
        : 'Failed to connect to the enhancement service. Please try again.'
    };
  }
}
