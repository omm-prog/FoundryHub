import React, { useState, useEffect, useRef } from 'react';
import {
  getFirestore, collection, query, orderBy, onSnapshot,
  addDoc, serverTimestamp, doc, getDoc
} from 'firebase/firestore';
import { auth } from '../firebase/config';

function TypingIndicator() {
  return (
    <div className="flex items-end gap-2 mb-3">
      <div className="w-7 h-7 rounded-full bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center text-white text-[10px] font-bold flex-shrink-0">
        ?
      </div>
      <div className="bg-slate-800/80 border border-slate-700/40 rounded-2xl rounded-bl-sm px-4 py-3 flex items-center gap-1">
        <span className="w-1.5 h-1.5 rounded-full bg-slate-500 animate-bounce" style={{ animationDelay: '0ms' }} />
        <span className="w-1.5 h-1.5 rounded-full bg-slate-500 animate-bounce" style={{ animationDelay: '150ms' }} />
        <span className="w-1.5 h-1.5 rounded-full bg-slate-500 animate-bounce" style={{ animationDelay: '300ms' }} />
      </div>
    </div>
  );
}

function getInitials(name, email) {
  if (name) return name.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2);
  if (email) return email[0].toUpperCase();
  return '?';
}

function ChatBubble({ msg, isOwn, senderInitials }) {
  const time = msg.timestamp?.toDate
    ? msg.timestamp.toDate().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    : '';

  return (
    <div className={`flex ${isOwn ? 'justify-end' : 'justify-start'} mb-3 items-end gap-2`}>
      {!isOwn && (
        <div className="w-7 h-7 rounded-full bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center text-white text-[10px] font-bold flex-shrink-0">
          {senderInitials}
        </div>
      )}
      <div className={`max-w-[75%] flex flex-col gap-0.5 ${isOwn ? 'items-end' : 'items-start'}`}>
        <div className={`px-4 py-2.5 text-sm leading-relaxed ${isOwn ? 'chat-bubble-user' : 'chat-bubble-ai'}`}>
          {msg.text}
        </div>
        {time && <span className="text-[10px] text-slate-600 px-1">{time}</span>}
      </div>
    </div>
  );
}

const InvestorChat = ({ projectId, recipientId }) => {
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [recipient, setRecipient] = useState(null);
  const [project, setProject] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [sending, setSending] = useState(false);
  const [showTyping, setShowTyping] = useState(false);
  const db = getFirestore();
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);
  const currentUser = auth.currentUser;

  useEffect(() => {
    if (!currentUser || !recipientId || !projectId) {
      setError('Authentication or project context missing.');
      setLoading(false);
      return;
    }

    const fetchData = async () => {
      try {
        const [userDoc, projectDoc] = await Promise.all([
          getDoc(doc(db, 'users', recipientId)),
          getDoc(doc(db, 'projects', projectId)),
        ]);

        if (userDoc.exists()) setRecipient(userDoc.data());
        else { setError('Recipient not found.'); setLoading(false); return; }

        if (projectDoc.exists()) setProject(projectDoc.data());
        else { setError('Project not found.'); setLoading(false); return; }

        const participants = [currentUser.uid, recipientId].sort();
        const chatId = `${projectId}_${participants[0]}_${participants[1]}`;
        const q = query(collection(db, `chats/${chatId}/messages`), orderBy('timestamp'));

        const unsubscribe = onSnapshot(q, (snapshot) => {
          setMessages(snapshot.docs.map((d) => ({ id: d.id, ...d.data() })));
        }, (err) => {
          console.error('Chat listener error:', err);
          setError('Failed to load messages.');
        });

        setLoading(false);
        return () => unsubscribe();
      } catch (err) {
        console.error('Error fetching chat data:', err);
        setError('Failed to load chat.');
        setLoading(false);
      }
    };

    fetchData();
  }, [projectId, recipientId, currentUser, db]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, showTyping]);

  const handleSend = async (e) => {
    e?.preventDefault();
    if (!newMessage.trim() || sending) return;

    const text = newMessage.trim();
    setNewMessage('');
    setSending(true);
    setShowTyping(true);

    try {
      const participants = [currentUser.uid, recipientId].sort();
      const chatId = `${projectId}_${participants[0]}_${participants[1]}`;
      await addDoc(collection(db, `chats/${chatId}/messages`), {
        text,
        senderId: currentUser.uid,
        senderName: currentUser.email,
        timestamp: serverTimestamp(),
      });
    } catch (err) {
      console.error('Send error:', err);
      setError('Failed to send message. Please try again.');
    } finally {
      setSending(false);
      setTimeout(() => setShowTyping(false), 1500);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="flex gap-1.5">
          {[0,1,2].map((i) => (
            <span key={i} className="w-2.5 h-2.5 rounded-full bg-indigo-500 animate-bounce" style={{ animationDelay: `${i * 150}ms` }} />
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6 text-center">
        <p className="text-red-400 text-sm">{error}</p>
      </div>
    );
  }

  const recipientInitials = getInitials(recipient?.name, recipient?.email);

  return (
    <div className="flex flex-col h-full max-h-[600px] bg-[#0d1117] rounded-2xl border border-slate-700/50 overflow-hidden">
      {/* Header */}
      <div className="flex items-center gap-3 px-4 py-3 border-b border-slate-800 bg-slate-900/50 flex-shrink-0">
        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
          {recipientInitials}
        </div>
        <div className="min-w-0">
          <p className="text-sm font-semibold text-white truncate">{recipient?.name || recipient?.email || 'Investor'}</p>
          {project && <p className="text-[10px] text-slate-500 truncate">Re: {project.title}</p>}
        </div>
        <div className="ml-auto flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          <span className="text-[10px] text-slate-500">Live</span>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-3 py-4 space-y-0.5 scroll-smooth">
        {messages.length === 0 && (
          <div className="flex items-center justify-center h-full">
            <p className="text-sm text-slate-600 text-center px-4">
              No messages yet. Send the first message to start the conversation!
            </p>
          </div>
        )}
        {messages.map((msg) => (
          <ChatBubble
            key={msg.id}
            msg={msg}
            isOwn={msg.senderId === currentUser?.uid}
            senderInitials={msg.senderId === currentUser?.uid ? getInitials(null, currentUser.email) : recipientInitials}
          />
        ))}
        {showTyping && <TypingIndicator />}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <form onSubmit={handleSend} className="flex items-end gap-2 px-3 py-3 border-t border-slate-800 bg-slate-900/30 flex-shrink-0">
        <textarea
          ref={inputRef}
          value={newMessage}
          onChange={(e) => setNewMessage(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Type a message…"
          rows={1}
          className="flex-1 bg-slate-800/60 border border-slate-700/60 focus:border-indigo-500/60 focus:ring-1 focus:ring-indigo-500/20 text-white placeholder-slate-600 rounded-xl px-3.5 py-2.5 text-sm resize-none outline-none transition-all"
          style={{ maxHeight: '100px', overflowY: 'auto' }}
        />
        <button type="submit" disabled={!newMessage.trim() || sending}
          className="w-9 h-9 flex-shrink-0 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white hover:opacity-90 active:scale-95 disabled:opacity-40 transition-all">
          <svg className="w-4 h-4 rotate-90" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 12L3.269 3.126A59.768 59.768 0 0121.485 12 59.77 59.77 0 013.269 20.876L5.999 12zm0 0h7.5" />
          </svg>
        </button>
      </form>
    </div>
  );
};

export default InvestorChat;