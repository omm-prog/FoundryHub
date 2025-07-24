import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { collection, doc, getDoc, getDocs, query, where, updateDoc, arrayUnion, addDoc, serverTimestamp, onSnapshot, orderBy, writeBatch } from 'firebase/firestore';
import { db } from '../firebase/config';
import { useAuth } from '../contexts/AuthContext';

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
      // handle error
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
      // handle error
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
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-8">{project?.title} - Team Community</h1>
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Team Members Section */}
        <div className="lg:col-span-1">
          <div className="bg-white rounded-lg shadow-md p-6 mb-8">
            <h2 className="text-xl font-semibold mb-4">Add Team Member</h2>
            <form onSubmit={handleAddMember} className="space-y-4">
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                  Freelancer Email
                </label>
                <input
                  type="email"
                  id="email"
                  value={newMemberEmail}
                  onChange={(e) => setNewMemberEmail(e.target.value)}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                  required
                />
              </div>
              <button
                type="submit"
                className="bg-blue-500 text-white px-4 py-2 rounded-md hover:bg-blue-600 transition-colors"
              >
                Add Member
              </button>
            </form>
            {error && <p className="mt-2 text-red-600">{error}</p>}
            {success && <p className="mt-2 text-green-600">{success}</p>}
          </div>

          {/* Pending Join Requests */}
          {currentUser?.uid === project?.founder && (
            <div className="bg-white rounded-lg shadow-md p-6 mb-8">
              <h2 className="text-xl font-semibold mb-4">View Requests</h2>
              {joinReqLoading ? (
                <p>Loading...</p>
              ) : joinRequests.length === 0 ? (
                <p className="text-gray-600">No pending requests</p>
              ) : (
                <div className="space-y-4">
                  {joinRequests.map((req) => (
                    <div key={req.id} className="border rounded-lg p-4 flex flex-col">
                      <div>
                        <span className="text-indigo-600 font-semibold">{req.freelancer?.name || req.freelancer?.email}</span>
                        <p className="text-gray-600">{req.freelancer?.email}</p>
                      </div>
                      <div className="mt-2 flex gap-2">
                        <button
                          className="bg-green-500 text-white px-3 py-1 rounded hover:bg-green-600"
                          onClick={() => handleAcceptRequest(req)}
                          disabled={joinReqLoading}
                        >
                          Accept
                        </button>
                        <button
                          className="bg-red-500 text-white px-3 py-1 rounded hover:bg-red-600"
                          onClick={() => handleRejectRequest(req)}
                          disabled={joinReqLoading}
                        >
                          Reject
                        </button>
                        <button
                          className="bg-blue-500 text-white px-3 py-1 rounded hover:bg-blue-600"
                          onClick={() => handleViewProfile(req.freelancerId)}
                        >
                          View Profile
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-semibold mb-4">Current Team Members</h2>
            {teamMembers.length === 0 ? (
              <p className="text-gray-600">No team members yet</p>
            ) : (
              <div className="space-y-4">
                {teamMembers.map((member) => (
                  <div key={member.id} className="border rounded-lg p-4">
                    <h3 className="font-semibold">{member.name}</h3>
                    <p className="text-gray-600">{member.email}</p>
                    <p className="text-sm text-gray-500">Role: {member.role}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Chat Section */}
        <div className="lg:col-span-2">
          <div className="bg-white rounded-lg shadow-md p-6 h-[600px] flex flex-col">
            <h2 className="text-xl font-semibold mb-4">Team Chat</h2>
            
            {/* Messages Container */}
            <div className="flex-1 overflow-y-auto mb-4 space-y-4">
              {messages.map((message) => (
                <div
                  key={message.id}
                  className={`flex ${
                    message.senderId === currentUser.uid ? 'justify-end' : 'justify-start'
                  }`}
                >
                  <div
                    className={`max-w-[70%] rounded-lg p-3 ${
                      message.senderId === currentUser.uid
                        ? 'bg-blue-500 text-white'
                        : 'bg-gray-100 text-gray-800'
                    }`}
                  >
                    <p className="text-sm font-semibold mb-1">
                      {message.senderName}
                    </p>
                    <p>{message.text}</p>
                    <p className="text-xs mt-1 opacity-70">
                      {message.timestamp?.toDate().toLocaleTimeString()}
                    </p>
                  </div>
                </div>
              ))}
            </div>

            {/* Message Input */}
            <form onSubmit={handleSendMessage} className="flex gap-2">
              <input
                type="text"
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                placeholder="Type your message..."
                className="flex-1 rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              />
              <button
                type="submit"
                className="bg-blue-500 text-white px-4 py-2 rounded-md hover:bg-blue-600 transition-colors"
              >
                Send
              </button>
            </form>
          </div>
        </div>
      </div>

      {/* Custom Profile Modal */}
      {showCustomModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40">
          <div className="bg-white rounded-lg shadow-lg w-full max-w-lg p-6 relative">
            <button
              className="absolute top-2 right-2 text-gray-500 hover:text-gray-700 text-lg font-bold"
              onClick={() => setShowCustomModal(false)}
            >
              ×
            </button>
            {profileLoading ? (
              <div className="text-center py-8">Loading...</div>
            ) : profileError ? (
              <div className="text-center text-red-500 py-8">{profileError}</div>
            ) : profileData ? (
              <div className="space-y-6">
                <div className="flex items-center gap-4">
                  {profileData.profile?.photoURL ? (
                    <img src={profileData.profile.photoURL} alt="avatar" className="w-16 h-16 rounded-full object-cover border" />
                  ) : (
                    <div className="w-16 h-16 rounded-full bg-indigo-200 flex items-center justify-center text-2xl font-bold text-indigo-700 border">
                      {getInitials(profileData.profile?.fullName || profileData.name, profileData.email)}
                    </div>
                  )}
                  <div>
                    <h3 className="text-2xl font-bold mb-1">{profileData.profile?.fullName || profileData.name || profileData.email}</h3>
                    <p className="text-gray-600">{profileData.email}</p>
                  </div>
                </div>
                <div>
                  <h4 className="font-semibold text-lg mb-1">Skills</h4>
                  <div className="flex flex-wrap gap-2">
                    {profileData.profile?.skills?.length > 0 ? (
                      profileData.profile.skills.map((skill, idx) => (
                        <span key={idx} className="bg-indigo-100 text-indigo-800 px-2 py-1 rounded text-xs">{skill}</span>
                      ))
                    ) : (
                      <span className="text-gray-500">No skills listed</span>
                    )}
                  </div>
                </div>
                <div>
                  <h4 className="font-semibold text-lg mb-1">Experience</h4>
                  <p>{profileData.profile?.experience || 'N/A'} years</p>
                </div>
                <div>
                  <h4 className="font-semibold text-lg mb-1">Projects / Portfolio</h4>
                  <div className="whitespace-pre-line text-gray-700">
                    {profileData.profile?.projects || 'N/A'}
                  </div>
                </div>
                <div>
                  <h4 className="font-semibold text-lg mb-1">Preferred Roles</h4>
                  <p>{profileData.profile?.preferredRoles || 'N/A'}</p>
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