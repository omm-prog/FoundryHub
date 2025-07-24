import { useState, useEffect } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { getFirestore, doc, getDoc, updateDoc, collection, query, where, getDocs, serverTimestamp, onSnapshot, addDoc } from 'firebase/firestore';
import { auth } from '../firebase/config';
import CommunityForum from '../components/CommunityForum';
import InvestorChat from '../components/InvestorChat';

const ProjectDetails = () => {
  const { projectId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const db = getFirestore();
  const [project, setProject] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [isEditing, setIsEditing] = useState(false);
  const [editedDescription, setEditedDescription] = useState('');
  const [aiAnalysis, setAiAnalysis] = useState(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [interestedInvestors, setInterestedInvestors] = useState([]);
  const [investorsLoading, setInvestorsLoading] = useState(true);
  const [investorsError, setInvestorsError] = useState('');
  const [showChatModal, setShowChatModal] = useState(false);
  const [chatRecipientId, setChatRecipientId] = useState(null);
  const [projectOffers, setProjectOffers] = useState([]);
  const [selectedOfferForForm, setSelectedOfferForForm] = useState(null);
  const [offerAmount, setOfferAmount] = useState('');
  const [offerEquity, setOfferEquity] = useState('');
  const [upiId, setUpiId] = useState('');
  const [bankDetails, setBankDetails] = useState('');
  const [isEditingOffer, setIsEditingOffer] = useState(false);

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

  useEffect(() => {
    let unsubscribeOffers = null;

    const fetchProjectDetailsAndOffers = async () => {
      setLoading(true);
      try {
        const projectDoc = await getDoc(doc(db, 'projects', projectId));
        if (projectDoc.exists()) {
          const projectData = projectDoc.data();
          setProject(projectData);
          setEditedDescription(projectData.description);
          setEditFormData({
            title: projectData.title,
            description: projectData.description,
            category: projectData.category,
            roles: projectData.roles || [],
            needsInvestment: projectData.needsInvestment || false,
            fundingGoal: projectData.fundingGoal || '',
            amountRaised: projectData.amountRaised || '',
            equityOffered: projectData.equityOffered || '',
            pitchDeckUrl: projectData.pitchDeckUrl || '',
            milestones: projectData.milestones || '',
            investmentReason: projectData.investmentReason || '',
          });

          if (currentUser) {
            let offersQuery;
            if (projectData.founder === currentUser.uid) {
              offersQuery = query(collection(db, 'projectOffers'), where('projectId', '==', projectId));
            } else {
              offersQuery = query(collection(db, 'projectOffers'), where('projectId', '==', projectId), where('investorId', '==', currentUser.uid));
            }
            
            unsubscribeOffers = onSnapshot(offersQuery, async (snapshot) => {
              const offersList = [];
              for (const docSnapshot of snapshot.docs) {
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
                offersList.push(offer);
              }
              setProjectOffers(offersList);
            }, (err) => {
              console.error("Error fetching project offers:", err);
            });
          }

          if (projectData.needsInvestment) {
            setInvestorsLoading(true);
            try {
              const q = query(collection(db, 'projectInterests'), where('projectId', '==', projectId));
              const querySnapshot = await getDocs(q);
              const investorIds = querySnapshot.docs.map(doc => doc.data().investorId);

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
      } catch (error) {
        console.error('Error fetching project:', error);
        setError('Failed to load project');
      } finally {
        setLoading(false);
      }
    };

    fetchProjectDetailsAndOffers();

    return () => {
      if (unsubscribeOffers) {
        unsubscribeOffers();
      }
    };
  }, [projectId, db, currentUser]);

  const handleMakeOfferInitiate = (investorId, investorName, existingOfferId = null) => {
    setSelectedOfferForForm({
      id: existingOfferId,
      projectId,
      investorId,
      investorName,
      founderId: currentUser.uid,
      founderName: currentUser.email,
      status: existingOfferId ? 'interestAccepted-makingOffer' : 'newOfferInitiated',
      offerHistory: [{
        status: existingOfferId ? 'interestAccepted-initiatingOffer' : 'newOfferInitiated',
        timestamp: new Date(),
        by: currentUser.uid,
        byRole: 'founder',
      }]
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

  const handleViewOfferHistory = (offer) => {
    console.log("Offer History:", offer.offerHistory);
    alert("View history functionality to be implemented. Check console for details.");
  };

  const handleDeclineInterest = async (offerId) => {
    const offerToUpdate = projectOffers.find(o => o.id === offerId);
    if (!offerToUpdate) return;

    try {
      await updateDoc(doc(db, 'projectOffers', offerId), {
        status: 'declined',
        respondedAt: new Date(),
        offerHistory: [...offerToUpdate.offerHistory || [], {
          status: 'declined',
          timestamp: new Date(),
          by: currentUser.uid,
          byRole: 'founder',
          reason: 'Declined by founder',
        }],
      });
      alert("Interest declined.");
    } catch (error) {
      console.error("Error declining interest:", error);
      alert("Failed to decline interest.");
    }
  };

  const handleSubmitOffer = async (e) => {
    e.preventDefault();
    if (!selectedOfferForForm || !offerAmount || !offerEquity) {
      alert("Please enter both investment amount and equity percentage.");
      return;
    }

    try {
      if (isEditingOffer) {
        const offerRef = doc(db, 'projectOffers', selectedOfferForForm.id);
        await updateDoc(offerRef, {
          investmentAmount: parseFloat(offerAmount),
          equityPercentage: parseFloat(offerEquity),
          upiId: upiId,
          bankDetails: bankDetails,
          updatedAt: new Date(),
          offerHistory: [...selectedOfferForForm.offerHistory || [], {
            status: 'offerUpdated',
            timestamp: new Date(),
            by: currentUser.uid,
            byRole: 'founder',
            amount: parseFloat(offerAmount),
            equity: parseFloat(offerEquity),
            upiId: upiId,
            bankDetails: bankDetails,
          }],
        });
        alert('Offer updated successfully!');
      } else {
        if (selectedOfferForForm.id) {
          const offerRef = doc(db, 'projectOffers', selectedOfferForForm.id);
          await updateDoc(offerRef, {
            investmentAmount: parseFloat(offerAmount),
            equityPercentage: parseFloat(offerEquity),
            upiId: upiId,
            bankDetails: bankDetails,
            status: 'offerMade',
            offeredAt: new Date(),
            offerHistory: [...selectedOfferForForm.offerHistory || [], {
              status: 'offerMade',
              timestamp: new Date(),
              by: currentUser.uid,
              byRole: 'founder',
              amount: parseFloat(offerAmount),
              equity: parseFloat(offerEquity),
              upiId: upiId,
              bankDetails: bankDetails,
            }],
          });
          alert('Offer submitted successfully!');
        } else {
          alert("Error: Cannot make a brand new offer directly. This flow is for responding to expressed interest.");
          return;
        }
      }

      setSelectedOfferForForm(null);
      setOfferAmount('');
      setOfferEquity('');
      setIsEditingOffer(false);
    } catch (error) {
      console.error('Error submitting/updating offer:', error);
      alert('Failed to submit/update offer.');
    }
  };

  const handleEditSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await updateDoc(doc(db, 'projects', projectId), {
        ...editFormData,
        updatedAt: new Date().toISOString()
      });
      
      setProject(prev => ({
        ...prev,
        ...editFormData
      }));
      
      setShowEditModal(false);
    } catch (error) {
      console.error('Error updating project:', error);
      setError('Failed to update project');
    } finally {
      setLoading(false);
    }
  };

  const handleRoleChange = (index, value) => {
    const newRoles = [...editFormData.roles];
    newRoles[index] = value;
    setEditFormData(prev => ({
      ...prev,
      roles: newRoles
    }));
  };

  const addRoleField = () => {
    setEditFormData(prev => ({
      ...prev,
      roles: [...prev.roles, '']
    }));
  };

  const removeRoleField = (index) => {
    setEditFormData(prev => ({
      ...prev,
      roles: prev.roles.filter((_, i) => i !== index)
    }));
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setEditFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
    if (name === 'needsInvestment' && !checked) {
      setEditFormData(prev => ({
        ...prev,
        fundingGoal: '',
        amountRaised: '',
        equityOffered: '',
        pitchDeckUrl: '',
        milestones: '',
        investmentReason: '',
      }));
    }
  };

  const handleAnalyzeWithAI = async () => {
    setAnalyzing(true);
    setError('');
    try {
      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer sk-proj-------ect-specific-api-key`
        },
        body: JSON.stringify({
          model: "gpt-3.5-turbo",
          messages: [
            {
              role: "system",
              content: "You are a startup project analyzer. Provide your analysis in a structured JSON format."
            },
            {
              role: "user",
              content: `Analyze this startup project description and provide a structured response in JSON format with the following keys:
              1. roles: Array of suggested roles needed for the project
              2. techStack: Array of recommended technologies
              3. monetizationModels: Array of potential monetization strategies
              
              Project Description: ${editedDescription}
              
              Format the response as a valid JSON object.`
            }
          ],
          temperature: 0.7
        })
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => null);
        throw new Error(errorData?.error?.message || `HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      
      if (!data.choices || !data.choices[0] || !data.choices[0].message || !data.choices[0].message.content) {
        throw new Error('Invalid response format from OpenAI API');
      }

      const analysisText = data.choices[0].message.content;
      
      try {
        const analysis = JSON.parse(analysisText);
        
        if (!analysis.roles || !analysis.techStack || !analysis.monetizationModels) {
          throw new Error('Invalid analysis structure');
        }

        setAiAnalysis(analysis);

        await updateDoc(doc(db, 'projects', projectId), {
          aiAnalysis: analysis
        });
      } catch (parseError) {
        console.error('Error parsing AI response:', parseError);
        setError('Failed to parse AI analysis. Please try again.');
      }
    } catch (error) {
      console.error('Error analyzing with AI:', error);
      setError(error.message || 'Failed to analyze project with AI');
    } finally {
      setAnalyzing(false);
    }
  };

  const handleSaveDescription = async () => {
    try {
      await updateDoc(doc(db, 'projects', projectId), {
        description: editedDescription
      });
      setProject(prev => ({ ...prev, description: editedDescription }));
      setIsEditing(false);
    } catch (error) {
      console.error('Error updating description:', error);
      setError('Failed to update description');
    }
  };

  const handleChatClick = (recipientId) => {
    setChatRecipientId(recipientId);
    setShowChatModal(true);
  };

  const closeChatModal = () => {
    setShowChatModal(false);
    setChatRecipientId(null);
  };

  const isFounder = currentUser && project && currentUser.uid === project.founder;
  const isFreelancerView = location.state?.isFreelancerView || false;
  const isInvestorView = location.state?.isInvestorView || false;

  console.log("Current User UID:", currentUser?.uid);
  console.log("Project Founder UID:", project?.founder);
  console.log("Is Founder:", isFounder);
  console.log("Is Freelancer View:", isFreelancerView);
  console.log("Interested Investors Length:", interestedInvestors.length);
  console.log("Project Offers Length:", projectOffers.length);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <p className="text-sm text-gray-500">Loading project details...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <p className="text-red-500">{error}</p>
      </div>
    );
  }

  if (!project) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <p className="text-gray-500">Project not found.</p>
      </div>
    );
  }

  const interestedOffers = projectOffers.filter(offer => offer.status === 'interestExpressed');
  const madeOffers = projectOffers.filter(offer => offer.status === 'offerMade');
  const completedOffers = projectOffers.filter(offer => offer.status === 'completed');

  return (
    <div className="min-h-screen bg-gray-100 p-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <div className="bg-white shadow overflow-hidden sm:rounded-lg">
              {isFounder && project.needsInvestment && (
                <div className="p-6 border-b border-gray-200">
                  <h3 className="text-lg font-medium leading-6 text-gray-900 mb-4">Investment Offers & Interests</h3>

                  {interestedOffers.length > 0 && (
                    <div className="mb-6">
                      <h4 className="text-md font-semibold text-gray-700 mb-3">New Investor Interests ({interestedOffers.length})</h4>
                      <ul className="space-y-3">
                        {interestedOffers.map(offer => (
                          <li key={offer.id} className="bg-yellow-50 border border-yellow-200 rounded-md p-4 flex justify-between items-center">
                            <div>
                              <p className="text-sm font-medium text-yellow-800">
                                <span className="font-bold">{offer.investorName || offer.investorId}</span> is interested!
                              </p>
                              <p className="text-xs text-yellow-700 mt-1">Expressed on: {new Date(offer.expressedAt?.toDate()).toLocaleString()}</p>
                            </div>
                            <div className="flex space-x-2">
                              <button
                                onClick={() => handleDeclineInterest(offer.id)}
                                className="inline-flex items-center px-3 py-1.5 border border-transparent text-xs font-medium rounded-md text-yellow-800 bg-yellow-200 hover:bg-yellow-300 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-yellow-500"
                              >
                                Decline
                              </button>
                              <button
                                onClick={() => handleMakeOfferInitiate(offer.investorId, offer.investorName, offer.id)}
                                className="inline-flex items-center px-3 py-1.5 border border-transparent text-xs font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                              >
                                Make Offer
                              </button>
                            </div>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {madeOffers.length > 0 && (
                    <div className="mb-6">
                      <h4 className="text-md font-semibold text-gray-700 mb-3">Offers You've Made ({madeOffers.length})</h4>
                      <ul className="space-y-3">
                        {madeOffers.map(offer => (
                          <li key={offer.id} className="bg-blue-50 border border-blue-200 rounded-md p-4 flex justify-between items-center">
                            <div>
                              <p className="text-sm font-medium text-blue-800">
                                Offer to <span className="font-bold">{offer.investorName || offer.investorId}</span>: ${offer.investmentAmount} for {offer.equityPercentage}% Equity
                              </p>
                              <p className="text-xs text-blue-700 mt-1">Made on: {new Date(offer.offeredAt?.toDate()).toLocaleString()}</p>
                            </div>
                            <div className="flex space-x-2">
                              <button
                                onClick={() => handleEditOfferClick(offer)}
                                className="inline-flex items-center px-3 py-1.5 border border-transparent text-xs font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                              >
                                Edit Offer
                              </button>
                              <button
                                onClick={() => handleViewOfferHistory(offer)}
                                className="inline-flex items-center px-3 py-1.5 border border-gray-300 text-xs font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                              >
                                View History
                              </button>
                            </div>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {completedOffers.length > 0 && (
                    <div className="mb-6">
                      <h4 className="text-md font-semibold text-gray-700 mb-3">Completed Investments ({completedOffers.length})</h4>
                      <ul className="space-y-3">
                        {completedOffers.map(offer => (
                          <li key={offer.id} className="bg-green-50 border border-green-200 rounded-md p-4 flex justify-between items-center">
                            <div>
                              <p className="text-sm font-medium text-green-800">
                                <span className="font-bold">{offer.investorName || offer.investorId}</span> Invested: ${offer.investmentAmount} for {offer.equityPercentage}% Equity
                              </p>
                              <p className="text-xs text-green-700 mt-1">Completed on: {new Date(offer.paidAt?.toDate()).toLocaleString()}</p>
                            </div>
                            <div>
                              <button
                                onClick={() => handleViewOfferHistory(offer)}
                                className="inline-flex items-center px-3 py-1.5 border border-gray-300 text-xs font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                              >
                                View History
                              </button>
                            </div>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {selectedOfferForForm && (
                    <div className="mt-8 p-6 bg-white shadow rounded-lg border border-gray-200">
                      <h3 className="text-lg font-medium leading-6 text-gray-900 mb-4">
                        {isEditingOffer ? `Edit Offer for ${selectedOfferForForm.investorName || selectedOfferForForm.investorId}` : `Make an Offer to ${selectedOfferForForm.investorName || selectedOfferForForm.investorId}`}
                      </h3>
                      <form onSubmit={handleSubmitOffer}>
                        <div className="mb-4">
                          <label htmlFor="investmentAmount" className="block text-sm font-medium text-gray-700">Investment Amount ($)</label>
                          <input
                            type="number"
                            id="investmentAmount"
                            className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"
                            value={offerAmount}
                            onChange={(e) => setOfferAmount(e.target.value)}
                            required
                          />
                        </div>
                        <div className="mb-4">
                          <label htmlFor="equityPercentage" className="block text-sm font-medium text-gray-700">Equity Percentage (%)</label>
                          <input
                            type="number"
                            id="equityPercentage"
                            className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"
                            value={offerEquity}
                            onChange={(e) => setOfferEquity(e.target.value)}
                            required
                            min="0"
                            max="100"
                          />
                        </div>
                        {currentUser && project?.founder === currentUser.uid && (
                          <>
                            <div className="mb-4">
                              <label htmlFor="upiId" className="block text-sm font-medium text-gray-700">UPI ID (Optional)</label>
                              <input
                                type="text"
                                id="upiId"
                                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"
                                value={upiId}
                                onChange={(e) => setUpiId(e.target.value)}
                                placeholder="e.g., yourname@bankname"
                              />
                            </div>
                            <div className="mb-4">
                              <label htmlFor="bankDetails" className="block text-sm font-medium text-gray-700">Bank Details (Optional)</label>
                              <textarea
                                id="bankDetails"
                                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"
                                value={bankDetails}
                                onChange={(e) => setBankDetails(e.target.value)}
                                rows="3"
                                placeholder="Account Holder Name, Account Number, IFSC Code, Bank Name"
                              ></textarea>
                            </div>
                          </>
                        )}
                        <div className="flex justify-end space-x-2">
                          <button
                            type="button"
                            onClick={() => setSelectedOfferForForm(null)}
                            className="px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300"
                          >
                            Cancel
                          </button>
                          <button
                            type="submit"
                            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                          >
                            Submit Offer
                          </button>
                        </div>
                      </form>
                    </div>
                  )}

                  {interestedOffers.length === 0 && madeOffers.length === 0 && completedOffers.length === 0 && (
                    <p className="text-gray-500 mt-4">No active investor interests or offers for this project.</p>
                  )}
                </div>
              )}

              {/* Communication Section */}
              {project && currentUser && !isFreelancerView && (
                <div className="bg-white dark:bg-gray-800 shadow rounded-lg mb-6 p-4">
                  <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">Communication</h3>
                  {project.founder !== currentUser.uid && (
                    <button
                      onClick={() => handleChatClick(project.founder)}
                      className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-lg shadow-md transition duration-300 ease-in-out mr-2"
                    >
                      Chat with Founder
                    </button>
                  )}

                  {project.founder === currentUser.uid && (
                    <>
                      {interestedInvestors.length > 0 && (
                        <div className="mt-4">
                          <h4 className="font-semibold text-gray-800 dark:text-white">Chat with Interested Investors:</h4>
                          <div className="flex flex-wrap gap-2 mt-2">
                            {interestedInvestors.map(investor => (
                              <button
                                key={investor.id}
                                onClick={() => handleChatClick(investor.id)}
                                className="bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-4 rounded-lg shadow-md transition duration-300 ease-in-out"
                              >
                                Chat with {investor.name || investor.email}
                              </button>
                            ))}
                          </div>
                        </div>
                      )}

                      {projectOffers.length > 0 && (
                        <div className="mt-4">
                          <h4 className="font-semibold text-gray-800 dark:text-white">Chat with Investors who made Offers:</h4>
                          <div className="flex flex-wrap gap-2 mt-2">
                            {projectOffers.map(offer => (
                              <button
                                key={offer.id}
                                onClick={() => handleChatClick(offer.investorId)}
                                className="bg-purple-600 hover:bg-purple-700 text-white font-bold py-2 px-4 rounded-lg shadow-md transition duration-300 ease-in-out"
                              >
                                Chat about Offer from {offer.investorName || offer.investorEmail}
                              </button>
                            ))}
                          </div>
                        </div>
                      )}
                    </>
                  )}
                </div>
              )}

              <div className="px-4 py-5 sm:px-6">
                <h3 className="text-lg leading-6 font-medium text-gray-900">Project Details</h3>
                <p className="text-gray-600 dark:text-gray-400">Detailed information about the project.</p>
              </div>
              <div className="p-4">
                {project && (
                  <div className="space-y-4">
                    <p><strong className="font-semibold">Title:</strong> {project.title}</p>
                    <p><strong className="font-semibold">Description:</strong> {project.description}</p>
                    <p><strong className="font-semibold">Category:</strong> {project.category}</p>
                    {project.roles && project.roles.length > 0 && (
                      <p><strong className="font-semibold">Roles:</strong> {project.roles.join(', ')}</p>
                    )}
                    {!isFreelancerView && project.needsInvestment && (
                      <>
                        <p><strong className="font-semibold">Needs Investment:</strong> Yes</p>
                        <p><strong className="font-semibold">Funding Goal:</strong> {project.fundingGoal}</p>
                        <p><strong className="font-semibold">Amount Raised:</strong> {project.amountRaised}</p>
                        <p><strong className="font-semibold">Equity Offered:</strong> {project.equityOffered}%</p>
                        {project.pitchDeckUrl && (
                          <p><strong className="font-semibold">Pitch Deck:</strong> <a href={project.pitchDeckUrl} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">View Pitch Deck</a></p>
                        )}
                        <p><strong className="font-semibold">Milestones:</strong> {project.milestones}</p>
                        <p><strong className="font-semibold">Investment Reason:</strong> {project.investmentReason}</p>
                      </>
                    )}
                    {!isFreelancerView && !project.needsInvestment && (
                      <p><strong className="font-semibold">Needs Investment:</strong> No</p>
                    )}
                    {isFreelancerView && (
                      <p><strong className="font-semibold">Needs Investment:</strong> {project.needsInvestment ? 'Yes' : 'No'}</p>
                    )}
                    <p><strong className="font-semibold">Created At:</strong> {project.createdAt ? (project.createdAt.toDate ? project.createdAt.toDate().toLocaleString() : new Date(project.createdAt).toLocaleString()) : 'N/A'}</p>
                    <p><strong className="font-semibold">Founder:</strong> {project.founderName || project.founderEmail || 'N/A'}</p>
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="lg:col-span-1">
            <CommunityForum projectId={projectId} />
          </div>
        </div>
      </div>

      {showEditModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-75 overflow-y-auto h-full w-full flex justify-center items-center z-50">
          <div className="relative p-5 border w-full max-w-2xl md:max-w-3xl lg:max-w-4xl shadow-lg rounded-md bg-white mx-4 my-8">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Edit Project</h3>
            <form onSubmit={handleEditSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="title" className="block text-sm font-medium text-gray-700">Title</label>
                  <input
                    type="text"
                    name="title"
                    id="title"
                    value={editFormData.title}
                    onChange={handleChange}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                  />
                </div>
                <div>
                  <label htmlFor="category" className="block text-sm font-medium text-gray-700">Category</label>
                  <input
                    type="text"
                    name="category"
                    id="category"
                    value={editFormData.category}
                    onChange={handleChange}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                  />
                </div>
              </div>
              <div>
                <label htmlFor="description" className="block text-sm font-medium text-gray-700">Description</label>
                <textarea
                  name="description"
                  id="description"
                  rows="3"
                  value={editFormData.description}
                  onChange={handleChange}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                ></textarea>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">Roles Needed</label>
                {editFormData.roles.map((role, index) => (
                  <div key={index} className="flex items-center mt-2">
                    <input
                      type="text"
                      value={role}
                      onChange={(e) => handleRoleChange(index, e.target.value)}
                      className="flex-1 rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                      placeholder="e.g., UI/UX Designer"
                    />
                    <button
                      type="button"
                      onClick={() => removeRoleField(index)}
                      className="ml-2 text-red-600 hover:text-red-900"
                    >
                      Remove
                    </button>
                  </div>
                ))}
                <button
                  type="button"
                  onClick={addRoleField}
                  className="mt-2 inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                >
                  Add Role
                </button>
              </div>

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
                  Seeking Investment
                </label>
              </div>

              {editFormData.needsInvestment && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="fundingGoal" className="block text-sm font-medium text-gray-700">Funding Goal</label>
                    <input
                      type="number"
                      name="fundingGoal"
                      id="fundingGoal"
                      value={editFormData.fundingGoal}
                      onChange={handleChange}
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                      placeholder="e.g., 50000"
                    />
                  </div>
                  <div>
                    <label htmlFor="amountRaised" className="block text-sm font-medium text-gray-700">Amount Raised</label>
                    <input
                      type="number"
                      name="amountRaised"
                      id="amountRaised"
                      value={editFormData.amountRaised}
                      onChange={handleChange}
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                      placeholder="e.g., 10000"
                    />
                  </div>
                  <div>
                    <label htmlFor="equityOffered" className="block text-sm font-medium text-gray-700">Equity Offered (%)</label>
                    <input
                      type="number"
                      name="equityOffered"
                      id="equityOffered"
                      value={editFormData.equityOffered}
                      onChange={handleChange}
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                      placeholder="e.g., 10"
                      min="0" max="100"
                    />
                  </div>
                  <div>
                    <label htmlFor="pitchDeckUrl" className="block text-sm font-medium text-gray-700">Pitch Deck URL</label>
                    <input
                      type="url"
                      name="pitchDeckUrl"
                      id="pitchDeckUrl"
                      value={editFormData.pitchDeckUrl}
                      onChange={handleChange}
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                      placeholder="e.g., https://example.com/pitch-deck.pdf"
                    />
                  </div>
                  <div className="col-span-2">
                    <label htmlFor="milestones" className="block text-sm font-medium text-gray-700">Milestones</label>
                    <textarea
                      name="milestones"
                      id="milestones"
                      rows="2"
                      value={editFormData.milestones}
                      onChange={handleChange}
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                      placeholder="e.g., Q1: Prototype, Q2: Beta Launch, Q3: First 1000 Users"
                    ></textarea>
                  </div>
                  <div className="col-span-2">
                    <label htmlFor="investmentReason" className="block text-sm font-medium text-gray-700">Reason for Investment</label>
                    <textarea
                      name="investmentReason"
                      id="investmentReason"
                      rows="2"
                      value={editFormData.investmentReason}
                      onChange={handleChange}
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                      placeholder="Explain why you are seeking investment and how it will be used."
                    ></textarea>
                  </div>
                </div>
              )}

              <div className="flex justify-end mt-4">
                <button
                  type="button"
                  onClick={() => setShowEditModal(false)}
                  className="mr-2 inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                >
                  {loading ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showChatModal && chatRecipientId && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-75 overflow-y-auto h-full w-full flex justify-center items-center z-50">
          <div className="relative p-5 border w-full max-w-2xl md:max-w-3xl lg:max-w-4xl shadow-lg rounded-md bg-white mx-4 my-8">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-medium text-gray-900">Project Chat</h3>
              <button
                onClick={closeChatModal}
                className="text-gray-400 hover:text-gray-600"
              >
                <span className="sr-only">Close</span>
                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <InvestorChat projectId={projectId} recipientId={chatRecipientId} />
          </div>
        </div>
      )}
    </div>
  );
};

export default ProjectDetails;