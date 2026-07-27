import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { 
  Building2, 
  Clock, 
  Users, 
  ShieldCheck, 
  ChevronRight, 
  FileCheck2, 
  HelpCircle, 
  RefreshCw, 
  ArrowRight, 
  Heart, 
  AlertTriangle, 
  CheckCircle, 
  MessageSquarePlus 
} from 'lucide-react';
import api from '../../lib/api.js';
import { toast } from 'sonner';

export default function ChairmanArbitration() {
  const [proceedings, setProceedings] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchProceedings = async () => {
    try {
      setLoading(true);
      const res = await api.get('/civil-registry/admin/proceedings');
      setProceedings(res.data.proceedings || []);
    } catch (err) {
      console.error(err);
      toast.error('Failed to pull registry proceedings from OneID core nodes.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProceedings();
  }, []);

  const handleFormCouncil = async (id) => {
    try {
      await api.post('/civil-registry/divorce/arbitration/setup', { divorceProceedingId: id });
      toast.success('Arbitration Council Formed and logged on blockchain registers.');
      fetchProceedings();
    } catch (err) {
      console.error(err);
      toast.error(err.response?.data?.error || 'Failed to form council.');
    }
  };

  const handleAddSession = async (id) => {
    try {
      await api.post('/civil-registry/divorce/arbitration/log', { divorceProceedingId: id });
      toast.success('Reconciliation Session Attempt incremented on ledger.');
      fetchProceedings();
    } catch (err) {
      console.error(err);
      toast.error('Failed to log attempts.');
    }
  };

  const handleReconcile = async (id) => {
    const confirmation = window.confirm('Are both spouses actively reconciled? Confirming will restore the Nikah certificate as Active and reset marital states.');
    if (!confirmation) return;

    try {
      await api.post('/civil-registry/divorce/reconcile', { divorceProceedingId: id });
      toast.success('Reconciliation completed! Citizens marital statuses restored.');
      fetchProceedings();
    } catch (err) {
      console.error(err);
      toast.error('Failed to complete union restoration.');
    }
  };

  const handleFinalize = async (id) => {
    const confirmation = window.confirm('Are you authorized to finalize this marital dissolution under Bangladesh Legislative Code? This action is irreversible.');
    if (!confirmation) return;

    try {
      const res = await api.post('/civil-registry/divorce/finalize', { divorceProceedingId: id });
      toast.success(`Divorce finalized! Certificate Hash generated: ${res.data.certificateHash}`);
      fetchProceedings();
    } catch (err) {
      console.error(err);
      toast.error(err.response?.data?.error || 'Failed to finalize dissolution.');
    }
  };

  return (
    <div className="max-w-6xl mx-auto px-4 py-8 space-y-8 font-sans">
      
      {/* Legislative Union Parishad Header */}
      <div className="border-b border-yellow-250 pb-5 md:flex items-center justify-between gap-4 bg-gradient-to-r from-yellow-50/50 to-white p-6 rounded-2xl border border-yellow-150">
        <div className="space-y-1.5 text-slate-900">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider bg-yellow-100 text-yellow-905 text-amber-900 border border-yellow-200">
            <Building2 className="h-3 w-3" /> Ministry of Local Government • Union Parishad Node
          </span>
          <h1 className="text-2xl font-black tracking-tight text-slate-900">Chairman Arbitration Dashboard</h1>
          <p className="text-xs text-slate-500 font-medium leading-relaxed max-w-2xl">
            Unilateral divorce waitlists and arbitration files. Under Sec 7 of the Muslim Marriage Act 1974, verbal Talaq holds zero legal weight without formal Union notice and local Arbitration.
          </p>
        </div>
        
        <div className="bg-amber-500 text-white px-4 py-3 rounded-xl flex items-center gap-2.5 shrink-0 shadow font-mono text-center">
          <div className="shrink-0 font-bold text-center">
            <span className="text-[10px] block text-amber-100 uppercase font-black">Authorized</span>
            <span className="text-sm font-black text-white">UP CHAIRMAN</span>
          </div>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center p-20">
          <RefreshCw className="h-8 w-8 text-[#006a4e] animate-spin" />
        </div>
      ) : proceedings.length === 0 ? (
        <div className="bg-slate-50 border border-slate-200 rounded-2xl p-12 text-center text-slate-500 font-medium text-xs max-w-xl mx-auto space-y-2">
          <Users className="h-8 w-8 mx-auto text-slate-400" />
          <h4 className="text-slate-800 font-bold uppercase tracking-tight text-sm">No Active Proceedings</h4>
          <p>There are no recorded Talaq notices awaiting local council dispute resolution or arbitration review.</p>
        </div>
      ) : (
        <div className="space-y-6">
          <h2 className="text-xs font-black text-slate-500 uppercase tracking-widest block">
            Active Arbitration Files ({proceedings.length})
          </h2>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {proceedings.map(proc => {
              const noticeDate = new Date(proc.noticeFiledAt);
              const targetDate = new Date(proc.effectiveDate);
              const daysRemaining = Math.max(0, Math.ceil((targetDate.getTime() - Date.now()) / (24 * 60 * 60 * 1000)));
              const isExpired = Date.now() >= targetDate.getTime();
              
              const diffDaysFiled = (Date.now() - noticeDate.getTime()) / (24 * 60 * 60 * 1000);
              const isNearing30DaysLimit = diffDaysFiled > 28 && !proc.arbitrationFormedAt && proc.status === 'NOTICE_FILED';

              return (
                <div 
                  key={proc.id} 
                  className={`bg-white border rounded-2xl p-5 space-y-5 shadow-sm transition-all hover:shadow duration-200 relative overflow-hidden ${
                    isNearing30DaysLimit ? 'border-red-300 ring-2 ring-red-500/5' : 'border-slate-200'
                  }`}
                >
                  {isNearing30DaysLimit && (
                    <div className="absolute top-0 right-0 bg-red-600 text-white text-[9px] font-black uppercase tracking-wider px-3.5 py-1 rounded-bl-xl shadow-md">
                      ⚠️ Council Deadline Breach
                    </div>
                  )}

                  {/* Top identifier */}
                  <div className="flex items-center justify-between border-b border-slate-100 pb-3 flex-wrap gap-2">
                    <div className="space-y-0.5">
                      <span className="text-[10px] text-slate-400 font-bold uppercase block">
                        Proceeding ID
                      </span>
                      <span className="font-mono text-xs font-black text-[#006a4e]">
                        {proc.id.slice(0, 8).toUpperCase()}...
                      </span>
                    </div>

                    <div className="text-right">
                      <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[9px] font-black uppercase tracking-tight ${
                        proc.status === 'FINALIZED' ? 'bg-red-50 text-red-700 border border-red-200' :
                        proc.status === 'RECONCILED' ? 'bg-emerald-50 text-emerald-700 border border-emerald-250' :
                        proc.status === 'ARBITRATION_ACTIVE' ? 'bg-[#006a4e]/5 text-[#006a4e] border border-[#006a4e]/20' :
                        'bg-amber-50 text-amber-800 border border-amber-250'
                      }`}>
                        {proc.status}
                      </span>
                    </div>
                  </div>

                  {/* Body Details */}
                  <div className="grid grid-cols-2 gap-4 text-xs font-medium text-slate-800">
                    <div>
                      <span className="block text-[9px] text-slate-400 uppercase font-black">
                        Spouses OneID (Groom / Bride)
                      </span>
                      <span className="font-mono text-slate-900 block mt-1 truncate">
                        {proc.marriage?.groomOneId} / {proc.marriage?.brideOneId}
                      </span>
                    </div>
                    
                    <div>
                      <span className="block text-[9px] text-slate-400 uppercase font-black">
                        Notice Date / Expiry Date
                      </span>
                      <span className="font-mono text-slate-900 block mt-1">
                        {noticeDate.toLocaleDateString()} / {targetDate.toLocaleDateString()}
                      </span>
                    </div>

                    <div>
                      <span className="block text-[9px] text-slate-400 uppercase font-black">
                        Arbitration Formed On
                      </span>
                      <span className="font-sans text-slate-800 block mt-1 font-bold">
                        {proc.arbitrationFormedAt ? new Date(proc.arbitrationFormedAt).toLocaleDateString() : '⚠️ NOT FORMED YET'}
                      </span>
                    </div>

                    <div>
                      <span className="block text-[9px] text-slate-400 uppercase font-black">
                        Reconciliation attempts
                      </span>
                      <span className="font-sans text-[#006a4e] block mt-1 font-bold">
                        {proc.reconciliationAttempts} Sessions Logged
                      </span>
                    </div>
                  </div>

                  {/* Static Wait clock representation or status banner */}
                  <div className={`p-3 rounded-xl border text-center font-mono ${
                    proc.status === 'FINALIZED' ? 'bg-slate-50 text-slate-500 border-slate-200' :
                    proc.status === 'RECONCILED' ? 'bg-emerald-50 text-[#006a4e] border-emerald-150' :
                    isExpired ? 'bg-emerald-50 text-[#006a4e] border-emerald-250' :
                    'bg-amber-50 text-amber-900 border-amber-150'
                  }`}>
                    {proc.status === 'FINALIZED' && (
                      <span className="text-[10px] font-bold block">CASE FINALLY DISSOLVED ON IMMUTABLE LEDGER</span>
                    )}
                    {proc.status === 'RECONCILED' && (
                      <span className="text-[10px] font-bold block flex items-center justify-center gap-1"><Heart className="h-4 w-4 text-emerald-600 animate-pulse fill-emerald-600" /> RECONCILIATION SUCCESSFUL - CASE TERMINATED</span>
                    )}
                    {proc.status !== 'FINALIZED' && proc.status !== 'RECONCILED' && (
                      <span className="text-[10px] font-black block">
                        {isExpired ? '✓ 90-DAY DELAY COMPLETE. ELIGIBLE FOR FINALIZATION' : `⏳ ${daysRemaining} DAYS REMAINING IN THE WAITING LOOP`}
                      </span>
                    )}
                  </div>

                  {/* Actions Bar */}
                  {proc.status !== 'FINALIZED' && proc.status !== 'RECONCILED' && (
                    <div className="border-t border-slate-100 pt-4 flex flex-wrap gap-2 bg-slate-50 -mx-5 -mb-5 p-5 rounded-b-2xl">
                      
                      {/* Step 1 Form Council if NOTICE_FILED */}
                      {proc.status === 'NOTICE_FILED' && (
                        <button
                          onClick={() => handleFormCouncil(proc.id)}
                          className="flex-1 bg-[#006a4e] hover:bg-[#004e38] text-white text-[10px] font-black uppercase py-2 px-3.5 rounded-lg shadow-sm tracking-wide transition cursor-pointer"
                        >
                          Form Arbitration Council
                        </button>
                      )}

                      {/* Step 2 Log attempt session */}
                      {proc.status === 'ARBITRATION_ACTIVE' && (
                        <>
                          <button
                            onClick={() => handleAddSession(proc.id)}
                            className="bg-slate-200 hover:bg-slate-300 text-slate-800 text-[10px] font-bold py-2 px-3 rounded-lg border border-slate-300 transition flex items-center justify-center gap-1 cursor-pointer"
                            title="Log session"
                          >
                            <MessageSquarePlus className="h-3.5 w-3.5" /> Log Session
                          </button>

                          <button
                            onClick={() => handleReconcile(proc.id)}
                            className="bg-emerald-650 hover:bg-emerald-700 bg-emerald-600 text-white text-[10px] font-black uppercase py-2 px-3.5 rounded-lg transition flex items-center justify-center gap-1 cursor-pointer"
                          >
                            <Heart className="h-3.5 w-3.5 shadow-sm" /> Mutual Reconciled
                          </button>
                        </>
                      )}

                      {/* Finalize dissolution if waiting buffer passed */}
                      <button
                        onClick={() => handleFinalize(proc.id)}
                        disabled={!isExpired || proc.status !== 'ARBITRATION_ACTIVE'}
                        className="bg-red-600 hover:bg-red-700 text-white text-[10px] font-black uppercase py-2 px-4 rounded-lg shadow transition disabled:opacity-30 cursor-pointer text-center block flex-1"
                        title={!isExpired ? "90-day wait period active" : proc.status !== 'ARBITRATION_ACTIVE' ? "Arbitration council must be formed first" : "Finalize"}
                      >
                        Finalize Divorce
                      </button>

                    </div>
                  )}

                </div>
              );
            })}
          </div>
        </div>
      )}

    </div>
  );
}
