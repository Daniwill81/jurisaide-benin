'use client';

import Link from 'next/link';

export default function Logo({ className = "", showText = true }: { className?: string, showText?: boolean }) {
  return (
    <Link href="/" className={`flex items-center gap-2 ${className}`}>
      <div className="relative w-11 h-11 bg-gradient-to-br from-indigo-600 to-violet-600 rounded-2xl flex items-center justify-center shadow-xl shadow-indigo-200/50 group overflow-hidden">
        {/* Document Background Layer */}
        <div className="absolute inset-0 flex items-center justify-center opacity-10 transform -rotate-12 translate-x-2 translate-y-2">
           <svg className="w-12 h-12 text-white" fill="currentColor" viewBox="0 0 24 24"><path d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" /></svg>
        </div>

        {/* Scale Icon (Balance) */}
        <svg 
          className="w-7 h-7 text-white transform transition-all duration-500 group-hover:scale-110 group-hover:-rotate-3 relative z-10" 
          fill="none" 
          stroke="currentColor" 
          viewBox="0 0 24 24"
        >
          <path 
            strokeLinecap="round" 
            strokeLinejoin="round" 
            strokeWidth="2" 
            d="M3 6l3 1m0 0l-3 9a5.002 5.002 0 006.001 0M6 7l3 9M6 7l6-2m6 2l3-1m-3 1l-3 9a5.002 5.002 0 006.001 0M18 7l3 9m-3-9l-6-2m0-2v2m0 16V5m0 16H9m3 0h3" 
          />
        </svg>
        
        {/* Stylized Pen Tip / Shine */}
        <div className="absolute top-2 right-2 w-1.5 h-1.5 bg-white rounded-full opacity-40 group-hover:opacity-100 group-hover:scale-125 transition-all duration-300 shadow-[0_0_8px_rgba(255,255,255,0.8)]"></div>
      </div>
      
      {showText && (
        <span className="text-2xl font-black tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-slate-900 to-indigo-900">
          JurisAide
        </span>
      )}
    </Link>
  );
}
