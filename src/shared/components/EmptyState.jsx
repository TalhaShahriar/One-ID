import React from 'react';
import { HelpCircle } from 'lucide-react';

export default function EmptyState({ 
  icon: IconComponent = HelpCircle, 
  title = 'No Records Found', 
  description = 'There are currently no active logs registered in this sector cabinet.', 
  actionLabel = '', 
  onAction = null 
}) {
  return (
    <div className="flex flex-col items-center justify-center p-8 md:p-12 text-center bg-white border border-gray-200 rounded-2xl shadow-sm max-w-lg mx-auto">
      <div className="bg-[#E8F5F1] text-[#006A4E] p-4 rounded-full mb-4 flex items-center justify-center border border-[#006A4E]/10 animate-fade-in">
        <IconComponent className="w-8 h-8" aria-hidden="true" />
      </div>
      
      <h3 className="text-base font-extrabold text-gray-900 tracking-tight mb-2">
        {title}
      </h3>
      
      <p className="text-xs text-gray-500 leading-relaxed max-w-sm mb-6 font-medium">
        {description}
      </p>

      {actionLabel && onAction && (
        <button
          onClick={onAction}
          className="min-h-[44px] min-w-[120px] px-5 py-2.5 bg-[#006A4E] hover:bg-[#005a42] text-white rounded-xl text-xs font-bold transition-all shadow-sm focus:ring-2 focus:ring-[#006A4E] focus:ring-offset-2 focus:outline-none cursor-pointer flex items-center justify-center gap-2"
          id="empty-state-action-btn"
        >
          {actionLabel}
        </button>
      )}
    </div>
  );
}
