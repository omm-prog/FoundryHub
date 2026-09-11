import React from 'react';
import { useNavigate } from 'react-router-dom';

const CATEGORY_COLORS = {
  'Tech': 'bg-blue-500/15 text-blue-300 border-blue-500/25',
  'Fintech': 'bg-emerald-500/15 text-emerald-300 border-emerald-500/25',
  'Health': 'bg-rose-500/15 text-rose-300 border-rose-500/25',
  'EdTech': 'bg-orange-500/15 text-orange-300 border-orange-500/25',
  'default': 'bg-indigo-500/15 text-indigo-300 border-indigo-500/25',
};

const ProjectCard = ({ project, onApply, applyLoading, applied }) => {
  const navigate = useNavigate();
  const categoryStyle = CATEGORY_COLORS[project.category] || CATEGORY_COLORS.default;
  const memberCount = project.teamMembers?.length || 0;
  const rolesCount = project.roles?.length || 0;
  const fundingPercent = project.fundingGoal && project.amountRaised
    ? Math.min(100, Math.round((Number(project.amountRaised) / Number(project.fundingGoal)) * 100))
    : null;

  return (
    <div
      className="glass-card p-5 flex flex-col gap-4 hover:scale-[1.01] hover:border-indigo-500/25 transition-all duration-300 cursor-pointer group"
      onClick={() => navigate(`/project/${project.id}`)}
    >
      {/* Header */}
      <div className="flex items-start justify-between gap-3">
        <h3 className="text-base font-semibold text-white leading-snug group-hover:text-indigo-300 transition-colors line-clamp-2">
          {project.title}
        </h3>
        {project.category && (
          <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border flex-shrink-0 ${categoryStyle}`}>
            {project.category}
          </span>
        )}
      </div>

      {/* Description */}
      <p className="text-slate-400 text-sm leading-relaxed line-clamp-2 flex-1">
        {project.description}
      </p>

      {/* Roles chips */}
      {project.roles?.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {project.roles.slice(0, 3).map((role, i) => (
            <span key={i} className="text-[10px] bg-slate-800 text-slate-400 px-2 py-0.5 rounded-full border border-slate-700/60">
              {role}
            </span>
          ))}
          {project.roles.length > 3 && (
            <span className="text-[10px] text-slate-600">+{project.roles.length - 3} more</span>
          )}
        </div>
      )}

      {/* Funding progress */}
      {fundingPercent !== null && (
        <div className="space-y-1">
          <div className="flex justify-between text-[10px] text-slate-500">
            <span>Funding Progress</span>
            <span className="text-indigo-400 font-medium">{fundingPercent}%</span>
          </div>
          <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-indigo-500 to-purple-500 rounded-full transition-all duration-500"
              style={{ width: `${fundingPercent}%` }}
            />
          </div>
        </div>
      )}

      {/* Footer meta */}
      <div className="flex items-center justify-between pt-1 border-t border-slate-800/60">
        <div className="flex items-center gap-3 text-[10px] text-slate-500">
          <span className="flex items-center gap-1">
            <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 018.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0111.964-3.07M12 6.375a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zm8.25 2.25a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0z" />
            </svg>
            {memberCount} member{memberCount !== 1 ? 's' : ''}
          </span>
          {rolesCount > 0 && (
            <span className="flex items-center gap-1">
              <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M20.25 14.15v4.25c0 1.094-.787 2.036-1.872 2.18-2.087.277-4.216.42-6.378.42s-4.291-.143-6.378-.42c-1.085-.144-1.872-1.086-1.872-2.18v-4.25m16.5 0a2.18 2.18 0 00.75-1.661V8.706c0-1.081-.768-2.015-1.837-2.175a48.114 48.114 0 00-3.413-.387m4.5 8.006c-.194.165-.42.295-.673.38A23.978 23.978 0 0112 15.75c-2.648 0-5.195-.429-7.577-1.22a2.016 2.016 0 01-.673-.38m0 0A2.18 2.18 0 013 12.489V8.706c0-1.081.768-2.015 1.837-2.175a48.111 48.111 0 013.413-.387m7.5 0V5.25A2.25 2.25 0 0013.5 3h-3a2.25 2.25 0 00-2.25 2.25v.894m7.5 0a48.667 48.667 0 00-7.5 0" />
              </svg>
              {rolesCount} role{rolesCount !== 1 ? 's' : ''}
            </span>
          )}
        </div>

        {onApply && (
          <button
            onClick={(e) => { e.stopPropagation(); onApply(project.id, project.title); }}
            disabled={applyLoading || applied}
            className={`text-xs font-semibold px-3 py-1.5 rounded-lg transition-all ${
              applied
                ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/25 cursor-default'
                : 'bg-indigo-500/15 text-indigo-300 border border-indigo-500/25 hover:bg-indigo-500/25 active:scale-95'
            }`}
          >
            {applyLoading ? '…' : applied ? '✓ Applied' : 'Apply →'}
          </button>
        )}
      </div>
    </div>
  );
};

export default ProjectCard;