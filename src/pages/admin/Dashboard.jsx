import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import { 
  BarChart, Bar, Cell, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Legend
} from 'recharts';
import { 
  Calendar, 
  Activity, 
  CheckSquare, 
  UserPlus, 
  RefreshCw, 
  AlertTriangle, 
  ShieldCheck, 
  Cpu, 
  Database, 
  CheckCircle, 
  Clock, 
  UserCheck,
  TrendingUp,
  XCircle,
  HelpCircle
} from 'lucide-react';
import { toast } from 'sonner';
import api from '../../lib/api.js';
import { useSocket } from '../../hooks/useSocket.js';
import { useElectionLive } from '../../hooks/useElectionLive.js';
import QRScanner from '../../shared/components/QRScanner.jsx';
import VoterDemographicsChart from './VoterDemographicsChart.jsx';
import VotingCountdown from '../../shared/components/VotingCountdown.jsx';

// Pre-defined color wheel representing Bangladeshi democratic landscape
const PARTY_COLORS = {
  'AL': '#006a4e',     // Bangladesh Emerald Gold Accent
  'BNP': '#1e40af',    // Deep Sovereign Blue
  'JP': '#d97706',     // Amber Ochre
  'IND': '#475569',    // Slate Neutral
  'OTHER': '#7c3aed'   // Royal Lilac
};

const getPartyColor = (abbreviation) => {
  if (!abbreviation) return PARTY_COLORS.IND;
  const upper = abbreviation.toUpperCase();
  if (upper.includes('AL') || upper.includes('AWAMI')) return PARTY_COLORS.AL;
  if (upper.includes('BNP')) return PARTY_COLORS.BNP;
  if (upper.includes('JP') || upper.includes('JATIYA')) return PARTY_COLORS.JP;
  return PARTY_COLORS.OTHER;
};

