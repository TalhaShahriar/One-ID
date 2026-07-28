import React, { useState, useEffect } from 'react';
import { Clock, Globe } from 'lucide-react';

/**
 * LiveBDClock — Real-time Bangladesh Standard Time (BST / UTC+6) Widget.
 * Formats time accurately using the Asia/Dhaka IANA timezone.
 */
export default function LiveBDClock({ variant = 'default', className = '' }) {
  const [bdTime, setBdTime] = useState({ timeStr: '', dateStr: '' });

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      const timeStr = now.toLocaleTimeString('en-US', {
        timeZone: 'Asia/Dhaka',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: true
      });
      const dateStr = now.toLocaleDateString('en-US', {
        timeZone: 'Asia/Dhaka',
        weekday: 'short',
        month: 'short',
        day: 'numeric',
        year: 'numeric'
      });
      setBdTime({ timeStr, dateStr });
    };

    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  if (variant === 'compact') {
    return (
      <div className={`inline-flex items-center gap-2 px-2.5 py-1 bg-slate-900/90 text-slate-100 rounded-lg border border-slate-700/80 shadow-sm font-mono ${className}`}>
        <span className="relative flex h-2 w-2">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
          <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
        </span>
        <span className="text-[11px] font-bold tracking-tight">{bdTime.timeStr}</span>
        <span className="text-[9px] font-semibold px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 uppercase tracking-widest hidden sm:inline">
          BST (UTC+6)
        </span>
      </div>
    );
  }

  if (variant === 'badge') {
    return (
      <div className={`inline-flex items-center gap-2 px-3 py-1.5 bg-emerald-950/40 border border-emerald-800/60 rounded-full text-emerald-300 shadow-sm ${className}`}>
        <Clock className="w-3.5 h-3.5 text-emerald-400 animate-pulse" />
        <span className="text-xs font-mono font-bold tracking-tight">{bdTime.timeStr}</span>
        <span className="text-[10px] text-emerald-400/80 font-sans font-semibold border-l border-emerald-800/80 pl-2">
          {bdTime.dateStr} (BST)
        </span>
      </div>
    );
  }

  if (variant === 'light-badge') {
    return (
      <div className={`inline-flex items-center gap-2 px-3 py-1.5 bg-emerald-50 border border-emerald-200/80 rounded-full text-[#006a4e] shadow-sm ${className}`}>
        <Clock className="w-3.5 h-3.5 text-[#006a4e] animate-pulse" />
        <span className="text-xs font-mono font-black tracking-tight">{bdTime.timeStr}</span>
        <span className="text-[10px] text-emerald-800 font-sans font-bold border-l border-emerald-200 pl-2">
          {bdTime.dateStr} (BST)
        </span>
      </div>
    );
  }

  return (
    <div className={`bg-slate-900 border border-slate-800 rounded-xl px-3.5 py-2 flex items-center gap-3 shadow-md ${className}`}>
      <div className="flex items-center justify-center h-8 w-8 rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 shrink-0">
        <Clock className="w-4 h-4 animate-spin-slow" />
      </div>
      <div className="flex flex-col text-left">
        <div className="flex items-center gap-2">
          <span className="text-xs font-black font-mono text-white tracking-tight">{bdTime.timeStr}</span>
          <span className="text-[9px] font-bold px-1.5 py-0.2 rounded bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 font-mono">
            BST UTC+6
          </span>
        </div>
        <span className="text-[10px] font-medium text-slate-400 font-sans">
          🇧🇩 {bdTime.dateStr}
        </span>
      </div>
    </div>
  );
}
