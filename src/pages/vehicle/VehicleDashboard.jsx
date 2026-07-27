import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../lib/api.js';
import { toast } from 'sonner';
import {
  FileText,
  CreditCard,
  PlusCircle,
  AlertTriangle,
  CheckCircle2,
  Calendar,
  DollarSign,
  User,
  Shield,
  Search,
  ArrowRight,
  ShieldAlert,
  MapPin,
  RefreshCw,
  QrCode
} from 'lucide-react';
import LedgerBadge from '../../shared/components/LedgerBadge.jsx';
import DrivingLicense from '../../components/DrivingLicense.jsx';

export default function VehicleDashboard() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState({ vehicles: [], license: null });
  const [searchRegNo, setSearchRegNo] = useState('');
  
  // Tabs: 'profile', 'register', 'fines'
  const [activeTab, setActiveTab] = useState('profile');

  // Application form state
  const [licenseForm, setLicenseForm] = useState({ category: 'MOTORCYCLE', bloodGroup: 'B+' });
  const [submittingLicense, setSubmittingLicense] = useState(false);

  // Vehicle registration form state
  const [vehicleForm, setVehicleForm] = useState({
    type: 'CAR',
    make: '',
    model: '',
    year: '2025',
    color: '',
    engineNo: '',
    chassisNo: ''
  });
  const [submittingVehicle, setSubmittingVehicle] = useState(false);

  // General loader trigger
  const fetchMyVehicleData = async () => {
    setLoading(true);
    try {
      const resp = await api.get('/vehicle/my-data');
      setData({
        vehicles: resp.data.vehicles || [],
        license: resp.data.license || null
      });
    } catch (err) {
      console.error('Fetch vehicles error:', err);
      toast.error('Failure reaching BRTA platform node server.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMyVehicleData();
  }, []);

  const handleApplyLicense = async (e) => {
    e.preventDefault();
    setSubmittingLicense(true);
    try {
      await api.post('/vehicle/license/apply', licenseForm);
      toast.success('Driving license application submitted for NID review!');
      fetchMyVehicleData();
    } catch (err) {
      toast.error(err.response?.data?.error || 'License application failed.');
    } finally {
      setSubmittingLicense(false);
    }
  };

  const handleRegisterVehicle = async (e) => {
    e.preventDefault();
    setSubmittingVehicle(true);
    try {
      await api.post('/vehicle/register', vehicleForm);
      toast.success('Vehicle registered and registration number assigned!');
      setVehicleForm({
        type: 'CAR',
        make: '',
        model: '',
        year: '2025',
        color: '',
        engineNo: '',
        chassisNo: ''
      });
      setActiveTab('profile');
      fetchMyVehicleData();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Registration failed.');
    } finally {
      setSubmittingVehicle(false);
    }
  };

  const handlePayRoadTax = async (vehicleId) => {
    try {
      await api.post('/vehicle/road-tax/pay', { vehicleId });
      toast.success('Road tax securely renewed for 1 extra year!');
      fetchMyVehicleData();
    } catch (err) {
      toast.error('Tax settlement issue.');
    }
  };

  const handlePayViolation = async (violationId) => {
    try {
      const resp = await api.post('/vehicle/violation/pay', { violationId });
      toast.success('Outstanding ticket settled in blockchain ledger!');
      if (resp.data.licenseRestored) {
        toast.info('Your driving license is officially RESTORED to active approved state!');
      }
      fetchMyVehicleData();
    } catch (err) {
      toast.error('Payment rejected.');
    }
  };

  const handlePublicHistorySearch = () => {
    if (!searchRegNo.trim()) {
      toast.error('Please input a registration code');
      return;
    }
    navigate(`/vehicle/${searchRegNo.trim().toUpperCase()}/history`);
  };

  return (
    <div className="max-w-6xl mx-auto px-4 py-8 space-y-8 font-sans" id="vehicle-dashboard-root">
      
      {/* Banner Title */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-slate-150 pb-6">
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-xs font-mono font-black uppercase text-[#006a4e]">
            <span className="h-2 w-2 rounded-full bg-[#006a4e] animate-ping" />
            DEPARTMENT OF ROAD TRANSPORT & SAFETY • BRTA
          </div>
          <h1 className="text-2xl font-black text-slate-800 tracking-tight flex items-center gap-2">
            🚗 Unified Vehicle Log & Driving Licences
          </h1>
          <p className="text-xs text-slate-500 font-medium">
            Sovereign digital credentials linked to your OneID. Real-time road tax renewals, fine settlements, and transfer histories.
          </p>
        </div>
        
        {/* Rapid Search Bar for public traced vehicles docs */}
        <div className="flex bg-white border border-slate-200 rounded-xl p-1 shadow-sm w-full md:w-auto self-start">
          <input
            type="text"
            placeholder="e.g. DHAKA-GA-ME-5432"
            value={searchRegNo}
            onChange={(e) => setSearchRegNo(e.target.value)}
            className="px-3 py-2 text-xs font-mono font-bold uppercase text-slate-800 focus:outline-none w-full md:w-56"
          />
          <button
            onClick={handlePublicHistorySearch}
            className="bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs px-4 py-2 rounded-lg flex items-center gap-1 transition-colors cursor-pointer shrink-0"
          >
            <Search className="w-3.5 h-3.5" /> Trace Vehicle
          </button>
        </div>
      </div>

      {loading ? (
        <div className="py-20 text-center text-slate-500 space-y-4 font-bold font-mono">
          <RefreshCw className="h-8 w-8 animate-spin mx-auto text-emerald-600" />
          <p className="text-xs">Synchronizing cryptosecure transit registries...</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          
          {/* Left panel: Driving License Smart Card Display & Actions (4 cols) */}
          <div className="lg:col-span-5 space-y-6">
            
            {/* Conditional driving license state */}
            {!data.license ? (
              <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-4">
                <div className="text-center space-y-2">
                  <span className="inline-block p-3 bg-emerald-50 text-emerald-700 rounded-full">
                    <CreditCard className="w-6 h-6" />
                  </span>
                  <h3 className="text-base font-black text-slate-800">Identify Driving License Dues</h3>
                  <p className="text-xs text-slate-500 max-w-sm mx-auto leading-relaxed">
                    You do not possess an active driving license registered under your OneID. Apply for instant digital issuance.
                  </p>
                </div>

                <form onSubmit={handleApplyLicense} className="space-y-4 border-t border-slate-100 pt-4">
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-[10px] uppercase font-black text-slate-400 font-mono block mb-1">License Category</label>
                      <select
                        value={licenseForm.category}
                        onChange={(e) => setLicenseForm(prev => ({ ...prev, category: e.target.value }))}
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-xs font-bold text-slate-700 focus:outline-none focus:border-emerald-600"
                      >
                        <option value="MOTORCYCLE">Motorcycle (Type A)</option>
                        <option value="LIGHT_VEHICLE">Light Passenger Car (Type B)</option>
                        <option value="HEAVY_VEHICLE">Heavy Transport (Type C)</option>
                        <option value="PROFESSIONAL">Commercial Professional</option>
                      </select>
                    </div>

                    <div>
                      <label className="text-[10px] uppercase font-black text-slate-400 font-mono block mb-1">Blood Group</label>
                      <select
                        value={licenseForm.bloodGroup}
                        onChange={(e) => setLicenseForm(prev => ({ ...prev, bloodGroup: e.target.value }))}
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-xs font-bold text-slate-700 focus:outline-none focus:border-emerald-600"
                      >
                        <option value="A+">A+</option>
                        <option value="A-">A-</option>
                        <option value="B+">B+</option>
                        <option value="B-">B-</option>
                        <option value="AB+">AB+</option>
                        <option value="AB-">AB-</option>
                        <option value="O+">O+</option>
                        <option value="O-">O-</option>
                      </select>
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={submittingLicense}
                    className="w-full bg-emerald-600 hover:bg-emerald-700 disabled:bg-emerald-800 text-white font-bold text-xs py-3 rounded-xl transition shadow cursor-pointer"
                  >
                    {submittingLicense ? 'Lodging Cryptographic Request...' : 'Instantly Pre-Apply to BRTA'}
                  </button>
                </form>
              </div>
            ) : data.license.status === 'PENDING' ? (
              <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-4">
                <div className="text-center space-y-2">
                  <span className="inline-block p-3 bg-amber-50 text-amber-700 rounded-full animate-pulse">
                    <RefreshCw className="w-6 h-6 animate-spin duration-1000" />
                  </span>
                  <h3 className="text-base font-black text-slate-800">Application Pending Review</h3>
                  <p className="text-xs text-slate-500 font-medium">
                    Your driving license requisition is currently queued inside the BRTA verification protocol.
                  </p>
                </div>

                {/* Progress Tracker timeline */}
                <div className="border-t border-slate-100 pt-5 space-y-4">
                  <div className="flex gap-3">
                    <span className="w-5 h-5 bg-emerald-100 text-emerald-800 text-[10px] font-bold rounded-full flex items-center justify-center shrink-0">✓</span>
                    <div className="text-left">
                      <h4 className="text-xs font-bold text-slate-800">Filer Authorization Key Sealed</h4>
                      <p className="text-[10px] text-slate-400">HMAC-SHA256 digital payload published to vehicle partition.</p>
                    </div>
                  </div>

                  <div className="flex gap-3">
                    <span className="w-5 h-5 bg-amber-100 text-amber-800 text-[10px] font-bold rounded-full flex items-center justify-center shrink-0 animate-pulse">★</span>
                    <div className="text-left">
                      <h4 className="text-xs font-bold text-amber-800">BRTA Inspector Smart Audit</h4>
                      <p className="text-[10px] text-slate-400">Verifying national records for matching traffic/civil status clearances.</p>
                    </div>
                  </div>

                  <div className="flex gap-3 opacity-40">
                    <span className="w-5 h-5 bg-slate-100 text-slate-800 text-[10px] font-bold rounded-full flex items-center justify-center shrink-0">•</span>
                    <div className="text-left">
                      <h4 className="text-xs font-bold text-slate-500">Digital Smart Card Cryptoprint</h4>
                      <p className="text-[10px] text-slate-400">Generating secure QR reference token and digital credential card.</p>
                    </div>
                  </div>
                </div>

                <div className="bg-slate-50 p-3 rounded-xl border border-slate-150 flex items-center justify-between text-[11px] font-mono">
                  <span className="text-slate-400">Ledger ID:</span>
                  <LedgerBadge sector="VEHICLE" recordId={data.license.ledgerRecordId} />
                </div>
              </div>
            ) : data.license.status === 'REJECTED' ? (
              <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-4 border-l-4 border-l-rose-500">
                <div className="space-y-1">
                  <h3 className="text-base font-black text-rose-800 flex items-center gap-1">
                    <AlertTriangle className="w-5 h-5 text-rose-600" />
                    Application Rejected
                  </h3>
                  <p className="text-xs text-rose-700 leading-normal bg-rose-50 p-3 rounded-xl border border-rose-100">
                    <strong>BRTA Note:</strong> {data.license.rejectionReason || 'Physical residency or health documentation verification unfulfilled.'}
                  </p>
                </div>
                <button
                  onClick={async () => {
                    if (window.confirm('Delete failed draft and initiate safe re-application?')) {
                      // Simulating restart
                      toast.info('Draft reset. Submit your form credentials again.');
                      setData(prev => ({ ...prev, license: null }));
                    }
                  }}
                  className="w-full bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs py-2.5 rounded-xl transition cursor-pointer"
                >
                  Review and Apply Again
                </button>
              </div>
            ) : (
              <div className="space-y-4">
                <DrivingLicense license={data.license} />

                {/* Sub-smartcard indicator information */}
                <div className="bg-slate-50 border border-slate-150 p-4 rounded-2xl flex items-center justify-between text-xs font-medium">
                  <div className="space-y-0.5 text-left">
                    <span className="text-slate-400 text-[10px] block font-mono">VERIFIED ENFORCEMENT STATE:</span>
                    <span className={`font-black uppercase text-[11px] ${data.license.status === 'APPROVED' ? 'text-emerald-700' : 'text-red-700'}`}>
                      {data.license.status}
                    </span>
                  </div>
                  <LedgerBadge sector="VEHICLE" recordId={data.license.ledgerRecordId} />
                </div>
              </div>
            )}
            
          </div>

          {/* Right tabbed section: Vehicles / Violations Console (7 cols) */}
          <div className="lg:col-span-7 space-y-6">
            
            {/* Horizontal Segment Navigation tabs */}
            <div className="bg-slate-100 p-1 rounded-xl flex">
              <button
                onClick={() => setActiveTab('profile')}
                className={`flex-1 py-2 text-xs font-bold rounded-lg transition-colors cursor-pointer ${
                  activeTab === 'profile' ? 'bg-white text-[#006a4e] shadow-sm' : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                🚘 My Registered Cars & Vehicles ({data.vehicles.length})
              </button>
              <button
                onClick={() => setActiveTab('register')}
                className={`flex-1 py-2 text-xs font-bold rounded-lg transition-colors cursor-pointer ${
                  activeTab === 'register' ? 'bg-white text-[#006a4e] shadow-sm' : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                ➕ Register Asset
              </button>
              <button
                onClick={() => setActiveTab('fines')}
                className={`flex-1 py-2 text-xs font-bold rounded-lg transition-colors cursor-pointer ${
                  activeTab === 'fines' ? 'bg-white text-[#006a4e] shadow-sm' : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                🎫 Traffic Tickets & Fines ({data.license?.violations?.filter(v => v.fineStatus === 'UNPAID').length || 0})
              </button>
            </div>

            {/* TAB CONTENT: PROFILE VEHICLES */}
            {activeTab === 'profile' && (
              <div className="space-y-6 text-left" id="my-vehicles-tab-panel">
                {data.vehicles.length > 0 ? (
                  <div className="grid grid-cols-1 gap-6">
                    {data.vehicles.map((vh) => {
                      const isTaxOverdue = vh.roadTaxDueDate ? new Date(vh.roadTaxDueDate) < new Date() : false;
                      return (
                        <div key={vh.id} className="bg-white border border-slate-200 rounded-2xl overflow-hidden p-6 shadow-sm space-y-4 relative">
                          
                          {/* Top row alignment */}
                          <div className="flex justify-between items-start border-b border-slate-100 pb-4">
                            <div className="space-y-1">
                              <span className="bg-[#006a4e]/10 text-[#006a4e] px-2.5 py-0.5 rounded text-[10px] font-black font-mono inline-block">
                                {vh.type}
                              </span>
                              <h3 className="text-base font-black text-slate-800 tracking-tight leading-none pt-1">
                                {vh.make} {vh.model} ({vh.year})
                              </h3>
                              <p className="font-mono text-emerald-850 font-black text-xs pt-1">{vh.registrationNo}</p>
                            </div>
                            <div className="text-right space-y-1">
                              <LedgerBadge sector="VEHICLE" recordId={vh.ledgerRecordId} />
                            </div>
                          </div>

                          {/* Technical attributes */}
                          <div className="grid grid-cols-3 gap-4 text-xs bg-slate-50 p-3 rounded-xl border border-slate-150 font-mono">
                            <div>
                              <span className="text-[8px] uppercase font-bold text-slate-400 block font-sans">Paint Color</span>
                              <span className="font-bold text-slate-700">{vh.color}</span>
                            </div>
                            <div>
                              <span className="text-[8px] uppercase font-bold text-slate-400 block font-sans">Engine No</span>
                              <span className="font-bold text-slate-700 text-[10px]">{vh.engineNo}</span>
                            </div>
                            <div>
                              <span className="text-[8px] uppercase font-bold text-slate-400 block font-sans">Chassis No</span>
                              <span className="font-bold text-slate-700 text-[10px]">{vh.chassisNo}</span>
                            </div>
                          </div>

                          {/* Road Tax & Action area */}
                          <div className="flex flex-col sm:flex-row gap-4 justify-between items-center bg-[#006a4e]/5 p-4 rounded-xl border border-emerald-100 text-xs">
                            <div className="space-y-0.5 text-left self-start sm:self-center">
                              <span className="text-[9px] uppercase font-black text-[#006a4e]/70 block font-sans">BRTA Road Tax Clearance</span>
                              <p className="font-mono text-slate-700">
                                Due: <strong className={isTaxOverdue ? 'text-red-700 font-black' : 'text-slate-800'}>
                                  {vh.roadTaxDueDate ? new Date(vh.roadTaxDueDate).toLocaleDateString() : 'N/A'}
                                </strong>
                              </p>
                            </div>

                            <div className="flex gap-2 w-full sm:w-auto">
                              <button
                                onClick={() => handlePayRoadTax(vh.id)}
                                className="flex-1 sm:flex-none bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs px-4 py-2 rounded-lg transition-colors cursor-pointer"
                              >
                                Settle Road Tax
                              </button>
                              <button
                                onClick={() => navigate(`/vehicle/transfer?vehicleId=${vh.id}`)}
                                className="flex-1 sm:flex-none bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs px-4 py-2 rounded-lg transition-colors flex items-center justify-center gap-1 cursor-pointer"
                              >
                                Transfer <ArrowRight className="w-3 h-3" />
                              </button>
                            </div>
                          </div>

                          {/* Transfers list status */}
                          {vh.transfers && vh.transfers.length > 0 && (
                            <div className="border-t border-slate-100 pt-4">
                              <span className="text-[9px] uppercase font-black text-slate-400 font-mono block mb-2">My Pending Signoff Transfers</span>
                              <div className="space-y-2">
                                {vh.transfers.map((tr) => (
                                  <div key={tr.id} className="flex justify-between items-center text-xs p-2.5 bg-slate-100/50 rounded-lg border border-slate-200">
                                    <div className="space-y-0.5">
                                      <span className="font-bold text-slate-700">Recipient ID: {tr.toOwnerOneId}</span>
                                      <p className="text-[10px] text-slate-400 font-medium">Status: <span className="font-black text-amber-700">{tr.status.replace(/_/g, ' ')}</span></p>
                                    </div>
                                    {tr.status === 'PENDING_BUYER_SIGN' && tr.toOwnerOneId === data.license?.citizenOneId && (
                                      <button
                                        onClick={async () => {
                                          try {
                                            await api.post('/vehicle/transfer/accept', { transferId: tr.id });
                                            toast.success('Successfully signed transfer! Now awaiting final administrative approval.');
                                            fetchMyVehicleData();
                                          } catch (err) {
                                            toast.error('Acceptance signature rejected.');
                                          }
                                        }}
                                        className="bg-[#006a4e] text-white font-extrabold text-[10px] px-3 py-1 rounded hover:bg-emerald-800 transition cursor-pointer"
                                      >
                                        Sign Transfer Document
                                      </button>
                                    )}
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}

                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="bg-slate-50 border border-slate-200 border-dashed rounded-2xl p-12 text-center space-y-2">
                    <span className="text-4xl">🚗</span>
                    <h3 className="text-sm font-bold text-slate-700">No Vehicles Registered</h3>
                    <p className="text-xs text-slate-400 max-w-xs mx-auto">
                      Your current digital passport lists no registered vehicular assets. Go to the "Register Asset" tab to add one!
                    </p>
                  </div>
                )}
              </div>
            )}

            {/* TAB CONTENT: REGISTER NEW VEHICLE */}
            {activeTab === 'register' && (
              <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm text-left" id="vehicle-register-tab-panel">
                <div className="border-b border-slate-100 pb-4 mb-4">
                  <h3 className="text-sm font-bold text-slate-800">Add New Vehicle Asset to Ledger</h3>
                  <p className="text-[11px] text-slate-400">
                    To register a passenger/cargo transport vehicle, your driving license must be APPROVED first. Engine & chassis details will undergo automated cryptographic uniqueness testing.
                  </p>
                </div>

                {!data.license || data.license.status !== 'APPROVED' ? (
                  <div className="bg-rose-50 border border-rose-200 p-4 rounded-xl text-xs text-rose-800 space-y-1">
                    <h4 className="font-extrabold">🚨 Safety Block Triggered</h4>
                    <p>
                      You cannot register physical vehicle units on the OneID transit database without an active, verified, APPROVED driving license Smart Card.
                    </p>
                  </div>
                ) : (
                  <form onSubmit={handleRegisterVehicle} className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="text-[10px] uppercase font-black text-slate-400 font-mono block mb-1">Vehicle Classification</label>
                        <select
                          value={vehicleForm.type}
                          onChange={(e) => setVehicleForm(prev => ({ ...prev, type: e.target.value }))}
                          className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-700 focus:outline-none"
                        >
                          <option value="CAR">Private Sedan / Car</option>
                          <option value="MOTORCYCLE">Motorcycle</option>
                          <option value="MICROBUS">Microbus</option>
                          <option value="BUS">Passenger Heavy Bus</option>
                          <option value="TRUCK">Heavy Hauler Truck</option>
                          <option value="CNG">Auto Rickshaw / CNG</option>
                        </select>
                      </div>

                      <div>
                        <label className="text-[10px] uppercase font-black text-slate-400 font-mono block mb-1">Manufacture Make</label>
                        <input
                          type="text"
                          required
                          placeholder="e.g. Toyota, Honda, Yamaha"
                          value={vehicleForm.make}
                          onChange={(e) => setVehicleForm(prev => ({ ...prev, make: e.target.value }))}
                          className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-700 focus:outline-none focus:border-emerald-600"
                        />
                      </div>

                      <div>
                        <label className="text-[10px] uppercase font-black text-slate-400 font-mono block mb-1">Model Notation</label>
                        <input
                          type="text"
                          required
                          placeholder="e.g. Corolla, Civic, R15"
                          value={vehicleForm.model}
                          onChange={(e) => setVehicleForm(prev => ({ ...prev, model: e.target.value }))}
                          className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-700 focus:outline-none focus:border-emerald-600"
                        />
                      </div>

                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <label className="text-[10px] uppercase font-black text-slate-400 font-mono block mb-1">Year</label>
                          <input
                            type="number"
                            required
                            min="1990"
                            max="2027"
                            value={vehicleForm.year}
                            onChange={(e) => setVehicleForm(prev => ({ ...prev, year: e.target.value }))}
                            className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-700 focus:outline-none"
                          />
                        </div>

                        <div>
                          <label className="text-[10px] uppercase font-black text-slate-400 font-mono block mb-1">Paint Color</label>
                          <input
                            type="text"
                            required
                            placeholder="e.g. Ruby Red"
                            value={vehicleForm.color}
                            onChange={(e) => setVehicleForm(prev => ({ ...prev, color: e.target.value }))}
                            className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-700 focus:outline-none"
                          />
                        </div>
                      </div>

                      <div>
                        <label className="text-[10px] uppercase font-black text-slate-400 font-mono block mb-1">Engine Block Serial Code</label>
                        <input
                          type="text"
                          required
                          placeholder="e.g. ENG-4A-FE-99052"
                          value={vehicleForm.engineNo}
                          onChange={(e) => setVehicleForm(prev => ({ ...prev, engineNo: e.target.value }))}
                          className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-mono font-bold text-slate-700 focus:outline-none focus:border-emerald-600"
                        />
                      </div>

                      <div>
                        <label className="text-[10px] uppercase font-black text-slate-400 font-mono block mb-1">Chassis Structural Code</label>
                        <input
                          type="text"
                          required
                          placeholder="e.g. CHS-AE100-3050942"
                          value={vehicleForm.chassisNo}
                          onChange={(e) => setVehicleForm(prev => ({ ...prev, chassisNo: e.target.value }))}
                          className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-mono font-bold text-slate-700 focus:outline-none focus:border-emerald-600"
                        />
                      </div>
                    </div>

                    <button
                      type="submit"
                      disabled={submittingVehicle}
                      className="w-full bg-emerald-605 bg-emerald-700 hover:bg-emerald-600 disabled:bg-slate-400 text-white font-bold text-sm py-3.5 rounded-xl transition cursor-pointer mt-2"
                    >
                      {submittingVehicle ? 'Validating Serial Footprints...' : 'Publish Vehicle Registrations to Node Network'}
                    </button>
                  </form>
                )}
              </div>
            )}

            {/* TAB CONTENT: TRAFFIC FINE TICKETS */}
            {activeTab === 'fines' && (
              <div className="space-y-4 text-left" id="traffic-tickets-tab-panel">
                <div className="bg-white border rounded-2xl p-5 border-slate-200 shadow-sm">
                  <h3 className="text-sm font-bold text-slate-800">Traffic Violation citations Ledger</h3>
                  <p className="text-[11px] text-slate-400">
                    If an active driving license accrues **5 or more unpaid citations**, it triggers an automated structural suspension in driving privilege blocks. Settle fines instantly to clear flags.
                  </p>
                </div>

                {data.license?.violations && data.license.violations.length > 0 ? (
                  <div className="space-y-4">
                    {data.license.violations.map((ticket) => (
                      <div 
                        key={ticket.id} 
                        className={`p-5 rounded-2xl border transition flex flex-col md:flex-row md:items-center justify-between gap-4 ${
                          ticket.fineStatus === 'UNPAID' 
                            ? 'bg-red-50/40 border-red-200 hover:bg-red-50/60' 
                            : 'bg-emerald-50/30 border-emerald-200'
                        }`}
                      >
                        <div className="space-y-1.5 text-left">
                          <div className="flex items-center gap-2">
                            <span className={`px-2 py-0.5 rounded text-[9px] font-black uppercase font-mono ${
                              ticket.fineStatus === 'UNPAID' ? 'bg-red-100 text-red-800 border border-red-200' : 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                            }`}>
                              Ticket Ref: {ticket.fineStatus}
                            </span>
                            <span className="text-[10px] font-mono text-slate-400 font-bold">
                              {new Date(ticket.issuedAt).toLocaleDateString()}
                            </span>
                          </div>
                          
                          <h4 className="text-xs font-black text-slate-800">{ticket.violationType}</h4>
                          <div className="flex flex-wrap gap-x-4 gap-y-1 text-[10px] text-slate-500 font-medium">
                            <span>Officer ID: <strong className="font-mono text-slate-700">{ticket.issuedByOneId}</strong></span>
                            {ticket.vehicleId && <span>Vehicle UUID: <strong className="font-mono text-slate-700">{ticket.vehicleId.slice(-6)}</strong></span>}
                          </div>
                        </div>

                        {/* Action buttons or logs */}
                        <div className="flex md:flex-col items-end gap-3 justify-between md:justify-start shrink-0">
                          <div className="text-left md:text-right">
                            <span className="text-[10px] font-bold text-slate-400 block font-sans">Ticket Dues</span>
                            <span className="font-mono font-black text-sm text-slate-800">BDT {ticket.fineAmount.toLocaleString()}</span>
                          </div>
                          
                          {ticket.fineStatus === 'UNPAID' ? (
                            <button
                              onClick={() => handlePayViolation(ticket.id)}
                              className="bg-red-700 hover:bg-red-650 text-white font-extrabold text-[11px] px-3.5 py-1.5 rounded-lg transition-colors cursor-pointer"
                            >
                              Settle Ticket Fine
                            </button>
                          ) : (
                            <LedgerBadge sector="VEHICLE" recordId={ticket.ledgerRecordId} />
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="bg-emerald-50/30 border border-emerald-150 rounded-2xl p-10 text-center space-y-2">
                    <span className="text-3xl">🛡️</span>
                    <h3 className="text-sm font-bold text-emerald-800">No Security Infringements</h3>
                    <p className="text-xs text-slate-500 max-w-xs mx-auto">
                      Congratulations! Your driving history holds a 100% compliant safety audit in the OneID ledger.
                    </p>
                  </div>
                )}
              </div>
            )}
            
          </div>
        </div>
      )}

      {/* Footer Banner */}
      <div className="bg-slate-900 text-slate-300 rounded-3xl p-6 font-mono text-[11px] flex flex-col md:flex-row justify-between items-center gap-4 text-center md:text-left">
        <div className="space-y-1.5">
          <p className="font-bold text-white flex items-center gap-1.5 justify-center md:justify-start">
            <Shield className="w-4 h-4 text-emerald-400" />
            Immutable BRTA Distributed Ledger Active
          </p>
          <p className="text-slate-400 max-w-xl">
            Vehicle transfers and DL cards operate on a cryptographically synchronized partition. Merkle nodes automatically batch registrations every 50 commits.
          </p>
        </div>
        <span className="bg-[#003424] text-emerald-400 px-3 py-1.5 rounded-xl border border-emerald-990 font-bold tracking-widest shrink-0 uppercase">
          ● Secure Node OK
        </span>
      </div>

    </div>
  );
}
