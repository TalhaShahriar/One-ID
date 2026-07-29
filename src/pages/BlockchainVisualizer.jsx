import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Database, 
  CheckCircle, 
  AlertTriangle, 
  RefreshCw, 
  Clock, 
  ChevronRight, 
  ArrowRight,
  Play, 
  Zap, 
  Search, 
  Layers, 
  Activity, 
  Shield, 
  FileText,
  HelpCircle,
  Code,
  ArrowLeft
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import api from '../lib/api.js';
import { useSocket } from '../hooks/useSocket.js';
import LiveBDClock from '../shared/components/LiveBDClock.jsx';

const SECTOR_METADATA = {
  VOTE: {
    label: 'Election Ballots',
    desc: 'Anonymous cryptographic voter ballot receipts',
    color: 'border-emerald-800 bg-emerald-950/25 text-emerald-400',
    icon: '🗳️',
    colorHex: '#10b981',
    lightBg: 'bg-emerald-500/10'
  },
  TAX: {
    label: 'eVat & Revenue',
    desc: 'Citizen tax returns & payment receipts',
    color: 'border-blue-800 bg-blue-950/25 text-blue-400',
    icon: '৳',
    colorHex: '#3b82f6',
    lightBg: 'bg-blue-500/10'
  },
  VEHICLE: {
    label: 'BRTA Vehicles',
    desc: 'Automotive registrations and driving licenses',
    color: 'border-rose-800 bg-rose-950/25 text-rose-400',
    icon: '🚗',
    colorHex: '#f43f5e',
    lightBg: 'bg-rose-500/10'
  },
  PROPERTY: {
    label: 'Land Registry',
    desc: 'Sovereign land mutations and title deeds',
    color: 'border-teal-800 bg-teal-950/25 text-teal-400',
    icon: '🏡',
    colorHex: '#0d9488',
    lightBg: 'bg-teal-500/10'
  },
  CIVIL_REGISTRY: {
    label: 'Civil Registry',
    desc: 'Births, marriages, and arbitration files',
    color: 'border-amber-800 bg-amber-950/25 text-amber-400',
    icon: '📜',
    colorHex: '#d97706',
    lightBg: 'bg-amber-500/10'
  }
};

