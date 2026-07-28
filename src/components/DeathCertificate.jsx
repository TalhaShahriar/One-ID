import React, { useRef } from 'react';
import { Printer, ShieldCheck, FileText, CheckCircle2, Copy } from 'lucide-react';
import { toast } from 'sonner';

export default function DeathCertificate({ deathRecord }) {
  const certificateRef = useRef(null);

  if (!deathRecord) return null;

  const handlePrint = () => {
    window.print();
  };

  const formattedDod = new Date(deathRecord.dateOfDeath).toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  });

  const formattedRegDate = new Date(deathRecord.createdAt || Date.now()).toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  });

  const verificationUrl = `${window.location.origin}/civil-registry?verify=${deathRecord.id}`;

  return (
    <div className="space-y-6">
      <div className="w-full overflow-x-auto">
        <div 
          ref={certificateRef}
          className="relative min-w-[620px] bg-[#FAF8F5] rounded-xl p-8 sm:p-12 shadow-2xl select-none font-sans"
          style={{
            border: '4px double #1E293B',
            outline: '2px solid #1E293B',
            outlineOffset: '6px',
            margin: '8px'
          }}
          id="sovereign-death-certificate"
        >
          {/* Watermarked Sovereign Emblem BG */}
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_rgba(30,41,59,0.03)_0%,_transparent_75%)] pointer-events-none" />

          {/* Corner decorations */}
          <div className="absolute top-3 left-3 w-7 h-7 border-double border-4 border-slate-800 pointer-events-none" />
          <div className="absolute top-3 right-3 w-7 h-7 border-double border-4 border-slate-800 pointer-events-none" />
          <div className="absolute bottom-3 left-3 w-7 h-7 border-double border-4 border-slate-800 pointer-events-none" />
          <div className="absolute bottom-3 right-3 w-7 h-7 border-double border-4 border-slate-800 pointer-events-none" />

          {/* Header */}
          <div className="text-center space-y-2 relative pt-2">
            <div className="mx-auto w-20 h-20 rounded-full border-4 border-slate-800 bg-white p-1.5 flex flex-col items-center justify-center shadow-md relative shrink-0">
              <ShieldCheck className="w-7 h-7 text-slate-800" />
              <div className="text-[5.5px] font-mono font-extrabold text-slate-700 uppercase tracking-wider mt-0.5">
                ONEID OFFICIAL
              </div>
            </div>

            <div className="space-y-1 mt-4">
              <p className="text-[10px] font-black text-slate-800 tracking-widest uppercase">
                PEOPLE'S REPUBLIC OF BANGLADESH 🇧🇩 • DEPARTMENT OF CIVIL REGISTRATION
              </p>
              <h2 className="text-3xl font-serif font-black text-slate-900 tracking-tight leading-tight">
                Digital Death Registration Certificate
              </h2>
              <div className="text-sm font-semibold text-slate-800 bg-slate-100 px-4 py-1 rounded-md inline-block border border-slate-300">
                মৃত্যু নিবন্ধন সনদ (Birth and Death Registration Act, 2004)
              </div>
            </div>

            <div className="mx-auto w-48 border-b border-slate-300 pt-2" />
          </div>

          {/* Certificate Body Details */}
          <div className="mt-8 space-y-6 text-slate-800">
            <div className="bg-slate-100 p-4 rounded-xl border border-slate-200 flex items-center justify-between">
              <div>
                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">Death Registration Number (DRN)</span>
                <span className="font-mono text-sm font-black text-slate-900">{deathRecord.id}</span>
              </div>
              <div className="text-right">
                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">Date of Registration</span>
                <span className="text-xs font-bold text-slate-700">{formattedRegDate}</span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-6 text-xs">
              <div className="space-y-4">
                <div className="p-3.5 bg-white rounded-lg border border-slate-200">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Deceased OneID Number</span>
                  <span className="text-sm font-mono font-bold text-slate-900">{deathRecord.deceasedOneId}</span>
                </div>

                <div className="p-3.5 bg-white rounded-lg border border-slate-200">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Date of Death</span>
                  <span className="text-xs font-bold text-slate-800">{formattedDod}</span>
                </div>
              </div>

              <div className="space-y-4">
                <div className="p-3.5 bg-white rounded-lg border border-slate-200">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Stated Cause of Death</span>
                  <span className="text-xs font-bold text-slate-800">{deathRecord.causeOfDeath || 'Natural Causes'}</span>
                </div>

                <div className="p-3.5 bg-white rounded-lg border border-slate-200">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Blockchain Ledger Seal</span>
                  <span className="text-[10px] font-mono font-bold text-slate-700 break-all">{deathRecord.ledgerRecordId || '0x' + deathRecord.id.replace(/-/g, '')}</span>
                </div>
              </div>
            </div>

            {/* Bottom Footer Seal */}
            <div className="pt-6 border-t border-dashed border-slate-400 flex items-center justify-between text-[11px] text-slate-600">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5 text-slate-800" />
                <div>
                  <p className="font-bold text-slate-800">Authentic Civil Registration Document</p>
                  <p className="text-[10px] text-slate-500">Recorded on Bangladesh OneID Civil Registry Ledger</p>
                </div>
              </div>

              <div className="text-right space-y-1">
                <div className="inline-block px-3 py-1 bg-slate-200 text-slate-900 rounded-md font-mono text-[10px] font-black border border-slate-300">
                  SEALED & DEACTIVATED
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Action Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
        <div className="flex items-center gap-2 text-xs text-slate-500 font-medium">
          <FileText className="w-4 h-4 text-slate-600" />
          <span>Certificate ID: <strong className="font-mono text-slate-800">{deathRecord.id}</strong></span>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => {
              navigator.clipboard.writeText(verificationUrl);
              toast.success('Certificate verification link copied to clipboard!');
            }}
            className="px-3.5 py-2 text-xs font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors flex items-center gap-1.5"
          >
            <Copy className="w-3.5 h-3.5" />
            Copy Verification Link
          </button>

          <button
            onClick={handlePrint}
            className="px-4 py-2 text-xs font-bold text-white bg-slate-800 hover:bg-slate-900 rounded-xl shadow-md transition-colors flex items-center gap-1.5"
          >
            <Printer className="w-3.5 h-3.5" />
            Print / Save PDF
          </button>
        </div>
      </div>
    </div>
  );
}
