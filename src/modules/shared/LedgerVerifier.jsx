import React, { useState, useEffect } from 'react';
import api from '../../lib/api.js';
import { 
  Shield, 
  CheckCircle2, 
  AlertTriangle, 
  RefreshCw, 
  Clock, 
  ArrowRight, 
  Archive, 
  FileCheck2,
  Database,
  Vote,
  Receipt,
  Car,
  Home,
  FileText
} from 'lucide-react';

const SECTOR_METADATA = {
  VOTE: { name: 'Elections & Ballots', desc: 'Secure blockchain voter registration & balloting records.', icon: Vote, color: 'emerald' },
  TAX: { name: 'Direct/Corporate Tax', desc: 'Secure direct income tax submissions & certificates.', icon: Receipt, color: 'blue' },
  VEHICLE: { name: 'BRTA Smart Ledger', desc: 'Vehicle registrations, health tests & driver licenses.', icon: Car, color: 'indigo' },
  PROPERTY: { name: 'Deeds & Land Titles', desc: 'Decentralized register for land mutation records.', icon: Home, color: 'amber' },
  CIVIL_REGISTRY: { name: 'Birth & civil registry', desc: 'Birth, marriage, divorce & testament registrations.', icon: FileText, color: 'rose' }
};

export default function LedgerVerifier() {
  const [stats, setStats] = useState({});
  const [auditResults, setAuditResults] = useState({});
  const [loadingAll, setLoadingAll] = useState(false);
  const [verifyingSectors, setVerifyingSectors] = useState({});
  const [lastVerifiedTime, setLastVerifiedTime] = useState(null);
  const [errorMessage, setErrorMessage] = useState('');

  // Fetch initial stats and verify all on mount
  useEffect(() => {
    fetchStats();
    runVerifyAll();
  }, []);

  const fetchStats = async () => {
    try {
      const resp = await api.get('/ledger/stats');
      setStats(resp.data);
    } catch (err) {
      console.error('Error fetching ledger stats:', err);
    }
  };

  const runVerifyAll = async () => {
    setLoadingAll(true);
    setErrorMessage('');
    try {
      const resp = await api.get('/ledger/verify-all');
      
      const results = {};
      Object.keys(resp.data.sectors).forEach((sector) => {
        results[sector] = {
          valid: resp.data.sectors[sector].valid,
          totalRecords: resp.data.sectors[sector].totalRecords,
          brokenAt: resp.data.sectors[sector].brokenAt || null,
          reason: resp.data.sectors[sector].reason || null,
          layer: resp.data.sectors[sector].layer || null
        };
      });

      setAuditResults(results);
      setLastVerifiedTime(new Date());
      // Refresh counts
      fetchStats();
    } catch (err) {
      console.error('Error in multi-sector verification:', err);
      setErrorMessage(
        err.response?.data?.error || 
        'Authorization failure. The blockchain verifier requires active SUPER_ADMIN authentication credentials.'
      );
    } finally {
      setLoadingAll(false);
    }
  };

  const runVerifySector = async (sector) => {
    setVerifyingSectors(prev => ({ ...prev, [sector]: true }));
    try {
      const resp = await api.get(`/ledger/verify/${sector}`);
      setAuditResults(prev => ({
        ...prev,
        [sector]: {
          valid: resp.data.valid,
          totalRecords: resp.data.totalRecords || resp.data.count,
          brokenAt: resp.data.brokenAt || (resp.data.troubledRecord ? resp.data.troubledRecord.sequenceNumber : null),
          reason: resp.data.reason || resp.data.error,
          layer: resp.data.layer || (resp.data.error ? 'INTEGRITY_FAULT' : null)
        }
      }));
      setLastVerifiedTime(new Date());
    } catch (err) {
      console.error(`Error verifying sector ${sector}:`, err);
    } finally {
      setVerifyingSectors(prev => ({ ...prev, [sector]: false }));
    }
  };

  return (
    <div className="space-y-6" id="ledger-verifier-view-container">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-emerald-950 to-slate-900 border border-emerald-800/40 rounded-2xl p-6 shadow-md text-white">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <Shield className="h-6 w-6 text-emerald-400" />
              <h1 className="text-xl font-bold tracking-tight">OneID Cryptographic Ledger Watchdog</h1>
            </div>
            <p className="text-xs text-slate-300 max-w-2xl">
              Verification control panel for the 5 permissioned core sectors. Ensure zero database tampering using SHA-256 block chain linkage, private HMAC sector keys, and Merkle root sealing.
            </p>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={runVerifyAll}
              disabled={loadingAll}
              className="flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-500 disabled:bg-emerald-800 text-white rounded-lg text-xs font-semibold shadow-sm transition cursor-pointer"
              id="verify-all-ledger-btn"
            >
              <RefreshCw className={`h-4 w-4 ${loadingAll ? 'animate-spin' : ''}`} />
              {loadingAll ? 'Auditing Ledger...' : 'Audit All Sectors'}
            </button>
          </div>
        </div>

        {errorMessage && (
          <div className="mt-4 p-3 bg-red-950/50 border border-red-800/60 rounded-lg text-xs text-red-200" id="ledger-admin-error">
            <strong>System Error:</strong> {errorMessage}
          </div>
        )}

        {lastVerifiedTime && (
          <div className="mt-4 text-[10px] text-slate-400 font-mono flex items-center gap-1.5" id="last-verification-timestamp">
            <Clock className="w-3.5 h-3.5" />
            Last Cryptographic Sweep Completed: {lastVerifiedTime.toLocaleTimeString()} (UTC)
          </div>
        )}
      </div>

      {/* Grid of Sector Health Cards */}
      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6" id="sector-grid">
        {Object.keys(SECTOR_METADATA).map((sector) => {
          const meta = SECTOR_METADATA[sector];
          const sectorStats = stats[meta] || stats[sector] || { recordsCount: 0, lastBlock: null };
          const sectorAudit = auditResults[sector];
          const isVerifying = verifyingSectors[sector];

          const IconComponent = meta.icon;

          return (
            <div 
              key={sector} 
              className="bg-white border border-slate-100 rounded-xl p-5 shadow-sm hover:shadow-md transition duration-200 flex flex-col justify-between"
              id={`sector-card-${sector.toLowerCase()}`}
            >
              <div className="space-y-4">
                {/* Header info */}
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className="p-2.5 rounded-lg bg-emerald-50 text-emerald-700">
                      <IconComponent className="h-5 w-5" />
                    </div>
                    <div>
                      <h3 className="text-sm font-bold text-slate-800 tracking-tight">{meta.name}</h3>
                      <p className="text-[10px] text-slate-400 font-mono tracking-wider">{sector}</p>
                    </div>
                  </div>

                  {/* Operational Health Badge */}
                  {isVerifying ? (
                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-slate-100 text-slate-600 animate-pulse">
                      <RefreshCw className="h-3 w-3 animate-spin text-slate-500" />
                      Auditing...
                    </span>
                  ) : sectorAudit ? (
                    sectorAudit.valid ? (
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200" id={`badge-health-${sector.toLowerCase()}`}>
                        <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />
                        Chain Intact
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-red-100 text-red-700 border border-red-200 animate-bounce" id={`badge-health-${sector.toLowerCase()}`}>
                        <AlertTriangle className="h-3.5 w-3.5 text-red-600" />
                        TAMPER DETECTED
                      </span>
                    )
                  ) : (
                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-amber-50 text-amber-600 border border-amber-200">
                      Unevaluated
                    </span>
                  )}
                </div>

                {/* Description */}
                <p className="text-xs text-slate-500 leading-relaxed">
                  {meta.desc}
                </p>

                {/* Quick Info Blocks */}
                <div className="grid grid-cols-2 gap-3 pt-2">
                  <div className="p-2.5 bg-slate-50/50 border border-slate-100 rounded-lg">
                    <div className="text-[10px] text-slate-400 uppercase tracking-tight font-semibold">Ledger Size</div>
                    <div className="text-base font-bold text-slate-700 font-mono mt-0.5">
                      {sectorStats.recordsCount} <span className="text-[10px] text-slate-400 font-normal">items</span>
                    </div>
                  </div>
                  <div className="p-2.5 bg-slate-50/50 border border-slate-100 rounded-lg">
                    <div className="text-[10px] text-slate-400 uppercase tracking-tight font-semibold">Merkle Seal</div>
                    <div className="text-xs font-bold text-slate-700 font-mono mt-1 truncate">
                      {sectorStats.lastBlock ? `#${sectorStats.lastBlock.endSequence}` : 'None Sealed'}
                    </div>
                  </div>
                </div>

                {/* Audit error message breakdown if invalid */}
                {sectorAudit && !sectorAudit.valid && (
                  <div className="p-3 bg-red-50 border border-red-100 rounded-lg space-y-1.5" id={`audit-failure-${sector.toLowerCase()}`}>
                    <div className="text-[10px] font-bold text-red-800 uppercase tracking-wide flex items-center gap-1">
                      <AlertTriangle className="w-3.5 h-3.5 text-red-700" />
                      Cryptographic Link Compromise
                    </div>
                    <p className="text-[11px] text-red-700 leading-normal">
                      <strong>Reason:</strong> {sectorAudit.reason || 'Record integrity failed validation checks'}
                    </p>
                    <div className="text-[10px] font-mono text-red-900 bg-red-100 pl-1.5 py-0.5 rounded">
                      Layer: {sectorAudit.layer || 'HASH_CHAIN'} • Sequence brokenAt: #{sectorAudit.brokenAt || 'Unkn'}
                    </div>
                  </div>
                )}
              </div>

              {/* Action Button */}
              <div className="pt-4 mt-4 border-t border-slate-50 flex items-center justify-between">
                <div className="text-[10px] text-slate-400 flex items-center gap-1">
                  <Database className="w-3 h-3 text-slate-400" />
                  No SQL overrides permitted
                </div>
                <button
                  onClick={() => runVerifySector(sector)}
                  disabled={loadingAll || isVerifying}
                  className="flex items-center gap-1 text-[11px] font-bold text-slate-600 hover:text-emerald-700 hover:underline cursor-pointer transition disabled:text-slate-300 disabled:no-underline"
                  id={`verify-sector-${sector.toLowerCase()}`}
                >
                  Verify Now
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Merkle Sealing Status Panel */}
      <div className="bg-slate-50 border border-slate-100 p-5 rounded-xl space-y-3" id="merkle-summary-box">
        <div className="flex items-center gap-2">
          <Archive className="h-5 w-5 text-slate-600" />
          <h2 className="text-sm font-bold text-slate-700 tracking-tight">Merkle Batching and Sealing Log</h2>
        </div>
        <p className="text-xs text-slate-500 leading-relaxed max-w-4xl">
          E-Governance records are initially logged with instant verification hashes & signatures. Every sequence of exactly fifty entries is compacted inside a structural Merkle Block. The block computes pairwise hash nodes and seals them with an immutable master Merkle Root hash string permanently.
        </p>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 font-mono text-[11px] text-slate-600 pt-2">
          {Object.keys(SECTOR_METADATA).map((sector) => {
            const blockStats = stats[sector]?.lastBlock;
            return (
              <div key={sector} className="p-3 bg-white border border-slate-100 rounded-lg flex flex-col justify-between">
                <div className="flex justify-between items-center mb-1.5 border-b border-slate-50 pb-1.5">
                  <span className="font-bold text-slate-800">{sector}</span>
                  <span className="text-[10px] text-slate-400">Master Root</span>
                </div>
                {blockStats ? (
                  <div className="space-y-1">
                    <p className="truncate text-slate-500" title={blockStats.merkleRoot}><strong>Root:</strong> {blockStats.merkleRoot}</p>
                    <p className="text-[10px] text-slate-400">Sealed at block sequence {blockStats.startSequence} - {blockStats.endSequence}</p>
                  </div>
                ) : (
                  <p className="text-slate-400 italic">No Merkle block sealed yet (under 50 entries)</p>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
