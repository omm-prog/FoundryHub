import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { auth } from '../../firebase/config';
import { getFirestore, doc, getDoc, collection, query, where, getDocs } from 'firebase/firestore';
import LoadingSkeleton from '../../components/LoadingSkeleton';

const BuyerDashboard = ({ initialUserData }) => {
  const [userData, setUserData] = useState(initialUserData || null);
  const [loading, setLoading] = useState(!initialUserData);
  const navigate = useNavigate();
  const db = getFirestore();
  const [forSaleProjects, setForSaleProjects] = useState([]);
  const [loadingProjects, setLoadingProjects] = useState(true);

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
            if (data.role !== 'buyer') {
              navigate('/dashboard');
              return;
            }
            setUserData(data);
          }
        }
      } catch (error) {
        console.error('Error fetching user data:', error);
      } finally {
        setLoading(false);
      }
    };

    checkAuth();

    // Fetch projects for sale
    const fetchForSaleProjects = async () => {
      try {
        setLoadingProjects(true);
        const projectsRef = collection(db, 'projects');
        const q = query(projectsRef, where('forSale', '==', true));
        const querySnapshot = await getDocs(q);
        
        // Fetch founder details in parallel
        const projectPromises = querySnapshot.docs.map(async (docSnapshot) => {
          const projectData = docSnapshot.data();
          let founderName = 'Anonymous Founder';
          if (projectData.founder) {
            const founderDoc = await getDoc(doc(db, 'users', projectData.founder));
            if (founderDoc.exists()) {
              founderName = founderDoc.data().name || founderDoc.data().email || 'Anonymous Founder';
            }
          }
          return {
            id: docSnapshot.id,
            ...projectData,
            founderName
          };
        });

        const projectsList = await Promise.all(projectPromises);
        setForSaleProjects(projectsList);
      } catch (error) {
        console.error('Error fetching for sale projects:', error);
      } finally {
        setLoadingProjects(false);
      }
    };
    fetchForSaleProjects();
  }, [navigate, db]);

  const handleLogout = async () => {
    try {
      await auth.signOut();
      navigate('/login');
    } catch (error) {
      console.error('Error signing out:', error);
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
    <div className="min-h-screen bg-[#030712] text-slate-100 font-sans relative overflow-hidden">
      {/* Background glowing effects */}
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
              <h1 className="ml-2.5 text-lg font-bold text-white tracking-tight">Acquirer Hub</h1>
            </div>
            <div className="flex items-center space-x-4">
              <span className="text-xs text-slate-400">Welcome, <strong className="text-slate-200">{userData.email}</strong></span>
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
          
          {/* Header Description */}
          <div className="bg-slate-900/50 backdrop-blur-md border border-slate-800 rounded-2xl p-6">
            <h2 className="text-lg font-bold text-slate-250">Ecosystem Acquisitions</h2>
            <p className="text-sm text-slate-400 mt-1">
              Browse fully completed MVPs, operational services, and tools ready for complete acquisition.
            </p>
          </div>

          {/* Metric Grid */}
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {/* Active Orders Card */}
            <div className="bg-slate-900/50 backdrop-blur-md border border-slate-800 rounded-2xl p-6 flex items-center justify-between hover:border-slate-700/60 transition-all duration-200">
              <div className="flex items-center space-x-4">
                <div className="p-3 bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 rounded-xl">
                  <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                  </svg>
                </div>
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">Active Deals</p>
                  <p className="text-2xl font-extrabold text-white mt-0.5">0</p>
                </div>
              </div>
              <a href="#" className="text-xs text-indigo-400 hover:text-indigo-300 font-semibold">&rarr; View</a>
            </div>

            {/* Saved Projects Card */}
            <div className="bg-slate-900/50 backdrop-blur-md border border-slate-800 rounded-2xl p-6 flex items-center justify-between hover:border-slate-700/60 transition-all duration-200">
              <div className="flex items-center space-x-4">
                <div className="p-3 bg-pink-500/10 text-pink-400 border border-pink-500/20 rounded-xl">
                  <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
                  </svg>
                </div>
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">Bookmarks</p>
                  <p className="text-2xl font-extrabold text-white mt-0.5">0</p>
                </div>
              </div>
              <a href="#" className="text-xs text-pink-400 hover:text-pink-300 font-semibold">&rarr; View</a>
            </div>

            {/* Available Projects Card */}
            <div className="bg-slate-900/50 backdrop-blur-md border border-slate-800 rounded-2xl p-6 flex items-center justify-between hover:border-slate-700/60 transition-all duration-200">
              <div className="flex items-center space-x-4">
                <div className="p-3 bg-purple-500/10 text-purple-400 border border-purple-500/20 rounded-xl">
                  <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                </div>
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">Available listings</p>
                  <p className="text-2xl font-extrabold text-white mt-0.5">{forSaleProjects.length}</p>
                </div>
              </div>
              <span className="text-[10px] bg-slate-800 text-slate-400 px-2 py-0.5 rounded border border-slate-750 font-semibold">BUYOUTS</span>
            </div>
          </div>

          {/* Projects For Sale Section */}
          <div className="space-y-4 pt-6 border-t border-slate-900">
            <h2 className="text-xl font-bold text-slate-200 flex items-center">
              <span className="w-2.5 h-2.5 rounded-full bg-indigo-500 mr-2"></span>
              Projects For Sale
            </h2>
            
            {loadingProjects ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                <div className="h-48 rounded-2xl bg-slate-900/40 border border-slate-800/80 animate-pulse animate-shimmer"></div>
                <div className="h-48 rounded-2xl bg-slate-900/40 border border-slate-800/80 animate-pulse animate-shimmer"></div>
              </div>
            ) : forSaleProjects.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {forSaleProjects.map(project => (
                  <div key={project.id} className="bg-slate-900/60 border border-slate-800 rounded-2xl p-6 shadow-lg flex flex-col justify-between hover:border-slate-700/80 transition-all duration-300">
                    <div className="space-y-3">
                      <div className="flex justify-between items-start">
                        <h3 className="text-lg font-bold text-slate-100 line-clamp-1" title={project.title}>{project.title}</h3>
                        <span className="text-xs bg-emerald-500/10 text-emerald-450 border border-emerald-500/20 px-2.5 py-0.5 rounded-full font-semibold">For Sale</span>
                      </div>
                      <p className="text-slate-400 text-sm line-clamp-2 leading-relaxed">{project.description}</p>
                      
                      <div className="pt-2 flex flex-col gap-1.5 text-xs">
                        <div className="flex justify-between">
                          <span className="text-slate-500">Founder:</span>
                          <span className="font-semibold text-slate-300">{project.founderName}</span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-slate-500">Sale Price:</span>
                          <span className="font-extrabold text-indigo-400 text-sm">${project.salePrice ? Number(project.salePrice).toLocaleString() : 'N/A'}</span>
                        </div>
                      </div>
                    </div>

                    <button
                      onClick={() => navigate(`/project/${project.id}`)}
                      className="mt-6 w-full text-center bg-slate-950/40 border border-slate-850 hover:border-slate-850 hover:bg-slate-900 text-slate-300 hover:text-white font-semibold py-2.5 px-4 rounded-xl transition-all duration-200 text-sm"
                    >
                      View Acquisition Details
                    </button>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-16 bg-slate-900/20 rounded-2xl border border-slate-800 border-dashed text-slate-500">
                <p>No project listings currently set up for sale.</p>
              </div>
            )}
          </div>

          {/* Preferences and Settings */}
          <div className="space-y-4 pt-6 border-t border-slate-900">
            <h2 className="text-xl font-bold text-slate-200 flex items-center">
              <span className="w-2.5 h-2.5 rounded-full bg-purple-500 mr-2"></span>
              Acquisition Preferences
            </h2>
            <div className="bg-slate-900/50 border border-slate-800 rounded-2xl p-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="space-y-2">
                  <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-500">Target Verticals</h3>
                  <p className="text-sm text-slate-350">None selected</p>
                  <button className="text-xs text-indigo-400 hover:text-indigo-300 font-semibold">Set Verticals &rarr;</button>
                </div>
                <div className="space-y-2">
                  <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-500">Acquisition Budget Range</h3>
                  <p className="text-sm text-slate-355">Not configured</p>
                  <button className="text-xs text-indigo-400 hover:text-indigo-300 font-semibold">Set Range &rarr;</button>
                </div>
                <div className="space-y-2">
                  <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-500">Real-time alerts</h3>
                  <p className="text-sm text-slate-355">Default system logs</p>
                  <button className="text-xs text-indigo-400 hover:text-indigo-300 font-semibold">Configure &rarr;</button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default BuyerDashboard;