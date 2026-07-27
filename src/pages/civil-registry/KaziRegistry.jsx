import React, { useState } from 'react';
import { motion } from 'motion/react';
import { 
  Heart, 
  ShieldCheck, 
  AlertTriangle, 
  Search, 
  DollarSign, 
  RefreshCw, 
  Users, 
  BookOpen, 
  FileCheck2, 
  Lock,
  ArrowRight
} from 'lucide-react';
import api from '../../lib/api.js';
import { toast } from 'sonner';

export default function KaziRegistry() {
  const [groomOneId, setGroomOneId] = useState('');
  const [brideOneId, setBrideOneId] = useState('');
  const [witness1OneId, setWitness1OneId] = useState('');
  const [witness2OneId, setWitness2OneId] = useState('');
  const [mahrAmount, setMahrAmount] = useState('');
  const [mahrType, setMahrType] = useState('PROMPT');

  // Verification states
  const [verifying, setVerifying] = useState({
    groom: false, bride: false, witness1: false, witness2: false
  });
  
  const [verifiedUsers, setVerifiedUsers] = useState({
    groom: null, bride: null, witness1: null, witness2: null
  });

  const [registeringModel, setRegisteringModel] = useState(false);
  const [registrationReceipt, setRegistrationReceipt] = useState(null);

  const checkOneID = async (key, value) => {
    if (!value.trim()) {
      toast.warn(`Please enter a valid OneID for ${key}.`);
      return;
    }
    
    setVerifying(prev => ({ ...prev, [key]: true }));
    try {
      const res = await api.get(`/civil-registry/verify-oneid/${value.trim()}`);
      setVerifiedUsers(prev => ({ ...prev, [key]: res.data }));
      toast.success(`${key.toUpperCase()} OneID verified successfully.`);
    } catch (err) {
      console.error(err);
      setVerifiedUsers(prev => ({ ...prev, [key]: { found: false, error: err.response?.data?.error || 'Validation failed' } }));
      toast.error(err.response?.data?.error || `OneID entity for ${key} is invalid.`);
    } finally {
      setVerifying(prev => ({ ...prev, [key]: false }));
    }
  };

  // Bigamy check trigger
  const hasBigamyRisk = () => {
    const groomM = verifiedUsers.groom?.maritalStatus;
    const brideM = verifiedUsers.bride?.maritalStatus;
    
    const groomInvalid = groomM && groomM !== 'SINGLE' && groomM !== 'DIVORCED' && groomM !== 'WIDOWED';
    const brideInvalid = brideM && brideM !== 'SINGLE' && brideM !== 'DIVORCED' && brideM !== 'WIDOWED';

    return groomInvalid || brideInvalid;
  };

  const isFormValid = () => {
    // 1. All verifications must be successful (found === true)
    const allVerified = verifiedUsers.groom?.found && 
                        verifiedUsers.bride?.found && 
                        verifiedUsers.witness1?.found && 
                        verifiedUsers.witness2?.found;

    if (!allVerified) return false;

    // 2. Strict Bigamy Prevention check
    if (hasBigamyRisk()) return false;

    // 3. Witness Distinctness check
    const g = groomOneId.trim().toUpperCase();
    const b = brideOneId.trim().toUpperCase();
    const w1 = witness1OneId.trim().toUpperCase();
    const w2 = witness2OneId.trim().toUpperCase();

    if (g === b) return false;
    if (w1 === w2 || w1 === g || w1 === b || w2 === g || w2 === b) return false;

    // 4. Mahr Amount positive number check
    if (!mahrAmount || parseFloat(mahrAmount) <= 0) return false;

    return true;
  };

  const handleRegisterMarriage = async (e) => {
    e.preventDefault();
    if (!isFormValid()) {
      toast.error('Civil code validation failed. Please address bigamy triggers or mismatched witnesses.');
      return;
    }

    setRegisteringModel(true);
    try {
      const res = await api.post('/civil-registry/marriage', {
        groomOneId,
        brideOneId,
        witness1OneId,
        witness2OneId,
        mahrAmountBDT: parseFloat(mahrAmount),
        mahrType
      });
      setRegistrationReceipt(res.data);
      toast.success('Marriage Registry solemnized successfully.');
      
      // Clear fields
      setGroomOneId('');
      setBrideOneId('');
      setWitness1OneId('');
      setWitness2OneId('');
      setMahrAmount('');
      setVerifiedUsers({ groom: null, bride: null, witness1: null, witness2: null });
    } catch (err) {
      console.error(err);
      toast.error(err.response?.data?.error || 'Failed to complete registered Nikah.');
    } finally {
      setRegisteringModel(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-8 space-y-8 font-sans">
      
      {/* Kazi Module Header */}
      <div className="border-b border-rose-100 pb-5 flex flex-col md:flex-row md:items-center justify-between gap-4 bg-gradient-to-r from-emerald-50 to-white p-6 rounded-2xl border border-emerald-150">
        <div className="space-y-1.5">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider bg-[#006a4e]/10 text-[#006a4e]">
            <BookOpen className="h-3 w-3" /> Licensed Registrar Console
          </span>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">Kazi Nikah Solemnization Desk</h1>
          <p className="text-xs text-slate-500 font-medium leading-relaxed">
            Authorized node for registering Muslim Marriages under Bangladesh Code 1974. All data is sealed to OneID ledger block.
          </p>
        </div>
        <div className="bg-[#006a4e] text-white px-4 py-3 rounded-xl border border-yellow-700/35 flex items-center gap-2 shrink-0 shadow">
          <Lock className="h-5 w-5 text-yellow-300" />
          <div className="leading-tight">
            <span className="text-[9px] uppercase font-bold text-yellow-400 block tracking-wider">Kazi Node Active</span>
            <span className="text-[10px] font-mono block">Node BDK-REG-881</span>
          </div>
        </div>
      </div>

      {registrationReceipt ? (
        /* Success Receipt Page */
        <motion.div
          initial={{ opacity: 0, scale: 0.98 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-[#faf7ed] border-4 border-double border-[#006a4e] p-8 rounded-2xl shadow-lg space-y-6 max-w-2xl mx-auto"
        >
          <div className="text-center space-y-1.5">
            <div className="mx-auto w-12 h-12 bg-emerald-100 text-[#006a4e] rounded-full flex items-center justify-center border border-emerald-250">
              <ShieldCheck className="h-6 w-6" />
            </div>
            <h3 className="text-xl font-black text-[#006a4e] font-serif tracking-wide">
              Mubarak! Digital Registry Process Completed
            </h3>
            <p className="text-xs text-yellow-800 font-bold uppercase tracking-tight">
              Marriage Solemnized & Ledgered on Public OneID Framework
            </p>
          </div>

          <div className="bg-white border border-yellow-800/10 rounded-xl p-5 text-xs text-slate-800 font-medium space-y-3.5">
            <div className="flex justify-between flex-wrap gap-2">
              <span className="text-slate-500 uppercase text-[10px] tracking-tight">Marriage Record ID:</span>
              <span className="font-mono font-black text-[#006a4e]">{registrationReceipt.marriageId}</span>
            </div>
            
            <div className="flex justify-between flex-wrap gap-2 border-t border-slate-100 pt-2">
              <span className="text-slate-500 uppercase text-[10px] tracking-tight">Groom Identity OneID:</span>
              <span className="font-mono font-bold text-slate-800">{registrationReceipt.marriage?.groomOneId}</span>
            </div>

            <div className="flex justify-between flex-wrap gap-2 border-t border-slate-100 pt-2">
              <span className="text-slate-500 uppercase text-[10px] tracking-tight">Bride Identity OneID:</span>
              <span className="font-mono font-bold text-slate-800">{registrationReceipt.marriage?.brideOneId}</span>
            </div>

            <div className="flex justify-between flex-wrap gap-2 border-t border-slate-100 pt-2">
              <span className="text-slate-500 uppercase text-[10px] tracking-tight">Cryptographic Root Block ID:</span>
              <span className="font-mono text-red-800 text-[10px] select-all truncate max-w-[250px]" title={registrationReceipt.marriage?.nikahnaamaHash}>
                {registrationReceipt.marriage?.nikahnaamaHash}
              </span>
            </div>
          </div>

          <div className="text-center">
            <button
              onClick={() => setRegistrationReceipt(null)}
              className="bg-[#006a4e] hover:bg-[#004e38] text-white text-xs font-black uppercase px-6 py-2.5 rounded-xl shadow transition tracking-wide cursor-pointer"
            >
              Solemnize Next Nikah
            </button>
          </div>
        </motion.div>
      ) : (
        /* Marriage registration form */
        <form onSubmit={handleRegisterMarriage} className="bg-white border border-slate-200 rounded-3xl shadow-sm overflow-hidden">
          
          <div className="px-6 py-4 bg-slate-50 border-b border-slate-150 flex items-center justify-between">
            <h3 className="text-xs font-black text-slate-800 uppercase tracking-tight flex items-center gap-1.5">
              <Users className="h-4 w-4 text-emerald-600" /> Registry Details & OneID Verification
            </h3>
            <span className="text-[10px] font-mono text-slate-400">Section 24 (A) compliant</span>
          </div>

          <div className="p-6 space-y-6">
            
            {/* Groom & Bride Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pb-6 border-b border-slate-150">
              
              {/* Groom input */}
              <div className="space-y-2">
                <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-tight">
                  Groom (বর) OneID
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={groomOneId}
                    onChange={(e) => setGroomOneId(e.target.value)}
                    placeholder="e.g. BD-GROOM-81155"
                    className="flex-1 bg-white border border-slate-300 px-3.5 py-2.5 rounded-xl font-mono text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500/15 focus:border-[#006a4e] font-bold"
                  />
                  <button
                    type="button"
                    onClick={() => { checkOneID('groom', groomOneId) }}
                    disabled={verifying.groom}
                    className="bg-slate-100 border border-slate-250 text-slate-700 font-black text-xs px-4 rounded-xl transition flex items-center gap-1 hover:bg-slate-200 disabled:opacity-50 cursor-pointer"
                  >
                    {verifying.groom ? <RefreshCw className="h-3 w-3 animate-spin" /> : <Search className="h-3.5 w-3.5" />} Verify
                  </button>
                </div>

                {verifiedUsers.groom && (
                  <motion.div
                    initial={{ opacity: 0, y: 3 }}
                    animate={{ opacity: 1, y: 0 }}
                    className={`p-3 rounded-xl text-xs flex flex-col gap-1 ${
                      verifiedUsers.groom.found 
                        ? verifiedUsers.groom.maritalStatus === 'SINGLE' || verifiedUsers.groom.maritalStatus === 'DIVORCED' || verifiedUsers.groom.maritalStatus === 'WIDOWED'
                          ? 'bg-emerald-50 border border-emerald-150 text-emerald-900' 
                          : 'bg-red-50 border border-red-150 text-red-900'
                        : 'bg-slate-50 border border-slate-200 text-slate-500'
                    }`}
                  >
                    {verifiedUsers.groom.found ? (
                      <>
                        <div className="flex items-center justify-between text-[11px] font-black">
                          <span>Verified: {verifiedUsers.groom.name}</span>
                          <span className="uppercase font-bold text-[9px] tracking-wider font-mono">
                            Status: {verifiedUsers.groom.maritalStatus}
                          </span>
                        </div>
                        {verifiedUsers.groom.maritalStatus !== 'SINGLE' && verifiedUsers.groom.maritalStatus !== 'DIVORCED' && verifiedUsers.groom.maritalStatus !== 'WIDOWED' && (
                          <div className="flex items-center gap-1.5 text-red-750 text-[10px] font-black uppercase mt-1">
                            <AlertTriangle className="h-3.5 w-3.5 shrink-0" /> BIGAMY DETECTED: BLOCKED
                          </div>
                        )}
                      </>
                    ) : (
                      <span className="text-red-650 font-bold">Unrecognized OneID key. No citizens found.</span>
                    )}
                  </motion.div>
                )}
              </div>

              {/* Bride input */}
              <div className="space-y-2">
                <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-tight">
                  Bride (কনে) OneID
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={brideOneId}
                    onChange={(e) => setBrideOneId(e.target.value)}
                    placeholder="e.g. BD-BRIDE-40292"
                    className="flex-1 bg-white border border-slate-300 px-3.5 py-2.5 rounded-xl font-mono text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500/15 focus:border-[#006a4e] font-bold"
                  />
                  <button
                    type="button"
                    onClick={() => { checkOneID('bride', brideOneId) }}
                    disabled={verifying.bride}
                    className="bg-slate-100 border border-slate-250 text-slate-700 font-black text-xs px-4 rounded-xl transition flex items-center gap-1 hover:bg-slate-200 disabled:opacity-50 cursor-pointer"
                  >
                    {verifying.bride ? <RefreshCw className="h-3 w-3 animate-spin" /> : <Search className="h-3.5 w-3.5" />} Verify
                  </button>
                </div>

                {verifiedUsers.bride && (
                  <motion.div
                    initial={{ opacity: 0, y: 3 }}
                    animate={{ opacity: 1, y: 0 }}
                    className={`p-3 rounded-xl text-xs flex flex-col gap-1 ${
                      verifiedUsers.bride.found 
                        ? verifiedUsers.bride.maritalStatus === 'SINGLE' || verifiedUsers.bride.maritalStatus === 'DIVORCED' || verifiedUsers.bride.maritalStatus === 'WIDOWED'
                          ? 'bg-emerald-50 border border-emerald-150 text-emerald-900' 
                          : 'bg-red-50 border border-red-150 text-red-900'
                        : 'bg-slate-50 border border-slate-200 text-slate-500'
                    }`}
                  >
                    {verifiedUsers.bride.found ? (
                      <>
                        <div className="flex items-center justify-between text-[11px] font-black">
                          <span>Verified: {verifiedUsers.bride.name}</span>
                          <span className="uppercase font-bold text-[9px] tracking-wider font-mono">
                            Status: {verifiedUsers.bride.maritalStatus}
                          </span>
                        </div>
                        {verifiedUsers.bride.maritalStatus !== 'SINGLE' && verifiedUsers.bride.maritalStatus !== 'DIVORCED' && verifiedUsers.bride.maritalStatus !== 'WIDOWED' && (
                          <div className="flex items-center gap-1.5 text-red-750 text-[10px] font-black uppercase mt-1">
                            <AlertTriangle className="h-3.5 w-3.5 shrink-0" /> BIGAMY DETECTED: BLOCKED
                          </div>
                        )}
                      </>
                    ) : (
                      <span className="text-red-650 font-bold">Unrecognized OneID key. No citizens found.</span>
                    )}
                  </motion.div>
                )}
              </div>

            </div>

            {/* Witnesses verification */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pb-6 border-b border-slate-150">
              
              {/* Witness 1 card */}
              <div className="space-y-2">
                <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-tight">
                  Adult Witness 1 OneID (সাক্ষী ১)
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={witness1OneId}
                    onChange={(e) => setWitness1OneId(e.target.value)}
                    placeholder="e.g. BD-CITIZ-115"
                    className="flex-1 bg-white border border-slate-300 px-3 py-2 rounded-xl font-mono text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500/15 focus:border-[#006a4e] font-bold"
                  />
                  <button
                    type="button"
                    onClick={() => { checkOneID('witness1', witness1OneId) }}
                    disabled={verifying.witness1}
                    className="bg-slate-100 border border-slate-250 text-slate-705 text-slate-700 font-bold text-xs px-3 rounded-xl transition flex items-center gap-1 hover:bg-slate-200 disabled:opacity-50 cursor-pointer"
                  >
                    {verifying.witness1 ? <RefreshCw className="h-3 w-3 animate-spin" /> : <Search className="w-3 h-3" />} Verify
                  </button>
                </div>

                {verifiedUsers.witness1 && (
                  <div className={`p-2 rounded-xl text-[11px] font-bold ${
                    verifiedUsers.witness1.found ? 'bg-slate-50 text-slate-800' : 'bg-red-50 text-red-800'
                  }`}>
                    {verifiedUsers.witness1.found ? `Witness: ${verifiedUsers.witness1.name}` : `Invalid OneID witness`}
                  </div>
                )}
              </div>

              {/* Witness 2 card */}
              <div className="space-y-2">
                <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-tight">
                  Adult Witness 2 OneID (সাক্ষী ২)
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={witness2OneId}
                    onChange={(e) => setWitness2OneId(e.target.value)}
                    placeholder="e.g. BD-CITIZ-224"
                    className="flex-1 bg-white border border-slate-300 px-3 py-2 rounded-xl font-mono text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500/15 focus:border-[#006a4e] font-bold"
                  />
                  <button
                    type="button"
                    onClick={() => { checkOneID('witness2', witness2OneId) }}
                    disabled={verifying.witness2}
                    className="bg-slate-100 border border-slate-250 text-slate-705 text-slate-700 font-bold text-xs px-3 rounded-xl transition flex items-center gap-1 hover:bg-slate-200 disabled:opacity-50 cursor-pointer"
                  >
                    {verifying.witness2 ? <RefreshCw className="h-3 w-3 animate-spin" /> : <Search className="w-3 h-3" />} Verify
                  </button>
                </div>

                {verifiedUsers.witness2 && (
                  <div className={`p-2 rounded-xl text-[11px] font-bold ${
                    verifiedUsers.witness2.found ? 'bg-slate-50 text-slate-800' : 'bg-red-50 text-red-800'
                  }`}>
                    {verifiedUsers.witness2.found ? `Witness: ${verifiedUsers.witness2.name}` : `Invalid OneID witness`}
                  </div>
                )}
              </div>

            </div>

            {/* Mahr fees details */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              
              <div className="space-y-1.5">
                <label className="block text-[11px] font-bold text-slate-500 uppercase">
                  Mahr / Dower Fee (মোহরানা) BDT
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500 font-bold">
                    ৳
                  </div>
                  <input
                    type="number"
                    value={mahrAmount}
                    onChange={(e) => setMahrAmount(e.target.value)}
                    placeholder="e.g. 500000"
                    className="w-full bg-white border border-slate-300 pl-8 pr-3.5 py-2.5 rounded-xl text-xs font-bold focus:outline-none focus:ring-2 focus:ring-emerald-500/15 focus:border-[#006a4e]"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="block text-[11px] font-bold text-slate-500 uppercase">
                  Dower Payment Type (Mahr Type)
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {['PROMPT', 'DEFERRED', 'PARTLY_PROMPT'].map(type => (
                    <button
                      key={type}
                      type="button"
                      onClick={() => setMahrType(type)}
                      className={`py-2 rounded-xl border text-[10px] font-black uppercase tracking-tight transition ${
                        mahrType === type 
                          ? 'border-[#006a4e] bg-emerald-50 text-emerald-950 shadow-sm' 
                          : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
                      }`}
                    >
                      {type.replace('_', ' ')}
                    </button>
                  ))}
                </div>
              </div>

            </div>

            {/* Bigamy warning banner overlay if active */}
            {hasBigamyRisk() && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-red-50 border border-red-250 p-4 rounded-2xl flex gap-3 text-red-950 text-xs font-medium leading-relaxed shadow-sm"
              >
                <AlertTriangle className="h-5 w-5 text-red-600 shrink-0 mt-0.5" />
                <div className="space-y-1">
                  <strong className="block text-red-750 font-black uppercase text-[10px] tracking-wider">
                    BIGAMY PREVENTION INTERCEPT LOCK TRIGGERED
                  </strong>
                  <span>Marriage cannot be registered. Civil code dictates both citizens must be unmarried or have a completed legal dissolution certificate logged in standard directory.</span>
                </div>
              </motion.div>
            )}

            {/* General witness mismatch or equal warning */}
            {(() => {
              const g = groomOneId.trim().toUpperCase();
              const b = brideOneId.trim().toUpperCase();
              const w1 = witness1OneId.trim().toUpperCase();
              const w2 = witness2OneId.trim().toUpperCase();

              if (g && b && g === b) {
                return (
                  <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-red-800 text-xs font-bold">
                    ⚠️ Error: Groom and Bride OneIDs cannot be identical.
                  </div>
                );
              }
              if (w1 && w2 && (w1 === w2 || w1 === g || w1 === b || w2 === g || w2 === b)) {
                return (
                  <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-amber-800 text-xs font-bold">
                    ⚠️ Warning: Witnesses must be unique adult citizen keys separate from the wedding party.
                  </div>
                );
              }
              return null;
            })()}

          </div>

          <div className="px-6 py-4 bg-slate-50 border-t border-slate-150 text-right">
            <button
              type="submit"
              disabled={registeringModel || !isFormValid()}
              className="inline-flex items-center gap-2 bg-[#006a4e] hover:bg-[#004e38] text-white text-xs font-black uppercase px-6 py-3 rounded-xl transition shadow disabled:opacity-50 cursor-pointer"
            >
              {registeringModel ? <RefreshCw className="h-4 w-4 animate-spin" /> : <FileCheck2 className="h-4 w-4" />} Registry Marriage (Nikahnama) <ArrowRight className="h-3.5 w-3.5" />
            </button>
          </div>

        </form>
      )}

    </div>
  );
}
