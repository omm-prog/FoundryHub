import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { getFirestore, collection, addDoc } from 'firebase/firestore';
import { auth } from '../firebase/config';

const CreateProject = () => {
  const navigate = useNavigate();
  const db = getFirestore();
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    category: '',
    roles: [''] // Initialize with one empty role
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleRoleChange = (index, value) => {
    const newRoles = [...formData.roles];
    newRoles[index] = value;
    setFormData(prev => ({
      ...prev,
      roles: newRoles
    }));
  };

  const addRoleField = () => {
    setFormData(prev => ({
      ...prev,
      roles: [...prev.roles, '']
    }));
  };

  const removeRoleField = (index) => {
    setFormData(prev => ({
      ...prev,
      roles: prev.roles.filter((_, i) => i !== index)
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      // Filter out empty roles
      const filteredRoles = formData.roles.filter(role => role.trim() !== '');

      if (!auth.currentUser) {
        throw new Error('You must be logged in to create a project');
      }

      const projectData = {
        ...formData,
        roles: filteredRoles,
        founder: auth.currentUser.uid,
        createdAt: new Date().toISOString(),
        status: 'active'
      };

      await addDoc(collection(db, 'projects'), projectData);
      navigate('/dashboard');
    } catch (error) {
      console.error('Error creating project:', error);
      setError(error.message || 'Failed to create project');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#030712] text-slate-100 font-sans relative overflow-hidden py-12 px-4 sm:px-6 lg:px-8">
      {/* Background glow effects */}
      <div className="absolute top-[-10%] left-[-15%] w-[50%] h-[50%] bg-indigo-500/10 rounded-full blur-[120px] pointer-events-none"></div>
      <div className="absolute bottom-[-10%] right-[-15%] w-[50%] h-[50%] bg-purple-500/10 rounded-full blur-[120px] pointer-events-none"></div>

      <div className="max-w-3xl mx-auto relative z-10">
        <div className="bg-slate-900/40 backdrop-blur-md border border-slate-800/80 p-8 rounded-3xl shadow-2xl space-y-6">
          <div className="flex justify-between items-center pb-4 border-b border-slate-800">
            <h2 className="text-2xl font-bold text-white font-display">Create New Workspace Pod</h2>
            <button
              onClick={() => navigate('/dashboard')}
              className="text-xs text-slate-400 hover:text-slate-200 transition-colors"
            >
              Back
            </button>
          </div>
          
          {error && (
            <div className="bg-red-500/10 border border-red-500/25 rounded-2xl p-4 text-red-400 text-sm font-semibold">
              <p>{error}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label htmlFor="title" className="block text-xs font-semibold uppercase tracking-wider text-slate-450 mb-2">
                Project Title
              </label>
              <input
                type="text"
                id="title"
                name="title"
                required
                value={formData.title}
                onChange={handleChange}
                className="w-full bg-slate-950/60 border border-slate-800 focus:border-indigo-500 text-white placeholder-slate-500 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 px-4 py-3 text-sm transition-all"
                placeholder="Enter workspace name"
              />
            </div>

            <div>
              <label htmlFor="description" className="block text-xs font-semibold uppercase tracking-wider text-slate-450 mb-2">
                Project Description
              </label>
              <textarea
                id="description"
                name="description"
                required
                rows={4}
                value={formData.description}
                onChange={handleChange}
                className="w-full bg-slate-950/60 border border-slate-800 focus:border-indigo-500 text-white placeholder-slate-500 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 px-4 py-3 text-sm transition-all"
                placeholder="Describe project details, objectives, and parameters..."
              />
            </div>

            <div>
              <label htmlFor="category" className="block text-xs font-semibold uppercase tracking-wider text-slate-450 mb-2">
                Project Category
              </label>
              <select
                id="category"
                name="category"
                required
                value={formData.category}
                onChange={handleChange}
                className="w-full bg-slate-950/60 border border-slate-800 focus:border-indigo-500 text-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 px-4 py-3 text-sm transition-all"
              >
                <option value="">Select a category</option>
                <option value="Technology">Technology</option>
                <option value="Healthcare">Healthcare</option>
                <option value="Education">Education</option>
                <option value="Finance">Finance</option>
                <option value="E-commerce">E-commerce</option>
                <option value="Other">Other</option>
              </select>
            </div>

            <div className="space-y-3 pt-2">
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-450">
                Required Workspace Job Roles
              </label>
              {formData.roles.map((role, index) => (
                <div key={index} className="flex gap-2.5">
                  <input
                    type="text"
                    value={role}
                    onChange={(e) => handleRoleChange(index, e.target.value)}
                    className="flex-1 bg-slate-950/60 border border-slate-800 focus:border-indigo-500 text-white placeholder-slate-500 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 px-4 py-3.5 text-sm transition-all"
                    placeholder="e.g. Frontend Engineer (React)"
                  />
                  {formData.roles.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removeRoleField(index)}
                      className="px-4 py-2 bg-red-950/20 border border-red-900/35 text-red-400 font-bold rounded-xl text-xs hover:bg-red-950/40 transition-all"
                    >
                      Remove
                    </button>
                  )}
                </div>
              ))}
              <button
                type="button"
                onClick={addRoleField}
                className="inline-flex items-center px-4 py-2 border border-slate-700 bg-slate-850 hover:bg-slate-800 text-slate-200 text-xs font-semibold rounded-xl transition-all"
              >
                + Add Role Requirement
              </button>
            </div>

            <div className="flex justify-end space-x-3 pt-6 border-t border-slate-800">
              <button
                type="button"
                onClick={() => navigate(-1)}
                className="px-5 py-2.5 bg-slate-800 hover:bg-slate-750 text-slate-300 font-semibold rounded-xl text-sm transition-all"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading}
                className="px-5 py-2.5 bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 disabled:opacity-50 text-white font-bold rounded-xl text-sm shadow-md transition-all duration-200"
              >
                {loading ? 'Creating Pod...' : 'Create Workspace Pod'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default CreateProject;