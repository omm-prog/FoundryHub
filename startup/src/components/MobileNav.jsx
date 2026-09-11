import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';

/**
 * Mobile bottom navigation bar for dashboard pages.
 * Only renders on small screens (md:hidden).
 */
const MobileNav = ({ items }) => {
  const navigate = useNavigate();
  const location = useLocation();

  const defaultItems = [
    {
      label: 'Dashboard', href: '/dashboard',
      icon: (active) => (
        <svg className={`w-5 h-5 ${active ? 'text-indigo-400' : 'text-slate-500'}`} fill={active ? 'currentColor' : 'none'} viewBox="0 0 24 24" stroke="currentColor" strokeWidth={active ? 0 : 2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 12l8.954-8.955c.44-.439 1.152-.439 1.591 0L21.75 12M4.5 9.75v10.125c0 .621.504 1.125 1.125 1.125H9.75v-4.875c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21h4.125c.621 0 1.125-.504 1.125-1.125V9.75M8.25 21h8.25" />
        </svg>
      ),
    },
    {
      label: 'Projects', href: '/create-project',
      icon: (active) => (
        <svg className={`w-5 h-5 ${active ? 'text-indigo-400' : 'text-slate-500'}`} fill={active ? 'currentColor' : 'none'} viewBox="0 0 24 24" stroke="currentColor" strokeWidth={active ? 0 : 2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
        </svg>
      ),
    },
    {
      label: 'Investors', href: '/investors',
      icon: (active) => (
        <svg className={`w-5 h-5 ${active ? 'text-indigo-400' : 'text-slate-500'}`} fill={active ? 'currentColor' : 'none'} viewBox="0 0 24 24" stroke="currentColor" strokeWidth={active ? 0 : 2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 18L9 11.25l4.306 4.307a11.95 11.95 0 015.814-5.519l2.74-1.22m0 0l-5.94-2.28m5.94 2.28l-2.28 5.941" />
        </svg>
      ),
    },
    {
      label: 'Teams', href: '/teams',
      icon: (active) => (
        <svg className={`w-5 h-5 ${active ? 'text-indigo-400' : 'text-slate-500'}`} fill={active ? 'currentColor' : 'none'} viewBox="0 0 24 24" stroke="currentColor" strokeWidth={active ? 0 : 2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 018.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0111.964-3.07M12 6.375a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zm8.25 2.25a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0z" />
        </svg>
      ),
    },
  ];

  const navItems = items || defaultItems;

  return (
    <div className="mobile-nav md:hidden">
      <div className="flex items-stretch">
        {navItems.map((item) => {
          const active = location.pathname === item.href || location.pathname.startsWith(item.href + '/');
          return (
            <button
              key={item.href}
              onClick={() => navigate(item.href)}
              className={`flex-1 flex flex-col items-center justify-center gap-1 py-2.5 transition-all ${active ? 'opacity-100' : 'opacity-60 hover:opacity-80'}`}
            >
              {item.icon(active)}
              <span className={`text-[9px] font-semibold ${active ? 'text-indigo-400' : 'text-slate-500'}`}>
                {item.label}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
};

export default MobileNav;