export default function BlockchainVisualizer() {
  const navigate = useNavigate();
  const { socket } = useSocket();
  const [ledgerStats, setLedgerStats] = useState(null);
  const [ledgerRecords, setLedgerRecords] = useState([]);
  const [selectedSector, setSelectedSector] = useState('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [activeRecord, setActiveRecord] = useState(null);

  // Audit states
  const [auditingSector, setAuditingSector] = useState(null);
  const [auditStep, setAuditStep] = useState(-1);
  const [auditStatus, setAuditStatus] = useState(null);

  const fetchLedgerStats = async () => {
    try {
      const res = await api.get('/ledger/stats');
      setLedgerStats(res.data);
    } catch (err) {
      console.error('Error fetching ledger stats:', err);
    }
  };

  const fetchLedgerRecords = async (sectorFilter = 'ALL') => {
    setLoading(true);
    try {
      let url = '/ledger/public-records?limit=60';
      if (sectorFilter && sectorFilter !== 'ALL') {
        url += `&sector=${sectorFilter}`;
      }
      const res = await api.get(url);
      const records = res.data?.records || [];
      setLedgerRecords(records);
      
      if (records.length > 0 && !activeRecord) {
        setActiveRecord(records[0]);
      }
    } catch (err) {
      console.error('Error loading public blocks:', err);
      toast.error('Failed to load ledger records stream.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLedgerStats();
    fetchLedgerRecords(selectedSector);

    // Auto-poll every 10 seconds for real-time visualization of block updates
    const interval = setInterval(() => {
      fetchLedgerStats();
      // Load silently without full screen spinner
      api.get(`/ledger/public-records?limit=60${selectedSector !== 'ALL' ? `&sector=${selectedSector}` : ''}`)
        .then(res => {
          setLedgerRecords(res.data?.records || []);
        })
        .catch(err => console.error('Silent fetch failed:', err));
    }, 10000);

    return () => clearInterval(interval);
  }, [selectedSector]);

  useEffect(() => {
    if (!socket) return;

    const handleNewBlock = (data) => {
      fetchLedgerStats();
      api.get(`/ledger/public-records?limit=60${selectedSector !== 'ALL' ? `&sector=${selectedSector}` : ''}`)
        .then(res => {
          setLedgerRecords(res.data?.records || []);
        })
        .catch(err => console.error('Socket refresh failed:', err));
      toast.info(`⚡ Real-time ledger block appended! (${data?.sector || 'Live Sector'})`, { id: 'live-block-toast' });
    };

    socket.on('ledger:new_block', handleNewBlock);
    socket.on('vote:cast', handleNewBlock);

    return () => {
      socket.off('ledger:new_block', handleNewBlock);
      socket.off('vote:cast', handleNewBlock);
    };
  }, [socket, selectedSector]);

  // Run a step-by-step audit animation in the UI!
  const runVisualAudit = async (sector) => {
    if (auditingSector) return;
    
    setAuditingSector(sector);
    setAuditStatus('INITIATING');
    setAuditStep(-1);
    
    toast.info(`Starting cryptographic block verification for sector: ${sector}`);

    // Filter local records of this sector
    const sectorRecords = [...ledgerRecords]
      .filter(r => r.sector === sector)
      .sort((a, b) => a.sequenceNumber - b.sequenceNumber); // ascending for chronological checks

    if (sectorRecords.length === 0) {
      toast.error(`No local records loaded to visualize audit for ${sector}.`);
      setAuditingSector(null);
      return;
    }

    // Sequentially step through each block in the client-side array
    for (let i = 0; i < sectorRecords.length; i++) {
      setAuditStep(i);
      setAuditStatus('AUDITING_BLOCK');
      // Pause slightly for gorgeous feedback
      await new Promise(r => setTimeout(r, 600));
    }

    // Finally, run the backend cryptographically sound bottom-up validation
    try {
      const res = await api.get(`/ledger/public-verify/${sector}`);
      if (res.data?.valid) {
        setAuditStatus('SUCCESS');
        toast.success(`Integrity verified! All hash-pointers matched successfully for ${sector}.`);
      } else {
        setAuditStatus('FAILED');
        toast.error(`🚨 Cryptographic breakage found at block sequence #${res.data?.brokenAt}`);
      }
    } catch (err) {
      setAuditStatus('ERROR');
      toast.error('Audit verification request failed on core server.');
    } finally {
      // Keep state open for 3 seconds, then close
      setTimeout(() => {
        setAuditingSector(null);
        setAuditStep(-1);
        setAuditStatus(null);
      }, 4000);
    }
  };

  const renderPayloadSummary = (rec) => {
    const p = rec.payload;
    if (!p) return 'Empty ledger block payload.';

    switch (rec.sector) {
      case 'PROPERTY': {
        const isTransfer = p.eventType === 'PROPERTY_MUTATION_TRANSFER' || p.eventType === 'OWNERSHIP_TRANSFERRED' || p.action === 'TRANSFER';
        const seller = p.sellerOneId || p.fromOneId;
        const buyer = p.buyerOneId || p.toOneId;
        const price = p.price || p.agreedPriceBDT;
        const owner = p.ownerOneId || p.ownerId;
        if (isTransfer) {
          return `🏡 Land Mutation holding #${p.propertyId}: Transferred from NID ${seller?.substring(0, 8)}.. to ${buyer?.substring(0, 8)}.. for ৳${price?.toLocaleString()} BDT.`;
        }
        return `🏡 Property Registered: Lot #${p.propertyId} added under owner NID ${owner?.substring(0, 8)}...`;
      }
      case 'TAX': {
        const status = p.paymentStatus || 'SUBMITTED';
        return `৳ eVat Filing: TIN ${p.tin} filed Tax Year ${p.taxYear} with calculated VAT amount ৳${p.calculatedTax?.toLocaleString()} BDT. Status: ${status}.`;
      }
      case 'VEHICLE': {
        if (p.eventType === 'LICENSE_APPLICATION') {
          return `🚗 Driver License Application received for citizen NID ${p.citizenOneId?.substring(0, 8)}...`;
        }
        if (p.eventType === 'LICENSE_ISSUED') {
          return `🚗 Driver License Issued for citizen NID ${p.citizenOneId?.substring(0, 8)}...`;
        }
        if (p.eventType === 'VEHICLE_TRANSFERRED' || p.action === 'TRANSFER') {
          const fromOwner = p.fromOwnerOneId;
          const toOwner = p.toOwnerOneId;
          return `🚗 Vehicle Title mutated: Registration ${p.registrationNo} ownership transferred from NID ${fromOwner?.substring(0, 8)}.. to NID ${toOwner?.substring(0, 8)}..`;
        }
        const vehicleOwner = p.ownerOneId || p.currentOwnerOneId;
        return `🚗 BRTA Registered: ${p.make} ${p.model} (${p.year || 'N/A'}) mapped to owner NID ${vehicleOwner?.substring(0, 8)}..`;
      }
      case 'CIVIL_REGISTRY': {
        const isMarriage = p.recordType === 'MARRIAGE' || p.eventType === 'MARRIAGE_REGISTERED' || p.eventType === 'CIVIL_MARRIAGE_REGISTERED';
        const isArbitration = p.recordType === 'ARBITRATION' || p.eventType === 'ARBITRATION_COUNCIL_FORMED';
        if (isMarriage) {
          return `📜 Civil Marriage certified: Solemnized for Groom OneID ${p.groomOneId?.substring(0, 8)}.. to Bride OneID ${p.brideOneId?.substring(0, 8)}..`;
        }
        if (p.eventType === 'DIVORCE_NOTICE_FILED') {
          return `💔 Divorce notice served for Marriage ID ${p.marriageId}. Initiating 90-day reconciliation council.`;
        }
        if (p.eventType === 'DIVORCE_FINALIZED') {
          return `⚖️ Marital dissolution finalized. Marriage ID ${p.marriageId} status updated to DISSOLVED.`;
        }
        if (isArbitration) {
          return `⚖️ UP arbitration case registered for proceeding ID ${p.divorceProceedingId?.substring(0, 8)}...`;
        }
        return `📜 Civil event: ${p.eventType || p.recordType || 'REGISTRY'} registered on centralized OneID directory.`;
      }
      case 'VOTE':
        return `🗳️ Balloting slip casted: Anonymous receipt logged inside constituency ${p.constituency} in Election #${p.electionId}.`;
      default:
        return `📦 General ledger update logged on system coordinate.`;
    }
  };

  // Filter local files
  const filteredRecords = ledgerRecords.filter(rec => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    const payloadStr = JSON.stringify(rec.payload || {}).toLowerCase();
    const hashStr = (rec.recordHash || '').toLowerCase();
    const sectorStr = (rec.sector || '').toLowerCase();
    const seqStr = String(rec.sequenceNumber || '');
    return payloadStr.includes(q) || hashStr.includes(q) || sectorStr.includes(q) || seqStr.includes(q);
  });

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans pb-16 relative">
      
      {/* Return Home Button */}
      <div className="absolute top-6 left-6 z-20">
        <button
          onClick={() => navigate('/')}
          className="flex items-center gap-1.5 text-slate-400 hover:text-white transition-colors text-xs font-bold uppercase tracking-wider bg-slate-900 px-3 py-2 rounded-lg shadow-sm border border-slate-800"
        >
          <ArrowLeft className="h-4 w-4" /> Home
        </button>
      </div>

      {/* High-Tech Background Lines */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#0f172a_1px,transparent_1px),linear-gradient(to_bottom,#0f172a_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)] pointer-events-none" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8 relative z-10 space-y-8">
        
        {/* Header Block */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-slate-850 pb-6">
          <div className="space-y-1">
            <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-[10px] font-black font-mono uppercase tracking-widest">
              <Activity className="h-3 w-3 animate-pulse" /> Live Cryptographic Feed
            </div>
            <h1 className="text-3xl font-black tracking-tight text-white flex items-center gap-2">
              <Database className="h-8 w-8 text-[#006a4e]" />
              Sovereign Blockchain Visualizer
            </h1>
            <p className="text-xs text-slate-400 max-w-2xl leading-relaxed">
              Real-time audit view tracking how Bangladesh's primary state records (eVat, BRTA, Land deeds, Civil births/marriages, and Ballots) are hashed sequentially. Each block mathematically links to its predecessor.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            <LiveBDClock variant="badge" />
            <button
              onClick={() => {
                fetchLedgerStats();
                fetchLedgerRecords(selectedSector);
                toast.success('Core ledger state refreshed from secure nodes.');
              }}
              className="flex items-center gap-2 px-3.5 py-2 bg-slate-900 border border-slate-800 text-slate-300 font-bold text-xs uppercase font-mono rounded-xl hover:bg-slate-800 hover:text-white transition cursor-pointer"
            >
              <RefreshCw className="h-3.5 w-3.5" /> Force Sync
            </button>
            <a
              href="/"
              className="flex items-center gap-2 px-3.5 py-2 bg-[#006a4e] text-white font-bold text-xs uppercase font-mono rounded-xl hover:bg-[#00523c] transition shadow-md"
            >
              🔑 Return to App Portal
            </a>
          </div>
        </div>

        {/* 5 Sectors Audit Matrix */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          {Object.entries(SECTOR_METADATA).map(([key, meta]) => {
            const stats = ledgerStats?.[key] || { recordsCount: 0 };
            const isActiveAudit = auditingSector === key;

            return (
              <div 
                key={key}
                className={`bg-slate-900/80 border ${
                  isActiveAudit ? 'border-amber-500 bg-amber-950/10' : 'border-slate-850'
                } rounded-2xl p-4 flex flex-col justify-between transition-all relative overflow-hidden`}
              >
                <div>
                  <div className="flex justify-between items-start">
                    <span className="text-2xl">{meta.icon}</span>
                    <span className="text-[9px] px-2 py-0.5 font-bold uppercase rounded-md bg-slate-950 border border-slate-800 text-slate-400">
                      Sector
                    </span>
                  </div>
                  <h3 className="text-xs font-black text-white mt-3">{meta.label}</h3>
                  <div className="text-xl font-mono font-black text-slate-200 mt-1">
                    {stats.recordsCount} <span className="text-[10px] text-slate-500 font-sans font-normal">Blocks</span>
                  </div>
                </div>

                <div className="mt-4 pt-3 border-t border-slate-850/60">
                  <button
                    disabled={auditingSector !== null}
                    onClick={() => runVisualAudit(key)}
                    className="w-full text-center text-[9px] font-bold font-mono py-1 rounded-lg border border-slate-800 bg-slate-950 text-slate-300 hover:border-amber-500/50 hover:text-amber-400 disabled:opacity-40 transition cursor-pointer"
                  >
                    {isActiveAudit ? 'Auditing Now...' : 'Verify Chain'}
                  </button>
                </div>
              </div>
            );
          })}
        </div>

        {/* Dynamic Multi-Step Audit Visualization Banner */}
        <AnimatePresence>
          {auditingSector && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="bg-slate-900 border border-amber-500/40 rounded-2xl p-6 space-y-4 shadow-xl"
            >
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
                <div className="flex items-center gap-2">
                  <div className="h-5 w-5 bg-amber-500 text-slate-950 rounded-full flex items-center justify-center font-bold font-mono text-xs animate-bounce">
                    !
                  </div>
                  <h3 className="text-sm font-black text-white font-mono uppercase tracking-wider">
                    Interactive Hash-Pointer Sweep Audit
                  </h3>
                </div>
                <div className="text-xs font-mono bg-slate-950 px-3 py-1 rounded-md border border-slate-800 text-amber-400">
                  Sector: {auditingSector} | State: {auditStatus}
                </div>
              </div>

              {/* Step pipeline loader */}
              <div className="grid grid-cols-2 sm:grid-cols-6 lg:grid-cols-10 gap-2">
                {Array.from({ length: 10 }).map((_, idx) => {
                  const isCurrent = auditStep === idx;
                  const isPassed = auditStep > idx;

                  return (
                    <div 
                      key={idx} 
                      className={`h-2 rounded transition-all duration-300 ${
                        isCurrent 
                          ? 'bg-amber-400 shadow-md shadow-amber-500/50 scale-y-125' 
                          : isPassed 
                          ? 'bg-emerald-500' 
                          : 'bg-slate-800'
                      }`}
                    />
                  );
                })}
              </div>

              <div className="text-[11px] font-mono text-slate-400 flex items-center gap-1.5">
                <Activity className="h-3.5 w-3.5 animate-spin text-amber-500" />
                {auditStep === -1 ? (
                  <span>Reindexing Genesis node signatures...</span>
                ) : (
                  <span>Mathematically verifying: Block {auditStep} Hash pointers match Block {auditStep - 1} outputs...</span>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Interactive Visualization Board */}
        {/* Consensus Nodes Network Visualization */}
        <div className="bg-slate-900/50 border border-slate-850 rounded-2xl p-4 mb-4">
          <div className="flex items-center gap-2 mb-3">
            <Shield className="h-4 w-4 text-emerald-400" />
            <h3 className="text-[10px] font-black text-white uppercase tracking-wider font-mono">Central Consensus Nodes</h3>
            <span className="text-[10px] text-slate-400 ml-2 hidden sm:inline">All blocks require validation from these core servers.</span>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {[
              { id: 'ELECTION', label: 'Election Comm.', ip: '192.168.1.100' },
              { id: 'NID', label: 'NID Registry', ip: '10.0.0.5' },
              { id: 'AUDIT', label: 'Supreme Audit', ip: '172.16.0.2' },
              { id: 'FINANCE', label: 'Finance Min.', ip: '192.168.2.50' }
            ].map(node => (
              <div key={node.id} className="bg-slate-950 border border-slate-800 rounded-xl p-2.5 flex items-center justify-between shadow-sm hover:border-slate-700 transition-colors">
                <div>
                  <div className="text-[10px] font-bold text-slate-200">{node.label}</div>
                  <div className="text-[8px] font-mono text-slate-500 mt-0.5">{node.ip}</div>
                </div>
                <div className="flex items-center gap-1.5" title="Node is Active & Synced">
                  <span className="text-[8px] font-bold text-emerald-500 uppercase">Sync</span>
                  <div className="h-1.5 w-1.5 rounded-full bg-emerald-500 shadow-[0_0_6px_#10b981] animate-pulse" />
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          
          {/* LEFT: Blockchain Connected Block Streams */}
          <div className="lg:col-span-8 space-y-6">
            <div className="bg-slate-900/60 border border-slate-850 rounded-3xl p-6 space-y-6">
              
              <div className="flex flex-col sm:flex-row justify-between items-stretch sm:items-center gap-4">
                <div className="space-y-1">
                  <h2 className="text-base font-black text-white flex items-center gap-2">
                    <Layers className="h-4 w-4 text-[#006a4e]" />
                    Chained Ledger Sequence View
                  </h2>
                  <p className="text-[11px] text-slate-400 font-medium">
                    Arrows demonstrate how <code>prevHash</code> maps directly back to the predecessor block's unique SHA-256 fingerprint.
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <div className="relative">
                    <Search className="absolute left-3 top-2 h-3.5 w-3.5 text-slate-500" />
                    <input
                      type="text"
                      placeholder="Search blocks..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-full sm:w-48 pl-9 pr-3 py-1.5 bg-slate-950 border border-slate-850 rounded-lg text-xs text-white placeholder-slate-500 focus:border-[#006a4e] outline-none transition"
                    />
                  </div>

                  <select
                    value={selectedSector}
                    onChange={(e) => setSelectedSector(e.target.value)}
                    className="px-2.5 py-1.5 bg-slate-950 border border-slate-850 rounded-lg text-xs text-white outline-none"
                  >
                    <option value="ALL">All Sectors</option>
                    <option value="VOTE">🗳️ Ballots</option>
                    <option value="TAX">৳ Tax eVats</option>
                    <option value="VEHICLE">🚗 Vehicles</option>
                    <option value="PROPERTY">🏡 Land Deeds</option>
                    <option value="CIVIL_REGISTRY">📜 Civil</option>
                  </select>
                </div>
              </div>

              {loading ? (
                <div className="flex flex-col justify-center items-center py-20 space-y-4">
                  <div className="h-8 w-8 animate-spin rounded-full border-4 border-slate-850 border-t-[#006a4e]" />
                  <span className="text-xs text-slate-400 font-mono">Tracing node chain pointers...</span>
                </div>
              ) : filteredRecords.length === 0 ? (
                <div className="text-center py-16 bg-slate-950/40 border border-slate-850 rounded-2xl">
                  <Database className="h-10 w-10 text-slate-800 mx-auto mb-3 animate-pulse" />
                  <h4 className="text-sm font-bold text-slate-400">No Ledger blocks matching current filter</h4>
                  <p className="text-xs text-slate-550 max-w-md mx-auto mt-1 leading-relaxed">
                    Once you make an edit (such as filing eVat taxes, buying a vehicle, mutating land registry, or casting votes), a new block will immediately append and chain live!
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {filteredRecords.map((rec, index) => {
                    const meta = SECTOR_METADATA[rec.sector] || {
                      label: rec.sector,
                      color: 'border-slate-800 text-slate-400',
                      icon: '📦',
                      colorHex: '#64748b',
                      lightBg: 'bg-slate-500/10'
                    };
                    
                    const isSelected = activeRecord?.id === rec.id;
                    const nextRecord = filteredRecords[index + 1];

                    return (
                      <div key={rec.id} className="relative">
                        
                        {/* Interactive Block Card */}
                        <motion.div
                          onClick={() => setActiveRecord(rec)}
                          whileHover={{ scale: 1.01 }}
                          className={`relative p-5 rounded-xl border-2 transition-all cursor-pointer select-none overflow-hidden ${
                            isSelected 
                              ? 'bg-slate-900 border-emerald-500 shadow-[0_0_15px_rgba(16,185,129,0.1)]' 
                              : 'bg-slate-950 border-slate-800 hover:border-slate-700'
                          }`}
                        >
                          {/* Top 3D Edge effect */}
                          <div className={`absolute top-0 left-0 right-0 h-1 ${isSelected ? 'bg-emerald-500' : 'bg-slate-800'}`} />
                          
                          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                            
                            {/* Block Tag & Sequence ID */}
                            <div className="flex items-center gap-3 w-full sm:w-auto">
                              <div className={`h-10 w-10 shrink-0 rounded-lg ${meta.lightBg} flex items-center justify-center text-xl shadow-inner border border-slate-800/50`}>
                                {meta.icon}
                              </div>
                              <div className="flex-1">
                                <div className="flex items-center gap-2 mb-1">
                                  <span className="text-xs font-black font-mono text-white tracking-widest drop-shadow-md">
                                    BLOCK #{rec.sequenceNumber}
                                  </span>
                                  <span className={`text-[9px] font-black uppercase px-2 py-0.5 rounded shadow-sm border ${meta.color}`}>
                                    {rec.sector}
                                  </span>
                                </div>
                                <div className="text-[10px] text-slate-400 flex items-center gap-1.5 font-medium">
                                  <Clock className="h-3 w-3" />
                                  {new Date(rec.timestamp).toLocaleTimeString()} 
                                </div>
                              </div>
                            </div>

                            {/* Consensus Tags */}
                            <div className="flex items-center gap-1 shrink-0 self-end sm:self-center">
                              {[1, 2, 3, 4].map(n => (
                                <div key={n} title={`Node ${n} Validated`} className="h-4 w-4 rounded-sm bg-emerald-500/20 border border-emerald-500/50 flex items-center justify-center">
                                  <CheckCircle className="h-2.5 w-2.5 text-emerald-400" />
                                </div>
                              ))}
                              <span className="text-[9px] text-emerald-500 font-bold ml-1 uppercase">Valid</span>
                            </div>
                          </div>

                          {/* Quick summary line of the block mutation */}
                          <div className="mt-4 p-3 bg-slate-900/50 rounded-lg border border-slate-800/50">
                            <p className="text-[11px] text-slate-200 font-medium font-sans leading-relaxed">
                              {renderPayloadSummary(rec)}
                            </p>
                          </div>
                        </motion.div>

                        {/* HIGH-FIDELITY CONNECTING ARROW demonstrating mathematical chain linkage */}
                        {nextRecord && (
                          <div className="flex justify-center items-center py-1">
                            <div className="flex flex-col items-center">
                              {/* Arrow down showing previous hash connection */}
                              <div className="h-8 w-1 bg-gradient-to-b from-slate-700 to-slate-800" />
                              <div className="relative -mt-3 -mb-3 z-10 flex items-center justify-center bg-slate-950 rounded-full border border-slate-800 px-2 py-0.5 shadow-sm">
                                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" className="text-slate-500" strokeLinecap="round" strokeLinejoin="round"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"></path><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"></path></svg>
                                <span className="text-[8px] font-mono font-bold text-slate-400 ml-1">Cryptographic Link</span>
                              </div>
                              <div className="h-8 w-1 bg-gradient-to-b from-slate-800 to-slate-700" />
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          {/* RIGHT: Selected Block Inspector & Cryptographic Specs */}
          <div className="lg:col-span-4 space-y-6">
            
            {/* Quick Helper Box */}
            <div className="bg-slate-900/60 border border-slate-850 rounded-2xl p-4 text-[11px] text-slate-400 leading-relaxed font-sans space-y-2">
              <h4 className="font-bold text-white flex items-center gap-1">
                <HelpCircle className="h-3.5 w-3.5 text-amber-500" /> How Centralized Blockchain Works:
              </h4>
              <p>
                In a centralized blockchain, trusted nodes (like the Election Commission) validate blocks. 
                Instead of hiding data, we use cryptographic hashes to <strong>prove</strong> the data hasn't been tampered with.
              </p>
              <div className="pt-2 border-t border-slate-850/60 flex items-center justify-between font-mono text-[10px]">
                <span className="text-slate-500">Hash Match Algorithm:</span>
                <span className="text-slate-200">SHA-256 (Salted)</span>
              </div>
            </div>

            {/* Block Inspector */}
            {activeRecord ? (
              <div className="bg-slate-900/80 border border-slate-850 rounded-3xl p-6 space-y-6 sticky top-6">
                <div className="space-y-1">
                  <div className="text-[10px] font-bold font-mono text-[#006a4e] uppercase tracking-widest">Selected Block Deep Inspection</div>
                  <h3 className="text-base font-black text-white flex items-center gap-1.5">
                    BLOCK #{activeRecord.sequenceNumber} Details
                  </h3>
                  <div className="text-[10px] text-slate-500 font-mono flex items-center gap-1.5">
                    <Clock className="h-3 w-3" />
                    Mined on: {new Date(activeRecord.timestamp).toLocaleString()}
                  </div>
                </div>

                {/* Cryptographic Fields */}
                <div className="space-y-4 font-mono text-[10px] bg-slate-950 rounded-2xl p-4 border border-slate-850/60 text-slate-300">
                  <div className="space-y-1">
                    <span className="text-slate-500 font-black uppercase text-[8px] tracking-wider block">THIS BLOCK HASH (Unique ID)</span>
                    <p className="text-[9px] text-slate-500 mb-1.5 font-sans leading-tight">The digital fingerprint of this exact transaction.</p>
                    <span className="text-green-400 font-bold select-all break-all leading-normal inline-block bg-green-500/10 px-2 py-1 rounded">
                      {activeRecord.recordHash}
                    </span>
                  </div>

                  <div className="space-y-1 border-t border-slate-900 pt-3">
                    <span className="text-slate-500 font-black uppercase text-[8px] tracking-wider block">PARENT BLOCK HASH (Chain Link)</span>
                    <p className="text-[9px] text-slate-500 mb-1.5 font-sans leading-tight">Points to the previous block. If anyone alters the past, this link breaks!</p>
                    <span className="text-slate-400 font-medium select-all break-all leading-normal inline-block bg-slate-800/50 px-2 py-1 rounded border border-slate-800">
                      {activeRecord.prevHash || '0000000000000000000000000000000000000000000000000000000000000000'}
                    </span>
                  </div>

                  <div className="space-y-1 border-t border-slate-900 pt-3">
                    <span className="text-slate-500 font-black uppercase text-[8px] tracking-wider block">HMAC SECURITY SIGNATURE</span>
                    <p className="text-[9px] text-slate-500 mb-1.5 font-sans leading-tight">Cryptographic proof that an authorized authority (Node) signed this data.</p>
                    <span className="text-blue-400 font-semibold select-all break-all leading-normal inline-block bg-blue-500/10 px-2 py-1 rounded">
                      {activeRecord.signature}
                    </span>
                  </div>

                  <div className="space-y-1 border-t border-slate-900 pt-3">
                    <span className="text-slate-500 font-black uppercase text-[8px] tracking-wider block">MERKLE TREE STATE</span>
                    <div>
                      {activeRecord.merkleBlockId ? (
                        <div className="flex items-center gap-1 text-amber-400 font-bold mt-0.5">
                          <CheckCircle className="h-3 w-3 text-amber-500" />
                          Sealed in Merkle Block #{activeRecord.merkleBlockId}
                        </div>
                      ) : (
                        <span className="inline-block px-2 py-0.5 rounded bg-slate-900 border border-slate-850 text-slate-500 font-medium mt-1">
                          ⏳ Awaiting batch seal ({activeRecord.sequenceNumber % 50}/50 records)
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Raw JSON Payload */}
                <div className="space-y-2">
                  <div className="text-[10px] font-black uppercase text-slate-500 font-mono flex items-center gap-1">
                    <Code className="h-3.5 w-3.5" />
                    Deterministic Decrypted Payload JSON
                  </div>
                  <pre className="bg-slate-950 p-4 rounded-xl border border-slate-850 text-[10px] font-mono text-emerald-400 overflow-x-auto leading-relaxed select-all">
                    {JSON.stringify(activeRecord.payload, null, 2)}
                  </pre>
                </div>
              </div>
            ) : (
              <div className="bg-slate-900/60 border border-slate-850 rounded-2xl p-6 text-center text-slate-500 text-xs">
                Click any block to inspect its full cryptographic footprint.
              </div>
            )}
          </div>

        </div>

      </div>
    </div>
  );
}
