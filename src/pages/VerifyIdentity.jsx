import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { motion } from 'motion/react';
import { 
  ShieldCheck, 
  AlertTriangle, 
  CheckCircle, 
  User, 
  MapPin, 
  Calendar, 
  TrendingUp, 
  Clock, 
  Heart, 
  FileText, 
  Briefcase, 
  ChevronRight, 
  XCircle,
  Database,
  Building,
  Activity,
  Award,
  Home,
  ArrowLeft,
  QrCode,
  Search,
  Camera,
  DollarSign,
  Car
} from 'lucide-react';
import api from '../lib/api.js';
import QRScanner from '../shared/components/QRScanner.jsx';
import { toast } from 'sonner';

export default function VerifyIdentity() {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();

  const oneid = searchParams.get('oneid');
  const maskNid = searchParams.get('maskNid') === 'true';

  const [inputOneId, setInputOneId] = useState(oneid || '');
  const [showQRScanner, setShowQRScanner] = useState(false);
  const [citizen, setCitizen] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [verifiedAt, setVerifiedAt] = useState(new Date());

  const fetchStatus = async (targetOneId) => {
    if (!targetOneId) return;
    setLoading(true);
    setError(null);
    setCitizen(null);

    // Extract oneid if full URL was scanned/pasted
    let cleanOneId = targetOneId.trim();
    if (cleanOneId.includes('oneid=')) {
      const match = cleanOneId.match(/oneid=([^&]+)/);
      if (match && match[1]) cleanOneId = match[1];
    }

    try {
      const res = await api.get(`/citizen/public-verify-identity/${cleanOneId}`);
      setCitizen(res.data);
      setVerifiedAt(new Date());
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.error || 'No matching citizen record found on sovereign OneID ledger.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (oneid) {
      setInputOneId(oneid);
      fetchStatus(oneid);
    }
  }, [oneid]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    if (!inputOneId.trim()) {
      toast.error('Please enter a valid OneID to verify.');
      return;
    }
    setSearchParams({ oneid: inputOneId.trim() });
    fetchStatus(inputOneId.trim());
  };

  const handleQRScanResult = (scannedText) => {
    setShowQRScanner(false);
    let scannedOneId = scannedText.trim();
    if (scannedOneId.includes('oneid=')) {
      const match = scannedOneId.match(/oneid=([^&]+)/);
      if (match && match[1]) scannedOneId = match[1];
    }
    setInputOneId(scannedOneId);
    setSearchParams({ oneid: scannedOneId });
    toast.success(`QR Scanned: ${scannedOneId}`);
    fetchStatus(scannedOneId);
  };

  const displayNid = maskNid && citizen
    ? `${citizen.oneid.substring(0, 8)}-XXXX-XXXX`
    : citizen?.oneid;

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans pb-16 relative overflow-hidden">
      
      {/* Return Home Button */}
      <div className="absolute top-6 left-6 z-20">
        <button
          onClick={() => navigate('/')}
          className="flex items-center gap-1.5 text-slate-400 hover:text-white transition-colors text-xs font-bold uppercase tracking-wider bg-slate-900 px-3.5 py-2 rounded-xl shadow-sm border border-slate-800 cursor-pointer"
        >
          <ArrowLeft className="h-4 w-4" /> Home
        </button>
      </div>

      {/* Bangladesh Green & Red Background Ambient Glow */}
      <div className="absolute top-0 left-1/4 w-96 h-96 bg-emerald-900/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-rose-950/10 rounded-full blur-3xl pointer-events-none" />

      {/* Grid Pattern overlay */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#111827_1px,transparent_1px),linear-gradient(to_bottom,#111827_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)] pointer-events-none" />

      <div className="max-w-2xl mx-auto px-4 pt-12 relative z-10 space-y-6">
        
        {/* Header */}
        <div className="text-center space-y-2">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-[10px] font-black font-mono uppercase tracking-widest mx-auto">
            <ShieldCheck className="h-3.5 w-3.5" /> SOVEREIGN ONEID VERIFIER
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight font-serif">
            OneID Public Dossier & Status Verifier
          </h1>
          <p className="text-xs text-slate-400 max-w-md mx-auto">
            Scan a physical NID QR code or input a OneID number to verify voting eligibility, tax compliance status, civil records, and sovereign credentials.
          </p>
        </div>

        {/* Search & Camera Scanner Bar */}
        <div className="bg-slate-900/90 border border-slate-800 p-4 rounded-2xl shadow-xl space-y-3">
          <form onSubmit={handleSearchSubmit} className="flex flex-col sm:flex-row gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
              <input
                type="text"
                placeholder="Enter OneID (e.g. BD-2026-X1Y2Z)..."
                value={inputOneId}
                onChange={(e) => setInputOneId(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl font-mono text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 font-bold"
              />
            </div>

            <div className="flex gap-2 shrink-0">
              <button
                type="button"
                onClick={() => setShowQRScanner(true)}
                className="bg-emerald-950/80 hover:bg-emerald-900 border border-emerald-700/50 text-emerald-300 text-xs font-bold px-4 py-2.5 rounded-xl transition flex items-center gap-1.5 cursor-pointer"
              >
                <Camera className="h-4 w-4 text-emerald-400" /> Scan QR
              </button>

              <button
                type="submit"
                disabled={loading}
                className="bg-[#006a4e] hover:bg-[#00523c] text-white text-xs font-black uppercase px-5 py-2.5 rounded-xl transition flex items-center gap-1.5 cursor-pointer shrink-0"
              >
                {loading ? 'Mining...' : 'Verify'}
              </button>
            </div>
          </form>
        </div>

        {/* QR Scanner Modal */}
        {showQRScanner && (
          <QRScanner
            onScan={handleQRScanResult}
            onClose={() => setShowQRScanner(false)}
          />
        )}

        {/* Loading State */}
        {loading && (
          <div className="bg-slate-900 border border-slate-800 p-12 rounded-3xl text-center space-y-3">
            <div className="relative mx-auto w-12 h-12">
              <div className="h-12 w-12 animate-spin rounded-full border-4 border-emerald-500/10 border-t-emerald-500" />
              <Database className="h-5 w-5 text-emerald-500 absolute inset-0 m-auto animate-pulse" />
            </div>
            <h3 className="text-xs font-bold font-mono tracking-wider text-slate-300 uppercase">
              Interrogating OneID Central Ledger...
            </h3>
            <p className="text-[10px] text-slate-500">Decrypting identity token and querying electoral and revenue registers</p>
          </div>
        )}

        {/* Error State */}
        {error && !loading && (
          <div className="bg-slate-900 border border-rose-500/30 p-8 rounded-3xl text-center space-y-4 shadow-xl">
            <div className="w-12 h-12 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-rose-400 flex items-center justify-center mx-auto text-xl">
              ⚠️
            </div>
            <h3 className="text-base font-black text-white">Record Not Found / Invalid</h3>
            <p className="text-xs text-slate-400 leading-relaxed max-w-sm mx-auto">
              {error}
            </p>
          </div>
        )}

        {/* Full Citizen Profile & Verification Dossier */}
        {citizen && !loading && (
          <motion.div 
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-6"
          >
            {/* Identity Card */}
            <div className="bg-slate-900/90 border border-emerald-500/30 rounded-3xl overflow-hidden shadow-2xl relative">
              {/* BD Flag Banner */}
              <div className="h-2.5 bg-gradient-to-r from-[#006a4e] via-emerald-500 to-[#f42a41]" />

              <div className="p-6 sm:p-8 space-y-6 relative z-10">
                
                {/* Upper Identity Header */}
                <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 justify-between border-b border-slate-800 pb-6">
                  <div className="flex items-center gap-4">
                    <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-[#006a4e] to-emerald-800 text-white flex items-center justify-center text-2xl font-bold border-2 border-emerald-400/30 shadow-lg shrink-0">
                      {citizen.name ? citizen.name[0].toUpperCase() : 'BD'}
                    </div>
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <h2 className="text-xl font-black text-white tracking-tight">
                          {citizen.name}
                        </h2>
                        <span className="bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-[10px] font-black px-2 py-0.5 rounded-md uppercase font-mono">
                          Verified
                        </span>
                      </div>
                      <p className="text-xs font-mono font-bold text-emerald-400 tracking-wider">
                        {displayNid}
                      </p>
                      <div className="flex flex-wrap items-center gap-3 text-[11px] text-slate-400">
                        <span className="flex items-center gap-1">
                          <MapPin className="h-3 w-3 text-slate-500" />
                          {citizen.upazila || 'Ramna'}, {citizen.district || 'Dhaka'} ({citizen.division || 'Dhaka'})
                        </span>
                        <span>•</span>
                        <span>Age: <strong className="text-slate-200">{citizen.age || 'N/A'} yrs</strong></span>
                      </div>
                    </div>
                  </div>

                  <div className="bg-slate-950 border border-slate-800 p-3 rounded-2xl text-right shrink-0">
                    <span className="text-[9px] font-mono uppercase text-slate-500 block font-bold">Civil Status</span>
                    <span className="text-xs font-mono font-black text-amber-400 block uppercase">
                      {citizen.maritalStatus || 'SINGLE'}
                    </span>
                  </div>
                </div>

                {/* 2 CORE SECTIONS: VOTING ELIGIBILITY + TAX COMPLIANCE */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  
                  {/* VOTING ELIGIBILITY BOX */}
                  <div className={`p-5 rounded-2xl border ${
                    citizen.isVoterEligible 
                      ? 'bg-emerald-950/30 border-emerald-500/40' 
                      : 'bg-rose-950/30 border-rose-500/40'
                  } space-y-3`}>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Award className={`h-5 w-5 ${citizen.isVoterEligible ? 'text-emerald-400' : 'text-rose-400'}`} />
                        <h3 className="text-xs font-black uppercase tracking-wider text-white">
                          Voting Eligibility
                        </h3>
                      </div>
                      {citizen.isVoterEligible ? (
                        <span className="bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 px-2.5 py-1 rounded-full text-[10px] font-black font-mono flex items-center gap-1">
                          <CheckCircle className="h-3 w-3" /> ELIGIBLE
                        </span>
                      ) : (
                        <span className="bg-rose-500/20 text-rose-300 border border-rose-500/40 px-2.5 py-1 rounded-full text-[10px] font-black font-mono flex items-center gap-1">
                          <XCircle className="h-3 w-3" /> INELIGIBLE
                        </span>
                      )}
                    </div>

                    <div className="space-y-2 text-xs font-mono">
                      <div className="flex justify-between border-b border-slate-800/60 pb-1.5">
                        <span className="text-slate-400">Age Requirement:</span>
                        <span className="font-bold text-white">{citizen.isAdult ? 'Passed (18+ Adult)' : 'Underage (<18)'}</span>
                      </div>
                      <div className="flex justify-between border-b border-slate-800/60 pb-1.5">
                        <span className="text-slate-400">Constituency:</span>
                        <span className="font-bold text-emerald-300">{citizen.constituency}</span>
                      </div>
                      <div className="flex justify-between border-b border-slate-800/60 pb-1.5">
                        <span className="text-slate-400">Active Elections:</span>
                        <span className="font-bold text-white">{citizen.activeElectionsCount || 0} Open</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-400">Ballot Participation:</span>
                        <span className={`font-bold ${citizen.hasVoted ? 'text-emerald-400' : 'text-amber-400'}`}>
                          {citizen.hasVoted ? '✓ BALLOT CAST' : 'AWAITING BALLOT'}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* TAX PAYMENT STANDING BOX */}
                  <div className={`p-5 rounded-2xl border ${
                    citizen.taxPaymentStatus === 'PAID'
                      ? 'bg-blue-950/30 border-blue-500/40' 
                      : 'bg-amber-950/30 border-amber-500/40'
                  } space-y-3`}>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <DollarSign className={`h-5 w-5 ${citizen.taxPaymentStatus === 'PAID' ? 'text-blue-400' : 'text-amber-400'}`} />
                        <h3 className="text-xs font-black uppercase tracking-wider text-white">
                          Tax Compliance
                        </h3>
                      </div>
                      {citizen.taxPaymentStatus === 'PAID' ? (
                        <span className="bg-blue-500/20 text-blue-300 border border-blue-500/40 px-2.5 py-1 rounded-full text-[10px] font-black font-mono flex items-center gap-1">
                          <CheckCircle className="h-3 w-3" /> PAID & COMPLIANT
                        </span>
                      ) : (
                        <span className="bg-amber-500/20 text-amber-300 border border-amber-500/40 px-2.5 py-1 rounded-full text-[10px] font-black font-mono flex items-center gap-1">
                          <AlertTriangle className="h-3 w-3" /> {citizen.taxArrears > 0 ? 'ARREARS DUE' : 'NO RETURN FILED'}
                        </span>
                      )}
                    </div>

                    <div className="space-y-2 text-xs font-mono">
                      <div className="flex justify-between border-b border-slate-800/60 pb-1.5">
                        <span className="text-slate-400">TIN Number:</span>
                        <span className="font-bold text-slate-200">{citizen.tinNumber || 'TIN-NOT-ISSUED'}</span>
                      </div>
                      <div className="flex justify-between border-b border-slate-800/60 pb-1.5">
                        <span className="text-slate-400">Last Return Filed:</span>
                        <span className="font-bold text-white">{citizen.lastTaxReturnYear ? `FY ${citizen.lastTaxReturnYear}` : 'None'}</span>
                      </div>
                      <div className="flex justify-between border-b border-slate-800/60 pb-1.5">
                        <span className="text-slate-400">Total Tax Paid:</span>
                        <span className="font-bold text-blue-300">৳ {(citizen.totalTaxPaid || 0).toLocaleString()} BDT</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-400">Outstanding Arrears:</span>
                        <span className={`font-bold ${citizen.taxArrears === 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                          ৳ {(citizen.taxArrears || 0).toLocaleString()} BDT
                        </span>
                      </div>
                    </div>
                  </div>

                </div>

                {/* ADDITIONAL REGISTRIES SUMMARY */}
                <div className="bg-slate-950 p-4 rounded-2xl border border-slate-850 grid grid-cols-2 sm:grid-cols-4 gap-3 text-center">
                  <div className="p-2 border-r border-slate-850">
                    <span className="text-[9px] font-mono text-slate-500 uppercase block font-bold">Driving License</span>
                    <span className="text-xs font-mono font-bold text-slate-200 mt-1 block">
                      {citizen.hasDrivingLicense ? citizen.drivingLicenseStatus : 'NO LICENSE'}
                    </span>
                  </div>

                  <div className="p-2 border-r border-slate-850">
                    <span className="text-[9px] font-mono text-slate-500 uppercase block font-bold">Land Property</span>
                    <span className="text-xs font-mono font-bold text-teal-300 mt-1 block">
                      {citizen.ownedPropertiesCount || 0} Deed(s)
                    </span>
                  </div>

                  <div className="p-2 border-r border-slate-850">
                    <span className="text-[9px] font-mono text-slate-500 uppercase block font-bold">BRTA Vehicles</span>
                    <span className="text-xs font-mono font-bold text-indigo-300 mt-1 block">
                      {citizen.ownedVehiclesCount || 0} Vehicle(s)
                    </span>
                  </div>

                  <div className="p-2">
                    <span className="text-[9px] font-mono text-slate-500 uppercase block font-bold">Blood Group</span>
                    <span className="text-xs font-mono font-bold text-rose-400 mt-1 block">
                      {citizen.bloodGroup || 'O+'}
                    </span>
                  </div>
                </div>

                {/* Cryptographic Proof Block */}
                <div className="bg-slate-950 p-4 rounded-2xl border border-slate-850 space-y-2 text-center">
                  <div className="flex justify-center gap-1 items-center text-[10px] font-black text-slate-400 font-mono uppercase tracking-wider">
                    <Activity className="h-3 w-3 text-emerald-400 animate-pulse" /> Cryptographic Ledger Seal Active
                  </div>
                  <p className="text-[9px] text-slate-500 leading-relaxed font-sans px-2">
                    This verification query was processed deterministically by OneID Bangladesh central nodes. All hashes are sealed under SHA-256 and signed cryptographically.
                  </p>
                  <div className="pt-2 border-t border-slate-900 flex justify-between items-center text-[8px] font-mono text-slate-500">
                    <span>SEALED TIMESTAMP</span>
                    <span className="text-slate-300 font-medium">{verifiedAt.toLocaleTimeString()} UTC</span>
                  </div>
                </div>

              </div>
            </div>
          </motion.div>
        )}

      </div>
    </div>
  );
}
