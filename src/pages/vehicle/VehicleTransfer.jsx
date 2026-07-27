import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import api from '../../lib/api.js';
import { toast } from 'sonner';
import { 
  ShieldCheck, 
  ArrowLeft, 
  UserCheck, 
  FileText, 
  Send, 
  CheckCircle,
  HelpCircle,
  AlertCircle
} from 'lucide-react';
import LedgerBadge from '../../shared/components/LedgerBadge.jsx';

export default function VehicleTransfer() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const vehicleId = searchParams.get('vehicleId');

  const [loading, setLoading] = useState(true);
  const [vehicle, setVehicle] = useState(null);
  const [step, setStep] = useState(1);

  // Verification Step 1 State
  const [buyerOneId, setBuyerOneId] = useState('');
  const [verifyingBuyer, setVerifyingBuyer] = useState(false);
  const [buyerMetadata, setBuyerMetadata] = useState(null);

  // Transfer Step 2 & 3 State
  const [submittingTransfer, setSubmittingTransfer] = useState(false);
  const [completedTransferData, setCompletedTransferData] = useState(null);

  useEffect(() => {
    if (!vehicleId) {
      toast.error('Vehicle reference ID not specified.');
      navigate('/vehicle');
      return;
    }

    async function getVehicleContext() {
      setLoading(true);
      try {
        const resp = await api.get('/vehicle/my-data');
        const matched = (resp.data.vehicles || []).find(v => v.id === vehicleId);
        if (!matched) {
          toast.error('The selected vehicle does not belong to your account.');
          navigate('/vehicle');
          return;
        }
        setVehicle(matched);
      } catch (err) {
        console.error('Error fetching vehicle context:', err);
        toast.error('Unable to verify vehicle ownership state.');
      } finally {
        setLoading(false);
      }
    }

    getVehicleContext();
  }, [vehicleId]);

  // Handle Verify Buyer OneID
  const handleVerifyBuyer = async () => {
    if (!buyerOneId.trim()) {
      toast.error('Please specify a recipient OneID.');
      return;
    }
    setVerifyingBuyer(true);
    setBuyerMetadata(null);
    try {
      const resp = await api.get(`/vehicle/lookup-buyer/${buyerOneId.trim()}`);
      if (resp.data.found) {
        setBuyerMetadata(resp.data);
        if (resp.data.hasLicense) {
          toast.success('Recipient identity and driving license cleared!');
        } else {
          toast.warning(`Recipient found but license status is ${resp.data.licenseStatus}. They must hold an APPROVED license.`);
        }
      } else {
        toast.error(resp.data.error || 'Recipient OneID does not match any registered citizen.');
      }
    } catch (err) {
      console.error('Buyer lookup error:', err);
      toast.error('Handshake verification failed.');
    } finally {
      setVerifyingBuyer(false);
    }
  };

  // Sign and Submit Transfer (Transition Step 2 -> Step 3)
  const handleSignAndSubmit = async () => {
    if (!buyerMetadata || !buyerMetadata.hasLicense) {
      toast.error('Recipient must be verified and have an approved driving license.');
      return;
    }

    setSubmittingTransfer(true);
    try {
      const resp = await api.post('/vehicle/transfer/initiate', {
        vehicleId: vehicle.id,
        toOwnerOneId: buyerMetadata.oneid
      });
      setCompletedTransferData(resp.data);
      toast.success('Ownership transfer signed and broadcasted to networks!');
      setStep(3);
    } catch (err) {
      console.error('Transfer initiate issue:', err);
      toast.error(err.response?.data?.error || 'Failed to dispatch title transfer deeds.');
    } finally {
      setSubmittingTransfer(false);
    }
  };

  if (loading) {
    return (
      <div className="max-w-xl mx-auto py-20 text-center font-mono text-xs font-bold text-slate-500">
        Checking sovereign vehicular titles...
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto px-6 py-10 space-y-8 font-sans" id="vehicle-transfer-wizard-container">
      
      {/* Back to vehicle panel */}
      <button 
        onClick={() => navigate('/vehicle')}
        className="flex items-center gap-1.5 text-xs text-slate-500 hover:text-slate-800 transition font-bold cursor-pointer"
      >
        <ArrowLeft className="w-4 h-4" /> Return to Cabinet Dashboard
      </button>

      {/* Header telemetry info */}
      <div className="space-y-1.5 border-b border-slate-150 pb-5 text-left">
        <span className="text-[10px] uppercase bg-amber-100 text-amber-800 font-mono px-2 py-0.5 rounded font-black border border-amber-200">
          OFFICIAL TRANSFER PROCEDURE • SECURE SIGNATURE SEQUENCE
        </span>
        <h1 className="text-xl font-black text-slate-900 tracking-tight pt-1">
          🤝 Title Ownership Transfer Wizard
        </h1>
        <p className="text-xs text-slate-500">
          Discharge ownership of vehicular asset <strong>{vehicle.make} {vehicle.model}</strong> ({vehicle.registrationNo}) to a verified citizen.
        </p>
      </div>

      {/* Step Indicators */}
      <div className="grid grid-cols-3 gap-2 px-1 text-center font-mono text-[9px] font-black uppercase text-slate-400">
        <div className={`border-b-4 pb-2 ${step >= 1 ? 'border-emerald-600 text-slate-800' : 'border-slate-200'}`}>
          1. Recipient Verify
        </div>
        <div className={`border-b-4 pb-2 ${step >= 2 ? 'border-emerald-600 text-slate-800' : 'border-slate-200'}`}>
          2. Review & Sign
        </div>
        <div className={`border-b-4 pb-2 ${step >= 3 ? 'border-emerald-600 text-slate-800' : 'border-slate-200'}`}>
          3. Chain Receipt
        </div>
      </div>

      {/* WIZARD STEP 1: ENTER RECIPIENT */}
      {step === 1 && (
        <div className="bg-white border rounded-2xl p-6 shadow-sm space-y-6 text-left" id="transfer-wizard-step1">
          <div className="space-y-1">
            <h3 className="text-sm font-bold text-slate-900">Verify Buyer Sovereign Credentials</h3>
            <p className="text-xs text-slate-500">
              Input the OneID identifier of the purchasing/receiving party. The system will retrieve their masked title status and verify their driving eligibility checks.
            </p>
          </div>

          <div className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-[10px] font-black uppercase text-slate-500 font-mono">Recipient OneID Account Code</label>
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="e.g. BD-ONEID-123456"
                  value={buyerOneId}
                  onChange={(e) => setBuyerOneId(e.target.value)}
                  className="flex-1 border bg-slate-50 border-slate-250 rounded-xl px-4 py-3 text-xs font-mono font-bold text-slate-800 focus:outline-none focus:border-emerald-600 focus:bg-white"
                />
                <button
                  onClick={handleVerifyBuyer}
                  disabled={verifyingBuyer}
                  className="bg-slate-900 hover:bg-slate-800 hover:text-white disabled:bg-slate-400 text-white font-bold text-xs px-5 py-3 rounded-xl transition cursor-pointer"
                >
                  {verifyingBuyer ? 'Verifying...' : 'Verify Recipient'}
                </button>
              </div>
            </div>

            {/* Buyer status box on check completion */}
            {buyerMetadata && (
              <div className={`p-5 rounded-2xl border flex items-start gap-4 ${
                buyerMetadata.hasLicense ? 'bg-emerald-50/50 border-emerald-250' : 'bg-red-50/50 border-red-200'
              }`}>
                {buyerMetadata.hasLicense ? (
                  <ShieldCheck className="w-8 h-8 text-emerald-600 shrink-0" />
                ) : (
                  <AlertCircle className="w-8 h-8 text-red-600 shrink-0" />
                )}
                
                <div className="space-y-2 text-xs text-slate-700">
                  <div className="space-y-0.5">
                    <span className="text-[9px] uppercase font-black text-slate-450 block font-mono">Verified Citizen Signature Profile</span>
                    <strong className="text-sm font-black text-slate-800">{buyerMetadata.name}</strong>
                    <span className="block font-mono text-[10px] font-bold text-slate-500">{buyerMetadata.oneid}</span>
                  </div>

                  <div className="space-y-1">
                    <p className="font-semibold">
                      Driving License Status: <span className={`font-black uppercase ${buyerMetadata.hasLicense ? 'text-emerald-700' : 'text-red-700'}`}>
                        {buyerMetadata.licenseStatus}
                      </span>
                    </p>
                    {buyerMetadata.hasLicense ? (
                      <p className="text-[11px] text-slate-500 leading-relaxed font-medium">
                        ✓ Safe check: Recipient possesses a valid active driving license card. Proceed to transaction.
                      </p>
                    ) : (
                      <p className="text-[11px] text-red-700 font-black">
                        ❌ block: Safe-driving criteria violated! The recipient must hold a fully verified and APPROVED Driving License to accept ownership.
                      </p>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Step Actions */}
          <div className="border-t border-slate-100 pt-4 flex justify-end gap-2">
            <button
              onClick={() => navigate('/vehicle')}
              className="px-4 py-2 text-xs font-bold text-slate-500 hover:bg-slate-50 rounded-xl cursor-pointer"
            >
              Cancel
            </button>
            <button
              disabled={!buyerMetadata || !buyerMetadata.hasLicense}
              onClick={() => setStep(2)}
              className="bg-emerald-605 bg-emerald-700 hover:bg-emerald-600 disabled:bg-slate-200 text-white font-black text-xs px-5 py-2.5 rounded-xl transition cursor-pointer"
            >
              Proceed to Title Review
            </button>
          </div>
        </div>
      )}

      {/* WIZARD STEP 2: REVIEW & CONFIRM DEED */}
      {step === 2 && (
        <div className="bg-white border rounded-2xl p-6 shadow-sm space-y-6 text-left" id="transfer-wizard-step2">
          
          <div className="space-y-1">
            <h3 className="text-sm font-bold text-slate-900 font-sans">Formal Title Handover Disclosure</h3>
            <p className="text-xs text-slate-500">
              Please review the registered technical values of the vehicle. By clicking 'Sign and Broadcast', you affix your sovereign OneID cryptographic signature to the title deed transfer order.
            </p>
          </div>

          {/* Side-by-Side Metadata Cards */}
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-slate-50 p-4 rounded-xl border border-slate-150 space-y-1">
              <span className="text-[8px] uppercase font-black font-mono text-slate-400">Current Owner (Seller)</span>
              <span className="font-bold text-slate-700 block text-xs">You</span>
              <span className="font-mono text-[9px] text-slate-500 font-bold">{vehicle.currentOwnerOneId}</span>
            </div>

            <div className="bg-emerald-50/20 p-4 rounded-xl border border-emerald-150 space-y-1">
              <span className="text-[8px] uppercase font-black font-mono text-emerald-600">Discharging Recipient (Buyer)</span>
              <span className="font-bold text-emerald-800 block text-xs">{buyerMetadata.name}</span>
              <span className="font-mono text-[9px] text-emerald-600 font-bold">{buyerMetadata.oneid}</span>
            </div>
          </div>

          {/* Vehicle summary board */}
          <div className="bg-slate-900 text-white p-5 rounded-2xl relative overflow-hidden">
            <span className="absolute right-4 top-4 text-slate-650 rounded border border-slate-700 text-[9px] font-mono p-1">
              BRTA PORTAL CODE
            </span>
            <div className="space-y-3">
              <div className="space-y-0.5">
                <span className="text-[8px] uppercase font-bold text-slate-400 font-mono">Asset to Discharge</span>
                <h4 className="text-sm font-black">{vehicle.make} {vehicle.model} ({vehicle.year})</h4>
              </div>
              <div className="grid grid-cols-3 gap-2 text-[10px] font-mono text-slate-300">
                <div>Plate: <strong className="text-white block pt-0.5">{vehicle.registrationNo}</strong></div>
                <div>Engine: <strong className="text-white block pt-0.5">{vehicle.engineNo}</strong></div>
                <div>Chassis: <strong className="text-white block pt-0.5">{vehicle.chassisNo}</strong></div>
              </div>
            </div>
          </div>

          {/* Audit disclaimer */}
          <div className="p-4 bg-amber-50 rounded-xl border border-amber-200 flex gap-2.5 items-start">
            <FileText className="w-5 h-5 text-amber-700 shrink-0 mt-0.5" />
            <p className="text-[11px] text-amber-800 leading-relaxed font-semibold">
              Legal clause: Initiating this block signature will instantly send a notary alert to `{buyerMetadata.name}`'s cabinet. Once the buyer signs and the BRTA Administrator verifies sequence, the title registers dynamically on the public chain.
            </p>
          </div>

          {/* Step Actions */}
          <div className="border-t border-slate-100 pt-4 flex justify-between gap-2">
            <button
              onClick={() => setStep(1)}
              className="px-4 py-2 text-xs font-bold text-slate-500 hover:bg-slate-50 rounded-xl cursor-pointer"
            >
              Back to Verification
            </button>

            <button
              onClick={handleSignAndSubmit}
              disabled={submittingTransfer}
              className="bg-emerald-700 hover:bg-emerald-650 disabled:bg-slate-400 text-white font-black text-xs px-5 py-2.5 rounded-xl transition cursor-pointer flex items-center gap-1 shadow-sm"
            >
              {submittingTransfer ? 'Decrypting Secure Sign Key...' : 'Sign and Broadcast Transfer Deed'}
            </button>
          </div>
        </div>
      )}

      {/* WIZARD STEP 3: SUCCESS CONFIRMATION OF DEED */}
      {step === 3 && (
        <div className="bg-white border rounded-2xl p-6 shadow-sm space-y-6 text-center" id="transfer-wizard-step3">
          
          <div className="space-y-2">
            <span className="inline-block p-3 bg-emerald-100 text-emerald-800 rounded-full animate-bounce">
              <CheckCircle className="w-8 h-8" />
            </span>
            <h3 className="text-base font-black text-slate-900">Transfer Sequence Sealed</h3>
            <p className="text-xs text-slate-500 max-w-md mx-auto leading-relaxed">
              Your cryptographic signature was compiled and appended cleanly to the BRTA node. The document resides in PENDING_BUYER_SIGN status for recipient action.
            </p>
          </div>

          {completedTransferData && (
            <div className="bg-slate-50 p-5 rounded-2xl border border-slate-150 text-left space-y-3 font-mono text-[11px] max-w-md mx-auto">
              <div className="flex justify-between border-b border-slate-205 pb-2">
                <span className="text-slate-400 font-sans">Transfer Sequence ID:</span>
                <span className="font-bold text-slate-700">{completedTransferData.id.slice(0, 8)}...</span>
              </div>
              <div className="flex justify-between border-b border-slate-205 pb-2">
                <span className="text-slate-400 font-sans">Document Status:</span>
                <span className="font-extrabold text-[#006a4e]">{completedTransferData.status}</span>
              </div>
              <div className="flex justify-between items-center bg-white p-3 border rounded-xl gap-2 mt-2">
                <span className="font-sans text-slate-500 text-[10px] font-bold">Ledger Assurance Trace:</span>
                <LedgerBadge sector="VEHICLE" recordId={completedTransferData.ledgerRecordId} />
              </div>
            </div>
          )}

          <button
            onClick={() => navigate('/vehicle')}
            className="bg-slate-900 text-white font-black text-xs px-6 py-3 rounded-xl hover:bg-slate-800 transition cursor-pointer"
          >
            Acknowledge and Exit
          </button>
        </div>
      )}

    </div>
  );
}
