import React, { useState, useEffect } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { motion } from 'motion/react';
import { 
  ShieldCheck, 
  Search, 
  CheckCircle, 
  AlertCircle, 
  Clock, 
  FileCheck2, 
  Cpu, 
  ArrowLeft 
} from 'lucide-react';
import api from '../lib/api.js';

export default function Verify() {
  const [searchParams] = useSearchParams();
  const [tokenInput, setTokenInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [verificationResult, setVerificationResult] = useState(null);
  const [errorMsg, setErrorMsg] = useState('');

  // Auto-scan queries if parameter token resides in context
  useEffect(() => {
    const tokenQuery = searchParams.get('token');
    if (tokenQuery) {
      setTokenInput(tokenQuery);
      handleVerify(tokenQuery);
    }
  }, [searchParams]);

  const handleVerify = async (targetToken) => {
    const tokenToSearch = targetToken || tokenInput;
    if (!tokenToSearch.trim()) {
      setErrorMsg('Please input a valid receipt token.');
      return;
    }

    setLoading(true);
    setVerificationResult(null);
    setErrorMsg('');

    try {
      // Fetch public verification details (does not require auth header)
      const response = await api.get(`/votes/verify/${tokenToSearch.trim()}`);
      
      if (response.data && response.data.valid) {
        setVerificationResult(response.data);
      } else {
        setVerificationResult({ valid: false, message: response.data?.message || 'Token not found' });
      }
    } catch (err) {
      console.error('An error occurred verifying vote receipt token:', err);
      setErrorMsg('Connection error. Failed to reach verification node.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8 font-sans">
      
      {/* BRAND NAVIGATION REGION */}
      <div className="sm:mx-auto sm:w-full sm:max-w-xl pb-4 text-center">
        <Link to="/" className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-500 hover:text-slate-800 transition mb-6">
          <ArrowLeft className="h-4 w-4" /> Return to Welcome Portal
        </Link>
        <div className="flex justify-center mb-4">
          <div className="w-14 h-14 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center border border-emerald-150 shadow-md">
            <ShieldCheck className="h-7 w-7" />
          </div>
        </div>
        <h2 className="text-3xl font-black text-slate-900 tracking-tight text-center uppercase">
          OneID Ledger Verification Node
        </h2>
        <p className="mt-1 text-center text-xs text-slate-500 max-w-sm mx-auto font-medium">
          Verify sovereign ballot receipts globally and confirm entry in the immutable decentralization database.
        </p>
      </div>

      <div className="sm:mx-auto sm:w-full sm:max-w-xl">
        <div className="bg-white py-8 px-6 border border-slate-200 shadow-sm rounded-3xl space-y-6 sm:px-10">
          
          {/* SEARCH INTERFACE */}
          <div className="space-y-2">
            <label htmlFor="token-entry" className="block text-[11px] font-bold text-slate-500 uppercase tracking-tight">
              Enter Cryptographic Receipt Token
            </label>
            <div className="flex gap-2">
              <input
                id="token-entry"
                type="text"
                value={tokenInput}
                onChange={(e) => setTokenInput(e.target.value)}
                placeholder="Paste UUID token or scan receipt..."
                className="flex-1 bg-white border border-slate-350 px-3.5 py-2.5 text-xs text-slate-800 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/10 focus:border-emerald-500 transition-all font-mono font-bold"
              />
              <button
                id="verify-token-action"
                onClick={() => handleVerify()}
                disabled={loading}
                className="bg-[#006a4e] hover:bg-[#004e38] text-white text-xs font-bold px-5 py-2.5 rounded-xl transition flex items-center gap-1.5 shrink-0 disabled:opacity-50 cursor-pointer"
              >
                {loading ? 'Validating...' : (
                  <>
                    <Search className="h-3.5 w-3.5" /> Search Ledger
                  </>
                )}
              </button>
            </div>
            {errorMsg && (
              <p className="text-xs font-bold text-red-600">{errorMsg}</p>
            )}
          </div>

          {/* VERIFY RESULT PRESENTATIONS */}
          {verificationResult && (
            <motion.div
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              className="pt-4 border-t border-slate-150"
            >
              {verificationResult.valid ? (
                /* VALID GREEN CARD */
                <div className="bg-emerald-50 border border-emerald-250 rounded-2xl p-5 space-y-4 text-left">
                  <div className="flex gap-2.5 items-center text-[#006a4e]">
                    <CheckCircle className="h-5 w-5 shrink-0" />
                    <span className="text-xs font-black uppercase tracking-tight">
                      Vote Verified ✓
                    </span>
                  </div>

                  <p className="text-xs text-slate-600 font-medium leading-relaxed">
                    Ballot was successfully ledgered and sealed in <strong className="text-slate-800 font-bold">{verificationResult.election?.title}</strong>.
                  </p>

                  <div className="border-t border-emerald-200/50 pt-3 text-[11px] font-mono font-bold text-[#006a4e]/80 space-y-1.5">
                    <div className="flex justify-between flex-wrap gap-2">
                      <span>Ledger Register ID:</span>
                      <span className="text-slate-700 font-bold truncate max-w-[200px]">{verificationResult.vote_id}</span>
                    </div>
                    <div className="flex justify-between flex-wrap gap-2">
                      <span>Cast Stamp Timestamp:</span>
                      <span>{new Date(verificationResult.cast_at).toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between flex-wrap gap-2">
                      <span>Election Category:</span>
                      <span>{verificationResult.election?.election_type}</span>
                    </div>
                  </div>
                </div>
              ) : (
                /* INVALID RED CARD */
                <div className="bg-red-50 border border-red-200 rounded-2xl p-5 space-y-2 text-left text-red-800">
                  <div className="flex gap-2 items-center text-red-700">
                    <AlertCircle className="h-5 w-5" />
                    <span className="text-xs font-black uppercase tracking-tight">
                      Token not found
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 font-medium leading-relaxed pl-1">
                    Check the token and try again. This receipt code failed verification constraints or has been excluded from the cryptographic chain checks.
                  </p>
                </div>
              )}
            </motion.div>
          )}

          {/* VERIFY SUMMARY BENEFITS INFO PANEL */}
          <div className="pt-4 border-t border-slate-150 text-left space-y-3.5">
            <h4 className="font-bold text-[10px] text-slate-400 uppercase tracking-widest font-mono flex items-center gap-1">
              <Cpu className="h-3.5 w-3.5 text-[#006a4e]" /> Cryptographic Chain Guidelines
            </h4>
            
            <ul className="text-xs text-slate-500 space-y-2.5 leading-relaxed font-sans font-medium">
              <li className="flex gap-2.5 items-start">
                <FileCheck2 className="h-4.5 w-4.5 text-emerald-500 shrink-0" />
                <span>
                  <strong>Anonymity Enforcement:</strong> Voter credentials or choices cannot be mapped backward from tokens.
                </span>
              </li>
              <li className="flex gap-2.5 items-start">
                <Clock className="h-4.5 w-4.5 text-emerald-500 shrink-0" />
                <span>
                  <strong>Block Auditing:</strong> Chain validators periodically analyze block consistency using SHA-256 links dynamically.
                </span>
              </li>
            </ul>
          </div>

        </div>
      </div>

    </div>
  );
}
