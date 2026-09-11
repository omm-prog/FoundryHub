import { GoogleGenerativeAI } from '@google/generative-ai';

const API_KEY = import.meta.env.VITE_GEMINI_API_KEY;

let genAI = null;

function getGenAI() {
  if (!genAI && API_KEY && API_KEY !== 'your_gemini_api_key_here') {
    genAI = new GoogleGenerativeAI(API_KEY);
  }
  return genAI;
}

/**
 * FoundryHub system prompt — contextual startup coaching persona
 */
const SYSTEM_PROMPT = `You are the FoundryHub AI Co-Pilot, an expert startup advisor and innovation coach embedded within the FoundryHub platform.

Your expertise covers:
- Startup ideation, validation, and MVP scoping
- Building and managing co-founder / freelancer teams
- Pitch deck creation and investor relations
- Equity structures, sweat equity, and funding rounds
- Go-to-market strategy and product launch
- Technical co-pilot guidance for founders without tech backgrounds

Personality: concise, insightful, energetic, and encouraging. Use emojis sparingly but effectively. Always provide actionable next steps. Format responses with clear structure using markdown when helpful.

When helping with pitches or investor communication, be specific and professional. When helping with team building, be empathetic and strategic.`;

/**
 * Creates a new Gemini chat session.
 * @param {Array} history - Prior message history [{role:'user'|'model', parts:[{text:'...'}]}]
 * @returns {ChatSession|null}
 */
export function createChatSession(history = []) {
  const ai = getGenAI();
  if (!ai) return null;

  const model = ai.getGenerativeModel({
    model: 'gemini-1.5-flash',
    systemInstruction: SYSTEM_PROMPT,
  });

  return model.startChat({
    history,
    generationConfig: {
      maxOutputTokens: 1024,
      temperature: 0.7,
    },
  });
}

/**
 * Sends a message to the chat session and returns the response text.
 * @param {ChatSession} chatSession
 * @param {string} message
 * @returns {Promise<string>}
 */
export async function sendChatMessage(chatSession, message) {
  if (!chatSession) {
    throw new Error('No active chat session. Please set your Gemini API key in .env');
  }
  const result = await chatSession.sendMessage(message);
  return result.response.text();
}

/**
 * One-shot generation (no history context).
 * @param {string} prompt
 * @returns {Promise<string>}
 */
export async function generateText(prompt) {
  const ai = getGenAI();
  if (!ai) throw new Error('Gemini API key not configured');

  const model = ai.getGenerativeModel({ model: 'gemini-1.5-flash' });
  const result = await model.generateContent(prompt);
  return result.response.text();
}

export function isGeminiConfigured() {
  return !!(API_KEY && API_KEY !== 'your_gemini_api_key_here');
}
