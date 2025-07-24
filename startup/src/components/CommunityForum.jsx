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
        membersSnapshot.docs.map(async (doc) => {
          const memberData = doc.data();
          const userDoc = await getDoc(doc(db, 'users', memberData.userId));
          return {
            id: doc.id,
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
      const users = usersSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
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
    <div className="bg-white shadow rounded-lg p-6">
      <h2 className="text-lg font-medium text-gray-900 mb-4">Community Forum</h2>
      
      {/* Add Member Form */}
      <div className="mb-6">
        <form onSubmit={handleSearch} className="flex gap-2">
          <input
            type="email"
            value={newMemberEmail}
            onChange={(e) => setNewMemberEmail(e.target.value)}
            placeholder="Enter email to add member"
            className="flex-1 rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
          />
          <button
            type="submit"
            disabled={searching}
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
          >
            {searching ? 'Searching...' : 'Search'}
          </button>
        </form>
      </div>

      {/* Search Results */}
      {searchResults.length > 0 && (
        <div className="mb-6">
          <h3 className="text-sm font-medium text-gray-700 mb-2">Search Results</h3>
          <div className="space-y-2">
            {searchResults.map((user) => (
              <div key={user.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-md">
                <div>
                  <p className="text-sm font-medium text-gray-900">{user.name}</p>
                  <p className="text-sm text-gray-500">{user.email}</p>
                  <p className="text-xs text-gray-400">Role: {user.role}</p>
                </div>
                <button
                  onClick={() => addMember(user.id, user)}
                  disabled={loading}
                  className="inline-flex items-center px-3 py-1.5 border border-transparent text-xs font-medium rounded-md text-indigo-700 bg-indigo-100 hover:bg-indigo-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
                >
                  {loading ? 'Adding...' : 'Add to Project'}
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Error Message */}
      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-md">
          <p className="text-sm text-red-600">{error}</p>
        </div>
      )}

      {/* Members List */}
      <div>
        <h3 className="text-sm font-medium text-gray-700 mb-2">Project Members</h3>
        <div className="space-y-2">
          {members.map((member) => (
            <div key={member.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-md">
              <div>
                <p className="text-sm font-medium text-gray-900">{member.userData.name}</p>
                <p className="text-sm text-gray-500">{member.userData.email}</p>
                <p className="text-xs text-gray-400">Role: {member.userData.role}</p>
              </div>
              <span className="text-xs text-gray-500">
                Joined: {member.joinedAt?.toDate().toLocaleDateString()}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default CommunityForum; 