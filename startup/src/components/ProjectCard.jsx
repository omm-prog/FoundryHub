import React from 'react';
import { Link } from 'react-router-dom';

const ProjectCard = ({ project, onApply, applyDisabled, applyLoading, applyStatus }) => {
  let buttonText = 'Apply';
  let buttonClass = 'mt-3 w-full bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white font-semibold py-2.5 px-4 rounded-xl shadow-md transition-all duration-200 text-sm hover:scale-[1.02] active:scale-[0.98]';
  let disabled = applyDisabled || applyLoading;

  if (applyStatus === 'joined') {
    buttonText = 'Joined';
    buttonClass = 'mt-3 w-full bg-emerald-500/15 border border-emerald-500/30 text-emerald-450 font-semibold py-2.5 px-4 rounded-xl cursor-not-allowed text-sm text-center';
    disabled = true;
  } else if (applyStatus === 'applied') {
    buttonText = 'Applied';
    buttonClass = 'mt-3 w-full bg-slate-800/40 border border-slate-800 text-slate-500 font-semibold py-2.5 px-4 rounded-xl cursor-not-allowed text-sm text-center';
    disabled = true;
  } else if (applyLoading) {
    buttonText = 'Applying...';
    buttonClass = 'mt-3 w-full bg-indigo-500/50 text-white/80 font-semibold py-2.5 px-4 rounded-xl cursor-not-allowed text-sm text-center';
    disabled = true;
  }

  return (
    <div className="bg-slate-900/60 backdrop-blur-md border border-slate-800 rounded-2xl hover:border-slate-700/80 transition-all duration-300 p-6 flex flex-col h-full hover:shadow-[0_4px_25px_rgba(99,102,241,0.08)]">
      <h3 className="text-lg font-bold text-slate-100 mb-2 truncate" title={project.title}>{project.title}</h3>
      <p className="text-slate-400 mb-4 line-clamp-2 text-sm leading-relaxed">{project.description}</p>
      
      <div className="mt-auto pt-3 border-t border-slate-850 flex items-center justify-between">
        <span className="text-xs text-slate-500">Founder</span>
        <span className="text-xs font-semibold text-indigo-400">{project.founderName || 'Anonymous'}</span>
      </div>

      <div className="flex flex-col gap-2 mt-4">
        <Link
          to={`/project/${project.id}`}
          state={{ isFreelancerView: true }}
          className="w-full text-center bg-slate-950/45 border border-slate-850 hover:border-slate-800 hover:bg-slate-900 text-slate-300 hover:text-white font-semibold py-2.5 px-4 rounded-xl transition-all duration-200 text-sm"
        >
          View Details
        </Link>
        <button
          className={buttonClass}
          onClick={onApply}
          disabled={disabled}
        >
          {buttonText}
        </button>
      </div>
    </div>
  );
};

export default ProjectCard;