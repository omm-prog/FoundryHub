import React from 'react';

/* ── Shimmer base ── */
const Shimmer = ({ className = '' }) => (
  <div className={`bg-slate-800/80 rounded-lg animate-shimmer ${className}`} />
);

/* ── Card Skeleton ── */
export const CardSkeleton = () => (
  <div className="glass-card p-6 space-y-4">
    <div className="flex justify-between items-start">
      <Shimmer className="h-5 w-3/5" />
      <Shimmer className="h-4 w-1/5 rounded-full" />
    </div>
    <div className="space-y-2">
      <Shimmer className="h-3 w-full" />
      <Shimmer className="h-3 w-4/5" />
      <Shimmer className="h-3 w-3/5" />
    </div>
    <div className="flex gap-2 pt-1">
      <Shimmer className="h-5 w-16 rounded-full" />
      <Shimmer className="h-5 w-20 rounded-full" />
    </div>
    <div className="pt-2 flex gap-3">
      <Shimmer className="h-9 flex-1 rounded-xl" />
      <Shimmer className="h-9 flex-1 rounded-xl" />
    </div>
  </div>
);

/* ── Metric Skeleton ── */
export const MetricSkeleton = () => (
  <div className="glass-card p-5 flex items-center gap-4">
    <Shimmer className="w-11 h-11 rounded-xl flex-shrink-0" />
    <div className="flex-1 space-y-2">
      <Shimmer className="h-3 w-1/3" />
      <Shimmer className="h-6 w-1/2" />
    </div>
  </div>
);

/* ── Investor Card Skeleton ── */
export const InvestorCardSkeleton = () => (
  <div className="glass-card p-6 space-y-4">
    <div className="flex items-center gap-4">
      <Shimmer className="w-14 h-14 rounded-full flex-shrink-0" />
      <div className="flex-1 space-y-2">
        <Shimmer className="h-4 w-3/5" />
        <Shimmer className="h-3 w-2/5" />
      </div>
    </div>
    <div className="flex gap-2">
      <Shimmer className="h-5 w-16 rounded-full" />
      <Shimmer className="h-5 w-20 rounded-full" />
    </div>
    <Shimmer className="h-3 w-full" />
    <Shimmer className="h-3 w-4/5" />
    <div className="flex gap-3 pt-1">
      <Shimmer className="h-9 flex-1 rounded-xl" />
      <Shimmer className="h-9 flex-1 rounded-xl" />
    </div>
  </div>
);

/* ── Chat Skeleton ── */
export const ChatSkeleton = () => (
  <div className="space-y-4 px-3 py-4">
    {[false, true, false, true, false].map((isRight, i) => (
      <div key={i} className={`flex ${isRight ? 'justify-end' : 'justify-start'} gap-2 items-end`}>
        {!isRight && <Shimmer className="w-7 h-7 rounded-full flex-shrink-0" />}
        <Shimmer className={`h-10 rounded-2xl ${isRight ? 'rounded-br-sm w-48' : 'rounded-bl-sm w-40'}`} />
      </div>
    ))}
  </div>
);

/* ── Bento Grid Skeleton ── */
export const BentoSkeleton = () => (
  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 animate-pulse">
    <Shimmer className="h-32 rounded-2xl" />
    <Shimmer className="h-32 rounded-2xl" />
    <Shimmer className="h-32 rounded-2xl" />
    <Shimmer className="h-32 rounded-2xl sm:col-span-2 lg:col-span-1" />
    <Shimmer className="h-32 rounded-2xl" />
    <Shimmer className="h-32 rounded-2xl" />
  </div>
);

/* ── Dashboard Skeleton ── */
export const DashboardSkeleton = () => (
  <div className="space-y-8 p-4 max-w-7xl mx-auto">
    <div className="space-y-2">
      <Shimmer className="h-7 w-48" />
      <Shimmer className="h-4 w-64" />
    </div>
    <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-4 gap-4">
      {[...Array(4)].map((_, i) => <MetricSkeleton key={i} />)}
    </div>
    <div className="space-y-3">
      <Shimmer className="h-5 w-36" />
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {[...Array(3)].map((_, i) => <CardSkeleton key={i} />)}
      </div>
    </div>
  </div>
);

/* ── Main export ── */
const LoadingSkeleton = ({ type = 'dashboard' }) => {
  switch (type) {
    case 'card':          return <CardSkeleton />;
    case 'metric':        return <MetricSkeleton />;
    case 'investor-card': return <InvestorCardSkeleton />;
    case 'chat':          return <ChatSkeleton />;
    case 'bento':         return <BentoSkeleton />;
    case 'dashboard':
    default:              return <DashboardSkeleton />;
  }
};

export default LoadingSkeleton;
