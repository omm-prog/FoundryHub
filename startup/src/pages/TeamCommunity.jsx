import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  collection, doc, getDoc, getDocs, query, where,
  updateDoc, arrayUnion, addDoc, serverTimestamp, onSnapshot, orderBy
} from 'firebase/firestore';
import { db } from '../firebase/config';
import { useAuth } from '../contexts/AuthContext';
import LoadingSkeleton from '../components/LoadingSkeleton';

const getInitials = (name, email) => {
  if (name) return name.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2);
  if (email) return email[0].toUpperCase();
  return '?';
};

const AVATAR_COLORS = ['from-indigo-500 to-purple-600', 'from-teal-500 to-emerald-500', 'from-blue-500 to-cyan-500', 'from-orange-500 to-rose-500'];
const getAvatarColor = (id) => AVATAR_COLORS[(id?.charCodeAt(0) || 0) % AVATAR_COLORS.length];

function Avatar({ name, email, id, size = 'md' }) {
  const sizes = { sm: 'w-6 h-6 text-[9px]', md: 'w-8 h-8 text-xs', lg: 'w-12 h-12 text-base' };
  return (
    <div className={`${sizes[size]} rounded-full bg-gradient-to-br ${getAvatarColor(id)} flex items-center justify-center text-white font-bold flex-shrink-0`}>
      {getInitials(name, email)}
    </div>
  );
}

function ChatMessage({ message, isOwn, senderName, senderId }) {
  const time = message.timestamp?.toDate
    ? message.timestamp.toDate().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    : '';

  return (
    <div className={`flex ${isOwn ? 'justify-end' : 'justify-start'} gap-2 items-end mb-2`}>
      {!isOwn && <Avatar name={senderName} id={senderId} size="sm" />}
      <div className={`max-w-[72%] flex flex-col gap-0.5 ${isOwn ? 'items-end' : 'items-start'}`}>
        {!isOwn && <span className="text-[10px] text-slate-500 px-1 font-medium">{senderName}</span>}
        <div className={`px-4 py-2.5 text-sm leading-relaxed ${isOwn ? 'chat-bubble-user' : 'chat-bubble-ai'}`}>
          {message.text}
        </div>
        {time && <span className="text-[9px] text-slate-600 px-1">{time}</span>}
      </div>
    </div>
  );
}

