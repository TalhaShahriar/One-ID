import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../../lib/api.js';
import { toast } from 'sonner';
import { 
  ArrowLeft, 
  Download, 
  CheckCircle2, 
  AlertTriangle, 
  RefreshCw, 
  FileText, 
  Key, 
  CreditCard, 
  ShieldCheck 
} from 'lucide-react';
import LedgerBadge from '../../shared/components/LedgerBadge.jsx';

export default function TaxReceipt() {
  const { receiptNumber } = useParams();
  const [calculation, setCalculation] = useState(null);
  const [loading, setLoading] = useState(true);
  const [paying, setPaying] = useState(false);
  const [paymentAmount, setPaymentAmount] = useState('');
  const navigate = useNavigate();

  const fetchReceipt = async () => {
    setLoading(true);
    try {
      const resp = await api.get(`/tax/receipt/${receiptNumber}`);
      setCalculation(resp.data);
      if (resp.data) {
        setPaymentAmount(resp.data.finalTax.toString());
      }
    } catch (err) {
      console.error('Error fetching receipt details:', err);
      toast.error('Failed to locate tax filing receipt.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReceipt();
  }, [receiptNumber]);

  // Payment Handler
  const handlePayment = async () => {
    const amt = parseFloat(paymentAmount);
    if (!amt || isNaN(amt) || amt < calculation.finalTax) {
      toast.error(`Payment amount must at least match the due of BDT ${calculation.finalTax.toLocaleString()}.`);
      return;
    }

    setPaying(true);
    try {
      await api.post('/tax/pay', {
        returnId: calculation.id,
        amount: amt
      });
      toast.success('Tax payment settled successfully! Receipt status updated to PAID.');
      fetchReceipt();
    } catch (err) {
      console.error('Payment error:', err);
      toast.error(err.response?.data?.error || 'Tax payment failed.');
    } finally {
      setPaying(false);
    }
  };

  // Download PDF using server-side endpoint
  const handleDownloadPDF = async () => {
    try {
      const url = `${api.defaults.baseURL || '/api'}/tax/receipt/${receiptNumber}/pdf`;
      
      // We can open in a new tab or trigger manual download via window.open/fetch
      toast.info('Rendering secure NBR PDF artifact from system nodes...');
      
      // Let's download it via native anchor
      const token = localStorage.getItem('token');
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Authorization': token ? `Bearer ${token}` : ''
        }
      });

      if (!response.ok) {
        throw new Error('PDF render failed on server nodes.');
      }

      const blob = await response.blob();
      const blobUrl = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = blobUrl;
      link.setAttribute('download', `NBR_Tax_Receipt_${receiptNumber}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.parentNode.removeChild(link);
      
      toast.success('Tax Receipt PDF downloaded successfully.');
    } catch (err) {
      console.error('PDF download error:', err);
      toast.error('Failed to download receipt PDF.');
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-4" id="tax-receipt-loader">
        <RefreshCw className="h-8 w-8 text-emerald-600 animate-spin" />
        <p className="text-xs font-semibold text-slate-500 font-sans">Locating digital filing logs from chain...</p>
      </div>
    );
  }

  if (!calculation) {
    return (
      <div className="max-w-md mx-auto my-16 px-4" id="tax-receipt-not-found">
        <div className="bg-white border border-slate-200 rounded-2xl p-8 shadow-sm space-y-4 text-center">
          <AlertTriangle className="h-12 w-12 text-red-500 mx-auto" />
          <h3 className="text-lg font-black text-slate-800">Filing Receipt Not Found</h3>
          <p className="text-xs text-slate-500 font-medium">
            This receipt number does not correspond to an established, signed tax return in OneID record ledger.
          </p>
          <button 
            onClick={() => navigate('/tax')} 
            className="text-xs font-bold bg-slate-800 hover:bg-slate-900 text-white px-4 py-2 rounded-xl transition cursor-pointer"
          >
            Back to Dashboard
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto px-6 py-10 space-y-8 font-sans" id="tax-receipt-container">
      {/* Navigation Controls */}
      <div className="flex justify-between items-center">
        <button 
          onClick={() => navigate('/tax')} 
          className="flex items-center gap-1 px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs font-bold text-slate-600 hover:bg-slate-50 transition shadow-sm cursor-pointer"
        >
          <ArrowLeft className="h-3.5 w-3.5" /> Back to Dashboard
        </button>
        <button
          onClick={handleDownloadPDF}
          className="flex items-center gap-1.5 px-4 py-2 bg-emerald-700 hover:bg-emerald-600 text-white rounded-xl text-xs font-black transition shadow-sm cursor-pointer"
          id="download-pdf-btn"
        >
          <Download className="h-4 w-4" /> Download Certified PDF
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-5 gap-8">
        
        {/* Left Side: Receipt Invoice Details Card */}
        <div className="md:col-span-3 bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-6" id="receipt-details">
          <div className="border-b border-slate-100 pb-4 flex justify-between items-center">
            <div>
              <p className="text-[10px] text-slate-400 font-mono">NBR BANGLADESH OFFICIAL RECEIPT</p>
              <h2 className="text-lg font-black text-slate-800 font-mono">{calculation.receiptNumber}</h2>
            </div>
            {calculation.paymentStatus === 'PAID' ? (
              <span className="bg-emerald-50 text-emerald-800 text-[10px] font-bold px-3 py-1 rounded-full border border-emerald-200">
                PAID
              </span>
            ) : (
              <span className="bg-red-50 text-red-800 text-[10px] font-bold px-3 py-1 rounded-full border border-red-200">
                UNPAID
              </span>
            )}
          </div>

          {/* Details list */}
          <div className="grid grid-cols-2 gap-y-4 text-xs font-medium">
            <div>
              <span className="text-slate-400 block text-[10px] uppercase font-bold">Taxpayer Name</span>
              <span className="text-slate-800 text-xs font-bold">{calculation.taxProfile?.citizen?.name || 'Assessed Citizen'}</span>
            </div>
            <div>
              <span className="text-slate-400 block text-[10px] uppercase font-bold">E-TIN Reference</span>
              <span className="text-slate-800 font-mono text-xs font-bold">{calculation.taxProfile?.tin || 'N/A'}</span>
            </div>
            <div>
              <span className="text-slate-400 block text-[10px] uppercase font-bold">Fiscal Year</span>
              <span className="text-slate-800">{calculation.taxYear}</span>
            </div>
            <div>
              <span className="text-slate-400 block text-[10px] uppercase font-bold">Filing Timestamp</span>
              <span className="text-slate-800 text-[11px]">{new Date(calculation.submittedAt).toLocaleString()}</span>
            </div>
          </div>

          <hr className="border-slate-100" />

          {/* Slabs figures */}
          <div className="space-y-2.5 text-xs">
            <div className="flex justify-between">
              <span className="text-slate-500 font-medium">Assessable Gross Income:</span>
              <span className="font-mono text-slate-700 font-bold">BDT {calculation.grossIncome.toLocaleString()}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500 font-medium">Calculated Tax Duty:</span>
              <span className="font-mono text-slate-700">BDT {calculation.calculatedTax.toLocaleString()}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500 font-medium">Location Minimum Levy Guarantee:</span>
              <span className="font-mono text-slate-700">BDT {calculation.minimumTax.toLocaleString()}</span>
            </div>
            <div className="flex justify-between border-t border-slate-100 pt-3 text-sm font-black">
              <span className="text-slate-800">Final Determined tax Due:</span>
              <span className="font-mono text-emerald-700 text-base">BDT {calculation.finalTax.toLocaleString()}</span>
            </div>
          </div>

          {/* Audit Verification badge inside the PDF view */}
          <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-2">
            <h4 className="text-[10px] font-black text-slate-800 uppercase tracking-widest flex items-center gap-1">
              <ShieldCheck className="w-4 h-4 text-emerald-600" /> Decentralized Ledger Assurance
            </h4>
            <p className="text-[9px] text-slate-500 leading-normal">
              This tax return submission has been sealed into the sovereign tax database chain as a tamper-evident hash structure. Block audit checks can be performed via the verification registry.
            </p>
            <div className="pt-1.5">
              <LedgerBadge sector="TAX" recordId={calculation.ledgerRecordId} />
            </div>
          </div>
        </div>

        {/* Right Side: Payment Module (only shows if UNPAID) */}
        <div className="md:col-span-2 space-y-6">
          {calculation.paymentStatus !== 'PAID' ? (
            <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-5" id="unpaid-action-box">
              <div className="space-y-1">
                <span className="inline-flex h-8 w-8 bg-amber-50 text-amber-700 rounded-full items-center justify-center">
                  <CreditCard className="w-4 h-4" />
                </span>
                <h3 className="text-sm font-bold text-slate-800">Filer Tax Settlement</h3>
                <p className="text-[10px] text-slate-500">
                  Please settle the outstanding assessed tax amount of BDT {calculation.finalTax.toLocaleString()} to complete e-filing.
                </p>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] uppercase font-black text-slate-400 font-mono">Payment Amount (BDT)</label>
                <input
                  type="number"
                  disabled={paying}
                  value={paymentAmount}
                  onChange={(e) => setPaymentAmount(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs font-mono font-bold focus:border-emerald-500 focus:outline-none"
                />
              </div>

              <button
                onClick={handlePayment}
                disabled={paying}
                className="w-full py-3 bg-amber-600 hover:bg-amber-500 disabled:bg-amber-700 text-white font-extrabold text-xs rounded-xl shadow transition cursor-pointer flex items-center justify-center gap-1.5"
                id="gateway-pay-btn"
              >
                {paying ? (
                  <>
                    <RefreshCw className="h-4 w-4 animate-spin" /> Verifying Bank Gateway...
                  </>
                ) : (
                  <>
                    Securely Pay BDT {parseFloat(paymentAmount || 0).toLocaleString()}
                  </>
                )}
              </button>
            </div>
          ) : (
            <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-6 text-center space-y-4 shadow-sm" id="paid-check-box">
              <div className="h-10 w-10 bg-emerald-100 text-emerald-800 rounded-full mx-auto flex items-center justify-center border border-emerald-300">
                <CheckCircle2 className="w-5 h-5" />
              </div>
              <div className="space-y-1">
                <h4 className="text-sm font-bold text-emerald-800">Tax Compliant Status Clear</h4>
                <p className="text-[10px] text-emerald-600 leading-normal">
                  All tax dues on this receipt have been officially paid, bank-authorized, and permanently registered onto the OneID decentral sector block. Thank you for your civic contribution.
                </p>
              </div>
              <div className="text-[9px] text-emerald-500 font-mono border-t border-emerald-150 pt-3">
                Payment Settled on: {new Date(calculation.paidAt).toLocaleDateString()}
              </div>
            </div>
          )}

          {/* Block key data print */}
          <div className="bg-white border border-slate-200 rounded-2xl p-5 space-y-3 shadow-inner">
            <span className="text-[9px] uppercase tracking-widest font-mono text-slate-400 font-bold block">Cryptographic Seal metadata</span>
            <div className="space-y-2 text-[10px]">
              <div className="font-mono text-slate-500 break-all space-y-1 leading-normal">
                <span className="font-bold text-slate-700 block text-[9px]">BLOCKCHAIN LEDGER RECORD REF:</span>
                <span className="bg-slate-50 p-1.5 rounded border border-slate-100 block">{calculation.ledgerRecordId || 'N/A'}</span>
              </div>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
