import React, { useState, useEffect, useRef } from 'react';
import { getFirestore, collection, query, orderBy, onSnapshot, addDoc, serverTimestamp, doc, getDoc } from 'firebase/firestore';
import { auth } from '../firebase/config';

const InvestorChat = ({ projectId, recipientId }) => {
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [recipient, setRecipient] = useState(null);
  const [project, setProject] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const db = getFirestore();
  const messagesEndRef = useRef(null);
  const currentUser = auth.currentUser;

  useEffect(() => {
    if (!currentUser || !recipientId || !projectId) {
      setError('Authentication required, recipient, or project not specified.');
      setLoading(false);
      return;
    }

    const fetchData = async () => {
      try {
        // Fetch recipient details
        const userDoc = await getDoc(doc(db, 'users', recipientId));
        if (userDoc.exists()) {
          setRecipient(userDoc.data());
        } else {
          setError('Recipient not found.');
          setLoading(false);
          return;
        }

        // Fetch project details
        const projectDoc = await getDoc(doc(db, 'projects', projectId));
        if (projectDoc.exists()) {
          setProject(projectDoc.data());
        } else {
          setError('Project not found.');
          setLoading(false);
          return;
        }

        // Generate a unique chat ID per project per founder-investor pair
        const participants = [currentUser.uid, recipientId].sort();
        const chatId = `${projectId}_${participants[0]}_${participants[1]}`;

        const q = query(collection(db, `chats/${chatId}/messages`), orderBy('timestamp'));

        const unsubscribe = onSnapshot(q, (snapshot) => {
          const fetchedMessages = [];
          snapshot.forEach((doc) => {
            fetchedMessages.push({ id: doc.id, ...doc.data() });
          });
          setMessages(fetchedMessages);
        }, (err) => {
          console.error('Error fetching messages:', err);
          setError('Failed to load messages.');
        });

        setLoading(false);
        return () => unsubscribe();

      } catch (err) {
        console.error('Error fetching data:', err);
        setError('Failed to load chat data.');
        setLoading(false);
      }
    };

    fetchData();
  }, [projectId, recipientId, currentUser, db]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (newMessage.trim() === '' || !currentUser || !recipientId || !projectId) return;

    // Generate a unique chat ID per project per founder-investor pair
    const participants = [currentUser.uid, recipientId].sort();
    const chatId = `${projectId}_${participants[0]}_${participants[1]}`;

    try {
      await addDoc(collection(db, `chats/${chatId}/messages`), {
        text: newMessage,
        senderId: currentUser.uid,
        recipientId: recipientId,
        timestamp: serverTimestamp(),
        projectId: projectId,
      });
      setNewMessage('');
    } catch (err) {
      console.error('Error sending message:', err);
      setError('Failed to send message.');
    }
  };

  if (loading) return <div className="p-4 text-center">Loading chat...</div>;
  if (error) return <div className="p-4 text-red-500 text-center">{error}</div>;
  if (!recipient || !project) return <div className="p-4 text-center">Chat data not found.</div>;

  return (
    <div className="flex flex-col h-[500px] bg-gray-50 rounded-lg shadow-inner">
      <div className="p-4 bg-indigo-600 text-white rounded-t-lg">
        <h3 className="text-lg font-semibold">Chat about {project.title} with {recipient.displayName || recipient.email}</h3>
      </div>
      <div className="flex-1 p-4 overflow-y-auto space-y-3">
        {messages.length === 0 && <p className="text-gray-500 text-center">No messages yet. Start the conversation!</p>}
        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`flex ${msg.senderId === currentUser.uid ? 'justify-end' : 'justify-start'}`}
          >
            <div
              className={`max-w-[70%] p-3 rounded-lg ${msg.senderId === currentUser.uid
                ? 'bg-indigo-500 text-white'
                : 'bg-gray-200 text-gray-800'
              }`}
            >
              <p className="text-sm">{msg.text}</p>
              <span className="text-xs opacity-75 mt-1 block">
                {msg.timestamp?.toDate().toLocaleTimeString()}
              </span>
            </div>
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>
      <form onSubmit={handleSendMessage} className="p-4 bg-gray-100 border-t border-gray-200 flex gap-2">
        <input
          type="text"
          value={newMessage}
          onChange={(e) => setNewMessage(e.target.value)}
          placeholder="Type a message..."
          className="flex-1 rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
        />
        <button
          type="submit"
          className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
        >
          Send
        </button>
      </form>
    </div>
  );
};

export default InvestorChat; 