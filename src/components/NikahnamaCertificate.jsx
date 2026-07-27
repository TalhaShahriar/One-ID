import React, { useRef } from 'react';
import { 
  Printer, 
  ShieldCheck, 
  FileText, 
  UserCheck, 
  DollarSign 
} from 'lucide-react';

export default function NikahnamaCertificate({ marriage }) {
  const certificateRef = useRef(null);

  if (!marriage) return null;

  // Simple print handler acting as a PDF export layout
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
          className="relative min-w-[620px] bg-[#FFF8E7] rounded-xl p-8 sm:p-12 shadow-2xl relative select-none font-sans"
          style={{
            border: '4px double #006A4E',
            outline: '2px solid #006A4E',
            outlineOffset: '6px',
            margin: '8px'
          }}
          id="sovereign-nikahnama"
        >
          {/* Watermarked Sovereign Emblem BG */}
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_rgba(0,106,78,0.03)_0%,_transparent_75%)] pointer-events-none" aria-hidden="true" />

          {/* 4 Corner decorations (traditional small squares with double borders) */}
          <div className="absolute top-3 left-3 w-7 h-7 border-double border-4 border-[#006A4E] pointer-events-none" aria-hidden="true" />
          <div className="absolute top-3 right-3 w-7 h-7 border-double border-4 border-[#006A4E] pointer-events-none" aria-hidden="true" />
          <div className="absolute bottom-3 left-3 w-7 h-7 border-double border-4 border-[#006A4E] pointer-events-none" aria-hidden="true" />
          <div className="absolute bottom-3 right-3 w-7 h-7 border-double border-4 border-[#006A4E] pointer-events-none" aria-hidden="true" />

          {/* Header Area using Serif font */}
          <div className="text-center space-y-2 relative pt-2">
            
            {/* Government Seal (Circular green div, "People's Republic of Bangladesh", small OneID inside) */}
            <div className="mx-auto w-20 h-20 rounded-full border-4 border-[#006A4E] bg-white/80 p-1.5 flex flex-col items-center justify-center shadow-md relative group shrink-0">
              <div className="absolute inset-0 rounded-full border border-dashed border-[#F42A41]/40 animate-spin" style={{ animationDuration: '24s' }} />
              <div className="text-[6.5px] font-black text-[#006A4E] leading-shorter text-center uppercase tracking-tighter w-full pt-1">
                Govt Emblem
              </div>
              <ShieldCheck className="w-6 h-6 text-[#006A4E] mt-0.5" aria-hidden="true" />
              <div className="text-[5.5px] font-mono font-extrabold text-[#F42A41] uppercase tracking-wider mt-0.5">
                ONEID SECURE
              </div>
            </div>

            <div className="space-y-1 mt-4">
              <p className="text-[10px] font-black text-[#006A4E] font-sans tracking-widest uppercase">
                CIVIL REGISTRY • PEOPLE'S REPUBLIC OF BANGLADESH 🇧🇩
              </p>
              <h2 className="text-3xl font-serif font-black text-[#006A4E] tracking-tight leading-tight mt-1">
                Sovereign Nikahnama Certificate
              </h2>
              <div className="text-sm font-bangla font-semibold text-[#006A4E]/90 bg-[#006A4E]/5 px-3 py-1 rounded-md inline-block border border-[#006A4E]/10">
                ডিজিটাল নিকাহনামা (মুসলিম বিবাহ নিবন্ধন আইনের অধীনে)
              </div>
              <p className="text-[10px] uppercase font-mono font-bold text-yellow-800 tracking-wider">
                Solemnized Under Muslim Marriages & Divorces (Registration) Act
              </p>
            </div>

            <div className="mx-auto w-40 border-b border-[#006A4E]/25 pt-2" />
          </div>

          {/* Fields in Formal 2-column layout */}
          <div className="grid grid-cols-2 gap-x-12 gap-y-6 text-xs text-stone-800 pt-8 relative">
            
            {/* Groom Section (স্বামী) */}
            <div className="space-y-4 border-r border-[#006A4E]/15 pr-6">
              
              <div className="border-b border-dashed border-[#006A4E]/10 pb-2">
                <span className="inline-flex items-center gap-1.5 text-[10px] font-black text-[#006A4E] uppercase tracking-wider mb-1 font-sans">
                  Groom Details (স্বামী)
                </span>
                <div className="space-y-1 font-sans">
                  <span className="text-[9.5px] text-stone-400 font-bold block">1. GROOM ONEID IDENTIFICATION</span>
                  <strong className="font-mono text-sm font-black text-[#006A4E] block">{marriage.groomOneId}</strong>
                </div>
              </div>

              <div className="space-y-1.5">
                <span className="text-[9.5px] text-stone-400 font-bold block font-sans">2. WITNESS ADVISORY 01 (সাক্ষী ১)</span>
                <div className="font-mono bg-white/70 p-2 rounded border border-[#006A4E]/10 flex items-center justify-between">
                  <span className="font-black text-stone-700">{marriage.witness1OneId}</span>
                  <span className="text-[8.5px] bg-[#E8F5F1] text-[#006A4E] px-1.5 py-0.5 rounded font-sans font-bold">VERIFIED</span>
                </div>
              </div>

              <div className="space-y-1 mt-2">
                <span className="text-[9.5px] text-stone-400 font-bold block font-sans">3. MARITAL UNION CONSENT STATUS</span>
                <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-emerald-50 text-[#006A4E] rounded-md font-bold text-[10px] border border-emerald-200">
                  <UserCheck className="w-3.5 h-3.5" /> Groom Authorized & Sealed
                </span>
              </div>
            </div>

            {/* Bride Section (স্ত্রী) */}
            <div className="space-y-4 pl-2">
              
              <div className="border-b border-dashed border-[#006A4E]/10 pb-2">
                <span className="inline-flex items-center gap-1.5 text-[10px] font-black text-[#006A4E] uppercase tracking-wider mb-1 font-sans">
                  Bride Details (কনে)
                </span>
                <div className="space-y-1 font-sans">
                  <span className="text-[9.5px] text-stone-400 font-bold block">1. BRIDE ONEID IDENTIFICATION</span>
                  <strong className="font-mono text-sm font-black text-[#006A4E] block">{marriage.brideOneId}</strong>
                </div>
              </div>

              <div className="space-y-1.5">
                <span className="text-[9.5px] text-stone-400 font-bold block font-sans">2. WITNESS ADVISORY 02 (সাক্ষী ২)</span>
                <div className="font-mono bg-white/70 p-2 rounded border border-[#006A4E]/10 flex items-center justify-between">
                  <span className="font-black text-stone-700">{marriage.witness2OneId}</span>
                  <span className="text-[8.5px] bg-[#E8F5F1] text-[#006A4E] px-1.5 py-0.5 rounded font-sans font-bold">VERIFIED</span>
                </div>
              </div>

              <div className="space-y-1">
                <span className="text-[9.5px] text-stone-400 font-bold block font-sans">3. REGISTRAR SEAL (কাজী বা কাজী লাইসেন্স)</span>
                <div className="text-[10px] font-sans font-bold text-yellow-905 block leading-tight">
                  Kazi ID: <strong className="font-mono font-black text-stone-700">{marriage.kaziOneId}</strong>
                </div>
              </div>
            </div>

            {/* Middle horizontal row for Mahr / Dower Fee (মোহরানা) */}
            <div className="col-span-2 pt-4 mt-2 border-t border-dashed border-[#006A4E]/20 grid grid-cols-2 gap-8 bg-[#006a4e]/5 p-4 rounded-xl border border-[#006a4e]/10">
              
              <div className="space-y-1">
                <span className="block text-[10px] font-bold text-[#006A4E] uppercase tracking-wide font-sans">
                  Dower / Mahr Fee (মোহরানা)
                </span>
                <div className="text-lg font-black text-[#006A4E] flex items-center gap-1">
                  <span className="text-xs text-amber-700 font-extrabold font-bangla">৳</span>
                  {parseFloat(marriage.mahrAmountBDT).toLocaleString()} BDT
                </div>
                <div className="text-[10px] font-semibold text-yellow-850 uppercase font-mono leading-none">
                  Classification: <span className="underline decoration-[#F42A41]">{marriage.mahrType} Dower</span>
                </div>
              </div>

              <div className="space-y-1 pr-2">
                <span className="block text-[10px] font-bold text-stone-400 uppercase tracking-widest font-sans">
                  Sovereign Timestamp of Solemnization
                </span>
                <div className="font-semibold text-stone-800 text-[11px] font-sans mt-1">
                  {new Date(marriage.registrationDate).toLocaleDateString(undefined, {weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'})}
                </div>
                <div className="text-[8.5px] font-mono text-emerald-700 font-bold leading-none uppercase">
                  ⚡ Sealed via direct Union link
                </div>
              </div>
            </div>

          </div>

          {/* Blockchain Signature Footer */}
          <div className="border-t border-[#006A4E]/25 pt-6 mt-8 flex flex-col md:flex-row justify-between items-center gap-4 relative">
            <div className="space-y-1 text-center md:text-left">
              <span className="text-[8px] font-bold text-stone-400 uppercase tracking-widest block font-sans">
                Ledger Verification Checksum
              </span>
              <span className="font-mono text-[9px] font-black text-[#006A4E] bg-white/90 hover:bg-white px-3 py-2 rounded-lg border border-[#006A4E]/15 block shadow-3xs select-all cursor-copy">
                🔑 {marriage.nikahnaamaHash}
              </span>
            </div>

            <div className="flex items-center gap-3.5 bg-[#006A4E] text-white px-5 py-3 rounded-2xl border border-yellow-600/30 shadow-md">
              <div className="shrink-0 bg-yellow-500 p-1.5 rounded-lg text-emerald-950">
                <ShieldCheck className="h-4 w-4" aria-hidden="true" />
              </div>
              <div className="leading-tight text-left">
                <span className="text-[8px] uppercase font-bold text-yellow-400 block tracking-wider font-sans">
                  Union Ledger Registered
                </span>
                <span className="text-[9.5px] font-mono block font-black text-emerald-200">
                  REG-ID: {marriage.marriageId}
                </span>
              </div>
            </div>
          </div>

        </div>
      </div>

      {/* Printable/Export Action Trigger Button */}
      <div className="flex items-center justify-center p-2">
        <button
          onClick={handlePrint}
          className="min-h-[44px] px-6 py-2.5 bg-[#006A4E] hover:bg-[#005a42] text-white rounded-xl text-xs font-bold transition-all shadow-md focus:ring-2 focus:ring-[#006A4E] focus:ring-offset-2 flex items-center justify-center gap-2 cursor-pointer"
          id="export-nikah-pdf-btn"
        >
          <Printer className="w-4 h-4" />
          <span>Print / Export Traditional Parchment PDF</span>
        </button>
      </div>

    </div>
  );
}
