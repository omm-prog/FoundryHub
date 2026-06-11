import { useState, useEffect } from 'react';
import { getFirestore, collection, query, where, getDocs, addDoc, serverTimestamp, doc, getDoc } from 'firebase/firestore';
import { auth } from '../firebase/config';

const CommunityForum = ({ projectId }) => {
  const [members, setMembers] = useState([]);
  const [newMemberEmail, setNewMemberEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [searching, setSearching] = useState(false);
  const db = getFirestore();

  useEffect(() => {
    fetchMembers();
  }, [projectId]);

  const fetchMembers = async () => {
    try {
      const membersQuery = query(
        collection(db, 'projectMembers'),
        where('projectId', '==', projectId)
      );
      const membersSnapshot = await getDocs(membersQuery);
      const membersList = await Promise.all(
        membersSnapshot.docs.map(async (docSnap) => {
          const memberData = docSnap.data();
          const userDoc = await getDoc(doc(db, 'users', memberData.userId));
          return {
            id: docSnap.id,
            ...memberData,
            userData: userDoc.data()
          };
        })
      );
      setMembers(membersList);
    } catch (error) {
      console.error('Error fetching members:', error);
      setError('Failed to load community members');
    }
  };

  const searchUser = async (email) => {
    setSearching(true);
    setError('');
    try {
      const usersQuery = query(
        collection(db, 'users'),
        where('email', '==', email.toLowerCase())
      );
      const usersSnapshot = await getDocs(usersQuery);
      const users = usersSnapshot.docs.map(docSnap => ({
        id: docSnap.id,
        ...docSnap.data()
      }));
      setSearchResults(users);
    } catch (error) {
      console.error('Error searching user:', error);
      setError('Failed to search user');
    } finally {
      setSearching(false);
    }
  };

  const addMember = async (userId, userData) => {
    setLoading(true);
    setError('');
    try {
      // Check if user is already a member
      const existingMemberQuery = query(
        collection(db, 'projectMembers'),
        where('projectId', '==', projectId),
        where('userId', '==', userId)
      );
      const existingMemberSnapshot = await getDocs(existingMemberQuery);
      
      if (!existingMemberSnapshot.empty) {
        setError('User is already a member of this project');
        return;
      }

      // Add new member
      await addDoc(collection(db, 'projectMembers'), {
        projectId,
        userId,
        role: userData.role,
        joinedAt: serverTimestamp(),
        addedBy: auth.currentUser.uid
      });

      // Refresh members list
      await fetchMembers();
      setNewMemberEmail('');
      setSearchResults([]);
    } catch (error) {
      console.error('Error adding member:', error);
      setError('Failed to add member');
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = async (e) => {
    e.preventDefault();
    if (!newMemberEmail) return;
    await searchUser(newMemberEmail);
  };

  return (
    <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-6 backdrop-blur-md space-y-6">
      <div>
        <h2 className="text-lg font-bold text-slate-200">Community Forum</h2>
        <p className="text-xs text-slate-500 mt-0.5">Manage and view active platform accounts added to this pod.</p>
      </div>
      
      {/* Add Member Form */}
      <div>
        <form onSubmit={handleSearch} className="flex gap-2.5">
          <input
            type="email"
            value={newMemberEmail}
            onChange={(e) => setNewMemberEmail(e.target.value)}
            placeholder="Enter email to add member"
            className="flex-1 bg-slate-950/60 border border-slate-800 focus:border-indigo-500 text-white placeholder-slate-500 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 px-4 py-3 text-sm transition-all"
          />
          <button
            type="submit"
            disabled={searching}
            className="bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white font-bold px-5 py-3.5 rounded-xl text-sm shadow-md transition-all duration-200 disabled:opacity-55"
          >
            {searching ? 'Searching...' : 'Search'}
          </button>
        </form>
      </div>

      {/* Search Results */}
      {searchResults.length > 0 && (
        <div className="space-y-3 pt-4 border-t border-slate-800">
          <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-400">Search Results</h3>
          <div className="space-y-2">
            {searchResults.map((user) => (
              <div key={user.id} className="flex items-center justify-between p-4 bg-slate-950/45 border border-slate-850 rounded-xl">
                <div>
                  <p className="text-sm font-bold text-slate-200">{user.name}</p>
                  <p className="text-xs text-slate-500">{user.email}</p>
                  <span className="inline-block mt-2 text-[10px] font-bold text-indigo-400 bg-indigo-500/10 border border-indigo-500/20 px-2 py-0.5 rounded-md capitalize">
                    Role: {user.role}
                  </span>
                </div>
                <button
                  onClick={() => addMember(user.id, user)}
                  disabled={loading}
                  className="bg-gradient-to-r from-indigo-500/15 to-purple-600/15 border border-indigo-500/30 text-indigo-400 hover:from-indigo-500 hover:to-purple-650 hover:text-white px-3.5 py-2 rounded-xl text-xs font-semibold shadow-md transition-all duration-200 disabled:opacity-50"
                >
                  {loading ? 'Adding...' : 'Add to Pod'}
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Error Message */}
      {error && (
        <div className="p-4 bg-red-500/10 border border-red-500/25 rounded-2xl text-red-400 text-sm font-semibold">
          <p>{error}</p>
        </div>
      )}

      {/* Members List */}
      <div className="space-y-3 pt-4 border-t border-slate-800">
        <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-400">Project Backers & Team</h3>
        <div className="space-y-2">
          {members.length === 0 ? (
            <p className="text-xs text-slate-500">No community members registered for this pod.</p>
          ) : (
            members.map((member) => (
              <div key={member.id} className="flex items-center justify-between p-4 bg-slate-950/30 border border-slate-850/60 rounded-xl text-slate-100">
                <div>
                  <p className="text-sm font-bold text-slate-200">{member.userData?.name || member.userData?.email?.split('@')[0] || 'Anonymous'}</p>
                  <p className="text-xs text-slate-500">{member.userData?.email}</p>
                  <span className="inline-block mt-2 text-[10px] font-bold text-indigo-400 bg-indigo-500/10 border border-indigo-500/20 px-2 py-0.5 rounded-md capitalize">
                    Role: {member.userData?.role || 'Member'}
                  </span>
                </div>
                <span className="text-[10px] text-slate-500">
                  Joined: {member.joinedAt ? member.joinedAt.toDate().toLocaleDateString() : 'N/A'}
                </span>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

export default CommunityForum;