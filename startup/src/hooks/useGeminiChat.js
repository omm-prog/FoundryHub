import { useState, useEffect, useCallback, useRef } from 'react';
import { auth } from '../firebase/config';
import { createChatSession, sendChatMessage, isGeminiConfigured } from '../services/geminiService';
import { saveMemory, loadMemory, toGeminiHistory } from '../services/memoryService';

/**
 * useGeminiChat – React hook that provides a full AI chat experience with
 * Firestore-backed conversation memory.
 *
 * @param {string} sessionId - Unique ID for this conversation thread
 * @returns {{ messages, isLoading, error, sendMessage, clearSession, configured }}
 */
export function useGeminiChat(sessionId = 'default') {
  const [messages, setMessages] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [memoryLoaded, setMemoryLoaded] = useState(false);
  const chatSessionRef = useRef(null);
  const configured = isGeminiConfigured();

  const userId = auth.currentUser?.uid;

  // Load memory from Firestore on mount / sessionId change
  useEffect(() => {
    if (!userId || !sessionId) {
      setMemoryLoaded(true);
      return;
    }

    const load = async () => {
      try {
        const data = await loadMemory(userId, sessionId);
        if (data?.messages?.length) {
          setMessages(data.messages);
          // Re-create chat session with prior history
          const history = toGeminiHistory(data.messages);
          chatSessionRef.current = createChatSession(history);
        } else {
          chatSessionRef.current = createChatSession([]);
        }
      } catch (err) {
        console.error('Failed to load AI memory:', err);
        chatSessionRef.current = createChatSession([]);
      } finally {
        setMemoryLoaded(true);
      }
    };

    load();
  }, [userId, sessionId]);

  const sendMessage = useCallback(
    async (text) => {
      if (!text?.trim() || isLoading) return;
      setError('');

      if (!configured) {
        setError('Gemini API key not configured. Add VITE_GEMINI_API_KEY to your .env file.');
        return;
      }

      if (!chatSessionRef.current) {
        chatSessionRef.current = createChatSession([]);
      }

      const userMsg = { role: 'user', content: text.trim(), timestamp: Date.now() };
      const updatedMessages = [...messages, userMsg];
      setMessages(updatedMessages);
      setIsLoading(true);

      try {
        const responseText = await sendChatMessage(chatSessionRef.current, text.trim());
        const assistantMsg = {
          role: 'assistant',
          content: responseText,
          timestamp: Date.now(),
        };
        const finalMessages = [...updatedMessages, assistantMsg];
        setMessages(finalMessages);

        // Persist to Firestore asynchronously (fire and forget)
        if (userId) {
          saveMemory(userId, sessionId, finalMessages).catch(console.error);
        }
      } catch (err) {
        console.error('Gemini error:', err);
        setError(err.message || 'Failed to get AI response. Please try again.');
        // Remove the user message if we failed
        setMessages(messages);
      } finally {
        setIsLoading(false);
      }
    },
    [messages, isLoading, configured, userId, sessionId]
  );

  const clearSession = useCallback(() => {
    setMessages([]);
    setError('');
    chatSessionRef.current = createChatSession([]);
    // Optionally clear from Firestore too
    if (userId && sessionId) {
      saveMemory(userId, sessionId, [], 'New Chat').catch(console.error);
    }
  }, [userId, sessionId]);

  return {
    messages,
    isLoading,
    error,
    sendMessage,
    clearSession,
    configured,
    memoryLoaded,
  };
}
