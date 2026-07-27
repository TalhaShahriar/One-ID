import React from 'react';
import { Link } from 'react-router-dom';
import { HelpCircle, FileText, MessageCircle, ShieldCheck, Database, CheckCircle2 } from 'lucide-react';

export default function Footer() {
  return (
    <footer className="mt-12 py-6 px-4 border-t border-slate-200 bg-white text-center text-xs text-slate-500">
      <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
        <p>&copy; {new Date().getFullYear()} Bangladesh OneID Node. All Rights Reserved.</p>
        <div className="flex items-center gap-5 font-semibold flex-wrap justify-center text-slate-600">
          <Link to="/help" className="hover:text-[#006A4E] transition-colors flex items-center gap-1.5">
            <HelpCircle className="w-3.5 h-3.5 text-emerald-600" />
            Help Zone
          </Link>
          <Link to="/help" className="hover:text-[#006A4E] transition-colors flex items-center gap-1.5">
            <MessageCircle className="w-3.5 h-3.5 text-emerald-600" />
            FAQs
          </Link>
          <Link to="/help" className="hover:text-[#006A4E] transition-colors flex items-center gap-1.5">
            <FileText className="w-3.5 h-3.5 text-emerald-600" />
            User Manual
          </Link>
          <Link to="/verify" className="hover:text-[#006A4E] transition-colors flex items-center gap-1.5">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
            Public Ledger
          </Link>
          <Link to="/blockchain-visualizer" className="hover:text-[#006A4E] transition-colors flex items-center gap-1.5">
            <Database className="w-3.5 h-3.5 text-emerald-600" />
            Blockchain Explorer
          </Link>
          <Link to="/settings" className="hover:text-[#006A4E] transition-colors flex items-center gap-1.5 hidden md:flex">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
            Security & Privacy
          </Link>
        </div>
      </div>
    </footer>
  );
}
