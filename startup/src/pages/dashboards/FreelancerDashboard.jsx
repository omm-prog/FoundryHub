import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { auth } from '../../firebase/config';
import { getFirestore, doc, getDoc, collection, query, where, getDocs, addDoc, serverTimestamp } from 'firebase/firestore';
import ProfileSetup from '../../components/ProfileSetup';
import ProjectCard from '../../components/ProjectCard';
import { Modal } from 'flowbite-react';

const FreelancerDashboard = () => {
  const [userData, setUserData] = useState(null);
  const [showProfileSetup, setShowProfileSetup] = useState(false);
  const [isProfileComplete, setIsProfileComplete] = useState(false);
  const [availableProjects, setAvailableProjects] = useState([]);
  const [loadingProjects, setLoadingProjects] = useState(true);
  const [applyLoading, setApplyLoading] = useState({});
  const [appliedProjects, setAppliedProjects] = useState({});
  const [myProjects, setMyProjects] = useState([]);
  const [editFormData, setEditFormData] = useState({
    title: '',
    description: '',
    category: '',
    roles: [],
    needsInvestment: false,
    fundingGoal: '',
    investmentReason: '',
  });
  const navigate = useNavigate();
  const db = getFirestore();

  const checkProfileCompletion = (profile) => {
    if (!profile) return false;
    
    const requiredFields = ['fullName', 'age', 'experience', 'skills'];
    return requiredFields.every(field => {
      if (field === 'skills') {
        return Array.isArray(profile[field]) && profile[field].length > 0;
      }
      return profile[field] && profile[field].toString().trim() !== '';
    });
  };

  const fetchAvailableProjects = async () => {
    try {
      setLoadingProjects(true);
      const projectsQuery = query(
        collection(db, 'projects'),
        where('status', '==', 'active')
      );
      const projectsSnapshot = await getDocs(projectsQuery);
      const projects = [];
      for (const projectDoc of projectsSnapshot.docs) {
        const projectData = projectDoc.data();
        // Get founder's name
        let founderName = 'Anonymous Founder';
        if (projectData.founder) {
          const founderDoc = await getDoc(doc(db, 'users', projectData.founder));
          const founderData = founderDoc.data();
          if (founderData?.email) {
            founderName = founderData.email.split('@')[0];
          }
        }
        projects.push({
          id: projectDoc.id,
          ...projectData,
          founderName
        });
      }
      setAvailableProjects(projects);
    } catch (error) {
      console.error('Error fetching projects:', error);
    } finally {
      setLoadingProjects(false);
    }
  };

  const fetchAppliedProjects = async () => {
    if (!auth.currentUser) return;
    const joinReqQuery = query(
      collection(db, 'joinRequests'),
      where('freelancerId', '==', auth.currentUser.uid)
    );
    const snapshot = await getDocs(joinReqQuery);
    const applied = {};
    snapshot.forEach(doc => {
      const data = doc.data();
      applied[data.projectId] = true;
    });
    setAppliedProjects(applied);
  };

  const fetchMyProjects = async () => {
    if (!auth.currentUser) return;
    const db = getFirestore();
    const projectsQuery = query(
      collection(db, 'projects'),
      where('teamMembers', 'array-contains', auth.currentUser.uid)
    );
    const snapshot = await getDocs(projectsQuery);
    const projects = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    setMyProjects(projects);
  };

  useEffect(() => {
    const checkAuth = async () => {
      const user = auth.currentUser;
      if (!user) {
        navigate('/login');
        return;
      }

      try {
        const userDoc = await getDoc(doc(db, 'users', user.uid));
        if (userDoc.exists()) {
          const data = userDoc.data();
          if (data.role !== 'freelancer') {
            navigate('/dashboard');
            return;
          }
          setUserData(data);
          setIsProfileComplete(checkProfileCompletion(data.profile));
        }
      } catch (error) {
        console.error('Error fetching user data:', error);
      }
    };

    checkAuth();
    fetchAvailableProjects();
    fetchAppliedProjects();
    fetchMyProjects();
  }, [navigate]);

  const handleLogout = async () => {
    try {
      await auth.signOut();
      navigate('/login');
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  const handleProfileUpdate = () => {
    setShowProfileSetup(true);
  };

  const handleApply = async (project) => {
    if (!auth.currentUser) return;
    setApplyLoading(prev => ({ ...prev, [project.id]: true }));
    try {
      const db = getFirestore();
      // Prevent duplicate requests
      const joinReqQuery = query(
        collection(db, 'joinRequests'),
        where('projectId', '==', project.id),
        where('freelancerId', '==', auth.currentUser.uid)
      );
      const snapshot = await getDocs(joinReqQuery);
      if (!snapshot.empty) {
        setAppliedProjects(prev => ({ ...prev, [project.id]: true }));
        setApplyLoading(prev => ({ ...prev, [project.id]: false }));
        return;
      }
      await addDoc(collection(db, 'joinRequests'), {
        projectId: project.id,
        freelancerId: auth.currentUser.uid,
        status: 'pending',
        createdAt: serverTimestamp(),
      });
      setAppliedProjects(prev => ({ ...prev, [project.id]: true }));
    } catch (error) {
      console.error('Error sending join request:', error);
    } finally {
      setApplyLoading(prev => ({ ...prev, [project.id]: false }));
    }
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setEditFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
    // If needsInvestment is unchecked, clear related fields
    if (name === 'needsInvestment' && !checked) {
      setEditFormData(prev => ({
        ...prev,
        fundingGoal: '',
        investmentReason: '',
      }));
    }
  };

  if (!userData) {
    return <div>Loading...</div>;
  }

  return (
    <div className="min-h-screen bg-gray-100">
      <nav className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <h1 className="text-xl font-bold text-gray-900">Freelancer Dashboard</h1>
            </div>
            <div className="flex items-center space-x-4">
              <button
                onClick={handleProfileUpdate}
                className="px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700"
              >
                {isProfileComplete ? 'Edit Profile' : 'Set Up Profile'}
              </button>
              <span className="text-gray-600">Welcome, {userData.email}</span>
              <button
                onClick={handleLogout}
                className="px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700"
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          {/* Profile Status Card */}
          <div className="mb-8 bg-white shadow rounded-lg">
            <div className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-lg font-medium text-gray-900">Profile Status</h2>
                  <p className="mt-1 text-sm text-gray-500">
                    {isProfileComplete 
                      ? 'Your profile is complete and ready to be discovered by potential clients.'
                      : 'Complete your profile to increase your chances of getting hired.'}
                  </p>
                </div>
                <div className="flex items-center">
                  <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
                    isProfileComplete 
                      ? 'bg-green-100 text-green-800'
                      : 'bg-yellow-100 text-yellow-800'
                  }`}>
                    {isProfileComplete ? 'Complete' : 'Incomplete'}
                  </span>
                </div>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {/* Active Projects Card */}
            <div className="bg-white overflow-hidden shadow rounded-lg">
              <div className="p-5">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <svg className="h-6 w-6 text-indigo-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                    </svg>
                  </div>
                  <div className="ml-5 w-0 flex-1">
                    <dl>
                      <dt className="text-sm font-medium text-gray-500 truncate">Active Projects</dt>
                      <dd className="text-lg font-medium text-gray-900">{myProjects.length}</dd>
                    </dl>
                  </div>
                </div>
              </div>
              <div className="bg-gray-50 px-5 py-3">
                <div className="text-sm">
                  <a href="#my-projects" className="font-medium text-indigo-600 hover:text-indigo-500">View Projects</a>
                </div>
              </div>
            </div>

            {/* Earnings Card */}
            <div className="bg-white overflow-hidden shadow rounded-lg">
              <div className="p-5">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <svg className="h-6 w-6 text-indigo-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <div className="ml-5 w-0 flex-1">
                    <dl>
                      <dt className="text-sm font-medium text-gray-500 truncate">Total Earnings</dt>
                      <dd className="text-lg font-medium text-gray-900">$0</dd>
                    </dl>
                  </div>
                </div>
              </div>
              <div className="bg-gray-50 px-5 py-3">
                <div className="text-sm">
                  <a href="#" className="font-medium text-indigo-600 hover:text-indigo-500">View Earnings</a>
                </div>
              </div>
            </div>

            {/* Available Jobs Card */}
            <div className="bg-white overflow-hidden shadow rounded-lg">
              <div className="p-5">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <svg className="h-6 w-6 text-indigo-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                    </svg>
                  </div>
                  <div className="ml-5 w-0 flex-1">
                    <dl>
                      <dt className="text-sm font-medium text-gray-500 truncate">Available Jobs</dt>
                      <dd className="text-lg font-medium text-gray-900">{availableProjects.length}</dd>
                    </dl>
                  </div>
                </div>
              </div>
              <div className="bg-gray-50 px-5 py-3">
                <div className="text-sm">
                  <a href="#available-jobs" className="font-medium text-indigo-600 hover:text-indigo-500">Browse Jobs</a>
                </div>
              </div>
            </div>
          </div>

          {/* Available Jobs Section */}
          <div id="available-jobs" className="mt-8">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-medium text-gray-900">Available Jobs</h2>
              <button
                onClick={fetchAvailableProjects}
                className="text-sm text-indigo-600 hover:text-indigo-500"
              >
                Refresh
              </button>
            </div>
            {loadingProjects ? (
              <div className="text-center py-12">
                <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-indigo-600 border-t-transparent"></div>
                <p className="mt-2 text-sm text-gray-500">Loading available projects...</p>
              </div>
            ) : availableProjects.length > 0 ? (
              <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 max-h-[600px] overflow-y-auto pr-2">
                {availableProjects.map((project) => {
                  const isJoined = myProjects.some((p) => p.id === project.id);
                  return (
                    <ProjectCard
                      key={project.id}
                      project={project}
                      onApply={() => handleApply(project)}
                      applyDisabled={!!appliedProjects[project.id] || isJoined}
                      applyLoading={!!applyLoading[project.id]}
                      applyStatus={isJoined ? 'joined' : (appliedProjects[project.id] ? 'applied' : null)}
                    />
                  );
                })}
              </div>
            ) : (
              <div className="text-center py-12 bg-white rounded-lg shadow">
                <svg
                  className="mx-auto h-12 w-12 text-gray-400"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
                <h3 className="mt-2 text-sm font-medium text-gray-900">No projects found</h3>
                <p className="mt-1 text-sm text-gray-500">
                  There are no available projects at the moment. Please check back later.
                </p>
              </div>
            )}
          </div>

          {/* My Projects Section */}
          <div className="mt-8">
            <h2 className="text-lg font-medium text-gray-900 mb-4">My Projects</h2>
            {myProjects.length === 0 ? (
              <div className="bg-white rounded-lg shadow p-6 text-gray-500">You have no active projects yet.</div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {myProjects.map((project) => (
                  <div key={project.id} className="bg-white rounded-lg shadow p-6 flex flex-col justify-between">
                    <div>
                      <h3 className="text-lg font-bold text-gray-900 mb-2">{project.title}</h3>
                      <p className="text-gray-600 mb-4 line-clamp-2">{project.description}</p>
                    </div>
                    <Link
                      to={`/team-community/${project.id}`}
                      className="mt-4 inline-block bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-2 px-4 rounded shadow text-center"
                    >
                      Go to Community
                    </Link>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Skills and Availability */}
          <div className="mt-8">
            <h2 className="text-lg font-medium text-gray-900">Skills and Availability</h2>
            <div className="mt-4 bg-white shadow rounded-lg">
              <div className="p-6">
                <div className="space-y-4">
                  <div>
                    <h3 className="text-sm font-medium text-gray-500">Skills</h3>
                    <p className="mt-1 text-gray-900">
                      {userData.profile?.skills?.length > 0 
                        ? userData.profile.skills.join(', ')
                        : 'No skills added'}
                    </p>
                    <button 
                      onClick={handleProfileUpdate}
                      className="mt-2 text-sm text-indigo-600 hover:text-indigo-500"
                    >
                      {userData.profile?.skills?.length > 0 ? 'Edit Skills' : 'Add Skills'}
                    </button>
                  </div>
                  <div>
                    <h3 className="text-sm font-medium text-gray-500">Availability</h3>
                    <p className="mt-1 text-gray-900">Not set</p>
                    <button className="mt-2 text-sm text-indigo-600 hover:text-indigo-500">Set Availability</button>
                  </div>
                  <div>
                    <h3 className="text-sm font-medium text-gray-500">Hourly Rate</h3>
                    <p className="mt-1 text-gray-900">Not set</p>
                    <button className="mt-2 text-sm text-indigo-600 hover:text-indigo-500">Set Rate</button>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* New Investment Fields */}
          <div className="flex items-center">
            <input
              id="needsInvestment"
              name="needsInvestment"
              type="checkbox"
              checked={editFormData.needsInvestment}
              onChange={handleChange}
              className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
            />
            <label htmlFor="needsInvestment" className="ml-2 block text-sm text-gray-900">
              I need investment for this project
            </label>
          </div>

          {editFormData.needsInvestment && (
            <>
              {/* Funding Goal field */}
              <div>
                <label htmlFor="fundingGoal" className="block text-sm font-medium text-gray-700">Funding Goal (e.g., $10000)</label>
                <input
                  type="text"
                  id="fundingGoal"
                  name="fundingGoal"
                  value={editFormData.fundingGoal}
                  onChange={handleChange}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                />
              </div>
              {/* Reason for Investment field */}
              <div>
                <label htmlFor="investmentReason" className="block text-sm font-medium text-gray-700">Reason for Investment</label>
                <textarea
                  id="investmentReason"
                  name="investmentReason"
                  rows="3"
                  value={editFormData.investmentReason}
                  onChange={handleChange}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                />
              </div>
            </>
          )}
        </div>
      </main>

      {showProfileSetup && (
        <ProfileSetup 
          onClose={() => {
            setShowProfileSetup(false);
            // Refresh user data to update profile completion status
            const user = auth.currentUser;
            if (user) {
              getDoc(doc(db, 'users', user.uid)).then(doc => {
                if (doc.exists()) {
                  const data = doc.data();
                  setUserData(data);
                  setIsProfileComplete(checkProfileCompletion(data.profile));
                }
              });
            }
          }}
          initialData={userData.profile}
        />
      )}
    </div>
  );
};

export default FreelancerDashboard; 