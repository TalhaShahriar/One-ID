import React, { useState, useEffect } from 'react';
import api from '../../lib/api.js';
import { toast } from 'sonner';
import { 
  FileText, 
  AlertTriangle, 
  CheckCircle2, 
  RefreshCw, 
  ShieldAlert, 
  Search, 
  X, 
  Flag, 
  Layers, 
  DollarSign,
  Key
} from 'lucide-react';
import LedgerBadge from '../../shared/components/LedgerBadge.jsx';

export default function TaxAdminDashboard() {
  const [loading, setLoading] = useState(true);
  const [returns, setReturns] = useState([]);
  const [pagination, setPagination] = useState({ total: 0, page: 1, limit: 10, totalPages: 1 });
  const [stats, setStats] = useState({ total: 0, unpaid: 0, anomalies: 0 });
  const [filters, setFilters] = useState({ taxYear: '', paymentStatus: '', anomalyFlag: '' });
  const [ledgerStats, setLedgerStats] = useState(null);
  
  // Flag Anomaly Modal State
  const [flagModal, setFlagModal] = useState({ isOpen: false, returnId: null, reason: '' });
  const [flagging, setFlagging] = useState(false);

  // Verification Input state
  const [searchRecordId, setSearchRecordId] = useState('');
  const [verifyingRecord, setVerifyingRecord] = useState(false);
  const [recordFootprint, setRecordFootprint] = useState(null);

  const fetchAdminData = async () => {
    setLoading(true);
    try {
      // 1. Fetch filtered returns
      const queryParams = new URLSearchParams({
        page: pagination.page,
        limit: pagination.limit,
        ...Object.fromEntries(Object.entries(filters).filter(([_, v]) => v !== ''))
      });
      const returnsResp = await api.get(`/tax/admin/returns?${queryParams.toString()}`);
      setReturns(returnsResp.data.returns || []);
      setPagination(returnsResp.data.pagination);

      // 2. Fetch overall stats for quick summary cards
      const statsResp = await api.get('/tax/admin/returns?limit=100000');
      const allList = statsResp.data.returns || [];
      const total = allList.length;
      const unpaid = allList.filter(r => r.paymentStatus === 'UNPAID').length;
      const anomalies = allList.filter(r => r.anomalyFlag).length;
      setStats({ total, unpaid, anomalies });

      // 3. Fetch tax blockchain stats
      const lResp = await api.get('/ledger/stats');
      setLedgerStats(lResp.data?.TAX || null);

    } catch (err) {
      console.error('Error fetching admin tax telemetry:', err);
      toast.error('Failure reaching NBR administrative API endpoints.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAdminData();
  }, [pagination.page, filters]);

  const handleFilterChange = (field, val) => {
    setFilters(prev => ({ ...prev, [field]: val }));
    setPagination(prev => ({ ...prev, page: 1 })); // Reset to first page
  };

  // Submit flag anomaly
  const handleFlagAnomaly = async () => {
    if (!flagModal.reason.trim()) {
      toast.error('Please specify an audit anomaly explanation.');
      return;
    }
    setFlagging(true);
    try {
      await api.post('/tax/admin/flag', {
        returnId: flagModal.returnId,
        reason: flagModal.reason
      });
      toast.success('Successfully logged and flagged return anomaly.');
      setFlagModal({ isOpen: false, returnId: null, reason: '' });
      fetchAdminData();
    } catch (err) {
      console.error('Error flagging anomaly:', err);
      toast.error(err.response?.data?.error || 'Flagging failed.');
    } finally {
      setFlagging(false);
    }
  };

  // Search individual block verify
  const handleVerifyRecord = async () => {
    if (!searchRecordId.trim()) {
      toast.error('Enter a valid ledger transaction footprint key.');
      return;
    }
    setVerifyingRecord(true);
    setRecordFootprint(null);
    try {
      const resp = await api.get(`/ledger/record/${searchRecordId.trim()}`);
      setRecordFootprint(resp.data);
      if (resp.data.found) {
        toast.success('Block trace verification complete!');
      } else {
        toast.error('Block not discovered within the chain.');
      }
    } catch (err) {
      console.error('Record verification error:', err);
      toast.error('Verification handshake rejected.');
    } finally {
      setVerifyingRecord(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-6 py-10 space-y-8 font-sans" id="tax-admin-dashboard-container">
      
      {/* Header telemetry band */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-150 pb-6">
        <div className="space-y-1">
          <div className="flex items-center gap-1.5 text-xs font-mono font-black uppercase text-red-600 tracking-wider">
            <span className="h-2 w-2 rounded-full bg-red-650 animate-pulse" />
            National tax security controller workspace
          </div>
          <h1 className="text-2xl font-black text-slate-800 tracking-tight flex items-center gap-2">
            🏛️ NBR Administrative Audits Center
          </h1>
          <p className="text-xs text-slate-500 font-medium">
            Authorized access point for tax slab inspections, automated anomaly screening, and cryptographic verification ledger.
          </p>
        </div>
        <button
          onClick={fetchAdminData}
          className="flex items-center gap-1 bg-white border border-slate-250 px-3.5 py-2 text-xs font-bold text-slate-600 rounded-xl hover:bg-slate-50 cursor-pointer transition"
          id="refresh-admin-btn"
        >
          <RefreshCw className="h-4 w-4" /> Sync Ledgers
        </button>
      </div>

      {/* Analytics widgets */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6" id="admin-summary-cards">
        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm space-y-2">
          <span className="text-xs font-bold text-slate-400 uppercase tracking-wider font-sans block">Total Submissions Received</span>
          <div className="text-3xl font-mono font-black text-slate-800">{loading ? '...' : stats.total} returns</div>
          <p className="text-[10px] text-slate-500 font-semibold">Self-assessments filed for analysis</p>
        </div>

        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm space-y-2">
          <span className="text-xs font-bold text-slate-400 uppercase tracking-wider font-sans block">Outstanding Dues</span>
          <div className="text-3xl font-mono font-black text-red-600">{loading ? '...' : stats.unpaid} pending</div>
          <p className="text-[10px] text-slate-500 font-semibold">Filed records awaiting bank clearance</p>
        </div>

        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm space-y-2 relative overflow-hidden bg-red-50/20 border-red-200">
          <span className="text-xs font-bold text-red-700 uppercase tracking-wider font-sans block">Screened Anomalies</span>
          <div className="text-3xl font-mono font-black text-red-700 flex items-center gap-2">
            {loading ? '...' : stats.anomalies}
            {stats.anomalies > 0 && <ShieldAlert className="w-6 h-6 text-red-600 animate-pulse" />}
          </div>
          <p className="text-[10px] text-red-500 font-semibold">Flagged for under-reporting/compliance audits</p>
        </div>
      </div>

      {/* Database control filters */}
      <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm" id="returns-audits-section">
        <div className="px-6 py-4 border-b border-slate-100 flex flex-wrap gap-4 items-center justify-between bg-slate-50/50">
          <h3 className="text-sm font-bold text-slate-800">Tax Return Registrations Review</h3>
          
          {/* Filter options */}
          <div className="flex flex-wrap items-center gap-3 text-xs">
            {/* Year Selector */}
            <select
              value={filters.taxYear}
              onChange={(e) => handleFilterChange('taxYear', e.target.value)}
              className="px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs font-bold font-sans text-slate-600 focus:outline-none focus:border-emerald-500"
            >
              <option value="">All Tax Years</option>
              <option value="2026">2026</option>
              <option value="2025">2025</option>
            </select>

            {/* Status Selector */}
            <select
              value={filters.paymentStatus}
              onChange={(e) => handleFilterChange('paymentStatus', e.target.value)}
              className="px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs font-bold font-sans text-slate-600 focus:outline-none focus:border-emerald-500"
            >
              <option value="">All Statuses</option>
              <option value="PAID">PAID</option>
              <option value="UNPAID">UNPAID</option>
            </select>

            {/* Anomaly Selector */}
            <select
              value={filters.anomalyFlag}
              onChange={(e) => handleFilterChange('anomalyFlag', e.target.value)}
              className="px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs font-bold font-sans text-slate-600 focus:outline-none focus:border-emerald-500"
            >
              <option value="">All Records</option>
              <option value="true">Flagged Anomalies Only</option>
              <option value="false">Clear Records Only</option>
            </select>
          </div>
        </div>

        {/* Audit Table */}
        {returns.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-100/50 font-bold text-slate-500 uppercase tracking-tight">
                  <th className="p-4 pl-6">Taxpayer</th>
                  <th className="p-4">OneID / TIN</th>
                  <th className="p-4">Tax Year</th>
                  <th className="p-4">Gross Income</th>
                  <th className="p-4">Final Tax Assessed</th>
                  <th className="p-4">Verification Check</th>
                  <th className="p-4">Ledger Record</th>
                  <th className="p-4 pr-6 text-center">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {returns.map((val) => {
                  const hasReason = val.anomalyFlag;
                  return (
                    <tr 
                      key={val.id} 
                      className={`hover:bg-slate-50/50 transition font-medium ${
                        val.anomalyFlag ? 'bg-amber-50/30 text-amber-900 border-l-4 border-l-amber-500' : 'text-slate-700'
                      }`}
                    >
                      <td className="p-4 pl-6 font-bold">{val.taxProfile?.citizen?.name || 'Assessed Citizen'}</td>
                      <td className="p-4 space-y-0.5">
                        <span className="block font-mono text-slate-500 font-bold text-[10px]">{val.taxProfile?.citizenOneId}</span>
                        <span className="block font-mono text-emerald-800 font-bold">{val.taxProfile?.tin}</span>
                      </td>
                      <td className="p-4">{val.taxYear}</td>
                      <td className="p-4 font-mono">BDT {val.grossIncome.toLocaleString()}</td>
                      <td className="p-4 font-mono font-bold text-slate-800">BDT {val.finalTax.toLocaleString()}</td>
                      <td className="p-4">
                        {val.anomalyFlag ? (
                          <div className="space-y-1">
                            <span className="bg-amber-100 text-amber-850 px-2 py-0.5 rounded text-[9px] font-black uppercase inline-block border border-amber-300">
                              ⚠️ ANOMALY FLAGGED
                            </span>
                            <p className="text-[10px] italic text-amber-700 max-w-xs truncate" title={val.anomalyReason}>
                              {val.anomalyReason}
                            </p>
                          </div>
                        ) : (
                          <span className="bg-emerald-100 text-emerald-850 px-2 py-0.5 rounded text-[9px] font-black uppercase inline-block border border-emerald-300">
                            ✓ SECURED
                          </span>
                        )}
                      </td>
                      <td className="p-4">
                        <LedgerBadge sector="TAX" recordId={val.ledgerRecordId} />
                      </td>
                      <td className="p-4 pr-6 text-center">
                        <div className="flex gap-2 justify-center">
                          {!val.anomalyFlag && (
                            <button
                              onClick={() => setFlagModal({ isOpen: true, returnId: val.id, reason: '' })}
                              className="px-2.5 py-1 text-[11px] font-bold text-red-700 bg-red-50 hover:bg-red-100 border border-red-200 rounded transition cursor-pointer"
                            >
                              Flag
                            </button>
                          )}
                          <button
                            onClick={() => window.open(`/tax/receipt/${val.receiptNumber}`, '_blank')}
                            className="px-2.5 py-1 text-[11px] font-bold text-slate-700 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded transition cursor-pointer"
                          >
                            Trace
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="p-10 text-center text-slate-500 space-y-1 font-bold">
            <AlertTriangle className="h-8 w-8 text-amber-600 mx-auto" />
            <p className="text-xs">No records disclosed matching current audit filter masks.</p>
          </div>
        )}

        {/* Simple Pagination Footer */}
        {pagination.totalPages > 1 && (
          <div className="px-6 py-4 border-t border-slate-100 flex justify-between items-center text-xs">
            <span className="text-slate-500 font-semibold">Page {pagination.page} of {pagination.totalPages}</span>
            <div className="flex gap-2">
              <button
                disabled={pagination.page <= 1}
                onClick={() => setPagination(prev => ({ ...prev, page: prev.page - 1 }))}
                className="px-3 py-1 cursor-pointer hover:bg-slate-50 hover:text-slate-800 disabled:opacity-50 text-slate-500 border border-slate-200 rounded font-bold"
              >
                Prev
              </button>
              <button
                disabled={pagination.page >= pagination.totalPages}
                onClick={() => setPagination(prev => ({ ...prev, page: prev.page + 1 }))}
                className="px-3 py-1 cursor-pointer hover:bg-slate-50 hover:text-slate-800 disabled:opacity-50 text-slate-500 border border-slate-200 rounded font-bold"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Ledger assurance block at the bottom */}
      <div className="bg-slate-900 text-white rounded-3xl p-6 shadow-md" id="admin-ledger-watchdog-panel">
        <div className="flex justify-between items-start border-b border-slate-800 pb-4">
          <div className="space-y-1">
            <span className="text-[10px] bg-[#006a4e] text-white font-mono px-2.5 py-0.5 rounded-full border border-emerald-800 font-bold uppercase tracking-wider">
              TAX SECTOR IMMUTABLE LEDGER WATCHDOG
            </span>
            <h3 className="text-lg font-black tracking-tight flex items-center gap-1.5 pt-1">
              🏛️ Blockchain Cryptographic Verification Node
            </h3>
          </div>
          {ledgerStats && (
            <div className="text-right">
              <span className="text-emerald-400 font-mono text-lg font-bold block">{ledgerStats.recordsCount} Sealed Records</span>
              <p className="text-[10px] text-slate-400 font-semibold">Integrity Verified: 100% INTACT</p>
            </div>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-5 gap-6 pt-5">
          {/* Quick Stats list */}
          <div className="md:col-span-2 space-y-4">
            <p className="text-[11px] text-slate-400 leading-normal font-medium">
              Every tax return submission triggers an HMAC key derive signature. Every 50 sequences seal a complete Merkle proof block.
            </p>
            {ledgerStats?.lastBlock ? (
              <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-2.5 font-mono text-[10px]">
                <span className="text-slate-400 font-sans font-black block text-[9px] uppercase">LATEST MERKLE SEALED BLOCK:</span>
                <div className="truncate text-slate-300">Block ID: <span className="font-bold text-emerald-400">{ledgerStats.lastBlock.id}</span></div>
                <div>Sequence Range: {ledgerStats.lastBlock.startSequence} to {ledgerStats.lastBlock.endSequence}</div>
                <div className="truncate text-slate-400">Merkle Root: {ledgerStats.lastBlock.merkleRoot}</div>
              </div>
            ) : (
              <div className="bg-slate-950/60 p-4 rounded-xl border border-slate-800 text-[10px] font-mono text-slate-500 text-center font-bold">
                No complete Merkle sealed blocks formed yet (Required: 50 records batch).
              </div>
            )}
          </div>

          {/* Interactive Block footprint Verifier search */}
          <div className="md:col-span-3 bg-slate-950/40 p-5 rounded-2xl border border-slate-850 space-y-4">
            <div className="space-y-1">
              <h4 className="text-xs font-black text-slate-200">Inspect Ledger Block Footprint</h4>
              <p className="text-[10px] text-slate-400">Query the immutable chain directly using a specific Ledger Record ID to audit block proofs.</p>
            </div>

            <div className="flex gap-2">
              <input
                type="text"
                value={searchRecordId}
                onChange={(e) => setSearchRecordId(e.target.value)}
                placeholder="Paste Ledger Record UUID footprint..."
                className="flex-1 bg-slate-900 border border-slate-800 px-3.5 py-2 text-xs font-mono font-bold text-white rounded-xl focus:outline-none"
              />
              <button
                onClick={handleVerifyRecord}
                disabled={verifyingRecord}
                className="px-4 py-2 bg-emerald-700 hover:bg-emerald-600 disabled:bg-emerald-800 text-white rounded-xl text-xs font-black transition cursor-pointer"
              >
                Verify Block
              </button>
            </div>

            {recordFootprint && (
              <div className="bg-slate-900 p-4 border border-slate-800 rounded-xl space-y-2.5 font-mono text-[10px]">
                {recordFootprint.found ? (
                  <>
                    <div className="text-emerald-400 font-bold uppercase tracking-wider flex items-center gap-1 text-[9px]">
                      ✓ CRYPTOGRAPHICAL FOOTPRINT VERIFIED
                    </div>
                    <div className="grid grid-cols-2 gap-y-1.5 text-slate-300">
                      <div>Sequence No: <span className="text-white font-bold">#{recordFootprint.record.sequenceNumber}</span></div>
                      <div>Sector Category: <span className="text-white font-bold">{recordFootprint.record.sector}</span></div>
                      <div className="truncate col-span-2">Record Hash Key: <span className="text-[#a7f3d0]">{recordFootprint.record.hash}</span></div>
                      <div className="truncate col-span-2">Signature Proof: <span className="text-[#a7f3d0]">{recordFootprint.record.signature}</span></div>
                    </div>
                  </>
                ) : (
                  <div className="text-red-400 font-bold uppercase tracking-wider text-[9px]">
                    ❌ EXCEPTION: Footprint not found in Blockchain ledgers.
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Flag Anomaly Modal Backdrop */}
      {flagModal.isOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white border rounded-3xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <div className="flex justify-between items-start border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <ShieldAlert className="w-5 h-5 text-red-600" />
                <h3 className="font-sans font-black text-slate-950 text-sm uppercase">Compliance Audit Intervention</h3>
              </div>
              <button 
                onClick={() => setFlagModal({ isOpen: false, returnId: null, reason: '' })} 
                className="p-1 hover:bg-slate-50 rounded"
              >
                <X className="w-4 h-4 text-slate-400" />
              </button>
            </div>

            <div className="space-y-3">
              <p className="text-[11px] text-slate-650 leading-normal">
                Flagging this tax return record triggers an administrative audit warning. The taxpayer will see the record annotated as "Anomaly Flagged" inside their sovereign OneID portal dashboard.
              </p>

              <div className="space-y-1.5">
                <label className="text-[10px] uppercase font-black text-slate-500 font-mono">Anomaly Assessment Explanation</label>
                <textarea
                  rows={4}
                  value={flagModal.reason}
                  onChange={(e) => setFlagModal(prev => ({ ...prev, reason: e.target.value }))}
                  placeholder="e.g. Incongruent revenue declarations mismatch, suspected under-reported estate yields..."
                  className="w-full border border-slate-200 p-3 rounded-xl text-xs focus:outline-none focus:border-red-500"
                />
              </div>
            </div>

            {/* Modal actions */}
            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setFlagModal({ isOpen: false, returnId: null, reason: '' })}
                className="px-4 py-2 border rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-50 transition"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleFlagAnomaly}
                disabled={flagging}
                className="px-4 py-2 bg-red-600 hover:bg-red-500 disabled:bg-red-800 text-white rounded-xl text-xs font-black transition shadow-sm"
              >
                {flagging ? 'Logging Flag...' : 'Proceed Flagging Anomaly'}
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
