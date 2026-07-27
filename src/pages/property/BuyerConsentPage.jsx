import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../../lib/api.js';
import { toast } from 'sonner';
import {
  FileText,
  User,
  ShieldCheck,
  CheckCircle,
  AlertOctagon,
  ArrowRight,
  TrendingUp,
  Key,
  Calendar,
  DollarSign
} from 'lucide-react';

export default function BuyerConsentPage() {
  const { transferId } = useParams();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [transfer, setTransfer] = useState(null);
  const [signing, setSigning] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);

  // Load current user
  useEffect(() => {
    try {
      const stored = localStorage.getItem('votechain_user');
      if (stored) {
        setCurrentUser(JSON.parse(stored));
      }
    } catch (e) {
      console.error(e);
    }
  }, []);

  // Fetch Transfer details by querying mine (or matching if we can build a simple endpoint,
  // or fetching mine and finding the incoming transfer)
  const fetchTransferDetails = async () => {
    setLoading(true);
    try {
      // We can query custom '/property/mine' and extract matching transferId in activeIncomingTransfers
      const resp = await api.get('/property/mine');
      const incoming = resp.data.activeIncomingTransfers || [];
      const matched = incoming.find(tx => tx.id === transferId);
      
      if (matched) {
        setTransfer(matched);
      } else {
        toast.error("Deed assignment not found or already signed/withdrawn.");
        navigate('/property');
      }
    } catch (err) {
      console.error(err);
      toast.error("Failure fetching deed details from registration nodes.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (transferId) {
      fetchTransferDetails();
    }
  }, [transferId]);

  const handleAcceptAndSign = async () => {
    setSigning(true);
    try {
      await api.post('/property/transfer/confirm', { transferId });
      toast.success("Secondary signature verified and uploaded! Transfer routing dispatched to Registrar node.");
      navigate('/property');
    } catch (err) {
      toast.error(err.response?.data?.error || "Signature broadcast failed.");
    } finally {
      setSigning(false);
    }
  };

  if (loading) {
    return (
      <div className="max-w-xl mx-auto py-32 text-center text-slate-500 font-mono text-xs">
        <div className="w-8 h-8 border-4 border-[#006a4e] border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
        Decrypting sovereign deed lock...
      </div>
    );
  }

  if (!transfer) {
    return (
      <div className="max-w-md mx-auto py-20 text-center text-slate-500">
        <AlertOctagon className="w-12 h-12 text-rose-500 mx-auto mb-4" />
        <h3 className="text-sm font-bold text-slate-800">Transfer Ticket Intercepted</h3>
        <p className="text-xs text-slate-400 mt-1">This signature record has concluded or was canceled by the seller.</p>
      </div>
    );
  }

  const property = transfer.property;

  return (
    <div className="max-w-2xl mx-auto px-4 py-10 text-left space-y-6">
      <div className="border-b border-slate-200 pb-4">
        <h1 className="text-2xl font-black text-slate-900 flex items-center gap-2">
          ✒️ Ministry of Land Legal Deed Handshake
        </h1>
        <p className="text-xs text-slate-500 mt-1">
          Review the mutual seller deed and provide your digital cryptographic consent signature to satisfy state condition checks.
        </p>
      </div>

      <div className="bg-[#FFF8E7] border-2 border-[#006a4e] rounded-3xl p-6 md:p-8 shadow-sm space-y-6">
        
        {/* Land Attributes */}
        <div className="space-y-4">
          <h3 className="font-extrabold text-slate-900 border-b border-[#d3ccb8]/40 pb-2 text-sm uppercase tracking-wide">
            🏡 Target Land Parcel
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs font-semibold text-slate-800">
            <div>
              <span className="text-slate-400 font-bold block text-[10px]">PARCEL DESIGNATION TITLE</span>
              <p className="text-slate-900 text-sm font-black">{property.title}</p>
            </div>
            <div>
              <span className="text-slate-400 font-bold block text-[10px]">LEGAL REGISTRATION ID</span>
              <p className="text-slate-900 font-mono font-bold text-sm text-[#006a4e]">{property.propertyId}</p>
            </div>
            <div>
              <span className="text-slate-400 font-bold block text-[10px]">KHATIAN RECORD NUMBER</span>
              <p className="font-mono text-slate-900">{property.khatianNumber}</p>
            </div>
            <div>
              <span className="text-slate-400 font-bold block text-[10px]">PLOT ASSIGNMENT (DAG NO.)</span>
              <p className="font-mono text-slate-900">{property.plotNumber}</p>
            </div>
            <div>
              <span className="text-slate-400 font-bold block text-[10px]">MOUZA REGISTER</span>
              <p className="text-slate-900">{property.mouza}</p>
            </div>
            <div>
              <span className="text-slate-400 font-bold block text-[10px]">TOTAL PARCEL AREA</span>
              <p className="text-slate-900 font-bold text-sm">{property.areaInDecimal} Decimals</p>
            </div>
          </div>
        </div>

        {/* Transaction Finance Terms */}
        <div className="bg-amber-100/40 border border-[#d3ccb8]/50 rounded-2xl p-5 space-y-3">
          <h3 className="font-black text-slate-950 flex items-center gap-1 text-xs uppercase tracking-wide">
            <DollarSign className="w-4 h-4 text-amber-700" /> Agreed Deed Mutation Consideration
          </h3>
          <div className="flex items-center justify-between text-slate-900 font-medium text-xs">
            <span>MUTUAL CONSIDERATION:</span>
            <span className="text-lg font-black font-mono text-emerald-900">৳ {transfer.agreedPriceBDT.toLocaleString('en-US')} BDT</span>
          </div>
          <div className="text-[10px] text-slate-500 font-semibold flex items-center gap-1">
            <User className="w-3.5 h-3.5 shrink-0" />
            Seller Identity Token: <span className="font-mono text-slate-700 font-bold">{transfer.fromOwnerOneId}</span>
          </div>
        </div>

        {/* Condition details of Smart Contract */}
        <div className="space-y-4 pt-4 border-t border-[#d3ccb8]/40">
          <h4 className="font-bold text-xs uppercase tracking-wide text-slate-900 flex items-center gap-1.5">
            <Key className="w-4 h-4 text-[#006a4e]" /> Cryptographic Agreement Validation Parameters
          </h4>
          <p className="text-xs text-slate-600 leading-relaxed font-semibold">
            By signing this digital deed with your verified OneID, a secondary consent hash matches the seller's signature, locking the transaction into "PENDING_ADMIN_APPROVAL". This constitutes Condition 2 of 4 of the land contract stack.
          </p>

          <div className="bg-white border border-[#d3ccb8]/60 rounded-xl p-3.5 space-y-2 font-mono text-[10px] text-slate-600 leading-relaxed">
            <p><span className="text-slate-400">SELLER SIGNATURE:</span> {transfer.sellerSignatureHash?.slice(0, 32)}...</p>
            <p><span className="text-slate-400">SELLER TIMESTAMP:</span> {new Date(transfer.sellerSignedAt).toUTCString()}</p>
            <p><span className="text-slate-400">YOUR CITIZEN ID :</span> {currentUser?.oneid || 'AUTHENTICATING'}</p>
          </div>
        </div>

        <div className="pt-4 border-t border-[#d3ccb8]/50 flex items-center justify-end gap-3">
          <button
            type="button"
            onClick={() => navigate('/property')}
            className="px-4 py-2.5 border border-slate-300 rounded-xl font-bold text-xs text-slate-600 hover:bg-slate-50 cursor-pointer transition"
          >
            Decline Handshake
          </button>
          <button
            type="button"
            onClick={handleAcceptAndSign}
            disabled={signing}
            className="bg-[#006a4e] hover:bg-[#00513b] text-white px-6 py-2.5 rounded-xl font-black text-xs flex items-center gap-1.5 shadow cursor-pointer transition"
          >
            {signing ? (
              <>
                <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                Evaluating Contract State...
              </>
            ) : (
              <>
                Confirm Deed & Apply Signature <ShieldCheck className="w-4.5 h-4.5" />
              </>
            )}
          </button>
        </div>

      </div>
    </div>
  );
}
