import React, { useRef } from 'react';
import { 
  Printer, 
  ShieldCheck, 
  FileText, 
  UserX, 
  HeartCrack,
  Calendar,
  AlertTriangle,
  Scale
} from 'lucide-react';

export default function DivorceCertificate({ marriage }) {
  const certificateRef = useRef(null);

  if (!marriage || !marriage.divorceProceeding) return null;

  const proc = marriage.divorceProceeding;

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-6">
      
      {/* Scrollable Container Wrapper for mobile viewports */}
      <div className="w-full overflow-x-auto">
        
        {/* Certificate Parchment Block */}
        <div 
          ref={certificateRef}
          className="relative min-w-[620px] bg-[#FFFBF0] rounded-xl p-8 sm:p-12 shadow-2xl relative select-none font-sans"
          style={{
            border: '4px double #9A3412', // Warm amber-rust double border
            outline: '2px solid #9A3412',
            outlineOffset: '6px',
            margin: '8px'
          }}
          id="sovereign-divorce-certificate"
        >
          {/* Watermarked Sovereign Emblem BG */}
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_rgba(154,52,18,0.02)_0%,_transparent_75%)] pointer-events-none" aria-hidden="true" />

          {/* 4 Corner decorations */}
          <div className="absolute top-3 left-3 w-7 h-7 border-double border-4 border-[#9A3412] pointer-events-none" aria-hidden="true" />
          <div className="absolute top-3 right-3 w-7 h-7 border-double border-4 border-[#9A3412] pointer-events-none" aria-hidden="true" />
          <div className="absolute bottom-3 left-3 w-7 h-7 border-double border-4 border-[#9A3412] pointer-events-none" aria-hidden="true" />
          <div className="absolute bottom-3 right-3 w-7 h-7 border-double border-4 border-[#9A3412] pointer-events-none" aria-hidden="true" />

          {/* Header Area */}
          <div className="text-center space-y-2 relative pt-2">
            
            {/* Government Seal */}
            <div className="mx-auto w-20 h-20 rounded-full border-4 border-[#9A3412] bg-white/80 p-1.5 flex flex-col items-center justify-center shadow-md relative group shrink-0">
              <div className="absolute inset-0 rounded-full border border-dashed border-red-650/40 animate-spin" style={{ animationDuration: '24s' }} />
              <div className="text-[6.5px] font-black text-[#9A3412] leading-shorter text-center uppercase tracking-tighter w-full pt-1">
                Govt Seal
              </div>
              <Scale className="w-6 h-6 text-[#9A3412] mt-0.5" aria-hidden="true" />
              <div className="text-[5.5px] font-mono font-extrabold text-red-650 uppercase tracking-wider mt-0.5">
                ONEID CIVIL
              </div>
            </div>

            <div className="space-y-1 mt-4">
              <p className="text-[10px] font-black text-[#9A3412] font-sans tracking-widest uppercase">
                CIVIL REGISTRY • PEOPLE'S REPUBLIC OF BANGLADESH 🇧🇩
              </p>
              <h2 className="text-3xl font-serif font-black text-[#9A3412] tracking-tight leading-tight mt-1">
                Certificate of Marital Dissolution
              </h2>
              <div className="text-xs font-bangla font-semibold text-red-800 bg-red-50 px-3 py-1 rounded-md inline-block border border-red-200">
                বিবাহ বিচ্ছেদ সনদপত্র (মুসলিম পারিবারিক আইন ও দেওয়ানী বিধিমালা)
              </div>
              <p className="text-[9px] uppercase font-mono font-bold text-[#9A3412] tracking-wider mt-1">
                Registered under Muslim Marriages & Divorces Act / Civil Registry Code
              </p>
            </div>

            <div className="mx-auto w-40 border-b border-[#9A3412]/25 pt-2" />
          </div>

          {/* Fields in Formal 2-column layout */}
          <div className="grid grid-cols-2 gap-x-12 gap-y-6 text-xs text-stone-850 pt-8 relative">
            
            {/* Left Side: Original Marriage & Spouses */}
            <div className="space-y-4 border-r border-[#9A3412]/15 pr-6">
              
              <div>
                <span className="inline-flex items-center gap-1.5 text-[10px] font-black text-[#9A3412] uppercase tracking-wider mb-1 font-sans">
                  Original Union Details
                </span>
                <div className="space-y-1 bg-amber-50/40 p-2.5 rounded-lg border border-[#9A3412]/10">
                  <div className="flex justify-between">
                    <span className="text-[9px] text-stone-500 font-bold">MARRIAGE REGISTRATION ID</span>
                    <span className="font-mono font-bold text-stone-700">{marriage.marriageId}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[9px] text-stone-500 font-bold">SOLEMNIZATION DATE</span>
                    <span className="font-mono font-bold text-stone-700">
                      {new Date(marriage.registrationDate).toLocaleDateString()}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[9px] text-stone-500 font-bold">RELIGION</span>
                    <span className="font-mono font-bold text-stone-700">{marriage.religion}</span>
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <span className="inline-flex items-center gap-1.5 text-[10px] font-black text-[#9A3412] uppercase tracking-wider font-sans">
                  Parties of the Union
                </span>
                <div className="space-y-1.5">
                  <div className="font-mono bg-white/70 p-2 rounded border border-[#9A3412]/10 flex items-center justify-between">
                    <span className="text-[9px] text-stone-500 font-bold font-sans">GROOM (স্বামী):</span>
                    <span className="font-black text-stone-800">{marriage.groomOneId}</span>
                  </div>
                  <div className="font-mono bg-white/70 p-2 rounded border border-[#9A3412]/10 flex items-center justify-between">
                    <span className="text-[9px] text-stone-500 font-bold font-sans">BRIDE (স্ত্রী):</span>
                    <span className="font-black text-stone-800">{marriage.brideOneId}</span>
                  </div>
                </div>
              </div>

            </div>

            {/* Right Side: Dissolution & Arbitration */}
            <div className="space-y-4 pl-2">
              
              <div className="border-b border-dashed border-[#9A3412]/10 pb-3">
                <span className="inline-flex items-center gap-1.5 text-[10px] font-black text-[#9A3412] uppercase tracking-wider mb-1 font-sans">
                  Dissolution Records
                </span>
                <div className="space-y-2 font-sans mt-2">
                  <div className="flex justify-between">
                    <span className="text-[9.5px] text-stone-500 font-bold">DISSOLUTION TYPE</span>
                    <span className="font-black text-red-700 bg-red-50 border border-red-150 px-2 py-0.5 rounded text-[10px] uppercase font-mono tracking-wider">
                      {proc.divorceType}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[9.5px] text-stone-500 font-bold">INITIATOR ID</span>
                    <strong className="font-mono text-stone-700">{proc.initiatorOneId}</strong>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[9.5px] text-stone-500 font-bold">NOTICE FILED ON</span>
                    <span className="font-mono text-stone-700 font-bold">
                      {new Date(proc.noticeFiledAt).toLocaleDateString()}
                    </span>
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <span className="inline-flex items-center gap-1.5 text-[10px] font-black text-stone-500 uppercase tracking-wider font-sans">
                  Arbitration Council & Conciliation
                </span>
                <div className="space-y-1 bg-white/70 p-2.5 rounded border border-[#9A3412]/10 text-[11px] font-sans">
                  <div className="flex justify-between">
                    <span className="text-stone-500 font-semibold">ARBITRATION CHAIRMAN:</span>
                    <span className="font-mono font-bold text-stone-800">{proc.chairmanOneId || 'Union Node Assigned'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-stone-500 font-semibold">RECONCILIATION SESSIONS:</span>
                    <span className="font-bold text-[#9A3412]">{proc.reconciliationAttempts} Attempts Logged</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-stone-500 font-semibold">EFFECTIVE DATE:</span>
                    <span className="font-mono font-bold text-stone-800">
                      {proc.actualEffectiveDate ? new Date(proc.actualEffectiveDate).toLocaleDateString() : new Date(proc.effectiveDate).toLocaleDateString()}
                    </span>
                  </div>
                </div>
              </div>

            </div>

            {/* Middle Dissolved Stamp Overlay */}
            <div className="col-span-2 flex justify-center py-2">
              <div className="border-4 border-dashed border-red-700 text-red-700 font-mono font-black text-base px-8 py-3 rounded-2xl tracking-widest uppercase select-none opacity-85 rotate-1">
                DISSOLVED • বিবাহ বিচ্ছেদ সম্পন্ন
              </div>
            </div>

          </div>

          {/* Blockchain Checksum & Ledger Footer */}
          <div className="border-t border-[#9A3412]/25 pt-6 mt-6 flex flex-col md:flex-row justify-between items-center gap-4 relative">
            <div className="space-y-1 text-center md:text-left">
              <span className="text-[8px] font-bold text-stone-400 uppercase tracking-widest block font-sans">
                Ledger Dissolution Checksum
              </span>
              <span className="font-mono text-[9px] font-black text-[#9A3412] bg-white/90 hover:bg-white px-3 py-2 rounded-lg border border-[#9A3412]/15 block shadow-3xs select-all cursor-copy">
                🔑 {proc.certificateHash}
              </span>
            </div>

            <div className="flex items-center gap-3.5 bg-[#9A3412] text-white px-5 py-3 rounded-2xl border border-yellow-600/30 shadow-md">
              <div className="shrink-0 bg-yellow-500 p-1.5 rounded-lg text-emerald-950">
                <ShieldCheck className="h-4 w-4" aria-hidden="true" />
              </div>
              <div className="leading-tight text-left">
                <span className="text-[8px] uppercase font-bold text-yellow-400 block tracking-wider font-sans">
                  Sovereign Civil Ledger Registered
                </span>
                <span className="text-[9.5px] font-mono block font-black text-orange-200">
                  DISS-ID: {proc.id.slice(0, 18).toUpperCase()}
                </span>
              </div>
            </div>
          </div>

        </div>
      </div>

      {/* Printable/Export Button */}
      <div className="flex items-center justify-center p-2">
        <button
          onClick={handlePrint}
          className="min-h-[44px] px-6 py-2.5 bg-[#9A3412] hover:bg-[#852c0f] text-white rounded-xl text-xs font-bold transition-all shadow-md focus:ring-2 focus:ring-[#9A3412] focus:ring-offset-2 flex items-center justify-center gap-2 cursor-pointer"
          id="export-divorce-pdf-btn"
        >
          <Printer className="w-4 h-4" />
          <span>Print / Export Dissolution Certificate PDF</span>
        </button>
      </div>

    </div>
  );
}
