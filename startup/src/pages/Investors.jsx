import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { getFirestore, collection, query, where, getDocs, addDoc, doc, getDoc, serverTimestamp } from 'firebase/firestore';
import { auth } from '../firebase/config';
import InvestorChat from '../components/InvestorChat';
import LoadingSkeleton from '../components/LoadingSkeleton';

const Investors = () => {
  const [investors, setInvestors] = useState([]);
  const [founderProjects, setFounderProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  // Pitch Modal State
  const [pitchModalOpen, setPitchModalOpen] = useState(false);
  const [selectedInvestor, setSelectedInvestor] = useState(null);
  const [selectedProjectId, setSelectedProjectId] = useState('');
  const [pitchAmount, setPitchAmount] = useState('');
  const [pitchEquity, setPitchEquity] = useState('');
  const [pitchLoading, setPitchLoading] = useState(false);
  const [pitchError, setPitchError] = useState('');

  // Chat Modal State
  const [chatModalOpen, setChatModalOpen] = useState(false);
  const [chatRecipient, setChatRecipient] = useState(null);
  const [chatProjectId, setChatProjectId] = useState('');

  const navigate = useNavigate();
  const db = getFirestore();
  const currentUser = auth.currentUser;

  useEffect(() => {
    const fetchData = async () => {
      if (!currentUser) {
        navigate('/login');
        return;
      }

      try {
        setLoading(true);
        // Verify current user is a founder
        const userDoc = await getDoc(doc(db, 'users', currentUser.uid));
        if (!userDoc.exists() || userDoc.data().role !== 'founder') {
          navigate('/dashboard');
          return;
        }

        // Fetch founder's projects in parallel
        const projectsQuery = query(collection(db, 'projects'), where('founder', '==', currentUser.uid));
        const projectsSnapshot = await getDocs(projectsQuery);
        const projectsList = projectsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        setFounderProjects(projectsList);

        // Fetch all investors
        const investorsQuery = query(collection(db, 'users'), where('role', '==', 'investor'));
        const investorsSnapshot = await getDocs(investorsQuery);
        
        // Resolve investor details and their portfolios in parallel
        const investorPromises = investorsSnapshot.docs.map(async (docSnap) => {
          const investorData = docSnap.data();
          const portfolio = investorData.portfolio || {};
          const portfolioKeys = Object.keys(portfolio);
          
          const activeInvestmentsPromises = portfolioKeys.map(async (projId) => {
            const projDoc = await getDoc(doc(db, 'projects', projId));
            if (projDoc.exists()) {
              return {
                id: projId,
                title: projDoc.data().title,
                amount: portfolio[projId].totalInvestment,
                equity: portfolio[projId].totalEquity
              };
            }
            return null;
          });

          const activeInvestmentsList = (await Promise.all(activeInvestmentsPromises)).filter(Boolean);

          return {
            id: docSnap.id,
            email: investorData.email,
            name: investorData.name || investorData.email.split('@')[0],
            portfolio: activeInvestmentsList
          };
        });

        const investorsList = await Promise.all(investorPromises);
        setInvestors(investorsList);

      } catch (err) {
        console.error('Error fetching investors data:', err);
        setError('Failed to load investors. Please try again.');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [currentUser, navigate, db]);

  const handleOpenPitchModal = (investor) => {
    setSelectedInvestor(investor);
    setPitchModalOpen(true);
    setPitchAmount('');
    setPitchEquity('');
    setPitchError('');
    if (founderProjects.length > 0) {
      setSelectedProjectId(founderProjects[0].id);
    } else {
      setSelectedProjectId('');
    }
  };

  const handleSendPitch = async (e) => {
    e.preventDefault();
    if (!selectedProjectId || !pitchAmount || !pitchEquity) {
      setPitchError('Please fill in all fields.');
      return;
    }

    setPitchLoading(true);
    setPitchError('');

    try {
      // Create a project offer with status: 'offerMade'
      await addDoc(collection(db, 'projectOffers'), {
        projectId: selectedProjectId,
        investorId: selectedInvestor.id,
        founderId: currentUser.uid,
        status: 'offerMade',
        investmentAmount: Number(pitchAmount),
        equityPercentage: Number(pitchEquity),
        offeredAt: serverTimestamp(),
        offerHistory: [
          {
            status: 'offerMade',
            timestamp: new Date(),
            by: currentUser.uid,
            byRole: 'founder',
            amount: Number(pitchAmount),
            equity: Number(pitchEquity)
          }
        ]
      });

      alert(`Pitch sent successfully to ${selectedInvestor.name}! They will see it on their dashboard.`);
      setPitchModalOpen(false);
    } catch (err) {
      console.error('Error sending pitch:', err);
      setPitchError('Failed to send pitch. Please try again.');
    } finally {
      setPitchLoading(false);
    }
  };

  const handleOpenChatModal = (investor) => {
    if (founderProjects.length === 0) {
      alert('You need to create at least one project to chat with investors.');
      return;
    }
    setChatRecipient(investor);
    setChatProjectId(founderProjects[0].id);
    setChatModalOpen(true);
  };

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
      {/* Ambient backgrounds */}
      <div className="absolute top-[-10%] left-[-15%] w-[50%] h-[50%] bg-indigo-500/10 rounded-full blur-[120px] pointer-events-none"></div>
      <div className="absolute bottom-[-10%] right-[-15%] w-[50%] h-[50%] bg-purple-500/10 rounded-full blur-[120px] pointer-events-none"></div>

      {/* Navigation */}
      <nav className="bg-[#030712]/80 border-b border-slate-800/60 backdrop-blur-md sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <Link to="/dashboard" className="flex items-center space-x-3 text-slate-300 hover:text-white transition-colors">
                <div className="w-8 h-8 bg-slate-900 border border-slate-850 hover:border-slate-800 rounded-xl flex items-center justify-center">
                  <svg className="w-4 h-4 text-indigo-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                  </svg>
                </div>
                <span className="text-sm font-bold tracking-tight">
                  Dashboard
                </span>
              </Link>
            </div>
            <div className="flex items-center space-x-4">
              <span className="text-xs text-slate-400 hidden sm:inline">Welcome, <strong className="text-slate-200">{currentUser?.email}</strong></span>
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
        <div className="mb-8 space-y-2">
          <h2 className="text-2xl font-extrabold text-white">
            Meet the Backers
          </h2>
          <p className="text-sm text-slate-400">
            Connect with active platform investors. Pitch your startup and negotiate equity deals.
          </p>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-500/10 border border-red-500/25 rounded-2xl text-red-400 text-sm font-semibold">
            {error}
          </div>
        )}

        {investors.length === 0 ? (
          <div className="bg-slate-900/30 border border-slate-800 border-dashed rounded-2xl p-12 text-center text-slate-500">
            <svg className="w-12 h-12 text-slate-600 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
            </svg>
            <h3 className="text-sm font-semibold text-slate-355">No investors registered yet</h3>
            <p className="text-xs text-slate-500 mt-1">Please wait for investors to sign up on the platform.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {investors.map((investor) => (
              <div
                key={investor.id}
                className="bg-slate-900/60 border border-slate-800 rounded-2xl overflow-hidden hover:border-slate-700/80 transition-all duration-300 flex flex-col justify-between"
              >
                <div className="p-6">
                  <div className="flex items-center space-x-3 mb-4">
                    <div className="w-12 h-12 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-full flex items-center justify-center text-white font-bold text-lg">
                      {investor.name.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <h3 className="text-base font-bold text-slate-100">{investor.name}</h3>
                      <p className="text-xs text-slate-500">{investor.email}</p>
                    </div>
                  </div>

                  <div className="space-y-2 border-t border-slate-900 pt-4">
                    <h4 className="text-xs font-semibold text-slate-400">Backed Portfolios:</h4>
                    {investor.portfolio.length > 0 ? (
                      <div className="flex flex-wrap gap-1.5 pt-1">
                        {investor.portfolio.map((p) => (
                          <span
                            key={p.id}
                            className="inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-semibold bg-indigo-500/10 border border-indigo-500/20 text-indigo-400"
                            title={`Invested: $${p.amount} for ${p.equity}% equity`}
                          >
                            {p.title}
                          </span>
                        ))}
                      </div>
                    ) : (
                      <p className="text-xs text-slate-650 italic">No active investments yet</p>
                    )}
                  </div>
                </div>

                <div className="bg-slate-950/40 p-4 border-t border-slate-900 flex gap-2">
                  <button
                    onClick={() => handleOpenPitchModal(investor)}
                    className="flex-1 px-4 py-2 bg-gradient-to-r from-indigo-500 to-purple-600 text-white text-xs font-semibold rounded-xl hover:from-indigo-600 hover:to-purple-700 transition-all shadow-md"
                  >
                    Pitch Project
                  </button>
                  <button
                    onClick={() => handleOpenChatModal(investor)}
                    className="px-4 py-2 bg-slate-900 border border-slate-800 text-slate-350 hover:text-white text-xs font-semibold rounded-xl transition-all"
                  >
                    Chat
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>

      {/* Pitch Modal */}
      {pitchModalOpen && selectedInvestor && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fadeIn">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl max-w-md w-full p-6 relative text-slate-100">
            <button
              onClick={() => setPitchModalOpen(false)}
              className="absolute top-4 right-4 text-slate-450 hover:text-white transition-colors"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>

            <h3 className="text-lg font-bold text-white mb-4">
              Pitch to {selectedInvestor.name}
            </h3>

            {pitchError && (
              <div className="mb-4 p-3 bg-red-500/10 border border-red-500/25 rounded-xl text-red-400 text-xs font-semibold">
                {pitchError}
              </div>
            )}

            {founderProjects.length === 0 ? (
              <div className="text-center py-4 space-y-4">
                <p className="text-xs text-slate-400">You need at least one project workspace to send pitches.</p>
                <Link
                  to="/create-project"
                  className="inline-flex justify-center px-4 py-2.5 bg-gradient-to-r from-indigo-500 to-purple-600 text-white rounded-xl text-xs font-semibold shadow-md"
                >
                  Create a Project
                </Link>
              </div>
            ) : (
              <form onSubmit={handleSendPitch} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1.5">Select Workspace Pod</label>
                  <select
                    value={selectedProjectId}
                    onChange={(e) => setSelectedProjectId(e.target.value)}
                    className="w-full bg-slate-950/60 border border-slate-800 focus:border-indigo-500 text-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 px-4 py-3 text-sm transition-all"
                  >
                    {founderProjects.map((proj) => (
                      <option key={proj.id} value={proj.id}>
                        {proj.title}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1.5">Investment Requested ($)</label>
                  <input
                    type="number"
                    value={pitchAmount}
                    onChange={(e) => setPitchAmount(e.target.value)}
                    placeholder="e.g. 50000"
                    required
                    min="1"
                    className="w-full bg-slate-950/60 border border-slate-800 focus:border-indigo-500 text-white placeholder-slate-500 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 px-4 py-3 text-sm transition-all"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1.5">Equity Offered (%)</label>
                  <input
                    type="number"
                    value={pitchEquity}
                    onChange={(e) => setPitchEquity(e.target.value)}
                    placeholder="e.g. 10"
                    required
                    min="0.1"
                    max="100"
                    step="any"
                    className="w-full bg-slate-950/60 border border-slate-800 focus:border-indigo-500 text-white placeholder-slate-500 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 px-4 py-3 text-sm transition-all"
                  />
                </div>

                <div className="flex space-x-3 pt-4 border-t border-slate-850">
                  <button
                    type="button"
                    onClick={() => setPitchModalOpen(false)}
                    className="flex-1 px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-350 text-xs font-semibold rounded-xl transition-all"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={pitchLoading}
                    className="flex-1 px-4 py-2.5 bg-gradient-to-r from-indigo-500 to-purple-600 text-white text-xs font-semibold rounded-xl hover:from-indigo-600 hover:to-purple-700 transition-all disabled:opacity-50"
                  >
                    {pitchLoading ? 'Sending...' : 'Send Pitch'}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}

      {/* Chat Modal */}
      {chatModalOpen && chatRecipient && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fadeIn">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl max-w-xl w-full p-6 relative text-slate-105">
            <button
              onClick={() => setChatModalOpen(false)}
              className="absolute top-4 right-4 text-slate-450 hover:text-white transition-colors z-10"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>

            <div className="mb-4">
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1.5">Select Workspace context</label>
              <select
                value={chatProjectId}
                onChange={(e) => setChatProjectId(e.target.value)}
                className="w-full bg-slate-950/60 border border-slate-800 focus:border-indigo-500 text-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 px-4 py-3 text-sm transition-all"
              >
                {founderProjects.map((proj) => (
                  <option key={proj.id} value={proj.id}>
                    {proj.title}
                  </option>
                ))}
              </select>
            </div>

            {chatProjectId && (
              <div className="border border-slate-800/80 rounded-2xl bg-slate-950/40 p-4">
                <InvestorChat projectId={chatProjectId} recipientId={chatRecipient.id} />
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default Investors;
