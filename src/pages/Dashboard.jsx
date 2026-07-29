import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { 
  ShieldCheck, 
  Vote, 
  FileText, 
  Car, 
  Home, 
  HeartHandshake, 
  Clock, 
  ArrowRight, 
  Eye, 
  HelpCircle,
  Database,
  Hash,
  Activity,
  CheckCircle,
  X,
  AlertTriangle,
  Sparkles
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext.jsx';
import api from '../lib/api.js';
import DigitalIdentityCard from '../shared/components/DigitalIdentityCard.jsx';

export default function Dashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [summary, setSummary] = useState(null);
  const [activityList, setActivityList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Ledger Verification Popup Modal State
  const [selectedRecordId, setSelectedRecordId] = useState(null);
  const [verifyingRecord, setVerifyingRecord] = useState(false);
  const [recordFootprint, setRecordFootprint] = useState(null);

  useEffect(() => {
    async function loadDashboardData() {
      try {
        setLoading(true);
        // Dispatch both parallel requests cleanly to prevent waterfalls
        const [sumRes, actRes] = await Promise.all([
          api.get('/citizen/summary'),
          api.get('/citizen/activity')
        ]);
        
        setSummary(sumRes.data);
        setActivityList(actRes.data);
      } catch (err) {
        console.error('Failed to sync OneID digital state:', err);
        setError('Could not retrieve active e-governance ledger summary.');
      } finally {
        setLoading(false);
      }
    }
    loadDashboardData();
  }, []);

  // Handle showing immutable block verification
  const handleVerifyLedger = async (recordId) => {
    try {
      setSelectedRecordId(recordId);
      setVerifyingRecord(true);
      setRecordFootprint(null);
      
      const footprintRes = await api.get(`/ledger/record/${recordId}`);
      setRecordFootprint(footprintRes.data);
    } catch (err) {
      console.warn('Could not verify block footprint:', err);
      setRecordFootprint({ found: false, error: 'Record block metadata is unsealed or pending.' });
    } finally {
      setVerifyingRecord(false);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-4">
        <div className="w-12 h-12 border-4 border-[#006A4E] border-t-transparent rounded-full animate-spin" />
        <p className="text-sm font-semibold text-gray-600 font-mono">Verifying cryptography security thread tunnels...</p>
      </div>
    );
  }

  if (error || !summary) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-2xl p-6 text-center max-w-lg mx-auto">
        <AlertTriangle className="w-12 h-12 text-[#F42A41] mx-auto mb-4" />
        <h3 className="font-extrabold text-red-800">Connection Error</h3>
        <p className="text-xs text-red-600 mt-2">{error || 'An error occurred fetching dashboard statistics'}</p>
        <button 
          onClick={() => window.location.reload()} 
          className="mt-4 px-4 py-2 bg-[#F42A41] text-white rounded-lg text-xs font-semibold"
        >
          Retry Connection
        </button>
      </div>
    );
  }

  // Group activity logs by calendar day
  const groupedActivities = activityList.reduce((groups, act) => {
    const day = new Date(act.timestamp).toLocaleDateString('en-GB', { 
      day: 'numeric', 
      month: 'long', 
      year: 'numeric' 
    });
    if (!groups[day]) groups[day] = [];
    groups[day].push(act);
    return groups;
  }, {});

  const initials = user?.name
    ? user.name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()
    : 'BD';

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      
      {/* TOP SECTION — OneID Identity Card & 2x2 Stats Dashboard & Digital Identity Card Visualizer */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Left Columns: Greeting & 2x2 Stats */}
        <section className="lg:col-span-2 relative overflow-hidden bg-white rounded-2xl border border-gray-200 shadow-sm p-6 md:p-8 flex flex-col justify-between" id="oneid-identity-card">
          {/* Left Green border accent */}
          <div className="absolute left-0 top-0 bottom-0 w-1.5 bg-[#006A4E]" />
          
          <div className="flex flex-col xl:flex-row gap-8 justify-between items-stretch h-full">
            
            {/* Left Block: Avatar and Selectable Monospace OneID */}
            <div className="flex flex-col sm:flex-row gap-6 items-center sm:items-start flex-1 text-center sm:text-left">
              <div className="w-20 h-20 rounded-full bg-[#006A4E] text-white flex items-center justify-center font-bold text-2xl border-4 border-emerald-50 shadow-md shrink-0">
                {initials}
              </div>
              
              <div className="space-y-3 flex-1 min-w-0">
                <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2">
                  <h1 className="text-2xl font-black text-gray-900 tracking-tight flex items-center gap-1.5 flex-wrap">
                    <span className="font-bangla text-[#006A4E] font-extrabold text-xl pr-1">স্বাগতম,</span>
                    <span>{user?.name}</span>
                  </h1>
                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-[#006A4E]/10 text-[#006A4E] border border-[#006A4E]/20">
                    <ShieldCheck className="w-3.5 h-3.5" /> ✓ OneID Verified
                  </span>
                </div>
                
                <div className="space-y-0.5 text-left">
                  <span className="text-[10px] uppercase font-bold text-gray-400 font-mono tracking-wider block">Verified System ID Key:</span>
                  <p className="text-xl font-mono text-[#006A4E] font-bold select-all bg-gray-50 px-3 py-1 rounded-md border border-gray-100 inline-block tracking-wider">
                    {user?.oneid || 'BD-PENDING'}
                  </p>
                </div>

                <div className="flex items-center justify-center sm:justify-start gap-2 text-xs text-gray-500 font-medium">
                  <Clock className="w-4 h-4 text-gray-400" />
                  <span>Last login timestamp: {new Date().toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true })} today</span>
                </div>
              </div>
            </div>

            {/* Right Block: 2x2 Statistics Grid */}
            <div className="grid grid-cols-2 gap-4 lg:gap-6 min-w-full sm:min-w-[320px] xl:min-w-[380px] border-t xl:border-t-0 xl:border-l border-gray-100 pt-6 xl:pt-0 xl:pl-8">
              
              <div className="bg-gray-50/50 p-4 rounded-xl border border-gray-100 flex flex-col justify-center">
                <span className="text-[10px] text-gray-500 uppercase font-semibold block mb-1">Active Votes</span>
                <div className="flex items-center gap-2">
                  <span className="text-lg font-black text-[#7C3AED]">
                    {summary.voting.activeElections}
                  </span>
                  <span className="text-[10px] text-gray-500">Scheduled Actions</span>
                </div>
              </div>

              <div className="bg-gray-50/50 p-4 rounded-xl border border-gray-100 flex flex-col justify-center">
                <span className="text-[10px] text-gray-500 uppercase font-semibold block mb-1">Tax Code Status</span>
                <div className="flex items-center gap-2">
                  <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-bold ${
                    summary.tax.currentYearFiled 
                      ? 'bg-emerald-50 text-emerald-700' 
                      : 'bg-amber-50 text-amber-700'
                  }`}>
                    {summary.tax.currentYearFiled ? 'Filed' : 'Unfiled'}
                  </span>
                  <span className="text-[10px] text-gray-500">Current Year</span>
                </div>
              </div>

              <div className="bg-gray-50/50 p-4 rounded-xl border border-gray-100 flex flex-col justify-center">
                <span className="text-[10px] text-gray-500 uppercase font-semibold block mb-1">Vehicles Owned</span>
                <div className="flex items-center gap-2">
                  <span className="text-lg font-black text-[#0F6E56]">
                    {summary.vehicles.owned}
                  </span>
                  <span className="text-[10px] text-gray-500">Registered</span>
                </div>
              </div>

              <div className="bg-gray-50/50 p-4 rounded-xl border border-gray-100 flex flex-col justify-center">
                <span className="text-[10px] text-gray-500 uppercase font-semibold block mb-1">Marriage status</span>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-extrabold capitalize text-[#D4537E]">
                    {summary.civil.maritalStatus.toLowerCase()}
                  </span>
                  <span className="text-[10px] text-gray-400 font-mono">Lock Status</span>
                </div>
              </div>

            </div>

          </div>
        </section>

        {/* Right Column: Interactive Digital Identity Card */}
        <section className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6 flex flex-col justify-between">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm uppercase font-black text-gray-500 tracking-wider">Sovereign e-ID Card</h3>
              <span className="text-[10px] font-mono bg-emerald-50 text-[#006A4E] py-0.5 px-2 rounded-full font-bold flex items-center gap-1 shadow-sm">
                <Sparkles className="w-3 h-3 text-emerald-600 animate-pulse" /> 3D Biometric
              </span>
            </div>
            <p className="text-[11px] text-gray-500 leading-normal">
              Hover to tilt the biometric chip. Tap the card layout directly or trigger action controls below to toggle Front/Back QR state.
            </p>
            <DigitalIdentityCard user={user} />
          </div>
        </section>

      </div>

      {/* MIDDLE SECTION — Module Launcher Grid */}
      <section className="space-y-4">
        <h3 className="text-sm uppercase font-black text-gray-500 tracking-wider">Secure Governance Panels</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
          
          {/* Card 1: Voting */}
          <div className="group relative overflow-hidden bg-white rounded-xl border border-gray-200/60 p-5 shadow-sm hover:shadow-md hover:border-[#7C3AED]/40 transition-all flex flex-col justify-between" id="panel-voting">
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <div className="w-10 h-10 rounded-lg bg-[#7C3AED]/10 flex items-center justify-center text-[#7C3AED] group-hover:scale-105 transition-transform">
                  <Vote className="w-5 h-5" />
                </div>
                <Link to="/voter/history" className="text-[10px] font-bold text-[#7C3AED] hover:underline flex items-center gap-0.5">
                  Receipts <ArrowRight className="w-3 h-3" />
                </Link>
              </div>
              <div>
                <h4 className="font-extrabold text-gray-900 group-hover:text-[#7C3AED] transition-colors leading-snug flex items-center justify-between gap-1">
                  <Link to="/elections" className="hover:underline">Voter Card</Link>
                  <span className="font-bangla font-semibold text-[10px] text-[#7C3AED] bg-[#7C3AED]/10 px-1.5 py-0.5 rounded-md">ভোটিং</span>
                </h4>
                <p className="text-[10px] text-gray-500 mt-1">Zero-knowledge proof ballot cabinet & receipts</p>
              </div>
            </div>
            <div className="flex items-center justify-between border-t border-gray-50 mt-4 pt-3 text-xs leading-none">
              <Link to="/elections" className="font-mono font-bold text-[#7C3AED] hover:underline">
                {summary.voting.activeElections} Active election{summary.voting.activeElections === 1 ? '' : 's'}
              </Link>
              <Link to="/voter/history" className="text-gray-400 hover:text-[#7C3AED]">
                <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
              </Link>
            </div>
          </div>

          {/* Card 2: Tax */}
          <Link 
            to="/tax" 
            className="group relative overflow-hidden bg-white rounded-xl border border-gray-200/60 p-5 shadow-sm hover:shadow-md hover:border-[#D97706]/40 transition-all flex flex-col justify-between"
            id="panel-tax"
          >
            <div className="space-y-4">
              <div className="w-10 h-10 rounded-lg bg-[#D97706]/10 flex items-center justify-center text-[#D97706] group-hover:scale-105 transition-transform">
                <FileText className="w-5 h-5" />
              </div>
              <div>
                <h4 className="font-extrabold text-gray-900 group-hover:text-[#D97706] transition-colors leading-snug flex items-center justify-between gap-1">
                  <span>Tax Balance</span>
                  <span className="font-bangla font-semibold text-[10px] text-[#D97706] bg-[#D97706]/10 px-1.5 py-0.5 rounded-md">কর</span>
                </h4>
                <p className="text-[10px] text-gray-500 mt-1">Digital TIN profile and receipts</p>
              </div>
            </div>
            <div className="flex items-center justify-between border-t border-gray-50 mt-4 pt-3 text-xs leading-none">
              <span className="font-mono font-bold text-[#D97706]">
                {summary.tax.totalUnpaid > 0 ? `BDT ${summary.tax.totalUnpaid.toLocaleString()}` : 'Settled / Clear'}
              </span>
              <ArrowRight className="w-3.5 h-3.5 text-gray-400 group-hover:translate-x-1 transition-transform" />
            </div>
          </Link>

          {/* Card 3: Vehicles */}
          <Link 
            to="/vehicle" 
            className="group relative overflow-hidden bg-white rounded-xl border border-gray-200/60 p-5 shadow-sm hover:shadow-md hover:border-[#0F6E56]/40 transition-all flex flex-col justify-between"
            id="panel-vehicles"
          >
            <div className="space-y-4">
              <div className="w-10 h-10 rounded-lg bg-[#0F6E56]/10 flex items-center justify-center text-[#0F6E56] group-hover:scale-105 transition-transform">
                <Car className="w-5 h-5" />
              </div>
              <div>
                <h4 className="font-extrabold text-gray-900 group-hover:text-[#0F6E56] transition-colors leading-snug flex items-center justify-between gap-1">
                  <span>Garage</span>
                  <span className="font-bangla font-semibold text-[10px] text-[#0F6E56] bg-[#0F6E56]/10 px-1.5 py-0.5 rounded-md">যানবাহন</span>
                </h4>
                <p className="text-[10px] text-gray-500 mt-1">Sovereign driving license registry</p>
              </div>
            </div>
            <div className="flex items-center justify-between border-t border-gray-50 mt-4 pt-3 text-xs leading-none">
              <span className="font-mono font-bold text-[#0F6E56]">
                {summary.vehicles.owned} owned / {summary.vehicles.pendingTransfers} pending
              </span>
              <ArrowRight className="w-3.5 h-3.5 text-gray-400 group-hover:translate-x-1 transition-transform" />
            </div>
          </Link>

          {/* Card 4: Property */}
          <Link 
            to="/property" 
            className="group relative overflow-hidden bg-white rounded-xl border border-gray-200/60 p-5 shadow-sm hover:shadow-md hover:border-[#D85A30]/40 transition-all flex flex-col justify-between"
            id="panel-property"
          >
            <div className="space-y-4">
              <div className="w-10 h-10 rounded-lg bg-[#D85A30]/10 flex items-center justify-center text-[#D85A30] group-hover:scale-105 transition-transform">
                <Home className="w-5 h-5" />
              </div>
              <div>
                <h4 className="font-extrabold text-gray-900 group-hover:text-[#D85A30] transition-colors leading-snug flex items-center justify-between gap-1">
                  <span>Deeds</span>
                  <span className="font-bangla font-semibold text-[10px] text-[#D85A30] bg-[#D85A30]/10 px-1.5 py-0.5 rounded-md">সম্পত্তি</span>
                </h4>
                <p className="text-[10px] text-gray-500 mt-1">Land records and smart transfers</p>
              </div>
            </div>
            <div className="flex items-center justify-between border-t border-gray-50 mt-4 pt-3 text-xs leading-none">
              <span className="font-mono font-bold text-[#D85A30]">
                {summary.property.owned} plot{summary.property.owned === 1 ? '' : 's'} registered
              </span>
              <ArrowRight className="w-3.5 h-3.5 text-gray-400 group-hover:translate-x-1 transition-transform" />
            </div>
          </Link>

          {/* Card 5: Civil Registry */}
          <Link 
            to="/civil-registry" 
            className="group relative overflow-hidden bg-white rounded-xl border border-gray-200/60 p-5 shadow-sm hover:shadow-md hover:border-[#D4537E]/40 transition-all flex flex-col justify-between"
            id="panel-civil"
          >
            <div className="space-y-4">
              <div className="w-10 h-10 rounded-lg bg-[#D4537E]/10 flex items-center justify-center text-[#D4537E] group-hover:scale-105 transition-transform">
                <HeartHandshake className="w-5 h-5" />
              </div>
              <div>
                <h4 className="font-extrabold text-gray-900 group-hover:text-[#D4537E] transition-colors leading-snug flex items-center justify-between gap-1">
                  <span>Marital Cabinet</span>
                  <span className="font-bangla font-semibold text-[10px] text-[#D4537E] bg-[#D4537E]/10 px-1.5 py-0.5 rounded-md">সিভিল</span>
                </h4>
                <p className="text-[10px] text-gray-500 mt-1">Kazi records and legal proceedings</p>
              </div>
            </div>
            <div className="flex items-center justify-between border-t border-gray-50 mt-4 pt-3 text-xs leading-none">
              <span className="font-mono font-bold text-[#D4537E]">
                {summary.civil.activeDivorceProceeding ? 'Divorce pending' : 'No proceedings'}
              </span>
              <ArrowRight className="w-3.5 h-3.5 text-gray-400 group-hover:translate-x-1 transition-transform" />
            </div>
          </Link>

        </div>
      </section>

      {/* BOTTOM SECTION — Activity Feed & Security Checklist */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Left Grid: Immutable Audit Logs Activity Feed */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm uppercase font-black text-gray-500 tracking-wider">Secured Security Audit History</h3>
            <span className="text-[10px] font-mono font-bold text-gray-400 flex items-center gap-1">
              <Activity className="w-3 h-3" /> Real-time node feed
            </span>
          </div>

          <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6 space-y-6">
            {activityList.length === 0 ? (
              <div className="text-center py-10">
                <HelpCircle className="w-10 h-10 text-gray-300 mx-auto mb-2" />
                <p className="text-xs text-gray-500">No historic security interactions tracked under this credential link.</p>
              </div>
            ) : (
              Object.entries(groupedActivities).map(([day, acts]) => (
                <div key={day} className="space-y-3">
                  <span className="text-[10px] font-bold text-[#006A4E] uppercase tracking-wider block bg-emerald-50 py-0.5 px-2 rounded-md inline-block">
                    {day}
                  </span>
                  
                  <div className="space-y-4 pl-2 border-l border-gray-100">
                    {acts.map((act) => {
                      // Determine theme parameters strictly for module markers
                      let color = '#4B5563'; // Grey default
                      if (act.module === 'Voting') color = '#7C3AED';
                      else if (act.module === 'Tax') color = '#D97706';
                      else if (act.module === 'Vehicles') color = '#0F6E56';
                      else if (act.module === 'Property') color = '#D85A30';
                      else if (act.module === 'Civil') color = '#D4537E';

                      return (
                        <div key={act.id} className="flex gap-4 items-start justify-between group">
                          <div className="flex gap-3 items-start min-w-0">
                            <span 
                              style={{ backgroundColor: color }} 
                              className="w-2.5 h-2.5 rounded-full mt-1.5 shrink-0 shadow-inner group-hover:scale-110 transition-transform" 
                            />
                            <div className="min-w-0">
                              <p className="text-xs font-semibold text-gray-900 leading-normal">{act.action}</p>
                              <div className="flex items-center gap-2 mt-0.5 text-[10px] text-gray-400 font-mono">
                                <span>{new Date(act.timestamp).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true })}</span>
                                <span>•</span>
                                <span className="capitalize">{act.module} sector</span>
                              </div>
                            </div>
                          </div>

                          {/* Immutable Ledger Verification Badge if exists */}
                          {act.ledgerRecordId ? (
                            <button
                              onClick={() => handleVerifyLedger(act.ledgerRecordId)}
                              className="ml-2 shrink-0 py-0.5 px-2 rounded text-[9px] font-mono font-bold bg-[#006A4E]/10 hover:bg-[#006A4E] text-[#006A4E] hover:text-white border border-[#006A4E]/20 transition-all cursor-pointer flex items-center gap-1 shadow-sm uppercase shrink-0"
                              title="Audit ledger block proof"
                            >
                              <Database className="w-3 h-3" /> Sealed
                            </button>
                          ) : (
                            <span className="text-[9px] font-mono text-gray-300 uppercase select-none shrink-0">Unsealed</span>
                          )}

                        </div>
                      );
                    })}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Right Grid: Helpful Sovereignty Guidelines */}
        <div className="space-y-4">
          <h3 className="text-sm uppercase font-black text-gray-500 tracking-wider">Citizen Sovereign Directives</h3>
          
          <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6 space-y-5">
            <div className="flex items-start gap-3 border-b border-gray-100 pb-4">
              <div className="bg-emerald-50 text-[#006A4E] p-2 rounded-xl shrink-0">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-xs font-extrabold text-gray-900 leading-tight">OneID Bangladesh Standard</h4>
                <p className="text-[10px] text-gray-500 leading-relaxed mt-1">
                  Your identity key has been verified inside the decentralized Union Council records database, satisfying Bangladesh september 2025 security provisions.
                </p>
              </div>
            </div>

            <div className="space-y-3">
              <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest block font-mono">Platform parameters:</span>
              
              <div className="flex justify-between items-center text-xs line-snug">
                <span className="text-gray-500 font-semibold flex items-center gap-1.5">
                  <Database className="w-3.5 h-3.5 text-gray-400" /> Decentralized Nodes
                </span>
                <span className="font-mono text-[#006A4E] font-bold">5 Active Sectors</span>
              </div>

              <div className="flex justify-between items-center text-xs line-snug">
                <span className="text-gray-500 font-semibold flex items-center gap-1.5">
                  <Hash className="w-3.5 h-3.5 text-gray-400" /> Consensus Method
                </span>
                <span className="font-mono text-gray-700 font-semibold">Proof of Solemnity</span>
              </div>

              <div className="flex justify-between items-center text-xs line-snug">
                <span className="text-gray-500 font-semibold flex items-center gap-1.5">
                  <CheckCircle className="w-3.5 h-3.5 text-gray-400" /> Security Seal status
                </span>
                <span className="inline-flex items-center gap-1 text-[10px] font-bold bg-emerald-50 text-emerald-700 py-0.5 px-2 rounded">
                  Active Shield
                </span>
              </div>
            </div>

            <div className="bg-[#006A4E]/5 rounded-xl p-4 border border-[#006A4E]/10 space-y-1">
              <h5 className="text-[10px] text-[#006A4E] font-black uppercase tracking-wider">Digital Nikahnama Law</h5>
              <p className="text-[10px] text-[#006A4E] leading-relaxed">
                Notice served for Talaq under 1974 Act applies a 90-day cooldown state machine before registration finalization. Servicing Union Parishad notice is mandatory.
              </p>
            </div>
          </div>
        </div>

      </div>

      {/* LEDGER BLOCK INTEGRITY VERIFICATION DIALOG MODAL */}
      {selectedRecordId && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl border border-gray-200 max-w-lg w-full overflow-hidden shadow-2xl animate-in scale-in duration-150">
            
            {/* Modal Header */}
            <div className="bg-gray-50 border-b border-gray-100 py-4 px-6 flex justify-between items-center">
              <div className="flex items-center gap-2">
                <Database className="w-4.5 h-4.5 text-[#006A4E]" />
                <h3 className="font-extrabold text-sm text-gray-900 font-mono tracking-tight select-all">
                  Proof of Block: {selectedRecordId.slice(0, 8)}...
                </h3>
              </div>
              <button 
                onClick={() => setSelectedRecordId(null)}
                className="p-1 rounded-md text-gray-400 hover:bg-gray-200 hover:text-gray-600 transition-colors"
                id="close-modal-button"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Content */}
            <div className="p-6 space-y-4">
              {verifyingRecord ? (
                <div className="flex flex-col items-center justify-center py-10 space-y-3">
                  <div className="w-8 h-8 border-3 border-[#006A4E] border-t-transparent rounded-full animate-spin" />
                  <p className="text-xs text-gray-500 font-mono">Calling Ledger record seal indices...</p>
                </div>
              ) : recordFootprint && recordFootprint.found ? (
                <div className="space-y-4">
                  <div className="flex items-center gap-2 text-emerald-700 bg-emerald-50 p-3 rounded-xl border border-emerald-100 text-xs font-semibold">
                    <CheckCircle className="w-4.5 h-4.5 shrink-0" />
                    <span>Cryptographic Block Integrity matches core Ledger consensus!</span>
                  </div>

                  <div className="grid grid-cols-2 gap-3 text-xs">
                    <div className="bg-gray-50 p-3 rounded-lg">
                      <span className="text-[9px] uppercase tracking-wider text-gray-400 block font-mono font-bold leading-none mb-1">Ledger Sector</span>
                      <span className="font-extrabold text-gray-700 capitalize">
                        {recordFootprint.record?.sector?.toLowerCase()?.replace('_', ' ') || 'Voting'}
                      </span>
                    </div>

                    <div className="bg-gray-50 p-3 rounded-lg">
                      <span className="text-[9px] uppercase tracking-wider text-gray-400 block font-mono font-bold leading-none mb-1">Sequence Height</span>
                      <span className="font-extrabold text-gray-700 font-mono">
                        #{recordFootprint.record?.sequenceNumber || '1'}
                      </span>
                    </div>
                  </div>

                  <div className="space-y-2.5">
                    
                    <div className="space-y-1">
                      <span className="text-[9px] uppercase font-bold text-gray-400 font-mono leading-none block">Previous Hash link:</span>
                      <p className="text-[10px] break-all font-mono bg-amber-50/50 p-2 border border-amber-100 rounded text-amber-900 leading-snug">
                        {recordFootprint.record?.prevHash}
                      </p>
                    </div>

                    <div className="space-y-1">
                      <span className="text-[9px] uppercase font-bold text-gray-400 font-mono leading-none block">Record Hash footprint:</span>
                      <p className="text-[10px] break-all font-mono bg-[#006A4E]/5 p-2 border border-[#006A4E]/10 rounded text-emerald-900 leading-snug">
                        {recordFootprint.record?.recordHash}
                      </p>
                    </div>

                    <div className="space-y-1">
                      <span className="text-[9px] uppercase font-bold text-gray-400 font-mono leading-none block">Consensus Signature:</span>
                      <p className="text-[10px] break-all font-mono bg-gray-50 p-2 border border-gray-100 rounded text-gray-700 leading-snug">
                        {recordFootprint.record?.signature}
                      </p>
                    </div>

                  </div>
                </div>
              ) : (
                <div className="text-center py-6 space-y-3">
                  <AlertTriangle className="w-10 h-10 text-[#F42A41] mx-auto" />
                  <p className="text-xs font-semibold text-gray-800">
                    {recordFootprint?.error || 'Record block metadata is unsealed or pending.'}
                  </p>
                  <p className="text-[10px] text-gray-500 max-w-sm mx-auto leading-relaxed">
                    This can transpire if the system ledger cron scheduler is compiling the newest Merkle Node block structure in the background.
                  </p>
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="bg-gray-50 py-3 px-6 border-t border-gray-100 flex justify-end">
              <button 
                onClick={() => setSelectedRecordId(null)}
                className="bg-gray-900 hover:bg-black text-white py-1.5 px-4 rounded-lg text-xs font-semibold transition"
              >
                Close verification
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
}
