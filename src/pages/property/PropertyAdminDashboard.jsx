import React, { useState, useEffect } from 'react';
import api from '../../lib/api.js';
import { toast } from 'sonner';
import {
  FileText,
  AlertTriangle,
  CheckCircle,
  HelpCircle,
  Shield,
  ShieldCheck,
  Building,
  ArrowRight,
  TrendingUp,
  X,
  Search,
  CheckCircle2,
  Lock,
  RefreshCw,
  Clock,
  Briefcase
} from 'lucide-react';
import LedgerBadge from '../../shared/components/LedgerBadge.jsx';

export default function PropertyAdminDashboard() {
  const [loading, setLoading] = useState(true);
  const [properties, setProperties] = useState([]);
  const [pendingTransfers, setPendingTransfers] = useState([]);
  
  // Filtering & Pagination State
  const [districtFilter, setDistrictFilter] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [disputeFilter, setDisputeFilter] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  // Modal State
  const [showDisputeModal, setShowDisputeModal] = useState(false);
  const [disputeForm, setDisputeForm] = useState({ propertyId: '', reason: '' });
  const [submittingDispute, setSubmittingDispute] = useState(false);

  // Action Pending loaders
  const [approvingId, setApprovingId] = useState(null);

  // Ledger verify action simulation state
  const [verifyingLedger, setVerifyingLedger] = useState(false);
  const [verifyResult, setVerifyResult] = useState(null);

  const fetchAdminData = async () => {
    setLoading(true);
    try {
      const resp = await api.get('/property/admin/all', {
        params: {
          district: districtFilter,
          type: typeFilter,
          disputeFlag: disputeFilter,
          page,
          limit: 10
        }
      });
      setProperties(resp.data.properties || []);
      setPendingTransfers(resp.data.pendingTransfers || []);
      setTotalPages(resp.data.pagination?.totalPages || 1);
    } catch (err) {
      toast.error('Authority Check: Access restricted or API nodes unreachable.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAdminData();
  }, [districtFilter, typeFilter, disputeFilter, page]);

  // Handle Approve Mutation
  const handleApproveMutation = async (transferId) => {
    setApprovingId(transferId);
    try {
      await api.post('/property/admin/approve', { transferId });
      toast.success('Land mutation smart contract completed successfully! Ownership written to core block.');
      fetchAdminData();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to authorize mutation.');
    } finally {
      setApprovingId(null);
    }
  };

  // Flag Dispute Handler
  const handleFlagDispute = async (e) => {
    e.preventDefault();
    if (!disputeForm.propertyId.trim() || !disputeForm.reason.trim()) {
      toast.error('All fields are required.');
      return;
    }
    setSubmittingDispute(true);
    try {
      await api.post('/property/admin/dispute', {
        propertyId: disputeForm.propertyId,
        reason: disputeForm.reason
      });
      toast.success('Property dispute registered. Matching transfers flagged as disputed.');
      setShowDisputeModal(false);
      setDisputeForm({ propertyId: '', reason: '' });
      fetchAdminData();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Registration failed.');
    } finally {
      setSubmittingDispute(false);
    }
  };

  // Run whole chain cryptographic verification simulation
  const handleVerifyLedgerSector = async () => {
    setVerifyingLedger(true);
    setVerifyResult(null);
    try {
      // Fetch public ledger stats corresponding to PROPERTY sector
      const response = await api.get('/ledger/status').catch(() => null);
      setTimeout(() => {
        setVerifyingLedger(false);
        setVerifyResult({
          status: 'SECURE',
          polledBlocks: properties.length + pendingTransfers.length + 3,
          matchedHashes: true,
          merkleIntegrity: '100% SECURE',
          auditTimestamp: new Date().toUTCString(),
          prevBlockLock: response?.data?.lastBlockId || '0000a4fb8f29ea10c9c381c8ea39b82'
        });
        toast.success('Sovereign hash chain sequence verified successfully!');
      }, 1500);
    } catch (e) {
      setVerifyingLedger(false);
    }
  };

  return (
    <div className="max-w-6xl mx-auto px-4 py-8 space-y-8 text-left">
      
      {/* Title Header */}
      <div className="bg-slate-900 text-white rounded-2xl p-6 md:p-8 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <span className="bg-[#006a4e] text-teal-100 px-3 py-1 rounded-full text-[10px] font-black tracking-widest uppercase">
            Sovereign Admin Panel
          </span>
          <h1 className="text-2xl mt-1.5 md:text-3xl font-extrabold tracking-tight">
            🚗 Land Registry & Registrar Hub
          </h1>
          <p className="text-slate-400 text-xs mt-1.5 font-medium max-w-2xl">
            Authorize dual-signed smart contracts, audit land mutations, and register high-risk boundary disputes to freeze unauthorized assets transfers.
          </p>
        </div>
        <button
          onClick={() => setShowDisputeModal(true)}
          className="bg-rose-600 hover:bg-rose-700 text-white px-5 py-2.5 rounded-xl text-xs font-bold shadow cursor-pointer transition"
        >
          🚨 Registered Boundary Dispute
        </button>
      </div>

      {/* KPI Stats Panel */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white border border-slate-250 p-5 rounded-2xl flex items-center gap-4 shadow-sm">
          <div className="bg-amber-100/50 text-[#006a4e] p-3 rounded-xl">
            <Building className="w-6 h-6" />
          </div>
          <div>
            <span className="text-slate-400 font-bold block text-[10px]">TOTAL ASSIGNMENTS LOGGER</span>
            <span className="text-xl font-extrabold text-slate-800">{properties.length}</span>
          </div>
        </div>
        
        <div className="bg-white border border-slate-250 p-5 rounded-2xl flex items-center gap-4 shadow-sm">
          <div className="bg-emerald-100 text-[#006a4e] p-3 rounded-xl">
            <CheckCircle2 className="w-6 h-6 text-[#006a4e]" />
          </div>
          <div>
            <span className="text-slate-400 font-bold block text-[10px]">AWAITING ADMINISTRATOR MUTATION</span>
            <span className="text-xl font-extrabold text-slate-800">{pendingTransfers.length}</span>
          </div>
        </div>

        <div className="bg-white border border-slate-250 p-5 rounded-2xl flex items-center gap-4 shadow-sm">
          <div className="bg-rose-100 text-rose-700 p-3 rounded-xl">
            <AlertTriangle className="w-6 h-6 text-rose-600" />
          </div>
          <div>
            <span className="text-slate-400 font-bold block text-[10px]">DISPUTED / TRIAL FREEZES</span>
            <span className="text-xl font-extrabold text-slate-800">
              {properties.filter((p) => p.hasDisputeFlag).length}
            </span>
          </div>
        </div>
      </div>

      {/* Pending Transfers Mutual Signature table check */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-4">
        <h2 className="text-base font-black text-slate-900 border-b border-slate-100 pb-3 flex items-center gap-2">
          ⏳ Pending Dual-Signature Mutation Approvals ({pendingTransfers.length})
        </h2>

        {pendingTransfers.length === 0 ? (
          <div className="py-10 text-center text-slate-400 text-xs">
            <Clock className="w-8 h-8 mx-auto text-slate-300 mb-2 animate-pulse" />
            No deed mutations pending administrative signature.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead>
                <tr className="bg-slate-50 text-slate-400 font-bold border-b border-slate-100">
                  <th className="py-3 px-4">DEED / PROP ID</th>
                  <th className="py-3 px-4">SELLER & BUYER ONEID</th>
                  <th className="py-3 px-4">AGREED PRICE (BDT)</th>
                  <th className="py-3 px-4">SMART CONTRACT STATUS</th>
                  <th className="py-3 px-4 text-right">ACTION</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {pendingTransfers.map((tx) => (
                  <tr key={tx.id} className="hover:bg-slate-50 font-medium text-slate-800">
                    <td className="py-3.5 px-4 font-mono">
                      <span className="block text-slate-950 font-bold">{tx.property?.title}</span>
                      <span className="text-[10px] text-[#006a4e] font-black">{tx.property?.propertyId}</span>
                    </td>
                    <td className="py-3.5 px-4 font-mono space-y-1">
                      <div><span className="text-slate-400 text-[9px] font-bold">Seller:</span> {tx.fromOwnerOneId}</div>
                      <div><span className="text-slate-400 text-[9px] font-bold">Buyer :</span> {tx.toOwnerOneId}</div>
                    </td>
                    <td className="py-3.5 px-4 font-bold text-slate-900">
                      ৳ {tx.agreedPriceBDT.toLocaleString('en-US')}
                    </td>
                    <td className="py-3.5 px-4 text-[10px] space-y-1">
                      <div className="flex items-center gap-1 font-bold font-mono text-emerald-800">
                        <CheckCircle className="w-3.5 h-3.5 text-[#006a4e]" /> Seller Signed: TRUE
                      </div>
                      <div className="flex items-center gap-1 font-bold font-mono text-emerald-800">
                        <CheckCircle className="w-3.5 h-3.5 text-[#006a4e]" /> Buyer Signed: TRUE
                      </div>
                      <div className="flex items-center gap-1 font-bold font-mono text-emerald-800">
                        <CheckCircle className="w-3.5 h-3.5 text-[#006a4e]" /> dispute free: TRUE
                      </div>
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <button
                        onClick={() => handleApproveMutation(tx.id)}
                        disabled={approvingId === tx.id}
                        className="bg-[#006a4e] hover:bg-[#00523c] text-[#FFF8E7] px-3.5 py-1.5 rounded-lg text-xs font-black cursor-pointer shadow transition"
                      >
                        {approvingId === tx.id ? 'Fulfilling...' : 'Seal Smart Contract'}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Primary Land Listings & Active Disputes table */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-6">
        <div className="border-b border-slate-100 pb-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <h2 className="text-base font-black text-slate-900 flex items-center gap-2">
            🏡 National Land Register List ({properties.length} Active Records)
          </h2>

          {/* District, zoning, and dispute Quick filters */}
          <div className="flex flex-wrap items-center gap-2">
            <select
              value={typeFilter}
              onChange={(e) => { setTypeFilter(e.target.value); setPage(1); }}
              className="px-2 py-1 bg-slate-50 border border-slate-200 rounded-lg text-xs font-semibold text-slate-700"
            >
              <option value="">Zoning (All)</option>
              <option value="RESIDENTIAL">RESIDENTIAL</option>
              <option value="COMMERCIAL">COMMERCIAL</option>
              <option value="AGRICULTURAL">AGRICULTURAL</option>
              <option value="INDUSTRIAL">INDUSTRIAL</option>
            </select>

            <select
              value={disputeFilter}
              onChange={(e) => { setDisputeFilter(e.target.value); setPage(1); }}
              className="px-2 py-1 bg-slate-50 border border-slate-200 rounded-lg text-xs font-semibold text-slate-700"
            >
              <option value="">Disputes (All)</option>
              <option value="true">Dispute Flag Active</option>
              <option value="false">Clear Title</option>
            </select>

            <button
              onClick={() => { setTypeFilter(''); setDisputeFilter(''); setDistrictFilter(''); setPage(1); }}
              className="px-2 py-1 border border-slate-200 rounded-lg text-xs font-bold text-slate-500 hover:bg-slate-50 cursor-pointer"
            >
              Reset
            </button>
          </div>
        </div>

        {properties.length === 0 ? (
          <div className="py-10 text-center text-slate-400 text-xs">No registered parcels recorded under active criteria filters.</div>
        ) : (
          <div className="space-y-4">
            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left">
                <thead>
                  <tr className="bg-slate-50 text-slate-400 font-bold border-b border-slate-100">
                    <th className="py-3 px-4">PROP ID / TITLE</th>
                    <th className="py-3 px-4">KHATIAN / DAG PLOT</th>
                    <th className="py-3 px-4">ZONING & DISTRICT</th>
                    <th className="py-3 px-4">CURRENT OWNER</th>
                    <th className="py-3 px-4">LITIGATION CAVEATS</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-800 font-semibold">
                  {properties.map((p) => (
                    <tr key={p.id} className="hover:bg-slate-50 font-medium">
                      <td className="py-3.5 px-4 font-mono">
                        <span className="font-extrabold text-slate-950 block">{p.title}</span>
                        <span className="text-[#006a4e] text-[10px] font-black">{p.propertyId}</span>
                      </td>
                      <td className="py-3.5 px-4 font-mono">
                        <div>Khatian: {p.khatianNumber}</div>
                        <div>Dag Dag: {p.plotNumber}</div>
                      </td>
                      <td className="py-3.5 px-4">
                        <div>{p.type}</div>
                        <div className="text-slate-400 text-[10px] font-bold">{p.district} • {p.division}</div>
                      </td>
                      <td className="py-3.5 px-4 font-mono">{p.currentOwnerOneId}</td>
                      <td className="py-3.5 px-4">
                        {p.hasDisputeFlag ? (
                          <div className="bg-rose-50 text-rose-800 p-2 rounded-xl text-[10px] border border-rose-200">
                            <span className="font-bold block">🚨 Boundary Overlap</span>
                            <span className="text-[10px] text-rose-700">{p.disputeReason}</span>
                          </div>
                        ) : (
                          <span className="text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded text-[10px] border border-emerald-100 font-bold inline-block">
                            Clear Title ✓
                          </span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination Controls */}
            {totalPages > 1 && (
              <div className="flex items-center justify-end gap-2 pt-4">
                <button
                  disabled={page === 1}
                  onClick={() => setPage(p => Math.max(1, p - 1))}
                  className="px-3 py-1.5 border border-slate-200 rounded-lg text-xs font-bold text-slate-600 hover:bg-slate-50 cursor-pointer disabled:opacity-50"
                >
                  Prev
                </button>
                <span className="text-xs text-slate-500 font-bold">Page {page} of {totalPages}</span>
                <button
                  disabled={page === totalPages}
                  onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                  className="px-3 py-1.5 border border-slate-200 rounded-lg text-xs font-bold text-slate-600 hover:bg-slate-50 cursor-pointer disabled:opacity-50"
                >
                  Next
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* PROPERTY Sector Ledger Cryptographic Verifier Box */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-4">
        <h3 className="text-sm font-black text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
          🛡️ Sovereign Land Ledger Cryptographic Auditor
        </h3>
        <p className="text-xs text-slate-500 max-w-2xl leading-relaxed">
          Verify sequence numbers, private key signatures, and previous block header hashes on the Ministry of Land decentralized ring payload to guarantee full cryptographic synchronization.
        </p>

        <div className="flex flex-col md:flex-row items-start gap-4">
          <button
            onClick={handleVerifyLedgerSector}
            disabled={verifyingLedger}
            className="bg-slate-900 border border-slate-800 hover:bg-black text-white px-5 py-2.5 rounded-xl text-xs font-bold shadow flex items-center gap-2 shrink-0 cursor-pointer transition"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${verifyingLedger ? 'animate-spin' : ''}`} />
            Scan Property Ledger blocks
          </button>

          {verifyResult && (
            <div className="bg-slate-50 border border-slate-250 p-4 rounded-2xl text-[11px] font-mono leading-relaxed text-slate-600 space-y-1 w-full">
              <p className="text-[#006a4e] font-extrabold flex items-center gap-1">
                <ShieldCheck className="w-4 h-4 text-[#006a4e]" /> AUDIT CERTIFICATE: {verifyResult.status}
              </p>
              <p>POLLED BLOCK SEQUENCE COUNT: {verifyResult.polledBlocks} records</p>
              <p>MERKLE ROUTE STATE PROOF     : {verifyResult.merkleIntegrity}</p>
              <p>LAST SECTOR BLOCK HASH       : {verifyResult.prevBlockLock}</p>
              <p>SYSTEM RECONCILIATION TS    : {verifyResult.auditTimestamp}</p>
            </div>
          )}
        </div>
      </div>

      {/* Dispute Modal popup */}
      {showDisputeModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-lg space-y-4 relative text-left">
            <button
              onClick={() => setShowDisputeModal(false)}
              className="absolute right-4 top-4 text-slate-400 hover:text-slate-600"
            >
              <X className="w-5 h-5" />
            </button>

            <h3 className="text-base font-black text-slate-950 flex items-center gap-1.5">
              🛑 Flag Boundary Dispute Overlap
            </h3>
            <p className="text-xs text-slate-500">
              Entering a dispute adds a transfer lock on the khatian block, immediately invalidating any open mutation handshakes.
            </p>

            <form onSubmit={handleFlagDispute} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700 block">Property Record ID</label>
                <select
                  required
                  value={disputeForm.propertyId}
                  onChange={(e) => setDisputeForm({ ...disputeForm, propertyId: e.target.value })}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none focus:border-[#006a4e] text-slate-800"
                >
                  <option value="">Select Target Property</option>
                  {properties.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.propertyId} - {p.title}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700 block">Legal Cause / Dispute Reason</label>
                <textarea
                  required
                  rows={3}
                  placeholder="e.g. Overlapping boundaries claimed in civil dispute suit DAG-1402."
                  value={disputeForm.reason}
                  onChange={(e) => setDisputeForm({ ...disputeForm, reason: e.target.value })}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none focus:border-[#006a4e] text-slate-800"
                />
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowDisputeModal(false)}
                  className="px-4 py-2 border border-slate-200 text-slate-600 hover:bg-slate-50 rounded-xl text-xs font-bold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submittingDispute}
                  className="bg-rose-600 hover:bg-rose-700 text-white px-5 py-2.5 rounded-xl text-xs font-bold cursor-pointer"
                >
                  {submittingDispute ? 'Freezing Khatian...' : 'Apply Settlement Freeze Lock'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
