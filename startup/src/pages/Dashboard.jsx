import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { auth } from '../firebase/config';
import { getFirestore, doc, getDoc } from 'firebase/firestore';
import FounderDashboard from './dashboards/FounderDashboard';
import FreelancerDashboard from './dashboards/FreelancerDashboard';
import InvestorDashboard from './dashboards/InvestorDashboard';
import BuyerDashboard from './dashboards/BuyerDashboard';

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
    return <div>Loading...</div>;
  }

  if (!userData) {
    return <div>No user data found</div>;
  }

  // Render the appropriate dashboard based on user role
  switch (userData.role) {
    case 'founder':
      return <FounderDashboard />;
    case 'freelancer':
      return <FreelancerDashboard />;
    case 'investor':
      return <InvestorDashboard />;
    case 'buyer':
      return <BuyerDashboard />;
    default:
      return <div>Invalid user role</div>;
  }
};

export default Dashboard; 