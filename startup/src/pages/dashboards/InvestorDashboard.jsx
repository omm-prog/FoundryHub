// import { useState, useEffect } from 'react';
// import { useNavigate } from 'react-router-dom';
// import { auth } from '../../firebase/config';
// import { getFirestore, doc, getDoc, collection, query, where, getDocs, addDoc, serverTimestamp, updateDoc } from 'firebase/firestore';
// import ProjectCard from '../../components/ProjectCard'; // Assuming ProjectCard can be reused or adapted

// const InvestorDashboard = () => {
//   const [userData, setUserData] = useState(null);
//   const [investmentProjects, setInvestmentProjects] = useState([]);
//   const [loadingProjects, setLoadingProjects] = useState(true);
//   const [projectsError, setProjectsError] = useState('');
//   const [interestedProjects, setInterestedProjects] = useState([]); // To store projects investor has expressed interest in
//   const [interestLoading, setInterestLoading] = useState(true);
//   const [portfolioValue, setPortfolioValue] = useState(0); // Initialize with actual value or 0
//   const [activeInvestments, setActiveInvestments] = useState(0); // Initialize with actual value or 0
//   const [investmentOpportunities, setInvestmentOpportunities] = useState(0); // Initialize with actual value or 0
//   const [searchTerm, setSearchTerm] = useState('');
//   const [filterSector, setFilterSector] = useState('All');
//   const [sortOrder, setSortOrder] = useState('Newest');
//   const [selectedSectors, setSelectedSectors] = useState([]); // State for selected investment sectors
//   const [investmentRange, setInvestmentRange] = useState({ min: '', max: '' }); // State for investment range
//   const [pendingOffers, setPendingOffers] = useState([]); // State to store offers made by founders
//   const [showPaymentModal, setShowPaymentModal] = useState(false); // New state for payment modal visibility
//   const [selectedOfferForPayment, setSelectedOfferForPayment] = useState(null); // New state to store offer details for payment
//   const [investedProjects, setInvestedProjects] = useState([]); // New state to store details of invested projects

//   const navigate = useNavigate();
//   const db = getFirestore();
//   const currentUser = auth.currentUser;

//   useEffect(() => {
//     const checkAuthAndFetchProjects = async () => {
//       if (!currentUser) {
//         navigate('/login');
//         return;
//       }

//       try {
//         const userDoc = await getDoc(doc(db, 'users', currentUser.uid));
//         if (userDoc.exists()) {
//           const data = userDoc.data();
//           if (data.role !== 'investor') {
//             navigate('/dashboard');
//             return;
//           }
//           setUserData(data);

//           // Calculate portfolio value and active investments
//           let totalPortfolioValue = 0;
//           let totalActiveInvestments = 0;
//           const currentInvestedProjects = [];

//           if (data.portfolio) {
//             for (const projectId in data.portfolio) {
//               const investment = data.portfolio[projectId];
//               totalPortfolioValue += investment.totalInvestment || 0;
//               totalActiveInvestments++;
              
//               // Fetch project details to display in the portfolio
//               const projectDocRef = doc(db, 'projects', projectId);
//               const projectDocSnap = await getDoc(projectDocRef);
//               if (projectDocSnap.exists()) {
//                 currentInvestedProjects.push({
//                   id: projectId,
//                   name: projectDocSnap.data().title,
//                   investmentAmount: investment.totalInvestment,
//                   equityPercentage: investment.totalEquity,
//                   lastUpdated: investment.lastUpdated ? investment.lastUpdated.toDate() : null,
//                 });
//               }
//             }
//           }
//           setPortfolioValue(totalPortfolioValue);
//           setActiveInvestments(totalActiveInvestments);
//           setInvestedProjects(currentInvestedProjects);

//           // Fetch projects needing investment
//           setLoadingProjects(true);
//           const projectsQuery = query(collection(db, 'projects'), where('needsInvestment', '==', true));
//           const projectSnapshot = await getDocs(projectsQuery);
//           const projectsList = projectSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
//           setInvestmentProjects(projectsList);

//           // Fetch projects investor has expressed interest in
//           setInterestLoading(true);
//           const interestedQuery = query(
//             collection(db, 'projectInterests'),
//             where('investorId', '==', currentUser.uid)
//           );
//           const interestedSnapshot = await getDocs(interestedQuery);
//           const interestedList = interestedSnapshot.docs.map(doc => doc.data().projectId);
//           setInterestedProjects(interestedList);

//           // Fetch pending offers from founders
//           const offersQuery = query(
//             collection(db, 'projectOffers'),
//             where('investorId', '==', currentUser.uid),
//             where('status', '==', 'offerMade')
//           );
//           const offersSnapshot = await getDocs(offersQuery);
//           const offersList = offersSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
//           setPendingOffers(offersList);

//         } else {
//           navigate('/login'); // User data not found, redirect to login
//         }
//       } catch (error) {
//         console.error('Error fetching data:', error);
//         setProjectsError('Failed to load projects or user data.');
//       } finally {
//         setLoadingProjects(false);
//         setInterestLoading(false);
//       }
//     };

//     checkAuthAndFetchProjects();
//   }, [navigate, currentUser, db]);

//   const handleExpressInterest = async (project) => {
//     if (!currentUser) {
//       alert('Please log in to express interest.');
//       return;
//     }
//     if (interestedProjects.includes(project.id)) {
//       alert('You have already expressed interest in this project.');
//       return;
//     }

