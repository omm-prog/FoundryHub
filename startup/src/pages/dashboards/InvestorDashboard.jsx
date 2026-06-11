import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { auth } from '../../firebase/config';
import { getFirestore, doc, getDoc, collection, query, where, getDocs, addDoc, serverTimestamp, updateDoc } from 'firebase/firestore';
import LoadingSkeleton from '../../components/LoadingSkeleton';

const InvestorDashboard = ({ initialUserData }) => {
  const [userData, setUserData] = useState(initialUserData || null);
  const [investmentProjects, setInvestmentProjects] = useState([]);
  const [loadingProjects, setLoadingProjects] = useState(true);
  const [projectsError, setProjectsError] = useState('');
  const [interestedProjects, setInterestedProjects] = useState([]);
  const [interestLoading, setInterestLoading] = useState(true);
  const [portfolioValue, setPortfolioValue] = useState(0);
  const [activeInvestments, setActiveInvestments] = useState(0);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterSector, setFilterSector] = useState('All');
  const [sortOrder, setSortOrder] = useState('Newest');
  const [pendingOffers, setPendingOffers] = useState([]);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [selectedOfferForPayment, setSelectedOfferForPayment] = useState(null);
  const [investedProjects, setInvestedProjects] = useState([]);

  const navigate = useNavigate();
  const db = getFirestore();
  const currentUser = auth.currentUser;

  useEffect(() => {
    const checkAuthAndFetchProjects = async () => {
      if (!currentUser) {
        navigate('/login');
        return;
      }

      try {
        let data = userData;
        if (!data) {
          const userDoc = await getDoc(doc(db, 'users', currentUser.uid));
          if (userDoc.exists()) {
            data = userDoc.data();
            if (data.role !== 'investor') {
              navigate('/dashboard');
              return;
            }
            setUserData(data);
          } else {
            navigate('/login');
            return;
          }
        }

        if (data) {

          let totalPortfolioValue = 0;
          let totalActiveInvestments = 0;
          const currentInvestedProjects = [];

          if (data.portfolio) {
            const portfolioKeys = Object.keys(data.portfolio);
            
            // Query project data in parallel
            const portfolioPromises = portfolioKeys.map(async (projectId) => {
              const investment = data.portfolio[projectId];
              totalPortfolioValue += investment.totalInvestment || 0;
              totalActiveInvestments++;
              
              const projectDocRef = doc(db, 'projects', projectId);
              const projectDocSnap = await getDoc(projectDocRef);
              if (projectDocSnap.exists()) {
                return {
                  id: projectId,
                  name: projectDocSnap.data().title,
                  investmentAmount: investment.totalInvestment,
                  equityPercentage: investment.totalEquity,
                  lastUpdated: investment.lastUpdated ? investment.lastUpdated.toDate() : null,
                };
              }
              return null;
            });

            const results = await Promise.all(portfolioPromises);
            results.forEach(res => {
              if (res) currentInvestedProjects.push(res);
            });
          }
          
          setPortfolioValue(totalPortfolioValue);
          setActiveInvestments(totalActiveInvestments);
          setInvestedProjects(currentInvestedProjects);

          setLoadingProjects(true);
          // Only fetch projects where forInvestment: true
          const projectsQuery = query(collection(db, 'projects'), where('forInvestment', '==', true));
          const projectSnapshot = await getDocs(projectsQuery);
          const projectsList = projectSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
          setInvestmentProjects(projectsList);

          setInterestLoading(true);
          const interestedQuery = query(
            collection(db, 'projectInterests'),
            where('investorId', '==', currentUser.uid)
          );
          const interestedSnapshot = await getDocs(interestedQuery);
          const interestedList = interestedSnapshot.docs.map(doc => doc.data().projectId);
          setInterestedProjects(interestedList);

          const offersQuery = query(
            collection(db, 'projectOffers'),
            where('investorId', '==', currentUser.uid),
            where('status', '==', 'offerMade')
          );
          const offersSnapshot = await getDocs(offersQuery);
          const offersList = offersSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
          setPendingOffers(offersList);

        }
      } catch (error) {
        console.error('Error fetching data:', error);
        setProjectsError('Failed to load projects or user data.');
      } finally {
        setLoadingProjects(false);
        setInterestLoading(false);
      }
    };

    checkAuthAndFetchProjects();
  }, [navigate, currentUser, db]);

  const handleExpressInterest = async (project) => {
    if (!currentUser) {
      alert('Please log in to express interest.');
      return;
    }
    if (interestedProjects.includes(project.id)) {
      alert('You have already expressed interest in this project.');
      return;
    }

    try {
      await addDoc(collection(db, 'projectOffers'), {
        projectId: project.id,
        investorId: currentUser.uid,
        founderId: project.founder,
        status: 'interestExpressed',
        expressedAt: serverTimestamp(),
        offerHistory: [
          {
            status: 'interestExpressed',
            timestamp: new Date(),
            by: currentUser.uid,
            byRole: 'investor',
          },
        ],
      });

      setInterestedProjects(prev => [...prev, project.id]);
      alert(`Interest expressed successfully for ${project.title}! Founder will be notified.`);
    } catch (error) {
      console.error('Error expressing interest:', error);
      alert('Failed to express interest.');
    }
  };

  const handleInitiatePayment = (offer) => {
    setSelectedOfferForPayment(offer);
    setShowPaymentModal(true);
  };

  const handlePayNow = async (offer) => {
    if (!currentUser) {
      alert('Please log in to complete the payment.');
      return;
    }

    try {
      await updateDoc(doc(db, 'projectOffers', offer.id), {
        status: 'completed',
        paidAt: serverTimestamp(),
        offerHistory: [...offer.offerHistory || [], {
          status: 'completed',
          timestamp: new Date(),
          by: currentUser.uid,
          byRole: 'investor',
          amountPaid: offer.investmentAmount,
        }],
      });

      const investorRef = doc(db, 'users', currentUser.uid);
      const investorDoc = await getDoc(investorRef);
      if (investorDoc.exists()) {
        const currentPortfolio = investorDoc.data().portfolio || {};
        const projectEquity = currentPortfolio[offer.projectId] || { totalInvestment: 0, totalEquity: 0 };

        const newTotalInvestment = projectEquity.totalInvestment + offer.investmentAmount;
        const newTotalEquity = projectEquity.totalEquity + offer.equityPercentage;

        await updateDoc(investorRef, {
          [`portfolio.${offer.projectId}`]: {
            totalInvestment: newTotalInvestment,
            totalEquity: newTotalEquity,
            lastUpdated: serverTimestamp()
          }
        });
      }

      alert(`Payment for ${offer.projectId} successful! Your portfolio has been updated.`);
      setPendingOffers(prev => prev.filter(o => o.id !== offer.id));
    } catch (error) {
      console.error('Error processing payment:', error);
      alert('Payment failed. Please try again.');
    }
  };

  const handleLogout = async () => {
    try {
      await auth.signOut();
      navigate('/login');
    } catch (error) {
      console.error('Error signing out:', error);
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
              <h1 className="ml-2.5 text-lg font-bold text-white tracking-tight">Backer Portal</h1>
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
        {/* Metric Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          {/* Portfolio Value Card */}
          <div className="bg-slate-900/50 backdrop-blur-md border border-slate-800 rounded-2xl p-6 flex flex-col justify-between hover:border-slate-700/60 transition-all duration-200">
            <div className="flex items-center space-x-4">
              <div className="p-3 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 rounded-xl">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">Portfolio Value</p>
                <p className="text-2xl font-extrabold text-white mt-0.5">${portfolioValue.toLocaleString()}</p>
              </div>
            </div>
            <div className="mt-4 pt-4 border-t border-slate-850 flex justify-between items-center text-xs">
              <span className="text-slate-500">Estimated value</span>
              <span className="text-emerald-400 font-bold">Injected Equity</span>
            </div>
          </div>

          {/* Active Investments Card */}
          <div className="bg-slate-900/50 backdrop-blur-md border border-slate-800 rounded-2xl p-6 flex flex-col justify-between hover:border-slate-700/60 transition-all duration-200">
            <div className="flex items-center space-x-4">
              <div className="p-3 bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 rounded-xl">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">Backed Pods</p>
                <p className="text-2xl font-extrabold text-white mt-0.5">{activeInvestments}</p>
              </div>
            </div>
            <div className="mt-4 pt-4 border-t border-slate-850 flex justify-between items-center text-xs">
              <span className="text-slate-500">Milestone Tracked</span>
              <span className="text-indigo-400 font-bold">Active Backing</span>
            </div>
          </div>

          {/* Investment Opportunities Card */}
          <div className="bg-slate-900/50 backdrop-blur-md border border-slate-800 rounded-2xl p-6 flex flex-col justify-between hover:border-slate-700/60 transition-all duration-200">
            <div className="flex items-center space-x-4">
              <div className="p-3 bg-purple-500/10 text-purple-400 border border-purple-500/20 rounded-xl">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                </svg>
              </div>
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">Opportunities</p>
                <p className="text-2xl font-extrabold text-white mt-0.5">{investmentProjects.length}</p>
              </div>
            </div>
            <div className="mt-4 pt-4 border-t border-slate-850 flex justify-between items-center text-xs">
              <span className="text-slate-500">Seeking Funding</span>
              <span className="text-purple-400 font-bold">Available Listings</span>
            </div>
          </div>
        </div>

        {/* My Investments Section */}
        {investedProjects.length > 0 && (
          <div className="space-y-4 mb-8">
            <h2 className="text-xl font-bold text-slate-200 flex items-center">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 mr-2"></span>
              My Portfolio
            </h2>
            <div className="bg-slate-900/50 backdrop-blur-md border border-slate-800 rounded-2xl p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {investedProjects.map(project => (
                  <div key={project.id} className="bg-slate-950/40 border border-slate-850 rounded-xl p-5 hover:border-slate-800 transition-all duration-200 flex flex-col justify-between">
                    <div>
                      <div className="flex items-start justify-between mb-3">
                        <h3 className="font-bold text-slate-200 text-base">{project.name}</h3>
                        <span className="bg-emerald-500/10 text-emerald-450 text-xs font-semibold px-2.5 py-0.5 rounded-full border border-emerald-500/20">
                          {project.equityPercentage}%
                        </span>
                      </div>
                      <div className="space-y-1.5 text-xs text-slate-400 pt-2 border-t border-slate-900">
                        <div className="flex justify-between">
                          <span>Investment:</span>
                          <span className="font-bold text-slate-250">${project.investmentAmount?.toLocaleString()}</span>
                        </div>
                        {project.lastUpdated && (
                          <div className="flex justify-between">
                            <span>Last Transaction:</span>
                            <span>{new Date(project.lastUpdated).toLocaleDateString()}</span>
                          </div>
                        )}
                      </div>
                    </div>
                    <button
                      onClick={() => navigate(`/project/${project.id}`)}
                      className="mt-5 w-full bg-slate-900 border border-slate-800 hover:border-slate-750 text-slate-300 hover:text-white font-semibold py-2 px-4 rounded-xl transition-all duration-200 text-xs text-center"
                    >
                      View Project Details
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Pending Offers Section */}
        {pendingOffers.length > 0 && (
          <div className="space-y-4 mb-8">
            <h2 className="text-xl font-bold text-slate-200 flex items-center">
              <span className="w-2.5 h-2.5 rounded-full bg-yellow-500 mr-2"></span>
              Incoming Project Offers
            </h2>
            <div className="bg-slate-900/50 backdrop-blur-md border border-slate-800 rounded-2xl p-6">
              <div className="space-y-4">
                {pendingOffers.map(offer => (
                  <div key={offer.id} className="bg-slate-950/40 border border-yellow-500/20 rounded-xl p-5 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                    <div className="space-y-2">
                      <div className="flex items-center space-x-2">
                        <h3 className="font-bold text-slate-200">Project Workspace ID: {offer.projectId}</h3>
                        <span className="bg-yellow-500/10 text-yellow-450 border border-yellow-500/20 text-[10px] font-semibold px-2 py-0.5 rounded-full uppercase">
                          Action Required
                        </span>
                      </div>
                      <div className="flex flex-wrap gap-x-6 gap-y-1 text-xs text-slate-400">
                        <div>
                          <span>Offered Investment: </span>
                          <strong className="text-slate-250">${offer.investmentAmount?.toLocaleString()}</strong>
                        </div>
                        <div>
                          <span>Requested Equity: </span>
                          <strong className="text-slate-250">{offer.equityPercentage}%</strong>
                        </div>
                      </div>
                    </div>
                    <button
                      onClick={() => handleInitiatePayment(offer)}
                      className="px-5 py-2.5 bg-gradient-to-r from-emerald-500 to-teal-600 text-white font-bold rounded-xl hover:from-emerald-600 hover:to-teal-700 shadow-md transition-all text-xs"
                    >
                      Pay & Complete Deal
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Investment Opportunities Section */}
        <div className="space-y-4">
          <h2 className="text-xl font-bold text-slate-200 flex items-center">
            <span className="w-2.5 h-2.5 rounded-full bg-indigo-500 mr-2"></span>
            Investment Opportunities
          </h2>

          {/* Search and Filter Controls */}
          <div className="bg-slate-900/50 backdrop-blur-md border border-slate-800 rounded-2xl p-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <input
                type="text"
                placeholder="Search workspaces by name or reason..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full bg-slate-950/60 border border-slate-800 focus:border-indigo-500 text-white placeholder-slate-500 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 px-4 py-3 text-sm transition-all"
              />
              <select
                value={filterSector}
                onChange={(e) => setFilterSector(e.target.value)}
                className="w-full bg-slate-950/60 border border-slate-800 focus:border-indigo-500 text-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 px-4 py-3 text-sm transition-all"
              >
                <option value="All">All Sectors</option>
                <option value="Technology">Technology</option>
                <option value="Finance">Finance</option>
                <option value="Healthcare">Healthcare</option>
                <option value="Food">Food</option>
                <option value="Real Estate">Real Estate</option>
              </select>
              <select
                value={sortOrder}
                onChange={(e) => setSortOrder(e.target.value)}
                className="w-full bg-slate-950/60 border border-slate-800 focus:border-indigo-500 text-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 px-4 py-3 text-sm transition-all"
              >
                <option value="Newest">Newest</option>
                <option value="Oldest">Oldest</option>
                <option value="Goal: Low to High">Goal: Low to High</option>
                <option value="Goal: High to Low">Goal: High to Low</option>
              </select>
            </div>
          </div>

          {/* Projects Grid */}
          {loadingProjects || interestLoading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              <div className="h-48 rounded-2xl bg-slate-900/40 border border-slate-800/80 animate-pulse animate-shimmer"></div>
              <div className="h-48 rounded-2xl bg-slate-900/40 border border-slate-800/80 animate-pulse animate-shimmer"></div>
              <div className="h-48 rounded-2xl bg-slate-900/40 border border-slate-800/80 animate-pulse animate-shimmer"></div>
            </div>
          ) : projectsError ? (
            <div className="bg-red-500/10 border border-red-500/25 rounded-2xl p-6 text-center text-red-400">
              <p className="font-semibold">{projectsError}</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {investmentProjects
                .filter(project => {
                  const matchesSearch = project.title.toLowerCase().includes(searchTerm.toLowerCase()) || 
                                     (project.investmentReason && project.investmentReason.toLowerCase().includes(searchTerm.toLowerCase()));
                  const matchesSector = filterSector === 'All' || project.sector === filterSector;
                  return matchesSearch && matchesSector;
                })
                .sort((a, b) => {
                  switch (sortOrder) {
                    case 'Newest':
                      return new Date(b.createdAt) - new Date(a.createdAt);
                    case 'Oldest':
                      return new Date(a.createdAt) - new Date(b.createdAt);
                    case 'Goal: Low to High':
                      return (a.fundingGoal || 0) - (b.fundingGoal || 0);
                    case 'Goal: High to Low':
                      return (b.fundingGoal || 0) - (a.fundingGoal || 0);
                    default:
                      return 0;
                  }
                })
                .map(project => (
                  <div key={project.id} className="bg-slate-900/60 border border-slate-800 rounded-2xl p-6 shadow-lg flex flex-col justify-between hover:border-slate-700/80 transition-all duration-300">
                    <div className="space-y-4">
                      <div>
                        <div className="flex justify-between items-start">
                          <h3 className="text-lg font-bold text-slate-100 line-clamp-1">{project.title}</h3>
                          <span className="text-[10px] bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 px-2 py-0.5 rounded-full font-semibold uppercase">
                            {project.sector || 'General'}
                          </span>
                        </div>
                        <p className="text-xs text-slate-500 mt-1">Stage: {project.stage || 'Pre-Seed'}</p>
                      </div>
                      
                      <p className="text-slate-400 text-sm line-clamp-2 leading-relaxed">
                        {project.description || project.investmentReason || 'No summary configured.'}
                      </p>

                      <div className="space-y-2 pt-2 border-t border-slate-900">
                        <div className="flex justify-between text-xs">
                          <span className="text-slate-500">Funding Goal:</span>
                          <span className="font-bold text-slate-200">${project.fundingGoal?.toLocaleString() || 'N/A'}</span>
                        </div>
                        {project.fundingGoal && (
                          <div className="space-y-1.5">
                            <div className="flex justify-between text-[10px] text-slate-450">
                              <span>Raised: ${project.raisedAmount?.toLocaleString() || '0'}</span>
                              <span>{Math.round(((project.raisedAmount || 0) / project.fundingGoal) * 100)}%</span>
                            </div>
                            <div className="w-full bg-slate-950 rounded-full h-1.5">
                              <div 
                                className="bg-gradient-to-r from-indigo-500 to-purple-600 h-1.5 rounded-full transition-all"
                                style={{ width: `${Math.min(((project.raisedAmount || 0) / project.fundingGoal) * 100, 100)}%` }}
                              ></div>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                    
                    <div className="flex gap-2.5 mt-6 pt-4 border-t border-slate-900">
                      <button
                        onClick={() => navigate(`/project/${project.id}`)}
                        className="flex-1 text-center bg-slate-950/40 border border-slate-850 hover:border-slate-850 hover:bg-slate-900 text-slate-350 hover:text-white font-semibold py-2 px-3 rounded-xl transition-all duration-200 text-xs"
                      >
                        View Pod Details
                      </button>
                      <button
                        onClick={() => handleExpressInterest(project)}
                        disabled={interestedProjects.includes(project.id)}
                        className={`flex-1 py-2 px-3 font-bold rounded-xl transition-all text-xs text-center ${
                          interestedProjects.includes(project.id)
                            ? 'bg-slate-800 text-slate-550 border border-slate-750 cursor-not-allowed'
                            : 'bg-gradient-to-r from-emerald-500 to-teal-600 text-white hover:from-emerald-600 hover:to-teal-700'
                        }`}
                      >
                        {interestedProjects.includes(project.id) ? 'Interest Logged' : 'Express Interest'}
                      </button>
                    </div>
                  </div>
                ))}
            </div>
          )}
          
          {!loadingProjects && !interestLoading && !projectsError && investmentProjects.length === 0 && (
            <div className="bg-slate-900/30 border border-slate-800 border-dashed rounded-2xl p-8 text-center text-slate-400">
              <h3 className="text-base font-semibold text-slate-300 mb-1">No Investment Matches</h3>
              <p className="text-xs text-slate-500 mb-4">No workspaces match filters.</p>
              <button
                onClick={() => {
                  setSearchTerm('');
                  setFilterSector('All');
                  setSortOrder('Newest');
                }}
                className="px-4 py-2 bg-slate-850 border border-slate-750 text-slate-300 hover:text-white font-semibold rounded-xl text-xs transition-all"
              >
                Reset Controls
              </button>
            </div>
          )}
        </div>
      </main>

      {/* Payment Confirmation Modal */}
      {showPaymentModal && selectedOfferForPayment && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fadeIn">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl max-w-md w-full p-6 text-slate-100">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-white">Payment Confirmation</h3>
              <button
                onClick={() => setShowPaymentModal(false)}
                className="text-slate-450 hover:text-white transition-colors"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            
            <div className="space-y-4 mb-6">
              <div className="bg-slate-950/60 border border-slate-850 rounded-xl p-4 space-y-2 text-xs text-slate-400">
                <h4 className="font-semibold text-slate-200 mb-1 text-sm">Deal Terms</h4>
                <div className="flex justify-between">
                  <span>Project ID:</span>
                  <span className="font-semibold text-slate-305">{selectedOfferForPayment.projectId}</span>
                </div>
                <div className="flex justify-between">
                  <span>Investment Amount:</span>
                  <span className="font-semibold text-slate-205">${selectedOfferForPayment.investmentAmount?.toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                  <span>Equity Granted:</span>
                  <span className="font-semibold text-slate-205">{selectedOfferForPayment.equityPercentage}%</span>
                </div>
              </div>
              
              <div className="bg-indigo-950/40 border border-indigo-900/40 rounded-xl p-4 space-y-2 text-xs">
                <h4 className="font-semibold text-indigo-400 mb-1 text-sm">Founder's Payment Credentials</h4>
                {(() => {
                  const project = investmentProjects.find(p => p.id === selectedOfferForPayment.projectId);
                  return (
                    <>
                      {project?.upiId && (
                        <p className="text-slate-300">UPI ID: <span className="font-mono text-white bg-slate-950 px-1.5 py-0.5 rounded">{project.upiId}</span></p>
                      )}
                      {project?.bankDetails && (
                        <div className="text-slate-300 space-y-1">
                          <span>Bank Details:</span>
                          <pre className="bg-slate-950 border border-slate-850 text-slate-200 rounded p-2 text-[10px] whitespace-pre-wrap">{project.bankDetails}</pre>
                        </div>
                      )}
                      {!project?.upiId && !project?.bankDetails && (
                        <p className="text-slate-500">No payment credentials configured by this founder.</p>
                      )}
                    </>
                  );
                })()}
              </div>
            </div>
            
            <div className="flex space-x-3 pt-3 border-t border-slate-850">
              <button
                onClick={() => setShowPaymentModal(false)}
                className="flex-1 px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold rounded-xl text-xs transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  handlePayNow(selectedOfferForPayment);
                  setShowPaymentModal(false);
                }}
                className="flex-1 px-4 py-2.5 bg-gradient-to-r from-emerald-500 to-teal-650 text-white font-bold rounded-xl shadow-md hover:scale-[1.01] transition-all text-xs"
              >
                Confirm Payout
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default InvestorDashboard;