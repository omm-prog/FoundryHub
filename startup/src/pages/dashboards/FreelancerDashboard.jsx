import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { auth } from '../../firebase/config';
import { getFirestore, doc, getDoc, collection, query, where, getDocs, addDoc, serverTimestamp } from 'firebase/firestore';
import ProfileSetup from '../../components/ProfileSetup';
import ProjectCard from '../../components/ProjectCard';
import LoadingSkeleton from '../../components/LoadingSkeleton';

const FreelancerDashboard = ({ initialUserData }) => {
  const [userData, setUserData] = useState(initialUserData || null);
  const [showProfileSetup, setShowProfileSetup] = useState(false);
  const [isProfileComplete, setIsProfileComplete] = useState(false);
  const [availableProjects, setAvailableProjects] = useState([]);
  const [loadingProjects, setLoadingProjects] = useState(true);
  const [applyLoading, setApplyLoading] = useState({});
  const [appliedProjects, setAppliedProjects] = useState({});
  const [myProjects, setMyProjects] = useState([]);
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
      
      // Fetch founder profiles in parallel instead of sequentially in a loop
      const projectPromises = projectsSnapshot.docs.map(async (projectDoc) => {
        const projectData = projectDoc.data();
        let founderName = 'Anonymous Founder';
        if (projectData.founder) {
          const founderDoc = await getDoc(doc(db, 'users', projectData.founder));
          const founderData = founderDoc.data();
          if (founderData?.email) {
            founderName = founderData.email.split('@')[0];
          }
        }
        return {
          id: projectDoc.id,
          ...projectData,
          founderName
        };
      });

      const projects = await Promise.all(projectPromises);
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
        let data = userData;
        if (!data) {
          const userDoc = await getDoc(doc(db, 'users', user.uid));
          if (userDoc.exists()) {
            data = userDoc.data();
            if (data.role !== 'freelancer') {
              navigate('/dashboard');
              return;
            }
            setUserData(data);
          }
        }
        if (data) {
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

  if (!userData) {
    return (
      <div className="min-h-screen bg-[#030712] py-12">
        <LoadingSkeleton type="dashboard" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#030712] text-slate-100 font-sans relative overflow-hidden">
      {/* Background radial glows */}
      <div className="absolute top-[-10%] left-[-15%] w-[50%] h-[50%] bg-indigo-500/10 rounded-full blur-[120px] pointer-events-none"></div>
      <div className="absolute bottom-[-10%] right-[-15%] w-[50%] h-[50%] bg-purple-500/10 rounded-full blur-[120px] pointer-events-none"></div>

      {/* Navigation */}
      <nav className="bg-[#030712]/80 border-b border-slate-800/60 backdrop-blur-md sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <svg className="h-7 w-7 text-indigo-500 drop-shadow-[0_0_8px_rgba(99,102,241,0.5)]" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M12 22C17.5228 22 22 17.5228 22 12C22 6.47715 17.5228 2 12 2C6.47715 2 2 6.47715 2 12C2 17.5228 6.47715 22 12 22Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M8 14C8 14 9.5 16 12 16C14.5 16 16 14 16 14" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
              <h1 className="ml-2.5 text-lg font-bold text-white tracking-tight">Freelancer Workspace</h1>
            </div>
            <div className="flex items-center space-x-4">
              <button
                onClick={handleProfileUpdate}
                className="px-4 py-2 border border-slate-700 bg-slate-800 hover:bg-slate-700 text-slate-100 text-xs font-semibold rounded-xl transition-all"
              >
                {isProfileComplete ? 'Edit Skill Profile' : 'Complete Setup'}
              </button>
              <span className="text-xs text-slate-400 hidden sm:inline">Welcome, <strong className="text-slate-200">{userData.email}</strong></span>
              <button
                onClick={handleLogout}
                className="px-3 py-2 bg-red-950/20 border border-red-900/30 text-red-400 hover:bg-red-950/40 text-xs font-semibold rounded-xl transition-all"
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="space-y-8">
          
          {/* Profile Status Alert */}
          <div className="bg-slate-900/50 backdrop-blur-md border border-slate-800 rounded-2xl p-6 transition-all duration-300">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div className="space-y-1">
                <h2 className="text-lg font-bold text-slate-200">Skills Profile Readiness</h2>
                <p className="text-sm text-slate-400">
                  {isProfileComplete 
                    ? 'Your skills inventory is complete. Project owners can evaluate you for open pod roles.'
                    : 'Add your experiences, technologies, and rate metrics to show up in candidate matching.'}
                </p>
              </div>
              <span className={`inline-flex items-center px-3.5 py-1 rounded-full text-xs font-semibold border ${
                isProfileComplete 
                  ? 'bg-emerald-500/10 text-emerald-450 border-emerald-500/20'
                  : 'bg-yellow-500/10 text-yellow-450 border-yellow-500/20'
              }`}>
                {isProfileComplete ? 'Fully Setup' : 'Pending Detail'}
              </span>
            </div>
          </div>

          {/* Metric Grid */}
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {/* Active Projects Card */}
            <div className="bg-slate-900/50 backdrop-blur-md border border-slate-800 rounded-2xl p-6 flex items-center justify-between hover:border-slate-700/60 transition-all duration-200">
              <div className="flex items-center space-x-4">
                <div className="p-3 bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 rounded-xl">
                  <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                  </svg>
                </div>
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">Active Pods</p>
                  <p className="text-2xl font-extrabold text-white mt-0.5">{myProjects.length}</p>
                </div>
              </div>
              <a href="#my-projects" className="text-xs text-indigo-400 hover:text-indigo-300 font-semibold">&rarr; View</a>
            </div>

            {/* Earnings Card */}
            <div className="bg-slate-900/50 backdrop-blur-md border border-slate-800 rounded-2xl p-6 flex items-center justify-between hover:border-slate-700/60 transition-all duration-200">
              <div className="flex items-center space-x-4">
                <div className="p-3 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 rounded-xl">
                  <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">Earnings</p>
                  <p className="text-2xl font-extrabold text-white mt-0.5">$0.00</p>
                </div>
              </div>
              <span className="text-[10px] bg-slate-800 text-slate-400 px-2 py-0.5 rounded border border-slate-750">SWEAT EQ</span>
            </div>

            {/* Available Jobs Card */}
            <div className="bg-slate-900/50 backdrop-blur-md border border-slate-800 rounded-2xl p-6 flex items-center justify-between hover:border-slate-700/60 transition-all duration-200">
              <div className="flex items-center space-x-4">
                <div className="p-3 bg-purple-500/10 text-purple-400 border border-purple-500/20 rounded-xl">
                  <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                </div>
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">Open Opportunities</p>
                  <p className="text-2xl font-extrabold text-white mt-0.5">{availableProjects.length}</p>
                </div>
              </div>
              <a href="#available-jobs" className="text-xs text-purple-400 hover:text-purple-300 font-semibold">&rarr; Browse</a>
            </div>
          </div>

          {/* Available Jobs Section */}
          <div id="available-jobs" className="space-y-4 pt-6 border-t border-slate-900">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-bold text-slate-200 flex items-center">
                <span className="w-2.5 h-2.5 rounded-full bg-indigo-500 mr-2"></span>
                Open Collaborative Pods
              </h2>
              <button
                onClick={fetchAvailableProjects}
                className="text-xs font-bold text-indigo-400 hover:text-indigo-350 bg-indigo-500/5 hover:bg-indigo-500/10 border border-indigo-500/20 px-3 py-1.5 rounded-xl transition-all"
              >
                Refresh Board
              </button>
            </div>
            
            {loadingProjects ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                <div className="h-48 rounded-2xl bg-slate-900/40 border border-slate-800/80 animate-pulse animate-shimmer"></div>
                <div className="h-48 rounded-2xl bg-slate-900/40 border border-slate-800/80 animate-pulse animate-shimmer"></div>
                <div className="h-48 rounded-2xl bg-slate-900/40 border border-slate-800/80 animate-pulse animate-shimmer"></div>
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
              <div className="text-center py-12 bg-slate-900/20 rounded-2xl border border-slate-800 border-dashed text-slate-400">
                <svg className="mx-auto h-12 w-12 text-slate-600 mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <h3 className="text-sm font-semibold text-slate-300">No project listings found</h3>
                <p className="mt-1 text-xs text-slate-500">There are no active opportunities listed currently.</p>
              </div>
            )}
          </div>

          {/* My Projects Section */}
          <div id="my-projects" className="space-y-4 pt-6 border-t border-slate-900">
            <h2 className="text-xl font-bold text-slate-200 flex items-center">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 mr-2"></span>
              Active Workspaces
            </h2>
            {myProjects.length === 0 ? (
              <div className="bg-slate-900/25 border border-slate-800 border-dashed rounded-2xl p-8 text-center text-slate-500 text-sm">
                You have not joined any startup workspaces yet. Apply to open pods above.
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {myProjects.map((project) => (
                  <div key={project.id} className="bg-slate-900/60 backdrop-blur-md border border-slate-800 rounded-2xl p-6 flex flex-col justify-between hover:border-slate-700/80 transition-all duration-300">
                    <div className="space-y-3">
                      <h3 className="text-lg font-bold text-slate-100">{project.title}</h3>
                      <p className="text-slate-400 text-sm line-clamp-3 leading-relaxed">{project.description}</p>
                    </div>
                    <Link
                      to={`/team-community/${project.id}`}
                      className="mt-6 w-full text-center bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white font-semibold py-2.5 px-4 rounded-xl shadow-md transition-all duration-200 text-sm hover:scale-[1.01]"
                    >
                      Enter Pod Community
                    </Link>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Skills and Availability */}
          <div className="space-y-4 pt-6 border-t border-slate-900">
            <h2 className="text-xl font-bold text-slate-200 flex items-center">
              <span className="w-2.5 h-2.5 rounded-full bg-purple-500 mr-2"></span>
              Skills & Preferences
            </h2>
            <div className="bg-slate-900/50 backdrop-blur-md border border-slate-800 rounded-2xl p-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="space-y-2">
                  <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-500">My Expertise</h3>
                  <p className="text-sm text-slate-200">
                    {userData.profile?.skills?.length > 0 
                      ? userData.profile.skills.join(', ')
                      : 'Not configured'}
                  </p>
                  <button 
                    onClick={handleProfileUpdate}
                    className="text-xs text-indigo-400 hover:text-indigo-300 font-semibold"
                  >
                    Edit Expertise &rarr;
                  </button>
                </div>
                <div className="space-y-2">
                  <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-500">Availability</h3>
                  <p className="text-sm text-slate-350">Flexible hours (Staking / Equity focus)</p>
                  <button className="text-xs text-indigo-400 hover:text-indigo-300 font-semibold">Change Metrics &rarr;</button>
                </div>
                <div className="space-y-2">
                  <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-500">Base Hourly Valuation</h3>
                  <p className="text-sm text-slate-355">Pending valuation setup</p>
                  <button className="text-xs text-indigo-400 hover:text-indigo-300 font-semibold">Set Valuation &rarr;</button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>

      {showProfileSetup && (
        <ProfileSetup 
          onClose={() => {
            setShowProfileSetup(false);
            // Refresh user data to update profile completion status
            const user = auth.currentUser;
            if (user) {
              getDoc(doc(db, 'users', user.uid)).then(docSnapshot => {
                if (docSnapshot.exists()) {
                  const data = docSnapshot.data();
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