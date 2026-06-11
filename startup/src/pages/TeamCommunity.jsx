import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { collection, doc, getDoc, getDocs, query, where, updateDoc, arrayUnion, addDoc, serverTimestamp, onSnapshot, orderBy } from 'firebase/firestore';
import { db } from '../firebase/config';
import { useAuth } from '../contexts/AuthContext';
import LoadingSkeleton from '../components/LoadingSkeleton';

// Helper to get initials
const getInitials = (name, email) => {
  if (name) {
    return name.split(' ').map((n) => n[0]).join('').toUpperCase();
  }
  if (email) {
    return email[0].toUpperCase();
  }
  return '?';
};

const TeamCommunity = () => {
  const [project, setProject] = useState(null);
  const [teamMembers, setTeamMembers] = useState([]);
  const [newMemberEmail, setNewMemberEmail] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const { projectId } = useParams();
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  const [joinRequests, setJoinRequests] = useState([]);
  const [joinReqLoading, setJoinReqLoading] = useState(false);
  const [selectedFreelancer, setSelectedFreelancer] = useState(null);
  const [profileModalOpen, setProfileModalOpen] = useState(false);
  const [profileLoading, setProfileLoading] = useState(false);
  const [profileError, setProfileError] = useState('');
  const [profileData, setProfileData] = useState(null);
  const [showCustomModal, setShowCustomModal] = useState(false);

  useEffect(() => {
    const fetchProjectAndTeam = async () => {
      try {
        const projectDoc = await getDoc(doc(db, 'projects', projectId));
        if (projectDoc.exists()) {
          const projectData = projectDoc.data();
          setProject(projectData);
          
          // Fetch team members' details
          const members = projectData.teamMembers || [];
          const membersDetails = await Promise.all(
            members.map(async (memberId) => {
              const userDoc = await getDoc(doc(db, 'users', memberId));
              return userDoc.exists() ? { id: memberId, ...userDoc.data() } : null;
            })
          );
          setTeamMembers(membersDetails.filter(member => member !== null));
        }
      } catch (error) {
        console.error('Error fetching project:', error);
        setError('Failed to load project details');
      } finally {
        setLoading(false);
      }
    };

    fetchProjectAndTeam();
  }, [projectId]);

  // Set up real-time chat listener
  useEffect(() => {
    if (!projectId) return;

    const messagesRef = collection(db, 'projects', projectId, 'messages');
    const q = query(messagesRef, orderBy('timestamp', 'asc'));

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const newMessages = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setMessages(newMessages);
    });

    return () => unsubscribe();
  }, [projectId]);

  // Fetch join requests for this project
  const fetchJoinRequests = async () => {
    setJoinReqLoading(true);
    try {
      const joinReqQuery = query(
        collection(db, 'joinRequests'),
        where('projectId', '==', projectId),
        where('status', '==', 'pending')
      );
      const snapshot = await getDocs(joinReqQuery);
      const reqs = await Promise.all(snapshot.docs.map(async (docSnap) => {
        const data = docSnap.data();
        // Get freelancer info
        const userDoc = await getDoc(doc(db, 'users', data.freelancerId));
        return {
          id: docSnap.id,
          ...data,
          freelancerId: data.freelancerId,
          freelancer: userDoc.exists() ? userDoc.data() : { email: data.freelancerId }
        };
      }));
      setJoinRequests(reqs);
    } catch (e) {
      setJoinRequests([]);
    } finally {
      setJoinReqLoading(false);
    }
  };

  useEffect(() => {
    fetchJoinRequests();
  }, [projectId]);

  const handleAddMember = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    try {
      const usersRef = collection(db, 'users');
      const q = query(usersRef, where('email', '==', newMemberEmail), where('role', '==', 'freelancer'));
      const querySnapshot = await getDocs(q);

      if (querySnapshot.empty) {
        setError('No freelancer found with this email address');
        return;
      }

      const freelancerDoc = querySnapshot.docs[0];
      const freelancerId = freelancerDoc.id;

      if (project.teamMembers?.includes(freelancerId)) {
        setError('This user is already a team member');
        return;
      }

      const projectRef = doc(db, 'projects', projectId);
      await updateDoc(projectRef, {
        teamMembers: arrayUnion(freelancerId)
      });

      const freelancerData = freelancerDoc.data();
      setTeamMembers([...teamMembers, { id: freelancerId, ...freelancerData }]);
      setNewMemberEmail('');
      setSuccess('Team member added successfully');
    } catch (error) {
      console.error('Error adding team member:', error);
      setError('Failed to add team member');
    }
  };

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!newMessage.trim()) return;

    try {
      const messagesRef = collection(db, 'projects', projectId, 'messages');
      await addDoc(messagesRef, {
        text: newMessage,
        senderId: currentUser.uid,
        senderName: currentUser.displayName || currentUser.email,
        timestamp: serverTimestamp()
      });
      setNewMessage('');
    } catch (error) {
      console.error('Error sending message:', error);
      setError('Failed to send message');
    }
  };

  // Accept join request
  const handleAcceptRequest = async (req) => {
    setJoinReqLoading(true);
    try {
      // Add to teamMembers
      const projectRef = doc(db, 'projects', projectId);
      await updateDoc(projectRef, {
        teamMembers: arrayUnion(req.freelancerId)
      });
      // Update join request status
      await updateDoc(doc(db, 'joinRequests', req.id), { status: 'accepted' });
      setJoinRequests((prev) => prev.filter((r) => r.id !== req.id));
      setTeamMembers((prev) => [...prev, { id: req.freelancerId, ...req.freelancer }]);
    } catch (e) {
      console.error('Error accepting join request:', e);
    } finally {
      setJoinReqLoading(false);
    }
  };

  // Reject join request
  const handleRejectRequest = async (req) => {
    setJoinReqLoading(true);
    try {
      await updateDoc(doc(db, 'joinRequests', req.id), { status: 'rejected' });
      setJoinRequests((prev) => prev.filter((r) => r.id !== req.id));
    } catch (e) {
      console.error('Error rejecting join request:', e);
    } finally {
      setJoinReqLoading(false);
    }
  };

  // Fetch full profile from users collection
  const handleViewProfile = async (freelancerId) => {
    setProfileModalOpen(false);
    setShowCustomModal(true);
    setProfileLoading(true);
    setProfileError('');
    setProfileData(null);
    try {
      const userDoc = await getDoc(doc(db, 'users', freelancerId));
      if (userDoc.exists()) {
        setProfileData(userDoc.data());
      } else {
        setProfileError('Profile not found');
      }
    } catch (e) {
      setProfileError('Failed to fetch profile');
    } finally {
      setProfileLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#030712] py-12">
        <LoadingSkeleton type="dashboard" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#030712] text-slate-100 font-sans relative overflow-hidden py-12 px-4 sm:px-6 lg:px-8">
      {/* Background radial glows */}
      <div className="absolute top-[-10%] left-[-15%] w-[50%] h-[50%] bg-indigo-500/10 rounded-full blur-[120px] pointer-events-none"></div>
      <div className="absolute bottom-[-10%] right-[-15%] w-[50%] h-[50%] bg-purple-500/10 rounded-full blur-[120px] pointer-events-none"></div>

      <div className="max-w-7xl mx-auto relative z-10 space-y-8">
        <div className="flex justify-between items-center pb-4 border-b border-slate-800">
          <div className="space-y-1">
            <span className="text-[10px] uppercase font-bold text-indigo-400 bg-indigo-500/10 px-2 py-0.5 rounded border border-indigo-500/20">Pod Operations</span>
            <h1 className="text-3xl font-extrabold text-white tracking-tight font-display">{project?.title} - Team Community</h1>
          </div>
          <button
            onClick={() => navigate('/dashboard')}
            className="px-4 py-2 border border-slate-700 bg-slate-800 hover:bg-slate-700 text-slate-100 text-xs font-semibold rounded-xl transition-all"
          >
            Back to Dashboard
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Team Members Section */}
          <div className="lg:col-span-1 space-y-8">
            {/* Add Member Card */}
            <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-6 shadow-lg backdrop-blur-md">
              <h2 className="text-lg font-bold text-slate-200 mb-4">Add Team Member</h2>
              <form onSubmit={handleAddMember} className="space-y-4">
                <div>
                  <label htmlFor="email" className="block text-xs font-semibold uppercase tracking-wider text-slate-450 mb-1.5">
                    Freelancer Email Address
                  </label>
                  <input
                    type="email"
                    id="email"
                    value={newMemberEmail}
                    onChange={(e) => setNewMemberEmail(e.target.value)}
                    className="w-full bg-slate-950/60 border border-slate-800 focus:border-indigo-500 text-white placeholder-slate-500 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 px-4 py-3 text-sm transition-all"
                    required
                    placeholder="name@example.com"
                  />
                </div>
                <button
                  type="submit"
                  className="w-full bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white text-xs font-semibold py-2.5 px-4 rounded-xl shadow-md transition-all duration-200"
                >
                  Add Member
                </button>
              </form>
              {error && <p className="mt-3 text-xs text-red-400 font-semibold">{error}</p>}
              {success && <p className="mt-3 text-xs text-emerald-400 font-semibold">{success}</p>}
            </div>

            {/* Pending Join Requests */}
            {currentUser?.uid === project?.founder && (
              <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-6 shadow-lg backdrop-blur-md">
                <h2 className="text-lg font-bold text-slate-200 mb-4">Join Requests</h2>
                {joinReqLoading ? (
                  <p className="text-xs text-slate-500 animate-pulse">Loading...</p>
                ) : joinRequests.length === 0 ? (
                  <p className="text-xs text-slate-500">No pending join requests</p>
                ) : (
                  <div className="space-y-4">
                    {joinRequests.map((req) => (
                      <div key={req.id} className="border border-slate-850 bg-slate-950/40 p-4 rounded-xl space-y-3">
                        <div>
                          <span className="text-indigo-400 font-semibold text-sm">{req.freelancer?.name || req.freelancer?.email}</span>
                          <p className="text-xs text-slate-500">{req.freelancer?.email}</p>
                        </div>
                        <div className="flex flex-wrap gap-2">
                          <button
                            className="bg-emerald-500/10 border border-emerald-500/30 text-emerald-450 px-2.5 py-1.5 rounded-lg hover:bg-emerald-500/20 transition-all text-[10px] font-bold"
                            onClick={() => handleAcceptRequest(req)}
                            disabled={joinReqLoading}
                          >
                            Accept
                          </button>
                          <button
                            className="bg-red-500/10 border border-red-500/30 text-red-450 px-2.5 py-1.5 rounded-lg hover:bg-red-500/20 transition-all text-[10px] font-bold"
                            onClick={() => handleRejectRequest(req)}
                            disabled={joinReqLoading}
                          >
                            Reject
                          </button>
                          <button
                            className="bg-slate-900 border border-slate-800 text-slate-350 hover:text-white px-2.5 py-1.5 rounded-lg hover:bg-slate-850 transition-all text-[10px] font-bold"
                            onClick={() => handleViewProfile(req.freelancerId)}
                          >
                            Profile
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Current Team Members */}
            <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-6 shadow-lg backdrop-blur-md">
              <h2 className="text-lg font-bold text-slate-200 mb-4">Current Team</h2>
              {teamMembers.length === 0 ? (
                <p className="text-xs text-slate-500">No team members joined yet.</p>
              ) : (
                <div className="space-y-3">
                  {teamMembers.map((member) => (
                    <div key={member.id} className="border border-slate-850/60 bg-slate-950/30 p-4 rounded-xl">
                      <h3 className="font-bold text-slate-200 text-sm">{member.name || member.email?.split('@')[0]}</h3>
                      <p className="text-xs text-slate-500">{member.email}</p>
                      <span className="inline-block mt-2 text-[10px] font-bold text-indigo-400 bg-indigo-500/10 border border-indigo-500/20 px-2 py-0.5 rounded-md capitalize">
                        {member.role || 'Member'}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Chat Section */}
          <div className="lg:col-span-2">
            <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-6 h-[600px] flex flex-col justify-between shadow-lg backdrop-blur-md">
              <div className="pb-3 border-b border-slate-800">
                <h2 className="text-lg font-bold text-slate-200">Team Chat</h2>
              </div>
              
              {/* Messages Container */}
              <div className="flex-1 overflow-y-auto my-4 pr-1 space-y-4 scrollbar-thin">
                {messages.length === 0 ? (
                  <div className="h-full flex items-center justify-center text-slate-500 text-xs">
                    No messages yet. Start the conversation!
                  </div>
                ) : (
                  messages.map((message) => (
                    <div
                      key={message.id}
                      className={`flex ${
                        message.senderId === currentUser.uid ? 'justify-end' : 'justify-start'
                      }`}
                    >
                      <div
                        className={`max-w-[75%] rounded-2xl p-3.5 border ${
                          message.senderId === currentUser.uid
                            ? 'bg-indigo-600/30 border-indigo-500/20 text-slate-150'
                            : 'bg-slate-950/60 border-slate-850 text-slate-200'
                        }`}
                      >
                        <p className="text-[10px] font-bold text-indigo-400 mb-1">
                          {message.senderName || 'Anonymous'}
                        </p>
                        <p className="text-sm leading-relaxed">{message.text}</p>
                        <span className="text-[9px] text-slate-500 mt-1.5 block text-right">
                          {message.timestamp?.toDate().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                    </div>
                  ))
                )}
              </div>

              {/* Message Input */}
              <form onSubmit={handleSendMessage} className="flex gap-2.5 pt-3 border-t border-slate-800">
                <input
                  type="text"
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  placeholder="Type your message..."
                  className="flex-1 bg-slate-950/60 border border-slate-800 focus:border-indigo-500 text-white placeholder-slate-500 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 px-4 py-3 text-sm transition-all"
                />
                <button
                  type="submit"
                  className="bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white font-bold px-6 rounded-xl text-sm shadow-md transition-all duration-200"
                >
                  Send
                </button>
              </form>
            </div>
          </div>
        </div>
      </div>

      {/* Custom Profile Modal */}
      {showCustomModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-fadeIn">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl w-full max-w-lg p-6 relative text-slate-100">
            <button
              className="absolute top-4 right-4 text-slate-450 hover:text-white text-lg font-bold"
              onClick={() => setShowCustomModal(false)}
            >
              ×
            </button>
            {profileLoading ? (
              <div className="text-center py-8 text-slate-400 animate-pulse">Loading profile...</div>
            ) : profileError ? (
              <div className="text-center text-red-400 py-8 font-semibold">{profileError}</div>
            ) : profileData ? (
              <div className="space-y-6">
                <div className="flex items-center gap-4">
                  {profileData.profile?.photoURL ? (
                    <img src={profileData.profile.photoURL} alt="avatar" className="w-16 h-16 rounded-full object-cover border border-slate-800" />
                  ) : (
                    <div className="w-16 h-16 rounded-full bg-indigo-500/10 flex items-center justify-center text-2xl font-bold text-indigo-400 border border-indigo-500/25">
                      {getInitials(profileData.profile?.fullName || profileData.name, profileData.email)}
                    </div>
                  )}
                  <div>
                    <h3 className="text-2xl font-bold text-white mb-0.5">{profileData.profile?.fullName || profileData.name || profileData.email}</h3>
                    <p className="text-xs text-slate-450">{profileData.email}</p>
                  </div>
                </div>
                
                <div className="space-y-4 pt-4 border-t border-slate-850">
                  <div>
                    <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-500 mb-2">Skills Inventory</h4>
                    <div className="flex flex-wrap gap-2">
                      {profileData.profile?.skills?.length > 0 ? (
                        profileData.profile.skills.map((skill, idx) => (
                          <span key={idx} className="bg-indigo-500/10 border border-indigo-500/20 text-indigo-450 px-2.5 py-0.5 rounded-lg text-xs font-semibold">{skill}</span>
                        ))
                      ) : (
                        <span className="text-xs text-slate-500 italic">No skills listed</span>
                      )}
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-500 mb-1">Experience</h4>
                      <p className="text-sm text-slate-200">{profileData.profile?.experience || 'N/A'} years</p>
                    </div>
                    <div>
                      <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-500 mb-1">Preferred Roles</h4>
                      <p className="text-sm text-slate-200">{profileData.profile?.preferredRoles || 'N/A'}</p>
                    </div>
                  </div>

                  <div>
                    <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-500 mb-1">Projects & Portfolio Summary</h4>
                    <div className="text-sm text-slate-350 bg-slate-950/40 p-3.5 rounded-xl border border-slate-850/80 whitespace-pre-line leading-relaxed">
                      {profileData.profile?.projects || 'No projects listed.'}
                    </div>
                  </div>
                </div>
              </div>
            ) : null}
          </div>
        </div>
      )}
    </div>
  );
};

export default TeamCommunity;