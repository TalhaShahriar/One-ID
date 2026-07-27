import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  ShieldAlert, 
  CheckCircle, 
  AlertTriangle, 
  RefreshCw, 
  Clock, 
  Database, 
  Link as LinkIcon, 
  Server, 
  Play, 
  Zap,
  Volume2,
  Lock,
  X,
  Search,
  Eye,
  EyeOff,
  ChevronDown,
  ChevronUp,
  Layers,
  Activity,
  Shield,
  FileText
} from 'lucide-react';
import { toast } from 'sonner';
import api from '../../lib/api.js';
import { useSocket } from '../../hooks/useSocket.js';

const SECTOR_METADATA = {
  VOTE: {
    label: 'Election Ballots',
    desc: 'Anonymous cryptographic voter ballot receipts',
    color: 'border-emerald-800 bg-emerald-950/20 text-emerald-400',
    icon: '🗳️',
    colorHex: '#10b981'
  },
  TAX: {
    label: 'eVat & Revenue',
    desc: 'Citizen tax returns & payment receipts',
    color: 'border-blue-800 bg-blue-950/20 text-blue-400',
    icon: '৳',
    colorHex: '#3b82f6'
  },
  VEHICLE: {
    label: 'BRTA Vehicles',
    desc: 'Automotive registrations and driving licenses',
    color: 'border-rose-800 bg-rose-950/20 text-rose-400',
    icon: '🚗',
    colorHex: '#f43f5e'
  },
  PROPERTY: {
    label: 'Land Registry',
    desc: 'Sovereign land mutations and title deeds',
    color: 'border-teal-800 bg-teal-950/20 text-teal-400',
    icon: '🏡',
    colorHex: '#0d9488'
  },
  CIVIL_REGISTRY: {
    label: 'Civil Registry',
    desc: 'Births, marriages, and arbitration files',
    color: 'border-amber-800 bg-amber-950/20 text-amber-400',
    icon: '📜',
    colorHex: '#d97706'
  }
};

