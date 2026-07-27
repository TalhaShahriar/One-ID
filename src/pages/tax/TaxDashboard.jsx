import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import api from '../../lib/api.js';
import { toast } from 'sonner';
import { 
  FileText, 
  PlusCircle, 
  CreditCard, 
  ShieldCheck, 
  AlertCircle, 
  RefreshCw, 
  Layers, 
  CheckCircle2, 
  ExternalLink,
  DollarSign
} from 'lucide-react';
import LedgerBadge from '../../shared/components/LedgerBadge.jsx';

export default function TaxDashboard() {
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [registering, setRegistering] = useState(false);
  const navigate = useNavigate();

  const fetchTaxProfile = async () => {
    setLoading(true);
    try {
      const resp = await api.get('/tax/profile');
      setProfile(resp.data);
    } catch (err) {
      console.error('Error fetching tax profile:', err);
      toast.error('Failed to load tax registry profile.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTaxProfile();
  }, []);

  const handleRegisterProfile = async () => {
    setRegistering(true);
    try {
       const resp = await api.post('/tax/register');
       toast.success(`Successfully registered! Assigned TIN: ${resp.data.tin}`);
       fetchTaxProfile();
    } catch (err) {
       console.error('Error registering tax profile:', err);
       toast.error(err.response?.data?.error || 'Registration failed. Check if you have a valid OneID.');
    } finally {
       setRegistering(false);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-4" id="tax-dashboard-loader">
        <RefreshCw className="h-8 w-8 text-emerald-600 animate-spin" />
        <p className="text-xs font-semibold text-slate-500 font-sans">Syncing with Bangladesh NBR Ledger Nodes...</p>
      </div>
    );
  }

  // Case 1: Citizen does not have a Tax Profile
  if (!profile) {
    return (
      <div className="max-w-xl mx-auto my-16 px-4" id="tax-dashboard-unregistered">
        <div className="bg-white border border-slate-200 rounded-2xl p-8 shadow-sm space-y-6 text-center">
          <div className="mx-auto w-16 h-16 bg-emerald-50 text-emerald-600 rounded-full flex items-center justify-center border border-emerald-100">
            <FileText className="h-8 w-8" />
          </div>
          <div className="space-y-2">
            <h2 className="text-xl font-black text-slate-800 tracking-tight">NBR eVat & Income Tax Enrollment</h2>
            <p className="text-xs text-slate-500 max-w-sm mx-auto leading-relaxed">
              Your OneID is not registered in the National Board of Revenue (NBR) database. To e-file tax returns, assess slabs, and retrieve clearances, activate your digital TIN profile now.
            </p>
          </div>
          <button
            onClick={handleRegisterProfile}
            disabled={registering}
            className="w-full bg-emerald-600 hover:bg-emerald-700 disabled:bg-emerald-800 text-white text-xs font-extrabold py-3 rounded-xl transition shadow flex items-center justify-center gap-2 cursor-pointer"
            id="register-tin-btn"
          >
            {registering ? (
              <>
                <RefreshCw className="h-4 w-4 animate-spin" />
                Generating TIN Block...
              </>
            ) : (
              'Register & Generate e-TIN Certificate'
            )}
          </button>
          <div className="text-[10px] text-slate-400 font-mono">
            Powered by OneID Bangladesh • HMAC Secure Citizen Vaults
          </div>
        </div>
      </div>
    );
  }

  // Case 2: Citizen has a profile
  const currentYear = 2026;
  const isCurrentYearFiled = profile.returns?.some(r => r.taxYear === currentYear);

  return (
    <div className="max-w-5xl mx-auto px-6 py-10 space-y-8 font-sans" id="tax-dashboard-container">
      {/* Upper Welcome Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-100 pb-6">
        <div className="space-y-1">
          <h1 className="text-2xl font-black text-slate-800 tracking-tight">eVat & Tax Center</h1>
          <p className="text-xs text-slate-500 font-medium">
            Verify earnings, file self-assessment returns, make payments, and access audited blockchain tax certificates.
          </p>
        </div>
        {!isCurrentYearFiled && (
          <button
            onClick={() => navigate('/tax/calculate')}
            className="flex items-center gap-1.5 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold transition shadow-sm cursor-pointer"
            id="file-current-year-btn"
          >
            <PlusCircle className="h-4 w-4" />
            File Tax Return (FY {currentYear})
          </button>
        )}
      </div>

      {/* Prominent Profile TIN Card */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6" id="tax-profile-cards">
        {/* TIN ID Badge */}
        <div className="bg-gradient-to-br from-emerald-900 to-slate-900 border border-emerald-800/60 rounded-2xl p-6 text-white shadow relative overflow-hidden flex flex-col justify-between min-h-[160px]" id="tin-badge-card">
          <div className="space-y-1 flex items-start justify-between">
            <div>
              <p className="text-[10px] uppercase tracking-widest text-[#a7f3d0] font-bold font-mono">Taxpayer Identification Number</p>
              <h2 className="text-2xl font-mono font-black tracking-wider mt-1">{profile.tin}</h2>
            </div>
            <FileText className="w-8 h-8 opacity-20" />
          </div>
          <div>
            <p className="text-[10px] text-slate-300">NBR Verified National Register</p>
            <p className="text-[9px] text-slate-400 font-mono">Issued At: {new Date(profile.tinIssuedAt).toLocaleDateString()}</p>
          </div>
        </div>

        {/* Quick Summary status 1 */}
        <div className="bg-white border border-slate-200/60 rounded-2xl p-6 flex flex-col justify-between min-h-[160px]" id="returns-summary-card">
          <div className="space-y-1">
            <span className="p-1.5 rounded-lg bg-emerald-50 text-emerald-700 inline-block">
              <CheckCircle2 className="w-4 h-4" />
            </span>
            <h4 className="text-xs font-bold text-slate-400 uppercase tracking-tight font-sans">Filing Compliance</h4>
            <p className="text-lg font-bold text-slate-800">
              {profile.returns?.length || 0} Returns Filed
            </p>
          </div>
          <p className="text-[10px] text-slate-500">
            {isCurrentYearFiled ? '✓ All required tax seasons filed.' : `⚠️ Attention: FY ${currentYear} return is pending.`}
          </p>
        </div>

        {/* Quick summary status 2 */}
        <div className="bg-white border border-slate-200/60 rounded-2xl p-6 flex flex-col justify-between min-h-[160px]" id="all-clearances-card">
          <div className="space-y-1">
            <span className="p-1.5 rounded-lg bg-indigo-50 text-indigo-700 inline-block">
              <ShieldCheck className="w-4 h-4" />
            </span>
            <h4 className="text-xs font-bold text-slate-400 uppercase tracking-tight font-sans">Payment Health</h4>
            <p className="text-lg font-bold text-slate-800">
              {profile.returns?.filter(r => r.paymentStatus === 'UNPAID').length || 0} Pending Drafts
            </p>
          </div>
          <p className="text-[10px] text-slate-500">
            Real-time checking on blockchain secure nodes.
          </p>
        </div>
      </div>

      {/* Tax Returns History List */}
      <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm" id="returns-history-section">
        <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
          <h3 className="text-sm font-bold text-slate-800">Filing History Receipts</h3>
          <span className="text-[10px] bg-emerald-100 text-emerald-800 px-2.5 py-0.5 rounded-full font-bold font-mono uppercase">
            Live Blockchain Connected
          </span>
        </div>

        {profile.returns && profile.returns.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-100/50 font-bold text-slate-500 uppercase tracking-tight">
                  <th className="p-4 pl-6">Tax Year</th>
                  <th className="p-4">Gross Income</th>
                  <th className="p-4">Final Assessed Tax</th>
                  <th className="p-4">Payment Status</th>
                  <th className="p-4">Blockchain Status</th>
                  <th className="p-4">Receipt Number</th>
                  <th className="p-4 pr-6 text-center">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {profile.returns.map((item) => (
                  <tr key={item.id} className="hover:bg-slate-50/60 transition font-medium text-slate-700">
                    <td className="p-4 pl-6 font-bold">{item.taxYear}</td>
                    <td className="p-4 font-mono">BDT {item.grossIncome.toLocaleString()}</td>
                    <td className="p-4 font-mono text-emerald-800 font-bold">BDT {item.finalTax.toLocaleString()}</td>
                    <td className="p-4">
                      {item.paymentStatus === 'PAID' ? (
                        <span className="inline-flex items-center gap-1 bg-green-50 px-2.5 py-0.5 rounded-full text-[10px] font-bold text-green-700 border border-green-200">
                          PAID
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 bg-red-50 px-2.5 py-0.5 rounded-full text-[10px] font-bold text-red-700 border border-red-200">
                          UNPAID
                        </span>
                      )}
                    </td>
                    <td className="p-4">
                      <LedgerBadge sector="TAX" recordId={item.ledgerRecordId} />
                    </td>
                    <td className="p-4 font-mono font-bold text-slate-500">{item.receiptNumber || 'N/A'}</td>
                    <td className="p-4 pr-6 text-center">
                      <div className="flex items-center justify-center gap-2">
                        {item.paymentStatus !== 'PAID' && (
                          <button
                            onClick={() => navigate(`/tax/receipt/${item.receiptNumber}`)}
                            className="flex items-center gap-1 px-2.5 py-1 bg-amber-600 hover:bg-amber-500 text-white rounded text-[11px] font-bold transition shadow-sm cursor-pointer"
                          >
                            Pay Tax
                          </button>
                        )}
                        <Link
                          to={`/tax/receipt/${item.receiptNumber}`}
                          className="flex items-center gap-1 px-2.5 py-1 bg-slate-800 hover:bg-slate-900 text-white rounded text-[11px] font-bold transition cursor-pointer"
                        >
                          Details
                        </Link>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="p-8 text-center space-y-2">
            <AlertCircle className="w-8 h-8 text-amber-500 mx-auto" />
            <p className="text-xs text-slate-500 font-sans font-bold">No Income Tax Returns Filed Yet.</p>
            <p className="text-[10px] text-slate-400">Please click the button above to calculate and file your self-assessment tax returns within the designated deadlines.</p>
          </div>
        )}
      </div>
    </div>
  );
}