//     try {
//       // Add a new document to 'projectOffers' collection
//       await addDoc(collection(db, 'projectOffers'), {
//         projectId: project.id,
//         investorId: currentUser.uid,
//         founderId: project.founder,
//         status: 'interestExpressed', // Initial status
//         expressedAt: serverTimestamp(),
//         offerHistory: [
//           {
//             status: 'interestExpressed',
//             timestamp: new Date(),
//             by: currentUser.uid,
//             byRole: 'investor',
//           },
//         ],
//       });

//       setInterestedProjects(prev => [...prev, project.id]); // Update local state
//       alert(`Interest expressed successfully for ${project.title}! Founder will be notified.`);
//     } catch (error) {
//       console.error('Error expressing interest:', error);
//       alert('Failed to express interest.');
//     }
//   };

//   const handleInitiatePayment = (offer) => {
//     setSelectedOfferForPayment(offer);
//     setShowPaymentModal(true);
//   };

//   const handlePayNow = async (offer) => {
//     if (!currentUser) {
//       alert('Please log in to complete the payment.');
//       return;
//     }

//     try {
//       // Simulate payment success
//       // Update the offer status to 'paid' or 'completed'
//       await updateDoc(doc(db, 'projectOffers', offer.id), {
//         status: 'completed',
//         paidAt: serverTimestamp(),
//         offerHistory: [...offer.offerHistory || [], {
//           status: 'completed',
//           timestamp: new Date(),
//           by: currentUser.uid,
//           byRole: 'investor',
//           amountPaid: offer.investmentAmount,
//         }],
//       });

//       // Update investor's profile to reflect new equity
//       const investorRef = doc(db, 'users', currentUser.uid);
//       const investorDoc = await getDoc(investorRef);
//       if (investorDoc.exists()) {
//         const currentPortfolio = investorDoc.data().portfolio || {};
//         const projectEquity = currentPortfolio[offer.projectId] || { totalInvestment: 0, totalEquity: 0 };

//         const newTotalInvestment = projectEquity.totalInvestment + offer.investmentAmount;
//         const newTotalEquity = projectEquity.totalEquity + offer.equityPercentage;

//         await updateDoc(investorRef, {
//           [`portfolio.${offer.projectId}`]: {
//             totalInvestment: newTotalInvestment,
//             totalEquity: newTotalEquity,
//             lastUpdated: serverTimestamp()
//           }
//         });
//       }

//       alert(`Payment for ${offer.projectId} successful! Your portfolio has been updated.`);
//       setPendingOffers(prev => prev.filter(o => o.id !== offer.id)); // Remove from pending
//     } catch (error) {
//       console.error('Error processing payment:', error);
//       alert('Payment failed. Please try again.');
//     }
//   };

//   const handleLogout = async () => {
//     try {
//       await auth.signOut();
//       navigate('/login');
//     } catch (error) {
//       console.error('Error signing out:', error);
//     }
//   };

//   if (!userData) {
//     return <div>Loading...</div>;
//   }

//   return (
//     <div className="min-h-screen bg-gray-100">
//       <nav className="bg-white shadow-sm">
//         <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
//           <div className="flex justify-between h-16">
//             <div className="flex items-center">
//               <h1 className="text-xl font-bold text-gray-900">Investor Dashboard</h1>
//             </div>
//             <div className="flex items-center space-x-4">
//               <span className="text-gray-600">Welcome, {userData.email}</span>
//               <button
//                 onClick={handleLogout}
//                 className="px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700"
//               >
//                 Logout
//               </button>
//             </div>
//           </div>
//         </div>
//       </nav>

//       <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
//         <div className="px-4 py-6 sm:px-0">
//           <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
//             {/* Portfolio Value Card */}
//             <div className="bg-white overflow-hidden shadow rounded-lg">
//               <div className="p-5">
//                 <div className="flex items-center mb-4">
//                   <div className="flex-shrink-0">
//                     <svg className="h-6 w-6 text-indigo-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
//                       <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
//                     </svg>
//                   </div>
//                   <div className="ml-5 w-0 flex-1">
//                     <dl>
//                       <dt className="text-sm font-medium text-gray-500 truncate">Portfolio Value</dt>
//                       <dd className="text-3xl font-bold text-gray-900">${portfolioValue.toLocaleString()}</dd>
//                     </dl>
//                   </div>
//                 </div>
//                 {/* Placeholder for a chart */}
//                 <div className="h-24 bg-gray-50 rounded-lg flex items-center justify-center text-gray-400 text-sm border border-dashed border-gray-300">
//                   <p>Chart Placeholder</p>
//                 </div>
//                 <p className="mt-2 text-xs text-gray-500">Visual representation of your portfolio breakdown will appear here.</p>
//               </div>
//               <div className="bg-gray-50 px-5 py-3">
//                 <div className="text-sm">
//                   <a href="#" className="font-medium text-indigo-600 hover:text-indigo-500 text-xs">View Portfolio</a>
//                 </div>
//               </div>
//             </div>

