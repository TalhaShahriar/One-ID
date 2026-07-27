import React from 'react';
import { 
  Check, 
  AlertTriangle, 
  Clock, 
  Circle 
} from 'lucide-react';

export default function ProgressTimeline({ milestones = [] }) {
  if (!milestones || milestones.length === 0) return null;

  // Find the index of 'current' or the last completed milestone to determine line progress
  const findProgressRatio = () => {
    let activeIdx = milestones.findIndex(m => m.status === 'current');
    if (activeIdx === -1) {
      // Find the last completed index
      const compIndexes = milestones.map((m, i) => m.status === 'completed' ? i : -1).filter(idx => idx !== -1);
      activeIdx = compIndexes.length > 0 ? compIndexes[compIndexes.length - 1] : 0;
    }
    return Math.max(0, (activeIdx / (milestones.length - 1)) * 100);
  };

  const fillPercentage = findProgressRatio();

  return (
    <div className="relative font-sans p-6 bg-white border border-gray-150 rounded-2xl shadow-sm max-w-xl mx-auto">
      {/* Styles for direct keyframes scale pulse */}
      <style>{`
        @keyframes scalePulse {
          0%, 100% {
            transform: scale(1);
            box-shadow: 0 0 0 0 rgba(0, 106, 78, 0.4);
          }
          50% {
            transform: scale(1.15);
            box-shadow: 0 0 0 8px rgba(0, 106, 78, 0);
          }
        }
        .animate-scale-pulse {
          animation: scalePulse 2s cubic-bezier(0.25, 0.8, 0.25, 1) infinite;
        }

        /* SVG Clip path animation */
        @keyframes clipPathSlide {
          from {
            clip-path: inset(0 0 100% 0);
          }
          to {
            clip-path: inset(0 0 0 0);
          }
        }
        .animate-clip-slide {
          animation: clipPathSlide 1.2s cubic-bezier(0.16, 1, 0.3, 1) forwards;
        }
      `}</style>
      
      <div className="flex items-center gap-2 mb-6 border-b border-gray-100 pb-3">
        <Clock className="w-5 h-5 text-[#006A4E]" />
        <h4 className="text-sm font-extrabold text-gray-950 uppercase tracking-tight">Application Progress Timeline</h4>
      </div>

      <div className="relative pl-10 space-y-8 select-none">
        
        {/* Dynamic vertical background track connecting lines */}
        <div className="absolute left-[15px] top-3 bottom-3 w-1 bg-gray-150 rounded-full" aria-hidden="true" />

        {/* Green connecting line that dynamically fills up to current milestone index with slide ease-in animation */}
        <div 
          className="absolute left-[15px] top-3 w-1 bg-[#006A4E] rounded-full origin-top animate-clip-slide"
          style={{ 
            height: `calc(${fillPercentage}% - 8px)`,
            maxHeight: '100%'
          }} 
          aria-hidden="true"
        />

        {/* Milestone Rows mapping */}
        {milestones.map((milestone, idx) => {
          const { label, date, status } = milestone;
          
          let circleBg = 'bg-gray-100 border-gray-300 text-gray-400';
          let StatusIcon = Circle;
          let labelColor = 'text-gray-500 font-medium';

          if (status === 'completed') {
            circleBg = 'bg-emerald-50 text-[#006A4E] border-[#006A4E]';
            StatusIcon = Check;
            labelColor = 'text-gray-900 font-bold';
          } else if (status === 'current') {
            circleBg = 'bg-white text-[#006A4E] border-[#006A4E] animate-scale-pulse';
            StatusIcon = Clock;
            labelColor = 'text-[#006A4E] font-extrabold';
          } else if (status === 'overdue') {
            circleBg = 'bg-rose-50 text-[#F42A41] border-[#F42A41]';
            StatusIcon = AlertTriangle;
            labelColor = 'text-[#F42A41] font-extrabold';
          }

          return (
            <div key={idx} className="relative flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1 sm:gap-4 group">
              
              {/* Left positioned bullet indicators */}
              <span className={`absolute left-[-35px] top-1.5 sm:top-auto w-8 h-8 rounded-full border-2 flex items-center justify-center transition-all duration-300 z-10 ${circleBg}`}>
                <StatusIcon className="w-4 h-4 shrink-0" aria-hidden="true" />
              </span>

              {/* Status details description */}
              <div className="text-left flex-1 min-w-0 pr-2">
                <span className={`text-xs block leading-tight transition-colors duration-200 ${labelColor}`}>
                  {label}
                </span>
                {date && (
                  <span className="text-[10px] text-gray-400 font-mono font-semibold tracking-tight mt-0.5 block">
                    {date}
                  </span>
                )}
              </div>

              {/* Status visual pill for badge tracking */}
              <div className="sm:text-right shrink-0">
                <span className={`inline-flex items-center gap-1 text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full border ${
                  status === 'completed'
                    ? 'bg-emerald-50 text-emerald-800 border-emerald-100'
                    : status === 'current'
                    ? 'bg-amber-50 text-amber-800 border-amber-100'
                    : status === 'overdue'
                    ? 'bg-red-50 text-red-800 border-red-100'
                    : 'bg-gray-50 text-gray-600 border-gray-100'
                }`}>
                  {status}
                </span>
              </div>

            </div>
          );
        })}

      </div>
    </div>
  );
}
