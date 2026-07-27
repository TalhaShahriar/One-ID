import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../../lib/api.js';
import { toast } from 'sonner';
import { 
  History, 
  ArrowLeft, 
  ShieldCheck, 
  Calendar, 
  User, 
  Compass, 
  AlertTriangle,
  Search,
  BookOpen,
  ArrowRight
} from 'lucide-react';
import LedgerBadge from '../../shared/components/LedgerBadge.jsx';

export default function VehicleHistoryPublic() {
  const { registrationNo } = useParams();
  const navigate = useNavigate();

  const [searchQuery, setSearchQuery] = useState(registrationNo || '');
  const [loading, setLoading] = useState(false);
  const [historyData, setHistoryData] = useState(null);

  const fetchPublicHistory = async (regNo) => {
    if (!regNo) return;
    setLoading(true);
    setHistoryData(null);
    try {
      const resp = await api.get(`/vehicle/${regNo.trim().toUpperCase()}/history`);
      setHistoryData(resp.data);
    } catch (err) {
      console.error('Fetch public history error:', err);
      toast.error(err.response?.data?.error || 'Vehicle plate not registered.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (registrationNo) {
      fetchPublicHistory(registrationNo);
    }
  }, [registrationNo]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    if (!searchQuery.trim()) {
      toast.error('Please input a vehicle registration plate number.');
      return;
    }
    navigate(`/vehicle/${searchQuery.trim().toUpperCase()}/history`);
  };

  return (
    <div className="max-w-3xl mx-auto px-4 py-8 space-y-8 font-sans" id="vehicle-public-history-wrapper">
      
      {/* Back link handles citizen or public anchor */}
      <button 
        onClick={() => navigate('/vehicle')}
        className="flex items-center gap-1.5 text-xs text-slate-500 hover:text-slate-800 transition font-bold cursor-pointer"
      >
        <ArrowLeft className="w-4 h-4" /> Go to Private Cabinet Dashboard
      </button>

      {/* Header title */}
      <div className="space-y-1.5 border-b border-slate-150 pb-5 text-left">
        <div className="flex items-center gap-1.5 font-mono text-[9px] font-black text-emerald-800 uppercase bg-emerald-50 px-2.5 py-1 rounded inline-block border border-emerald-150">
          🇧🇩 PEOPLE'S REPUBLIC OF BANGLADESH • OPEN AUDIT
        </div>
        <h1 className="text-xl font-black text-slate-900 tracking-tight pt-1">
          🕵️ Sovereign Vehicular Transfer History Ledger
        </h1>
        <p className="text-xs text-slate-500">
          Decentralized verification checkpoint. Run standard public trace inspect audits for clear titles, past liens, and authenticated owners.
        </p>
      </div>

      {/* Search Input Box */}
      <form onSubmit={handleSearchSubmit} className="bg-white border rounded-2xl p-6 shadow-sm space-y-3 text-left">
        <label className="text-[10px] uppercase font-black text-slate-450 block font-mono">
          Enter Vehicle Registration Plate Code
        </label>
        <div className="flex flex-col sm:flex-row gap-2">
          <input
            type="text"
            required
            placeholder="e.g. DHAKA-GA-ME-5432"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="flex-1 bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm font-mono font-black uppercase tracking-wider text-slate-800 focus:outline-none focus:border-emerald-600 focus:bg-white"
          />
          <button
            type="submit"
            className="bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs px-6 py-3 rounded-xl transition cursor-pointer flex items-center justify-center gap-1.5"
          >
            <Search className="w-4 h-4" /> Verify Ownership Chain
          </button>
        </div>
      </form>

      {/* States Loading / Empty / Data */}
      {loading ? (
        <div className="py-16 text-center font-mono text-xs font-bold text-slate-500">
          Interrogating BRTA ledger block nodes...
        </div>
      ) : historyData ? (
        <div className="space-y-8 text-left">
          
          {/* Vehicle summary specifications card */}
          <div className="bg-slate-900 text-white p-6 rounded-2xl space-y-4 shadow-md relative">
            <div className="flex justify-between items-start border-b border-slate-800 pb-3">
              <div className="space-y-0.5">
                <span className="text-[9px] uppercase font-mono text-emerald-400 font-black">REGISTRY CONFIRMED</span>
                <h2 className="text-lg font-black">{historyData.vehicle.make} {historyData.vehicle.model} ({historyData.vehicle.year})</h2>
              </div>
              <span className="bg-emerald-800 text-emerald-100 font-mono font-black px-3 py-1 rounded text-xs leading-none tracking-widest uppercase">
                {historyData.vehicle.status}
              </span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs font-mono">
              <div className="space-y-0.5">
                <span className="text-[8px] text-slate-400 block font-sans uppercase">Plate Number</span>
                <strong className="text-emerald-400 text-sm tracking-tight font-black">{historyData.vehicle.registrationNo}</strong>
              </div>
              <div className="space-y-0.5">
                <span className="text-[8px] text-slate-400 block font-sans uppercase">Color Schema</span>
                <strong className="text-slate-100">{historyData.vehicle.color}</strong>
              </div>
              <div className="space-y-0.5">
                <span className="text-[8px] text-slate-400 block font-sans uppercase">Vehicle Class</span>
                <strong className="text-slate-100">{historyData.vehicle.type}</strong>
              </div>
              <div className="space-y-0.5">
                <span className="text-[8px] text-slate-400 block font-sans uppercase">Masked Owner OneID</span>
                <strong className="text-yellow-400 uppercase tracking-tighter text-[11px]">{historyData.vehicle.currentOwnerOneId}</strong>
              </div>
            </div>
          </div>

          {/* CHRONOLOGICAL TIMELINE SEQUENCE BLOCK */}
          <div className="space-y-6">
            <h3 className="text-sm font-black text-slate-800 flex items-center gap-1">
              <History className="w-4 h-4 text-[#006a4e]" />
              Immutable Chain Timeline (Chronological Milestones)
            </h3>

            {/* If no transfers exist yet, show genesis registration step */}
            <div className="relative border-l-2 border-slate-200 pl-6 ml-3 space-y-8 text-xs text-slate-655 text-slate-700">
              
              {/* Mapping transfers */}
              {historyData.transfers && historyData.transfers.length > 0 ? (
                historyData.transfers.map((tr, index) => (
                  <div key={tr.id} className="relative space-y-2">
                    {/* Circle bullet */}
                    <span className="absolute -left-[31px] top-1.5 w-4.5 h-4.5 rounded-full bg-emerald-600 text-white font-mono font-black text-[9px] flex items-center justify-center border-4 border-white shadow-sm ring-1 ring-slate-150">
                      {index + 1}
                    </span>

                    <div className="bg-white border rounded-2xl p-5 hover:border-slate-350 transition shadow-sm space-y-3">
                      <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-2">
                        <div className="space-y-0.5">
                          <span className="text-[9px] font-mono text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-150 font-black uppercase">
                            TRANSFER MILESTONE • {tr.status}
                          </span>
                          <p className="text-[10px] text-slate-400 font-bold block pt-1 font-mono">
                            Initiated: {new Date(tr.initiatedAt).toLocaleString()}
                          </p>
                        </div>
                        <LedgerBadge sector="VEHICLE" recordId={tr.ledgerRecordId} />
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-[11px] bg-slate-50 p-3 rounded-lg border border-slate-150 font-mono">
                        <div>
                          <span className="text-[8px] uppercase font-bold text-slate-400 block font-sans">Seller (From Owner)</span>
                          <span className="font-semibold text-slate-800 tracking-tight block uppercase text-[10px]">{tr.fromOwnerOneId}</span>
                          <span className="text-[9px] text-slate-400">Signed: {tr.sellerSignedAt ? new Date(tr.sellerSignedAt).toLocaleDateString() : 'Pending'}</span>
                        </div>
                        <div>
                          <span className="text-[8px] uppercase font-bold text-slate-400 block font-sans">Buyer (To Owner)</span>
                          <span className="font-semibold text-slate-800 tracking-tight block uppercase text-[10px]">{tr.toOwnerOneId}</span>
                          <span className="text-[9px] text-slate-400">Signed: {tr.buyerSignedAt ? new Date(tr.buyerSignedAt).toLocaleDateString() : 'Pending'}</span>
                        </div>
                      </div>

                      {tr.adminApprovedAt && (
                        <div className="flex items-center gap-1.5 text-[10px] text-slate-500 font-medium">
                          <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                          <span>Cleared by National Transit Registrar on {new Date(tr.adminApprovedAt).toLocaleString()}</span>
                        </div>
                      )}
                    </div>
                  </div>
                ))
              ) : (
                <div className="relative">
                  {/* Genesis display */}
                  <span className="absolute -left-[31px] top-1 hover:bg-emerald-600 cursor-default w-4 w-4 bg-emerald-600 rounded-full border-4 border-white shadow ring-1 ring-slate-150" />
                  <div className="bg-emerald-50/50 border border-emerald-150 rounded-2xl p-5 text-xs text-slate-700 space-y-2">
                    <p className="font-extrabold text-emerald-800">🌱 Genesis Sovereign Registration</p>
                    <p className="text-slate-500 text-[11px]">
                      This vehicle was added to the national registry, and its cryptographic fingerprint hash was sealed directly into the OneID blockchain ledger. No subsequent transfer items have been completed.
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>
          
        </div>
      ) : (
        <div className="bg-slate-50 border border-slate-200 border-dashed rounded-3xl p-12 text-center space-y-3">
          <BookOpen className="w-10 h-10 text-slate-400 mx-auto" />
          <h3 className="text-sm font-bold text-slate-700">Registry Search Inactive</h3>
          <p className="text-xs text-slate-400 max-w-sm mx-auto leading-relaxed">
            Search a vehicle registration code using Dhaka or Chittagong division codes (e.g. `DHAKA-GA-XX-XXXX`) to query the chain timeline.
          </p>
        </div>
      )}

    </div>
  );
}
