import React, { useRef } from 'react';
import { Printer, ShieldCheck, FileText, CheckCircle2, Copy } from 'lucide-react';
import { toast } from 'sonner';

export default function BirthCertificate({ birthRecord }) {
  const certificateRef = useRef(null);

  if (!birthRecord) return null;

  const handlePrint = () => {
    window.print();
  };

  const formattedDob = new Date(birthRecord.dateOfBirth).toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  });

  const formattedRegDate = new Date(birthRecord.createdAt || Date.now()).toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  });

  const verificationUrl = `${window.location.origin}/civil-registry?verify=${birthRecord.id}`;

  return (
    <div className="space-y-6">
      <div className="w-full overflow-x-auto">
        <div 
          ref={certificateRef}
          className="relative min-w-[620px] bg-[#FAF8F5] rounded-xl p-8 sm:p-12 shadow-2xl select-none font-sans"
          style={{
            border: '4px double #006A4E',
            outline: '2px solid #006A4E',
            outlineOffset: '6px',
            margin: '8px'
          }}
          id="sovereign-birth-certificate"
        >
          {/* Watermarked Sovereign Emblem BG */}
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_rgba(0,106,78,0.03)_0%,_transparent_75%)] pointer-events-none" />

          {/* Corner decorations */}
          <div className="absolute top-3 left-3 w-7 h-7 border-double border-4 border-[#006A4E] pointer-events-none" />
          <div className="absolute top-3 right-3 w-7 h-7 border-double border-4 border-[#006A4E] pointer-events-none" />
          <div className="absolute bottom-3 left-3 w-7 h-7 border-double border-4 border-[#006A4E] pointer-events-none" />
          <div className="absolute bottom-3 right-3 w-7 h-7 border-double border-4 border-[#006A4E] pointer-events-none" />

          {/* Header */}
          <div className="text-center space-y-2 relative pt-2">
            <div className="mx-auto w-20 h-20 rounded-full border-4 border-[#006A4E] bg-white p-1.5 flex flex-col items-center justify-center shadow-md relative shrink-0">
              <div className="absolute inset-0 rounded-full border border-dashed border-[#F42A41]/40 animate-spin" style={{ animationDuration: '24s' }} />
              <ShieldCheck className="w-7 h-7 text-[#006A4E]" />
              <div className="text-[5.5px] font-mono font-extrabold text-[#F42A41] uppercase tracking-wider mt-0.5">
                ONEID VERIFIED
              </div>
            </div>

            <div className="space-y-1 mt-4">
              <p className="text-[10px] font-black text-[#006A4E] tracking-widest uppercase">
                PEOPLE'S REPUBLIC OF BANGLADESH 🇧🇩 • OFFICE OF THE REGISTRAR GENERAL
              </p>
              <h2 className="text-3xl font-serif font-black text-[#006A4E] tracking-tight leading-tight">
                Digital Birth Registration Certificate
              </h2>
              <div className="text-sm font-semibold text-[#006A4E]/90 bg-[#006A4E]/5 px-4 py-1 rounded-md inline-block border border-[#006A4E]/10">
                জন্ম নিবন্ধন সনদ (Birth and Death Registration Act, 2004)
              </div>
            </div>

            <div className="mx-auto w-48 border-b border-[#006A4E]/25 pt-2" />
          </div>

          {/* Certificate Body Details */}
          <div className="mt-8 space-y-6 text-slate-800">
            <div className="bg-emerald-50/60 p-4 rounded-xl border border-emerald-100 flex items-center justify-between">
              <div>
                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">Birth Registration Number (BRN)</span>
                <span className="font-mono text-sm font-black text-[#006A4E]">{birthRecord.id}</span>
              </div>
              <div className="text-right">
                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">Date of Registration</span>
                <span className="text-xs font-bold text-slate-700">{formattedRegDate}</span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-6 text-xs">
              <div className="space-y-4">
                <div className="p-3.5 bg-white rounded-lg border border-slate-200">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Child's Full Name</span>
                  <span className="text-sm font-bold text-slate-900">{birthRecord.childName}</span>
                </div>

                <div className="p-3.5 bg-white rounded-lg border border-slate-200">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Date of Birth</span>
                  <span className="text-xs font-bold text-slate-800">{formattedDob}</span>
                </div>

                <div className="p-3.5 bg-white rounded-lg border border-slate-200">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Place of Birth</span>
                  <span className="text-xs font-bold text-slate-800">{birthRecord.placeOfBirth}</span>
                </div>
              </div>

              <div className="space-y-4">
                <div className="p-3.5 bg-white rounded-lg border border-slate-200">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Father's OneID / Details</span>
                  <span className="text-xs font-bold text-slate-800 font-mono">{birthRecord.fatherOneId || 'Registered on Ledger'}</span>
                </div>

                <div className="p-3.5 bg-white rounded-lg border border-slate-200">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Mother's OneID / Details</span>
                  <span className="text-xs font-bold text-slate-800 font-mono">{birthRecord.motherOneId || 'Registered on Ledger'}</span>
                </div>

                <div className="p-3.5 bg-white rounded-lg border border-slate-200">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Blockchain Ledger Hash</span>
                  <span className="text-[10px] font-mono font-bold text-emerald-800 break-all">{birthRecord.ledgerRecordId || '0x' + birthRecord.id.replace(/-/g, '')}</span>
                </div>
              </div>
            </div>

            {/* Bottom Footer Seal */}
            <div className="pt-6 border-t border-dashed border-[#006A4E]/30 flex items-center justify-between text-[11px] text-slate-600">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                <div>
                  <p className="font-bold text-slate-800">Authentic Sovereign Document</p>
                  <p className="text-[10px] text-slate-500">Issued by Bangladesh Civil Registry via OneID Cryptographic Protocol</p>
                </div>
              </div>

              <div className="text-right space-y-1">
                <div className="inline-block px-3 py-1 bg-emerald-100 text-emerald-900 rounded-md font-mono text-[10px] font-black border border-emerald-300">
                  VERIFIED LEDGER ENTRY
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Action Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
        <div className="flex items-center gap-2 text-xs text-slate-500 font-medium">
          <FileText className="w-4 h-4 text-emerald-600" />
          <span>Certificate ID: <strong className="font-mono text-slate-800">{birthRecord.id}</strong></span>
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
            className="px-4 py-2 text-xs font-bold text-white bg-[#006A4E] hover:bg-emerald-800 rounded-xl shadow-md transition-colors flex items-center gap-1.5"
          >
            <Printer className="w-3.5 h-3.5" />
            Print / Save PDF
          </button>
        </div>
      </div>
    </div>
  );
}
