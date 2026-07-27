import React from 'react';
import { 
  CheckCircle, 
  Clock, 
  AlertTriangle, 
  AlertCircle, 
  HelpCircle,
  XCircle,
  CalendarDays
} from 'lucide-react';

export default function StatusBadge({ status, module = null, className = '' }) {
  const normStatus = (status || '').toUpperCase();
  
  // Define mapping for colors and icons
  let colors = 'bg-gray-100 text-gray-700 border-gray-200';
  let Icon = HelpCircle;
  let statusText = status || 'Unknown';

  if (['ACTIVE', 'APPROVED', 'COMPLETED', 'FINALIZED'].includes(normStatus)) {
    colors = 'bg-emerald-50 text-emerald-800 border-emerald-200';
    Icon = CheckCircle;
    statusText = status;
  } else if (normStatus === 'PENDING' || normStatus === 'ARBITRATION_ACTIVE' || normStatus.startsWith('PENDING_')) {
    colors = 'bg-amber-50 text-amber-800 border-amber-200';
    Icon = Clock;
    statusText = status.replace(/_/g, ' ');
  } else if (['SUSPENDED', 'REJECTED', 'DISPUTED'].includes(normStatus)) {
    colors = 'bg-red-50 text-red-800 border-red-200';
    Icon = AlertCircle;
    statusText = status;
  } else if (normStatus === 'EXPIRED') {
    colors = 'bg-gray-100 text-gray-600 border-gray-300';
    Icon = CalendarDays;
    statusText = status;
  }

  // Handle module-specific border overrides and CSS tokens
  let borderOverride = '';
  if (module) {
    const normModule = module.toLowerCase();
    if (normModule === 'voting') {
      borderOverride = 'border-l-4 border-l-[#7C3AED]';
    } else if (normModule === 'tax') {
      borderOverride = 'border-l-4 border-l-[#D97706]';
    } else if (normModule === 'vehicle') {
      borderOverride = 'border-l-4 border-l-[#0F6E56]';
    } else if (normModule === 'property') {
      borderOverride = 'border-l-4 border-l-[#D85A30]';
    } else if (normModule === 'civil') {
      borderOverride = 'border-l-4 border-l-[#D4537E]';
    }
  }

  return (
    <span 
      className={`inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-bold rounded-md border shadow-2xs ${colors} ${borderOverride} ${className}`}
      aria-label={`Status: ${statusText}`}
    >
      <Icon className="w-3.5 h-3.5" aria-hidden="true" />
      <span className="capitalize">{statusText.toLowerCase()}</span>
    </span>
  );
}