//             {/* Invested Projects Section (New) */}
//             <div className="bg-white overflow-hidden shadow rounded-lg lg:col-span-3 mt-8">
//               <div className="p-5">
//                 <h2 className="text-lg font-medium text-gray-900 mb-4">My Investments</h2>
//                 {
//                   investedProjects.length > 0 ? (
//                     <div className="space-y-4">
//                       {investedProjects.map(project => (
//                         <div key={project.id} className="border-b pb-4 last:border-b-0 last:pb-0">
//                           <p className="text-md font-semibold text-gray-800">Project: {project.name}</p>
//                           <p className="text-sm text-gray-700">Investment: ${project.investmentAmount?.toLocaleString()} for {project.equityPercentage}% Equity</p>
//                           {project.lastUpdated && (
//                             <p className="text-xs text-gray-500">Last Updated: {new Date(project.lastUpdated).toLocaleString()}</p>
//                           )}
//                           <button
//                             onClick={() => navigate(`/project/${project.id}`)}
//                             className="mt-2 px-3 py-1 bg-blue-500 text-white rounded-md hover:bg-blue-600 text-xs"
//                           >
//                             View Project Details
//                           </button>
//                         </div>
//                       ))}
//                     </div>
//                   ) : (
//                     <p className="text-gray-600">You have not made any investments yet.</p>
//                   )
//                 }
//               </div>
//             </div>

//             {/* Active Investments Card */}
//             <div className="bg-white overflow-hidden shadow rounded-lg">
//               <div className="p-5">
//                 <div className="flex items-center">
//                   <div className="flex-shrink-0">
//                     <svg className="h-6 w-6 text-indigo-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
//                       <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
//                     </svg>
//                   </div>
//                   <div className="ml-5 w-0 flex-1">
//                     <dl>
//                       <dt className="text-sm font-medium text-gray-500 truncate">Active Investments</dt>
//                       <dd className="text-3xl font-bold text-gray-900">{activeInvestments}</dd>
//                     </dl>
//                   </div>
//                 </div>
//               </div>
//               <div className="bg-gray-50 px-5 py-3">
//                 <div className="text-sm">
//                   <a href="#" className="font-medium text-indigo-600 hover:text-indigo-500 text-xs">View Investments</a>
//                 </div>
//               </div>
//             </div>

//             {/* Investment Opportunities Card */}
//             <div className="bg-white overflow-hidden shadow rounded-lg">
//               <div className="p-5">
//                 <div className="flex items-center">
//                   <div className="flex-shrink-0">
//                     <svg className="h-6 w-6 text-indigo-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
//                       <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
//                     </svg>
//                   </div>
//                   <div className="ml-5 w-0 flex-1">
//                     <dl>
//                       <dt className="text-sm font-medium text-gray-500 truncate">Investment Opportunities</dt>
//                       <dd className="text-3xl font-bold text-gray-900">{investmentOpportunities}</dd>
//                     </dl>
//                   </div>
//                 </div>
//               </div>
//               <div className="bg-gray-50 px-5 py-3">
//                 <div className="text-sm">
//                   <a href="#" className="font-medium text-indigo-600 hover:text-indigo-500 text-xs">Browse Opportunities</a>
//                 </div>
//               </div>
//             </div>
//           </div>

//           {/* Projects Seeking Investment */}
//           <div className="mt-8">
//             <h2 className="text-lg font-medium text-gray-900">Projects Seeking Investment</h2>
//             <div className="flex flex-col sm:flex-row gap-4 mt-4 mb-6">
//               {/* Search Bar */}
//               <input
//                 type="text"
//                 placeholder="Search projects by title or reason..."
//                 value={searchTerm}
//                 onChange={(e) => setSearchTerm(e.target.value)}
//                 className="flex-1 p-2 border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500"
//               />

//               {/* Filter by Sector */}
//               <select
//                 value={filterSector}
//                 onChange={(e) => setFilterSector(e.target.value)}
//                 className="p-2 border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500"
//               >
//                 <option value="All">All Sectors</option>
//                 {/* TODO: Dynamically load sectors from projects or a predefined list */}
//                 <option value="Technology">Technology</option>
//                 <option value="Finance">Finance</option>
//                 <option value="Healthcare">Healthcare</option>
//                 <option value="Food">Food</option>
//                 <option value="Real Estate">Real Estate</option>
//               </select>

//               {/* Sort By */}
//               <select
//                 value={sortOrder}
//                 onChange={(e) => setSortOrder(e.target.value)}
//                 className="p-2 border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500"
//               >
//                 <option value="Newest">Newest</option>
//                 <option value="Oldest">Oldest</option>
//                 <option value="Goal: Low to High">Goal: Low to High</option>
//                 <option value="Goal: High to Low">Goal: High to Low</option>
//               </select>
//             </div>

