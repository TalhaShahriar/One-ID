import React, { useState, useEffect } from 'react';
import { Clock, CheckCircle2, Calendar } from 'lucide-react';

/**
 * Reusable Live Voting Countdown Timer Component.
 * Displays "Starts in: XXd XXh XXm XXs" for scheduled elections,
 * "Ends in: XXd XXh XXm XXs" for active elections,
 * and "Voting Concluded" for closed elections across all dashboards.
 */
export default function VotingCountdown({ 
  startAt, 
  endAt, 
  status, 
  variant = 'default',
  className = '' 
}) {
  const [tick, setTick] = useState(Date.now());

  useEffect(() => {
    const timer = setInterval(() => {
      setTick(Date.now());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  if (!startAt || !endAt) return null;

  const now = tick;
  const startTime = new Date(startAt).getTime();
  const endTime = new Date(endAt).getTime();

  let mode = 'active'; // 'scheduled', 'active', 'concluded'

  if (status === 'SCHEDULED' || now < startTime) {
    mode = 'scheduled';
  } else if (status === 'CLOSED' || status === 'RESULTS_PUBLISHED' || now >= endTime) {
    mode = 'concluded';
  } else {
    mode = 'active';
  }

  const targetTime = mode === 'scheduled' ? startTime : endTime;
  const diff = targetTime - now;

  const formatDiff = (ms) => {
    if (ms <= 0) return '00m 00s';
    const days = Math.floor(ms / (1000 * 60 * 60 * 24));
    const hours = Math.floor((ms % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutes = Math.floor((ms % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((ms % (1000 * 60)) / 1000);

    if (days > 0) return `${days}d ${hours}h ${minutes}m ${seconds}s`;
    if (hours > 0) return `${hours}h ${minutes}m ${seconds}s`;
    return `${minutes}m ${seconds}s`;
  };

  const timeString = formatDiff(diff);

  if (variant === 'badge-only') {
    if (mode === 'concluded') {
      return (
        <span className={`font-mono text-xs font-bold px-2.5 py-1 rounded-md border bg-slate-100 border-slate-200 text-slate-500 ${className}`}>
          Concluded
        </span>
      );
    }
    if (mode === 'scheduled') {
      return (
        <span className={`font-mono text-xs font-bold px-2.5 py-1 rounded-md border bg-amber-50 border-amber-200 text-amber-700 ${className}`}>
          Starts in {timeString}
        </span>
      );
    }
    return (
      <span className={`font-mono text-xs font-bold px-2.5 py-1 rounded-md border bg-emerald-50 border-emerald-200 text-[#006a4e] animate-pulse ${className}`}>
        Ends in {timeString}
      </span>
    );
  }

  if (mode === 'concluded') {
    return (
      <div className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-100 border border-slate-200 text-slate-600 font-medium text-xs shadow-sm ${className}`}>
        <CheckCircle2 className="h-3.5 w-3.5 text-slate-400" />
        <span className="font-bold text-[11px] uppercase tracking-wider">Voting Concluded</span>
      </div>
    );
  }

  if (mode === 'scheduled') {
    return (
      <div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-amber-50 border border-amber-200 text-amber-800 text-xs shadow-sm ${className}`}>
        <Calendar className="h-3.5 w-3.5 text-amber-600 animate-pulse" />
        <span className="font-bold text-[11px] uppercase tracking-wider text-amber-700">Starts in:</span>
        <span className="font-mono font-bold text-amber-900">{timeString}</span>
      </div>
    );
  }

  return (
    <div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs shadow-sm ${className}`}>
      <Clock className="h-3.5 w-3.5 text-emerald-600 animate-pulse" />
      <span className="font-bold text-[11px] uppercase tracking-wider text-emerald-700">Ends in:</span>
      <span className="font-mono font-bold text-[#006a4e]">{timeString}</span>
    </div>
  );
}
