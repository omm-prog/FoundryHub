import React from 'react';
import { Link } from 'react-router-dom';

const ProjectCard = ({ project, onApply, applyDisabled, applyLoading, applyStatus }) => {
  let buttonText = 'Apply';
  let buttonClass = 'mt-4 w-full bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-2 px-4 rounded shadow transition-colors';
  let disabled = applyDisabled || applyLoading;

  if (applyStatus === 'joined') {
    buttonText = 'Joined';
    buttonClass = 'mt-4 w-full bg-green-500 text-white font-semibold py-2 px-4 rounded shadow cursor-not-allowed';
    disabled = true;
  } else if (applyStatus === 'applied') {
    buttonText = 'Applied';
    buttonClass = 'mt-4 w-full bg-gray-400 text-white font-semibold py-2 px-4 rounded shadow cursor-not-allowed';
    disabled = true;
  } else if (applyLoading) {
    buttonText = 'Applying...';
    disabled = true;
  }

  return (
    <div className="bg-white rounded-lg shadow-md hover:shadow-xl transition-shadow p-6 cursor-pointer flex flex-col h-full">
      <h3 className="text-lg font-bold text-gray-900 mb-2 truncate">{project.title}</h3>
      <p className="text-gray-600 mb-4 line-clamp-2">{project.description}</p>
      <div className="mt-auto">
        <span className="text-sm text-gray-500">Founder: </span>
        <span className="text-sm font-medium text-indigo-700">{project.founderName}</span>
      </div>
      <Link
        to={`/project/${project.id}`}
        state={{ isFreelancerView: true }}
        className="mt-4 w-full text-center bg-gray-200 hover:bg-gray-300 text-gray-800 font-semibold py-2 px-4 rounded shadow transition-colors"
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
  );
};

export default ProjectCard; 