export default function BlockchainStatus() {
  const { socket, isConnected } = useSocket();
  const [electionsStatus, setElectionsStatus] = useState([]);
  const [loading, setLoading] = useState(true);
  const [verifyingId, setVerifyingId] = useState(null);
  
  // Toggle states for visual hashes card detail
  const [openDetailId, setOpenDetailId] = useState(null);

  // Severe Tamper Lockdown Alert state
  const [tamperLockdown, setTamperLockdown] = useState(null);

  // Active sub-tab: 'elections' (legacy) or 'explorer' (new 5-sector)
  const [activeTab, setActiveTab] = useState('elections');

  // 5-Sector Explorer State
  const [ledgerStats, setLedgerStats] = useState(null);
  const [ledgerRecords, setLedgerRecords] = useState([]);
  const [explorerSector, setExplorerSector] = useState('ALL');
  const [explorerSearch, setExplorerSearch] = useState('');
  const [explorerLoading, setExplorerLoading] = useState(false);
  const [expandedRecordId, setExpandedRecordId] = useState(null);

  // Verification state for individual sectors
  const [verifyingSector, setVerifyingSector] = useState(null);
  const [sectorAuditReports, setSectorAuditReports] = useState({});

  const fetchBlockchainStatus = async () => {
    setLoading(true);
    try {
      const res = await api.get('/audit/blockchain/status');
      // res.data: { elections: [{ electionId, title, lastVerified, valid, totalVotes, brokenAt, recentVotes }] }
      setElectionsStatus(res.data?.elections || []);
    } catch (err) {
      console.error('Error fetching blockchain health indices:', err);
      toast.error('Could not load secure blockchain integrity metrics.');
    } finally {
      setLoading(false);
    }
  };

  const fetchLedgerStats = async () => {
    try {
      const res = await api.get('/ledger/stats');
      setLedgerStats(res.data);
    } catch (err) {
      console.error('Error fetching ledger stats:', err);
    }
  };

  const fetchLedgerRecords = async (sectorFilter = 'ALL') => {
    setExplorerLoading(true);
    try {
      let url = '/ledger/records?limit=100';
      if (sectorFilter && sectorFilter !== 'ALL') {
        url += `&sector=${sectorFilter}`;
      }
      const res = await api.get(url);
      setLedgerRecords(res.data?.records || []);
    } catch (err) {
      console.error('Error fetching ledger records:', err);
      toast.error('Failed to load ledger records stream.');
    } finally {
      setExplorerLoading(false);
    }
  };

  const verifySectorChain = async (sectorName) => {
    setVerifyingSector(sectorName);
    try {
      toast.info(`Initiating cryptographic bottom-up audit on sector "${sectorName}"...`);
      const res = await api.get(`/ledger/verify/${sectorName}`);
      
      setSectorAuditReports(prev => ({
        ...prev,
        [sectorName]: res.data
      }));

      if (res.data?.valid) {
        toast.success(`Integrity verified intact for ${sectorName}!`, {
          description: 'Sovereign ledger hash-pointer checks matches successfully.'
        });
      } else {
        toast.error(`🚨 TAMPERING FLAGGED in ${sectorName}! Chain broken at seq #${res.data?.brokenAt}`);
      }
    } catch (err) {
      console.error('Error verifying sector chain:', err);
      toast.error(`Audit handshake failed for sector "${sectorName}".`);
    } finally {
      setVerifyingSector(null);
    }
  };

  useEffect(() => {
    fetchBlockchainStatus();
  }, []);

  useEffect(() => {
    if (activeTab === 'explorer') {
      fetchLedgerStats();
      fetchLedgerRecords(explorerSector);
    }
  }, [activeTab, explorerSector]);

  const renderRecordSummary = (r) => {
    const p = r.payload;
    if (!p) return null;

    switch (r.sector) {
      case 'PROPERTY':
        if (p.action === 'TRANSFER') {
          return (
            <div className="bg-teal-950/20 border border-teal-900/40 rounded-xl p-3 text-xs text-teal-200 font-sans mt-2">
              <strong>🏡 Land Title Mutation Transfer:</strong> Transferring property holding <code>{p.propertyId}</code> from owner <code>{p.sellerOneId}</code> to buyer <code>{p.buyerOneId}</code> for <strong>৳{p.price?.toLocaleString()} BDT</strong>. Legal mutation approved.
            </div>
          );
        }
        return (
          <div className="bg-teal-950/20 border border-teal-900/40 rounded-xl p-3 text-xs text-teal-200 font-sans mt-2">
            <strong>🏡 Property Initial Registry:</strong> Registered property plot <code>{p.propertyId}</code> under owner NID <code>{p.ownerOneId}</code>. Value: <strong>৳{p.value?.toLocaleString()} BDT</strong>.
          </div>
        );
      case 'TAX':
        return (
          <div className="bg-blue-950/20 border border-blue-900/40 rounded-xl p-3 text-xs text-blue-200 font-sans mt-2">
            <strong>৳ eVat Tax Filing:</strong> Submitted tax return for Year <strong>{p.taxYear}</strong> by TIN <code>{p.tin}</code>. Gross Income declared: <strong>৳{p.grossIncome?.toLocaleString()}</strong>, Calculated Tax: <strong>৳{p.calculatedTax?.toLocaleString()}</strong>. Payment Status: <span className="underline uppercase font-bold">{p.paymentStatus}</span>.
          </div>
        );
      case 'VEHICLE':
        if (p.action === 'TRANSFER') {
          return (
            <div className="bg-rose-950/20 border border-rose-900/40 rounded-xl p-3 text-xs text-rose-200 font-sans mt-2">
              <strong>🚗 BRTA Vehicle Transfer:</strong> Transferred vehicle <code>{p.registrationNo}</code> (Engine: <code>{p.engineNo}</code>) to new owner <code>{p.toOwnerOneId}</code>. Mutation sealed in transit ledger.
            </div>
          );
        }
        return (
          <div className="bg-rose-950/20 border border-rose-900/40 rounded-xl p-3 text-xs text-rose-200 font-sans mt-2">
            <strong>🚗 BRTA Vehicle Registry:</strong> Registered <code>{p.make} {p.model} ({p.year})</code> under owner <code>{p.currentOwnerOneId}</code>. Registration number assigned: <code>{p.registrationNo}</code>.
          </div>
        );
      case 'CIVIL_REGISTRY':
        if (p.recordType === 'MARRIAGE') {
          return (
            <div className="bg-amber-950/20 border border-amber-900/40 rounded-xl p-3 text-xs text-amber-200 font-sans mt-2">
              <strong>📜 Marriage Certificate Registry:</strong> Registered wedding solemnized by Kazi ID <code>{p.kaziId}</code>. Groom OneID: <code>{p.groomOneId}</code>, Bride OneID: <code>{p.brideOneId}</code>. Registry footprint verified.
            </div>
          );
        }
        if (p.recordType === 'ARBITRATION') {
          return (
            <div className="bg-amber-950/20 border border-amber-900/40 rounded-xl p-3 text-xs text-amber-200 font-sans mt-2">
              <strong>⚖️ Civil Union Arbitration:</strong> Logged official resolution file <code>#{p.arbitrationId}</code> by Union Parishad Chairman. Case status: <span className="underline uppercase font-bold">{p.status}</span>.
            </div>
          );
        }
        return (
          <div className="bg-amber-950/20 border border-amber-900/40 rounded-xl p-3 text-xs text-amber-200 font-sans mt-2">
            <strong>📜 Civil Registry Mutation:</strong> Logged citizen legal status update. Record Type: <code>{p.recordType || 'REGISTRY'}</code>.
          </div>
        );
      case 'VOTE':
        return (
          <div className="bg-emerald-950/20 border border-emerald-900/40 rounded-xl p-3 text-xs text-emerald-200 font-sans mt-2">
            <strong>🗳️ Anonymous Voting Receipt:</strong> Casted vote in Election <code>#{p.electionId}</code> for Candidate ID <code>{p.candidateId}</code> inside Constituency: <code>{p.constituency}</code>. Protected by zero-knowledge signature masking.
          </div>
        );
      default:
        return (
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-3 text-xs text-slate-300 font-sans mt-2">
            <strong>📦 General Ledger Mutation block:</strong> Action logged on sector <code>{r.sector}</code>.
          </div>
        );
    }
  };

  const playTamperTone = () => {
    try {
      const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
      const runAlarm = (freq, delay, dur = 0.6) => {
        const osc = audioCtx.createOscillator();
        const gainNode = audioCtx.createGain();
        
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(freq, audioCtx.currentTime);
        gainNode.gain.setValueAtTime(0.2, audioCtx.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.005, audioCtx.currentTime + dur);
        
        osc.connect(gainNode);
        gainNode.connect(audioCtx.destination);
        osc.start(audioCtx.currentTime + delay);
        osc.stop(audioCtx.currentTime + delay + dur);
      };

      // Intrusion siren cycle
      runAlarm(987.77, 0, 0.4);  // B5
      runAlarm(523.25, 0.2, 0.4); // C5
      runAlarm(987.77, 0.4, 0.4); // B5
      runAlarm(523.25, 0.6, 0.4); // C5
    } catch (e) {
      console.warn('Web Audio Context blocked/unsupported:', e);
    }
  };

  // Socket listener for dynamic tamper events
  useEffect(() => {
    if (!socket) return;

    const handleWebsocketTamper = (payload) => {
      // payload: { electionId, title, brokenAt, severity }
      setTamperLockdown(payload);
      playTamperTone();

      // Ensure local state is updated to TAMPERED instantly
      setElectionsStatus(prev => prev.map(el => {
        if (el.electionId === payload.electionId) {
          return {
            ...el,
            valid: false,
            brokenAt: payload.brokenAt,
            lastVerified: new Date().toISOString()
          };
        }
        return el;
      }));
    };

    socket.on('blockchain:tamper_detected', handleWebsocketTamper);

    return () => {
      socket.off('blockchain:tamper_detected', handleWebsocketTamper);
    };
  }, [socket]);

  // Handle immediate manual trace execution
  const handleVerifyNow = async (id, title) => {
    setVerifyingId(id);
    try {
      toast.info(`Auditing entire cryptographic voteledger chain for "${title}"...`);
      const res = await api.post(`/audit/blockchain/verify-now/${id}`);
      
      const updatedData = res.data; // { valid, totalVotes, brokenAt, lastChecked, recentVotes }

      setElectionsStatus(prev => prev.map(el => {
        if (el.electionId === id) {
          return {
            ...el,
            valid: updatedData.valid,
            totalVotes: updatedData.totalVotes,
            brokenAt: updatedData.brokenAt,
            lastVerified: updatedData.lastChecked || new Date().toISOString(),
            recentVotes: updatedData.recentVotes || el.recentVotes
          };
        }
        return el;
      }));

      if (updatedData.valid) {
        toast.success(`Success! Blockchain chain verified to be INTACT for: ${title}`);
      } else {
        toast.error(`🚨 EXCEPTION: Tampering detected! Chain broken at vote index ${updatedData.brokenAt}`);
      }
    } catch (err) {
      console.error('Core verify fault:', err);
      toast.error('Unable to finalize cryptographic check handshake.');
    } finally {
      setVerifyingId(null);
    }
  };

  // Helper: return a human relative time message
  const getRelativeTime = (isoString) => {
    if (!isoString || isoString.includes('Never')) return 'Audit has not run yet';
    const parsed = new Date(isoString);
    if (isNaN(parsed.getTime())) return isoString;
    const seconds = Math.floor((new Date() - parsed) / 1000);
    
    if (seconds < 10) return 'seconds ago';
    if (seconds < 60) return `${seconds}s ago`;
    const mins = Math.floor(seconds / 60);
    if (mins < 60) return `${mins}m ago`;
    const hours = Math.floor(mins / 60);
    return `${hours}h ago`;
  };

  // Calculations for high-visibility stats summary
  const totalElections = electionsStatus.length;
  const intactCount = electionsStatus.filter(e => e.valid).length;
  const tamperCount = electionsStatus.filter(e => !e.valid).length;

  const getMaxVerifiedTime = () => {
    const times = electionsStatus
      .map(e => e.lastVerified)
      .filter(t => t && !t.includes('Never'))
      .map(t => new Date(t).getTime());
    
    if (times.length === 0) return 'Never';
    return new Date(Math.max(...times)).toLocaleTimeString();
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 py-8 px-4 sm:px-6 lg:px-8 font-sans transition-all duration-500 relative">
      
      {/* EXTREME ALARM TAMPER OVERLAY */}
      <AnimatePresence>
        {tamperLockdown && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-red-950/95 backdrop-blur-xl z-50 flex flex-col justify-center items-center p-6 text-center"
          >
            <motion.div
              animate={{ 
                scale: [1, 1.05, 1],
                borderColor: ['#ef4444', '#7f1d1d', '#ef4444']
              }}
              transition={{ repeat: Infinity, duration: 1.5 }}
              className="max-w-2xl bg-black border-4 border-red-600 rounded-3xl p-8 space-y-6 shadow-2xl relative"
            >
              <button 
                onClick={() => setTamperLockdown(null)}
                className="absolute top-4 right-4 bg-red-900/40 hover:bg-red-800 text-red-100 p-1.5 rounded-full transition"
              >
                <X className="h-5 w-5" />
              </button>

              <div className="h-20 w-20 bg-red-900/40 border-2 border-red-500 rounded-full flex items-center justify-center mx-auto text-red-500 shadow-lg shadow-red-500/20">
                <ShieldAlert className="h-10 w-10 animate-pulse" />
              </div>

              <div className="space-y-2">
                <span className="text-[10px] bg-red-600 text-white font-black px-3 py-1 rounded-full uppercase tracking-widest font-mono">
                  CRITICAL THREAT TRIGGERED
                </span>
                <h2 className="text-3xl font-black tracking-tight text-white uppercase leading-tight font-mono">
                  LEDGER TAMPERING DETECTED
                </h2>
              </div>

              <div className="bg-red-950/40 border border-red-900/60 rounded-2xl p-4 text-xs space-y-1.5 font-bold font-mono text-red-200 text-left">
                <div className="flex justify-between border-b border-red-900/40 pb-1.5">
                  <span>Election Unit:</span>
                  <span className="text-white">{tamperLockdown.title}</span>
                </div>
                <div className="flex justify-between border-b border-red-900/40 py-1.5">
                  <span>Corruption Index:</span>
                  <span className="text-white">Vote block #{tamperLockdown.brokenAt}</span>
                </div>
                <div className="flex justify-between pt-1.5">
                  <span>Compromised Block ID:</span>
                  <span className="text-red-400 select-all truncate max-w-[200px]">{tamperLockdown.voteId || 'N/A'}</span>
                </div>
              </div>

              <p className="text-sm text-slate-300 font-medium">
                The cryptographic ledger chain has detected an unauthenticated state manipulation attempt. Hot audits have flagged this node. System administrators have been emailed immediate intrusion telemetry.
              </p>

              <div className="flex gap-3 justify-center">
                <button
                  onClick={() => {
                    setTamperLockdown(null);
                    fetchBlockchainStatus();
                  }}
                  className="flex items-center gap-1.5 px-5 py-2.5 bg-red-700 hover:bg-red-600 text-white font-bold text-xs uppercase font-mono tracking-wider rounded-xl transition cursor-pointer"
                >
                  <RefreshCw className="h-3.5 w-3.5 animate-spin" /> Fetch Active status
                </button>
                <button
                  onClick={playTamperTone}
                  className="flex items-center gap-1.5 px-5 py-2.5 bg-slate-900 border border-red-700/50 hover:bg-slate-850 text-red-400 font-bold text-xs uppercase font-mono rounded-xl transition cursor-pointer"
                >
                  <Volume2 className="h-3.5 w-3.5" /> Force Alarm Ring
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <div id="blockchain-audit-canvas" className="max-w-7xl mx-auto space-y-8">
        
        {/* Header Block */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 border-b border-slate-850 pb-6">
          <div>
            <div className="flex items-center gap-2 text-xs font-black uppercase text-[#006a4e] font-mono tracking-widest mb-1">
              <span className="h-2 w-2 rounded-full bg-green-500 animate-pulse" />
              OneID cryptographic ledger watchdog active
            </div>
            <h1 className="text-3xl font-black tracking-tight text-white flex items-center gap-2">
              <Database className="h-8 w-8 text-[#006a4e]" />
              Cryptographic Trust Center
            </h1>
            <p className="text-sm text-slate-400 font-medium mt-1">
              Live mathematical proof validation across all 5 key governance sectors of Bangladesh.
            </p>
          </div>

          <div className="flex gap-2 shrink-0">
            <button
              onClick={() => {
                if (activeTab === 'elections') {
                  fetchBlockchainStatus();
                } else {
                  fetchLedgerStats();
                  fetchLedgerRecords(explorerSector);
                }
                toast.success('Blockchain ledger state refreshed.');
              }}
              className="flex items-center gap-2 px-4 py-2.5 bg-slate-900 border border-slate-800 text-slate-300 font-bold text-xs font-mono uppercase rounded-xl hover:bg-slate-800/60 hover:text-white transition cursor-pointer"
            >
              <RefreshCw className="h-4 w-4" /> Reset audit trail
            </button>
            <a
              href="/blockchain-visualizer"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 px-4 py-2.5 bg-emerald-950/40 border border-[#006a4e]/40 text-emerald-400 font-bold text-xs font-mono uppercase rounded-xl hover:bg-[#006a4e]/20 hover:text-white transition"
            >
              <Eye className="h-4 w-4" /> Public Visualizer ↗
            </a>
          </div>
        </div>

        {/* Tab switcher */}
        <div className="flex border-b border-slate-850 gap-1 overflow-x-auto pb-px">
          <button
            onClick={() => setActiveTab('elections')}
            className={`flex items-center gap-2 px-5 py-3 text-sm font-bold border-b-2 transition-all cursor-pointer whitespace-nowrap ${
              activeTab === 'elections'
                ? 'border-[#006a4e] text-white bg-[#006a4e]/10'
                : 'border-transparent text-slate-400 hover:text-slate-250 hover:bg-slate-900/30'
            }`}
          >
            <Zap className={`h-4 w-4 ${activeTab === 'elections' ? 'text-green-400' : 'text-slate-400'}`} />
            Voter Ballot Watchdog
          </button>
          <button
            onClick={() => setActiveTab('explorer')}
            className={`flex items-center gap-2 px-5 py-3 text-sm font-bold border-b-2 transition-all cursor-pointer whitespace-nowrap ${
              activeTab === 'explorer'
                ? 'border-[#006a4e] text-white bg-[#006a4e]/10'
                : 'border-transparent text-slate-400 hover:text-slate-250 hover:bg-slate-900/30'
            }`}
          >
            <Layers className={`h-4 w-4 ${activeTab === 'explorer' ? 'text-[#006a4e]' : 'text-slate-400'}`} />
            5-Sector Unified Ledger Explorer
          </button>
        </div>

        {activeTab === 'elections' ? (
          <>
            {/* Dynamic Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="bg-slate-900/60 border border-slate-850 rounded-2xl p-5 relative overflow-hidden backdrop-blur-md">
                <div className="text-[10px] font-black uppercase text-slate-500 font-mono tracking-wider">Monitored Electorates</div>
                <div className="text-3xl font-black font-mono text-white mt-1.5">{loading ? '...' : totalElections}</div>
                <p className="text-[10px] text-slate-550 font-semibold mt-1">Sovereign active election cycles</p>
              </div>

              <div className="bg-emerald-950/20 border border-emerald-900/40 rounded-2xl p-5 relative overflow-hidden backdrop-blur-md">
                <div className="text-[10px] font-black uppercase text-emerald-400 font-mono tracking-wider">Chains Intact</div>
                <div className="text-3xl font-black font-mono text-emerald-400 mt-1.5 flex items-center gap-1.5">
                  {loading ? '...' : intactCount}
                  <CheckCircle className="h-6 w-6 text-emerald-400 shrink-0" />
                </div>
                <p className="text-[10px] text-emerald-550 font-semibold mt-1">100% mathematical guarantee</p>
              </div>

              <div className="bg-red-950/20 border border-red-900/40 rounded-2xl p-5 relative overflow-hidden backdrop-blur-md">
                <div className="text-[10px] font-black uppercase text-red-400 font-mono tracking-wider">Tampers Detected</div>
                <div className="text-3xl font-black font-mono text-red-500 mt-1.5 flex items-center gap-1.5">
                  {loading ? '...' : tamperCount}
                  {tamperCount > 0 && <ShieldAlert className="h-6 w-6 text-red-500 animate-ping" />}
                </div>
                <p className="text-[10px] text-red-550 font-semibold mt-1">Active cryptographic failures</p>
              </div>

              <div className="bg-slate-900/60 border border-slate-850 rounded-2xl p-5 relative overflow-hidden backdrop-blur-md">
                <div className="text-[10px] font-black uppercase text-slate-500 font-mono tracking-wider">Last General Audit</div>
                <div className="text-lg font-black font-mono text-slate-300 mt-2">{loading ? '...' : getMaxVerifiedTime()}</div>
                <p className="text-[10px] text-slate-550 font-semibold mt-1.5 font-mono">Automated scheduler hourly run</p>
              </div>
            </div>

            {/* Dynamic Elections List */}
            {loading ? (
              <div className="flex flex-col justify-center items-center py-24 space-y-4">
                <div className="h-10 w-10 animate-spin rounded-full border-4 border-slate-800 border-t-[#006a4e]" />
                <span className="text-xs text-slate-400 font-mono uppercase tracking-widest font-black">Tracing ballot blocks hierarchy...</span>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {electionsStatus.map((el) => {
                  const isTampered = !el.valid;
                  const hasVotes = el.totalVotes > 0;
                  const hasDetails = openDetailId === el.electionId;

                  return (
                    <div 
                      key={el.electionId}
                      className={`bg-slate-900 border ${
                        isTampered ? 'border-red-850 bg-red-950/10' : 'border-slate-850 hover:border-slate-800'
                      } rounded-3xl p-6 transition-all space-y-5 relative shadow-sm`}
                    >
                      {/* Status Card header block */}
                      <div className="flex justify-between items-start gap-4">
                        <div className="space-y-1">
                          <span className="text-[10px] font-mono font-bold bg-[#006a4e]/20 text-[#209268] px-2 py-0.5 rounded border border-[#006a4e]/40">
                            Constituency Box #{el.electionId}
                          </span>
                          <h3 className="text-lg font-black tracking-tight text-white leading-tight">
                            {el.title}
                          </h3>
                        </div>

                        <div className="shrink-0">
                          {isTampered ? (
                            <span className="flex items-center gap-1.5 px-3 py-1 rounded-xl bg-red-650/20 text-red-500 border border-red-700/40 text-xs font-black font-mono animate-pulse shadow-inner uppercase">
                              <AlertTriangle className="h-3.5 w-3.5" /> TAMPER DETECTED
                            </span>
                          ) : (
                            <span className="flex items-center gap-1.5 px-3 py-1 rounded-xl bg-[#006a4e]/20 text-green-400 border border-[#006a4e]/40 text-xs font-black font-mono shadow-inner uppercase">
                              <CheckCircle className="h-3.5 w-3.5" /> ✓ INTACT
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Core info block */}
                      <div className="grid grid-cols-2 gap-3 bg-slate-950/65 rounded-2xl p-4 border border-slate-850/60 font-mono text-xs">
                        <div className="space-y-1">
                          <div className="text-slate-500 text-[10px] uppercase font-semibold">Ballots Cast</div>
                          <div className="text-sm font-black text-slate-100 flex items-center gap-1">
                            <Database className="h-3.5 w-3.5 text-slate-400" />
                            {el.totalVotes} votes
                          </div>
                        </div>
                        <div className="space-y-1">
                          <div className="text-slate-500 text-[10px] uppercase font-semibold">Integrity Verified</div>
                          <div className="text-sm font-black text-slate-100 flex items-center gap-1 text-[11px] truncate">
                            <Clock className="h-3.5 w-3.5 text-slate-400" />
                            {getRelativeTime(el.lastVerified)}
                          </div>
                        </div>
                      </div>

                      {/* Tampered error details when valid == false */}
                      {isTampered && (
                        <div className="bg-red-950/40 border border-red-900/50 rounded-2xl p-4 text-xs font-mono space-y-1.5 text-red-300">
                          <div className="font-bold uppercase tracking-wider text-red-400 flex items-center gap-1">
                            <ShieldAlert className="h-4 w-4" /> Cryptographic ledger violation
                          </div>
                          <div className="flex justify-between">
                            <span>Failed Index Node:</span>
                            <span className="font-black text-white">#{el.brokenAt}</span>
                          </div>
                          <div className="flex justify-between">
                            <span>Tamper Severity:</span>
                            <span className="bg-red-650 px-1.5 py-0.5 rounded text-white text-[9px] font-black uppercase">CRITICAL CRIME</span>
                          </div>
                        </div>
                      )}

                      {/* Interactive details chain visualizer */}
                      {el.recentVotes && el.recentVotes.length > 0 && (
                        <div className="space-y-2">
                          <button
                            onClick={() => setOpenDetailId(hasDetails ? null : el.electionId)}
                            className="text-[10px] uppercase font-black font-mono text-slate-400 hover:text-white flex items-center gap-1 cursor-pointer transition"
                          >
                            {hasDetails ? 'Hide Chain Details' : 'View Chain Details'} ({el.recentVotes?.length} blocks visualized)
                          </button>

                          <AnimatePresence>
                            {hasDetails && (
                              <motion.div
                                initial={{ opacity: 0, height: 0 }}
                                animate={{ opacity: 1, height: 'auto' }}
                                exit={{ opacity: 0, height: 0 }}
                                className="overflow-hidden bg-slate-950/70 border border-slate-850 rounded-2xl p-4 overflow-x-auto"
                              >
                                <div className="flex items-center gap-2 min-w-max py-2 px-1">
                                  {/* Genesis Block Placeholder */}
                                  <div className="flex flex-col items-center">
                                    <div className="h-8 px-2 bg-slate-800 border border-slate-700 rounded-lg flex items-center justify-center text-[9px] font-mono font-bold text-slate-400">
                                      GENESIS
                                    </div>
                                    <span className="text-[8px] font-mono text-slate-600 mt-1">0000000..</span>
                                  </div>

                                  {el.recentVotes.map((v, idx) => {
                                    // Highlight if this is the failing vote index
                                    const isBrokenBlock = isTampered && idx + Math.max(0, el.totalVotes - el.recentVotes.length) === el.brokenAt;

                                    return (
                                      <React.Fragment key={v.id}>
                                        <div className="text-slate-650 text-xs font-bold font-mono">→</div>
                                        <div className="flex flex-col items-center">
                                          <div className={`h-8 px-2 bg-slate-900 border ${
                                            isBrokenBlock ? 'border-red-600 bg-red-950/50 text-red-400 font-extrabold animate-bounce' : 'border-[#006a4e]/50 hover:border-[#006a4e] text-slate-200'
                                          } rounded-lg flex items-center justify-center text-[9px] font-mono cursor-pointer relative shadow`}
                                          title={`Prev: ${v.prev_hash}\nHash: ${v.vote_hash}`}>
                                            <div className="flex items-center gap-1 font-bold">
                                              <Zap className={`h-2.5 w-2.5 ${isBrokenBlock ? 'text-red-500' : 'text-green-500'}`} />
                                              BLOCK #{idx + Math.max(0, el.totalVotes - el.recentVotes.length)}
                                            </div>
                                          </div>
                                          <span className="text-[8px] font-mono text-slate-500 mt-1 shrink-0 truncate max-w-[65px]">
                                            {v.vote_hash?.substring(0, 8)}..
                                          </span>
                                        </div>
                                      </React.Fragment>
                                    );
                                  })}
                                </div>
                              </motion.div>
                            )}
                          </AnimatePresence>
                        </div>
                      )}

                      {/* Actions Bar */}
                      <div className="pt-4 border-t border-slate-850/60 flex items-center justify-between">
                        <span className="text-[10px] text-slate-550 font-semibold font-mono">
                          {hasVotes ? `Audit node active` : 'Empty Constituency poll'}
                        </span>

                        <button
                          disabled={verifyingId === el.electionId}
                          onClick={() => handleVerifyNow(el.electionId, el.title)}
                          className="flex items-center gap-1.5 px-4 py-1.5 bg-slate-900 border border-slate-800 text-slate-300 font-bold text-xs uppercase font-mono tracking-wider rounded-xl hover:bg-[#006a4e]/20 hover:border-[#006a4e] hover:text-[#006a4e] disabled:opacity-50 disabled:cursor-not-allowed transition cursor-pointer"
                        >
                          {verifyingId === el.electionId ? (
                            <>
                              <RefreshCw className="h-3.5 w-3.5 animate-spin" />
                              Tracing Ledger...
                            </>
                          ) : (
                            <>
                              <Play className="h-3 w-3 text-slate-400" />
                              Verify now
                            </>
                          )}
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </>
        ) : (
          <div className="space-y-8 animate-fadeIn duration-200">
            {/* Overview text explaining real-time changes */}
            <div className="bg-slate-900/40 border border-slate-850 rounded-2xl p-5 text-xs text-slate-300 leading-relaxed font-sans flex items-start gap-3">
              <span className="text-xl shrink-0 mt-0.5">💡</span>
              <div>
                <strong className="text-white text-sm font-bold block mb-1">How Centralized Blockchain Ledger Works</strong>
                This explorer visualizes the unified core ledger of OneID. Any change initiated on the frontend (e.g. registered births/deaths, filing eVat taxes, transfers of properties, license creations, BRTA vehicle assignment, or casting voter ballots) instantly signs and writes a deterministic <strong>hash-chained block</strong> in our server. Blocks are cryptographically secured using unique SHA-256 signatures, salted per department, and eventually sealed in 50-record Merkle blocks.
              </div>
            </div>

            {/* Department-wise 5 Sectors Grid */}
            <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
              {Object.entries(SECTOR_METADATA).map(([key, meta]) => {
                const count = ledgerStats?.[key]?.recordsCount ?? 0;
                const lastBlock = ledgerStats?.[key]?.lastBlock;
                const auditResult = sectorAuditReports[key];
                const isAuditing = verifyingSector === key;

                return (
                  <div 
                    key={key} 
                    className={`bg-slate-900 border border-slate-850/80 rounded-2xl p-4 flex flex-col justify-between transition-all hover:border-slate-800 relative`}
                  >
                    <div>
                      <div className="flex items-center justify-between">
                        <span className="text-2xl">{meta.icon}</span>
                        {auditResult ? (
                          auditResult.valid ? (
                            <span className="text-[9px] bg-green-950/50 border border-green-800/60 text-green-400 font-bold px-2 py-0.5 rounded-full uppercase tracking-wider">
                              Intact
                            </span>
                          ) : (
                            <span className="text-[9px] bg-red-950/50 border border-red-800/60 text-red-400 font-bold px-2 py-0.5 rounded-full uppercase tracking-wider animate-pulse">
                              Breached
                            </span>
                          )
                        ) : (
                          <span className="text-[9px] bg-slate-800 text-slate-400 font-bold px-2 py-0.5 rounded-full uppercase tracking-wider">
                            Pending
                          </span>
                        )}
                      </div>

                      <h4 className="text-sm font-black text-white mt-3 truncate">{meta.label}</h4>
                      <p className="text-[10px] text-slate-400 mt-1 leading-snug font-medium line-clamp-2 min-h-[30px]">
                        {meta.desc}
                      </p>

                      <div className="mt-4 pt-3 border-t border-slate-850/60 space-y-2 text-[10px] font-mono text-slate-300">
                        <div className="flex justify-between">
                          <span className="text-slate-500 font-bold uppercase">Total Blocks:</span>
                          <span className="text-white font-extrabold">{count}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-slate-500 font-bold uppercase">Merkle Sealed:</span>
                          <span className="text-white truncate max-w-[90px]" title={lastBlock?.merkleRoot || 'Genesis seal pending'}>
                            {lastBlock ? `Batch #${lastBlock.endSequence / 50}` : 'Genesis'}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="mt-4 pt-2">
                      <button
                        onClick={() => verifySectorChain(key)}
                        disabled={isAuditing}
                        className={`w-full text-center text-[10px] font-bold py-1.5 rounded-xl border transition-all ${
                          isAuditing
                            ? 'bg-slate-800 border-slate-700 text-slate-400 cursor-not-allowed'
                            : 'bg-slate-950 border-slate-800 hover:border-[#006a4e] text-slate-200 cursor-pointer'
                        }`}
                      >
                        {isAuditing ? (
                          <span className="flex items-center justify-center gap-1.5">
                            <RefreshCw className="h-3 w-3 animate-spin text-green-400" />
                            Verifying...
                          </span>
                        ) : (
                          'Run Crypto Audit'
                        )}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Live Stream Ledger block-chain view */}
            <div className="bg-slate-900/60 border border-slate-850 rounded-3xl p-6 space-y-6">
              <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                <div>
                  <h3 className="text-lg font-black text-white flex items-center gap-2">
                    <Activity className="h-5 w-5 text-green-400 animate-pulse" />
                    Live Ledger Block-Chain Feed
                  </h3>
                  <p className="text-xs text-slate-400 font-medium">
                    The deterministic chronological chain. Blocks are hashed sequentially from sequence 0 onwards.
                  </p>
                </div>

                {/* Filter and search controls */}
                <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
                  <div className="relative">
                    <Search className="absolute left-3 top-2.5 h-3.5 w-3.5 text-slate-550" />
                    <input
                      type="text"
                      placeholder="Search payloads..."
                      value={explorerSearch}
                      onChange={(e) => setExplorerSearch(e.target.value)}
                      className="w-full sm:w-60 pl-9 pr-4 py-2 bg-slate-950 border border-slate-850 focus:border-[#006a4e] focus:ring-1 focus:ring-[#006a4e] rounded-xl text-xs text-white placeholder-slate-500 font-medium transition outline-none"
                    />
                  </div>

                  <select
                    value={explorerSector}
                    onChange={(e) => setExplorerSector(e.target.value)}
                    className="px-3 py-2 bg-slate-950 border border-slate-850 focus:border-[#006a4e] rounded-xl text-xs text-white outline-none"
                  >
                    <option value="ALL">All Sectors</option>
                    <option value="VOTE">🗳️ Election Ballots</option>
                    <option value="TAX">৳ eVat & Taxes</option>
                    <option value="VEHICLE">🚗 BRTA Vehicles</option>
                    <option value="PROPERTY">🏡 Land Mutate</option>
                    <option value="CIVIL_REGISTRY">📜 Civil Registry</option>
                  </select>
                </div>
              </div>

              {explorerLoading ? (
                <div className="flex flex-col items-center justify-center py-20 space-y-4">
                  <div className="h-8 w-8 rounded-full border-4 border-slate-800 border-t-[#006a4e] animate-spin" />
                  <span className="text-xs text-slate-400 font-mono font-bold uppercase tracking-wider">Syncing blockchain nodes...</span>
                </div>
              ) : (
                (() => {
                  const filtered = ledgerRecords.filter(rec => {
                    if (!explorerSearch) return true;
                    const searchLower = explorerSearch.toLowerCase();
                    const payloadStr = JSON.stringify(rec.payload || {}).toLowerCase();
                    const hashStr = (rec.recordHash || '').toLowerCase();
                    const prevStr = (rec.prevHash || '').toLowerCase();
                    const sigStr = (rec.signature || '').toLowerCase();
                    const seqStr = String(rec.sequenceNumber || '');
                    return payloadStr.includes(searchLower) || 
                           hashStr.includes(searchLower) || 
                           prevStr.includes(searchLower) || 
                           sigStr.includes(searchLower) ||
                           seqStr.includes(searchLower);
                  });

                  if (filtered.length === 0) {
                    return (
                      <div className="text-center py-20 bg-slate-950/40 border border-slate-850 rounded-2xl">
                        <Database className="h-10 w-10 text-slate-700 mx-auto mb-3" />
                        <h4 className="text-sm font-bold text-slate-300">No Ledger Records Matched</h4>
                        <p className="text-xs text-slate-450 max-w-sm mx-auto mt-1 leading-relaxed">
                          We couldn't find any block receipts. Try selecting a different sector, altering your search keywords, or performing actions on the frontend (like transfer land, buy car, register as candidate) to append new ledger blocks!
                        </p>
                      </div>
                    );
                  }

                  return (
                    <div className="space-y-4">
                      {filtered.map((rec) => {
                        const meta = SECTOR_METADATA[rec.sector] || {
                          label: rec.sector,
                          color: 'border-slate-800 text-slate-400',
                          icon: '📦'
                        };
                        const isExpanded = expandedRecordId === rec.id;

                        return (
                          <div
                            key={rec.id}
                            className={`bg-slate-950 border ${
                              isExpanded ? 'border-slate-700 shadow-lg' : 'border-slate-850 hover:border-slate-800'
                            } rounded-2xl overflow-hidden transition-all duration-150`}
                          >
                            {/* Block summary header row */}
                            <div
                              onClick={() => setExpandedRecordId(isExpanded ? null : rec.id)}
                              className="p-4 flex flex-col md:flex-row md:items-center justify-between gap-4 cursor-pointer select-none"
                            >
                              <div className="flex items-center gap-3">
                                <div className="h-9 w-9 bg-slate-900 border border-slate-800 rounded-xl flex items-center justify-center text-lg shadow-inner">
                                  {meta.icon}
                                </div>
                                <div>
                                  <div className="flex items-center gap-2">
                                    <span className="text-xs font-black font-mono bg-slate-900 border border-slate-800 text-[#006a4e] px-2 py-0.5 rounded">
                                      BLOCK #{rec.sequenceNumber}
                                    </span>
                                    <span className={`text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full border ${meta.color}`}>
                                      {rec.sector}
                                    </span>
                                  </div>
                                  <div className="text-[10px] text-slate-400 font-mono mt-1 flex items-center gap-1.5">
                                    <Clock className="h-3 w-3" />
                                    {new Date(rec.timestamp).toLocaleString()}
                                  </div>
                                </div>
                              </div>

                              <div className="flex items-center gap-4 justify-between md:justify-end">
                                <div className="text-right hidden md:block">
                                  <div className="text-[10px] text-slate-500 font-mono">Block Hash pointer</div>
                                  <div className="text-[11px] text-slate-350 font-mono font-extrabold select-all truncate max-w-[200px]" title={rec.recordHash}>
                                    {rec.recordHash?.substring(0, 24)}...
                                  </div>
                                </div>

                                <div className="flex items-center gap-1.5 text-slate-400 hover:text-white">
                                  <span className="text-[10px] font-mono uppercase font-black">
                                    {isExpanded ? 'Collapse' : 'Inspect Block'}
                                  </span>
                                  {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                                </div>
                              </div>
                            </div>

                            {/* Expanded cryptographic proof & payload detail */}
                            {isExpanded && (
                              <div className="border-t border-slate-850 bg-slate-900/40 p-5 space-y-4">
                                {/* Human Summary box */}
                                {renderRecordSummary(rec)}

                                {/* Cryptographic specs panel */}
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-slate-950/70 border border-slate-850 rounded-2xl p-4 font-mono text-[10px] space-y-2 md:space-y-0 text-slate-300">
                                  <div className="space-y-2">
                                    <div>
                                      <span className="text-slate-500 font-bold block mb-0.5">PREVIOUS BLOCK HASH (prevHash):</span>
                                      <span className="text-slate-300 select-all font-semibold break-all leading-relaxed">
                                        {rec.prevHash}
                                      </span>
                                    </div>
                                    <div>
                                      <span className="text-slate-500 font-bold block mb-0.5">THIS BLOCK DETERMINISTIC HASH (recordHash):</span>
                                      <span className="text-green-400 select-all font-bold break-all leading-relaxed">
                                        {rec.recordHash}
                                      </span>
                                    </div>
                                  </div>

                                  <div className="space-y-2">
                                    <div>
                                      <span className="text-slate-500 font-bold block mb-0.5">SECURE DEPARTMENT HMAC SIGNATURE (signature):</span>
                                      <span className="text-blue-400 select-all font-semibold break-all leading-relaxed">
                                        {rec.signature}
                                      </span>
                                    </div>
                                    <div>
                                      <span className="text-slate-500 font-bold block mb-0.5">MERKLE TREE SEAL BLOCK ID (merkleBlockId):</span>
                                      <span className="text-slate-300">
                                        {rec.merkleBlockId ? (
                                          <span className="text-amber-400 font-bold flex items-center gap-1 mt-0.5">
                                            <CheckCircle className="h-3 w-3 text-amber-500" />
                                            {rec.merkleBlockId}
                                          </span>
                                        ) : (
                                          <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-slate-900 border border-slate-800 text-slate-400 font-bold font-mono mt-0.5">
                                            ⏳ Pending batch seal (Sequence {rec.sequenceNumber % 50}/50)
                                          </span>
                                        )}
                                      </span>
                                    </div>
                                  </div>
                                </div>

                                {/* Raw Payload JSON box */}
                                <div className="space-y-1.5">
                                  <div className="text-[10px] font-black uppercase text-slate-500 font-mono flex items-center gap-1">
                                    <FileText className="h-3 w-3" />
                                    Deterministic Payload JSON (Prisma record mapped)
                                  </div>
                                  <pre className="bg-slate-950 p-4 rounded-xl border border-slate-850 text-[10px] font-mono text-emerald-400 overflow-x-auto leading-relaxed select-all">
                                    {JSON.stringify(rec.payload, null, 2)}
                                  </pre>
                                </div>
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  );
                })()
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
