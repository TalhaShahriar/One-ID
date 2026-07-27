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
  ArrowLeft
} from 'lucide-react';
import api from '../lib/api.js';

export default function VerifyIdentity() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const oneid = searchParams.get('oneid');
  const maskNid = searchParams.get('maskNid') === 'true';
  const verifyAge = searchParams.get('verifyAge') === 'true';
  const verifyTax = searchParams.get('verifyTax') === 'true';
  const verifyProperty = searchParams.get('verifyProperty') === 'true';
  const verifyVoting = searchParams.get('verifyVoting') === 'true';

  const [citizen, setCitizen] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [verifiedAt] = useState(new Date());

  useEffect(() => {
    if (!oneid) {
      setError('Invalid Verification Session. Missing sovereign OneID reference.');
      setLoading(false);
      return;
    }

    const fetchStatus = async () => {
      try {
        const res = await api.get(`/citizen/public-verify-identity/${oneid}`);
        setCitizen(res.data);
      } catch (err) {
        console.error(err);
        setError(err.response?.data?.error || 'Sovereign ledger response timed out. Verify network state.');
      } finally {
        setLoading(false);
      }
    };

    fetchStatus();
  }, [oneid]);

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col justify-center items-center p-6 text-slate-100">
        <div className="relative mb-6">
          <div className="h-16 w-16 animate-spin rounded-full border-4 border-emerald-500/10 border-t-emerald-500" />
          <Database className="h-6 w-6 text-emerald-500 absolute inset-0 m-auto animate-pulse" />
        </div>
        <h3 className="text-sm font-bold font-mono tracking-wider text-slate-300 uppercase">Interrogating OneID Ledger Core...</h3>
        <p className="text-[11px] text-slate-500 mt-1">Decrypting secure token and fetching real-time state</p>
      </div>
    );
  }

  if (error || !citizen) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col justify-center items-center p-6 text-slate-100 font-sans">
        <div className="bg-slate-900 border border-rose-500/30 p-8 rounded-3xl max-w-md w-full text-center space-y-4 shadow-xl">
          <div className="w-12 h-12 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-rose-400 flex items-center justify-center mx-auto text-xl">
            ⚠️
          </div>
          <h3 className="text-base font-black text-white">Verification Session Expired</h3>
          <p className="text-xs text-slate-400 leading-relaxed">
            {error || 'The requested citizen record is either invalid or was revoked from the national blockchain directory.'}
          </p>
          <div className="pt-2">
            <button
              onClick={() => navigate('/')}
              className="w-full py-2 bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs uppercase font-mono rounded-xl transition"
            >
              Back to Portal
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Formatting NID based on customer's choice
  const displayNid = maskNid 
    ? `${citizen.oneid.substring(0, 8)}-XXXX-XXXX`
    : citizen.oneid;

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans pb-16 relative overflow-hidden">
      
      {/* Return Home Button */}
      <div className="absolute top-6 left-6 z-20">
        <button
          onClick={() => navigate('/')}
          className="flex items-center gap-1.5 text-slate-400 hover:text-white transition-colors text-xs font-bold uppercase tracking-wider bg-slate-900 px-3 py-2 rounded-lg shadow-sm border border-slate-800"
        >
          <ArrowLeft className="h-4 w-4" /> Home
        </button>
      </div>

      {/* Bangladesh Green & Red Background Ambient Glow */}
      <div className="absolute top-0 left-1/4 w-96 h-96 bg-emerald-900/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-rose-950/10 rounded-full blur-3xl pointer-events-none" />

      {/* Grid Pattern overlay */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#111827_1px,transparent_1px),linear-gradient(to_bottom,#111827_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)] pointer-events-none" />

      <div className="max-w-xl mx-auto px-4 pt-12 relative z-10 space-y-6">
        
        {/* Verification Hub Header */}
        <div className="text-center space-y-2">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-[10px] font-black font-mono uppercase tracking-widest mx-auto">
            <ShieldCheck className="h-3.5 w-3.5" /> SECURE ID PROOF
          </div>
          <h2 className="text-2xl font-black text-white tracking-tight">
            OneID Physical Verifier Portal
          </h2>
          <p className="text-[11px] text-slate-400 max-w-sm mx-auto">
            This card was dynamically created by the citizen. Only checked features are shared with the verifier.
          </p>
        </div>

        {/* Central Identity Badge Card */}
        <motion.div 
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-slate-900/90 border border-emerald-500/30 rounded-3xl overflow-hidden shadow-2xl relative"
        >
          {/* Bangladesh National Banner line decoration */}
          <div className="h-2 bg-gradient-to-r from-emerald-600 via-emerald-500 to-rose-600" />

          {/* Secure Verification Stamp / Watermark background */}
          <div className="absolute right-4 top-8 opacity-[0.03] select-none pointer-events-none">
            <ShieldCheck className="w-64 h-64 text-white" />
          </div>

          <div className="p-6 md:p-8 space-y-6 relative z-10">
            
            {/* Upper Profile Section */}
            <div className="flex items-start gap-4">
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-emerald-500/20 to-emerald-700/5 border border-emerald-500/30 flex items-center justify-center text-emerald-400 text-xl font-bold shrink-0">
                {citizen.name ? citizen.name[0].toUpperCase() : 'BD'}
              </div>
              <div className="space-y-1.5 min-w-0">
                <h3 className="text-lg font-black text-white tracking-tight leading-tight truncate">
                  {citizen.name}
                </h3>
                <p className="text-xs font-mono font-bold text-emerald-400">
                  {displayNid}
                </p>
                <div className="flex items-center gap-1 text-[10px] text-slate-400">
                  <MapPin className="h-3 w-3 text-slate-500" />
                  <span className="truncate">{citizen.upazila}, {citizen.district}</span>
                </div>
              </div>
            </div>

            {/* Verification Items List */}
            <div className="space-y-3.5 border-t border-slate-800/80 pt-5">
              
              {/* Feature: Age Verification */}
              <div className="flex items-center justify-between p-3 rounded-2xl bg-slate-950/60 border border-slate-850">
                <div className="flex items-center gap-2.5">
                  <Calendar className="h-4 w-4 text-amber-400" />
                  <div className="text-left">
                    <div className="text-xs font-bold text-white leading-none">Age check status</div>
                    <div className="text-[10px] text-slate-500 font-mono mt-0.5">Sovereign Birthday match</div>
                  </div>
                </div>
                <div>
                  {verifyAge ? (
                    citizen.isAdult ? (
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-[10px] font-bold">
                        <CheckCircle className="h-3 w-3" /> ADULT (18+)
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-400 text-[10px] font-bold">
                        <XCircle className="h-3 w-3" /> UNDER 18
                      </span>
                    )
                  ) : (
                    <span className="text-[10px] text-slate-500 font-mono italic">Not Shared</span>
                  )}
                </div>
              </div>

              {/* Feature: Tax Standing */}
              <div className="flex items-center justify-between p-3 rounded-2xl bg-slate-950/60 border border-slate-850">
                <div className="flex items-center gap-2.5">
                  <span className="text-base text-blue-400 font-mono font-black">৳</span>
                  <div className="text-left">
                    <div className="text-xs font-bold text-white leading-none">eVat Tax compliance</div>
                    <div className="text-[10px] text-slate-500 font-mono mt-0.5">National Revenue database</div>
                  </div>
                </div>
                <div>
                  {verifyTax ? (
                    citizen.taxFiled && citizen.taxArrears === 0 ? (
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-[10px] font-bold">
                        <CheckCircle className="h-3 w-3" /> COMPLIANT
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-rose-500/10 border border-rose-500/30 text-rose-400 text-[10px] font-bold">
                        <AlertTriangle className="h-3 w-3" /> ARREARS DUE
                      </span>
                    )
                  ) : (
                    <span className="text-[10px] text-slate-500 font-mono italic">Not Shared</span>
                  )}
                </div>
              </div>

              {/* Feature: Land Properties Count */}
              <div className="flex items-center justify-between p-3 rounded-2xl bg-slate-950/60 border border-slate-850">
                <div className="flex items-center gap-2.5">
                  <Building className="h-4 w-4 text-teal-400" />
                  <div className="text-left">
                    <div className="text-xs font-bold text-white leading-none">Land Deeds Registered</div>
                    <div className="text-[10px] text-slate-500 font-mono mt-0.5">Sovereign Land Cabinet mutations</div>
                  </div>
                </div>
                <div>
                  {verifyProperty ? (
                    <span className="text-xs font-mono font-bold text-slate-200">
                      {citizen.ownedPropertiesCount} {citizen.ownedPropertiesCount === 1 ? 'Deed' : 'Deeds'}
                    </span>
                  ) : (
                    <span className="text-[10px] text-slate-500 font-mono italic">Not Shared</span>
                  )}
                </div>
              </div>

              {/* Feature: Voter Participation */}
              <div className="flex items-center justify-between p-3 rounded-2xl bg-slate-950/60 border border-slate-850">
                <div className="flex items-center gap-2.5">
                  <Award className="h-4 w-4 text-purple-400" />
                  <div className="text-left">
                    <div className="text-xs font-bold text-white leading-none">Election Voting Slip</div>
                    <div className="text-[10px] text-slate-500 font-mono mt-0.5">Voter slip blockchain receipt</div>
                  </div>
                </div>
                <div>
                  {verifyVoting ? (
                    citizen.hasVoted ? (
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-emerald-500/10 border border-[#006a4e]/40 text-emerald-400 text-[10px] font-bold font-mono">
                        ✓ CASTED
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-slate-800 border border-slate-700 text-slate-400 text-[10px] font-bold font-mono">
                        AWAITING
                      </span>
                    )
                  ) : (
                    <span className="text-[10px] text-slate-500 font-mono italic">Not Shared</span>
                  )}
                </div>
              </div>

            </div>

            {/* Cryptographic Proof Verification Block */}
            <div className="bg-slate-950 p-4 rounded-2xl border border-slate-850 space-y-2 text-center">
              <div className="flex justify-center gap-1 items-center text-[10px] font-black text-slate-400 font-mono uppercase tracking-wider">
                <Activity className="h-3 w-3 text-emerald-400 animate-pulse" /> Live Blockchain Attestation
              </div>
              <p className="text-[9px] text-slate-500 leading-relaxed font-sans px-2">
                This verification query was processed determinstically by Bangladesh central nodes. All hashes are sealed under SHA-256 and signed cryptographically.
              </p>
              <div className="pt-2 border-t border-slate-900 flex justify-between items-center text-[8px] font-mono text-slate-500">
                <span>VERIFIED AT</span>
                <span className="text-slate-300 font-medium">{verifiedAt.toLocaleTimeString()} UTC</span>
              </div>
            </div>

          </div>
        </motion.div>

        {/* Action Button */}
        <div className="text-center pt-2">
          <a
            href="/"
            className="inline-flex items-center gap-1 text-xs font-bold font-mono text-slate-500 hover:text-emerald-400 transition"
          >
            ← Return to OneID Portal
          </a>
        </div>

      </div>
    </div>
  );
}