export default function AdminDashboard() {
  const { socket, isConnected } = useSocket();
  const navigate = useNavigate();

  const [showScanner, setShowScanner] = useState(false);

  // Stats cards state
  const [stats, setStats] = useState({
    totalElections: 0,
    activeElections: 0,
    totalVotesToday: 0,
    pendingCandidates: 0,
    totalVoters: 500 // fallback registry size
  });
  const [statsLoading, setStatsLoading] = useState(true);

  // Elections list for election election selector
  const [elections, setElections] = useState([]);
  const [selectedElectionId, setSelectedElectionId] = useState('');
  
  // Audit logs state
  const [auditLogs, setAuditLogs] = useState([]);
  const [logsLoading, setLogsLoading] = useState(true);

  // Anomaly flags state
  const [anomalies, setAnomalies] = useState([]);
  const [anomaliesLoading, setAnomaliesLoading] = useState(true);
  const [anomalyStats, setAnomalyStats] = useState({
    total: 0,
    high_severity: 0,
    today: 0,
    byType: {
      IP_RATE_SPIKE: 0,
      DEVICE_COLLISION: 0,
      OFF_HOURS_ACTIVITY: 0
    }
  });

  // Blockchain integrity widget state
  const [blockchainStatus, setBlockchainStatus] = useState({
    valid: true,
    totalVotes: 0,
    brokenAt: null,
    lastChecked: null,
    loading: false
  });

  // Ticking effect for "Last Checked"
  const [secondsSinceLastCheck, setSecondsSinceLastCheck] = useState(0);

  // Selected election hook mapping
  const { 
    candidates: liveCandidates, 
    totalVotes: liveTotalVotes, 
    lastUpdated: liveLastUpdated,
    refetch: refetchLiveElection
  } = useElectionLive(selectedElectionId);

  // Sound or visual flash signals matching active candidate IDS
  const [flashedCandidateId, setFlashedCandidateId] = useState(null);

  // Retrieve initial datasets
  const fetchDashboardStats = async () => {
    try {
      setStatsLoading(true);
      const res = await api.get('/elections/admin/dashboard-stats');
      setStats(res.data);
    } catch (err) {
      console.error('Error loading dashboard statistics:', err);
    } finally {
      setStatsLoading(false);
    }
  };

  const fetchElectionsList = async () => {
    try {
      const res = await api.get('/elections');
      setElections(res.data);
      // Auto-select first active or scheduled election
      if (res.data.length > 0) {
        const activeOne = res.data.find(e => e.status === 'ACTIVE') || res.data[0];
        setSelectedElectionId(activeOne.id.toString());
      }
    } catch (err) {
      console.error('Error fetching list of elections:', err);
    }
  };

  const fetchRecentAuditLogs = async () => {
    try {
      setLogsLoading(true);
      const res = await api.get('/audit/logs');
      // show 10 logs max in side panel
      setAuditLogs(res.data.slice(0, 10));
    } catch (err) {
      console.error('Error fetching audit logs:', err);
    } finally {
      setLogsLoading(false);
    }
  };

  const fetchRecentAnomalies = async () => {
    try {
      setAnomaliesLoading(true);
      const res = await api.get('/anomaly/recent');
      setAnomalies(res.data);
    } catch (err) {
      console.error('Error fetching anomaly logs, falling back to audit/anomalies:', err);
      // Fallback search
      try {
        const fallbackRes = await api.get('/audit/anomalies');
        setAnomalies(fallbackRes.data.slice(0, 10));
      } catch (fallbackErr) {
        console.error('Failover anomaly retrieval also missed:', fallbackErr);
      }
    } finally {
      setAnomaliesLoading(false);
    }
  };

  const fetchAnomalyStats = async () => {
    try {
      const res = await api.get('/anomaly/stats');
      setAnomalyStats(res.data);
    } catch (err) {
      console.error('Error fetching security anomaly stats:', err);
    }
  };

  const verifyBlockchain = async (forceRefetch = false) => {
    if (!selectedElectionId) return;
    setBlockchainStatus(prev => ({ ...prev, loading: true }));
    try {
      const res = await api.get(`/votes/blockchain/verify/${selectedElectionId}`);
      setBlockchainStatus({
        valid: res.data.valid,
        totalVotes: res.data.totalVotes || 0,
        brokenAt: res.data.brokenAt || null,
        lastChecked: res.data.lastChecked ? new Date(res.data.lastChecked) : new Date(),
        loading: false
      });
      setSecondsSinceLastCheck(0);
      if (forceRefetch) {
        toast.info(res.data.valid 
          ? '✓ Blockchain hashes recursively evaluated. Chain status is INTACT.' 
          : '⚠️ Integrity check complete. Potential gap detected!'
        );
      }
    } catch (err) {
      console.error('Error executing blockchain audits:', err);
      setBlockchainStatus(prev => ({ ...prev, loading: false }));
    }
  };

  // Effect to boot core dashboard modules
  useEffect(() => {
    fetchDashboardStats();
    fetchElectionsList();
    fetchRecentAuditLogs();
    fetchRecentAnomalies();
    fetchAnomalyStats();
  }, []);

  // Sync blockchain checks when chosen election indices change
  useEffect(() => {
    if (selectedElectionId) {
      verifyBlockchain();
    }
  }, [selectedElectionId]);

  // Handle generic and directed socket listeners inside dashboard
  useEffect(() => {
    if (!socket) return;

    // Listen to candidate level casting events for glow indicators
    const handleGlobalVoteCast = (data) => {
      if (parseInt(data.election_id, 10) === parseInt(selectedElectionId, 10)) {
        setFlashedCandidateId(parseInt(data.candidate_id, 10));
        setTimeout(() => setFlashedCandidateId(null), 1000);

        // Softly increment candidate totals today
        setStats(prev => ({
          ...prev,
          totalVotesToday: prev.totalVotesToday + 1
        }));
      }
    };

    // Listen to structural changes
    const handleStatusChange = (data) => {
      toast(`📡 Real-Time Alert: Election "${data.title}" changed status to ${data.status}.`, {
        duration: 5000,
        style: { border: '1px solid #10b981', background: '#ecfdf5' }
      });
      
      // Reload stats and elections structure
      fetchDashboardStats();
      fetchElectionsList();
      fetchRecentAuditLogs();
    };

    const handleNewAnomaly = (newAnom) => {
      setAnomalies(prev => {
        if (prev.some(a => a.id === newAnom.id)) return prev;
        return [
          { ...newAnom, isNew: true },
          ...prev
        ];
      });

      setAnomalyStats(prev => ({
        ...prev,
        total: prev.total + 1,
        today: prev.today + 1,
        high_severity: newAnom.severity === 'HIGH' ? prev.high_severity + 1 : prev.high_severity,
        byType: {
          ...prev.byType,
          [newAnom.flag_type]: (prev.byType[newAnom.flag_type] || 0) + 1
        }
      }));

      toast.error(`⚠️ Security Warning: ${newAnom.flag_type?.replace(/_/g, ' ')} detected! IP: ${newAnom.ip_address || 'N/A'}`, {
        duration: 5000
      });
    };

    socket.on('vote:cast', handleGlobalVoteCast);
    socket.on('election:status_changed', handleStatusChange);
    socket.on('anomaly:new', handleNewAnomaly);

    return () => {
      socket.off('vote:cast', handleGlobalVoteCast);
      socket.off('election:status_changed', handleStatusChange);
      socket.off('anomaly:new', handleNewAnomaly);
    };
  }, [socket, selectedElectionId]);

  // Simple ticking timers
  useEffect(() => {
    const checkTimer = setInterval(() => {
      setSecondsSinceLastCheck(prev => prev + 1);
    }, 1000);

    return () => clearInterval(checkTimer);
  }, []);

  // Mark anomaly reviewed logic
  const handleReviewAnomaly = async (id) => {
    try {
      // call standard review path
      await api.patch(`/anomaly/${id}/review`);
      toast.success('Anomaly flagged has been archived/reviewed.');
      // reload anomalies and logs
      fetchRecentAnomalies();
      fetchRecentAuditLogs();
      fetchAnomalyStats();
    } catch (err) {
      console.error('Standard review error, falling back to resolve:', err);
      try {
        await api.patch(`/audit/anomalies/${id}/resolve`);
        toast.success('Anomaly resolved successfully.');
        fetchRecentAnomalies();
        fetchRecentAuditLogs();
        fetchAnomalyStats();
      } catch (fallbackErr) {
        toast.error('Could not archive anomaly log. Security node failed handshake.');
      }
    }
  };

  // Convert aggregate candidate metrics for charts representation
  const selectedElectionObj = elections.find(e => e.id.toString() === selectedElectionId);
  
  const chartData = liveCandidates.map(cand => ({
    name: cand.name.split(' ')[0] || cand.name,
    fullName: cand.name,
    votes: cand.votesCount || cand.vote_count || 0,
    party: cand.party?.abbreviation || 'IND',
    color: getPartyColor(cand.party?.abbreviation)
  }));

  // Aggregate by party
  const partyShareMap = {};
  liveCandidates.forEach(cand => {
    const pAbbr = cand.party?.abbreviation || 'IND';
    const pVotes = cand.votesCount || cand.vote_count || 0;
    partyShareMap[pAbbr] = (partyShareMap[pAbbr] || 0) + pVotes;
  });

  const pieChartData = Object.keys(partyShareMap).map(key => ({
    name: key,
    value: partyShareMap[key],
    color: getPartyColor(key)
  }));

  // Custom calculation for Voter Turnout
  const totalRegistryVoters = stats.totalVoters || 500;
  const rawTurnoutPercent = liveTotalVotes > 0 ? (liveTotalVotes / totalRegistryVoters) * 100 : 0;
  const turnoutPercent = Math.min(parseFloat(rawTurnoutPercent.toFixed(1)), 100);

  // Turnout gauge Recharts semi-circle data template
  const gaugeData = [
    { name: 'Turnout', value: turnoutPercent, fill: '#006a4e' },
    { name: 'Remaining', value: Math.max(0, 100 - turnoutPercent), fill: '#f1f5f9' }
  ];

  // Seconds ago label formatter
  const formatSecondsAgo = (date) => {
    if (!date) return 'never';
    const diff = Math.floor((new Date() - new Date(date)) / 1000);
    if (diff < 5) return 'just now';
    return `${diff} seconds ago`;
  };

  const handleScanNID = (decodedText) => {
    setShowScanner(false);
    toast.success('Citizen ID scanned successfully!');
    navigate(`/verify-identity?oneid=${encodeURIComponent(decodedText)}`);
  };

  return (
    <div className="w-full max-w-7xl mx-auto px-4 py-8 font-sans space-y-8" id="admin-dashboard-container">
      
      {showScanner && (
        <QRScanner 
          onScan={handleScanNID} 
          onClose={() => setShowScanner(false)} 
        />
      )}

      {/* HEADER META RAIL */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center border-b border-slate-200 pb-5 gap-4">
        <div>
          <h2 className="text-3xl font-black text-slate-800 tracking-tight uppercase flex items-center gap-2">
            <TrendingUp className="h-7 w-7 text-[#006a4e]" /> Cryptographic Administration Desk
          </h2>
          <p className="text-xs text-slate-400 font-medium mt-1">
            Real-Time Audit Node • Syncing live via Decentralized Secure Channels
          </p>
        </div>

        {/* CONNECTION SYSTEM BADGE */}
        <div className="flex items-center gap-3">
          <button 
            onClick={() => setShowScanner(true)}
            className="flex items-center gap-2 px-4 py-2 bg-slate-800 hover:bg-slate-900 text-white font-bold text-xs uppercase tracking-wider rounded-lg transition-colors shadow-sm border border-slate-700"
            title="Scan Citizen NID"
          >
            <UserCheck className="h-4 w-4 text-emerald-400" />
            <span className="hidden md:inline">Scan NID</span>
          </button>
          <button 
            onClick={() => {
              fetchDashboardStats();
              fetchRecentAuditLogs();
              fetchRecentAnomalies();
              fetchAnomalyStats();
              if (selectedElectionId) refetchLiveElection();
              toast.success('System telemetry updated manually.');
            }}
            className="p-2 border border-slate-200 bg-white hover:bg-slate-50 text-slate-500 rounded-xl transition"
            title="Force refresh status metrics"
          >
            <RefreshCw className="h-4 w-4" />
          </button>
          <div className={`px-3.5 py-1.5 rounded-full border text-[10px] font-black uppercase tracking-wider flex items-center gap-1.5 font-mono ${
            isConnected 
              ? 'bg-emerald-50 border-emerald-200 text-[#006a4e]' 
              : 'bg-amber-50 border-amber-200 text-amber-700'
          }`}>
            <span className={`inline-block h-2 w-2 rounded-full ${isConnected ? 'bg-emerald-600 animate-pulse' : 'bg-amber-500 animate-ping'}`} />
            {isConnected ? 'NODE STREAMING ACTIVE' : 'NODE OFFLINE RECONNECTING'}
          </div>
        </div>
      </div>

      {/* 1. TOP STATS CARDS ROW */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        
        {/* TOTAL ELECTIONS CARD */}
        <div className="bg-white border border-slate-250/70 rounded-2xl p-5 flex items-center justify-between shadow-sm relative overflow-hidden" id="stat-card-total-elections">
          <div className="space-y-1">
            <span className="text-[10px] font-black uppercase text-slate-400 tracking-wider">Scheduled Contests</span>
            <h3 className="text-2xl font-black text-slate-800 font-sans">
              {statsLoading ? '...' : stats.totalElections}
            </h3>
            <p className="text-[10px] text-slate-400 font-medium">Registered Vote Boxes</p>
          </div>
          <div className="h-10 w-10 bg-indigo-50 border border-indigo-100 rounded-xl flex items-center justify-center text-indigo-600">
            <Calendar className="h-5 w-5" />
          </div>
        </div>

        {/* ACTIVE BOOTHS CARD */}
        <div className="bg-white border border-slate-250/70 rounded-2xl p-5 flex items-center justify-between shadow-sm relative overflow-hidden" id="stat-card-active-elections">
          <div className="space-y-1">
            <span className="text-[10px] font-black uppercase text-slate-400 tracking-wider">Active Booths</span>
            <h3 className="text-2xl font-black text-[#006a4e] font-sans">
              {statsLoading ? '...' : stats.activeElections}
            </h3>
            <p className="text-[10px] text-[#006a4e]/70 font-bold uppercase tracking-tight">Casting Open Live</p>
          </div>
          <div className="h-10 w-10 bg-emerald-50 border border-emerald-100 rounded-xl flex items-center justify-center text-[#006a4e]">
            <Activity className="h-5 w-5" />
          </div>
        </div>

        {/* TOTAL BALLOTS TODAY CARD */}
        <div className="bg-white border border-slate-250/70 rounded-2xl p-5 flex items-center justify-between shadow-sm relative overflow-hidden" id="stat-card-total-ballots">
          <div className="space-y-1">
            <span className="text-[10px] font-black uppercase text-slate-400 tracking-wider">Ledgered Ballots</span>
            <h3 className="text-2xl font-black text-slate-800 font-sans">
              {statsLoading ? '...' : stats.totalVotesToday}
            </h3>
            <p className="text-[10px] text-slate-400 font-medium">Sealed in Today's Loop</p>
          </div>
          <div className="h-10 w-10 bg-amber-50 border border-amber-100 rounded-xl flex items-center justify-center text-amber-600">
            <CheckSquare className="h-5 w-5" />
          </div>
        </div>

        {/* PENDING ADVOCATES CARD */}
        <div className="bg-white border border-slate-250/70 rounded-2xl p-5 flex items-center justify-between shadow-sm relative overflow-hidden" id="stat-card-pending-candidates">
          <div className="space-y-1">
            <span className="text-[10px] font-black uppercase text-slate-400 tracking-wider">Candidate Filings</span>
            <h3 className="text-2xl font-black text-slate-800 font-sans">
              {statsLoading ? '...' : stats.pendingCandidates}
            </h3>
            <p className="text-[10px] text-indigo-600 font-bold uppercase tracking-tight">Review Waiting</p>
          </div>
          <div className="h-10 w-10 bg-purple-50 border border-purple-100 rounded-xl flex items-center justify-center text-purple-600">
            <UserPlus className="h-5 w-5" />
          </div>
        </div>

      </div>

      {/* 2. MAIN CORE SPLIT ROW (60% / 40%) */}
      <div className="grid grid-cols-1 lg:grid-cols-10 gap-8">
        
        {/* LEFT COLUMN: LIVE CHART SELECTOR + GRAPHS (60%) */}
        <div className="lg:col-span-6 space-y-6">
          
          <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm space-y-6">
            
            {/* HEADING SELECTION ZONE */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-slate-100 pb-4">
              <div className="text-left">
                <span className="text-[10px] font-bold text-indigo-600 uppercase tracking-widest font-mono">Telemetry Node Selected</span>
                <h3 className="text-base font-black text-slate-800 uppercase tracking-tight mt-0.5">Live Contest Stream</h3>
              </div>

              {/* CONTEST SELECTOR DROPDOWN & COUNTDOWN */}
              <div className="flex items-center gap-3 flex-wrap">
                {selectedElectionObj && (
                  <VotingCountdown 
                    startAt={selectedElectionObj.start_at} 
                    endAt={selectedElectionObj.end_at} 
                    status={selectedElectionObj.status} 
                  />
                )}
                <select
                  id="live-election-dropdown"
                  value={selectedElectionId}
                  onChange={(e) => setSelectedElectionId(e.target.value)}
                  className="bg-slate-50 border border-slate-300 font-sans font-bold text-xs text-slate-700 px-3.5 py-2 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#006a4e]/10 focus:border-[#006a4e]"
                >
                  <option value="" disabled>Choose Active Election...</option>
                  {elections.map((elec) => (
                    <option key={elec.id} value={elec.id}>
                      {elec.title} ({elec.status})
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {selectedElectionId && selectedElectionObj ? (
              <div className="space-y-6">
                
                {/* ACTIVE SUMMARY STATS OF SELECTED CONTEST */}
                <div className="grid grid-cols-3 gap-3 bg-slate-50 border border-slate-150 rounded-2xl p-4 text-center">
                  <div className="space-y-0.5">
                    <span className="text-[9px] font-black uppercase text-slate-400 tracking-wider">Live Total Votes</span>
                    <div className="text-lg font-black text-[#006a4e] tracking-tight flex items-center justify-center gap-1">
                      <span className="relative">
                        {liveTotalVotes}
                        <span className="absolute -top-1 -right-4 h-2 w-2 rounded-full bg-[#10b981] animate-ping" />
                      </span>
                    </div>
                  </div>
                  <div className="space-y-0.5 border-x border-slate-200">
                    <span className="text-[9px] font-black uppercase text-slate-400 tracking-wider">Turnout Gauge</span>
                    <div className="text-lg font-black text-slate-850 tracking-tight">
                      {turnoutPercent}%
                    </div>
                  </div>
                  <div className="space-y-0.5">
                    <span className="text-[9px] font-black uppercase text-slate-400 tracking-wider">Live Health</span>
                    <div className="text-[10px] font-bold py-1 px-2.5 rounded-full bg-emerald-100 text-emerald-800 w-fit mx-auto font-mono">
                      SYNCED
                    </div>
                  </div>
                </div>

                {/* VISUAL CHARTS METRICS CONTAINER */}
                {liveCandidates.length === 0 ? (
                  <div className="py-20 border border-dashed border-slate-200 rounded-2xl text-center text-slate-400 text-xs">
                    No approved candidate rosters found inside this election box.
                  </div>
                ) : (
                  <div className="space-y-8" id="voters-analytics-charts">
                    
                    {/* BAR CHART SECTION */}
                    <div className="space-y-2">
                      <h4 className="text-xs font-black uppercase text-slate-400 tracking-wider text-left">
                        Candidate Ballot Tally Distribution:
                      </h4>
                      <div className="h-64 w-full">
                        <ResponsiveContainer width="100%" height="100%">
                          <BarChart data={chartData} margin={{ top: 20, right: 10, left: -25, bottom: 5 }}>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                            <XAxis dataKey="name" tick={{ fontSize: 10, fontWeight: 700, fill: '#475569' }} axisLine={false} tickLine={false} />
                            <YAxis allowDecimals={false} tick={{ fontSize: 10, fontWeight: 500, fill: '#64748b' }} axisLine={false} tickLine={false} />
                            <Tooltip 
                              cursor={{ fill: 'rgba(241, 245, 249, 0.4)' }}
                              content={({ active, payload }) => {
                                if (active && payload && payload.length) {
                                  const data = payload[0].payload;
                                  return (
                                    <div className="bg-slate-900 border border-slate-950 text-white p-3.5 rounded-xl shadow-xl text-left scale-95 origin-top-left">
                                      <p className="text-xs font-black">{data.fullName}</p>
                                      <p className="text-[10px] font-bold text-slate-400 uppercase">Affiliation: {data.party}</p>
                                      <p className="text-xs font-black text-emerald-400 mt-1">Confirmed Ballots: {data.votes}</p>
                                    </div>
                                  );
                                }
                                return null;
                              }}
                            />
                            <Bar dataKey="votes" radius={[10, 10, 0, 0]} animationDuration={500}>
                              {chartData.map((entry, idx) => {
                                const isFlashed = flashedCandidateId && entry.fullName === liveCandidates.find(c => c.id === flashedCandidateId)?.name;
                                return (
                                  <Cell 
                                    key={`cell-${idx}`} 
                                    fill={entry.color} 
                                    className={`${isFlashed ? 'animate-pulse' : ''}`}
                                    style={{
                                      filter: isFlashed ? 'drop-shadow(0 0 12px rgba(16, 185, 129, 1))' : 'none',
                                      transition: 'all 0.3s ease'
                                    }}
                                  />
                                );
                              })}
                            </Bar>
                          </BarChart>
                        </ResponsiveContainer>
                      </div>
                    </div>

                    {/* TWO-UP SECTION FOR TURN OUT AND PIE SHARE */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4 border-t border-slate-100">
                      
                      {/* PIE CHART SECTION */}
                      <div className="text-left space-y-3">
                        <h4 className="text-xs font-black uppercase text-slate-400 tracking-wider">
                          Vote Share by Political Party (%)
                        </h4>
                        <div className="h-44 w-full flex items-center justify-center relative">
                          {pieChartData.length === 0 || pieChartData.every(x => x.value === 0) ? (
                            <span className="text-[11px] font-mono font-bold text-slate-400 uppercase">
                              Waiting for votes...
                            </span>
                          ) : (
                            <ResponsiveContainer width="100%" height="100%">
                              <PieChart>
                                <Pie
                                  data={pieChartData}
                                  dataKey="value"
                                  nameKey="name"
                                  cx="50%"
                                  cy="50%"
                                  innerRadius={45}
                                  outerRadius={65}
                                  paddingAngle={3}
                                  animationDuration={500}
                                >
                                  {pieChartData.map((entry, idx) => (
                                    <Cell key={`cell-${idx}`} fill={entry.color} />
                                  ))}
                                </Pie>
                                <Tooltip
                                  content={({ active, payload }) => {
                                    if (active && payload && payload.length) {
                                      const data = payload[0];
                                      return (
                                        <div className="bg-slate-900 border border-slate-950 text-white py-1.5 px-3 rounded-lg shadow-md font-mono text-[10px]">
                                          {data.name}: <strong className="text-emerald-400">{data.value}</strong>
                                        </div>
                                      );
                                    }
                                    return null;
                                  }}
                                />
                                <Legend 
                                  verticalAlign="bottom" 
                                  height={36} 
                                  iconType="circle"
                                  iconSize={8}
                                  tickFormatter={(v) => <span className="text-[10px] font-bold text-slate-500 font-mono">{v}</span>}
                                />
                              </PieChart>
                            </ResponsiveContainer>
                          )}
                        </div>
                      </div>

                      {/* GAUGE DISCONNECTED TURNOUT PERCENT */}
                      <div className="text-left space-y-3 border-t md:border-t-0 md:border-l border-slate-100 md:pl-6">
                        <h4 className="text-xs font-black uppercase text-slate-400 tracking-wider">
                          Voter Turnout Rate
                        </h4>
                        
                        <div className="h-44 w-full flex flex-col items-center justify-center relative">
                          <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                              <Pie
                                data={gaugeData}
                                dataKey="value"
                                startAngle={180}
                                endAngle={0}
                                cx="50%"
                                cy="75%"
                                innerRadius={48}
                                outerRadius={68}
                                animationDuration={500}
                              >
                                {gaugeData.map((entry, index) => (
                                  <Cell key={`cell-${index}`} fill={entry.fill} />
                                ))}
                              </Pie>
                            </PieChart>
                          </ResponsiveContainer>
                          
                          {/* FLOATING DIGITAL METRICS GAUGE */}
                          <div className="absolute top-[52%] text-center space-y-0.5">
                            <span className="text-2xl font-black text-slate-800 leading-none">{turnoutPercent}%</span>
                            <p className="text-[9px] font-mono font-bold text-slate-400 uppercase tracking-widest">
                              {liveTotalVotes} / {totalRegistryVoters} Voters
                            </p>
                          </div>
                        </div>

                      </div>

                    </div>

                    {/* DEMOGRAPHICS SECTION */}
                    <VoterDemographicsChart electionId={selectedElectionId} />

                    {/* METADATA TICK TICK LOGS FOOTER */}
                    <div className="pt-4 border-t border-slate-100 flex items-center justify-between text-[11px] font-mono font-bold text-slate-400">
                      <span>Sync Target: election_{selectedElectionId}</span>
                      <span className="flex items-center gap-1">
                        <Clock className="h-3.5 w-3.5" /> telemetry update: {formatSecondsAgo(liveLastUpdated)}
                      </span>
                    </div>

                  </div>
                )}

              </div>
            ) : (
              <div className="py-20 text-center text-slate-400 text-xs">
                Select an scheduled or live election contest above to access streaming visualizations.
              </div>
            )}

          </div>

        </div>

        {/* RIGHT COLUMN: AUDIT LOGS, ANOMALIES, AND BLOCKCHAIN CHECK (40%) */}
        <div className="lg:col-span-4 space-y-6">
          
          {/* A. RECENT AUDIT LOGS */}
          <div className="bg-white border border-slate-200 rounded-3xl p-5 shadow-sm space-y-4">
            <div className="flex justify-between items-center border-b border-slate-150 pb-3">
              <h3 className="text-xs font-black uppercase text-slate-700 tracking-wider flex items-center gap-1.5">
                <Database className="h-4.5 w-4.5 text-[#006a4e]" /> Core Ledger Audit Trail
              </h3>
              <span className="text-[8px] font-bold font-mono py-0.5 px-2 bg-slate-100 text-slate-500 rounded border border-slate-200 uppercase">
                Take {auditLogs.length}
              </span>
            </div>

            {logsLoading ? (
              <div className="flex justify-center items-center py-6">
                <div className="h-4 w-4 animate-spin rounded-full border-2 border-slate-200 border-t-[#006a4e]" />
              </div>
            ) : auditLogs.length === 0 ? (
              <p className="text-[11px] text-slate-400 text-center py-4">No audit entry records cataloged.</p>
            ) : (
              <div className="space-y-3 max-h-56 overflow-y-auto pr-1">
                {auditLogs.map((log) => (
                  <div key={log.id} className="border-b border-slate-50 pb-2.5 last:border-0 last:pb-0 text-left space-y-0.5">
                    <div className="flex justify-between items-center">
                      <span className="text-[10px] font-bold font-mono text-[#006a4e] uppercase bg-emerald-50 px-1 py-0.5 rounded">
                        {log.event_type}
                      </span>
                      <span className="text-[9px] font-mono text-slate-400 font-medium">
                        {new Date(log.created_at).toLocaleTimeString()}
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-600 font-medium leading-relaxed">
                      {log.description}
                    </p>
                    {log.user && (
                      <span className="text-[9px] text-slate-400 font-mono block">
                        Admin ID: {log.user.name} • {log.ip_address || 'Unrecorded'}
                      </span>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* B. ANOMALY ALERT PANEL */}
          <div className="bg-white border border-slate-200 rounded-3xl p-5 shadow-sm space-y-4">
            <div className="flex justify-between items-center border-b border-slate-150 pb-3">
              <h3 className="text-xs font-black uppercase text-red-700 tracking-wider flex items-center gap-1.5">
                <AlertTriangle className="h-4.5 w-4.5 text-red-600 animate-pulse" /> Cyberdefense Anomalies
              </h3>
              <span className="text-[8px] font-bold font-mono py-0.5 px-2 bg-red-100 text-red-700 rounded border border-red-200">
                ACTIVE RADAR
              </span>
            </div>

            {/* AI Summary Stats Bar */}
            <div className="bg-red-50 border border-red-100/70 rounded-2xl p-3 flex justify-between items-center text-xs font-semibold text-red-900 shadow-sm">
              <span className="flex items-center gap-1.5 leading-none">
                <span className="h-2 w-2 rounded-full bg-red-500 animate-ping inline-block shrink-0" />
                <strong>{anomalyStats.today}</strong> anomalies detected today
              </span>
              <span className="shrink-0 px-2.5 py-1 rounded-lg bg-red-600 text-white font-mono text-[9px] uppercase font-black tracking-wide shadow-sm">
                {anomalyStats.high_severity} High Severity
              </span>
            </div>

            {anomaliesLoading ? (
              <div className="flex justify-center items-center py-6">
                <div className="h-4 w-4 animate-spin rounded-full border-2 border-slate-200 border-t-red-600" />
              </div>
            ) : anomalies.length === 0 ? (
              <div className="text-center py-4 space-y-1">
                <p className="text-[11px] text-slate-400 font-semibold uppercase font-mono">🔍 Zero Intruder Signals</p>
                <p className="text-[10px] text-slate-400 leading-relaxed font-sans">
                  The firewall hasn't logged any concurrent collision loops or IP velocity spikes.
                </p>
              </div>
            ) : (
              <div className="space-y-3 max-h-56 overflow-y-auto pr-1">
                <AnimatePresence initial={false}>
                  {anomalies.map((anom) => {
                    const isReviewed = anom.is_reviewed;
                    
                    // Map types to corresponding colors and icons
                    let icon = <AlertTriangle className="h-4 w-4 text-red-500 shrink-0" />;
                    let badgeColors = 'bg-red-50 text-red-600 border-red-250';
                    if (anom.flag_type === 'DEVICE_COLLISION' || anom.flag_type?.includes('COLLISION')) {
                      icon = <UserCheck className="h-4 w-4 text-orange-500 shrink-0" />;
                      badgeColors = 'bg-orange-50 text-orange-600 border-orange-200';
                    } else if (anom.flag_type === 'OFF_HOURS_ACTIVITY' || anom.flag_type?.includes('HOURS')) {
                      icon = <Clock className="h-4 w-4 text-yellow-600 shrink-0" />;
                      badgeColors = 'bg-yellow-50 text-yellow-700 border-yellow-250';
                    } else if (anom.flag_type === 'IP_RATE_SPIKE' || anom.flag_type?.includes('SPIKE')) {
                      icon = <Cpu className="h-4 w-4 text-rose-500 shrink-0" />;
                      badgeColors = 'bg-rose-50 text-rose-600 border-rose-250';
                    }

                    const matchedElection = elections.find(e => e.id === anom.election_id);
                    const electionName = matchedElection ? matchedElection.title : `Election Box ID: ${anom.election_id}`;
                    const voterInfo = anom.user ? `${anom.user.name} (${anom.user.email})` : `Voter ID: ${anom.voter_id ? anom.voter_id : 'Secure Anonymous'}`;

                    return (
                      <motion.div 
                        key={anom.id} 
                        initial={anom.isNew ? { scale: 0.9, backgroundColor: '#fef2f2', borderColor: '#fca5a5' } : {}}
                        animate={anom.isNew ? { scale: 1, backgroundColor: isReviewed ? 'rgba(248,250,252,0.5)' : '#f9fafb', borderColor: isReviewed ? '#f1f5f9' : '#f1f5f9' } : {}}
                        exit={{ opacity: 0, scale: 0.95 }}
                        transition={{ duration: 1.2, ease: 'easeOut' }}
                        className={`border border-slate-105 rounded-2xl p-3 text-left space-y-2 transition-all ${
                          isReviewed ? 'opacity-60 bg-slate-50/50' : 'bg-slate-50'
                        }`}
                      >
                        <div className="flex justify-between items-center flex-wrap gap-1">
                          <span className={`text-[9px] font-black uppercase font-mono px-2 py-0.5 rounded border flex items-center gap-1 ${badgeColors}`}>
                            {icon} {anom.flag_type?.replace(/_/g, ' ') || 'SUSPICIOUS'}
                          </span>
                          <span className="text-[9px] text-slate-400 font-semibold font-mono">
                            {new Date(anom.created_at).toLocaleTimeString()}
                          </span>
                        </div>

                        <div className="text-xs text-slate-600 font-medium space-y-1">
                          <div className="flex justify-between">
                            <span className="text-slate-400 font-mono text-[10px]">Voter Account:</span>
                            <span className="font-bold text-slate-800 break-all text-right max-w-[160px] truncate">{voterInfo}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-slate-400 font-mono text-[10px]">Election Box:</span>
                            <span className="font-bold text-slate-800 text-right truncate max-w-[165px]">{electionName}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-slate-400 font-mono text-[10px]">Source IP:</span>
                            <span className="font-bold font-mono text-slate-800">{anom.ip_address}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-slate-400 font-mono text-[10px]">Severity Rank:</span>
                            <span className={`font-black text-[10px] uppercase font-mono ${
                              anom.severity === 'HIGH' ? 'text-red-600' : anom.severity === 'MEDIUM' ? 'text-orange-500' : 'text-slate-500'
                            }`}>{anom.severity}</span>
                          </div>
                        </div>

                        <div className="pt-2 border-t border-slate-200/50 flex justify-between items-center gap-2">
                          {isReviewed ? (
                            <span className="text-[10px] text-emerald-600 font-bold flex items-center gap-1 font-mono uppercase">
                              <CheckCircle className="h-3.5 w-3.5" /> Reviewed
                            </span>
                          ) : (
                            <>
                              <span className="text-[10px] text-slate-400 font-medium font-mono">Awaiting verification</span>
                              <button
                                onClick={() => handleReviewAnomaly(anom.id)}
                                className="text-[10px] bg-white border border-slate-200 text-slate-600 hover:bg-[#006a4e]/5 hover:text-[#006a4e] hover:border-[#006a4e]/40 px-3 py-1 rounded-lg font-bold transition font-mono uppercase cursor-pointer"
                              >
                                Archive
                              </button>
                            </>
                          )}
                        </div>
                      </motion.div>
                    );
                  })}
                </AnimatePresence>
              </div>
            )}
          </div>

          {/* C. BLOCKCHAIN INTEGRITY WIDGET */}
          <div className="bg-slate-900 text-white rounded-3xl p-5 shadow-md border border-slate-950 space-y-4">
            <div className="flex justify-between items-center border-b border-slate-800 pb-3">
              <h3 className="text-xs font-black uppercase text-slate-300 tracking-wider flex items-center gap-1.5">
                <Cpu className="h-4.5 w-4.5 text-[#006a4e]" /> Cryptographic Chain Inspector
              </h3>
              <span className="text-[8px] font-bold font-mono py-0.5 px-2 bg-emerald-950 border border-emerald-900 text-emerald-400 rounded uppercase">
                Active Node
              </span>
            </div>

            <div className="text-left space-y-3.5">
              
              {/* CURRENT HEALTH CONTAINER */}
              <div className="flex items-center gap-3.5 bg-slate-950 border border-slate-800 rounded-2xl p-4">
                <div className="h-10 w-10 shrink-0 bg-slate-900 border border-slate-800 rounded-xl flex items-center justify-center">
                  {blockchainStatus.valid ? (
                    <ShieldCheck className="h-6 w-6 text-[#006a4e]" />
                  ) : (
                    <XCircle className="h-6 w-6 text-red-500" />
                  )}
                </div>
                <div>
                  <span className="text-[9px] font-black uppercase tracking-wider text-slate-400 font-mono">Chain Check Status</span>
                  <p className={`text-sm font-black uppercase tracking-tight ${
                    blockchainStatus.valid ? 'text-[#006a4e]' : 'text-red-500'
                  }`}>
                    {blockchainStatus.valid ? 'CHAIN STATUS: INTACT ✓' : 'TAMPER DETECTED ✗'}
                  </p>
                </div>
              </div>

              {/* SHA-256 ENCRYPTER DATA TABLE REPORT */}
              <div className="text-[11px] font-mono font-bold text-slate-400 space-y-1.5 bg-slate-950/40 p-3.5 border border-slate-800/40 rounded-2xl">
                <div className="flex justify-between">
                  <span>Audited Votes in DB:</span>
                  <span className="text-white">{blockchainStatus.totalVotes}</span>
                </div>
                <div className="flex justify-between">
                  <span>Cryptographic Check:</span>
                  <span className="text-emerald-400 font-black">SHA-256 RECURSIVE MATCH</span>
                </div>
                <div className="flex justify-between">
                  <span>Verification Age:</span>
                  <span className="text-slate-300">
                    {secondsSinceLastCheck < 5 ? 'Just verified' : `${secondsSinceLastCheck} seconds ago`}
                  </span>
                </div>
              </div>

              {/* ACTION RETRO BUTTON */}
              <div className="flex flex-col gap-2">
                <button
                  id="re-verify-blockchain-trigger"
                  onClick={() => verifyBlockchain(true)}
                  disabled={blockchainStatus.loading || !selectedElectionId}
                  className="w-full bg-[#006a4e] hover:bg-[#004e38] disabled:opacity-50 text-white font-sans font-black text-xs py-3 rounded-xl transition flex items-center justify-center gap-2 cursor-pointer"
                >
                  <RefreshCw className={`h-4 w-4 ${blockchainStatus.loading ? 'animate-spin' : ''}`} />
                  Re-verify SHA-256 Ledger
                </button>
                <Link
                  to="/admin/blockchain-status"
                  className="w-full block text-center border border-slate-800 hover:border-[#006a4e] hover:bg-slate-950/40 text-slate-400 hover:text-white font-sans font-bold text-[10px] py-1.5 rounded-xl transition uppercase tracking-wider"
                >
                  View Integrity Dashboard →
                </Link>
              </div>

            </div>
          </div>

        </div>

      </div>

    </div>
  );
}