const TeamCommunity = () => {
  const [project, setProject] = useState(null);
  const [teamMembers, setTeamMembers] = useState([]);
  const [newMemberEmail, setNewMemberEmail] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [joinRequests, setJoinRequests] = useState([]);
  const [joinReqLoading, setJoinReqLoading] = useState(false);
  const [profileData, setProfileData] = useState(null);
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [profileLoading, setProfileLoading] = useState(false);
  const [profileError, setProfileError] = useState('');
  const [activeTab, setActiveTab] = useState('chat'); // 'chat' | 'team' | 'requests'
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  const { projectId } = useParams();
  const { currentUser } = useAuth();
  const navigate = useNavigate();

  // Fetch project + team
  useEffect(() => {
    const fetchProjectAndTeam = async () => {
      try {
        const projectDoc = await getDoc(doc(db, 'projects', projectId));
        if (projectDoc.exists()) {
          const projectData = projectDoc.data();
          setProject(projectData);
          const members = projectData.teamMembers || [];
          const membersDetails = await Promise.all(
            members.map(async (memberId) => {
              const userDoc = await getDoc(doc(db, 'users', memberId));
              return userDoc.exists() ? { id: memberId, ...userDoc.data() } : null;
            })
          );
          setTeamMembers(membersDetails.filter(Boolean));
        }
      } catch (err) {
        console.error('Error fetching project:', err);
        setError('Failed to load project details');
      } finally {
        setLoading(false);
      }
    };
    fetchProjectAndTeam();
  }, [projectId]);

  // Real-time chat listener
  useEffect(() => {
    if (!projectId) return;
    const q = query(collection(db, 'projects', projectId, 'messages'), orderBy('timestamp', 'asc'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      setMessages(snapshot.docs.map((d) => ({ id: d.id, ...d.data() })));
    });
    return () => unsubscribe();
  }, [projectId]);

  // Auto-scroll chat
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Fetch join requests
  const fetchJoinRequests = async () => {
    setJoinReqLoading(true);
    try {
      const q = query(collection(db, 'joinRequests'), where('projectId', '==', projectId), where('status', '==', 'pending'));
      const snapshot = await getDocs(q);
      const reqs = await Promise.all(snapshot.docs.map(async (docSnap) => {
        const data = docSnap.data();
        const userDoc = await getDoc(doc(db, 'users', data.freelancerId));
        return { id: docSnap.id, ...data, freelancer: userDoc.exists() ? userDoc.data() : { email: data.freelancerId } };
      }));
      setJoinRequests(reqs);
    } catch { setJoinRequests([]); }
    finally { setJoinReqLoading(false); }
  };

  useEffect(() => { fetchJoinRequests(); }, [projectId]);

  const handleAddMember = async (e) => {
    e.preventDefault();
    setError(''); setSuccess('');
    try {
      const q = query(collection(db, 'users'), where('email', '==', newMemberEmail), where('role', '==', 'freelancer'));
      const snap = await getDocs(q);
      if (snap.empty) { setError('No freelancer found with this email'); return; }
      const freelancerDoc = snap.docs[0];
      const freelancerId = freelancerDoc.id;
      if (project.teamMembers?.includes(freelancerId)) { setError('Already a team member'); return; }
      await updateDoc(doc(db, 'projects', projectId), { teamMembers: arrayUnion(freelancerId) });
      setTeamMembers([...teamMembers, { id: freelancerId, ...freelancerDoc.data() }]);
      setNewMemberEmail('');
      setSuccess('Member added!');
      setTimeout(() => setSuccess(''), 3000);
    } catch { setError('Failed to add member'); }
  };

  const handleSendMessage = async (e) => {
    e?.preventDefault();
    if (!newMessage.trim()) return;
    try {
      await addDoc(collection(db, 'projects', projectId, 'messages'), {
        text: newMessage.trim(),
        senderId: currentUser.uid,
        senderName: currentUser.displayName || currentUser.email,
        timestamp: serverTimestamp(),
      });
      setNewMessage('');
    } catch { setError('Failed to send message'); }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSendMessage(); }
  };

  const handleAcceptRequest = async (req) => {
    setJoinReqLoading(true);
    try {
      await updateDoc(doc(db, 'projects', projectId), { teamMembers: arrayUnion(req.freelancerId) });
      await updateDoc(doc(db, 'joinRequests', req.id), { status: 'accepted' });
      setJoinRequests((prev) => prev.filter((r) => r.id !== req.id));
      setTeamMembers((prev) => [...prev, { id: req.freelancerId, ...req.freelancer }]);
    } catch (e) { console.error(e); }
    finally { setJoinReqLoading(false); }
  };

  const handleRejectRequest = async (req) => {
    setJoinReqLoading(true);
    try {
      await updateDoc(doc(db, 'joinRequests', req.id), { status: 'rejected' });
      setJoinRequests((prev) => prev.filter((r) => r.id !== req.id));
    } catch (e) { console.error(e); }
    finally { setJoinReqLoading(false); }
  };

  const handleViewProfile = async (freelancerId) => {
    setShowProfileModal(true);
    setProfileLoading(true);
    setProfileError('');
    setProfileData(null);
    try {
      const userDoc = await getDoc(doc(db, 'users', freelancerId));
      if (userDoc.exists()) setProfileData(userDoc.data());
      else setProfileError('Profile not found');
    } catch { setProfileError('Failed to load profile'); }
    finally { setProfileLoading(false); }
  };

  const isFounder = currentUser?.uid === project?.founder;

  if (loading) {
    return <div className="min-h-screen bg-[#030712] pt-12"><LoadingSkeleton type="dashboard" /></div>;
  }

  return (
    <div className="min-h-screen bg-[#030712] text-slate-100 font-sans">

      {/* ── Ambient glow ── */}
      <div className="fixed inset-0 pointer-events-none -z-10 overflow-hidden">
        <div className="absolute top-[-10%] left-[-10%] w-[55%] h-[50%] bg-indigo-500/8 rounded-full blur-[130px]" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[45%] bg-purple-500/7 rounded-full blur-[130px]" />
      </div>

      {/* ── Sticky Header ── */}
      <div className="sticky top-0 z-30 bg-[#030712]/85 backdrop-blur-xl border-b border-slate-800/60">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-14 flex items-center gap-3">
          <button onClick={() => navigate('/dashboard')} className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18" />
            </svg>
          </button>
          <div className="flex-1 min-w-0">
            <h1 className="text-sm font-semibold text-white truncate">{project?.title}</h1>
            <p className="text-[10px] text-slate-500">{teamMembers.length} team member{teamMembers.length !== 1 ? 's' : ''}</p>
          </div>
          {/* Avatars */}
          <div className="hidden sm:flex items-center -space-x-2">
            {teamMembers.slice(0, 4).map((m) => (
              <div key={m.id} className="ring-2 ring-[#030712] rounded-full">
                <Avatar name={m.name || m.email} id={m.id} size="sm" />
              </div>
            ))}
            {teamMembers.length > 4 && (
              <div className="w-6 h-6 rounded-full bg-slate-800 border-2 border-[#030712] flex items-center justify-center text-[9px] text-slate-400">
                +{teamMembers.length - 4}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ── Mobile Tabs ── */}
      <div className="lg:hidden border-b border-slate-800/60 bg-[#030712]/70 backdrop-blur-sm sticky top-14 z-20">
        <div className="flex">
          {[
            { key: 'chat', label: 'Chat', badge: messages.length },
            { key: 'team', label: 'Team', badge: teamMembers.length },
            ...(isFounder ? [{ key: 'requests', label: 'Requests', badge: joinRequests.length }] : []),
          ].map((tab) => (
            <button key={tab.key} onClick={() => setActiveTab(tab.key)}
              className={`flex-1 flex items-center justify-center gap-1.5 py-3 text-xs font-semibold border-b-2 transition-all ${
                activeTab === tab.key ? 'border-indigo-500 text-white' : 'border-transparent text-slate-500'
              }`}>
              {tab.label}
              {tab.badge > 0 && (
                <span className={`text-[9px] px-1.5 py-0.5 rounded-full font-bold ${
                  activeTab === tab.key ? 'bg-indigo-500/20 text-indigo-300' : 'bg-slate-800 text-slate-500'
                }`}>{tab.badge}</span>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* ── Main Layout ── */}
      <div className="max-w-7xl mx-auto px-0 sm:px-4 lg:px-8 py-0 lg:py-6">
        <div className="flex flex-col lg:flex-row lg:gap-6">

          {/* ── Sidebar (desktop: always visible, mobile: shown by tab) ── */}
          <div className={`lg:w-72 xl:w-80 flex-shrink-0 ${activeTab !== 'chat' || true ? '' : 'hidden'} ${
            activeTab === 'chat' ? 'hidden lg:block' : 'block lg:block'
          }`}>
            <div className="space-y-4 p-4 lg:p-0">
              {/* Add Member */}
              <div className={`glass-card p-5 ${activeTab !== 'team' ? 'hidden lg:block' : ''}`}>
                <h2 className="text-sm font-semibold text-white mb-4">Add Team Member</h2>
                <form onSubmit={handleAddMember} className="space-y-3">
                  <input
                    type="email"
                    value={newMemberEmail}
                    onChange={(e) => setNewMemberEmail(e.target.value)}
                    className="w-full bg-slate-900/60 border border-slate-800 focus:border-indigo-500/60 text-white placeholder-slate-600 rounded-xl px-3.5 py-2.5 text-sm outline-none transition-all focus:ring-2 focus:ring-indigo-500/15 input-glow"
                    placeholder="freelancer@example.com"
                    required
                  />
                  <button type="submit" className="w-full bg-gradient-to-r from-indigo-500 to-purple-600 text-white text-xs font-semibold py-2.5 rounded-xl hover:opacity-90 transition-all active:scale-[0.98]">
                    Add Member
                  </button>
                </form>
                {error && <p className="mt-2 text-xs text-red-400">{error}</p>}
                {success && <p className="mt-2 text-xs text-emerald-400">{success}</p>}
              </div>

              {/* Team Members */}
              <div className={`glass-card p-5 ${activeTab !== 'team' ? 'hidden lg:block' : ''}`}>
                <h2 className="text-sm font-semibold text-white mb-4">Team ({teamMembers.length})</h2>
                {teamMembers.length === 0 ? (
                  <p className="text-xs text-slate-600 text-center py-4">No members yet</p>
                ) : (
                  <div className="space-y-2.5">
                    {teamMembers.map((member) => (
                      <div key={member.id} className="flex items-center gap-3 p-2.5 rounded-xl hover:bg-slate-800/40 transition-colors">
                        <Avatar name={member.name || member.email} id={member.id} size="sm" />
                        <div className="min-w-0">
                          <p className="text-xs font-semibold text-slate-200 truncate">{member.name || member.email?.split('@')[0]}</p>
                          <span className="text-[9px] capitalize text-indigo-400 bg-indigo-500/10 px-1.5 py-0.5 rounded">{member.role || 'Member'}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Join Requests (founder only) */}
              {isFounder && (
                <div className={`glass-card p-5 ${activeTab !== 'requests' ? 'hidden lg:block' : ''}`}>
                  <h2 className="text-sm font-semibold text-white mb-4">
                    Join Requests
                    {joinRequests.length > 0 && (
                      <span className="ml-2 text-[10px] bg-orange-500/20 text-orange-300 px-1.5 py-0.5 rounded-full">{joinRequests.length}</span>
                    )}
                  </h2>
                  {joinReqLoading ? (
                    <p className="text-xs text-slate-600 animate-pulse">Loading…</p>
                  ) : joinRequests.length === 0 ? (
                    <p className="text-xs text-slate-600 text-center py-4">No pending requests</p>
                  ) : (
                    <div className="space-y-3">
                      {joinRequests.map((req) => (
                        <div key={req.id} className="p-3 rounded-xl bg-slate-800/40 border border-slate-700/40 space-y-2.5">
                          <div className="flex items-center gap-2">
                            <Avatar name={req.freelancer?.name || req.freelancer?.email} id={req.freelancerId} size="sm" />
                            <div className="min-w-0">
                              <p className="text-xs font-semibold text-white truncate">{req.freelancer?.name || req.freelancer?.email}</p>
                            </div>
                          </div>
                          <div className="flex gap-2">
                            <button onClick={() => handleAcceptRequest(req)} disabled={joinReqLoading}
                              className="flex-1 text-[10px] font-semibold py-1.5 rounded-lg bg-emerald-500/15 text-emerald-400 border border-emerald-500/25 hover:bg-emerald-500/25 transition-all">
                              Accept
                            </button>
                            <button onClick={() => handleRejectRequest(req)} disabled={joinReqLoading}
                              className="flex-1 text-[10px] font-semibold py-1.5 rounded-lg bg-red-500/15 text-red-400 border border-red-500/25 hover:bg-red-500/25 transition-all">
                              Reject
                            </button>
                            <button onClick={() => handleViewProfile(req.freelancerId)}
                              className="flex-1 text-[10px] font-semibold py-1.5 rounded-lg bg-slate-800 text-slate-400 border border-slate-700 hover:text-white transition-all">
                              Profile
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* ── Chat Panel ── */}
          <div className={`flex-1 ${activeTab !== 'chat' ? 'hidden lg:flex' : 'flex'} flex-col`}
            style={{ height: 'calc(100dvh - 112px)' }}>
            <div className="flex-1 flex flex-col glass-card lg:rounded-2xl overflow-hidden" style={{ height: '100%' }}>
              {/* Chat header */}
              <div className="flex items-center gap-3 px-4 py-3 border-b border-slate-800 flex-shrink-0">
                <svg className="w-4 h-4 text-indigo-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M20.25 8.511c.884.284 1.5 1.128 1.5 2.097v4.286c0 1.136-.847 2.1-1.98 2.193-.34.027-.68.052-1.02.072v3.091l-3-3c-1.354 0-2.694-.055-4.02-.163a2.115 2.115 0 01-.825-.242m9.345-8.334a2.126 2.126 0 00-.476-.095 48.64 48.64 0 00-8.048 0c-1.131.094-1.976 1.057-1.976 2.192v4.286c0 .837.46 1.58 1.155 1.951m9.345-8.334V6.637c0-1.621-1.152-3.026-2.76-3.235A48.455 48.455 0 0011.25 3c-2.115 0-4.198.137-6.24.402-1.608.209-2.76 1.614-2.76 3.235v6.226c0 1.621 1.152 3.026 2.76 3.235.577.075 1.157.14 1.74.194V21l4.155-4.155" />
                </svg>
                <span className="text-sm font-semibold text-white">Team Chat</span>
                <span className="text-xs text-slate-600 ml-auto">{messages.length} messages</span>
              </div>

              {/* Messages */}
              <div className="flex-1 overflow-y-auto px-3 py-4 scroll-smooth">
                {messages.length === 0 ? (
                  <div className="h-full flex items-center justify-center">
                    <div className="text-center space-y-2">
                      <p className="text-3xl">💬</p>
                      <p className="text-sm text-slate-500">No messages yet — say hello to your team!</p>
                    </div>
                  </div>
                ) : (
                  messages.map((msg) => (
                    <ChatMessage
                      key={msg.id}
                      message={msg}
                      isOwn={msg.senderId === currentUser?.uid}
                      senderName={msg.senderName || msg.senderId}
                      senderId={msg.senderId}
                    />
                  ))
                )}
                <div ref={messagesEndRef} />
              </div>

              {/* Input */}
              <form onSubmit={handleSendMessage} className="flex items-end gap-2 px-3 py-3 border-t border-slate-800 flex-shrink-0">
                <textarea
                  ref={inputRef}
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  onKeyDown={handleKeyDown}
                  rows={1}
                  placeholder="Message your team…"
                  className="flex-1 bg-slate-800/60 border border-slate-700/60 focus:border-indigo-500/60 focus:ring-1 focus:ring-indigo-500/20 text-white placeholder-slate-600 rounded-xl px-4 py-2.5 text-sm resize-none outline-none transition-all"
                  style={{ maxHeight: '100px', overflowY: 'auto' }}
                />
                <button type="submit" disabled={!newMessage.trim()}
                  className="w-9 h-9 flex-shrink-0 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white hover:opacity-90 active:scale-95 disabled:opacity-40 transition-all">
                  <svg className="w-4 h-4 rotate-90" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 12L3.269 3.126A59.768 59.768 0 0121.485 12 59.77 59.77 0 013.269 20.876L5.999 12zm0 0h7.5" />
                  </svg>
                </button>
              </form>
            </div>
          </div>
        </div>
      </div>

      {/* ── Profile Modal ── */}
      {showProfileModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-fade-in">
          <div className="bg-[#0d1117] border border-slate-700/60 rounded-2xl shadow-2xl w-full max-w-md p-6 relative animate-scale-in">
            <button onClick={() => setShowProfileModal(false)}
              className="absolute top-4 right-4 p-1.5 rounded-lg text-slate-500 hover:text-white hover:bg-slate-800 transition-colors">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>

            {profileLoading ? (
              <div className="py-12 text-center">
                <div className="flex gap-1.5 justify-center">
                  {[0,1,2].map((i) => <span key={i} className="w-2 h-2 rounded-full bg-indigo-500 animate-bounce" style={{ animationDelay: `${i*150}ms` }} />)}
                </div>
              </div>
            ) : profileError ? (
              <p className="text-red-400 text-sm text-center py-8">{profileError}</p>
            ) : profileData ? (
              <div className="space-y-5">
                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white text-lg font-bold">
                    {getInitials(profileData.profile?.fullName || profileData.name, profileData.email)}
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-white">{profileData.profile?.fullName || profileData.name || profileData.email}</h3>
                    <p className="text-xs text-slate-500">{profileData.email}</p>
                  </div>
                </div>

                {profileData.profile?.skills?.length > 0 && (
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wider text-slate-500 mb-2">Skills</p>
                    <div className="flex flex-wrap gap-1.5">
                      {profileData.profile.skills.map((s, i) => (
                        <span key={i} className="text-xs bg-indigo-500/10 border border-indigo-500/25 text-indigo-300 px-2.5 py-1 rounded-full">{s}</span>
                      ))}
                    </div>
                  </div>
                )}

                <div className="grid grid-cols-2 gap-4">
                  <div className="glass-card p-3">
                    <p className="text-[10px] text-slate-500 mb-0.5">Experience</p>
                    <p className="text-sm text-white font-medium">{profileData.profile?.experience || 'N/A'} yrs</p>
                  </div>
                  <div className="glass-card p-3">
                    <p className="text-[10px] text-slate-500 mb-0.5">Preferred Roles</p>
                    <p className="text-sm text-white font-medium truncate">{profileData.profile?.preferredRoles || 'N/A'}</p>
                  </div>
                </div>

                {profileData.profile?.projects && (
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wider text-slate-500 mb-2">Portfolio</p>
                    <p className="text-sm text-slate-300 bg-slate-800/40 p-3 rounded-xl leading-relaxed">{profileData.profile.projects}</p>
                  </div>
                )}
              </div>
            ) : null}
          </div>
        </div>
      )}
    </div>
  );
};

export default TeamCommunity;