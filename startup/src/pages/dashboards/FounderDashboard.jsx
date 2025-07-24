import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { auth, db } from '../../firebase/config';
import { getFirestore, doc, getDoc, collection, query, where, getDocs, onSnapshot, updateDoc, serverTimestamp } from 'firebase/firestore';
import React from 'react';

const FounderDashboard = () => {
  const [userData, setUserData] = useState(null);
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
        const userDoc = await getDoc(doc(db, 'users', user.uid));
        if (!userDoc.exists() || userDoc.data().role !== 'founder') {
          navigate('/dashboard');
          return;
        }

        setUserData(userDoc.data());

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

        // Fetch completed offers for founder's projects
        const completedOffersQuery = query(
          collection(db, 'projectOffers'),
          where('founderId', '==', user.uid),
          where('status', '==', 'completed')
        );
        const completedOffersSnapshot = await getDocs(completedOffersQuery);
        const contributions = {};

        for (const docSnapshot of completedOffersSnapshot.docs) {
          const offer = { id: docSnapshot.id, ...docSnapshot.data() };
          if (!contributions[offer.projectId]) {
            contributions[offer.projectId] = [];
          }
          
          // Fetch investor name
          const investorDoc = await getDoc(doc(db, 'users', offer.investorId));
          const investorName = investorDoc.exists() ? (investorDoc.data().name || investorDoc.data().email) : 'Unknown Investor';

          contributions[offer.projectId].push({
            investorId: offer.investorId,
            investorName: investorName,
            investmentAmount: offer.investmentAmount,
            equityPercentage: offer.equityPercentage,
            paidAt: offer.paidAt ? offer.paidAt.toDate() : null,
          });
        }
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

  if (loading) return <div>Loading...</div>;
  if (error) return <div className="text-red-500">{error}</div>;

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Sidebar */}
      <div className="fixed inset-y-0 left-0 w-64 bg-white shadow-lg">
        <div className="flex flex-col h-full">
          <div className="flex items-center justify-center h-16 px-4 bg-indigo-600">
            <h1 className="text-xl font-bold text-white">ColabNest</h1>
          </div>
          
          <nav className="flex-1 px-4 py-4 space-y-1">
            <Link
              to="/dashboard"
              className="flex items-center px-4 py-2 text-gray-700 bg-gray-100 rounded-md"
            >
              <svg className="w-5 h-5 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
              </svg>
              Dashboard
            </Link>
            
            <Link
              to="/create-project"
              className="flex items-center px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-md"
            >
              <svg className="w-5 h-5 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
              </svg>
              Create Project
            </Link>
            
            <Link
              to="/team"
              className="flex items-center px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-md"
            >
              <svg className="w-5 h-5 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
              Team
            </Link>
            
            <Link
              to="/investors"
              className="flex items-center px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-md"
            >
              <svg className="w-5 h-5 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              Investors
            </Link>

             {/* New Projects Needing Investment Link */}
             {investmentProjects.length > 0 && (
              <button
                onClick={() => setShowInvestmentProjects(!showInvestmentProjects)}
                className="flex items-center px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-md w-full text-left"
              >
                <svg className="w-5 h-5 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z"></path>
                </svg>
                <span>Projects for Investment ({investmentProjects.length})</span>
              </button>
            )}

          </nav>

          <div className="p-4 border-t">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="w-8 h-8 rounded-full bg-indigo-600 flex items-center justify-center text-white">
                  {userData?.email?.[0]?.toUpperCase()}
                </div>
              </div>
              <div className="ml-3">
                <p className="text-sm font-medium text-gray-700">{userData?.email}</p>
                <button
                  onClick={handleLogout}
                  className="text-xs text-indigo-600 hover:text-indigo-500"
                >
                  Sign out
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="pl-64">
        <main className="p-8">
          <div className="mb-8">
            <h2 className="text-2xl font-bold text-gray-900">Welcome back, {userData?.email}</h2>
            <p className="mt-1 text-sm text-gray-500">Here's what's happening with your projects today.</p>
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
                      <dd className="text-lg font-medium text-gray-900">{projects.length}</dd>
                    </dl>
                  </div>
                </div>
              </div>
              <div className="bg-gray-50 px-5 py-3">
                <div className="text-sm">
                  <Link to="/create-project" className="font-medium text-indigo-600 hover:text-indigo-500">
                    Create New Project
                  </Link>
                </div>
              </div>
            </div>

            {/* Team Members Card */}
            <div className="bg-white overflow-hidden shadow rounded-lg">
              <div className="p-5">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <svg className="h-6 w-6 text-indigo-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                    </svg>
                  </div>
                  <div className="ml-5 w-0 flex-1">
                    <dl>
                      <dt className="text-sm font-medium text-gray-500 truncate">Team Members</dt>
                      <dd className="text-lg font-medium text-gray-900">0</dd>
                    </dl>
                  </div>
                </div>
              </div>
              <div className="bg-gray-50 px-5 py-3">
                <div className="text-sm">
                  <Link to="/team" className="font-medium text-indigo-600 hover:text-indigo-500">
                    Manage Team
                  </Link>
                </div>
              </div>
            </div>

            {/* Investors Card */}
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
                      <dt className="text-sm font-medium text-gray-500 truncate">Projects Needing Investment</dt>
                      <dd className="text-lg font-medium text-gray-900">{investmentProjects.length}</dd>
                    </dl>
                  </div>
                </div>
              </div>
              <div className="bg-gray-50 px-5 py-3">
                <div className="text-sm">
                  <button
                    onClick={() => setShowInvestmentProjects(!showInvestmentProjects)}
                    className="font-medium text-indigo-600 hover:text-indigo-500"
                  >
                    View Projects for Investment
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Conditional Rendering for Investment Projects List */}
          {showInvestmentProjects && (
            <div className="mt-8">
              <h2 className="text-xl font-bold text-gray-900">My Projects Seeking Investment</h2>
              <div className="mt-4 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {investmentProjects.length > 0 ? (
                  investmentProjects.map((project) => (
                    <div key={project.id} className="bg-white rounded-lg shadow-md p-6">
                      <h3 className="text-lg font-semibold text-gray-800">{project.title}</h3>
                      <p className="text-gray-600">Goal: ${project.fundingGoal}</p>
                      <p className="text-gray-600">Reason: {project.investmentReason}</p>
                      <p className="text-gray-600">Raised: ${project.amountRaised || 0} of ${project.fundingGoal}</p>

                      {/* Pending/Active Offers */}
                      {projectOffers[project.id] && projectOffers[project.id].length > 0 && (
                        <div className="mt-4 pt-4 border-t border-gray-200">
                          <h4 className="text-md font-semibold text-gray-700 mb-2">Investor Offers:</h4>
                          {projectOffers[project.id].map((offer, idx) => (
                            <div key={offer.id} className="mb-2 p-2 bg-gray-50 rounded-md">
                              <p className="text-sm text-gray-800"><strong>{offer.investorName}</strong> wants to invest ${offer.investmentAmount || 'N/A'} for {offer.equityPercentage || 'N/A'}% equity.</p>
                              <p className="text-xs text-gray-500">Status: {offer.status}</p>
                              {offer.status === 'interestExpressed' && (
                                <div className="flex gap-2 mt-2">
                                  <button onClick={() => handleAcceptOffer(offer)} className="px-3 py-1 bg-green-600 text-white rounded text-xs">Accept</button>
                                  <button onClick={() => handleCounterOffer(offer)} className="px-3 py-1 bg-yellow-500 text-white rounded text-xs">Counter Offer</button>
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      )}

                      {/* Display Investors and their contributions for this project */}
                      {investorContributions[project.id] && investorContributions[project.id].length > 0 && (
                        <div className="mt-4 pt-4 border-t border-gray-200">
                          <h4 className="text-md font-semibold text-gray-700 mb-2">Investors:</h4>
                          {investorContributions[project.id].map((contribution, index) => (
                            <div key={index} className="mb-2 p-2 bg-gray-50 rounded-md">
                              <p className="text-sm text-gray-800"><strong>{contribution.investorName}</strong> has invested ${contribution.investmentAmount} for {contribution.equityPercentage}% equity.</p>
                              {contribution.paidAt && (
                                <p className="text-xs text-gray-500">Paid on: {new Date(contribution.paidAt).toLocaleString()}</p>
                              )}
                            </div>
                          ))}
                        </div>
                      )}

                      <div className="mt-4 flex justify-between items-center">
                        <Link
                          to={`/project/${project.id}`}
                          className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 text-sm"
                        >
                          View Project Details
                        </Link>
                        <span className="text-sm text-gray-500">
                          {projectOffersSummary[project.id]?.interestedCount || 0} Interests | {projectOffersSummary[project.id]?.offersMadeCount || 0} Offers
                        </span>
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-gray-600">No projects seeking investment yet.</p>
                )}
              </div>
            </div>
          )}

          {/* Recent Projects */}
          <div className="mt-8">
            <h2 className="text-lg font-medium text-gray-900">Recent Projects</h2>
            {projects.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mt-4">
                {projects.map((project) => (
                  <div key={project.id} className="bg-white shadow rounded-lg p-5">
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">{project.title}</h3>
                    <p className="text-gray-700 text-sm mb-2">Reason: {project.reason}</p>
                    <button
                      onClick={() => navigate(`/project/${project.id}`, { state: { fromFounderDashboard: true } })}
                      className="w-full mt-4 px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                    >
                      View Details
                    </button>
                    <button
                      onClick={() => handleEditClick(project)}
                      className="w-full mt-2 px-4 py-2 border border-indigo-600 text-sm font-medium rounded-md text-indigo-700 bg-indigo-50 hover:bg-indigo-100 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                    >
                      Edit
                    </button>
                  </div>
                ))}
              </div>
            ) : (
              <p className="mt-4 text-gray-500">No projects created yet.</p>
            )}
          </div>

      {/* Edit Modal */}
      {editModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40">
          <div className="bg-white rounded-lg shadow-lg p-8 w-full max-w-md relative">
            <button
              className="absolute top-2 right-2 text-gray-400 hover:text-gray-600"
              onClick={() => setEditModalOpen(false)}
            >
              &times;
            </button>
            <h2 className="text-xl font-bold mb-4">Edit Project</h2>
            {editError && <div className="mb-2 text-red-500 text-sm">{editError}</div>}
            <form onSubmit={handleEditSave} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Title</label>
                <input
                  type="text"
                  name="title"
                  value={editFormData.title}
                  onChange={handleEditFormChange}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Reason</label>
                <input
                  type="text"
                  name="reason"
                  value={editFormData.reason}
                  onChange={handleEditFormChange}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                  required
                />
              </div>
              <div className="flex items-center">
                <input
                  type="checkbox"
                  name="forSale"
                  checked={editFormData.forSale}
                  onChange={handleEditFormChange}
                  className="mr-2"
                />
                <label className="text-sm font-medium text-gray-700">Project is for Sale</label>
              </div>
              {editFormData.forSale && (
                <div>
                  <label className="block text-sm font-medium text-gray-700">Sale Price (USD)</label>
                  <input
                    type="number"
                    name="salePrice"
                    value={editFormData.salePrice}
                    onChange={handleEditFormChange}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                    min="0"
                    required
                  />
                </div>
              )}
              <div className="flex items-center">
                <input
                  type="checkbox"
                  name="forInvestment"
                  checked={editFormData.forInvestment}
                  onChange={handleEditFormChange}
                  className="mr-2"
                />
                <label className="text-sm font-medium text-gray-700">Open for Investment</label>
              </div>
              {editFormData.forInvestment && (
                <>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Investment Amount Needed (USD)</label>
                    <input
                      type="number"
                      name="investmentAmount"
                      value={editFormData.investmentAmount}
                      onChange={handleEditFormChange}
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                      min="0"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">UPI ID (for payment)</label>
                    <input
                      type="text"
                      name="upiId"
                      value={editFormData.upiId}
                      onChange={handleEditFormChange}
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                      placeholder="Enter UPI ID"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Bank Details (for payment)</label>
                    <textarea
                      name="bankDetails"
                      value={editFormData.bankDetails}
                      onChange={handleEditFormChange}
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                      rows={3}
                      placeholder="Enter bank details (optional)"
                    />
                  </div>
                </>
              )}
              <div className="flex justify-end">
                <button
                  type="submit"
                  disabled={editLoading}
                  className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 disabled:opacity-50"
                >
                  {editLoading ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Counter Offer Modal */}
      {counterOfferModal.open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40">
          <div className="bg-white rounded-lg shadow-lg p-8 w-full max-w-md relative">
            <button
              className="absolute top-2 right-2 text-gray-400 hover:text-gray-600"
              onClick={() => setCounterOfferModal({ open: false, offer: null, amount: '', equity: '' })}
            >
              &times;
            </button>
            <h2 className="text-xl font-bold mb-4">Counter Offer</h2>
            <form onSubmit={handleSubmitCounterOffer} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Investment Amount (USD)</label>
                <input
                  type="number"
                  value={counterOfferModal.amount}
                  onChange={e => setCounterOfferModal(modal => ({ ...modal, amount: e.target.value }))}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                  min="0"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Equity Percentage (%)</label>
                <input
                  type="number"
                  value={counterOfferModal.equity}
                  onChange={e => setCounterOfferModal(modal => ({ ...modal, equity: e.target.value }))}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                  min="0"
                  max="100"
                  required
                />
              </div>
              <div className="flex justify-end">
                <button
                  type="submit"
                  className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700"
                >
                  Send Counter Offer
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
        </main>
      </div>
    </div>
  );
};

export default FounderDashboard; 