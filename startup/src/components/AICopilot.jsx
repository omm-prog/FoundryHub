import { useState, useEffect, useRef } from 'react';
import { useGeminiChat } from '../hooks/useGeminiChat';
import { listSessions } from '../services/memoryService';
import { auth } from '../firebase/config';

// Typed text animation
function TypingDots() {
  return (
    <div className="flex items-center gap-1 px-4 py-3">
      <span className="w-2 h-2 rounded-full bg-indigo-400 animate-bounce" style={{ animationDelay: '0ms' }} />
      <span className="w-2 h-2 rounded-full bg-indigo-400 animate-bounce" style={{ animationDelay: '150ms' }} />
      <span className="w-2 h-2 rounded-full bg-indigo-400 animate-bounce" style={{ animationDelay: '300ms' }} />
    </div>
  );
}

/** Lightweight inline markdown → JSX renderer (no external lib needed) */
function renderMarkdown(text) {
  const lines = text.split('\n');
  const elements = [];
  let i = 0;

  while (i < lines.length) {
    const raw = lines[i];

    // Skip blank lines (render as spacer)
    if (raw.trim() === '') {
      elements.push(<div key={i} className="h-1" />);
      i++;
      continue;
    }

    // H1
    if (/^# /.test(raw)) {
      elements.push(
        <p key={i} className="font-bold text-white text-sm mt-2 mb-0.5">
          {inlineFormat(raw.replace(/^# /, ''))}
        </p>
      );
      i++; continue;
    }

    // H2 / H3
    if (/^#{2,3} /.test(raw)) {
      elements.push(
        <p key={i} className="font-semibold text-indigo-300 text-xs mt-2 mb-0.5 uppercase tracking-wide">
          {inlineFormat(raw.replace(/^#{2,3} /, ''))}
        </p>
      );
      i++; continue;
    }

    // Numbered list
    if (/^\d+\. /.test(raw)) {
      elements.push(
        <div key={i} className="flex gap-2 my-0.5">
          <span className="text-indigo-400 font-bold flex-shrink-0 text-xs mt-0.5">
            {raw.match(/^(\d+)\./)[1]}.
          </span>
          <span className="text-slate-100 text-xs leading-relaxed">
            {inlineFormat(raw.replace(/^\d+\. /, ''))}
          </span>
        </div>
      );
      i++; continue;
    }

    // Bullet list
    if (/^[-*] /.test(raw)) {
      elements.push(
        <div key={i} className="flex gap-2 my-0.5 pl-1">
          <span className="text-indigo-400 flex-shrink-0 mt-1.5 text-[8px]">●</span>
          <span className="text-slate-200 text-xs leading-relaxed">
            {inlineFormat(raw.replace(/^[-*] /, ''))}
          </span>
        </div>
      );
      i++; continue;
    }

    // Sub-bullet (indented - or *)
    if (/^   [-*] /.test(raw) || /^  [-*] /.test(raw)) {
      elements.push(
        <div key={i} className="flex gap-2 my-0.5 pl-5">
          <span className="text-slate-500 flex-shrink-0 mt-1.5 text-[7px]">○</span>
          <span className="text-slate-400 text-xs leading-relaxed">
            {inlineFormat(raw.replace(/^ +[-*] /, ''))}
          </span>
        </div>
      );
      i++; continue;
    }

    // Horizontal rule
    if (/^---+$/.test(raw.trim())) {
      elements.push(<hr key={i} className="border-slate-700/50 my-2" />);
      i++; continue;
    }

    // Default paragraph
    elements.push(
      <p key={i} className="text-slate-100 text-xs leading-relaxed my-0.5">
        {inlineFormat(raw)}
      </p>
    );
    i++;
  }

  return elements;
}

/** Applies inline formatting: bold, italic, inline code */
function inlineFormat(text) {
  // Split on bold (**...**), italic (*...*), code (`...`)
  const parts = text.split(/(\*\*[^*]+\*\*|`[^`]+`|\*[^*]+\*)/g);
  return parts.map((part, idx) => {
    if (/^\*\*[^*]+\*\*$/.test(part)) {
      return <strong key={idx} className="text-white font-semibold">{part.slice(2, -2)}</strong>;
    }
    if (/^`[^`]+`$/.test(part)) {
      return (
        <code key={idx} className="bg-slate-700/70 text-indigo-300 px-1 py-0.5 rounded text-[10px] font-mono">
          {part.slice(1, -1)}
        </code>
      );
    }
    if (/^\*[^*]+\*$/.test(part)) {
      return <em key={idx} className="text-slate-300 italic">{part.slice(1, -1)}</em>;
    }
    return part;
  });
}

function ChatMessage({ msg }) {
  const isUser = msg.role === 'user';
  const time = msg.timestamp
    ? new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    : '';

  return (
    <div className={`flex ${isUser ? 'justify-end' : 'justify-start'} mb-3 px-2`}>
      {!isUser && (
        <div className="w-7 h-7 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white text-xs font-bold mr-2 flex-shrink-0 mt-auto mb-1">
          AI
        </div>
      )}
      <div className={`max-w-[82%] ${isUser ? 'items-end' : 'items-start'} flex flex-col gap-0.5`}>
        <div
          className={`rounded-2xl px-4 py-3 text-sm leading-relaxed ${
            isUser
              ? 'bg-gradient-to-br from-indigo-500 to-purple-600 text-white rounded-br-sm'
              : 'bg-slate-800/80 text-slate-100 rounded-bl-sm border border-slate-700/40'
          }`}
        >
          {isUser ? (
            <p className="text-sm leading-relaxed">{msg.content}</p>
          ) : (
            <div className="space-y-0.5">{renderMarkdown(msg.content)}</div>
          )}
        </div>
        {time && <span className="text-[10px] text-slate-600 px-1">{time}</span>}
      </div>
    </div>
  );
}

const SUGGESTED_PROMPTS = [
  '💡 Help me validate my startup idea',
  '📊 Write a pitch deck outline',
  '👥 What roles do I need first?',
  '💰 How should I structure equity?',
];

export default function AICopilot() {
  const [open, setOpen] = useState(false);
  const [input, setInput] = useState('');
  const [sessionId, setSessionId] = useState(() => `session_${Date.now()}`);
  const [sessions, setSessions] = useState([]);
  const [showHistory, setShowHistory] = useState(false);
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  const { messages, isLoading, error, sendMessage, clearSession, configured, memoryLoaded } =
    useGeminiChat(sessionId);

  const userId = auth.currentUser?.uid;

  // Auto-scroll
  useEffect(() => {
    if (open) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, open, isLoading]);

  // Focus input when opened
  useEffect(() => {
    if (open) {
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [open]);

  // Load session list
  useEffect(() => {
    if (!open || !userId) return;
    listSessions(userId)
      .then(setSessions)
      .catch(() => {});
  }, [open, userId, sessionId]);

  const handleSend = async (e) => {
    e?.preventDefault();
    if (!input.trim()) return;
    await sendMessage(input);
    setInput('');
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleNewSession = () => {
    clearSession();
    setSessionId(`session_${Date.now()}`);
    setShowHistory(false);
  };

  const handleLoadSession = (id) => {
    setSessionId(id);
    setShowHistory(false);
  };

  return (
    <>
      {/* Floating Trigger Button */}
      <button
        onClick={() => setOpen((p) => !p)}
        className="fixed bottom-6 right-6 z-50 w-14 h-14 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 text-white shadow-lg shadow-indigo-500/40 flex items-center justify-center hover:scale-110 active:scale-95 transition-all duration-200"
        title="FoundryHub AI Co-Pilot"
        aria-label="Open AI Co-Pilot"
      >
        {open ? (
          <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
          </svg>
        ) : (
          <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09z" />
          </svg>
        )}
      </button>

      {/* Panel */}
      {open && (
        <div className="fixed bottom-24 right-4 sm:right-6 z-50 w-[calc(100vw-2rem)] sm:w-[400px] h-[580px] max-h-[80vh] bg-[#0d1117] border border-slate-700/60 rounded-2xl shadow-2xl shadow-black/50 flex flex-col overflow-hidden animate-scale-in">
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-slate-800 bg-slate-900/60 backdrop-blur-sm flex-shrink-0">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center">
                <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09z" />
                </svg>
              </div>
              <div>
                <p className="text-sm font-semibold text-white leading-none">AI Co-Pilot</p>
                <p className="text-[10px] text-indigo-400 mt-0.5">Powered by Gemini</p>
              </div>
            </div>
            <div className="flex items-center gap-1">
              {/* History button */}
              <button
                onClick={() => setShowHistory((p) => !p)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition-colors"
                title="Session history"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </button>
              {/* New session */}
              <button
                onClick={handleNewSession}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition-colors"
                title="New conversation"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
                </svg>
              </button>
            </div>
          </div>

          {/* Session History Dropdown */}
          {showHistory && (
            <div className="absolute top-14 right-0 left-0 z-10 bg-[#0d1117] border-b border-slate-800 max-h-48 overflow-y-auto">
              {sessions.length === 0 ? (
                <p className="text-xs text-slate-500 p-4 text-center">No saved conversations yet</p>
              ) : (
                sessions.map((s) => (
                  <button
                    key={s.id}
                    onClick={() => handleLoadSession(s.id)}
                    className={`w-full text-left px-4 py-2.5 text-xs hover:bg-slate-800 transition-colors ${
                      s.id === sessionId ? 'text-indigo-400' : 'text-slate-300'
                    }`}
                  >
                    <p className="font-medium truncate">{s.title || 'Chat'}</p>
                    <p className="text-slate-600 text-[10px]">{s.messageCount} messages</p>
                  </button>
                ))
              )}
            </div>
          )}


          {/* Messages */}
          <div className="flex-1 overflow-y-auto py-3 scroll-smooth">
            {!memoryLoaded ? (
              <div className="flex items-center justify-center h-full">
                <div className="flex gap-1">
                  <span className="w-2 h-2 rounded-full bg-slate-600 animate-bounce" style={{ animationDelay: '0ms' }} />
                  <span className="w-2 h-2 rounded-full bg-slate-600 animate-bounce" style={{ animationDelay: '150ms' }} />
                  <span className="w-2 h-2 rounded-full bg-slate-600 animate-bounce" style={{ animationDelay: '300ms' }} />
                </div>
              </div>
            ) : messages.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full gap-5 px-4">
                <div className="text-center space-y-1">
                  <p className="text-sm font-semibold text-slate-200">Your Startup Co-Pilot</p>
                  <p className="text-xs text-slate-500">Ask me anything about building your startup</p>
                </div>
                <div className="grid grid-cols-1 gap-2 w-full">
                  {SUGGESTED_PROMPTS.map((p) => (
                    <button
                      key={p}
                      onClick={() => {
                        setInput(p.replace(/^[^\w]+/, '').trim());
                        inputRef.current?.focus();
                      }}
                      className="text-left text-xs px-3 py-2.5 rounded-xl border border-slate-700/60 bg-slate-800/40 text-slate-300 hover:border-indigo-500/40 hover:text-white hover:bg-slate-800 transition-all"
                    >
                      {p}
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              <>
                {messages.map((msg, i) => (
                  <ChatMessage key={i} msg={msg} />
                ))}
                {isLoading && (
                  <div className="flex justify-start mb-3 px-2">
                    <div className="w-7 h-7 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white text-xs font-bold mr-2 flex-shrink-0 mt-auto mb-1">
                      AI
                    </div>
                    <div className="bg-slate-800/80 border border-slate-700/40 rounded-2xl rounded-bl-sm">
                      <TypingDots />
                    </div>
                  </div>
                )}
                <div ref={messagesEndRef} />
              </>
            )}
          </div>

          {/* Error */}
          {error && (
            <div className="mx-3 mb-2 px-3 py-2 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400 text-xs flex-shrink-0">
              {error}
            </div>
          )}

          {/* Input */}
          <form onSubmit={handleSend} className="flex items-end gap-2 p-3 border-t border-slate-800 flex-shrink-0">
            <textarea
              ref={inputRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              rows={1}
              placeholder="Ask your Co-Pilot..."
              disabled={isLoading}
              className="flex-1 bg-slate-800/60 border border-slate-700/60 focus:border-indigo-500/60 focus:ring-1 focus:ring-indigo-500/20 text-white placeholder-slate-500 rounded-xl px-3 py-2.5 text-sm resize-none outline-none transition-all disabled:opacity-50"
              style={{ maxHeight: '120px', overflowY: 'auto' }}
            />
            <button
              type="submit"
              disabled={!input.trim() || isLoading}
              className="w-9 h-9 flex-shrink-0 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white hover:opacity-90 active:scale-95 disabled:opacity-40 transition-all"
            >
              <svg className="w-4 h-4 rotate-90" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 12L3.269 3.126A59.768 59.768 0 0121.485 12 59.77 59.77 0 013.269 20.876L5.999 12zm0 0h7.5" />
              </svg>
            </button>
          </form>
        </div>
      )}
    </>
  );
}
