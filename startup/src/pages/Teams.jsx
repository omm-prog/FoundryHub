import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '../firebase/config';
import { useAuth } from '../contexts/AuthContext';
import LoadingSkeleton from '../components/LoadingSkeleton';

const Teams = () => {
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const { currentUser } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    const fetchProjects = async () => {
      try {
        const projectsRef = collection(db, 'projects');
        const q = query(projectsRef, where('founder', '==', currentUser.uid));
        const querySnapshot = await getDocs(q);
        
        const projectsList = querySnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        
        setProjects(projectsList);
      } catch (error) {
        console.error('Error fetching projects:', error);
      } finally {
        setLoading(false);
      }
    };

    if (currentUser) {
      fetchProjects();
    }
  }, [currentUser]);

  const handleProjectClick = (projectId) => {
    navigate(`/team-community/${projectId}`);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#030712] py-12">
        <LoadingSkeleton type="dashboard" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#030712] text-slate-100 font-sans relative overflow-hidden py-12 px-4 sm:px-6 lg:px-8">
      {/* Background glow decorations */}
      <div className="absolute top-[-10%] left-[-15%] w-[50%] h-[50%] bg-indigo-500/10 rounded-full blur-[120px] pointer-events-none"></div>
      <div className="absolute bottom-[-10%] right-[-15%] w-[50%] h-[50%] bg-purple-500/10 rounded-full blur-[120px] pointer-events-none"></div>

      <div className="max-w-7xl mx-auto relative z-10 space-y-8">
        <div className="flex justify-between items-center">
          <div className="space-y-1">
            <h1 className="text-3xl font-extrabold text-white tracking-tight font-display">My Project Teams</h1>
            <p className="text-sm text-slate-400">Select a project pod to manage members and collaborate in real-time.</p>
          </div>
          <button
            onClick={() => navigate('/dashboard')}
            className="px-4 py-2 border border-slate-700 bg-slate-800 hover:bg-slate-700 text-slate-100 text-xs font-semibold rounded-xl transition-all"
          >
            Back to Dashboard
          </button>
        </div>

        {projects.length === 0 ? (
          <div className="bg-slate-900/30 border border-slate-850 border-dashed rounded-2xl p-12 text-center text-slate-500">
            <svg className="w-12 h-12 text-slate-650 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857" />
            </svg>
            <h3 className="text-sm font-semibold text-slate-355">No projects registered yet</h3>
            <p className="text-xs text-slate-505 mt-1">Go back to your dashboard to create a new project pod.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {projects.map((project) => (
              <div
                key={project.id}
                onClick={() => handleProjectClick(project.id)}
                className="bg-slate-900/60 border border-slate-800 rounded-2xl p-6 cursor-pointer hover:border-slate-700/80 transition-all duration-300 flex flex-col justify-between hover:shadow-[0_4px_25px_rgba(99,102,241,0.06)]"
              >
                <div className="space-y-3">
                  <h2 className="text-lg font-bold text-slate-100 mb-2 group-hover:text-indigo-400 transition-colors">{project.title}</h2>
                  <p className="text-slate-400 text-sm line-clamp-3 leading-relaxed">{project.description}</p>
                </div>
                <div className="mt-6 pt-4 border-t border-slate-850 flex items-center justify-between text-xs text-slate-500">
                  <span>Members: <strong className="text-slate-300">{project.teamMembers?.length || 0}</strong></span>
                  <span className="text-indigo-400 font-semibold">Manage Pod &rarr;</span>
                </div>
              </div>
          ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Teams;