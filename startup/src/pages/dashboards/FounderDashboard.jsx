import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { auth, db } from '../../firebase/config';
import { getFirestore, doc, getDoc, collection, query, where, getDocs, onSnapshot, updateDoc, serverTimestamp } from 'firebase/firestore';
import React from 'react';
import LoadingSkeleton from '../../components/LoadingSkeleton';

const FounderDashboard = ({ initialUserData }) => {
  const [userData, setUserData] = useState(initialUserData || null);
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [investmentProjects, setInvestmentProjects] = useState([]);
  const [showInvestmentProjects, setShowInvestmentProjects] = useState(false);
  const [projectOffersSummary, setProjectOffersSummary] = useState({}); // Stores summary: { projectId: { interestedCount: N, offersMadeCount: M } }
  const [investorContributions, setInvestorContributions] = useState({}); // New state for investor contributions per project
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [editProjectId, setEditProjectId] = useState(null);
  const [editFormData, setEditFormData] = useState({
    title: '',
    reason: '',
    forSale: false,
    salePrice: '',
    forInvestment: false,
    investmentAmount: '',
    upiId: '',
    bankDetails: '',
  });
  const [editLoading, setEditLoading] = useState(false);
  const [editError, setEditError] = useState('');
  const [projectOffers, setProjectOffers] = useState({}); // { projectId: [offers] }
  const [counterOfferModal, setCounterOfferModal] = useState({ open: false, offer: null, amount: '', equity: '' });

  const navigate = useNavigate();
  const db = getFirestore();

  useEffect(() => {
    const checkAuth = async () => {
      const user = auth.currentUser;
      if (!user) {
        navigate('/login');
        return;
      }

      try {
        let currentUserData = userData;
        if (!currentUserData) {
          const userDoc = await getDoc(doc(db, 'users', user.uid));
          if (!userDoc.exists() || userDoc.data().role !== 'founder') {
            navigate('/dashboard');
            return;
          }
          currentUserData = userDoc.data();
          setUserData(currentUserData);
        }

        // Fetch all projects owned by the founder
        const projectsQuery = query(
          collection(db, 'projects'),
          where('founder', '==', user.uid)
        );
        
        const projectsSnapshot = await getDocs(projectsQuery);
        const projectsList = projectsSnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        
        setProjects(projectsList);

        // Fetch completed offers for founder's projects in parallel
        const completedOffersQuery = query(
          collection(db, 'projectOffers'),
          where('founderId', '==', user.uid),
          where('status', '==', 'completed')
        );
        const completedOffersSnapshot = await getDocs(completedOffersQuery);
        const contributions = {};

        const offerPromises = completedOffersSnapshot.docs.map(async (docSnapshot) => {
          const offer = { id: docSnapshot.id, ...docSnapshot.data() };
          const investorDoc = await getDoc(doc(db, 'users', offer.investorId));
          const investorName = investorDoc.exists() ? (investorDoc.data().name || investorDoc.data().email) : 'Unknown Investor';
          
          return {
            projectId: offer.projectId,
            investorId: offer.investorId,
            investorName,
            investmentAmount: offer.investmentAmount,
            equityPercentage: offer.equityPercentage,
            paidAt: offer.paidAt ? offer.paidAt.toDate() : null
          };
        });

        const resolvedOffers = await Promise.all(offerPromises);
        resolvedOffers.forEach(item => {
          if (!contributions[item.projectId]) {
            contributions[item.projectId] = [];
          }
          contributions[item.projectId].push(item);
        });
        
        setInvestorContributions(contributions);

        // Fetch projects needing investment specifically
        const investmentProjectsQuery = query(
          collection(db, 'projects'),
          where('founder', '==', user.uid),
          where('needsInvestment', '==', true)
        );
        const investmentProjectsSnapshot = await getDocs(investmentProjectsQuery);
        const investmentProjectsList = investmentProjectsSnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        setInvestmentProjects(investmentProjectsList);

      } catch (error) {
        console.error('Error fetching data:', error);
        setError('Failed to load dashboard data');
      } finally {
        setLoading(false);
      }
    };

    checkAuth();
  }, [navigate]);

  // New useEffect to listen for incoming project offers
  useEffect(() => {
    if (!auth.currentUser) return;

    const offersQuery = query(
      collection(db, 'projectOffers'),
      where('founderId', '==', auth.currentUser.uid),
      where('status', '==', 'interestExpressed')
    );

    const unsubscribe = onSnapshot(offersQuery, async (snapshot) => {
      const newProjectOffersSummary = {};
      for (const docSnapshot of snapshot.docs) {
        const offerData = { id: docSnapshot.id, ...docSnapshot.data() };
        if (!newProjectOffersSummary[offerData.projectId]) {
          newProjectOffersSummary[offerData.projectId] = { interestedCount: 0, offersMadeCount: 0 };
        }

        if (offerData.status === 'interestExpressed') {
          newProjectOffersSummary[offerData.projectId].interestedCount++;
        } else if (offerData.status === 'offerMade') {
          newProjectOffersSummary[offerData.projectId].offersMadeCount++;
        }
      }
      setProjectOffersSummary(newProjectOffersSummary);
    }, (error) => {
      console.error("Error fetching incoming offers:", error);
    });

    return () => unsubscribe(); // Cleanup listener on component unmount
  }, [db]);

  // Accept offer
  const handleAcceptOffer = async (offer) => {
    await updateDoc(doc(db, 'projectOffers', offer.id), {
      status: 'offerMade',
      offerHistory: [...(offer.offerHistory || []), {
        status: 'offerMade',
        timestamp: new Date(),
        by: auth.currentUser.uid,
        byRole: 'founder',
      }],
    });
  };

  // Open counter offer modal
  const handleCounterOffer = (offer) => {
    setCounterOfferModal({ open: true, offer, amount: offer.investmentAmount || '', equity: offer.equityPercentage || '' });
  };

  // Submit counter offer
  const handleSubmitCounterOffer = async (e) => {
    e.preventDefault();
    const { offer, amount, equity } = counterOfferModal;
    await updateDoc(doc(db, 'projectOffers', offer.id), {
      status: 'offerMade',
      investmentAmount: Number(amount),
      equityPercentage: Number(equity),
      offerHistory: [...(offer.offerHistory || []), {
        status: 'counterOffered',
        timestamp: new Date(),
        by: auth.currentUser.uid,
        byRole: 'founder',
        amount: Number(amount),
        equity: Number(equity),
      }],
    });
    setCounterOfferModal({ open: false, offer: null, amount: '', equity: '' });
  };

  const handleLogout = async () => {
    try {
      await auth.signOut();
      navigate('/login');
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  // Open edit modal and populate form
  const handleEditClick = (project) => {
    setEditProjectId(project.id);
    setEditFormData({
      title: project.title || '',
      reason: project.reason || '',
      forSale: project.forSale || false,
      salePrice: project.salePrice || '',
      forInvestment: project.forInvestment || false,
      investmentAmount: project.investmentAmount || '',
      upiId: project.upiId || '',
      bankDetails: project.bankDetails || '',
    });
    setEditModalOpen(true);
    setEditError('');
  };

  // Handle form changes
  const handleEditFormChange = (e) => {
    const { name, value, type, checked } = e.target;
    setEditFormData((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
    // If forSale/forInvestment is unchecked, clear the price/amount
    if (name === 'forSale' && !checked) {
      setEditFormData((prev) => ({ ...prev, salePrice: '' }));
    }
    if (name === 'forInvestment' && !checked) {
      setEditFormData((prev) => ({ ...prev, investmentAmount: '' }));
    }
  };

  // Save changes to Firestore
  const handleEditSave = async (e) => {
    e.preventDefault();
    setEditLoading(true);
    setEditError('');
    try {
      const updateData = {
        title: editFormData.title,
        reason: editFormData.reason,
        forSale: editFormData.forSale,
        salePrice: editFormData.forSale ? Number(editFormData.salePrice) : '',
        forInvestment: editFormData.forInvestment,
        investmentAmount: editFormData.forInvestment ? Number(editFormData.investmentAmount) : '',
        upiId: editFormData.upiId,
        bankDetails: editFormData.bankDetails,
        updatedAt: new Date().toISOString(),
      };
      await updateDoc(doc(db, 'projects', editProjectId), updateData);
      setProjects((prev) =>
        prev.map((proj) =>
          proj.id === editProjectId ? { ...proj, ...updateData } : proj
        )
      );
      setEditModalOpen(false);
    } catch (error) {
      setEditError('Failed to update project.');
      console.error(error);
    } finally {
      setEditLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 p-8 flex justify-center items-center">
        <div className="w-full max-w-7xl">
          <LoadingSkeleton type="dashboard" />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <div className="bg-red-500/10 border border-red-500/20 text-red-400 p-6 rounded-2xl max-w-md text-center shadow-lg">
          <svg className="w-12 h-12 text-red-500 mx-auto mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
          </svg>
          <p className="font-semibold">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans">
      {/* Sidebar */}
      <div className="fixed inset-y-0 left-0 w-64 bg-slate-900/80 backdrop-blur-md border-r border-slate-800 shadow-2xl flex flex-col justify-between">
        <div>
          <div className="flex items-center justify-center h-20 px-6 bg-gradient-to-r from-indigo-600 to-purple-600 shadow-md">
            <svg className="h-8 w-8 text-white mr-2" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M12 22C17.5228 22 22 17.5228 22 12C22 6.47715 17.5228 2 12 2C6.47715 2 2 6.47715 2 12C2 17.5228 6.47715 22 12 22Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M8 14C8 14 9.5 16 12 16C14.5 16 16 14 16 14" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M15 9H15.01" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M9 9H9.01" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            <h1 className="text-2xl font-black tracking-wider text-white">FoundryHub</h1>
          </div>
          
          <nav className="flex-1 px-4 py-6 space-y-2">
            <Link
              to="/dashboard"
              className="flex items-center px-4 py-3 text-indigo-400 bg-indigo-500/10 border border-indigo-500/20 rounded-xl transition-all duration-200"
            >
              <svg className="w-5 h-5 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
              </svg>
              <span className="font-semibold text-sm">Dashboard</span>
            </Link>
            
            <Link
              to="/create-project"
              className="flex items-center px-4 py-3 text-slate-400 hover:text-slate-200 hover:bg-slate-800/50 border border-transparent hover:border-slate-800 rounded-xl transition-all duration-200"
            >
              <svg className="w-5 h-5 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
              </svg>
              <span className="font-medium text-sm">Create Project</span>
            </Link>
            
            <Link
              to="/team"
              className="flex items-center px-4 py-3 text-slate-400 hover:text-slate-200 hover:bg-slate-800/50 border border-transparent hover:border-slate-800 rounded-xl transition-all duration-200"
            >
              <svg className="w-5 h-5 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
              <span className="font-medium text-sm">Team Community</span>
            </Link>
            
            <Link
              to="/investors"
              className="flex items-center px-4 py-3 text-slate-400 hover:text-slate-200 hover:bg-slate-800/50 border border-transparent hover:border-slate-800 rounded-xl transition-all duration-200"
            >
              <svg className="w-5 h-5 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span className="font-medium text-sm">Find Investors</span>
            </Link>

             {investmentProjects.length > 0 && (
              <button
                onClick={() => setShowInvestmentProjects(!showInvestmentProjects)}
                className="flex items-center px-4 py-3 text-slate-400 hover:text-slate-200 hover:bg-slate-800/50 border border-transparent hover:border-slate-800 rounded-xl w-full text-left transition-all duration-200"
              >
                <svg className="w-5 h-5 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z"></path>
                </svg>
                <span className="font-medium text-sm">Investments ({investmentProjects.length})</span>
              </button>
            )}
          </nav>
        </div>

        <div className="p-4 border-t border-slate-800 bg-slate-955">
          <div className="flex items-center">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white font-bold text-lg shadow-md">
              {userData?.email?.[0]?.toUpperCase()}
            </div>
            <div className="ml-3 overflow-hidden">
              <p className="text-xs font-semibold text-slate-200 truncate">{userData?.email}</p>
              <button
                onClick={handleLogout}
                className="text-xs text-indigo-400 hover:text-indigo-300 font-medium"
              >
                Sign out
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="pl-64">
        <main className="p-8 max-w-7xl mx-auto space-y-8">
          <div className="bg-slate-900/40 border border-slate-800 p-8 rounded-3xl relative overflow-hidden shadow-2xl">
            <div className="absolute top-0 right-0 w-96 h-96 bg-indigo-600/10 rounded-full blur-3xl -z-10"></div>
            <div className="absolute bottom-0 left-0 w-96 h-96 bg-purple-600/5 rounded-full blur-3xl -z-10"></div>
            <h2 className="text-3xl font-extrabold bg-gradient-to-r from-slate-100 to-slate-300 bg-clip-text text-transparent">
              Welcome back, {userData?.email?.split('@')[0]}
            </h2>
            <p className="mt-2 text-slate-400 text-sm">
              Here is what is happening with your collaborative project pods today.
            </p>
          </div>

          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {/* Active Projects Card */}
            <div className="bg-slate-900/60 backdrop-blur-md border border-slate-800/80 rounded-2xl p-6 shadow-xl hover:shadow-2xl transition-all duration-300 flex flex-col justify-between">
              <div className="flex items-center space-x-4 mb-4">
                <div className="w-12 h-12 bg-gradient-to-br from-indigo-500/10 to-indigo-600/20 border border-indigo-500/20 rounded-xl flex items-center justify-center text-indigo-400">
                  <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                  </svg>
                </div>
                <div>
                  <dt className="text-sm font-semibold text-slate-400">Active Projects</dt>
                  <dd className="text-2xl font-bold text-slate-100">{projects.length}</dd>
                </div>
              </div>
              <div className="pt-4 border-t border-slate-800">
                <Link to="/create-project" className="text-sm font-medium text-indigo-400 hover:text-indigo-300">
                  Create New Project &rarr;
                </Link>
              </div>
            </div>

            {/* Team Members Card */}
            <div className="bg-slate-900/60 backdrop-blur-md border border-slate-800/80 rounded-2xl p-6 shadow-xl hover:shadow-2xl transition-all duration-300 flex flex-col justify-between">
              <div className="flex items-center space-x-4 mb-4">
                <div className="w-12 h-12 bg-gradient-to-br from-purple-500/10 to-purple-600/20 border border-purple-500/20 rounded-xl flex items-center justify-center text-purple-400">
                  <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                  </svg>
                </div>
                <div>
                  <dt className="text-sm font-semibold text-slate-400">Team Members</dt>
                  <dd className="text-2xl font-bold text-slate-100">0</dd>
                </div>
              </div>
              <div className="pt-4 border-t border-slate-800">
                <Link to="/team" className="text-sm font-medium text-purple-400 hover:text-purple-300">
                  Manage Team Members &rarr;
                </Link>
              </div>
            </div>

            {/* Investors Card */}
            <div className="bg-slate-900/60 backdrop-blur-md border border-slate-800/80 rounded-2xl p-6 shadow-xl hover:shadow-2xl transition-all duration-300 flex flex-col justify-between">
              <div className="flex items-center space-x-4 mb-4">
                <div className="w-12 h-12 bg-gradient-to-br from-emerald-500/10 to-emerald-600/20 border border-emerald-500/20 rounded-xl flex items-center justify-center text-emerald-400">
                  <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <div>
                  <dt className="text-sm font-semibold text-slate-400">Under Investment</dt>
                  <dd className="text-2xl font-bold text-slate-100">{investmentProjects.length}</dd>
                </div>
              </div>
              <div className="pt-4 border-t border-slate-800">
                <button
                  onClick={() => setShowInvestmentProjects(!showInvestmentProjects)}
                  className="text-sm font-medium text-emerald-400 hover:text-emerald-300 text-left"
                >
                  {showInvestmentProjects ? 'Hide Investment View' : 'View Projects for Investment'} &rarr;
                </button>
              </div>
            </div>
          </div>

          {/* Conditional Rendering for Investment Projects List */}
          {showInvestmentProjects && (
            <div className="space-y-6 pt-4 border-t border-slate-800 animate-fadeIn">
              <h2 className="text-2xl font-bold text-slate-200 flex items-center">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 mr-2"></span>
                My Projects Seeking Investment
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {investmentProjects.length > 0 ? (
                  investmentProjects.map((project) => (
                    <div key={project.id} className="bg-slate-900/60 border border-slate-800 rounded-2xl p-6 shadow-lg flex flex-col justify-between">
                      <div className="space-y-4">
                        <div>
                          <h3 className="text-lg font-bold text-slate-100">{project.title}</h3>
                          <p className="text-xs text-slate-500 mt-1">Goal: ${project.fundingGoal?.toLocaleString()}</p>
                        </div>
                        <p className="text-sm text-slate-400 line-clamp-3">{project.investmentReason}</p>
                        
                        {/* Funding Progress Bar */}
                        <div className="space-y-2">
                          <div className="flex justify-between text-xs text-slate-400">
                            <span>Raised: ${project.amountRaised || 0}</span>
                            <span>{Math.round(((project.amountRaised || 0) / project.fundingGoal) * 100 || 0)}%</span>
                          </div>
                          <div className="w-full bg-slate-850 rounded-full h-2">
                            <div
                              className="bg-gradient-to-r from-emerald-500 to-teal-500 h-2 rounded-full"
                              style={{ width: `${Math.min(((project.amountRaised || 0) / project.fundingGoal) * 100 || 0, 100)}%` }}
                            ></div>
                          </div>
                        </div>
                      </div>

                      {/* Active Offers */}
                      {projectOffers[project.id] && projectOffers[project.id].length > 0 && (
                        <div className="mt-4 pt-4 border-t border-slate-800 space-y-2">
                          <h4 className="text-xs font-semibold text-indigo-400 uppercase tracking-wider">Investor Offers:</h4>
                          {projectOffers[project.id].map((offer) => (
                            <div key={offer.id} className="p-3 bg-slate-950/50 border border-slate-850 rounded-xl space-y-2">
                              <p className="text-xs text-slate-300">
                                <strong>{offer.investorName}</strong> offered ${offer.investmentAmount} for {offer.equityPercentage}% equity.
                              </p>
                              {offer.status === 'interestExpressed' && (
                                <div className="flex gap-2">
                                  <button onClick={() => handleAcceptOffer(offer)} className="px-2.5 py-1 bg-emerald-600 text-white rounded-lg text-[10px] font-semibold hover:bg-emerald-700">Accept</button>
                                  <button onClick={() => handleCounterOffer(offer)} className="px-2.5 py-1 bg-yellow-500/20 text-yellow-400 border border-yellow-500/30 rounded-lg text-[10px] font-semibold hover:bg-yellow-500/30">Counter</button>
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      )}

                      {/* Investor Contributions */}
                      {investorContributions[project.id] && investorContributions[project.id].length > 0 && (
                        <div className="mt-4 pt-4 border-t border-slate-800 space-y-2">
                          <h4 className="text-xs font-semibold text-emerald-400 uppercase tracking-wider">Cap Table Details:</h4>
                          {investorContributions[project.id].map((contribution, index) => (
                            <div key={index} className="p-3 bg-slate-950/30 border border-slate-850/50 rounded-xl flex items-center justify-between">
                              <div>
                                <p className="text-xs font-semibold text-slate-200">{contribution.investorName}</p>
                                <p className="text-[10px] text-slate-500">Invested: ${contribution.investmentAmount}</p>
                              </div>
                              <span className="text-xs bg-emerald-500/10 text-emerald-400 px-2 py-0.5 rounded-full border border-emerald-500/20 font-medium">
                                {contribution.equityPercentage}%
                              </span>
                            </div>
                          ))}
                        </div>
                      )}

                      <div className="mt-6 flex justify-between items-center">
                        <Link
                          to={`/project/${project.id}`}
                          className="px-4 py-2 bg-gradient-to-r from-indigo-500 to-purple-600 text-white rounded-xl hover:from-indigo-600 hover:to-purple-700 text-xs font-medium shadow-md"
                        >
                          View Pod details
                        </Link>
                        <span className="text-xs text-slate-500">
                          {projectOffersSummary[project.id]?.interestedCount || 0} Interests | {projectOffersSummary[project.id]?.offersMadeCount || 0} Offers
                        </span>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="col-span-full py-8 text-center text-slate-500 bg-slate-900/30 rounded-2xl border border-slate-800 border-dashed">
                    No active projects listed for investment. Update them in details below.
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Recent Projects */}
          <div className="space-y-6 pt-4 border-t border-slate-800">
            <h2 className="text-2xl font-bold text-slate-200 flex items-center">
              <span className="w-2.5 h-2.5 rounded-full bg-indigo-500 mr-2"></span>
              Collaborative Project Pods
            </h2>
            {projects.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {projects.map((project) => (
                  <div key={project.id} className="bg-slate-900/60 border border-slate-800 rounded-2xl p-6 shadow-lg flex flex-col justify-between hover:border-slate-700/80 transition-all duration-200">
                    <div className="space-y-3">
                      <h3 className="text-lg font-bold text-slate-100">{project.title}</h3>
                      <p className="text-sm text-slate-400 line-clamp-3">{project.reason}</p>
                    </div>
                    <div className="mt-6 space-y-2">
                      <button
                        onClick={() => navigate(`/project/${project.id}`, { state: { fromFounderDashboard: true } })}
                        className="w-full px-4 py-2.5 bg-gradient-to-r from-indigo-500 to-purple-600 text-white text-xs font-semibold rounded-xl hover:from-indigo-600 hover:to-purple-700 transition-all duration-200 shadow-md"
                      >
                        Enter Workspace Pod
                      </button>
                      <button
                        onClick={() => handleEditClick(project)}
                        className="w-full px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold rounded-xl transition-all duration-200"
                      >
                        Edit Configuration
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="py-16 text-center text-slate-500 bg-slate-900/30 rounded-2xl border border-slate-800 border-dashed">
                <p className="mb-4">No workspace pods created yet. Launch your project today!</p>
                <Link to="/create-project" className="px-5 py-2.5 bg-gradient-to-r from-indigo-500 to-purple-600 text-white rounded-xl text-sm font-semibold hover:from-indigo-600 hover:to-purple-700 shadow-lg">
                  Create First Pod
                </Link>
              </div>
            )}
          </div>
        </main>
      </div>

      {/* Edit Project Modal */}
      {editModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-fadeIn">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl p-8 w-full max-w-md relative text-slate-100">
            <button
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-200 transition-colors"
              onClick={() => setEditModalOpen(false)}
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
            <h2 className="text-xl font-bold text-slate-100 mb-6">Edit Pod Configuration</h2>
            {editError && <div className="mb-4 p-3 bg-red-500/10 border border-red-500/20 text-red-400 rounded-xl text-xs font-medium">{editError}</div>}
            
            <form onSubmit={handleEditSave} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">Title</label>
                <input
                  type="text"
                  name="title"
                  value={editFormData.title}
                  onChange={handleEditFormChange}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-sm text-slate-100"
                  required
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">Reason/Vision</label>
                <input
                  type="text"
                  name="reason"
                  value={editFormData.reason}
                  onChange={handleEditFormChange}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-sm text-slate-100"
                  required
                />
              </div>
              
              <div className="flex items-center space-x-2 py-2">
                <input
                  type="checkbox"
                  name="forSale"
                  id="forSale"
                  checked={editFormData.forSale}
                  onChange={handleEditFormChange}
                  className="h-4 w-4 bg-slate-950 border-slate-800 rounded text-indigo-600 focus:ring-indigo-500 focus:ring-offset-slate-900"
                />
                <label htmlFor="forSale" className="text-sm text-slate-300 font-medium">List this Pod for sale (Exit)</label>
              </div>

              {editFormData.forSale && (
                <div className="animate-slideDown">
                  <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">Asking Price (USD)</label>
                  <input
                    type="number"
                    name="salePrice"
                    value={editFormData.salePrice}
                    onChange={handleEditFormChange}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-sm text-slate-100"
                    min="0"
                    required
                  />
                </div>
              )}

              <div className="flex items-center space-x-2 py-2">
                <input
                  type="checkbox"
                  name="forInvestment"
                  id="forInvestment"
                  checked={editFormData.forInvestment}
                  onChange={handleEditFormChange}
                  className="h-4 w-4 bg-slate-950 border-slate-800 rounded text-indigo-600 focus:ring-indigo-500 focus:ring-offset-slate-900"
                />
                <label htmlFor="forInvestment" className="text-sm text-slate-300 font-medium">Open Pod for Venture Capital Investment</label>
              </div>

              {editFormData.forInvestment && (
                <div className="space-y-4 animate-slideDown">
                  <div>
                    <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">Capital Needed (USD)</label>
                    <input
                      type="number"
                      name="investmentAmount"
                      value={editFormData.investmentAmount}
                      onChange={handleEditFormChange}
                      className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-sm text-slate-100"
                      min="0"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">Founder's UPI ID</label>
                    <input
                      type="text"
                      name="upiId"
                      value={editFormData.upiId}
                      onChange={handleEditFormChange}
                      className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-sm text-slate-100"
                      placeholder="e.g. name@bank"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">Founder's Bank Details</label>
                    <textarea
                      name="bankDetails"
                      value={editFormData.bankDetails}
                      onChange={handleEditFormChange}
                      className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-sm text-slate-100"
                      rows={2}
                      placeholder="Account Number, IFSC, Account Name"
                    />
                  </div>
                </div>
              )}

              <div className="flex justify-end space-x-3 pt-4">
                <button
                  type="button"
                  onClick={() => setEditModalOpen(false)}
                  className="px-4 py-2 border border-slate-800 text-slate-400 text-sm font-semibold rounded-xl hover:bg-slate-850"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={editLoading}
                  className="px-5 py-2 bg-gradient-to-r from-indigo-500 to-purple-600 text-white text-sm font-semibold rounded-xl hover:from-indigo-600 hover:to-purple-700 disabled:opacity-50"
                >
                  {editLoading ? 'Saving...' : 'Save Configurations'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Counter Offer Modal */}
      {counterOfferModal.open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-fadeIn">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl p-8 w-full max-w-md relative text-slate-100 font-sans">
            <button
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-200 transition-colors"
              onClick={() => setCounterOfferModal({ open: false, offer: null, amount: '', equity: '' })}
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
            <h2 className="text-xl font-bold text-slate-100 mb-6">Counter Offer negotiation</h2>
            
            <form onSubmit={handleSubmitCounterOffer} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">Proposed Capital Amount (USD)</label>
                <input
                  type="number"
                  value={counterOfferModal.amount}
                  onChange={e => setCounterOfferModal(modal => ({ ...modal, amount: e.target.value }))}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-sm text-slate-100"
                  min="0"
                  required
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">Proposed Equity Share (%)</label>
                <input
                  type="number"
                  value={counterOfferModal.equity}
                  onChange={e => setCounterOfferModal(modal => ({ ...modal, equity: e.target.value }))}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-sm text-slate-100"
                  min="0"
                  max="100"
                  required
                />
              </div>
              <div className="flex justify-end space-x-3 pt-4">
                <button
                  type="button"
                  onClick={() => setCounterOfferModal({ open: false, offer: null, amount: '', equity: '' })}
                  className="px-4 py-2 border border-slate-800 text-slate-400 text-sm font-semibold rounded-xl hover:bg-slate-850"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-gradient-to-r from-indigo-500 to-purple-600 text-white text-sm font-semibold rounded-xl hover:from-indigo-600 hover:to-purple-700"
                >
                  Send Counter Offer
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default FounderDashboard; 