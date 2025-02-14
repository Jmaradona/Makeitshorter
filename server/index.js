import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import OpenAI from 'openai';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables
dotenv.config();

const app = express();
const port = process.env.PORT || 3000;

// Constants for token control
const MAX_INPUT_TOKENS = 10000;
const MAX_OUTPUT_TOKENS = 1000;
const TOKENS_PER_WORD = 1.3;

// Initialize OpenAI with better error handling
let openai = null;
try {
  if (!process.env.OPENAI_API_KEY) {
    throw new Error('OPENAI_API_KEY is not set in environment variables');
  }
  
  openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
    baseURL: 'https://api.openai.com/v1',
  });
  
  console.log('OpenAI client initialized successfully');
} catch (error) {
  console.error('Failed to initialize OpenAI:', error.message);
}

function countWords(text) {
  return text
    .trim()
    .replace(/[\r\n]+/g, ' ')
    .replace(/\s+/g, ' ')
    .split(' ')
    .filter(word => word.length > 0)
    .length;
}

function estimateTokens(text) {
  return Math.ceil(countWords(text) * TOKENS_PER_WORD);
}

// Configure CORS to allow requests from your frontend domain
const allowedOrigins = [
  'http://localhost:5173',
  'http://localhost:3000',
  'https://meek-bavarois-e023e1.netlify.app', // Your Netlify URL
  process.env.FRONTEND_URL // Any additional frontend URL
].filter(Boolean);

app.use(cors({
  origin: function(origin, callback) {
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) return callback(null, true);
    
    if (allowedOrigins.indexOf(origin) === -1) {
      const msg = 'The CORS policy for this site does not allow access from the specified Origin.';
      return callback(new Error(msg), false);
    }
    return callback(null, true);
  },
  credentials: true
}));

app.use(express.json());

app.get('/api/health', (req, res) => {
  const apiKey = process.env.OPENAI_API_KEY;
  res.json({ 
    status: 'ok', 
    timestamp: new Date().toISOString(),
    aiEnabled: !!apiKey && !!openai
  });
});

app.post('/api/enhance', async (req, res) => {
  if (!openai) {
    return res.status(503).json({
      error: 'AI enhancement is currently unavailable. Please check the server configuration.'
    });
  }

  try {
    const { content, tone, targetWords, inputType } = req.body;

    if (!content?.trim()) {
      return res.status(400).json({ error: 'Content is required' });
    }

    if (!targetWords || targetWords < 1) {
      return res.status(400).json({ error: 'Invalid target word count' });
    }

    const estimatedInputTokens = estimateTokens(content);
    if (estimatedInputTokens > MAX_INPUT_TOKENS) {
      return res.status(400).json({ 
        error: `Input too long. Maximum ${MAX_INPUT_TOKENS} tokens allowed.`
      });
    }

    const maxOutputTokens = Math.min(
      MAX_OUTPUT_TOKENS,
      Math.ceil(targetWords * TOKENS_PER_WORD * 2)
    );

    const systemPrompt = `You are a writing assistant that rewrites text to be more concise.

CRITICAL INSTRUCTIONS:
1. Your output MUST NOT exceed ${targetWords} words
2. Being shorter than ${targetWords} words is acceptable and encouraged if it maintains clarity
3. These each count as ONE word: "Hello-world", "AI", "don't", "2024", "a"
4. For emails, the "Subject:" line is NOT counted in the word limit
5. Focus on being clear and concise

Your task: Rewrite the following ${inputType} in ${tone} tone, aiming for ${targetWords} words or fewer.

Format your response as:
${inputType === 'email' ? 'Subject: [Your subject]\n\n[Your concise content]' : '[Your concise content]'}`;

    const completion = await openai.chat.completions.create({
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content }
      ],
      model: "gpt-3.5-turbo",
      temperature: 0.7,
      max_tokens: maxOutputTokens,
      presence_penalty: 0.1,
      frequency_penalty: 0.1,
    });

    const enhancedContent = completion.choices[0]?.message?.content?.trim();
    
    if (!enhancedContent) {
      throw new Error('No content received from AI');
    }

    const subjectMatch = enhancedContent.match(/^Subject:.*?\n(.*)/s);
    const textToCount = subjectMatch ? subjectMatch[1].trim() : enhancedContent.trim();
    const wordCount = countWords(textToCount);

    // Allow a 10% margin over the target word count
    const maxAllowedWords = Math.ceil(targetWords * 1.1);
    
    if (wordCount > maxAllowedWords) {
      return res.status(400).json({ 
        error: `Response too long (${wordCount} words). Please try again for a shorter version.`,
        enhancedContent
      });
    }

    res.json({ 
      enhancedContent,
      wordCount
    });
  } catch (error) {
    console.error('API Error:', error);
    
    if (error.response?.status === 401) {
      res.status(401).json({ 
        error: 'Invalid API key. Please check your OpenAI API key configuration.'
      });
    } else if (error.response?.status === 429) {
      res.status(429).json({ 
        error: 'Rate limit exceeded. Please try again in a moment.' 
      });
    } else {
      res.status(500).json({ 
        error: error.message || 'Failed to enhance content. Please try again.' 
      });
    }
  }
});

app.listen(port, '0.0.0.0', () => {
  console.log(`Server running on port ${port}`);
  if (!process.env.OPENAI_API_KEY) {
    console.log('\nWARNING: OpenAI API key is missing. AI features will be disabled.');
    console.log('To enable AI features, add OPENAI_API_KEY to your environment variables.\n');
  }
});