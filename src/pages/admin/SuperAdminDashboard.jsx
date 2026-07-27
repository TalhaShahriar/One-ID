import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext.jsx';
import api from '../../lib/api.js';
import { 
  ShieldCheck, 
  Database, 
  Activity, 
  Layers, 
  Lock, 
  CheckCircle, 
  AlertTriangle, 
  RefreshCw,
  Search,
  Users,
  Grid,
  TrendingUp,
  Award
} from 'lucide-react';
import { toast } from 'sonner';

export default function SuperAdminDashboard() {
  const { user } = useAuth();
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [auditing, setAuditing] = useState(false);
  const [auditResults, setAuditResults] = useState(null);
  const [scanningSector, setScanningSector] = useState(null);

  // Load platform stats
  const fetchStats = async () => {
    try {
      setLoading(true);
      const res = await api.get('/ledger/stats');
      setStats(res.data);
    } catch (err) {
      console.warn('Could not retrieve active ledger stats:', err);
      toast.error('Failed to pull system block heights.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, []);

  // Run full blockchain audit
  const handleVerifyAllChains = async () => {
    try {
      setAuditing(true);
      setAuditResults(null);
      toast.info('Initiating zero-leak ledger audit across all 5 e-governance blocks...');
      
      const res = await api.get('/ledger/verify-all');
      setAuditResults(res.data);
      if (res.data.valid) {
         toast.success('System Integrity Check: 100% SECURE. Hex sequences intact!');
      } else {
         toast.error('Warning: Unsynchronized sequence hashes scanned in nodes.');
      }
    } catch (err) {
      console.error(err);
      toast.error('Could not run complete ledger consensus validation.');
    } finally {
      setAuditing(false);
    }
  };

  // Run individual sector scan
  const handleVerifySingleSector = async (sector) => {
    try {
      setScanningSector(sector);
      toast.info(`Scanning blockchain sector: ${sector}...`);
      
      const res = await api.get(`/ledger/verify/${sector}`);
      if (res.data.valid) {
        toast.success(`Sector ${sector}: VERIFIED SECURE! Hash sequence matches signature.`);
      } else {
        toast.error(`Sector ${sector} signature mismatch detected!`);
      }
    } catch (err) {
      console.error(err);
      toast.error(`Fault returned during sector scan of ${sector}.`);
    } finally {
      setScanningSector(null);
    }
  };

  if (loading && !stats) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] space-y-4">
        <RefreshCw className="w-10 h-10 text-[#006A4E] animate-spin" />
        <p className="text-xs font-mono text-gray-500">Retrieving blockchain sequence heights...</p>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-300 max-w-7xl mx-auto px-4 md:px-0 py-6">
      
      {/* Page Header */}
      <div className="bg-white border border-gray-200 p-6 md:p-8 rounded-2xl shadow-sm flex flex-col md:flex-row justify-between items-center gap-6">
        <div className="flex items-center gap-3">
          <div className="bg-red-50 text-[#F42A41] p-3 rounded-xl border border-red-100">
            <Lock className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-xl font-extrabold text-gray-950 tracking-tight">Super Admin Security Ledger Panel</h1>
            <p className="text-xs text-gray-500 mt-1">Immutable ledger diagnostics, sequence proofs, and Merkle block validation</p>
          </div>
        </div>

        <div className="flex gap-3">
          <button
            onClick={fetchStats}
            className="p-2 px-3 border border-gray-200 text-gray-600 hover:bg-gray-100 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition"
          >
            <RefreshCw className="w-4 h-4" /> Refresh Heights
          </button>
          
          <button
            onClick={handleVerifyAllChains}
            disabled={auditing}
            className="p-2 px-4 bg-[#006A4E] hover:bg-[#005a42] text-white rounded-lg text-xs font-semibold flex items-center gap-2 shadow-sm transition disabled:opacity-50"
          >
            <ShieldCheck className="w-4 h-4" />
            {auditing ? 'Auditing chains...' : 'Run Integrity Core Audit'}
          </button>
        </div>
      </div>

      {/* Grid of Sector Tallies */}
      <section className="space-y-4">
        <h3 className="text-sm font-black uppercase text-gray-400 font-mono tracking-wider">Merkle Node Alignment Blocks</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
          {stats && Object.entries(stats).map(([sector, sectorData]) => {
            let color = '#7C3AED';
            if (sector === 'TAX') color = '#D97706';
            else if (sector === 'VEHICLE') color = '#0F6E56';
            else if (sector === 'PROPERTY') color = '#D85A30';
            else if (sector === 'CIVIL_REGISTRY') color = '#D4537E';

            return (
              <div 
                key={sector} 
                className="bg-white border border-gray-200/80 rounded-xl p-5 shadow-sm space-y-4 relative overflow-hidden flex flex-col justify-between"
              >
                {/* Horizontal Top sector color accent */}
                <div style={{ backgroundColor: color }} className="absolute left-0 right-0 top-0 h-1" />
                
                <div className="space-y-2">
                  <span className="text-[10px] font-bold text-gray-400 font-mono uppercase tracking-widest block">{sector.replace('_', ' ')}</span>
                  <div className="flex items-baseline gap-1.5">
                    <span className="text-2xl font-black text-gray-900">{sectorData.recordsCount}</span>
                    <span className="text-[10px] text-gray-400 font-semibold uppercase leading-none">Records</span>
                  </div>
                </div>

                <div className="border-t border-gray-50 pt-3 space-y-2">
                  {sectorData.lastBlock ? (
                    <div className="space-y-1">
                      <span className="text-[9px] text-gray-400 block font-mono font-bold leading-none">Last Merkle root:</span>
                      <p className="text-[9px] font-mono select-all text-gray-700 bg-gray-50 p-1 border border-gray-100 rounded break-all truncate">
                        {sectorData.lastBlock.merkleRoot}
                      </p>
                    </div>
                  ) : (
                    <span className="text-[9px] text-gray-300 block select-none">No Sealed block nodes.</span>
                  )}

                  <button
                    onClick={() => handleVerifySingleSector(sector)}
                    disabled={scanningSector === sector}
                    className="w-full py-1 text-[9px] font-bold font-mono uppercase border border-gray-100 hover:border-gray-200 bg-gray-50 hover:bg-gray-100 text-gray-700 rounded transition text-center"
                  >
                    {scanningSector === sector ? 'Scanning...' : 'Verify Chain'}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* CORE INTEGRITY VERIFICATION AUDIT LOGS DISPLAY */}
      {auditResults && (
        <section className="bg-white border border-gray-200/80 rounded-2xl shadow-sm p-6 md:p-8 space-y-6">
          <div className="flex items-center gap-3 pb-4 border-b border-gray-100">
            {auditResults.valid ? (
              <div className="w-10 h-10 bg-emerald-50 text-emerald-700 rounded-full flex items-center justify-center border border-emerald-100">
                <CheckCircle className="w-5 h-5 animate-pulse" />
              </div>
            ) : (
              <div className="w-10 h-10 bg-red-50 text-[#F42A41] rounded-full flex items-center justify-center border border-red-100">
                <AlertTriangle className="w-5 h-5 animate-bounce" />
              </div>
            )}
            
            <div>
              <h3 className="font-extrabold text-sm uppercase text-gray-900">
                Unified Blockchain Diagnostics Report
              </h3>
              <p className="text-[10px] font-mono text-gray-500 mt-0.5">
                Audited at: {new Date(auditResults.auditedAt).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', second: '2-digit', hour12: true })}
              </p>
            </div>
          </div>

          <div className="space-y-4">
            {Object.entries(auditResults.sectors).map(([sec, data]) => {
              return (
                <div key={sec} className="flex flex-col sm:flex-row sm:items-center justify-between p-4 bg-gray-50/50 rounded-xl border border-gray-100 gap-4">
                  <div className="flex items-center gap-2.5">
                    <Layers className="w-4 h-4 text-gray-400 shrink-0" />
                    <div>
                      <span className="font-bold text-xs uppercase text-gray-900 tracking-wider">
                        {sec.replace('_', ' ')}
                      </span>
                      <span className="block text-[10px] text-gray-400 font-mono">
                        Sealed record sequences scanned: {data.scannedCount || 0}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    {data.valid ? (
                      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-800 border border-emerald-100">
                        ✓ SECURE ALIGNED
                      </span>
                    ) : (
                      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-red-50 text-[#F42A41] border border-red-100">
                        ⚠ CORRUPTED CHAIN SYNC
                      </span>
                    )}
                    
                    <div className="text-right text-[10px] font-mono text-gray-400">
                      <span>Root check: {data.merkleMatch ? 'Sealed Match' : 'Pending Root'}</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      )}

      {/* Admin checklist section */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        
        <div className="bg-white border border-gray-200 rounded-2xl p-6 space-y-4 shadow-sm">
          <h4 className="font-extrabold text-[#006A4E] text-xs uppercase tracking-widest flex items-center gap-1.5 border-b border-gray-100 pb-2">
            <Layers className="w-4 h-4" /> Sector Integrity Guidelines
          </h4>
          <ul className="text-xs text-gray-600 space-y-2.5 leading-relaxed">
            <li className="flex items-start gap-2">
              <CheckCircle className="w-3.5 h-3.5 mt-0.5 text-emerald-600 shrink-0" />
              <span>Each transaction record sequence triggers signature proof matching. Any manual modification rejects validation hashes.</span>
            </li>
            <li className="flex items-start gap-2">
              <CheckCircle className="w-3.5 h-3.5 mt-0.5 text-emerald-600 shrink-0" />
              <span>Full sector audit loops do not expose plaintext citizen values, conforming with Sovereign Data Privacy safeguards.</span>
            </li>
          </ul>
        </div>

        <div className="bg-white border border-gray-200 rounded-2xl p-6 space-y-4 shadow-sm">
          <h4 className="font-extrabold text-[#F42A41] text-xs uppercase tracking-widest flex items-center gap-1.5 border-b border-gray-100 pb-2">
            <AlertTriangle className="w-4 h-4" /> Emergency Protocol Safeguards
          </h4>
          <ul className="text-xs text-gray-600 space-y-2.5 leading-relaxed">
            <li className="flex items-start gap-2">
              <AlertTriangle className="w-3.5 h-3.5 mt-0.5 text-[#F42A41] shrink-0" />
              <span>Upon signature drift validation failures, the sector node isolates outgoing API payloads automatically, keeping the blockchain immune to further interference.</span>
            </li>
          </ul>
        </div>

      </div>

    </div>
  );
}