//             {loadingProjects || interestLoading ? (
//               <p>Loading projects...</p>
//             ) : projectsError ? (
//               <p className="text-red-500">{projectsError}</p>
//             ) : (
//               <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mt-4">
//                 {/* Apply filtering and sorting here */}
//                 {investmentProjects
//                   .filter(project => {
//                     const matchesSearch = project.title.toLowerCase().includes(searchTerm.toLowerCase()) || project.investmentReason.toLowerCase().includes(searchTerm.toLowerCase());
//                     const matchesFilter = filterSector === 'All' || (project.sector && project.sector.includes(filterSector));
//                     return matchesSearch && matchesFilter;
//                   })
//                   .sort((a, b) => {
//                     if (sortOrder === 'Newest') {
//                       // Assuming 'createdAt' or similar timestamp exists for sorting, using a dummy for now.
//                       // For now, no actual sorting logic, as timestamp is not available in current project object.
//                       return 0;
//                     } else if (sortOrder === 'Oldest') {
//                       return 0;
//                     } else if (sortOrder === 'Goal: Low to High') {
//                       return a.fundingGoal - b.fundingGoal;
//                     } else if (sortOrder === 'Goal: High to Low') {
//                       return b.fundingGoal - a.fundingGoal;
//                     }
//                     return 0;
//                   })
//                   .length > 0 ? (
//                   investmentProjects
//                     .filter(project => {
//                       const matchesSearch = project.title.toLowerCase().includes(searchTerm.toLowerCase()) || project.investmentReason.toLowerCase().includes(searchTerm.toLowerCase());
//                       const matchesFilter = filterSector === 'All' || (project.sector && project.sector.includes(filterSector));
//                       return matchesSearch && matchesFilter;
//                     })
//                     .sort((a, b) => {
//                       if (sortOrder === 'Newest') {
//                         // Assuming 'createdAt' or similar timestamp exists for sorting, using a dummy for now.
//                         // For now, no actual sorting logic, as timestamp is not available in current project object.
//                         return 0;
//                       } else if (sortOrder === 'Oldest') {
//                         return 0;
//                       } else if (sortOrder === 'Goal: Low to High') {
//                         return a.fundingGoal - b.fundingGoal;
//                       } else if (sortOrder === 'Goal: High to Low') {
//                         return b.fundingGoal - a.fundingGoal;
//                       }
//                       return 0;
//                     })
//                     .map((project) => {
//                       const foundOffer = pendingOffers.find(offer => offer.projectId === project.id);
//                       return (
//                         <div key={project.id} className="bg-white shadow rounded-lg p-5">
//                           <h3 className="text-lg font-semibold text-gray-900 mb-2">{project.title}</h3>
//                           <p className="text-gray-700 text-sm mb-2">Goal: ${project.fundingGoal}</p>
//                           <p className="text-gray-700 text-sm mb-4">Reason: {project.investmentReason}</p>
//                           {/* Add Funding Progress Bar here */}
//                           <div className="w-full bg-gray-200 rounded-full h-2.5 mb-4">
//                             <div
//                               className="bg-indigo-600 h-2.5 rounded-full"
//                               style={{ width: `${(project.currentFunding / project.fundingGoal) * 100 || 0}%` }}
//                             ></div>
//                           </div>
//                           <p className="text-sm text-gray-600 mb-4">Raised: ${project.currentFunding || 0} of ${project.fundingGoal}</p>

//                           {foundOffer ? (
//                             <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded-md">
//                               <p className="text-sm font-medium text-green-800">Offer Received!</p>
//                               <p className="text-xs text-green-700">Invest: ${foundOffer.investmentAmount} for {foundOffer.equityPercentage}% Equity</p>
//                               <button
//                                 onClick={() => handlePayNow(foundOffer)}
//                                 className="w-full mt-3 px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
//                               >
//                                 Pay Now
//                               </button>
//                             </div>
//                           ) : (
//                             <button
//                               onClick={() => handleExpressInterest(project)}
//                               disabled={interestedProjects.includes(project.id)}
//                               className={`w-full px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white ${interestedProjects.includes(project.id) ? 'bg-gray-400 cursor-not-allowed' : 'bg-indigo-600 hover:bg-indigo-700'} focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500`}
//                             >
//                               {interestedProjects.includes(project.id) ? 'Interest Expressed' : 'Express Interest'}
//                             </button>
//                           )}

//                           <button
//                             onClick={() => navigate(`/project/${project.id}`, { state: { isInvestorView: true } })}
//                             className="w-full mt-2 px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
//                           >
//                             View Details
//                           </button>
//                         </div>
//                       );
//                     })
//                 ) : (
//                   <p className="mt-4 text-gray-500">No projects currently seeking investment matching your criteria.</p>
//                 )}
//               </div>
//             )}
//           </div>

//           {/* Investment Preferences */}
//           <div className="mt-8">
//             <h2 className="text-lg font-medium text-gray-900">Investment Preferences</h2>
//             <div className="mt-4 bg-white shadow rounded-lg">
//               <div className="p-6">
//                 <div className="space-y-4">
//                   <div>
//                     <h3 className="text-sm font-medium text-gray-500">Investment Sectors</h3>
//                     <div className="mt-1">
//                       <select
//                         multiple
//                         value={selectedSectors}
//                         onChange={(e) =>
//                           setSelectedSectors(
//                             Array.from(e.target.selectedOptions, (option) => option.value)
//                           )
//                         }
//                         className="block w-full p-2 border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
//                       >
//                         <option value="Technology">Technology</option>
//                         <option value="Finance">Finance</option>
//                         <option value="Healthcare">Healthcare</option>
//                         <option value="Food">Food</option>
//                         <option value="Real Estate">Real Estate</option>
//                         <option value="Education">Education</option>
//                         <option value="Energy">Energy</option>
//                       </select>
//                       <p className="mt-2 text-xs text-gray-500">Hold Ctrl/Cmd to select multiple sectors.</p>
//                     </div>
//                   </div>
//                   <div>
//                     <h3 className="text-sm font-medium text-gray-500">Investment Range</h3>
//                     <div className="mt-1 flex space-x-2">
//                       <input
//                         type="number"
//                         placeholder="Min Amount"
//                         value={investmentRange.min}
//                         onChange={(e) =>
//                           setInvestmentRange({ ...investmentRange, min: e.target.value })
//                         }
//                         className="block w-1/2 p-2 border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
//                       />
//                       <input
//                         type="number"
//                         placeholder="Max Amount"
//                         value={investmentRange.max}
//                         onChange={(e) =>
//                           setInvestmentRange({ ...investmentRange, max: e.target.value })
//                         }
//                         className="block w-1/2 p-2 border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
//                       />
//                     </div>
//                   </div>
//                   <button
//                     onClick={() => console.log('Preferences Saved:', { selectedSectors, investmentRange })}
//                     className="w-full px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
//                   >
//                     Save Preferences
//                   </button>
//                 </div>
//               </div>
//             </div>
//           </div>

