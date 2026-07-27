import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { motion } from 'motion/react';
import { 
  ShieldCheck, 
  Search, 
  Clock, 
  Users, 
  BookOpen, 
  CheckCircle, 
  AlertTriangle, 
  Download, 
  HelpCircle,
  Hash,
  ArrowLeft
} from 'lucide-react';
import api from '../../lib/api.js';
import { toast } from 'sonner';

export default function CivilVerifier() {
  const [searchParams] = useSearchParams();
  const [queryInput, setQueryInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [record, setRecord] = useState(null);
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    const codeQuery = searchParams.get('id');
    if (codeQuery) {
      setQueryInput(codeQuery);
      handleSearch(codeQuery);
    }
  }, [searchParams]);

  const handleSearch = async (targetId) => {
    const idToSearch = targetId || queryInput;
    if (!idToSearch.trim()) {
      setErrorMsg('Please input a valid Marriage ID or Divorce Certificate Hash.');
      return;
    }

    setLoading(true);
    setRecord(null);
    setErrorMsg('');

    try {
      // Free public request endpoint — no token required mapping
      const res = await api.get(`/civil-registry/public/verify/${idToSearch.trim()}`);
      if (res.data && res.data.recordFound) {
        setRecord(res.data);
        toast.success('Genuine Sovereign record matched on OneID node registers!');
      } else {
        setErrorMsg('No matching records found.');
      }
    } catch (err) {
      console.error(err);
      setErrorMsg(err.response?.data?.error || 'Record lookup failed or hash is invalid.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-10 space-y-8 font-sans">
      
      {/* Brand Heading BD Gov Seal Style */}
      <div className="text-center space-y-3">
        <div className="mx-auto w-16 h-16 bg-[#006a4e]/10 text-[#006a4e] rounded-full flex items-center justify-center border-2 border-yellow-600/30 shadow-md">
          <BookOpen className="h-7 w-7" />
        </div>
        <div className="space-y-0.5">
          <h1 className="text-2xl font-black text-[#006a4e] tracking-tight uppercase font-serif">
            Sovereign Civil Registry Verifier Node
          </h1>
          <p className="text-[10px] uppercase tracking-wider text-yellow-800 font-bold">
            Government of the People's Republic of Bangladesh • Block Explorer Node
          </p>
        </div>
        <p className="text-xs text-slate-500 max-w-lg mx-auto font-medium">
          Verifiably inspect digital Nikah Certificates and Marital Dissolution notices. Publicly indexed data contains zero private metadata.
        </p>
      </div>

      {/* Input query field */}
      <div className="bg-white border border-slate-200 p-6 rounded-3xl shadow-sm space-y-4 max-w-xl mx-auto">
        <div className="space-y-1.5">
          <label htmlFor="civil-search-input" className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider">
            Enter Marriage ID or Divorce Hash
          </label>
          <div className="flex gap-2">
            <input
              id="civil-search-input"
              type="text"
              value={queryInput}
              onChange={(e) => setQueryInput(e.target.value)}
              placeholder="e.g. NIKAH-2026-XXXXX or SHA-255 Hash..."
              className="flex-1 bg-white border border-slate-300 font-mono text-xs px-3.5 py-2.5 rounded-xl text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500/10 focus:border-[#006a4e] font-bold"
            />
            <button
              onClick={() => handleSearch()}
              disabled={loading}
              className="bg-[#006a4e] hover:bg-[#004e38] text-white text-xs font-black uppercase px-6 py-2.5 rounded-xl transition flex justify-center items-center gap-1.5 shrink-0 disabled:opacity-50 cursor-pointer"
            >
              {loading ? 'Mining...' : (
                <>
                  <Search className="h-4 w-4" /> Verify
                </>
              )}
            </button>
          </div>
          {errorMsg && (
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-xs font-bold text-red-600 mt-1"
            >
              ⚠️ {errorMsg}
            </motion.p>
          )}
        </div>
      </div>

      {/* VERIFICATION RESULT RENDERING */}
      {record && (
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-8"
        >
          
          {/* Certificate Board Styled */}
          <div className="relative overflow-hidden bg-[#faf7ed] border-4 border-double border-[#006a4e] rounded-3xl shadow-xl p-6 sm:p-10 space-y-8">
            
            {/* Stamp Overlays */}
            <div className="absolute top-6 right-6 pointer-events-none select-none z-10">
              {record.status === 'DIVORCED' || record.status === 'DISSOLVED' || record.type === 'DIVORCE_DISSOLUTION' ? (
                <div className="border-4 border-red-650 text-red-650 border-red-650/40 text-red-650/50 uppercase font-mono font-black text-xs px-4 py-2.5 rounded-xl tracking-widest rotate-6">
                  DISSOLVED • তালাকপ্রাপ্ত
                </div>
              ) : (
                <div className="border-4 border-[#006a4e]/40 text-[#006a4e]/50 uppercase font-mono font-black text-xs px-4 py-2.5 rounded-xl tracking-widest -rotate-6">
                  ACTIVE NIKAH • নিকাহ
                </div>
              )}
            </div>

            {/* Certificate Branding */}
            <div className="text-center relative">
              <h2 className="text-2xl font-serif font-black text-[#006a4e] uppercase tracking-wide">
                {record.type === 'DIVORCE_DISSOLUTION' ? 'Certificate of Marital Dissolution' : 'Verified Sovereign Nikah Record'}
              </h2>
              <p className="text-[10px] uppercase text-yellow-800 font-bold tracking-tight">
                Authenticity validated on Ledger Sector: CIVIL_REGISTRY
              </p>
              <div className="mt-4 mx-auto w-24 border-b border-yellow-600/20" />
            </div>

            {/* Metadata Fields */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-4 text-xs font-medium text-slate-800">
              
              <div className="space-y-3.5 border-r border-[#006a4e]/20 pr-4">
                <div>
                  <span className="block text-[9px] text-slate-405 text-slate-500 uppercase tracking-tight">
                    Marriage Record ID Code
                  </span>
                  <span className="font-mono text-sm font-black text-slate-900 block">
                    {record.marriageId}
                  </span>
                </div>

                <div>
                  <span className="block text-[9px] text-slate-405 text-slate-500 uppercase tracking-tight">
                    Solemnization Date
                  </span>
                  <span className="font-mono text-slate-900 block font-bold">
                    {new Date(record.registrationDate).toLocaleDateString()}
                  </span>
                </div>

                <div>
                  <span className="block text-[9px] text-slate-450 text-slate-500 uppercase tracking-tight">
                    Groom Sovereign OneID
                  </span>
                  <span className="font-mono text-slate-900 block font-black">
                    {record.groomOneId}
                  </span>
                </div>

                <div>
                  <span className="block text-[9px] text-slate-450 text-slate-500 uppercase tracking-tight">
                    Bride Sovereign OneID
                  </span>
                  <span className="font-mono text-slate-900 block font-black">
                    {record.brideOneId}
                  </span>
                </div>
              </div>

              {/* Mahr details & Divorce details */}
              <div className="space-y-3.5 pl-0 md:pl-2">
                <div>
                  <span className="block text-[9px] text-slate-405 text-slate-500 uppercase tracking-tight">
                    Certified Mahr / Dower Fee
                  </span>
                  <span className="font-sans font-black text-[#006a4e] block text-sm mt-0.5">
                    ৳ {parseFloat(record.mahrAmountBDT).toLocaleString()} BDT
                  </span>
                  <span className="text-[10px] text-yellow-850 font-bold italic">
                    Type: {record.mahrType}
                  </span>
                </div>

                {record.divorceDetails && (
                  <div className="bg-red-50 border border-red-200 rounded-xl p-3.5 space-y-2 mt-2">
                    <span className="text-[10px] font-black text-red-800 uppercase block tracking-wider">
                      Dissolution File Details
                    </span>
                    <div className="text-[11px] font-mono space-y-1 text-slate-705">
                      <div className="flex justify-between">
                        <span>Notice Filed:</span>
                        <span>{new Date(record.divorceDetails.noticeFiledAt).toLocaleDateString()}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Methodology:</span>
                        <span className="font-bold">{record.divorceDetails.divorceType}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Arbitration At:</span>
                        <span>{record.divorceDetails.actualEffectiveDate ? new Date(record.divorceDetails.actualEffectiveDate).toLocaleDateString() : 'N/A'}</span>
                      </div>
                    </div>
                  </div>
                )}
              </div>

            </div>

            {/* Cryptographic block lock info */}
            <div className="border-t border-[#006a4e]/20 pt-6 flex flex-col md:flex-row justify-between items-center gap-4 text-xs font-mono">
              <div className="space-y-1 text-center md:text-left">
                <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block">
                  Public Ledger Sync Key
                </span>
                <span className="text-[9px] bg-slate-205 bg-slate-200/50 hover:bg-slate-200 border border-slate-300 rounded px-2.5 py-1.5 block select-all">
                  🔑 ID: {record.ledgerRecordId || 'RECG-GEN-0022'}
                </span>
              </div>

              <div className="flex items-center gap-2 bg-[#024e38] text-white px-3.5 py-2 rounded-xl text-[10px] border border-yellow-600/30 font-sans shadow-md">
                <div className="bg-yellow-400 p-1 rounded text-[#024e38] shrink-0">
                  <ShieldCheck className="h-3.5 w-3.5" />
                </div>
                <div>
                  <span className="block font-black text-yellow-400 uppercase tracking-wider text-[8px]">
                    Immutable Signature Active
                  </span>
                  <span className="font-bold text-emerald-200 font-mono">
                    BD-GOV STATE MATCH
                  </span>
                </div>
              </div>
            </div>

          </div>

        </motion.div>
      )}

    </div>
  );
}
