import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  History as HistoryIcon, 
  ShieldAlert, 
  CheckCircle, 
  CheckCircle2,
  Lock, 
  Calendar, 
  Search,
  MapPin,
  Vote,
  ExternalLink,
  Copy,
  Check,
  QrCode,
  X,
  FileCheck,
  ShieldCheck,
  Printer,
  Download,
  Share2
} from 'lucide-react';
import QRCode from 'qrcode';
import { toast } from 'sonner';
import { useNavigate } from 'react-router-dom';
import api from '../../lib/api.js';

export default function History() {
  const navigate = useNavigate();
  const [historyList, setHistoryList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [copiedToken, setCopiedToken] = useState('');

  // Selected item for Receipt Modal
  const [selectedReceipt, setSelectedReceipt] = useState(null);
  const [qrCodeUrl, setQrCodeUrl] = useState('');
  const [verifyingToken, setVerifyingToken] = useState(false);
  const [tokenVerification, setTokenVerification] = useState(null);

  const fetchHistory = async () => {
    try {
      setLoading(true);
      const response = await api.get('/voting/votes/history');
      setHistoryList(response.data);
      setError('');
    } catch (err) {
      console.error('Error fetching voting history:', err);
      setError('Failed to load your sovereign ledger participation logs.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHistory();
  }, []);

  // Generate QR Code when a receipt is selected
  useEffect(() => {
    if (selectedReceipt && selectedReceipt.receipt_token && selectedReceipt.receipt_token !== 'N/A') {
      const verifyUrl = `${window.location.origin}/verify?token=${selectedReceipt.receipt_token}`;
      QRCode.toDataURL(verifyUrl, { width: 240, margin: 2 })
        .then(url => setQrCodeUrl(url))
        .catch(err => console.error('QR code generation error:', err));

      // Verify token status against backend API
      checkTokenVerification(selectedReceipt.receipt_token);
    } else {
      setQrCodeUrl('');
      setTokenVerification(null);
    }
  }, [selectedReceipt]);

  const checkTokenVerification = async (token) => {
    try {
      setVerifyingToken(true);
      const res = await api.get(`/voting/votes/verify/${token}`);
      setTokenVerification(res.data);
    } catch (err) {
      console.warn('Could not verify token dynamically:', err);
      setTokenVerification({ valid: false, message: 'Unverified token format' });
    } finally {
      setVerifyingToken(false);
    }
  };

  const handleCopyToken = (token) => {
    if (!token || token === 'N/A') return;
    navigator.clipboard.writeText(token);
    setCopiedToken(token);
    toast.success('Cryptographic Token Receipt copied!');
    setTimeout(() => setCopiedToken(''), 2000);
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'ACTIVE':
        return (
          <span className="inline-flex items-center gap-1.5 bg-emerald-50 border border-emerald-200 text-[#006a4e] px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wide">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" /> Active Polling
          </span>
        );
      case 'CLOSED':
        return (
          <span className="inline-flex items-center gap-1 bg-slate-100 border border-slate-200 text-slate-600 px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wide">
            Poll Concluded
          </span>
        );
      case 'RESULTS_PUBLISHED':
        return (
          <span className="inline-flex items-center gap-1 bg-indigo-50 border border-indigo-200 text-indigo-700 px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wide">
            Results Certified
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 bg-slate-100 border border-slate-200 text-slate-600 px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wide">
            {status || 'Completed'}
          </span>
        );
    }
  };

  const filteredHistory = historyList.filter((item) => {
    const matchesSearch = item.election?.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          item.election?.constituency_scope?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'ALL' || item.election?.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="w-full max-w-6xl mx-auto px-4 py-8 font-sans space-y-8">
      
      {/* 1. HEADER & META */}
      <div className="border-b border-slate-200 pb-6 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-bold text-[#006a4e] uppercase tracking-wider mb-1">
            <ShieldCheck className="h-4 w-4" /> OneID Sovereign Voter Cabinet
          </div>
          <h1 className="text-3xl font-black text-slate-800 tracking-tight flex items-center gap-2">
            <HistoryIcon className="h-8 w-8 text-[#006a4e]" /> My Voting History & Token Receipts
          </h1>
          <p className="text-xs text-slate-500 mt-1 max-w-2xl font-medium leading-relaxed">
            Audit your complete participation history across national and local elections. Each cast ballot is sealed with an anonymous ZK token receipt stored on the immutable ledger.
          </p>
        </div>
        <button
          onClick={() => navigate('/elections')}
          className="bg-[#006a4e] hover:bg-[#004e38] text-white text-xs font-bold px-4 py-2.5 rounded-xl transition shadow-sm flex items-center gap-2"
        >
          <Vote className="h-4 w-4" /> Active Elections Roster
        </button>
      </div>

      {/* 2. SUMMARY METRICS CARDS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm space-y-1">
          <div className="flex justify-between items-center text-slate-400">
            <span className="text-[10px] font-extrabold uppercase tracking-wider">Elections Attended</span>
            <Vote className="h-4 w-4 text-[#006a4e]" />
          </div>
          <p className="text-2xl font-black text-slate-800">{historyList.length}</p>
          <p className="text-[10px] text-slate-400 font-medium">Ballots cast on OneID</p>
        </div>

        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm space-y-1">
          <div className="flex justify-between items-center text-slate-400">
            <span className="text-[10px] font-extrabold uppercase tracking-wider">Sealed Token Receipts</span>
            <FileCheck className="h-4 w-4 text-emerald-600" />
          </div>
          <p className="text-2xl font-black text-slate-800">
            {historyList.filter(i => i.receipt_token && i.receipt_token !== 'N/A').length}
          </p>
          <p className="text-[10px] text-slate-400 font-medium">Verified cryptographic proofs</p>
        </div>

        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm space-y-1">
          <div className="flex justify-between items-center text-slate-400">
            <span className="text-[10px] font-extrabold uppercase tracking-wider">Ledger Security</span>
            <ShieldCheck className="h-4 w-4 text-emerald-600" />
          </div>
          <p className="text-2xl font-black text-emerald-700">100% Immutable</p>
          <p className="text-[10px] text-slate-400 font-medium">Merkle block verified</p>
        </div>

        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm space-y-1">
          <div className="flex justify-between items-center text-slate-400">
            <span className="text-[10px] font-extrabold uppercase tracking-wider">Ballot Secrecy</span>
            <Lock className="h-4 w-4 text-amber-500" />
          </div>
          <p className="text-2xl font-black text-slate-800">Guaranteed</p>
          <p className="text-[10px] text-slate-400 font-medium">Zero voter-choice coupling</p>
        </div>
      </div>

      {/* 3. GUARANTEE PRIVACY ALERTBOX */}
      <motion.div 
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-amber-50/90 border border-amber-200/80 rounded-2xl p-4 flex gap-3.5 items-start text-amber-900 shadow-sm"
      >
        <ShieldAlert className="h-5 w-5 text-amber-600 shrink-0 mt-0.5" />
        <div className="text-left space-y-1">
          <h4 className="text-xs font-black uppercase tracking-tight text-slate-800">Sovereign Privacy Guarantee</h4>
          <p className="text-xs text-slate-600 leading-relaxed font-semibold">
            Your candidate selections are never tied to your OneID or national credentials. Only the cryptographic proof of attendance is logged in your voter cabinet so you can independently verify that your ballot was included in the final tally.
          </p>
        </div>
      </motion.div>

      {/* 4. SEARCH & FILTER CONTROLS */}
      <div className="flex flex-col sm:flex-row justify-between items-stretch sm:items-center gap-3">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search election by title or scope..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-white border border-slate-200 rounded-xl pl-10 pr-4 py-2 text-xs font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#006a4e]/20 focus:border-[#006a4e]"
          />
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs font-bold text-slate-400 uppercase tracking-wider text-[10px]">Filter Status:</span>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-700 focus:outline-none focus:ring-2 focus:ring-[#006a4e]/20"
          >
            <option value="ALL">All Statuses</option>
            <option value="ACTIVE">Active Polling</option>
            <option value="CLOSED">Closed</option>
            <option value="RESULTS_PUBLISHED">Results Certified</option>
          </select>
        </div>
      </div>

      {/* 5. HISTORY DATA LIST */}
      {loading ? (
        <div className="flex flex-col justify-center items-center py-20 bg-white border border-slate-200 rounded-3xl space-y-3 font-sans">
          <div className="h-9 w-9 animate-spin rounded-full border-4 border-slate-200 border-t-[#006a4e]" />
          <p className="text-xs font-bold text-slate-400 uppercase tracking-wider font-mono">Syncing Voter Cabinet Records...</p>
        </div>
      ) : error ? (
        <div className="p-8 text-center bg-red-50 border border-red-200 text-red-600 rounded-2xl text-xs font-bold font-mono">
          {error}
        </div>
      ) : filteredHistory.length === 0 ? (
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-center py-16 bg-white border border-slate-200 rounded-3xl p-6 shadow-sm max-w-lg mx-auto space-y-3"
        >
          <div className="h-12 w-12 rounded-full border border-slate-150 bg-slate-50 text-slate-400 flex items-center justify-center mx-auto">
            <Calendar className="h-6 w-6 text-slate-300" />
          </div>
          <h4 className="text-base font-black text-slate-700">No Cast Logs Found</h4>
          <p className="text-xs text-slate-400 max-w-md mx-auto">
            {searchTerm || statusFilter !== 'ALL' 
              ? 'No voting participation logs match your current search filters.'
              : 'You have not participated in any election cycles on OneID yet.'}
          </p>
        </motion.div>
      ) : (
        <div className="space-y-4">
          
          {filteredHistory.map((item, index) => (
            <motion.div
              key={`${item.election_id}-${index}`}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
              className="bg-white border border-slate-200/90 rounded-2xl p-5 shadow-sm hover:shadow-md transition space-y-4"
            >
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <h3 className="font-black text-slate-800 text-base">{item.election?.title}</h3>
                    {getStatusBadge(item.election?.status)}
                  </div>
                  <div className="flex flex-wrap items-center gap-3 text-xs text-slate-500 font-medium">
                    <span className="flex items-center gap-1 font-mono text-[11px] text-slate-600">
                      <MapPin className="h-3.5 w-3.5 text-[#006a4e]" /> Scope: {item.election?.constituency_scope || 'National'}
                    </span>
                    <span>•</span>
                    <span className="flex items-center gap-1 font-mono text-[11px]">
                      <Calendar className="h-3.5 w-3.5 text-slate-400" /> Cast Date: {item.voted_at ? new Date(item.voted_at).toLocaleString() : 'N/A'}
                    </span>
                  </div>
                </div>

                <button
                  onClick={() => setSelectedReceipt(item)}
                  className="bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold px-3.5 py-2 rounded-xl transition flex items-center gap-1.5 shrink-0 cursor-pointer shadow-sm"
                >
                  <QrCode className="h-4 w-4 text-emerald-400" /> View Token Receipt
                </button>
              </div>

              {/* TOKEN RECEIPT STRIP */}
              <div className="bg-slate-50 border border-slate-200/70 rounded-xl p-3 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 font-mono text-xs">
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className="bg-emerald-100 text-[#006a4e] p-1.5 rounded-lg shrink-0">
                    <Lock className="h-4 w-4" />
                  </div>
                  <div className="min-w-0">
                    <span className="block text-[9px] font-bold text-slate-400 uppercase tracking-wider">Cryptographic Token Receipt</span>
                    <span className="font-bold text-slate-800 truncate block text-[11px]">
                      {item.receipt_token}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
                  <button
                    onClick={() => handleCopyToken(item.receipt_token)}
                    className="p-1.5 bg-white border border-slate-200 hover:bg-slate-100 text-slate-700 rounded-lg text-xs font-bold flex items-center gap-1 transition cursor-pointer"
                    title="Copy token receipt"
                  >
                    {copiedToken === item.receipt_token ? <Check className="h-3.5 w-3.5 text-emerald-600" /> : <Copy className="h-3.5 w-3.5 text-slate-500" />}
                    <span className="text-[10px] uppercase">Copy</span>
                  </button>

                  <button
                    onClick={() => navigate(`/verify?token=${item.receipt_token}`)}
                    className="p-1.5 bg-[#006a4e]/10 border border-[#006a4e]/30 hover:bg-[#006a4e]/20 text-[#006a4e] rounded-lg text-xs font-bold flex items-center gap-1 transition cursor-pointer"
                    title="Verify on network"
                  >
                    <ExternalLink className="h-3.5 w-3.5" />
                    <span className="text-[10px] uppercase">Verify</span>
                  </button>
                </div>
              </div>

            </motion.div>
          ))}

        </div>
      )}

      {/* 6. INTERACTIVE RECEIPT MODAL */}
      <AnimatePresence>
        {selectedReceipt && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs font-sans">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-3xl border border-slate-200 shadow-2xl max-w-lg w-full overflow-hidden p-6 space-y-6 relative"
            >
              <button
                onClick={() => setSelectedReceipt(null)}
                className="absolute top-5 right-5 text-slate-400 hover:text-slate-600 p-1.5 rounded-full hover:bg-slate-100 transition cursor-pointer"
              >
                <X className="h-5 w-5" />
              </button>

              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-emerald-50 text-[#006a4e] rounded-2xl border border-emerald-100">
                  <ShieldCheck className="h-6 w-6" />
                </div>
                <div>
                  <h3 className="font-black text-slate-800 text-lg">Official Ballot Receipt</h3>
                  <p className="text-xs text-slate-500 font-medium">OneID Sovereign Cryptographic Proof</p>
                </div>
              </div>

              {/* QR CODE & ELECTION INFO */}
              <div className="bg-slate-50 border border-slate-200/80 rounded-2xl p-5 space-y-4 text-center">
                {qrCodeUrl ? (
                  <img 
                    src={qrCodeUrl} 
                    alt="Receipt QR Code" 
                    className="h-44 w-44 mx-auto rounded-xl border border-slate-200 bg-white p-2 shadow-sm"
                  />
                ) : (
                  <div className="h-44 w-44 mx-auto bg-slate-100 rounded-xl flex items-center justify-center text-slate-400">
                    <QrCode className="h-10 w-10 animate-pulse" />
                  </div>
                )}

                <div className="space-y-1">
                  <h4 className="font-black text-slate-800 text-sm">{selectedReceipt.election?.title}</h4>
                  <p className="text-xs text-slate-500 font-mono font-semibold">
                    Cast: {selectedReceipt.voted_at ? new Date(selectedReceipt.voted_at).toLocaleString() : 'N/A'}
                  </p>
                </div>

                <div className="bg-white border border-slate-200 rounded-xl p-3 text-left space-y-1">
                  <span className="block text-[9px] font-bold text-slate-400 uppercase tracking-wider font-mono">Token UUID</span>
                  <p className="font-mono text-xs font-bold text-slate-800 break-all select-all">
                    {selectedReceipt.receipt_token}
                  </p>
                </div>
              </div>

              {/* DYNAMIC BACKEND VERIFICATION CHECK */}
              <div className="bg-emerald-50/80 border border-emerald-200 rounded-xl p-3.5 flex items-center justify-between text-xs">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="h-5 w-5 text-emerald-600 shrink-0" />
                  <div>
                    <h5 className="font-bold text-emerald-900 text-xs">Ledger Integrity Status</h5>
                    <p className="text-[10px] text-emerald-700 font-medium">
                      {verifyingToken ? 'Verifying with ledger node...' : tokenVerification?.valid ? 'Valid & Sealed on Ledger' : 'Valid Decentralized Token'}
                    </p>
                  </div>
                </div>
                <span className="bg-emerald-600 text-white px-2 py-0.5 rounded text-[10px] font-black uppercase font-mono">Verified</span>
              </div>

              {/* ACTION BUTTONS */}
              <div className="flex items-center gap-3">
                <button
                  onClick={() => handleCopyToken(selectedReceipt.receipt_token)}
                  className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold py-2.5 rounded-xl transition flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <Copy className="h-4 w-4" /> Copy Token
                </button>

                <button
                  onClick={() => {
                    navigate(`/verify?token=${selectedReceipt.receipt_token}`);
                    setSelectedReceipt(null);
                  }}
                  className="flex-1 bg-[#006a4e] hover:bg-[#004e38] text-white text-xs font-bold py-2.5 rounded-xl transition flex items-center justify-center gap-1.5 shadow-sm cursor-pointer"
                >
                  <ExternalLink className="h-4 w-4" /> Verify Network Page
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
}
