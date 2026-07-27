import React, { useState, useEffect } from 'react';
import api from '../../lib/api.js';
import { toast } from 'sonner';
import { 
  PieChart, 
  Pie, 
  Cell, 
  ResponsiveContainer, 
  Legend, 
  Tooltip 
} from 'recharts';
import { 
  Shield, 
  UserCheck, 
  FileText, 
  AlertTriangle, 
  FileX, 
  ArrowRight, 
  CheckCircle2, 
  Ticket,
  PlusCircle,
  Clock,
  Briefcase,
  Layers,
  Sparkles,
  Search
} from 'lucide-react';
import LedgerBadge from '../../shared/components/LedgerBadge.jsx';

const CHART_COLORS = ['#10b981', '#f59e0b', '#ef4444', '#6b7280'];

export default function VehicleAdminDashboard() {
  const [loading, setLoading] = useState(true);
  const [adminData, setAdminData] = useState({
    pendingLicenses: [],
    violations: [],
    pendingTransfers: [],
    chartData: []
  });

  // Rejection reason overlay states
  const [rejectId, setRejectId] = useState('');
  const [rejectionReason, setRejectionReason] = useState('');

  // Settle Violation Form State
  const [violationForm, setViolationForm] = useState({
    licenseId: '',
    vehicleId: '',
    violationType: 'SPEEDING',
    fineAmount: '2000'
  });
  const [submittingViolation, setSubmittingViolation] = useState(false);

  const fetchAdminData = async () => {
    setLoading(true);
    try {
      const resp = await api.get('/vehicle/admin/overview');
      setAdminData({
        pendingLicenses: resp.data.pendingLicenses || [],
        violations: resp.data.violations || [],
        pendingTransfers: resp.data.pendingTransfers || [],
        chartData: resp.data.chartData || []
      });
    } catch (err) {
      console.error('Fetch admin data issue:', err);
      toast.error('Unable to retrieve administrative transit tables.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAdminData();
  }, []);

  const handleApproveLicense = async (licenseId) => {
    try {
      await api.post('/vehicle/admin/license/approve', {
        licenseId,
        action: 'APPROVE'
      });
      toast.success('Driving License application APPROVED. Sealed credentials published to ledger.');
      fetchAdminData();
    } catch (err) {
      toast.error('Approval failed.');
    }
  };

  const handleOpenRejectionModal = (id) => {
    setRejectId(id);
    setRejectionReason('');
  };

  const handleRejectLicenseSubmit = async (e) => {
    e.preventDefault();
    if (!rejectId) return;
    try {
      await api.post('/vehicle/admin/license/approve', {
        licenseId: rejectId,
        action: 'REJECT',
        rejectionReason: rejectionReason || 'Failed verification criteria.'
      });
      toast.error('Driving license application formal REFUSED.');
      setRejectId('');
      fetchAdminData();
    } catch (err) {
      toast.error('Refusal process error.');
    }
  };

  const handleCompleteTransfer = async (transferId) => {
    try {
      await api.post('/vehicle/admin/transfer/complete', { transferId });
      toast.success('Ownership Transfer approved. New owner title registered.');
      fetchAdminData();
    } catch (err) {
      toast.error('Transfer approval failed.');
    }
  };

  const handleRecordViolationSubmit = async (e) => {
    e.preventDefault();
    if (!violationForm.licenseId) {
      toast.error('Please submit driving license target.');
      return;
    }
    setSubmittingViolation(true);
    try {
      const resp = await api.post('/vehicle/admin/violation/record', {
        licenseId: violationForm.licenseId,
        vehicleId: violationForm.vehicleId || undefined,
        violationType: violationForm.violationType,
        fineAmount: parseFloat(violationForm.fineAmount)
      });
      if (resp.data.licenseSuspended) {
        toast.error('⚠️ TARGET LICENSE OFFICIALLY SUSPENDED due to reaching safety infringement limits!');
      } else {
        toast.success('Traffic ticket correctly logged to the blockchain.');
      }
      setViolationForm(prev => ({ ...prev, licenseId: '', vehicleId: '' }));
      fetchAdminData();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Ticket dispatch failed.');
    } finally {
      setSubmittingViolation(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 space-y-10 font-sans" id="vehicle-admin-root">
      
      {/* Title Header banner */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-slate-150 pb-6">
        <div className="space-y-1 text-left">
          <div className="flex items-center gap-1.5 text-xs font-mono font-black text-rose-800 uppercase">
            <span className="h-2 w-2 rounded-full bg-rose-600" />
            SECURE BRTA REGISTRY CONSOLE • HIGH COMMITTED PRIVILEGES
          </div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2">
            🏛️ BRTA Registrar Central Command
          </h1>
          <p className="text-xs text-slate-500 font-medium">
            Authorized administrative panel. Approve newly proposed driving smart cards, signoff multi-party vehicle sales deeds, and file enforcement ticket violation chains.
          </p>
        </div>
        
        <button
          onClick={fetchAdminData}
          className="bg-[#006a4e] hover:bg-emerald-800 text-white font-black text-xs px-4 py-2 rounded-xl transition cursor-pointer"
        >
          Refresh Transit Registry Nodes
        </button>
      </div>

      {loading ? (
        <div className="py-24 text-center text-slate-500 font-mono text-xs font-black">
          Querying national database for high-trust transit logs...
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          
          {/* Left panel: Stats & Ticket Filing (5 cols) */}
          <div className="lg:col-span-4 space-y-6">
            
            {/* Pie Chart stats box */}
            <div className="bg-white border rounded-2xl p-6 shadow-sm space-y-4 text-left">
              <h3 className="text-xs font-black uppercase text-slate-450 tracking-wider">Driving License Quotas</h3>
              
              <div className="h-44 relative">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={adminData.chartData}
                      cx="55%"
                      cy="50%"
                      innerRadius={45}
                      outerRadius={65}
                      paddingAngle={4}
                      dataKey="value"
                    >
                      {adminData.chartData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </div>

              {/* Legend checklist labels */}
              <div className="grid grid-cols-2 gap-2 text-[10px] font-mono border-t border-slate-100 pt-3">
                {adminData.chartData.map((d, index) => (
                  <div key={d.name} className="flex items-center gap-2">
                    <span 
                      className="w-2.5 h-2.5 rounded-full shrink-0" 
                      style={{ backgroundColor: CHART_COLORS[index % CHART_COLORS.length] }} 
                    />
                    <span className="text-slate-500 font-bold truncate">
                      {d.name}: <strong>{d.value}</strong>
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* RECORD TRAFFIC VIOLATION FORM */}
            <div className="bg-white border rounded-2xl p-6 shadow-sm text-left space-y-4">
              <div className="border-b border-slate-100 pb-3">
                <h3 className="text-sm font-black text-slate-800 flex items-center gap-1.5">
                  <Ticket className="w-4 h-4 text-rose-600" /> Dispatch Enforcement citation
                </h3>
                <p className="text-[11px] text-slate-400">
                  Record fine tickets directly onto a citizen's active driving license partition. Reaching 5 unpaid citations will force suspension.
                </p>
              </div>

              <form onSubmit={handleRecordViolationSubmit} className="space-y-4">
                <div className="space-y-1.5">
                  <label className="text-[10px] uppercase font-black text-slate-500 font-mono block">Target License UUID</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. uuid matching licensee"
                    value={violationForm.licenseId}
                    onChange={(e) => setViolationForm(prev => ({ ...prev, licenseId: e.target.value }))}
                    className="w-full bg-slate-50 border border-slate-205 rounded-xl px-3 py-2 text-xs font-mono font-bold text-slate-800 focus:outline-none focus:border-rose-600 focus:bg-white"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] uppercase font-black text-slate-400 font-mono block">Associated Vehicle Plate (Optional)</label>
                  <input
                    type="text"
                    placeholder="e.g. DHAKA-GA-XX-XXXX"
                    value={violationForm.vehicleId}
                    onChange={(e) => setViolationForm(prev => ({ ...prev, vehicleId: e.target.value }))}
                    className="w-full bg-slate-50 border border-slate-205 rounded-xl px-3 py-2 text-xs font-mono font-bold text-slate-800 focus:outline-none"
                  />
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="text-[10px] uppercase font-black text-slate-405 font-mono block mb-1">Citation Class</label>
                    <select
                      value={violationForm.violationType}
                      onChange={(e) => setViolationForm(prev => ({ ...prev, violationType: e.target.value }))}
                      className="w-full bg-slate-50 border border-slate-205 rounded-xl px-3 py-2 text-xs font-bold text-slate-700 focus:outline-none"
                    >
                      <option value="SPEEDING">Excess Speeding (Rule 14)</option>
                      <option value="RECKLESS_DRIVING">Dangerous Driving</option>
                      <option value="SIGNAL_VIOLATION">Traffic Light Infringement</option>
                      <option value="NO_INSURANCE">Absent Compliance Stamps</option>
                      <option value="DRIVING_UNDER_INFLUENCE">DUI (Intoxicated state)</option>
                    </select>
                  </div>

                  <div>
                    <label className="text-[10px] uppercase font-black text-slate-405 font-mono block mb-1">Fine Amount (BDT)</label>
                    <input
                      type="number"
                      required
                      min="500"
                      max="50000"
                      value={violationForm.fineAmount}
                      onChange={(e) => setViolationForm(prev => ({ ...prev, fineAmount: e.target.value }))}
                      className="w-full bg-slate-50 border border-slate-205 rounded-xl px-3 py-2 text-xs font-bold text-slate-800 focus:outline-none"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={submittingViolation}
                  className="w-full bg-rose-700 hover:bg-rose-650 disabled:bg-slate-400 text-white font-bold text-xs py-3 rounded-xl transition cursor-pointer"
                >
                  {submittingViolation ? 'Affixing Ticket payload...' : 'Commit Ticket to National Registry'}
                </button>
              </form>
            </div>

          </div>

          {/* Right panel: Tables for Licenses, Transfers, Violations (8 cols) */}
          <div className="lg:col-span-8 space-y-8">
            
            {/* TABLE 1: REVIEW DRIVING LICENSE REQUISITIONS */}
            <div className="bg-white border rounded-2xl shadow-sm text-left overflow-hidden">
              <div className="p-5 border-b border-slate-100 flex justify-between items-center">
                <div>
                  <h3 className="text-sm font-black text-slate-800">Pending License Smart Card Filings ({adminData.pendingLicenses.length})</h3>
                  <p className="text-[11px] text-slate-400">Citizens seeking smart card credentials based on division and medical checks.</p>
                </div>
              </div>

              {adminData.pendingLicenses.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs text-slate-700 border-collapse">
                    <thead>
                      <tr className="bg-slate-50 border-b border-slate-100 uppercase text-[9px] font-mono tracking-wider text-slate-450">
                        <th className="p-4">Applicant Profile</th>
                        <th className="p-4">Class Category</th>
                        <th className="p-4">Medical Parameters</th>
                        <th className="p-4 text-right">Commit Review</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {adminData.pendingLicenses.map((dl) => (
                        <tr key={dl.id} className="hover:bg-slate-50/55 transition">
                          <td className="p-4">
                            <div>
                              <strong className="text-slate-800 text-[13px]">{dl.citizen?.name || 'Sovereign Citizen'}</strong>
                              <p className="text-[10px] text-slate-400 font-medium pt-0.5">OneID: <span className="font-mono text-slate-705 font-bold">{dl.citizenOneId}</span></p>
                            </div>
                          </td>
                          <td className="p-4 font-bold text-slate-700">{dl.category.replace(/_/g, ' ')}</td>
                          <td className="p-4">
                            <span className="bg-red-50 text-red-700 px-2 py-0.5 rounded text-[10px] font-mono font-black border border-red-150">
                              {dl.bloodGroup}
                            </span>
                          </td>
                          <td className="p-4 text-right">
                            <div className="flex gap-2 justify-end">
                              <button
                                onClick={() => handleApproveLicense(dl.id)}
                                className="bg-emerald-600 hover:bg-emerald-750 text-white font-bold text-[10px] px-3 py-1.5 rounded-lg transition-colors cursor-pointer"
                              >
                                Approve
                              </button>
                              <button
                                onClick={() => handleOpenRejectionModal(dl.id)}
                                className="bg-slate-100 hover:bg-slate-200 text-slate-600 font-bold text-[10px] px-3 py-1.5 rounded-lg transition-colors cursor-pointer"
                              >
                                Reject
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="p-8 text-center bg-slate-50/50 text-xs text-slate-400 font-medium">
                  Currently no pending driving license requisitions submitted.
                </div>
              )}
            </div>

            {/* MODAL / BOTTOM SLIDE FOR REJECTION REASON */}
            {rejectId && (
              <div className="bg-rose-50 border border-rose-200 rounded-2xl p-5 text-left space-y-3">
                <form onSubmit={handleRejectLicenseSubmit} className="space-y-3">
                  <div className="space-y-1">
                    <h4 className="text-xs font-black text-rose-800">Formal Refusal Rationale</h4>
                    <p className="text-[10px] text-rose-700">Please write the exact administrative reason the driving application details fail audits. It will be emailed to citizen.</p>
                  </div>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      required
                      placeholder="e.g. Health status documentation unverified"
                      value={rejectionReason}
                      onChange={(e) => setRejectionReason(e.target.value)}
                      className="flex-1 bg-white border border-rose-300 rounded-xl px-3 py-2 text-xs text-slate-850 focus:outline-none"
                    />
                    <button
                      type="submit"
                      className="bg-rose-700 hover:bg-rose-650 text-white font-bold text-xs px-4 py-2 rounded-xl transition cursor-pointer"
                    >
                      Commit Refusal
                    </button>
                    <button
                      type="button"
                      onClick={() => setRejectId('')}
                      className="bg-slate-200 text-slate-650 font-bold text-xs px-3 py-2 rounded-xl"
                    >
                      Cancel
                    </button>
                  </div>
                </form>
              </div>
            )}

            {/* TABLE 2: APPROVED DOUBLE-SIGNED TITLE TRANSFERS DETAILED */}
            <div className="bg-white border rounded-2xl shadow-sm text-left overflow-hidden">
              <div className="p-5 border-b border-slate-100">
                <h3 className="text-sm font-black text-slate-800">Pending Ownership Transfer Audits ({adminData.pendingTransfers.length})</h3>
                <p className="text-[11px] text-slate-400">Transfers double-signed by both buy-sell parties. Commit block seals here.</p>
              </div>

              {adminData.pendingTransfers.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs text-slate-700 border-collapse">
                    <thead>
                      <tr className="bg-slate-50 border-b border-slate-100 uppercase text-[9px] font-mono tracking-wider text-slate-450">
                        <th className="p-4">Vehicle Assets</th>
                        <th className="p-4">Seller (From)</th>
                        <th className="p-4">Buyer (To)</th>
                        <th className="p-4 text-right">Release Seal</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {adminData.pendingTransfers.map((tr) => (
                        <tr key={tr.id} className="hover:bg-slate-50/55 transition">
                          <td className="p-4">
                            <div>
                              <strong className="text-slate-800 font-bold">{tr.vehicle?.make} {tr.vehicle?.model}</strong>
                              <p className="font-mono text-[10px] text-slate-400 font-black">{tr.vehicle?.registrationNo}</p>
                            </div>
                          </td>
                          <td className="p-4 font-mono text-slate-600 text-[10px]">{tr.fromOwnerOneId}</td>
                          <td className="p-4 font-mono text-slate-600 text-[10px]">{tr.toOwnerOneId}</td>
                          <td className="p-4 text-right">
                            <button
                              onClick={() => handleCompleteTransfer(tr.id)}
                              className="bg-emerald-650 bg-emerald-700 hover:bg-emerald-650 text-white font-extrabold text-[10px] px-3.5 py-1.5 rounded-lg transition-colors cursor-pointer shadow-sm"
                            >
                              Seal Transfer block
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="p-8 text-center bg-slate-50/50 text-xs text-slate-400 font-medium">
                  Currently no pending double-signed transfer sheets awaiting block creation.
                </div>
              )}
            </div>

            {/* ENFORCEMENT CITATIONS LOGS CHRONOLOGY */}
            <div className="bg-white border rounded-2xl shadow-sm text-left overflow-hidden">
              <div className="p-5 border-b border-slate-100">
                <h3 className="text-sm font-black text-slate-800">Chronological enforcement Ticket citations</h3>
                <p className="text-[11px] text-slate-400">All registered safety ticket logging sheets currently in ledger pools.</p>
              </div>

              {adminData.violations.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs text-slate-700 border-collapse">
                    <thead>
                      <tr className="bg-slate-50 border-b border-slate-100 uppercase text-[9px] font-mono tracking-wider text-slate-450">
                        <th className="p-4">Violating Driver</th>
                        <th className="p-4">Citation Category</th>
                        <th className="p-4">Fine Dues</th>
                        <th className="p-4 text-right">Verification States</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {adminData.violations.map((vt) => (
                        <tr key={vt.id} className="hover:bg-slate-50/55 transition">
                          <td className="p-4 font-bold text-slate-800">
                            <div>
                              <span>{vt.license?.citizen?.name || 'Sovereign Citizen'}</span>
                              <p className="text-[10px] text-slate-400 font-semibold font-mono">{vt.licenseId}</p>
                            </div>
                          </td>
                          <td className="p-4 font-bold text-slate-600">{vt.violationType.replace(/_/g, ' ')}</td>
                          <td className="p-4 font-mono text-slate-700 font-bold">BDT {vt.fineAmount.toLocaleString()}</td>
                          <td className="p-4 text-right">
                            <div className="flex gap-2 justify-end items-center">
                              <span className={`px-2 py-0.5 rounded text-[8px] font-black uppercase tracking-widest ${
                                vt.fineStatus === 'UNPAID' ? 'bg-red-100 text-red-800 border' : 'bg-emerald-100 text-emerald-800 border'
                              }`}>
                                {vt.fineStatus}
                              </span>
                              <LedgerBadge sector="VEHICLE" recordId={vt.ledgerRecordId} />
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="p-8 text-center bg-slate-50/50 text-xs text-slate-400 font-medium">
                  Currently no safety traffic violation ticket sheets registered.
                </div>
              )}
            </div>

          </div>
        </div>
      )}

    </div>
  );
}
