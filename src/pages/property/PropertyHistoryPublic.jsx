import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../../lib/api.js';
import { toast } from 'sonner';
import {
  FileText,
  Clock,
  CheckCircle2,
  AlertTriangle,
  History,
  Shield,
  ShieldCheck,
  Search,
  Building,
  User,
  ExternalLink,
  MapPin,
  Home
} from 'lucide-react';
import LedgerBadge from '../../shared/components/LedgerBadge.jsx';

export default function PropertyHistoryPublic() {
  const { propertyId } = useParams();
  const navigate = useNavigate();

  const [searchVal, setSearchVal] = useState(propertyId || '');
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState(null);

  const fetchHistory = async (id) => {
    if (!id) return;
    setLoading(true);
    setData(null);
    try {
      const resp = await api.get(`/property/${id.trim()}/history`);
      setData(resp.data);
    } catch (err) {
      toast.error(err.response?.data?.error || "This land record does not exist on the OneID sovereign ledger.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (propertyId) {
      setSearchVal(propertyId);
      fetchHistory(propertyId);
    }
  }, [propertyId]);

  const handleSearch = (e) => {
    e.preventDefault();
    if (!searchVal.trim()) return;
    navigate(`/property/${searchVal.trim().toUpperCase()}/history`);
  };

  // Helper to determine contract status states of a transfer
  const getSmartContractStatus = (property, transfer) => {
    if (!transfer) return null;
    const sellerSigned = !!transfer.sellerSignatureHash;
    const buyerSigned = !!transfer.buyerSignatureHash;
    const hasNoDispute = !property.hasDisputeFlag;
    const adminApproved = transfer.status === 'COMPLETED' || !!transfer.adminApprovedAt;

    return {
      sellerSigned,
      buyerSigned,
      hasNoDispute,
      adminApproved,
      isFulfilled: sellerSigned && buyerSigned && hasNoDispute && adminApproved
    };
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-8 space-y-8 text-left">
      {/* Title block */}
      <div className="text-center space-y-3">
        <h1 className="text-2xl md:text-3xl font-black text-slate-900 flex items-center justify-center gap-2">
          🏛️ Legal Deed Chain-of-Title Verifier
        </h1>
        <p className="text-xs text-slate-500 max-w-lg mx-auto leading-relaxed">
          The public, open network verification terminal for the Ministry of Land. Real-time auditing of khatian deed mutations, verified signatures, and blockchain sequence blocks.
        </p>
      </div>

      {/* Lookup Bar */}
      <form onSubmit={handleSearch} className="bg-white border-2 border-[#006a4e]/20 p-4 rounded-2xl flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <input
            type="text"
            required
            placeholder="ENTER LAND DEED CODE (e.g. PROP-DHAKA-2026-64219)"
            value={searchVal}
            onChange={(e) => setSearchVal(e.target.value)}
            className="w-full pl-3.5 pr-10 py-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono font-black placeholder-slate-400 focus:outline-none focus:border-[#006a4e] text-slate-800 uppercase"
          />
          <Search className="w-4 h-4 text-slate-400 absolute right-3.5 top-3.5" />
        </div>
        <button
          type="submit"
          disabled={loading}
          className="bg-[#006a4e] hover:bg-[#00523c] text-white px-6 py-3 rounded-xl font-extrabold text-xs cursor-pointer shadow-sm transition"
        >
          {loading ? 'Searching Ledger...' : 'Verify Land Record'}
        </button>
      </form>

      {loading && (
        <div className="py-20 text-center space-y-3">
          <div className="w-10 h-10 border-4 border-[#006a4e] border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="text-xs text-slate-500 font-mono">Querying decentralized title hash ring...</p>
        </div>
      )}

      {!loading && !data && propertyId && (
        <div className="bg-white border border-slate-200 rounded-2xl p-12 text-center text-slate-400 space-y-2">
          <AlertTriangle className="w-10 h-10 text-rose-500 mx-auto animate-bounce" />
          <p className="text-xs font-bold text-slate-700">No Land Record Discovered</p>
          <p className="text-[11px] text-slate-400 max-w-xs mx-auto">
            The Property ID "{propertyId}" does not carry any cryptographically matching ledger records on the OneID Bangladesh Platform.
          </p>
        </div>
      )}

      {data && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          
          {/* Left panel: Khatian Parchment Card */}
          <div className="md:col-span-1 space-y-6">
            <h2 className="text-sm font-bold text-slate-400 uppercase tracking-widest">Active Land Record</h2>
            
            <div className="bg-[#FFF8E7] border-2 border-[#006a4e] rounded-3xl p-5 shadow-sm space-y-4 relative">
              <div className="flex items-center justify-between">
                <span className="bg-[#e6f3eb] text-[#006a4e] px-2.5 py-0.5 rounded-md text-[9px] font-mono font-bold">
                  {data.property.propertyId}
                </span>
                {data.property.hasDisputeFlag && (
                  <span className="bg-rose-100 text-rose-700 px-2 py-0.5 rounded text-[8px] font-black uppercase">
                    Disputed
                  </span>
                )}
              </div>

              <div>
                <h3 className="font-extrabold text-slate-900 text-sm leading-tight">{data.property.title}</h3>
                <p className="text-slate-500 text-[11px] flex items-center gap-1 mt-1 font-medium">
                  <MapPin className="w-3 h-3 text-slate-400" /> {data.property.address}
                </p>
              </div>

              <div className="border-t border-dashed border-[#d3ccb8] pt-3.5 space-y-3 text-xs text-slate-700 font-semibold font-mono">
                <div>
                  <span className="text-[10px] text-slate-400 font-bold block">CURRENT TITLE HOLDER</span>
                  <span className="text-slate-900 flex items-center gap-1">
                    <User className="w-3.5 h-3.5 text-slate-400" /> {data.property.currentOwnerOneId}
                  </span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 font-bold block">KHATIAN NUMBER</span>
                  <span className="text-slate-900">{data.property.khatianNumber}</span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 font-bold block">PLOT DAG DAG REGISTER</span>
                  <span className="text-slate-900">{data.property.plotNumber}</span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 font-bold block">MOUZA DISTRICT</span>
                  <span className="text-slate-900">{data.property.mouza}, {data.property.district}</span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 font-bold block">PARCEL INTENSITY</span>
                  <span className="text-slate-900 font-sans font-extrabold">{data.property.areaInDecimal} Decimals</span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 font-bold block">ZONING CLASSIFICATION</span>
                  <span className="text-[#006a4e] font-sans font-extrabold">{data.property.type}</span>
                </div>
              </div>
            </div>

            {data.property.hasDisputeFlag && (
              <div className="bg-rose-50 border border-rose-200 text-rose-800 p-4 rounded-2xl text-xs space-y-1.5 leading-relaxed">
                <span className="font-extrabold flex items-center gap-1 text-rose-800">
                  <AlertTriangle className="w-4 h-4 text-rose-600" /> Dispute Alert Block
                </span>
                <p className="font-medium">
                  Boundary mutation operations has been frozen by administration due to active litigation: "{data.property.disputeReason}".
                </p>
              </div>
            )}
          </div>

          {/* Right/Middle content: Title history and contract verification timeline */}
          <div className="md:col-span-2 space-y-8">
            <div>
              <h2 className="text-sm font-bold text-slate-400 uppercase tracking-widest mb-4">Chain-of-Title Mutation History</h2>
              
              {data.transfers.length === 0 ? (
                <div className="bg-white border border-slate-200 rounded-2xl p-8 text-center text-slate-400 space-y-2 text-xs font-semibold">
                  <Building className="w-8 h-8 text-slate-300 mx-auto" />
                  <p>First Seal Genesis Ownership</p>
                  <p className="text-[10px] text-slate-400 max-w-xs mx-auto">This asset remains held by its original, primary digital khatian registrant. No deed mutations have been loaded yet.</p>
                </div>
              ) : (
                <div className="space-y-6">
                  {/* Vertical Timeline */}
                  {data.transfers.map((tx, idx) => {
                    const contract = getSmartContractStatus(data.property, tx);
                    return (
                      <div key={tx.id} className="relative pl-6 border-l-2 border-slate-250 pb-2">
                        {/* Dot marker */}
                        <div className={`w-3.5 h-3.5 rounded-full absolute -left-[8px] top-1 ${
                          tx.status === 'COMPLETED' ? 'bg-[#006a4e]' : 'bg-amber-500 animate-pulse'
                        }`} />

                        <div className="space-y-4">
                          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                            <div>
                              <h3 className="font-black text-slate-900 text-sm">
                                Ownership Deed Transfer Step {idx + 1}
                              </h3>
                              <p className="text-[10px] text-slate-400 font-mono">
                                Sequence: {tx.id} | Date: {new Date(tx.createdAt).toLocaleDateString()}
                              </p>
                            </div>
                            <span className={`self-start sm:self-center px-2.5 py-0.5 rounded text-[9px] font-extrabold font-mono uppercase ${
                              tx.status === 'COMPLETED'
                                ? 'bg-emerald-100 text-emerald-800'
                                : tx.status === 'CANCELLED'
                                ? 'bg-slate-100 text-slate-500'
                                : 'bg-amber-100 text-amber-800 animate-pulse'
                            }`}>
                              {tx.status}
                            </span>
                          </div>

                          <div className="bg-white border border-slate-200 rounded-2xl p-4 grid grid-cols-1 md:grid-cols-2 gap-4 text-[11px] font-semibold text-slate-700">
                            <div className="space-y-2">
                              <div>
                                <span className="text-slate-400 text-[10px] block">PREVIOUS OWNER</span>
                                <span className="font-mono text-slate-900">{tx.fromOwnerOneId}</span>
                              </div>
                              <div>
                                <span className="text-slate-400 text-[10px] block">RECIPIENT TITLE HOLDER</span>
                                <span className="font-mono text-slate-900">{tx.toOwnerOneId}</span>
                              </div>
                              <div>
                                <span className="text-slate-400 text-[10px] block">DEED TRANSACTION VALUE</span>
                                <span className="font-sans font-extrabold text-slate-950 text-xs">৳ {tx.agreedPriceBDT.toLocaleString('en-US')} BDT</span>
                              </div>
                              {tx.ledgerRecordId && (
                                <div className="pt-1.5">
                                  <LedgerBadge sector="PROPERTY" recordId={tx.ledgerRecordId} />
                                </div>
                              )}
                            </div>

                            {/* Smart Contract Indicator (4 conditions checkboxes) */}
                            <div className="bg-slate-50 rounded-xl p-3.5 border border-slate-200/60 space-y-2">
                              <h4 className="text-[10px] font-bold text-slate-900 uppercase tracking-wider flex items-center gap-1">
                                <ShieldCheck className="w-3.5 h-3.5 text-[#006a4e]" /> 4-Condition Smart Contract Checklist:
                              </h4>
                              
                              <ul className="space-y-1.5 font-bold font-mono text-[9px] text-slate-600">
                                <li className="flex items-center gap-1.5">
                                  <span className={`w-3.5 h-3.5 rounded-full flex items-center justify-center text-white ${
                                    contract?.sellerSigned ? 'bg-[#006a4e]' : 'bg-slate-300'
                                  }`}>
                                    {contract?.sellerSigned ? '✓' : '✗'}
                                  </span>
                                  <span>Seller Signed: {contract?.sellerSigned ? 'TRUE' : 'FALSE'}</span>
                                </li>
                                <li className="flex items-center gap-1.5">
                                  <span className={`w-3.5 h-3.5 rounded-full flex items-center justify-center text-white ${
                                    contract?.buyerSigned ? 'bg-[#006a4e]' : 'bg-slate-300'
                                  }`}>
                                    {contract?.buyerSigned ? '✓' : '✗'}
                                  </span>
                                  <span>Buyer Signed: {contract?.buyerSigned ? 'TRUE' : 'FALSE'}</span>
                                </li>
                                <li className="flex items-center gap-1.5">
                                  <span className={`w-3.5 h-3.5 rounded-full flex items-center justify-center text-white ${
                                    contract?.hasNoDispute ? 'bg-[#006a4e]' : 'bg-rose-500'
                                  }`}>
                                    {contract?.hasNoDispute ? '✓' : '✗'}
                                  </span>
                                  <span>No Dispute Flag: {contract?.hasNoDispute ? 'TRUE' : 'FALSE'}</span>
                                </li>
                                <li className="flex items-center gap-1.5">
                                  <span className={`w-3.5 h-3.5 rounded-full flex items-center justify-center text-white ${
                                    contract?.adminApproved ? 'bg-[#006a4e]' : 'bg-slate-300'
                                  }`}>
                                    {contract?.adminApproved ? '✓' : '✗'}
                                  </span>
                                  <span>Admin Approved: {contract?.adminApproved ? 'TRUE' : 'FALSE'}</span>
                                </li>
                              </ul>

                              {contract?.isFulfilled && (
                                <div className="text-[#006a4e] font-sans font-bold text-[10px] flex items-center gap-1 bg-emerald-50 p-1.5 rounded-md border border-emerald-200 mt-2">
                                  <CheckCircle2 className="w-3.5 h-3.5 text-[#006a4e]" /> Mutation Fully Executed!
                                </div>
                              )}
                            </div>
                          </div>
                        </div>

                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

        </div>
      )}
    </div>
  );
}
