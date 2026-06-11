import React from 'react';

export const CardSkeleton = () => (
  <div className="bg-slate-900/60 backdrop-blur-md border border-slate-800/80 rounded-2xl p-6 space-y-4 animate-pulse">
    <div className="flex justify-between items-start">
      <div className="h-6 w-3/5 bg-slate-800 rounded-lg animate-shimmer"></div>
      <div className="h-5 w-1/5 bg-slate-800 rounded-full animate-shimmer"></div>
    </div>
    <div className="space-y-2">
      <div className="h-4 w-full bg-slate-800 rounded-lg animate-shimmer"></div>
      <div className="h-4 w-4/5 bg-slate-800 rounded-lg animate-shimmer"></div>
    </div>
    <div className="pt-2 flex gap-3">
      <div className="h-10 flex-1 bg-slate-800 rounded-xl animate-shimmer"></div>
      <div className="h-10 flex-1 bg-slate-800 rounded-xl animate-shimmer"></div>
    </div>
  </div>
);

export const MetricSkeleton = () => (
  <div className="bg-slate-900/60 backdrop-blur-md border border-slate-800/80 rounded-2xl p-6 flex items-center space-x-4 animate-pulse">
    <div className="w-12 h-12 bg-slate-800 rounded-xl animate-shimmer"></div>
    <div className="flex-1 space-y-2">
      <div className="h-4 w-1/3 bg-slate-800 rounded-lg animate-shimmer"></div>
      <div className="h-6 w-1/2 bg-slate-800 rounded-lg animate-shimmer"></div>
    </div>
  </div>
);

export const DashboardSkeleton = () => (
  <div className="space-y-8 animate-pulse p-4">
    {/* Page Title skeleton */}
    <div className="space-y-2">
      <div className="h-8 w-1/4 bg-slate-800 rounded-lg animate-shimmer"></div>
      <div className="h-4 w-1/3 bg-slate-800 rounded-lg animate-shimmer"></div>
    </div>

    {/* Metric Grid */}
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      <MetricSkeleton />
      <MetricSkeleton />
      <MetricSkeleton />
    </div>

    {/* Content Grid */}
    <div className="space-y-4">
      <div className="h-6 w-1/5 bg-slate-800 rounded-lg animate-shimmer"></div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <CardSkeleton />
        <CardSkeleton />
        <CardSkeleton />
      </div>
    </div>
  </div>
);

const LoadingSkeleton = ({ type = 'dashboard' }) => {
  switch (type) {
    case 'card':
      return <CardSkeleton />;
    case 'metric':
      return <MetricSkeleton />;
    case 'dashboard':
    default:
      return <DashboardSkeleton />;
  }
};

export default LoadingSkeleton;
