import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { auth } from '../../firebase/config';
import { getFirestore, doc, getDoc, collection, query, where, getDocs } from 'firebase/firestore';

const BuyerDashboard = () => {
  const [userData, setUserData] = useState(null);
  const navigate = useNavigate();
  const db = getFirestore();
  const [forSaleProjects, setForSaleProjects] = useState([]);

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
          if (data.role !== 'buyer') {
            navigate('/dashboard');
            return;
          }
          setUserData(data);
        }
      } catch (error) {
        console.error('Error fetching user data:', error);
      }
    };

    checkAuth();

    // Fetch projects for sale
    const fetchForSaleProjects = async () => {
      try {
        const projectsRef = collection(db, 'projects');
        const q = query(projectsRef, where('forSale', '==', true));
        const querySnapshot = await getDocs(q);
        const projectsList = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        setForSaleProjects(projectsList);
      } catch (error) {
        console.error('Error fetching for sale projects:', error);
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

  if (!userData) {
    return <div>Loading...</div>;
  }

  return (
    <div className="min-h-screen bg-gray-100">
      <nav className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <h1 className="text-xl font-bold text-gray-900">Buyer Dashboard</h1>
            </div>
            <div className="flex items-center space-x-4">
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
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {/* Active Orders Card */}
            <div className="bg-white overflow-hidden shadow rounded-lg">
              <div className="p-5">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <svg className="h-6 w-6 text-indigo-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                    </svg>
                  </div>
                  <div className="ml-5 w-0 flex-1">
                    <dl>
                      <dt className="text-sm font-medium text-gray-500 truncate">Active Orders</dt>
                      <dd className="text-lg font-medium text-gray-900">0</dd>
                    </dl>
                  </div>
                </div>
              </div>
              <div className="bg-gray-50 px-5 py-3">
                <div className="text-sm">
                  <a href="#" className="font-medium text-indigo-600 hover:text-indigo-500">View Orders</a>
                </div>
              </div>
            </div>

            {/* Saved Projects Card */}
            <div className="bg-white overflow-hidden shadow rounded-lg">
              <div className="p-5">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <svg className="h-6 w-6 text-indigo-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
                    </svg>
                  </div>
                  <div className="ml-5 w-0 flex-1">
                    <dl>
                      <dt className="text-sm font-medium text-gray-500 truncate">Saved Projects</dt>
                      <dd className="text-lg font-medium text-gray-900">0</dd>
                    </dl>
                  </div>
                </div>
              </div>
              <div className="bg-gray-50 px-5 py-3">
                <div className="text-sm">
                  <a href="#" className="font-medium text-indigo-600 hover:text-indigo-500">View Saved</a>
                </div>
              </div>
            </div>

            {/* Available Projects Card */}
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
                      <dt className="text-sm font-medium text-gray-500 truncate">Available Projects</dt>
                      <dd className="text-lg font-medium text-gray-900">0</dd>
                    </dl>
                  </div>
                </div>
              </div>
              <div className="bg-gray-50 px-5 py-3">
                <div className="text-sm">
                  <a href="#" className="font-medium text-indigo-600 hover:text-indigo-500">Browse Projects</a>
                </div>
              </div>
            </div>
          </div>

          {/* Projects For Sale Section */}
          <div className="mt-8">
            <h2 className="text-lg font-medium text-gray-900 mb-4">Projects For Sale</h2>
            {forSaleProjects.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {forSaleProjects.map(project => (
                  <div key={project.id} className="bg-white shadow rounded-lg p-5">
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">{project.title}</h3>
                    <p className="text-gray-700 text-sm mb-2">{project.description}</p>
                    <p className="text-gray-600 text-sm mb-2">Founder: {project.founderName || project.founder || 'N/A'}</p>
                    <p className="text-indigo-700 font-bold text-md mb-2">Sale Price: ${project.salePrice || 'N/A'}</p>
                    <button
                      onClick={() => navigate(`/project/${project.id}`)}
                      className="w-full mt-2 px-4 py-2 border border-indigo-600 text-sm font-medium rounded-md text-indigo-700 bg-indigo-50 hover:bg-indigo-100 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                    >
                      View Details
                    </button>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-500">No projects currently for sale.</p>
            )}
          </div>

          {/* Preferences and Settings */}
          <div className="mt-8">
            <h2 className="text-lg font-medium text-gray-900">Preferences and Settings</h2>
            <div className="mt-4 bg-white shadow rounded-lg">
              <div className="p-6">
                <div className="space-y-4">
                  <div>
                    <h3 className="text-sm font-medium text-gray-500">Project Categories</h3>
                    <p className="mt-1 text-gray-900">No categories selected</p>
                    <button className="mt-2 text-sm text-indigo-600 hover:text-indigo-500">Set Categories</button>
                  </div>
                  <div>
                    <h3 className="text-sm font-medium text-gray-500">Budget Range</h3>
                    <p className="mt-1 text-gray-900">Not set</p>
                    <button className="mt-2 text-sm text-indigo-600 hover:text-indigo-500">Set Budget</button>
                  </div>
                  <div>
                    <h3 className="text-sm font-medium text-gray-500">Notification Settings</h3>
                    <p className="mt-1 text-gray-900">Default settings</p>
                    <button className="mt-2 text-sm text-indigo-600 hover:text-indigo-500">Configure</button>
                  </div>
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