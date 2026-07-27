import React from 'react';

// Reusable text skeleton block
export function SkeletonText({ lines = 3, className = '' }) {
  return (
    <div className={`space-y-2.5 ${className}`} aria-hidden="true">
      {Array.from({ length: lines }).map((_, idx) => (
        <div 
          key={idx} 
          className="h-3 bg-gray-200 rounded-md skeleton-pulse"
          style={{ width: idx === lines - 1 ? '60%' : '100%' }}
        />
      ))}
    </div>
  );
}

// Reusable table/list row skeleton
export function SkeletonRow({ columns = 4, className = '' }) {
  return (
    <div className={`flex items-center justify-between gap-4 py-4 px-3 border-b border-gray-100 ${className}`} aria-hidden="true">
      {Array.from({ length: columns }).map((_, idx) => (
        <div 
          key={idx} 
          className="h-3.5 bg-gray-200 rounded-md skeleton-pulse"
          style={{ width: `${100 / (columns + 1) + (idx % 2 === 0 ? 15 : -10)}%` }}
        />
      ))}
    </div>
  );
}

// Reusable cards grid skeleton block
export function SkeletonCard({ className = '' }) {
  return (
    <div className={`bg-white border border-gray-200 rounded-2xl p-6 space-y-4 shadow-sm ${className}`} aria-hidden="true">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-gray-200 skeleton-pulse shrink-0" />
        <div className="space-y-1.5 flex-1">
          <div className="h-3.5 bg-gray-200 rounded-md w-1/3 skeleton-pulse" />
          <div className="h-2.5 bg-gray-200 rounded-md w-1/2 skeleton-pulse" />
        </div>
      </div>
      <div className="pt-2">
        <SkeletonText lines={2} />
      </div>
      <div className="w-full h-8 bg-gray-100 rounded-lg skeleton-pulse pt-4" />
    </div>
  );
}

// Default export wrapper containing all modules
export default {
  Text: SkeletonText,
  Row: SkeletonRow,
  Card: SkeletonCard
};
