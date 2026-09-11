import { db } from '../firebase/config';
import {
  doc,
  collection,
  setDoc,
  getDoc,
  getDocs,
  serverTimestamp,
  orderBy,
  query,
  limit,
} from 'firebase/firestore';

const MEMORY_COLLECTION = 'aiMemory';
const MAX_HISTORY_MESSAGES = 10; // keep last 10 messages for context

/**
 * Saves or updates a conversation session in Firestore.
 * Path: aiMemory/{userId}/sessions/{sessionId}
 *
 * @param {string} userId
 * @param {string} sessionId
 * @param {Array} messages - [{role:'user'|'assistant', content:'...', timestamp}]
 * @param {string} [title] - Optional session title
 */
export async function saveMemory(userId, sessionId, messages, title) {
  if (!userId || !sessionId) return;
  const sessionRef = doc(db, MEMORY_COLLECTION, userId, 'sessions', sessionId);

  await setDoc(
    sessionRef,
    {
      messages,
      title: title || (messages[0]?.content?.slice(0, 60) || 'New Chat'),
      updatedAt: serverTimestamp(),
      messageCount: messages.length,
    },
    { merge: true }
  );
}

/**
 * Loads a specific conversation session from Firestore.
 * Returns null if not found.
 *
 * @param {string} userId
 * @param {string} sessionId
 * @returns {Promise<{messages:Array, title:string}|null>}
 */
export async function loadMemory(userId, sessionId) {
  if (!userId || !sessionId) return null;
  const sessionRef = doc(db, MEMORY_COLLECTION, userId, 'sessions', sessionId);
  const snap = await getDoc(sessionRef);
  if (!snap.exists()) return null;
  return snap.data();
}

/**
 * Lists all conversation sessions for a user, ordered by most recent.
 *
 * @param {string} userId
 * @returns {Promise<Array<{id:string, title:string, updatedAt, messageCount:number}>>}
 */
export async function listSessions(userId) {
  if (!userId) return [];
  const sessionsRef = collection(db, MEMORY_COLLECTION, userId, 'sessions');
  const q = query(sessionsRef, orderBy('updatedAt', 'desc'), limit(20));
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
}

/**
 * Converts stored app messages to Gemini history format.
 * App format: {role:'user'|'assistant', content:'...'}
 * Gemini format: {role:'user'|'model', parts:[{text:'...'}]}
 *
 * Takes only the last MAX_HISTORY_MESSAGES messages.
 *
 * @param {Array} messages
 * @returns {Array}
 */
export function toGeminiHistory(messages) {
  return messages
    .slice(-MAX_HISTORY_MESSAGES)
    .map((m) => ({
      role: m.role === 'assistant' ? 'model' : 'user',
      parts: [{ text: m.content }],
    }));
}