//           {/* Pending Offers */}
//           <div className="mt-8">
//             <h2 className="text-lg font-medium text-gray-900">Pending Offers</h2>
//             <div className="mt-4 bg-white shadow rounded-lg">
//               <div className="p-6">
//                 <div className="space-y-4">
//                   {pendingOffers.length > 0 ? (
//                     pendingOffers.map(offer => (
//                       <div key={offer.id} className="bg-white p-4 rounded-lg shadow mb-4 flex items-center justify-between">
//                         <div>
//                           <p className="text-gray-800"><span className="font-semibold">Offer to {offer.founderName}:</span> ${offer.investmentAmount} for {offer.equityPercentage}% Equity</p>
//                           <p className="text-gray-500 text-sm">Made on: {new Date(offer.offeredAt?.toDate()).toLocaleString()}</p>
//                           {offer.status === 'offerMade' && (
//                             <p className="text-sm text-yellow-600">Status: Pending Investor Acceptance</p>
//                           )}
//                         </div>
//                         <div className="flex space-x-2">
//                           {offer.status === 'offerMade' && (
//                             <button
//                               onClick={() => handleInitiatePayment(offer)}
//                               className="px-3 py-1 bg-green-500 text-white rounded-md hover:bg-green-600 text-sm"
//                             >
//                               Pay Now
//                             </button>
//                           )}
//                           <button
//                             onClick={() => navigate(`/project/${offer.projectId}`)}
//                             className="px-3 py-1 bg-blue-500 text-white rounded-md hover:bg-blue-600 text-sm"
//                           >
//                             View Details
//                           </button>
//                         </div>
//                       </div>
//                     ))
//                   ) : (
//                     <p className="text-gray-600">No pending offers.</p>
//                   )}
//                 </div>
//               </div>
//             </div>
//           </div>

//           {/* Payment Modal */}
//           {showPaymentModal && selectedOfferForPayment && (
//             <div className="fixed inset-0 bg-gray-600 bg-opacity-75 flex items-center justify-center z-50">
//               <div className="bg-white p-6 rounded-lg shadow-xl w-full max-w-md mx-auto">
//                 <h2 className="text-xl font-bold mb-4">Confirm Payment</h2>
//                 <p className="mb-2">You are about to pay <span className="font-semibold">${selectedOfferForPayment.investmentAmount}</span> for <span className="font-semibold">{selectedOfferForPayment.equityPercentage}% equity</span> in the project of {selectedOfferForPayment.founderName}.</p>
//                 <p className="text-sm text-gray-700 mb-4">Please ensure you transfer the exact amount using the details below. Once confirmed, click 'Confirm Payment' to update the offer status in the system.</p>
                
//                 <div className="bg-gray-100 p-4 rounded-md mb-4">
//                   <h3 className="font-semibold text-lg mb-2">Founder's Payment Details:</h3>
//                   {selectedOfferForPayment.upiId && (
//                     <p className="text-gray-800"><strong>UPI ID:</strong> {selectedOfferForPayment.upiId}</p>
//                   )}
//                   {selectedOfferForPayment.bankDetails && (
//                     <div>
//                       <p className="text-gray-800"><strong>Bank Details:</strong></p>
//                       <p className="whitespace-pre-wrap text-gray-800">{selectedOfferForPayment.bankDetails}</p>
//                     </div>
//                   )}
//                   {!selectedOfferForPayment.upiId && !selectedOfferForPayment.bankDetails && (
//                     <p className="text-gray-600">No payment details provided by the founder for this offer.</p>
//                   )}
//                 </div>

//                 <div className="flex justify-end space-x-2">
//                   <button
//                     onClick={() => setShowPaymentModal(false)}
//                     className="px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300"
//                   >
//                     Cancel
//                   </button>
//                   <button
//                     onClick={() => {
//                       handlePayNow(selectedOfferForPayment);
//                       setShowPaymentModal(false);
//                     }}
//                     className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700"
//                   >
//                     Confirm Payment
//                   </button>
//                 </div>
//               </div>
//             </div>
//           )}
//         </div>
//       </main>
//     </div>
//   );
// };

// export default InvestorDashboard; 




import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { auth } from '../../firebase/config';
import { getFirestore, doc, getDoc, collection, query, where, getDocs, addDoc, serverTimestamp, updateDoc } from 'firebase/firestore';
import ProjectCard from '../../components/ProjectCard';

