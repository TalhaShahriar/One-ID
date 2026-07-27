import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../lib/api.js';
import { toast } from 'sonner';
import {
  Home,
  FileText,
  MapPin,
  TrendingUp,
  AlertOctagon,
  CheckCircle,
  HelpCircle,
  Search,
  PlusCircle,
  Clock,
  ArrowRight,
  ShieldCheck,
  Building,
  DollarSign,
  FileDigit,
  UserCheck
} from 'lucide-react';
import LedgerBadge from '../../shared/components/LedgerBadge.jsx';

export default function PropertyDashboard() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState({ properties: [], activeIncomingTransfers: [] });
  const [activeTab, setActiveTab] = useState('portfolio'); // 'portfolio', 'register'
  const [searchPropertyId, setSearchPropertyId] = useState('');

  // Register Form State
  const [form, setForm] = useState({
    title: '',
    address: '',
    division: 'Dhaka',
    district: '',
    upazila: '',
    mouza: '',
    khatianNumber: '',
    plotNumber: '',
    areaInDecimal: '',
    type: 'RESIDENTIAL',
    estimatedValueBDT: ''
  });
  const [submittingReg, setSubmittingReg] = useState(false);

  // Fetch own properties
  const fetchMyPropertyData = async () => {
    setLoading(true);
    try {
      const resp = await api.get('/property/mine');
      setData({
        properties: resp.data.properties || [],
        activeIncomingTransfers: resp.data.activeIncomingTransfers || []
      });
    } catch (err) {
      console.error('Fetch properties error:', err);
      toast.error('Failure reaching Ministry of Land secure nodes.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMyPropertyData();
  }, []);

  const handleRegisterProperty = async (e) => {
    e.preventDefault();
    setSubmittingReg(true);
    try {
      const payload = {
        ...form,
        areaInDecimal: parseFloat(form.areaInDecimal),
        estimatedValueBDT: form.estimatedValueBDT ? parseFloat(form.estimatedValueBDT) : null
      };
      await api.post('/property/register', payload);
      toast.success('Land title successfully mapped and sealed to the national registry!');
      setForm({
        title: '',
        address: '',
        division: 'Dhaka',
        district: '',
        upazila: '',
        mouza: '',
        khatianNumber: '',
        plotNumber: '',
        areaInDecimal: '',
        type: 'RESIDENTIAL',
        estimatedValueBDT: ''
      });
      setActiveTab('portfolio');
      fetchMyPropertyData();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Title registration unfulfilled.');
    } finally {
      setSubmittingReg(false);
    }
  };

  const handleVerifyPropertySearch = (e) => {
    e.preventDefault();
    if (!searchPropertyId.trim()) return;
    navigate(`/property/${searchPropertyId.trim().toUpperCase()}/history`);
  };

  return (
    <div className="max-w-6xl mx-auto px-4 py-8 space-y-8">
      {/* Header element */}
      <div className="bg-gradient-to-r from-[#006a4e] to-[#014f3b] text-white rounded-2xl p-6 md:p-8 shadow-md flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight flex items-center gap-2">
            🇧🇩 Ministry of Land Digital Cabinet
          </h1>
          <p className="text-teal-100 text-sm max-w-2xl mt-2 font-medium">
            Sovereign digital property locker & smart contract deed mutation platform. Secured via cryptographic chains to mitigate manual khatian tamper and dual-selling fraud deeds.
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setActiveTab('portfolio')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
              activeTab === 'portfolio'
                ? 'bg-amber-100 text-[#006a4e] shadow-sm'
                : 'bg-[#004d39] text-teal-100 hover:bg-[#003d2d]'
            }`}
          >
            My Land Portfolio
          </button>
          <button
            onClick={() => setActiveTab('register')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
              activeTab === 'register'
                ? 'bg-amber-100 text-[#006a4e] shadow-sm'
                : 'bg-[#004d39] text-teal-100 hover:bg-[#003d2d]'
            }`}
          >
            + Register Land Title
          </button>
        </div>
      </div>

      {/* Public Trace lookup Section */}
      <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="text-left">
          <h3 className="text-sm font-bold text-slate-800 flex items-center gap-1.5">
            🔍 Public Land Registry Audits (Full Chain of Title)
          </h3>
          <p className="text-xs text-slate-500">
            Audit any real-time land registration deed records without authentication credentials.
          </p>
        </div>
        <form onSubmit={handleVerifyPropertySearch} className="flex w-full sm:w-auto items-center gap-2">
          <input
            type="text"
            required
            placeholder="e.g. PROP-DHAKA-2026-64219"
            value={searchPropertyId}
            onChange={(e) => setSearchPropertyId(e.target.value)}
            className="px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs font-mono shadow-sm focus:outline-none focus:border-[#006a4e] text-slate-800 uppercase flex-1 sm:w-64"
          />
          <button
            type="submit"
            className="bg-[#006a4e] hover:bg-[#00523c] text-white px-4 py-2 rounded-xl font-bold text-xs flex items-center gap-1 cursor-pointer transition shadow"
          >
            <Search className="w-3.5 h-3.5" /> Trace
          </button>
        </form>
      </div>

      {loading ? (
        <div className="flex flex-col items-center justify-center py-20 gap-3">
          <div className="w-10 h-10 border-4 border-slate-200 border-t-[#006a4e] rounded-full animate-spin"></div>
          <p className="text-xs text-slate-500 font-mono">Querying decentralized property node logs...</p>
        </div>
      ) : activeTab === 'portfolio' ? (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 text-left">
          
          {/* Main holding title grid */}
          <div className="lg:col-span-2 space-y-6">
            <h2 className="text-lg font-bold text-slate-800 border-b border-slate-100 pb-2 flex items-center gap-2">
              🏡 Handheld Title Records ({data.properties.length})
            </h2>

            {data.properties.length === 0 ? (
              <div className="bg-white border border-dashed border-slate-300 rounded-2xl p-12 text-center text-slate-500 space-y-3">
                <Home className="w-12 h-12 text-slate-300 mx-auto" />
                <p className="text-sm font-semibold">No Registered Land Assets Linked</p>
                <p className="text-xs text-slate-400 max-w-sm mx-auto">
                  You do not have any land parcels mapping credentials sealed under your OneID login. Register an asset using your physical khatian paper deeds.
                </p>
                <button
                  onClick={() => setActiveTab('register')}
                  className="bg-slate-150 border border-slate-300 text-slate-700 hover:bg-slate-200 px-4 py-2 rounded-xl text-xs font-bold transition"
                >
                  Register Land Title
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {data.properties.map((property) => (
                  <div
                    key={property.id}
                    className="bg-[#FFF8E7] border-2 border-[#006a4e] rounded-2xl p-5 shadow-sm space-y-4 hover:shadow-md transition relative flex flex-col justify-between"
                  >
                    <div>
                      <div className="flex items-start justify-between gap-1.5">
                        <span className="bg-[#e6f3eb] text-[#006a4e] px-2.5 py-1 rounded-lg text-[10px] font-mono font-bold tracking-tight">
                          {property.propertyId}
                        </span>
                        {property.ledgerRecordId && (
                          <LedgerBadge sector="PROPERTY" recordId={property.ledgerRecordId} />
                        )}
                      </div>

                      <h3 className="font-extrabold text-slate-900 mt-3 text-base leading-tight">
                        {property.title}
                      </h3>
                      <p className="text-slate-600 text-xs flex items-center gap-1 mt-1 font-medium">
                        <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" /> {property.address}
                      </p>

                      <div className="grid grid-cols-2 gap-x-4 gap-y-2 border-t border-dashed border-[#d3ccb8]/60 mt-4 pt-3 font-medium text-xs text-slate-700">
                        <div>
                          <span className="text-slate-500 text-[10px] block font-semibold">KHATIAN NUMBER</span>
                          <span className="font-mono text-slate-900">{property.khatianNumber}</span>
                        </div>
                        <div>
                          <span className="text-slate-500 text-[10px] block font-semibold">PLOT DIGITS</span>
                          <span className="font-mono text-slate-900">{property.plotNumber}</span>
                        </div>
                        <div>
                          <span className="text-slate-500 text-[10px] block font-semibold">TOTAL AREA (DECIMAL)</span>
                          <span className="text-slate-900 font-bold">{property.areaInDecimal} dec</span>
                        </div>
                        <div>
                          <span className="text-slate-500 text-[10px] block font-semibold">LAND SECTOR</span>
                          <span className="text-[#006a4e] font-bold">{property.type}</span>
                        </div>
                        {property.estimatedValueBDT && (
                          <div className="col-span-2 mt-1.5 bg-[#f5ecd4] px-2 py-1 rounded-lg text-amber-950 font-bold flex items-center justify-between">
                            <span>Estimated Valuation:</span>
                            <span>৳ {property.estimatedValueBDT.toLocaleString('en-US')} BDT</span>
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="pt-4 border-t border-[#d3ccb8]/45">
                      {property.hasDisputeFlag ? (
                        <div className="bg-rose-50 border border-rose-200 text-rose-800 text-xs p-2.5 rounded-xl space-y-1">
                          <span className="font-extrabold flex items-center gap-1 text-rose-800">
                            <AlertOctagon className="w-3.5 h-3.5 text-rose-600 shrink-0" /> Title Under Dispute
                          </span>
                          <p className="text-[11px] leading-relaxed text-rose-700 font-medium">
                            Mutation Locked: {property.disputeReason}
                          </p>
                        </div>
                      ) : (
                        <div className="flex items-center justify-between gap-2">
                          <button
                            onClick={() => navigate(`/property/transfer?propId=${property.id}`)}
                            className="w-full bg-[#006a4e] hover:bg-[#00523c] text-[#FFF8E7] py-2 px-3 rounded-xl font-extrabold text-xs flex items-center justify-center gap-1 cursor-pointer transition shadow"
                          >
                            Initiate Transfer Mutation <ArrowRight className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Incoming mutation requests from other users */}
          <div className="space-y-6">
            <h2 className="text-lg font-bold text-slate-800 border-b border-slate-100 pb-2 flex items-center gap-2">
              📥 Mutual Consent Requests ({data.activeIncomingTransfers.length})
            </h2>

            {data.activeIncomingTransfers.length === 0 ? (
              <div className="bg-slate-50 border border-slate-200 rounded-2xl p-6 text-center text-slate-400 space-y-2">
                <Clock className="w-8 h-8 mx-auto text-slate-300" />
                <p className="text-xs font-medium">No Pending Buyer Handshakes</p>
                <p className="text-[11px] text-slate-400 max-w-xs mx-auto">
                  When a seller initiates an ownership transfer specifying your OneID as recipient, the pending signature ticket details project here.
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {data.activeIncomingTransfers.map((tx) => (
                  <div
                    key={tx.id}
                    className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm space-y-4 text-left"
                  >
                    <div className="flex items-center justify-between">
                      <span className="bg-amber-100 text-amber-800 px-2.5 py-0.5 rounded-full text-[10px] font-extrabold">
                        {tx.status === 'PENDING_BUYER_SIGN' ? 'Awaiting Your Signature' : tx.status}
                      </span>
                      <span className="text-[10px] text-slate-400 font-mono">
                        {new Date(tx.createdAt).toLocaleDateString()}
                      </span>
                    </div>

                    <div className="space-y-2">
                      <h4 className="font-extrabold text-sm text-slate-900">
                        {tx.property?.title || 'Unknown Property'}
                      </h4>
                      <p className="text-xs text-slate-500 font-medium">
                        Seller: <span className="font-mono text-slate-700 font-bold">{tx.fromOwnerOneId}</span>
                      </p>
                      <div className="bg-slate-50 rounded-xl p-2.5 flex items-center justify-between text-xs">
                        <span className="text-slate-500 font-medium">Agreed Consideration:</span>
                        <span className="font-extrabold text-slate-900 text-sm">৳ {tx.agreedPriceBDT.toLocaleString('en-US')}</span>
                      </div>
                    </div>

                    <button
                      onClick={() => navigate(`/property/consent/${tx.id}`)}
                      className="w-full bg-slate-900 hover:bg-slate-950 text-white font-extrabold text-xs py-2.5 rounded-xl cursor-pointer shadow transition-all duration-150 flex items-center justify-center gap-1.5"
                    >
                      <UserCheck className="w-4 h-4 text-teal-400" /> Accept Deed & Sign
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

        </div>
      ) : (
        /* Property register page section */
        <div className="bg-white border border-slate-200 shadow-sm rounded-2xl p-6 md:p-8 text-left max-w-3xl mx-auto">
          <div className="border-b border-slate-100 pb-4 mb-6">
            <h2 className="text-xl font-bold text-slate-900">✏️ Register a Land Title Record</h2>
            <p className="text-xs text-slate-500 mt-1">
              Provide exact, legal, and registered boundary coordinates corresponding to approved mutation forms.
            </p>
          </div>

          <form onSubmit={handleRegisterProperty} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              
              <div className="md:col-span-2 space-y-2">
                <label className="text-xs font-bold text-slate-700 block">Deed Document / Asset Title</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Uttara Ward-06 Residential Plot"
                  value={form.title}
                  onChange={(e) => setForm({ ...form, title: e.target.value })}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-[#006a4e]/20 focus:border-[#006a4e] text-slate-800"
                />
              </div>

              <div className="md:col-span-2 space-y-2">
                <label className="text-xs font-bold text-slate-700 block">Location Address</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Sector-3, Road-4, Uttara, Dhaka"
                  value={form.address}
                  onChange={(e) => setForm({ ...form, address: e.target.value })}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-[#006a4e]/20 focus:border-[#006a4e] text-slate-800"
                />
              </div>

              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-700 block">Division</label>
                <select
                  required
                  value={form.division}
                  onChange={(e) => setForm({ ...form, division: e.target.value })}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none focus:border-[#006a4e] text-slate-800"
                >
                  <option value="Dhaka">Dhaka</option>
                  <option value="Chittagong">Chittagong</option>
                  <option value="Rajshahi">Rajshahi</option>
                  <option value="Khulna">Khulna</option>
                  <option value="Sylhet">Sylhet</option>
                  <option value="Rangpur">Rangpur</option>
                  <option value="Barisal">Barisal</option>
                  <option value="Mymensingh">Mymensingh</option>
                </select>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-700 block">District</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Dhaka"
                  value={form.district}
                  onChange={(e) => setForm({ ...form, district: e.target.value })}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none focus:border-[#006a4e] text-slate-800"
                />
              </div>

              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-700 block">Upazila / Thana</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Uttara Thana"
                  value={form.upazila}
                  onChange={(e) => setForm({ ...form, upazila: e.target.value })}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none focus:border-[#006a4e] text-slate-800"
                />
              </div>

              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-700 block">Mouza J.L. Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Mouza Baunia"
                  value={form.mouza}
                  onChange={(e) => setForm({ ...form, mouza: e.target.value })}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none focus:border-[#006a4e] text-slate-800"
                />
              </div>

              <div className="grid grid-cols-2 gap-4 md:col-span-2">
                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-700 block">Khatian Number (BS/CS/RS)</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. RS-3420"
                    value={form.khatianNumber}
                    onChange={(e) => setForm({ ...form, khatianNumber: e.target.value })}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono font-bold focus:outline-none focus:border-[#006a4e] text-slate-800"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-700 block">Plot Number (Dag No.)</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. DAG-1402"
                    value={form.plotNumber}
                    onChange={(e) => setForm({ ...form, plotNumber: e.target.value })}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono font-bold focus:outline-none focus:border-[#006a4e] text-slate-800"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-700 block">Land Area in Decimal</label>
                <input
                  type="number"
                  step="0.01"
                  required
                  placeholder="e.g. 5.15"
                  value={form.areaInDecimal}
                  onChange={(e) => setForm({ ...form, areaInDecimal: e.target.value })}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none focus:border-[#006a4e] text-slate-800"
                />
              </div>

              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-700 block">Land Type Classification</label>
                <select
                  required
                  value={form.type}
                  onChange={(e) => setForm({ ...form, type: e.target.value })}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none focus:border-[#006a4e] text-slate-800"
                >
                  <option value="RESIDENTIAL">RESIDENTIAL</option>
                  <option value="COMMERCIAL">COMMERCIAL</option>
                  <option value="AGRICULTURAL">AGRICULTURAL</option>
                  <option value="INDUSTRIAL">INDUSTRIAL</option>
                </select>
              </div>

              <div className="md:col-span-2 space-y-2">
                <label className="text-xs font-bold text-slate-700 block">Estimated Valuation (BDT)</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                    <span className="text-slate-500 font-bold text-xs">৳</span>
                  </div>
                  <input
                    type="number"
                    placeholder="e.g. 15000000"
                    value={form.estimatedValueBDT}
                    onChange={(e) => setForm({ ...form, estimatedValueBDT: e.target.value })}
                    className="w-full pl-8 pr-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none focus:border-[#006a4e] text-slate-800"
                  />
                </div>
              </div>

            </div>

            <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={() => setActiveTab('portfolio')}
                className="px-4 py-2.5 border border-slate-200 text-slate-600 hover:bg-slate-50 rounded-xl text-xs font-bold transition cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={submittingReg}
                className="bg-[#006a4e] hover:bg-[#00523c] text-white px-5 py-2.5 rounded-xl text-xs font-extrabold shadow cursor-pointer transition flex items-center gap-1.5"
              >
                {submittingReg ? (
                  <>
                    <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    Executing Smart Seal...
                  </>
                ) : (
                  <>
                    <ShieldCheck className="w-4 h-4" /> Register & Ledger Secure
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
