import React from 'react';
import { Link, useLocation } from 'react-router-dom';

const items = [
  {
    to: '/',
    label: '概览',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-5 w-5">
        <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
        <path d="M9 22V12h6v10" />
      </svg>
    ),
  },
  {
    to: '/log',
    label: '记录',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-5 w-5">
        <path d="M9 11l3 3L22 4" />
        <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11" />
      </svg>
    ),
  },
  {
    to: '/reports',
    label: '报表',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-5 w-5">
        <path d="M3 3v18h18" />
        <path d="M7 15l4-4 3 3 6-6" />
      </svg>
    ),
  },
  {
    to: '/resources',
    label: '资源',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-5 w-5">
        <path d="M20 6H9" />
        <path d="M20 12H9" />
        <path d="M20 18H9" />
        <path d="M5 6h.01" />
        <path d="M5 12h.01" />
        <path d="M5 18h.01" />
      </svg>
    ),
  },
];

function isActive(pathname, to) {
  if (to === '/') return pathname === '/';
  return pathname === to || pathname.startsWith(`${to}/`);
}

export default function DockNav() {
  const { pathname } = useLocation();

  return (
    <div className="fixed bottom-6 left-0 right-0 z-50 flex justify-center px-4" style={{ transform: 'translateZ(0)' }}>
      <div className="flex w-full max-w-[360px] items-center justify-between rounded-[24px] border border-white/60 bg-white/60 px-2 py-2 shadow-[0_8px_30px_rgb(0,0,0,0.08)] backdrop-blur-2xl backdrop-saturate-150 supports-[backdrop-filter]:bg-white/50">
        {items.map((it) => {
          const active = isActive(pathname, it.to);
          return (
            <Link
              key={it.to}
              to={it.to}
              aria-current={active ? 'page' : undefined}
              className={
                active
                  ? 'flex flex-1 flex-col items-center gap-1 rounded-[16px] bg-white py-2 text-blue-600 shadow-sm transition-all duration-300 ease-[cubic-bezier(0.23,1,0.32,1)]'
                  : 'flex flex-1 flex-col items-center gap-1 rounded-[16px] py-2 text-slate-500 transition-all duration-300 ease-[cubic-bezier(0.23,1,0.32,1)] hover:bg-white/40 hover:text-slate-800'
              }
            >
              <div className={`transition-transform duration-300 ${active ? 'scale-110' : 'scale-100'}`}>
                {it.icon}
              </div>
              <div className="text-[10px] font-semibold tracking-wide">{it.label}</div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}

