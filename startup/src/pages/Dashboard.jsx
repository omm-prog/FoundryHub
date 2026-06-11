import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { auth } from '../firebase/config';
import { getFirestore, doc, getDoc } from 'firebase/firestore';
import FounderDashboard from './dashboards/FounderDashboard';
import FreelancerDashboard from './dashboards/FreelancerDashboard';
import InvestorDashboard from './dashboards/InvestorDashboard';
import BuyerDashboard from './dashboards/BuyerDashboard';

import LoadingSkeleton from '../components/LoadingSkeleton';

const Dashboard = () => {
  const [userData, setUserData] = useState(null);
  const [loading, setLoading] = useState(true);
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
        if (userDoc.exists()) {
          setUserData(userDoc.data());
        }
      } catch (error) {
        console.error('Error fetching user data:', error);
      } finally {
        setLoading(false);
      }
    };

    checkAuth();
  }, [navigate]);

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

  if (!userData) {
    return (
      <div className="min-h-screen bg-[#030712] flex items-center justify-center text-slate-400">
        No user data found
      </div>
    );
  }

  // Render the appropriate dashboard based on user role
  switch (userData.role) {
    case 'founder':
      return <FounderDashboard initialUserData={userData} />;
    case 'freelancer':
      return <FreelancerDashboard initialUserData={userData} />;
    case 'investor':
      return <InvestorDashboard initialUserData={userData} />;
    case 'buyer':
      return <BuyerDashboard initialUserData={userData} />;
    default:
      return <div>Invalid user role</div>;
  }
};

export default Dashboard; 