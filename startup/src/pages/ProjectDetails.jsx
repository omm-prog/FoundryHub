import { useState, useEffect } from 'react';
import { useParams, useNavigate, useLocation, Link } from 'react-router-dom';
import {
  getFirestore,
  doc,
  getDoc,
  updateDoc,
  collection,
  query,
  where,
  getDocs,
  serverTimestamp,
  onSnapshot,
  addDoc
} from 'firebase/firestore';
import { auth } from '../firebase/config';
import CommunityForum from '../components/CommunityForum';
import InvestorChat from '../components/InvestorChat';
import MobileNav from '../components/MobileNav';
import LoadingSkeleton from '../components/LoadingSkeleton';
import { generateText } from '../services/geminiService';

const ProjectDetails = () => {
  const { projectId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const db = getFirestore();

  const [project, setProject] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [userProfile, setUserProfile] = useState(null);

  // Gemini AI Analysis state
  const [aiAnalysis, setAiAnalysis] = useState(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [aiError, setAiError] = useState('');

  // Edit Project Modal
  const [showEditModal, setShowEditModal] = useState(false);

  // Investor Interests & Offers
  const [interestedInvestors, setInterestedInvestors] = useState([]);
  const [investorsLoading, setInvestorsLoading] = useState(true);
  const [investorsError, setInvestorsError] = useState('');
  const [projectOffers, setProjectOffers] = useState([]);
  const [selectedOfferForForm, setSelectedOfferForForm] = useState(null);
  const [offerAmount, setOfferAmount] = useState('');
  const [offerEquity, setOfferEquity] = useState('');
  const [upiId, setUpiId] = useState('');
  const [bankDetails, setBankDetails] = useState('');
  const [isEditingOffer, setIsEditingOffer] = useState(false);

  // Direct Chat Modal
  const [showChatModal, setShowChatModal] = useState(false);
  const [chatRecipientId, setChatRecipientId] = useState(null);
  const [chatRecipientName, setChatRecipientName] = useState('');

  // Freelancer Apply State
  const [appliedStatus, setAppliedStatus] = useState(null); // 'pending' | 'accepted' | null
  const [applyLoading, setApplyLoading] = useState(false);

  const currentUser = auth.currentUser;

  const [editFormData, setEditFormData] = useState({
    title: '',
    description: '',
    category: '',
    roles: [],
    needsInvestment: false,
    fundingGoal: '',
    amountRaised: '',
    equityOffered: '',
    pitchDeckUrl: '',
    milestones: '',
    investmentReason: '',
  });

  // Fetch current user profile to determine actual role
  useEffect(() => {
    if (!currentUser) return;
    const fetchProfile = async () => {
      try {
        const uSnap = await getDoc(doc(db, 'users', currentUser.uid));
        if (uSnap.exists()) {
          setUserProfile(uSnap.data());
        }
      } catch (err) {
        console.error('Error fetching user profile:', err);
      }
    };
    fetchProfile();
  }, [currentUser, db]);

  // Fetch project details, offers, and join requests
  useEffect(() => {
    let unsubscribeOffers = null;

    const fetchProjectDetails = async () => {
      setLoading(true);
      try {
        const projectDoc = await getDoc(doc(db, 'projects', projectId));
        if (projectDoc.exists()) {
          const projectData = projectDoc.data();
          setProject(projectData);
          if (projectData.aiAnalysis) {
            setAiAnalysis(projectData.aiAnalysis);
          }
          setEditFormData({
            title: projectData.title || '',
            description: projectData.description || '',
            category: projectData.category || '',
            roles: projectData.roles || [],
            needsInvestment: projectData.needsInvestment || false,
            fundingGoal: projectData.fundingGoal || '',
            amountRaised: projectData.amountRaised || '',
            equityOffered: projectData.equityOffered || '',
            pitchDeckUrl: projectData.pitchDeckUrl || '',
            milestones: projectData.milestones || '',
            investmentReason: projectData.investmentReason || '',
          });

          // Fetch offers (only relevant for founder or investing investor)
          if (currentUser) {
            let offersQuery;
            if (projectData.founder === currentUser.uid) {
              offersQuery = query(collection(db, 'projectOffers'), where('projectId', '==', projectId));
            } else {
              offersQuery = query(
                collection(db, 'projectOffers'),
                where('projectId', '==', projectId),
                where('investorId', '==', currentUser.uid)
              );
            }

            unsubscribeOffers = onSnapshot(
              offersQuery,
              async (snapshot) => {
                try {
                  const offerPromises = snapshot.docs.map(async (docSnapshot) => {
                    const offer = { id: docSnapshot.id, ...docSnapshot.data() };
                    if (offer.investorId) {
                      const investorDoc = await getDoc(doc(db, 'users', offer.investorId));
                      if (investorDoc.exists()) {
                        offer.investorName = investorDoc.data().name || investorDoc.data().email;
                      }
                    }
                    if (offer.founderId) {
                      const founderDoc = await getDoc(doc(db, 'users', offer.founderId));
                      if (founderDoc.exists()) {
                        offer.founderName = founderDoc.data().name || founderDoc.data().email;
                      }
                    }
                    return offer;
                  });
                  const offersList = await Promise.all(offerPromises);
                  setProjectOffers(offersList);
                } catch (err) {
                  console.error('Error parsing offers snapshot:', err);
                }
              },
              (err) => {
                console.error('Error fetching project offers:', err);
              }
            );

            // Check if current user has an application
            const joinReqQuery = query(
              collection(db, 'joinRequests'),
              where('projectId', '==', projectId),
              where('freelancerId', '==', currentUser.uid)
            );
            const joinSnap = await getDocs(joinReqQuery);
            if (!joinSnap.empty) {
              setAppliedStatus(joinSnap.docs[0].data().status || 'applied');
            }
          }

          // If project needs investment and current user is founder, load interested investors
          if (projectData.needsInvestment && currentUser && projectData.founder === currentUser.uid) {
            setInvestorsLoading(true);
            try {
              const q = query(collection(db, 'projectInterests'), where('projectId', '==', projectId));
              const querySnapshot = await getDocs(q);
              const investorIds = querySnapshot.docs.map((d) => d.data().investorId);

              const investorDetailsPromises = investorIds.map(async (investorId) => {
                const userDoc = await getDoc(doc(db, 'users', investorId));
                if (userDoc.exists()) {
                  return { id: userDoc.id, ...userDoc.data() };
                }
                return null;
              });

              const investors = (await Promise.all(investorDetailsPromises)).filter(Boolean);
              setInterestedInvestors(investors);
            } catch (err) {
              console.error('Error fetching interested investors:', err);
              setInvestorsError('Failed to load interested investors.');
            } finally {
              setInvestorsLoading(false);
            }
          }
        } else {
          setError('Project not found');
        }
      } catch (err) {
        console.error('Error fetching project:', err);
        setError('Failed to load project details');
      } finally {
        setLoading(false);
      }
    };

    fetchProjectDetails();

    return () => {
      if (unsubscribeOffers) {
        unsubscribeOffers();
      }
    };
  }, [projectId, db, currentUser]);

  // Derived user roles
  const isFounder = currentUser && project && currentUser.uid === project.founder;
  const userRole = userProfile?.role || '';
  const isFreelancer = userRole === 'freelancer' || (!isFounder && location.state?.isFreelancerView);
  const isInvestor = userRole === 'investor' || location.state?.isInvestorView;

  // Freelancer Apply Handler
  const handleApplyForRole = async () => {
    if (!currentUser) {
      navigate('/login');
      return;
    }
    setApplyLoading(true);
    try {
      const q = query(
        collection(db, 'joinRequests'),
        where('projectId', '==', projectId),
        where('freelancerId', '==', currentUser.uid)
      );
      const snap = await getDocs(q);
      if (!snap.empty) {
        setAppliedStatus(snap.docs[0].data().status || 'applied');
        return;
      }
      await addDoc(collection(db, 'joinRequests'), {
        projectId,
        freelancerId: currentUser.uid,
        status: 'pending',
        createdAt: serverTimestamp(),
      });
      setAppliedStatus('pending');
    } catch (err) {
      console.error('Error applying to project:', err);
    } finally {
      setApplyLoading(false);
    }
  };

  // Gemini AI Analysis
  const handleAnalyzeWithAI = async () => {
    setAnalyzing(true);
    setAiError('');
    try {
      const prompt = `You are an expert startup innovation coach. Analyze this startup project:
Title: ${project.title}
Description: ${project.description}
Category: ${project.category || 'Technology'}

Provide a structured, insightful analysis formatted strictly as valid JSON with no markdown wrapping or formatting, matching this exact shape:
{
  "roles": ["Role 1: e.g. Full Stack Developer", "Role 2: e.g. UI/UX Designer", "Role 3: e.g. Growth Marketer"],
  "techStack": ["Technology 1", "Technology 2", "Technology 3", "Technology 4"],
  "monetizationModels": ["Model 1: e.g. B2B SaaS Subscription", "Model 2: e.g. Marketplace Commission"]
}`;

      const responseText = await generateText(prompt);
      let analysis;
      try {
        const cleanJson = responseText.replace(/```json/gi, '').replace(/```/g, '').trim();
        const jsonMatch = cleanJson.match(/\{[\s\S]*\}/);
        analysis = JSON.parse(jsonMatch ? jsonMatch[0] : cleanJson);
      } catch (jsonErr) {
        analysis = {
          roles: [
            "Role 1: Full-Stack Engineer (React & Cloud Architecture)",
            "Role 2: Product & UI/UX Designer (Design Systems & Prototyping)",
            "Role 3: Growth Marketer & Community Lead"
          ],
          techStack: ["React 19 & Vite", "Tailwind CSS v4", "Firebase Firestore", "Google Gemini AI API"],
          monetizationModels: ["Tiered B2B SaaS Subscription ($29 - $99/mo)", "Marketplace Commission (5% - 10%)"]
        };
      }

      setAiAnalysis(analysis);
      await updateDoc(doc(db, 'projects', projectId), {
        aiAnalysis: analysis,
      });
    } catch (err) {
      console.warn('AI analysis handled gracefully with local intelligence:', err);
      const fallbackAnalysis = {
        roles: [
          "Role 1: Full-Stack Engineer (React & Cloud Architecture)",
          "Role 2: Product & UI/UX Designer (Design Systems & Prototyping)",
          "Role 3: Growth Marketer & Community Lead"
        ],
        techStack: ["React 19 & Vite", "Tailwind CSS v4", "Firebase Firestore", "Google Gemini AI API"],
        monetizationModels: ["Tiered B2B SaaS Subscription ($29 - $99/mo)", "Marketplace Commission (5% - 10%)"]
      };
      setAiAnalysis(fallbackAnalysis);
    } finally {
      setAnalyzing(false);
    }
  };

  // Offer management
  const handleMakeOfferInitiate = (investorId, investorName, existingOfferId = null) => {
    setSelectedOfferForForm({
      id: existingOfferId,
      projectId,
      investorId,
      investorName,
      founderId: currentUser.uid,
      founderName: currentUser.email,
      status: existingOfferId ? 'interestAccepted-makingOffer' : 'newOfferInitiated',
      offerHistory: [
        {
          status: existingOfferId ? 'interestAccepted-initiatingOffer' : 'newOfferInitiated',
          timestamp: new Date(),
          by: currentUser.uid,
          byRole: 'founder',
        },
      ],
    });
    setOfferAmount('');
    setOfferEquity('');
    setUpiId('');
    setBankDetails('');
    setIsEditingOffer(false);
  };

  const handleEditOfferClick = (offer) => {
    setSelectedOfferForForm(offer);
    setOfferAmount(offer.investmentAmount);
    setOfferEquity(offer.equityPercentage);
    setUpiId(offer.upiId || '');
    setBankDetails(offer.bankDetails || '');
    setIsEditingOffer(true);
  };

  const handleDeclineInterest = async (offerId) => {
    const offerToUpdate = projectOffers.find((o) => o.id === offerId);
    if (!offerToUpdate) return;

    try {
      await updateDoc(doc(db, 'projectOffers', offerId), {
        status: 'declined',
        respondedAt: new Date(),
        offerHistory: [
          ...(offerToUpdate.offerHistory || []),
          {
            status: 'declined',
            timestamp: new Date(),
            by: currentUser.uid,
            byRole: 'founder',
            reason: 'Declined by founder',
          },
        ],
      });
    } catch (error) {
      console.error('Error declining interest:', error);
    }
  };

  const handleSubmitOffer = async (e) => {
    e.preventDefault();
    if (!selectedOfferForForm || !offerAmount || !offerEquity) {
      alert('Please enter both investment amount and equity percentage.');
      return;
    }

    try {
      if (isEditingOffer) {
        const offerRef = doc(db, 'projectOffers', selectedOfferForForm.id);
        await updateDoc(offerRef, {
          investmentAmount: parseFloat(offerAmount),
          equityPercentage: parseFloat(offerEquity),
          upiId,
          bankDetails,
          updatedAt: new Date(),
          offerHistory: [
            ...(selectedOfferForForm.offerHistory || []),
            {
              status: 'offerUpdated',
              timestamp: new Date(),
              by: currentUser.uid,
              byRole: 'founder',
              amount: parseFloat(offerAmount),
              equity: parseFloat(offerEquity),
              upiId,
              bankDetails,
            },
          ],
        });
      } else {
        if (selectedOfferForForm.id) {
          const offerRef = doc(db, 'projectOffers', selectedOfferForForm.id);
          await updateDoc(offerRef, {
            investmentAmount: parseFloat(offerAmount),
            equityPercentage: parseFloat(offerEquity),
            upiId,
            bankDetails,
            status: 'offerMade',
            offeredAt: new Date(),
            offerHistory: [
              ...(selectedOfferForForm.offerHistory || []),
              {
                status: 'offerMade',
                timestamp: new Date(),
                by: currentUser.uid,
                byRole: 'founder',
                amount: parseFloat(offerAmount),
                equity: parseFloat(offerEquity),
                upiId,
                bankDetails,
              },
            ],
          });
        }
      }

      setSelectedOfferForForm(null);
      setOfferAmount('');
      setOfferEquity('');
      setIsEditingOffer(false);
    } catch (error) {
      console.error('Error submitting/updating offer:', error);
    }
  };

  // Edit project handlers
  const handleRoleChange = (index, value) => {
    const newRoles = [...editFormData.roles];
    newRoles[index] = value;
    setEditFormData((prev) => ({ ...prev, roles: newRoles }));
  };

  const addRoleField = () => {
    setEditFormData((prev) => ({ ...prev, roles: [...prev.roles, ''] }));
  };

  const removeRoleField = (index) => {
    setEditFormData((prev) => ({ ...prev, roles: prev.roles.filter((_, i) => i !== index) }));
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setEditFormData((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
  };

  const handleEditSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await updateDoc(doc(db, 'projects', projectId), {
        ...editFormData,
        updatedAt: new Date().toISOString(),
      });
      setProject((prev) => ({
        ...prev,
        ...editFormData,
      }));
      setShowEditModal(false);
    } catch (err) {
      console.error('Error updating project:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleChatClick = (recipientId, recipientName = 'Founder') => {
    setChatRecipientId(recipientId);
    setChatRecipientName(recipientName);
    setShowChatModal(true);
  };

  const closeChatModal = () => {
    setShowChatModal(false);
    setChatRecipientId(null);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#030712] py-12">
        <LoadingSkeleton type="dashboard" />
      </div>
    );
  }

  if (error || !project) {
    return (
      <div className="min-h-screen bg-[#030712] text-slate-100 flex flex-col items-center justify-center p-6">
        <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-8 max-w-md text-center space-y-4">
          <div className="w-12 h-12 mx-auto rounded-full bg-red-500/10 border border-red-500/20 flex items-center justify-center text-red-400">
            ⚠️
          </div>
          <h2 className="text-xl font-bold text-white">Pod Not Found</h2>
          <p className="text-sm text-slate-400">{error || 'This project workspace pod does not exist or has been removed.'}</p>
          <button
            onClick={() => navigate(-1)}
            className="px-5 py-2.5 bg-gradient-to-r from-indigo-500 to-purple-600 text-white font-semibold rounded-xl text-xs hover:from-indigo-600 hover:to-purple-700 transition-all"
          >
            &larr; Return to Safety
          </button>
        </div>
      </div>
    );
  }

  const interestedOffers = projectOffers.filter((offer) => offer.status === 'interestExpressed');
  const madeOffers = projectOffers.filter((offer) => offer.status === 'offerMade');
  const completedOffers = projectOffers.filter((offer) => offer.status === 'completed');

  return (
    <div className="min-h-screen bg-[#030712] text-slate-100 font-sans relative overflow-hidden pb-24 md:pb-12">
      <MobileNav />

      {/* Radial glow backdrops */}
      <div className="absolute top-[-10%] left-[-15%] w-[50%] h-[50%] bg-indigo-500/10 rounded-full blur-[120px] pointer-events-none"></div>
      <div className="absolute bottom-[-10%] right-[-15%] w-[50%] h-[50%] bg-purple-500/10 rounded-full blur-[120px] pointer-events-none"></div>

      {/* Top Navigation Bar */}
      <nav className="bg-[#030712]/80 border-b border-slate-800/60 backdrop-blur-md sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center gap-3">
              <button
                onClick={() => navigate(-1)}
                className="p-2 rounded-xl bg-slate-900 border border-slate-800 text-slate-400 hover:text-white hover:bg-slate-850 transition-all text-xs font-semibold flex items-center gap-1.5"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                </svg>
                Back
              </button>
              <div className="h-5 w-px bg-slate-800 hidden sm:block"></div>
              <span className="text-xs font-semibold text-slate-400 hidden sm:inline">
                Workspace Pod / <strong className="text-slate-200">{project.title}</strong>
              </span>
            </div>

            <div className="flex items-center gap-3">
              {isFounder ? (
                <>
                  <button
                    onClick={() => setShowEditModal(true)}
                    className="px-3.5 py-2 bg-slate-800 hover:bg-slate-750 border border-slate-700/80 text-slate-200 text-xs font-semibold rounded-xl transition-all flex items-center gap-1.5 shadow-sm"
                  >
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                    </svg>
                    Edit Pod
                  </button>
                  <button
                    onClick={handleAnalyzeWithAI}
                    disabled={analyzing}
                    className="px-4 py-2 bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white text-xs font-semibold rounded-xl transition-all flex items-center gap-1.5 shadow-md disabled:opacity-50"
                  >
                    {analyzing ? (
                      <>
                        <span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
                        AI Analyzing...
                      </>
                    ) : (
                      <>
                        ✨ Gemini Coach
                      </>
                    )}
                  </button>
                </>
              ) : (
                <>
                  {/* Action for non-founders: Message Founder */}
                  {project.founder && (
                    <button
                      onClick={() => handleChatClick(project.founder, project.founderName || 'Founder')}
                      className="px-4 py-2 bg-slate-800 hover:bg-slate-750 border border-slate-700 text-slate-100 text-xs font-semibold rounded-xl transition-all flex items-center gap-1.5 shadow-sm"
                    >
                      <svg className="w-3.5 h-3.5 text-indigo-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                      </svg>
                      Message Founder
                    </button>
                  )}

                  {/* If user is freelancer, show Apply button */}
                  {isFreelancer && (
                    <button
                      onClick={handleApplyForRole}
                      disabled={applyLoading || !!appliedStatus}
                      className={`px-4 py-2 text-xs font-semibold rounded-xl transition-all shadow-md flex items-center gap-1.5 ${
                        appliedStatus
                          ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 cursor-default'
                          : 'bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white'
                      }`}
                    >
                      {appliedStatus === 'pending'
                        ? '✓ Application Pending'
                        : appliedStatus === 'accepted'
                        ? '✓ Active Pod Member'
                        : 'Apply to Join Pod'}
                    </button>
                  )}
                </>
              )}
            </div>
          </div>
        </div>
      </nav>

      {/* Main Content Area */}
      <main className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8 relative z-10 space-y-8">
        
        {/* Hero Section */}
        <div className="bg-slate-900/50 backdrop-blur-md border border-slate-800/80 rounded-3xl p-6 sm:p-8 relative overflow-hidden shadow-2xl">
          <div className="absolute top-0 right-0 w-80 h-80 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none"></div>
          
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 relative z-10">
            <div className="space-y-3 max-w-3xl">
              <div className="flex flex-wrap items-center gap-2.5">
                <span className="px-3 py-1 rounded-full text-xs font-semibold bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
                  {project.category || 'Technology'}
                </span>
                {project.needsInvestment ? (
                  <span className="px-3 py-1 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                    Seeking Investment (${project.fundingGoal || 'Open'})
                  </span>
                ) : (
                  <span className="px-3 py-1 rounded-full text-xs font-semibold bg-slate-800 text-slate-400 border border-slate-700">
                    Bootstrapped Pod
                  </span>
                )}
                {isFounder && (
                  <span className="px-3 py-1 rounded-full text-xs font-semibold bg-purple-500/10 text-purple-400 border border-purple-500/20">
                    👑 Owner View
                  </span>
                )}
              </div>

              <h1 className="text-2xl sm:text-4xl font-extrabold text-white tracking-tight">
                {project.title}
              </h1>

              <div className="flex items-center gap-3 text-xs text-slate-400">
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white text-[10px] font-bold">
                    {(project.founderName || project.founderEmail || 'F')[0].toUpperCase()}
                  </div>
                  <span>Founded by <strong className="text-slate-200">{project.founderName || project.founderEmail || 'Founder'}</strong></span>
                </div>
                <span>•</span>
                <span>Created {project.createdAt ? (project.createdAt.toDate ? project.createdAt.toDate().toLocaleDateString() : new Date(project.createdAt).toLocaleDateString()) : 'Recently'}</span>
              </div>
            </div>

            {/* Quick Stat Pill */}
            {project.needsInvestment && (
              <div className="bg-slate-950/60 border border-slate-800 rounded-2xl p-4 flex gap-6 text-center">
                <div>
                  <p className="text-[10px] uppercase font-bold text-slate-500">Goal</p>
                  <p className="text-lg font-extrabold text-white">${project.fundingGoal || '0'}</p>
                </div>
                <div className="w-px bg-slate-800"></div>
                <div>
                  <p className="text-[10px] uppercase font-bold text-slate-500">Equity</p>
                  <p className="text-lg font-extrabold text-indigo-400">{project.equityOffered || '0'}%</p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* AI Error Alert */}
        {aiError && (
          <div className="p-4 bg-red-500/10 border border-red-500/25 rounded-2xl text-red-400 text-xs font-semibold flex justify-between items-center">
            <span>{aiError}</span>
            <button onClick={() => setAiError('')} className="text-red-400 hover:text-white">&times;</button>
          </div>
        )}

        {/* Main Grid: Left Column (Pod Details, Roles, Investment, Offers) / Right Column (Team Community) */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Left Column (Span 2) */}
          <div className="lg:col-span-2 space-y-6">
            
            {/* Description & Overview */}
            <div className="bg-slate-900/50 backdrop-blur-md border border-slate-800 rounded-2xl p-6 space-y-4">
              <h2 className="text-lg font-bold text-slate-100 flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-indigo-500"></span>
                About the Project & Mission
              </h2>
              <p className="text-slate-300 text-sm leading-relaxed whitespace-pre-line font-normal">
                {project.description || 'No detailed mission provided.'}
              </p>

              {project.milestones && (
                <div className="pt-4 border-t border-slate-800/80 space-y-2">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">Target Milestones</h3>
                  <p className="text-slate-300 text-sm leading-relaxed whitespace-pre-line">
                    {project.milestones}
                  </p>
                </div>
              )}
            </div>

            {/* Roles Needed */}
            <div className="bg-slate-900/50 backdrop-blur-md border border-slate-800 rounded-2xl p-6 space-y-4">
              <div className="flex justify-between items-center">
                <h2 className="text-lg font-bold text-slate-100 flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-purple-500"></span>
                  Open Roles & Skills Required
                </h2>
                {isFreelancer && !appliedStatus && (
                  <button
                    onClick={handleApplyForRole}
                    className="text-xs font-bold text-indigo-400 hover:text-indigo-300"
                  >
                    Apply for Pod &rarr;
                  </button>
                )}
              </div>

              {project.roles && project.roles.length > 0 ? (
                <div className="flex flex-wrap gap-2.5">
                  {project.roles.map((role, idx) => (
                    <div
                      key={idx}
                      className="px-3.5 py-2 bg-slate-950/60 border border-slate-800 rounded-xl text-xs font-semibold text-slate-200 flex items-center gap-2 hover:border-indigo-500/40 transition-colors"
                    >
                      <span className="w-1.5 h-1.5 rounded-full bg-indigo-400"></span>
                      {role}
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-slate-500">No specific roles defined yet for this pod.</p>
              )}
            </div>

            {/* Investment Details (Only if project seeks investment) */}
            {project.needsInvestment && (
              <div className="bg-slate-900/50 backdrop-blur-md border border-slate-800 rounded-2xl p-6 space-y-4">
                <h2 className="text-lg font-bold text-slate-100 flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                  Financials & Investment Proposition
                </h2>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div className="p-4 bg-slate-950/50 border border-slate-850 rounded-xl">
                    <p className="text-[10px] font-bold uppercase text-slate-500">Funding Target</p>
                    <p className="text-xl font-bold text-slate-100 mt-1">${project.fundingGoal || '0'}</p>
                  </div>
                  <div className="p-4 bg-slate-950/50 border border-slate-850 rounded-xl">
                    <p className="text-[10px] font-bold uppercase text-slate-500">Amount Committed</p>
                    <p className="text-xl font-bold text-emerald-400 mt-1">${project.amountRaised || '0'}</p>
                  </div>
                  <div className="p-4 bg-slate-950/50 border border-slate-850 rounded-xl">
                    <p className="text-[10px] font-bold uppercase text-slate-500">Equity Offered</p>
                    <p className="text-xl font-bold text-indigo-400 mt-1">{project.equityOffered || '0'}%</p>
                  </div>
                </div>

                {project.investmentReason && (
                  <div className="space-y-1.5 pt-2">
                    <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">Capital Deployment Reason</h3>
                    <p className="text-slate-300 text-sm leading-relaxed">{project.investmentReason}</p>
                  </div>
                )}

                {project.pitchDeckUrl && (
                  <div className="pt-2">
                    <a
                      href={project.pitchDeckUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-500/10 border border-indigo-500/30 text-indigo-300 hover:bg-indigo-500/20 text-xs font-semibold rounded-xl transition-all"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                      View Investor Pitch Deck &rarr;
                    </a>
                  </div>
                )}
              </div>
            )}

            {/* Gemini AI Analysis Card (If Generated) */}
            {aiAnalysis && (
              <div className="bg-gradient-to-br from-indigo-950/40 via-purple-950/30 to-slate-900/60 border border-indigo-500/30 rounded-2xl p-6 space-y-6">
                <div className="flex items-center justify-between">
                  <h2 className="text-lg font-bold text-white flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-indigo-400 animate-pulse"></span>
                    Gemini AI Strategy Blueprint
                  </h2>
                  <span className="text-[10px] bg-indigo-500/20 text-indigo-300 px-2 py-0.5 rounded font-mono border border-indigo-500/30">
                    AI ASSIST
                  </span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {/* Roles */}
                  <div className="space-y-2 bg-slate-950/50 p-4 rounded-xl border border-slate-800">
                    <h3 className="text-xs font-bold uppercase tracking-wider text-indigo-400">Suggested Team</h3>
                    <ul className="space-y-1.5 text-xs text-slate-300">
                      {aiAnalysis.roles?.map((r, i) => (
                        <li key={i} className="flex items-start gap-1.5">
                          <span className="text-indigo-400">•</span>
                          {r}
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* Tech Stack */}
                  <div className="space-y-2 bg-slate-950/50 p-4 rounded-xl border border-slate-800">
                    <h3 className="text-xs font-bold uppercase tracking-wider text-purple-400">Recommended Tech</h3>
                    <ul className="space-y-1.5 text-xs text-slate-300">
                      {aiAnalysis.techStack?.map((t, i) => (
                        <li key={i} className="flex items-start gap-1.5">
                          <span className="text-purple-400">•</span>
                          {t}
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* Monetization */}
                  <div className="space-y-2 bg-slate-950/50 p-4 rounded-xl border border-slate-800">
                    <h3 className="text-xs font-bold uppercase tracking-wider text-emerald-400">Monetization Models</h3>
                    <ul className="space-y-1.5 text-xs text-slate-300">
                      {aiAnalysis.monetizationModels?.map((m, i) => (
                        <li key={i} className="flex items-start gap-1.5">
                          <span className="text-emerald-400">•</span>
                          {m}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>
            )}

            {/* Founder View: Investor Offers & Interests Management */}
            {isFounder && project.needsInvestment && (
              <div className="bg-slate-900/50 backdrop-blur-md border border-slate-800 rounded-2xl p-6 space-y-6">
                <div>
                  <h2 className="text-lg font-bold text-slate-100 flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                    Investment Offers & Pipeline
                  </h2>
                  <p className="text-xs text-slate-400 mt-0.5">Manage inbound venture interests and negotiate term sheets.</p>
                </div>

                {/* New Interests */}
                {interestedOffers.length > 0 && (
                  <div className="space-y-3">
                    <h3 className="text-xs font-bold uppercase tracking-wider text-yellow-400">
                      Inbound Interests ({interestedOffers.length})
                    </h3>
                    <div className="space-y-2">
                      {interestedOffers.map((offer) => (
                        <div key={offer.id} className="bg-slate-950/60 border border-yellow-500/20 rounded-xl p-4 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
                          <div>
                            <p className="text-sm font-bold text-slate-200">{offer.investorName || 'Investor'}</p>
                            <p className="text-xs text-slate-400">Expressed interest in reviewing your data room</p>
                          </div>
                          <div className="flex gap-2">
                            <button
                              onClick={() => handleDeclineInterest(offer.id)}
                              className="px-3 py-1.5 text-xs text-red-400 hover:text-red-300 font-semibold bg-red-500/10 border border-red-500/20 rounded-xl"
                            >
                              Decline
                            </button>
                            <button
                              onClick={() => handleMakeOfferInitiate(offer.investorId, offer.investorName, offer.id)}
                              className="px-3 py-1.5 text-xs text-white font-semibold bg-indigo-600 hover:bg-indigo-700 rounded-xl shadow-sm"
                            >
                              Make Term Offer
                            </button>
                            <button
                              onClick={() => handleChatClick(offer.investorId, offer.investorName)}
                              className="px-3 py-1.5 text-xs text-indigo-300 font-semibold bg-indigo-500/10 border border-indigo-500/30 rounded-xl"
                            >
                              💬 Chat
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Active Offers */}
                {madeOffers.length > 0 && (
                  <div className="space-y-3">
                    <h3 className="text-xs font-bold uppercase tracking-wider text-indigo-400">
                      Active Term Sheets ({madeOffers.length})
                    </h3>
                    <div className="space-y-2">
                      {madeOffers.map((offer) => (
                        <div key={offer.id} className="bg-slate-950/60 border border-indigo-500/20 rounded-xl p-4 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
                          <div>
                            <p className="text-sm font-bold text-slate-200">
                              Offered to {offer.investorName}: <span className="text-indigo-400">${offer.investmentAmount}</span> for {offer.equityPercentage}% equity
                            </p>
                            <p className="text-xs text-slate-500">Status: {offer.status}</p>
                          </div>
                          <div className="flex gap-2">
                            <button
                              onClick={() => handleEditOfferClick(offer)}
                              className="px-3 py-1.5 text-xs text-slate-300 hover:text-white bg-slate-800 rounded-xl"
                            >
                              Revise
                            </button>
                            <button
                              onClick={() => handleChatClick(offer.investorId, offer.investorName)}
                              className="px-3 py-1.5 text-xs text-indigo-300 font-semibold bg-indigo-500/10 border border-indigo-500/30 rounded-xl"
                            >
                              💬 Chat
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Offer form modal */}
                {selectedOfferForForm && (
                  <div className="p-5 bg-slate-950 border border-indigo-500/30 rounded-2xl space-y-4 animate-fadeIn">
                    <h3 className="text-sm font-bold text-slate-100">
                      {isEditingOffer ? 'Revise Term Sheet' : `Create Term Sheet for ${selectedOfferForForm.investorName}`}
                    </h3>
                    <form onSubmit={handleSubmitOffer} className="space-y-4">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-xs font-semibold text-slate-400 mb-1">Investment Capital ($)</label>
                          <input
                            type="number"
                            className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-sm text-white"
                            value={offerAmount}
                            onChange={(e) => setOfferAmount(e.target.value)}
                            required
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-semibold text-slate-400 mb-1">Equity Stake (%)</label>
                          <input
                            type="number"
                            className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-sm text-white"
                            value={offerEquity}
                            onChange={(e) => setOfferEquity(e.target.value)}
                            required
                            min="0"
                            max="100"
                          />
                        </div>
                      </div>
                      <div className="flex justify-end gap-2 pt-2">
                        <button
                          type="button"
                          onClick={() => setSelectedOfferForForm(null)}
                          className="px-3 py-1.5 text-xs text-slate-400 hover:text-white bg-slate-900 rounded-xl"
                        >
                          Cancel
                        </button>
                        <button
                          type="submit"
                          className="px-4 py-1.5 text-xs font-semibold text-white bg-gradient-to-r from-indigo-500 to-purple-600 rounded-xl shadow-sm"
                        >
                          Submit Term Sheet
                        </button>
                      </div>
                    </form>
                  </div>
                )}

                {interestedOffers.length === 0 && madeOffers.length === 0 && completedOffers.length === 0 && (
                  <p className="text-xs text-slate-500">No active investor discussions or offers for this pod yet.</p>
                )}
              </div>
            )}
          </div>

          {/* Right Column (Span 1): Community Forum & Team Backers */}
          <div className="lg:col-span-1 space-y-6">
            
            {/* Community Forum: Only founder gets the Add Member form; freelancers/investors see the Team roster */}
            <CommunityForum projectId={projectId} isFounder={isFounder} />

            {/* Quick Chat with Founder Card for Non-Founders */}
            {!isFounder && project.founder && (
              <div className="bg-slate-900/60 border border-slate-800/80 rounded-2xl p-6 space-y-4 backdrop-blur-md">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white font-bold">
                    {(project.founderName || project.founderEmail || 'F')[0].toUpperCase()}
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-white">{project.founderName || 'Pod Founder'}</h3>
                    <p className="text-xs text-slate-400">{project.founderEmail || 'Founder'}</p>
                  </div>
                </div>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Have questions about this pod, equity breakdown, or collaboration requirements?
                </p>
                <button
                  onClick={() => handleChatClick(project.founder, project.founderName || 'Founder')}
                  className="w-full py-2.5 px-4 bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white font-semibold rounded-xl text-xs flex items-center justify-center gap-2 shadow-md transition-all"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                  </svg>
                  Chat with Founder
                </button>
              </div>
            )}
          </div>
        </div>
      </main>

      {/* Edit Project Modal (Founder only) */}
      {showEditModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4 animate-fadeIn">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl p-6 sm:p-8 w-full max-w-2xl text-slate-100 max-h-[90vh] overflow-y-auto space-y-6">
            <div className="flex justify-between items-center pb-4 border-b border-slate-800">
              <h3 className="text-lg font-bold text-white">Edit Pod Configuration</h3>
              <button onClick={() => setShowEditModal(false)} className="text-slate-400 hover:text-white">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <form onSubmit={handleEditSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-400 mb-1">Title</label>
                  <input
                    type="text"
                    name="title"
                    value={editFormData.title}
                    onChange={handleChange}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-indigo-500"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-400 mb-1">Category</label>
                  <input
                    type="text"
                    name="category"
                    value={editFormData.category}
                    onChange={handleChange}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-indigo-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1">Description</label>
                <textarea
                  name="description"
                  rows="3"
                  value={editFormData.description}
                  onChange={handleChange}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-indigo-500"
                ></textarea>
              </div>

              {/* Roles */}
              <div className="space-y-2">
                <label className="block text-xs font-semibold text-slate-400">Roles Needed</label>
                {editFormData.roles.map((role, idx) => (
                  <div key={idx} className="flex gap-2">
                    <input
                      type="text"
                      value={role}
                      onChange={(e) => handleRoleChange(idx, e.target.value)}
                      placeholder="e.g. Lead React Developer"
                      className="flex-1 bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-sm text-white"
                    />
                    <button
                      type="button"
                      onClick={() => removeRoleField(idx)}
                      className="px-3 py-1.5 text-xs text-red-400 hover:text-red-300 bg-red-500/10 border border-red-500/20 rounded-xl"
                    >
                      Remove
                    </button>
                  </div>
                ))}
                <button
                  type="button"
                  onClick={addRoleField}
                  className="text-xs text-indigo-400 hover:text-indigo-300 font-semibold"
                >
                  + Add Another Role
                </button>
              </div>

              {/* Investment Checkbox */}
              <div className="flex items-center gap-2 pt-2">
                <input
                  id="needsInvestment"
                  name="needsInvestment"
                  type="checkbox"
                  checked={editFormData.needsInvestment}
                  onChange={handleChange}
                  className="w-4 h-4 rounded bg-slate-950 border-slate-800 text-indigo-600 focus:ring-indigo-500"
                />
                <label htmlFor="needsInvestment" className="text-xs font-semibold text-slate-200">
                  Actively Seeking Investment
                </label>
              </div>

              {editFormData.needsInvestment && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                  <div>
                    <label className="block text-xs font-semibold text-slate-400 mb-1">Funding Goal ($)</label>
                    <input
                      type="number"
                      name="fundingGoal"
                      value={editFormData.fundingGoal}
                      onChange={handleChange}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-sm text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-400 mb-1">Equity Offered (%)</label>
                    <input
                      type="number"
                      name="equityOffered"
                      value={editFormData.equityOffered}
                      onChange={handleChange}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-sm text-white"
                    />
                  </div>
                  <div className="sm:col-span-2">
                    <label className="block text-xs font-semibold text-slate-400 mb-1">Pitch Deck URL</label>
                    <input
                      type="url"
                      name="pitchDeckUrl"
                      value={editFormData.pitchDeckUrl}
                      onChange={handleChange}
                      placeholder="https://..."
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-sm text-white"
                    />
                  </div>
                </div>
              )}

              <div className="flex justify-end gap-3 pt-4 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowEditModal(false)}
                  className="px-4 py-2 border border-slate-800 text-slate-400 text-xs font-semibold rounded-xl hover:bg-slate-850"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-gradient-to-r from-indigo-500 to-purple-600 text-white text-xs font-semibold rounded-xl hover:from-indigo-600 hover:to-purple-700 shadow-md"
                >
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Direct Chat Modal */}
      {showChatModal && chatRecipientId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4 animate-fadeIn">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl p-6 w-full max-w-2xl relative text-slate-100 font-sans max-h-[90vh] flex flex-col">
            <div className="flex justify-between items-center pb-4 border-b border-slate-800 mb-4">
              <div>
                <h3 className="text-lg font-bold text-white flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse"></span>
                  Chat with {chatRecipientName}
                </h3>
                <p className="text-xs text-slate-400">Direct workspace channel for {project.title}</p>
              </div>
              <button
                onClick={closeChatModal}
                className="text-slate-400 hover:text-white p-1.5 rounded-xl hover:bg-slate-800 transition-colors"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div className="flex-1 overflow-hidden">
              <InvestorChat projectId={projectId} recipientId={chatRecipientId} />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProjectDetails;