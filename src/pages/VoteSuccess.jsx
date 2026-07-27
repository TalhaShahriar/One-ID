import React, { useState } from 'react';
import { useLocation, useNavigate, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import { 
  CheckCircle2, 
  Copy, 
  Check, 
  Download, 
  ChevronDown, 
  ChevronUp, 
  ArrowRight, 
  ShieldCheck, 
  Lock 
} from 'lucide-react';
import { toast } from 'sonner';

export default function VoteSuccess() {
  const { state } = useLocation();
  const navigate = useNavigate();
  const [copied, setCopied] = useState(false);
  const [accordionOpen, setAccordionOpen] = useState(false);

  // Fallback protection in case of direct URL navigation without state data
  if (!state || !state.receiptToken) {
    return (
      <div className="w-full max-w-md mx-auto px-4 py-16 text-center font-sans space-y-4">
        <div className="mx-auto h-12 w-12 bg-amber-50 text-amber-500 rounded-full border border-amber-200 flex items-center justify-center">
          <ShieldCheck className="h-6 w-6" />
        </div>
        <h3 className="text-lg font-black text-slate-800">No Receipt Session Data</h3>
        <p className="text-xs text-slate-400">
          This receipt successful callback panel requires a secure live cryptographic handshake token state to display results.
        </p>
        <Link 
          to="/elections" 
          className="inline-block text-xs font-bold bg-[#006a4e] text-white px-5 py-2.5 rounded-lg transition"
        >
          View Active Elections
        </Link>
      </div>
    );
  }

  const { 
    receiptToken, 
    qrCodeDataUrl, 
    castAt, 
    electionTitle, 
    candidateName, 
    partyAbbreviation 
  } = state;

  const handleCopyToken = () => {
    navigator.clipboard.writeText(receiptToken);
    setCopied(true);
    toast.success('Monospace Receipt Token copied to clipboard!');
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownloadQR = () => {
    if (!qrCodeDataUrl) return;
    const link = document.createElement('a');
    link.href = qrCodeDataUrl;
    link.download = `votechain-receipt-${receiptToken.slice(0, 8)}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success('QR Code download initiated!');
  };

  return (
    <div className="w-full max-w-2xl mx-auto px-4 py-12 font-sans space-y-8">
      
      {/* 1. SUCCESS CHECKMARK BANNER */}
      <div className="text-center space-y-4">
        <motion.div
          initial={{ scale: 0.6, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: 'spring', stiffness: 200, damping: 15 }}
          className="mx-auto h-20 w-20 bg-emerald-50 text-emerald-600 rounded-full border border-emerald-150 flex items-center justify-center shadow-lg"
        >
          <CheckCircle2 className="h-10 w-10 stroke-[2.5]" />
        </motion.div>

        <div className="space-y-1">
          <h2 className="text-2xl sm:text-3xl font-black text-slate-800 tracking-tight">Your Vote Has Been Recorded</h2>
          <p className="text-sm text-slate-500 font-medium max-w-md mx-auto">
            Blockchain coupled sealed ballot cast successfully in <strong className="text-slate-800 font-bold">{electionTitle}</strong>.
          </p>
        </div>
      </div>

      {/* 2. RECEIPT WRAPPER */}
      <motion.div 
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.15 }}
        className="bg-white border border-slate-200 rounded-3xl p-6 sm:p-8 shadow-sm space-y-6"
      >
        <div className="grid gap-6 md:grid-cols-2 items-center">
          
          {/* QR CODE DISPLAY */}
          <div className="flex flex-col items-center justify-center space-y-3 p-4 bg-slate-50 border border-slate-150/60 rounded-2xl">
            {qrCodeDataUrl ? (
              <img 
                src={qrCodeDataUrl} 
                alt="Verification QR Proof" 
                className="w-40 h-40 border border-slate-200 p-2 bg-white rounded-xl shadow-sm"
                referrerPolicy="no-referrer"
              />
            ) : (
              <div className="w-40 h-40 bg-slate-100 border border-slate-250 flex items-center justify-center rounded-xl font-mono text-[10px] text-slate-400">
                Generating Proof...
              </div>
            )}
            
            <button
              onClick={handleDownloadQR}
              className="text-[11px] font-bold text-[#006a4e] hover:bg-[#006a4e]/10 border border-[#006a4e]/20 bg-[#006a4e]/5 px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition cursor-pointer"
            >
              <Download className="h-3.5 w-3.5" /> Save Verification QR Code
            </button>
          </div>

          {/* SECURE BLOCK SPECIFICATION */}
          <div className="space-y-4">
            <h4 className="font-bold text-xs text-slate-400 uppercase tracking-widest font-mono flex items-center gap-1">
              <Lock className="h-3.5 w-3.5 text-[#006a4e]" /> SEALED RECEIPTS SUMMARY
            </h4>
            
            <div className="space-y-1">
              <span className="text-[10px] text-slate-400 font-bold uppercase tracking-tight">Receipt Key Token:</span>
              <div className="flex items-center gap-1.5 bg-slate-50 rounded-xl px-3 py-2.5 border border-slate-200/80">
                <code className="text-xs font-mono font-bold text-slate-700 truncate block flex-1">
                  {receiptToken}
                </code>
                <button
                  onClick={handleCopyToken}
                  className="text-slate-400 hover:text-slate-700 p-1 rounded-md transition"
                  title="Copy Token to Clipboard"
                >
                  {copied ? <Check className="h-4 w-4 text-emerald-500" /> : <Copy className="h-4 w-4" />}
                </button>
              </div>
            </div>

            <div className="text-xs text-slate-500 space-y-1.5 pl-1 leading-relaxed">
              <div className="flex justify-between">
                <span className="font-medium text-slate-400">Cast Timestamp UTC:</span>
                <span className="font-bold text-slate-700 font-mono">{new Date(castAt).toISOString().replace('T', ' ').slice(0, 19)}</span>
              </div>
              <div className="flex justify-between">
                <span className="font-medium text-slate-400">Sovereign Privacy ID:</span>
                <span className="font-bold text-indigo-600 font-mono">SECRE_BLOCK_VALID</span>
              </div>
            </div>
          </div>

        </div>

        <p className="text-[11px] text-slate-400 text-center leading-relaxed">
          Please save this blockchain cryptographic proof safely. You can use this token or QR receipt inside the public verify network channel to confirm your ballot existence permanently.
        </p>
      </motion.div>

      {/* 3. VERIFY ZK EXPLANATION ACCORDION */}
      <div className="bg-slate-100/60 border border-slate-200 rounded-2xl overflow-hidden shadow-inner">
        <button
          onClick={() => setAccordionOpen(!accordionOpen)}
          className="w-full flex justify-between items-center px-5 py-4 text-left font-bold text-xs uppercase tracking-tight text-slate-700 hover:bg-slate-200/50 transition cursor-pointer"
        >
          <span className="flex items-center gap-2">
            <ShieldCheck className="h-4.5 w-4.5 text-[#006a4e]" /> How do I verify my vote with ballot secrecy?
          </span>
          {accordionOpen ? <ChevronUp className="h-4.5 w-4.5 text-slate-500" /> : <ChevronDown className="h-4.5 w-4.5 text-slate-500" />}
        </button>

        <AnimatePresence>
          {accordionOpen && (
            <motion.div
              initial={{ height: 0 }}
              animate={{ height: 'auto' }}
              exit={{ height: 0 }}
              className="overflow-hidden"
            >
              <div className="p-5 border-t border-slate-200/60 text-xs text-slate-600 space-y-3 leading-relaxed">
                <p>
                  Our advanced blockchain coupling architecture guarantees <strong>Zero-Knowledge Secrecy</strong>:
                </p>
                <ul className="list-disc pl-4 space-y-1.5">
                  <li><strong>Disconnected Ledger Mapping:</strong> Your identity marker is stored purely as a boolean flag <code>has_voted = true</code> in voter status tables, while the actual cast ballot is registered instantly on a disconnected ledger. No relational key hooks link them.</li>
                  <li><strong>Cryptographic Receipt Proof:</strong> The blind token generated acts as a decoupled confirmation proof. Entering it in the verification system displays ONLY the generic ballot existence, type, and block timestamp. No nominee selections are visible.</li>
                  <li><strong>Chained Audit Integrity:</strong> The verification engine proves that your ballot has been successfully ledgered inside the immutable SHA-256 blockchain chain of custody for public validation.</li>
                </ul>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* 4. FOOTER CONTROLS */}
      <div className="flex flex-col sm:flex-row gap-3 justify-center pt-4">
        <button
          onClick={() => navigate('/voter')}
          className="bg-slate-800 hover:bg-slate-900 text-white text-xs font-bold px-6 py-3 rounded-xl transition shadow-sm cursor-pointer"
        >
          Go back to voter panel
        </button>
        <button
          onClick={() => navigate('/elections')}
          className="bg-[#006a4e] hover:bg-[#004e38] text-white text-xs font-bold px-6 py-3 rounded-xl transition flex items-center justify-center gap-1 group shadow-sm cursor-pointer"
        >
          Return to Live Booths <ArrowRight className="h-4 w-4 group-hover:translate-x-0.5 transition-transform" />
        </button>
      </div>

    </div>
  );
}