const InvestorDashboard = () => {
  const [userData, setUserData] = useState(null);
  const [investmentProjects, setInvestmentProjects] = useState([]);
  const [loadingProjects, setLoadingProjects] = useState(true);
  const [projectsError, setProjectsError] = useState('');
  const [interestedProjects, setInterestedProjects] = useState([]);
  const [interestLoading, setInterestLoading] = useState(true);
  const [portfolioValue, setPortfolioValue] = useState(0);
  const [activeInvestments, setActiveInvestments] = useState(0);
  const [investmentOpportunities, setInvestmentOpportunities] = useState(0);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterSector, setFilterSector] = useState('All');
  const [sortOrder, setSortOrder] = useState('Newest');
  const [selectedSectors, setSelectedSectors] = useState([]);
  const [investmentRange, setInvestmentRange] = useState({ min: '', max: '' });
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
        const userDoc = await getDoc(doc(db, 'users', currentUser.uid));
        if (userDoc.exists()) {
          const data = userDoc.data();
          if (data.role !== 'investor') {
            navigate('/dashboard');
            return;
          }
          setUserData(data);

          let totalPortfolioValue = 0;
          let totalActiveInvestments = 0;
          const currentInvestedProjects = [];

          if (data.portfolio) {
            for (const projectId in data.portfolio) {
              const investment = data.portfolio[projectId];
              totalPortfolioValue += investment.totalInvestment || 0;
              totalActiveInvestments++;
              
              const projectDocRef = doc(db, 'projects', projectId);
              const projectDocSnap = await getDoc(projectDocRef);
              if (projectDocSnap.exists()) {
                currentInvestedProjects.push({
                  id: projectId,
                  name: projectDocSnap.data().title,
                  investmentAmount: investment.totalInvestment,
                  equityPercentage: investment.totalEquity,
                  lastUpdated: investment.lastUpdated ? investment.lastUpdated.toDate() : null,
                });
              }
            }
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

        } else {
          navigate('/login');
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
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-4 border-blue-500 border-t-transparent mx-auto mb-4"></div>
          <p className="text-gray-600 text-lg">Loading your dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      {/* Navigation */}
      <nav className="bg-white/80 backdrop-blur-md shadow-lg border-b border-white/20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center">
                  <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                  </svg>
                </div>
                <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                  Investor Dashboard
                </h1>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <div className="hidden md:flex items-center space-x-3">
                <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-full flex items-center justify-center">
                  <span className="text-white font-medium text-sm">
                    {userData.email?.charAt(0).toUpperCase()}
                  </span>
                </div>
                <span className="text-gray-700 font-medium">{userData.email}</span>
              </div>
              <button
                onClick={handleLogout}
                className="px-4 py-2 bg-gradient-to-r from-red-500 to-red-600 text-white font-medium rounded-lg hover:from-red-600 hover:to-red-700 transition-all duration-200 shadow-lg hover:shadow-xl"
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          {/* Portfolio Value Card */}
          <div className="bg-white/80 backdrop-blur-md rounded-2xl shadow-xl border border-white/20 overflow-hidden hover:shadow-2xl transition-all duration-300">
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center space-x-3">
                  <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-emerald-600 rounded-xl flex items-center justify-center">
                    <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-600">Portfolio Value</p>
                    <p className="text-2xl font-bold text-gray-900">${portfolioValue.toLocaleString()}</p>
                  </div>
                </div>
                <div className="text-right">
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                    +12.5%
                  </span>
                </div>
              </div>
              <div className="h-20 bg-gradient-to-r from-green-100 to-emerald-100 rounded-xl flex items-center justify-center border border-green-200">
                <div className="text-center">
                  <div className="w-8 h-8 bg-green-500 rounded-full mx-auto mb-2 flex items-center justify-center">
                    <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 12l3-3 3 3 4-4" />
                    </svg>
                  </div>
                  <p className="text-xs text-green-700">Portfolio Growth</p>
                </div>
              </div>
            </div>
          </div>

          {/* Active Investments Card */}
          <div className="bg-white/80 backdrop-blur-md rounded-2xl shadow-xl border border-white/20 overflow-hidden hover:shadow-2xl transition-all duration-300">
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center space-x-3">
                  <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center">
                    <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-600">Active Investments</p>
                    <p className="text-2xl font-bold text-gray-900">{activeInvestments}</p>
                  </div>
                </div>
              </div>
              <div className="h-20 bg-gradient-to-r from-blue-100 to-indigo-100 rounded-xl flex items-center justify-center border border-blue-200">
                <div className="text-center">
                  <div className="w-8 h-8 bg-blue-500 rounded-full mx-auto mb-2 flex items-center justify-center">
                    <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z" />
                    </svg>
                  </div>
                  <p className="text-xs text-blue-700">Active Projects</p>
                </div>
              </div>
            </div>
          </div>

          {/* Investment Opportunities Card */}
          <div className="bg-white/80 backdrop-blur-md rounded-2xl shadow-xl border border-white/20 overflow-hidden hover:shadow-2xl transition-all duration-300">
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center space-x-3">
                  <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-pink-600 rounded-xl flex items-center justify-center">
                    <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                    </svg>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-600">New Opportunities</p>
                    <p className="text-2xl font-bold text-gray-900">{investmentProjects.length}</p>
                  </div>
                </div>
              </div>
              <div className="h-20 bg-gradient-to-r from-purple-100 to-pink-100 rounded-xl flex items-center justify-center border border-purple-200">
                <div className="text-center">
                  <div className="w-8 h-8 bg-purple-500 rounded-full mx-auto mb-2 flex items-center justify-center">
                    <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                  </div>
                  <p className="text-xs text-purple-700">Available Now</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* My Investments Section */}
        {investedProjects.length > 0 && (
          <div className="mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center">
              <svg className="w-6 h-6 text-blue-600 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
              </svg>
              My Portfolio
            </h2>
            <div className="bg-white/80 backdrop-blur-md rounded-2xl shadow-xl border border-white/20">
              <div className="p-6">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {investedProjects.map(project => (
                    <div key={project.id} className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl p-4 border border-blue-200 hover:shadow-lg transition-all duration-200">
                      <div className="flex items-start justify-between mb-3">
                        <h3 className="font-semibold text-gray-900 text-lg">{project.name}</h3>
                        <span className="bg-blue-100 text-blue-800 text-xs font-medium px-2.5 py-0.5 rounded-full">
                          {project.equityPercentage}%
                        </span>
                      </div>
                      <div className="space-y-2">
                        <div className="flex justify-between">
                          <span className="text-sm text-gray-600">Investment:</span>
                          <span className="text-sm font-medium text-gray-900">${project.investmentAmount?.toLocaleString()}</span>
                        </div>
                        {project.lastUpdated && (
                          <div className="flex justify-between">
                            <span className="text-sm text-gray-600">Last Updated:</span>
                            <span className="text-sm text-gray-500">{new Date(project.lastUpdated).toLocaleDateString()}</span>
                          </div>
                        )}
                      </div>
                      <button
                        onClick={() => navigate(`/project/${project.id}`)}
                        className="w-full mt-4 px-4 py-2 bg-gradient-to-r from-blue-500 to-indigo-600 text-white text-sm font-medium rounded-lg hover:from-blue-600 hover:to-indigo-700 transition-all duration-200 shadow-md hover:shadow-lg"
                      >
                        View Details
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Pending Offers Section */}
        {pendingOffers.length > 0 && (
          <div className="mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center">
              <svg className="w-6 h-6 text-yellow-600 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              Pending Offers
            </h2>
            <div className="bg-white/80 backdrop-blur-md rounded-2xl shadow-xl border border-white/20">
              <div className="p-6">
                <div className="space-y-4">
                  {pendingOffers.map(offer => (
                    <div key={offer.id} className="bg-gradient-to-br from-yellow-50 to-orange-50 rounded-xl p-4 border border-yellow-200">
                      <div className="flex items-center justify-between mb-3">
                        <h3 className="font-semibold text-gray-900">Project: {offer.projectId}</h3>
                        <span className="bg-yellow-100 text-yellow-800 text-xs font-medium px-2.5 py-0.5 rounded-full">
                          Pending Payment
                        </span>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                        <div>
                          <span className="text-sm text-gray-600">Investment Amount:</span>
                          <p className="text-lg font-bold text-gray-900">${offer.investmentAmount?.toLocaleString()}</p>
                        </div>
                        <div>
                          <span className="text-sm text-gray-600">Equity Percentage:</span>
                          <p className="text-lg font-bold text-gray-900">{offer.equityPercentage}%</p>
                        </div>
                        <div>
                          <span className="text-sm text-gray-600">Status:</span>
                          <p className="text-sm font-medium text-yellow-700">Awaiting Payment</p>
                        </div>
                      </div>
                      <button
                        onClick={() => handlePayNow(offer)}
                        className="w-full md:w-auto px-6 py-2 bg-gradient-to-r from-green-500 to-emerald-600 text-white font-medium rounded-lg hover:from-green-600 hover:to-emerald-700 transition-all duration-200 shadow-md hover:shadow-lg"
                      >
                        Pay Now
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Investment Opportunities Section */}
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center">
            <svg className="w-6 h-6 text-green-600 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
            Investment Opportunities
          </h2>

          {/* Search and Filter Controls */}
          <div className="bg-white/80 backdrop-blur-md rounded-2xl shadow-xl border border-white/20 p-6 mb-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                </div>
                <input
                  type="text"
                  placeholder="Search projects..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white/80 backdrop-blur-sm"
                />
              </div>
              <select
                value={filterSector}
                onChange={(e) => setFilterSector(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white/80 backdrop-blur-sm"
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
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white/80 backdrop-blur-sm"
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
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-4 border-blue-500 border-t-transparent mx-auto mb-4"></div>
              <p className="text-gray-600">Loading investment opportunities...</p>
            </div>
          ) : projectsError ? (
            <div className="bg-red-50 border border-red-200 rounded-xl p-6 text-center">
              <div className="w-12 h-12 bg-red-100 rounded-full mx-auto mb-4 flex items-center justify-center">
                <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                </svg>
              </div>
              <p className="text-red-700 font-medium">{projectsError}</p>
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
                  <div key={project.id} className="bg-white/80 backdrop-blur-md rounded-2xl shadow-xl border border-white/20 overflow-hidden hover:shadow-2xl transition-all duration-300">
                    <div className="p-6">
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex-1">
                          <h3 className="text-xl font-bold text-gray-900 mb-2">{project.title}</h3>
                          <div className="flex items-center space-x-2 mb-2">
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                              {project.sector || 'General'}
                            </span>
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                              {project.stage || 'Early Stage'}
                            </span>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-sm text-gray-600">Goal</p>
                          <p className="text-lg font-bold text-gray-900">${project.fundingGoal?.toLocaleString() || 'N/A'}</p>
                        </div>
                      </div>
                      
                      <div className="mb-4">
                        <p className="text-gray-700 text-sm line-clamp-3">
                          {project.description || project.investmentReason || 'No description available'}
                        </p>
                      </div>
                      
                      {/* Show investment amount, UPI ID, and Bank Details if available */}
                      {project.investmentAmount && (
                        <p className="text-sm text-indigo-700 font-semibold mb-1">Investment Needed: ${project.investmentAmount}</p>
                      )}
                      {project.upiId && (
                        <p className="text-sm text-gray-700 mb-1">UPI ID: <span className="font-mono">{project.upiId}</span></p>
                      )}
                      {project.bankDetails && (
                        <div className="text-sm text-gray-700 mb-2">
                          <span>Bank Details:</span>
                          <pre className="bg-gray-100 rounded p-2 mt-1 whitespace-pre-wrap">{project.bankDetails}</pre>
                        </div>
                      )}
                      
                      <div className="grid grid-cols-2 gap-4 mb-4">
                        <div>
                          <p className="text-sm text-gray-600">Founded</p>
                          <p className="text-sm font-medium text-gray-900">
                            {project.createdAt ? new Date(project.createdAt.seconds * 1000).getFullYear() : 'N/A'}
                          </p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-600">Raised</p>
                          <p className="text-sm font-medium text-gray-900">
                            ${project.raisedAmount?.toLocaleString() || '0'}
                          </p>
                        </div>
                      </div>
                      
                      {project.fundingGoal && project.raisedAmount && (
                        <div className="mb-4">
                          <div className="flex justify-between text-sm mb-1">
                            <span className="text-gray-600">Progress</span>
                            <span className="text-gray-900 font-medium">
                              {Math.round((project.raisedAmount / project.fundingGoal) * 100)}%
                            </span>
                          </div>
                          <div className="w-full bg-gray-200 rounded-full h-2">
                            <div 
                              className="bg-gradient-to-r from-blue-500 to-indigo-600 h-2 rounded-full transition-all duration-300"
                              style={{ width: `${Math.min((project.raisedAmount / project.fundingGoal) * 100, 100)}%` }}
                            ></div>
                          </div>
                        </div>
                      )}
                      
                      <div className="flex space-x-2">
                        <button
                          onClick={() => navigate(`/project/${project.id}`)}
                          className="flex-1 px-4 py-2 bg-gradient-to-r from-blue-500 to-indigo-600 text-white font-medium rounded-lg hover:from-blue-600 hover:to-indigo-700 transition-all duration-200 shadow-md hover:shadow-lg"
                        >
                          View Details
                        </button>
                        <button
                          onClick={() => handleExpressInterest(project)}
                          disabled={interestedProjects.includes(project.id)}
                          className={`flex-1 px-4 py-2 font-medium rounded-lg transition-all duration-200 shadow-md hover:shadow-lg ${
                            interestedProjects.includes(project.id)
                              ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                              : 'bg-gradient-to-r from-green-500 to-emerald-600 text-white hover:from-green-600 hover:to-emerald-700'
                          }`}
                        >
                          {interestedProjects.includes(project.id) ? 'Interest Expressed' : 'Express Interest'}
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
            </div>
          )}
          
          {!loadingProjects && !interestLoading && !projectsError && investmentProjects.length === 0 && (
            <div className="bg-gray-50 border border-gray-200 rounded-xl p-8 text-center">
              <div className="w-16 h-16 bg-gray-100 rounded-full mx-auto mb-4 flex items-center justify-center">
                <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">No Investment Opportunities Found</h3>
              <p className="text-gray-600 mb-4">There are currently no projects seeking investment that match your criteria.</p>
              <button
                onClick={() => {
                  setSearchTerm('');
                  setFilterSector('All');
                  setSortOrder('Newest');
                }}
                className="px-4 py-2 bg-gradient-to-r from-blue-500 to-indigo-600 text-white font-medium rounded-lg hover:from-blue-600 hover:to-indigo-700 transition-all duration-200 shadow-md hover:shadow-lg"
              >
                Clear Filters
              </button>
            </div>
          )}
        </div>
      </main>

      {/* Payment Modal */}
      {showPaymentModal && selectedOfferForPayment && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-bold text-gray-900">Payment Confirmation</h3>
              <button
                onClick={() => setShowPaymentModal(false)}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            
            <div className="space-y-4 mb-6">
              <div className="bg-gray-50 rounded-xl p-4">
                <h4 className="font-semibold text-gray-900 mb-2">Investment Details</h4>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Project:</span>
                    <span className="font-medium">{selectedOfferForPayment.projectId}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Investment Amount:</span>
                    <span className="font-medium">${selectedOfferForPayment.investmentAmount?.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Equity Percentage:</span>
                    <span className="font-medium">{selectedOfferForPayment.equityPercentage}%</span>
                  </div>
                </div>
              </div>
              
              {/* Show payment details from the project */}
              <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
                <h4 className="font-semibold text-gray-900 mb-2">Founder's Payment Details</h4>
                {(() => {
                  // Find the project for this offer
                  const project = investmentProjects.find(p => p.id === selectedOfferForPayment.projectId);
                  return (
                    <>
                      {project?.upiId && (
                        <p className="text-sm text-gray-700 mb-1">UPI ID: <span className="font-mono">{project.upiId}</span></p>
                      )}
                      {project?.bankDetails && (
                        <div className="text-sm text-gray-700 mb-1">
                          <span>Bank Details:</span>
                          <pre className="bg-gray-100 rounded p-2 mt-1 whitespace-pre-wrap">{project.bankDetails}</pre>
                        </div>
                      )}
                      {!project?.upiId && !project?.bankDetails && (
                        <p className="text-gray-500">No payment details provided by the founder.</p>
                      )}
                    </>
                  );
                })()}
              </div>
            </div>
            
            <div className="flex space-x-3">
              <button
                onClick={() => setShowPaymentModal(false)}
                className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 font-medium rounded-lg hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  handlePayNow(selectedOfferForPayment);
                  setShowPaymentModal(false);
                }}
                className="flex-1 px-4 py-2 bg-gradient-to-r from-green-500 to-emerald-600 text-white font-medium rounded-lg hover:from-green-600 hover:to-emerald-700 transition-all duration-200 shadow-md hover:shadow-lg"
              >
                Confirm Payment
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default InvestorDashboard;