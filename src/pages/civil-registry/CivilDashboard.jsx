import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { 
  Heart, 
  HelpCircle, 
  FileCheck2, 
  Clock, 
  Users, 
  ShieldCheck, 
  Calendar, 
  Sparkles, 
  DollarSign, 
  AlertTriangle, 
  X, 
  FileText, 
  CheckCircle, 
  TrendingUp, 
  Hourglass,
  RefreshCw
} from 'lucide-react';
import api from '../../lib/api.js';
import { toast } from 'sonner';
import NikahnamaCertificate from '../../components/NikahnamaCertificate.jsx';

export default function CivilDashboard() {
  const [marriageStatus, setMarriageStatus] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submittingNotice, setSubmittingNotice] = useState(false);
  
  // Notice form state
  const [showNoticeModal, setShowNoticeModal] = useState(false);
  const [divorceType, setDivorceType] = useState('TALAQ');

  const [simulatedTimeOffset, setSimulatedTimeOffset] = useState(0); // in MS for demo fast-forward
  const [countdownText, setCountdownText] = useState('');

  const fetchMarriageData = async () => {
    try {
      setLoading(true);
      const res = await api.get('/civil-registry/my-marriage');
      setMarriageStatus(res.data);
    } catch (err) {
      console.error(err);
      toast.error('Failed to align with civil registers.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMarriageData();
  }, []);

  // Set up divorce notice countdown ticker
  useEffect(() => {
    if (!marriageStatus?.marriage?.divorceProceeding) return;
    
    // Check if finalized
    const proc = marriageStatus.marriage.divorceProceeding;
    if (proc.status === 'FINALIZED') {
      setCountdownText('DISSOLUTION COMPLETED');
      return;
    }

    const interval = setInterval(() => {
      const targetDate = new Date(proc.effectiveDate);
      const now = new Date(Date.now() + simulatedTimeOffset);
      const timeRemain = targetDate.getTime() - now.getTime();

      if (timeRemain <= 0) {
        setCountdownText('90-Day Waiting Window Complete. Verification node authorizes finalization.');
        clearInterval(interval);
      } else {
        const d = Math.floor(timeRemain / (24 * 60 * 60 * 1000));
        const h = Math.floor((timeRemain % (24 * 60 * 60 * 1000)) / (60 * 60 * 1000));
        const m = Math.floor((timeRemain % (60 * 60 * 1000)) / (60 * 1000));
        const s = Math.floor((timeRemain % (60 * 1000)) / 1000);
        setCountdownText(`${d} Days : ${h} Hours : ${m} Mins : ${s} Secs Remaining`);
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [marriageStatus, simulatedTimeOffset]);

  const handleFileNotice = async (e) => {
    e.preventDefault();
    if (!marriageStatus?.marriage?.marriageId) return;

    setSubmittingNotice(true);
    try {
      await api.post('/civil-registry/divorce/notice', {
        marriageId: marriageStatus.marriage.marriageId,
        divorceType
      });
      toast.success('Dissolution notice filed successfully with Union Parishad Chairman.');
      setShowNoticeModal(false);
      fetchMarriageData();
    } catch (err) {
      console.error(err);
      toast.error(err.response?.data?.error || 'Failed to serve Talaq notice.');
    } finally {
      setSubmittingNotice(false);
    }
  };

  // Demo shortcut: simulates fast forwarding the 90-day waiting loop
  const triggerFastForward = () => {
    setSimulatedTimeOffset(90 * 24 * 60 * 60 * 1000 + 5000); // add 90 days + 5 secs
    toast.success('Simulation: Simulated clock shifted 90 days forward.');
  };

  return (
    <div className="max-w-6xl mx-auto px-4 py-8 space-y-8 font-sans">
      
      {/* Title Header Section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between border-b border-slate-200 pb-5 gap-4">
        <div>
          <h1 className="text-3xl font-black text-slate-950 tracking-tight">OneID Civil Registry Portal</h1>
          <p className="text-xs text-slate-500 font-medium">
            Sovereign marriage & divorce registrations built upon the decentralized public ledger core of Bangladesh.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider font-mono">
            Node Status:
          </span>
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-tight bg-emerald-50 text-emerald-700 border border-emerald-200">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
            Sync Complete
          </span>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center p-20">
          <RefreshCw className="h-8 w-8 text-[#006a4e] animate-spin" />
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* LEFT & CENTER PANEL (Main card & actions) */}
          <div className="lg:col-span-2 space-y-6">
            
            {marriageStatus?.marriage ? (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="space-y-6"
              >
                <NikahnamaCertificate marriage={marriageStatus.marriage} />

                {/* State Machine / Waiting countdown widget */}
                {marriageStatus.marriage.status === 'DIVORCE_PENDING' && marriageStatus.marriage.divorceProceeding && (
                  <div className="bg-amber-50 border border-amber-250 p-6 rounded-2xl shadow-sm space-y-6">
                    
                    <div className="flex items-start gap-3">
                      <div className="bg-amber-100 p-2.5 rounded-xl text-amber-800">
                        <Hourglass className="h-6 w-6 animate-spin text-amber-700" />
                      </div>
                      <div className="space-y-1">
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[9px] font-black uppercase tracking-tight bg-amber-100 text-amber-800 border border-amber-200">
                          {marriageStatus.marriage.divorceProceeding.status} Wait period
                        </span>
                        <h3 className="text-base font-black text-slate-900">
                          Statutory 90-Day Arbitration Wait Window (Talaq/Mubarat)
                        </h3>
                        <p className="text-xs text-slate-600 font-medium">
                          Under Muslim Marriage Laws Amendment, verbal divorce is strictly invalid. Waiting clock prevents premature finalization, protecting conjugal reconciliations.
                        </p>
                      </div>
                    </div>

                    {/* Timeline Milestones Progress Bar */}
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4 bg-white border border-slate-200 p-4 rounded-xl text-xs font-medium">
                      
                      <div className="space-y-1 border-l-2 border-[#006a4e] pl-3">
                        <span className="block text-[10px] font-bold text-[#006a4e] uppercase">
                          Step 1: Notice Served
                        </span>
                        <span className="text-[11px] font-black text-slate-800 block">
                          COMPLETE
                        </span>
                        <span className="text-[10px] text-slate-400 block font-mono">
                          {new Date(marriageStatus.marriage.divorceProceeding.noticeFiledAt).toLocaleDateString()}
                        </span>
                      </div>

                      <div className={`space-y-1 border-l-2 pl-3 ${
                        marriageStatus.marriage.divorceProceeding.arbitrationFormedAt 
                          ? 'border-[#006a4e]' 
                          : 'border-slate-300'
                      }`}>
                        <span className="block text-[10px] font-bold uppercase text-slate-500">
                          Step 2: Council Formed
                        </span>
                        <span className={`text-[11px] font-black block ${
                          marriageStatus.marriage.divorceProceeding.arbitrationFormedAt ? 'text-[#006a4e]' : 'text-slate-400'
                        }`}>
                          {marriageStatus.marriage.divorceProceeding.arbitrationFormedAt ? 'COMPLETE' : 'PENDING CHAIRMAN'}
                        </span>
                        <span className="text-[10px] text-slate-400 block font-mono">
                          {marriageStatus.marriage.divorceProceeding.arbitrationFormedAt 
                            ? new Date(marriageStatus.marriage.divorceProceeding.arbitrationFormedAt).toLocaleDateString()
                            : 'Within 30 Days'}
                        </span>
                      </div>

                      <div className="space-y-1 border-l-2 border-slate-300 pl-3">
                        <span className="block text-[10px] font-bold uppercase text-slate-500">
                          Step 3: Council Attempts
                        </span>
                        <span className="text-[11px] font-black text-slate-800 block">
                          {marriageStatus.marriage.divorceProceeding.reconciliationAttempts} Sessions Logged
                        </span>
                        <span className="text-[10px] text-slate-400 block">
                          Arbitration attempts
                        </span>
                      </div>

                      <div className="space-y-1 border-l-2 border-slate-300 pl-3">
                        <span className="block text-[10px] font-bold uppercase text-slate-500">
                          Step 4: finalization
                        </span>
                        <span className="text-[11px] font-black text-amber-700 block">
                          90-Day Iddat Loop
                        </span>
                        <span className="text-[10px] text-slate-400 block font-mono">
                          Ends {new Date(marriageStatus.marriage.divorceProceeding.effectiveDate).toLocaleDateString()}
                        </span>
                      </div>

                    </div>

                    {/* Highly polished visible countdown clock widget */}
                    <div className="bg-[#1e293b] border border-slate-700 text-white rounded-xl p-5 text-center shadow-lg font-mono relative overflow-hidden">
                      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-60 h-60 rounded-full bg-amber-500/5 blur-3xl pointer-events-none" />
                      
                      <span className="text-[10px] tracking-widest font-bold text-amber-400 uppercase">
                        Sovereign Registry Time Lock Active
                      </span>
                      
                      <h4 className="text-lg md:text-xl font-bold tracking-tight text-yellow-100 mt-2">
                        {countdownText}
                      </h4>

                      {/* Demo Bypass button */}
                      <div className="mt-4 flex justify-center gap-2">
                        <button
                          onClick={triggerFastForward}
                          className="bg-amber-600 hover:bg-amber-700 font-sans text-[11px] font-black uppercase text-white px-3.5 py-1.5 rounded-lg border border-amber-500 shadow transition flex items-center gap-1 cursor-pointer"
                        >
                          <Clock className="w-3.5 h-3.5" /> Demo Fast Forward Time
                        </button>
                      </div>
                    </div>

                  </div>
                )}
              </motion.div>
            ) : (
              /* Legally SINGLE Card */
              <motion.div
                initial={{ opacity: 0, scale: 0.98 }}
                animate={{ opacity: 1, scale: 1 }}
                className="bg-white border border-slate-200 rounded-2xl shadow-sm p-6 sm:p-8 text-center space-y-6"
              >
                <div className="mx-auto w-16 h-16 bg-emerald-50 text-emerald-600 rounded-full border border-emerald-150 flex items-center justify-center shadow-inner">
                  <Heart className="h-8 w-8 animate-pulse text-[#006a4e]" />
                </div>
                
                <div className="max-w-md mx-auto space-y-2">
                  <h3 className="text-xl font-black text-slate-900 uppercase">
                    Civil Status: Eligible To Solemnize (Single)
                  </h3>
                  <p className="text-xs text-slate-500 font-medium leading-relaxed">
                    You do not hold any registered, active marriages on the OneID Decentralized Sovereign registry. You coordinates are authorized to solemnize a marriage within any licensed Bangladesh node.
                  </p>
                </div>

                <div className="border-t border-slate-100 pt-4 max-w-sm mx-auto">
                  <span className="text-[10px] font-mono font-bold text-slate-400 uppercase block">
                    OneID Legal Certification Badge
                  </span>
                  <div className="mt-2 inline-flex items-center gap-1.5 bg-emerald-50 border border-emerald-150 rounded-lg px-3 py-1 text-emerald-800 text-[10px] font-black uppercase">
                    <ShieldCheck className="h-3.5 w-3.5 text-[#006a4e]" /> Legally Single / Free-To-Marry
                  </div>
                </div>
              </motion.div>
            )}

          </div>

          {/* RIGHT SIDE PANEL: Actions & Laws Summary */}
          <div className="space-y-6">
            
            {marriageStatus?.marriage && marriageStatus.marriage.status === 'ACTIVE' && (
              <div className="bg-white border border-slate-200 p-5 rounded-2xl shadow-sm space-y-4">
                <h3 className="text-sm font-black text-slate-900 uppercase tracking-tight flex items-center gap-1.5">
                  <AlertTriangle className="h-4 w-4 text-amber-500 shrink-0" /> Civil Registry Operations
                </h3>
                
                <p className="text-xs text-slate-500 font-medium">
                  If marital obligations cannot be fulfilled, either citizen holds the legal privilege to request dissolution by serving immediate written notice according to the Muslim Marriages Act 1974.
                </p>

                <button
                  onClick={() => setShowNoticeModal(true)}
                  className="w-full bg-red-650 hover:bg-red-700 bg-red-600 text-white text-xs font-black uppercase py-2.5 px-4 rounded-xl shadow transition tracking-wide text-center block cursor-pointer"
                >
                  Serve Talaq/Mubarat Notice
                </button>
              </div>
            )}

            {/* Statutory Bangladesh Law Guide */}
            <div className="bg-slate-900 text-slate-100 p-5 rounded-2xl shadow border border-slate-800 space-y-4 relative overflow-hidden">
              <div className="absolute top-0 right-0 w-24 h-24 bg-[#006a4e]/20 blur-3xl pointer-events-none" />
              
              <h3 className="text-sm font-black text-white uppercase tracking-tight flex items-center gap-1.5">
                <Sparkles className="h-4 w-4 text-emerald-400" /> Executive Legal Compliance
              </h3>

              <div className="space-y-3 text-[11px] text-slate-300 leading-relaxed font-sans">
                <div className="space-y-1">
                  <span className="font-bold text-emerald-400 block uppercase">
                    • anti-bigamy lock
                  </span>
                  <p>OneID validates status dynamically across all registrars. Registration is completely blocked if either citizen registry state is not single/divorced.</p>
                </div>

                <div className="space-y-1">
                  <span className="font-bold text-emerald-400 block uppercase">
                    • 90-Day mandatory buffer
                  </span>
                  <p>unilateral Talaq is frozen inside a 90-day time lock. Finalizing is disallowed globally until arbitration count is registered and the timeline has fully elapsed.</p>
                </div>

                <div className="space-y-1">
                  <span className="font-bold text-emerald-450 text-emerald-400 block uppercase">
                    • Union Parishad arbitration
                  </span>
                  <p>Under section 7(4), local chairman forms an Arbitration Council within 30 days of filing to actively seek family reconciliation.</p>
                </div>
              </div>
            </div>

          </div>

        </div>
      )}

      {/* Talaq Notification Modal */}
      {showNoticeModal && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/60 backdrop-blur-sm flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="w-full max-w-md bg-white border border-slate-200 rounded-3xl shadow-xl overflow-hidden"
          >
            <div className="bg-red-50 px-5 py-4 border-b border-red-100 flex justify-between items-center">
              <div className="flex items-center gap-2 text-red-800">
                <AlertTriangle className="h-5 w-5 shrink-0" />
                <h3 className="text-xs font-black uppercase tracking-tight">
                  Serve Cryptographic Talaq Notice
                </h3>
              </div>
              <button
                onClick={() => setShowNoticeModal(false)}
                className="text-slate-400 hover:text-slate-700 bg-white border border-slate-150 p-1.5 rounded-lg transition"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <form onSubmit={handleFileNotice} className="p-6 space-y-4">
              
              <div className="bg-amber-50 border border-amber-200 rounded-xl p-3.5 text-[11px] text-amber-800 leading-relaxed font-medium">
                <strong>⚠️ LEGAL DECLARATION REQUIREMENT:</strong> Under Section 7 of Muslim Marriages/Divorces Act, this notice will be dispatched immediately to the Union Parishad Chairman node for Arbitration setup.
              </div>

              <div className="space-y-1.5">
                <label className="block text-[11px] font-bold text-slate-500 uppercase">
                  Select Notice Filing Protocol
                </label>
                <div className="grid grid-cols-2 gap-3.5">
                  <button
                    type="button"
                    onClick={() => setDivorceType('TALAQ')}
                    className={`p-3 rounded-xl border text-left flex flex-col justify-start transition ${
                      divorceType === 'TALAQ' 
                        ? 'border-red-600 bg-red-55/10 bg-red-50/50 text-red-900' 
                        : 'border-slate-200 hover:bg-slate-52 bg-slate-50 text-slate-705 text-slate-600'
                    }`}
                  >
                    <span className="font-bold text-xs uppercase block">Talaq (Unilateral)</span>
                    <span className="text-[9px] mt-0.5 text-slate-450 leading-tight block">Served by husband to spouse and local Parishad.</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setDivorceType('MUBARAT')}
                    className={`p-3 rounded-xl border text-left flex flex-col justify-start transition ${
                      divorceType === 'MUBARAT' 
                        ? 'border-red-650 bg-red-55/10 bg-red-50/50 text-red-900 border-red-600' 
                        : 'border-slate-200 hover:bg-slate-52 bg-slate-50 text-slate-705 text-slate-600'
                    }`}
                  >
                    <span className="font-bold text-xs uppercase block">Mubarat (Mutual)</span>
                    <span className="text-[9px] mt-0.5 text-slate-450 leading-tight block">Mutual agreement of dissolution with joint signature keys.</span>
                  </button>
                </div>
              </div>

              <div className="pt-4 border-t border-slate-100 flex gap-2">
                <button
                  type="button"
                  onClick={() => setShowNoticeModal(false)}
                  className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-750 text-xs font-bold py-2.5 rounded-xl transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submittingNotice}
                  className="flex-1 bg-red-600 hover:bg-red-700 text-white text-xs font-black uppercase py-2.5 rounded-xl shadow transition cursor-pointer disabled:opacity-50"
                >
                  {submittingNotice ? 'Logging with Chairman...' : 'Confirm NOTICE filing'}
                </button>
              </div>

            </form>
          </motion.div>
        </div>
      )}

    </div>
  );
}
