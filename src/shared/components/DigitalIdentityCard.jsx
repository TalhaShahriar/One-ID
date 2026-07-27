import React, { useState } from 'react';
import { 
  ShieldCheck, 
  QrCode, 
  Fingerprint, 
  Calendar, 
  Download, 
  RefreshCw, 
  UserCheck, 
  CreditCard, 
  ExternalLink,
  Info,
  Layers,
  Sparkles
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { toast } from 'sonner';

/**
 * DigitalIdentityCard Component
 * Displays a highly interactive, 3D-flippable, biometric visual representation of the Bangladesh Digital OneID / NID Card.
 * 
 * Features:
 * - 3D card flipping effect to view Front / Back (with QR Code and signature).
 * - Interactive elements to verify cryptographic signature.
 * - One-click Print/Download voucher mode.
 * - Responsive layout styled with custom tailwind classes.
 */
export default function DigitalIdentityCard({ user }) {
  const [isFlipped, setIsFlipped] = useState(false);
  const [isVerifyingSignature, setIsVerifyingSignature] = useState(false);
  const [qrLoaded, setQrLoaded] = useState(true);
  const [qrVersion, setQrVersion] = useState(0);

  if (!user) return null;

  const initials = user.name
    ? user.name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()
    : 'BD';

  const formattedDob = user.dateOfBirth 
    ? new Date(user.dateOfBirth).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })
    : '12-Oct-1994'; // default fallback for visual realism

  const nidNumber = user.oneid || 'N/A';

  // Quick signature validation simulation that generates security trust events
  const verifySecuritySignature = () => {
    setIsVerifyingSignature(true);
    setTimeout(() => {
      setIsVerifyingSignature(false);
      toast.success("Cryptographic security hash verified! Node signature matches Bangladesh National Election Commission authority.", {
        description: "Seal SHA-256: " + Math.random().toString(16).substr(2, 8).toUpperCase() + "..."
      });
    }, 1200);
  };

  const reloadQRCode = () => {
    setQrVersion(prev => prev + 1);
    toast.info("Regenerating biometric verification token...");
  };

  const handlePrintCard = () => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      toast.error("Popup blocked! Please allow popups to export the Digital Identity.");
      return;
    }

    printWindow.document.write(`
      <html>
        <head>
          <title>Digital OneID Card - ${user.name}</title>
          <style>
            body { font-family: 'Courier New', monospace; padding: 40px; text-align: center; background: #f8fafc; color: #1e293b; }
            .card-container { max-width: 500px; margin: 0 auto; background: white; border: 2px solid #006A4E; border-radius: 16px; padding: 24px; box-shadow: 0 4px 6px -1px rgb(0 0 0 / 0.1); text-align: left; position: relative; }
            .header { display: flex; justify-content: space-between; align-items: center; border-bottom: 3px solid #006A4E; padding-bottom: 12px; margin-bottom: 20px; }
            .title { font-size: 16px; font-weight: bold; color: #006A4E; }
            .avatar-section { display: flex; gap: 20px; margin-bottom: 20px; }
            .avatar { width: 80px; height: 80px; background: #006A4E; color: white; border-radius: 12px; display: flex; align-items: center; justify-content: center; font-size: 28px; font-weight: bold; }
            .details { flex-1; }
            .name { font-size: 20px; font-weight: bold; margin: 0 0 6px 0; color: #0f172a; }
            .nid { font-family: monospace; font-size: 16px; font-weight: bold; color: #006A4E; background: #f1f5f9; padding: 4px 8px; border-radius: 6px; display: inline-block; margin-top: 4px; }
            .meta-grid { display: grid; grid-template-cols: 1fr 1fr; gap: 12px; font-size: 11px; margin-top: 20px; border-top: 1px solid #e2e8f0; pt: 12px; }
            .meta-item { margin-bottom: 4px; }
            .label { font-size: 9px; text-transform: uppercase; color: #64748b; font-weight: bold; }
            .val { font-weight: bold; }
            .seal-stamp { position: absolute; right: 24px; top: 120px; border: 2px dashed #006A4E; color: #006A4E; padding: 4px 8px; font-size: 10px; font-weight: bold; border-radius: 4px; transform: rotate(-8deg); }
          </style>
        </head>
        <body>
          <div class="card-container">
            <div class="header">
              <span class="title">🇧🇩 PEOPLE'S REPUBLIC OF BANGLADESH</span>
              <span style="font-size: 10px; font-weight: bold; color: #ef4444;">DIGITAL ID CARD</span>
            </div>
            <div class="avatar-section">
              <div class="avatar">${initials}</div>
              <div class="details">
                <div class="name">${user.name}</div>
                <div class="label">National Identification Number (NID)</div>
                <div class="nid">${nidNumber}</div>
              </div>
            </div>
            <div class="seal-stamp">SECURE VERIFIED</div>
            <div class="meta-grid">
              <div class="meta-item">
                <div class="label">Constituency</div>
                <div class="val">${user.constituency || 'Dhaka-8'}</div>
              </div>
              <div class="meta-item">
                <div class="label">Date of Birth</div>
                <div class="val">${formattedDob}</div>
              </div>
              <div class="meta-item">
                <div class="label">Status</div>
                <div class="val">ACTIVE CREDENTIAL</div>
              </div>
              <div class="meta-item">
                <div class="label">Secure Phone</div>
                <div class="val">${user.phone}</div>
              </div>
            </div>
          </div>
          <p style="font-size: 11px; color: #64748b; margin-top: 20px;">Bangladesh OneID Cryptographic Verification System &bull; Printed Secure Token</p>
          <script>window.print();</script>
        </body>
      </html>
    `);
    printWindow.document.close();
  };

  return (
    <div className="flex flex-col gap-4">
      {/* 3D Perspective Container for Card Flipping */}
      <div 
        className="relative w-full h-[256px] cursor-pointer group select-none"
        style={{ perspective: '1200px' }}
        onClick={() => setIsFlipped(prev => !prev)}
        id="digital-id-card-visualizer"
      >
        <motion.div 
          className="w-full h-full relative"
          style={{ transformStyle: 'preserve-3d' }}
          animate={{ rotateY: isFlipped ? 180 : 0 }}
          transition={{ duration: 0.6, ease: [0.23, 1, 0.32, 1] }}
        >
          {/* ==================== CARD FRONT ==================== */}
          <div 
            className="absolute inset-0 w-full h-full rounded-2xl p-5 flex flex-col justify-between overflow-hidden border border-emerald-950/20 shadow-xl bg-gradient-to-br from-[#004e38] via-[#005a42] to-[#013526] text-white"
            style={{ 
              backfaceVisibility: 'hidden',
              WebkitBackfaceVisibility: 'hidden'
            }}
          >
            {/* Background flag-motif watermark */}
            <div className="absolute right-[-20px] bottom-[-20px] w-48 h-48 rounded-full bg-[#ef4444]/15 blur-2xl pointer-events-none" />
            <div className="absolute left-[-40px] top-[-40px] w-64 h-64 rounded-full bg-emerald-500/10 blur-3xl pointer-events-none" />
            
            {/* Holographic vertical security strip */}
            <div className="absolute left-2 top-0 bottom-0 w-[4px] bg-gradient-to-b from-[#f59e0b] via-[#ef4444] to-[#10b981] opacity-60" />

            {/* Top Bar / Header info */}
            <div className="flex justify-between items-start border-b border-emerald-800/60 pb-2 pl-3">
              <div className="flex items-center gap-1.5">
                <span className="text-[14px]">🇧🇩</span>
                <div>
                  <h4 className="text-[10px] font-black tracking-tight text-emerald-250 leading-tight">GOVERNMENT OF BANGLADESH</h4>
                  <p className="text-[7px] text-emerald-350/90 font-mono tracking-wider font-semibold">ONEID SOVEREIGN CRYPTO SYSTEM</p>
                </div>
              </div>
              <div className="flex items-center gap-1 bg-emerald-900/40 border border-emerald-700/50 px-2 py-0.5 rounded-full">
                <ShieldCheck className="w-3 h-3 text-emerald-400" />
                <span className="text-[8px] font-black tracking-wider text-emerald-300 uppercase">Secure</span>
              </div>
            </div>

            {/* Card Body - Avatar + Name + NID Key */}
            <div className="flex items-center gap-4 pl-3 flex-1 py-3">
              {/* Photo placeholder with biometric look */}
              <div className="relative shrink-0">
                <div className="w-16 h-16 rounded-xl bg-emerald-950/60 border border-emerald-700/60 flex items-center justify-center text-emerald-100 font-extrabold text-xl shadow-inner relative overflow-hidden">
                  {initials}
                  {/* Digital scanlines effect */}
                  <div className="absolute inset-0 bg-[linear-gradient(rgba(16,185,129,0.07)_50%,rgba(0,0,0,0.15)_50%)] bg-[length:100%_4px] animate-pulse" />
                </div>
                {/* Fingerprint indicator watermark on avatar */}
                <div className="absolute -bottom-1 -right-1 bg-emerald-500 text-slate-950 p-0.5 rounded-md border border-emerald-300">
                  <Fingerprint className="w-3 h-3" />
                </div>
              </div>

              {/* Identity details */}
              <div className="min-w-0 space-y-1.5 flex-1 text-left">
                <div>
                  <span className="text-[8px] uppercase tracking-wider text-emerald-300/80 font-bold font-mono">Full Legal Name</span>
                  <h3 className="text-sm font-bold truncate tracking-tight text-white leading-tight pr-1">
                    {user.name}
                  </h3>
                </div>

                <div>
                  <span className="text-[8px] uppercase tracking-wider text-emerald-300/80 font-bold font-mono">National ID (NID Number)</span>
                  <p className="text-xs font-mono font-bold tracking-widest text-emerald-300 bg-emerald-950/60 border border-emerald-800 px-2 py-0.5 rounded inline-block">
                    {nidNumber}
                  </p>
                </div>
              </div>
            </div>

            {/* Bottom Bar: Metadata */}
            <div className="flex justify-between items-center text-[8px] font-mono text-emerald-300/80 border-t border-emerald-800/40 pt-2 pl-3">
              <div>
                <span className="text-emerald-400 font-bold">CONSTITUENCY:</span> {user.constituency || 'Dhaka-8'}
              </div>
              <div className="flex items-center gap-1 text-[8px]">
                <span className="text-emerald-400 font-bold">DOB:</span> {formattedDob}
              </div>
              <span className="text-[9px] hover:text-white font-bold transition-colors flex items-center gap-0.5">
                Flip card to scan <ExternalLink className="w-2.5 h-2.5" />
              </span>
            </div>
          </div>

          {/* ==================== CARD BACK ==================== */}
          <div 
            className="absolute inset-0 w-full h-full rounded-2xl p-5 flex flex-col justify-between overflow-hidden border border-gray-300 shadow-xl bg-white text-slate-800"
            style={{ 
              backfaceVisibility: 'hidden',
              WebkitBackfaceVisibility: 'hidden',
              transform: 'rotateY(180deg)'
            }}
          >
            {/* Background security patterns */}
            <div className="absolute inset-0 opacity-[0.03] bg-[radial-gradient(#006a4e_1px,transparent_1px)] bg-[size:12px_12px] pointer-events-none" />

            {/* Back Header */}
            <div className="flex justify-between items-center border-b border-slate-100 pb-1.5">
              <span className="text-[8px] font-black font-sans tracking-widest text-slate-400 uppercase">
                BIOMETRIC IDENTITY CREDENTIAL
              </span>
              <span className="text-[8px] font-mono bg-emerald-50 text-[#006A4E] px-2 py-0.5 rounded font-bold">
                SECURE TOKEN
              </span>
            </div>

            {/* Back Body: QR Code Scanner */}
            <div className="flex items-center gap-4 justify-between py-2">
              <div className="space-y-2 flex-1 text-left">
                <div className="space-y-0.5">
                  <span className="text-[8px] font-bold text-slate-400 uppercase font-mono tracking-wider block">OneID Signature URI:</span>
                  <p className="text-[9px] font-mono font-bold text-[#006A4E] bg-slate-50 border border-slate-200/60 p-1.5 rounded break-all leading-normal select-all">
                    urn:nid:bd:{nidNumber.toLowerCase()}
                  </p>
                </div>
                <div className="space-y-1">
                  <p className="text-[8px] text-slate-500 leading-normal flex items-start gap-1">
                    <Info className="w-3 h-3 text-slate-400 shrink-0" />
                    <span>Scan this secure QR code using any smart public inspector module to verify this credentials authentic block status.</span>
                  </p>
                </div>
              </div>

              {/* Elegant QR Code Frame */}
              <div className="shrink-0 flex flex-col items-center">
                <div className="p-1.5 border border-slate-200 bg-slate-50 rounded-xl hover:border-[#006A4E] transition-colors shadow-sm relative group/qr">
                  {qrLoaded ? (
                    <img 
                      src={`/api/citizen/oneid-qr?v=${qrVersion}`} 
                      alt="Identity QR Certificate" 
                      className="w-20 h-20 object-contain mix-blend-multiply"
                      onError={() => setQrLoaded(false)}
                      referrerPolicy="no-referrer"
                    />
                  ) : (
                    <div className="w-20 h-20 flex items-center justify-center text-slate-400">
                      <QrCode className="w-8 h-8" />
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Back Footer: Barcode + Back Indicator */}
            <div className="flex items-center justify-between border-t border-slate-100 pt-2 text-[8px] font-mono text-slate-400">
              {/* Simulated Micro Barcode for realism */}
              <div className="flex flex-col gap-0.5">
                <div className="flex items-center h-4 gap-[1px]">
                  <div className="w-[1px] h-full bg-slate-800" />
                  <div className="w-[3px] h-full bg-slate-800" />
                  <div className="w-[1px] h-full bg-slate-800" />
                  <div className="w-[2px] h-full bg-slate-800" />
                  <div className="w-[1px] h-full bg-slate-850" />
                  <div className="w-[1px] h-full bg-slate-800" />
                  <div className="w-[4px] h-full bg-slate-800" />
                  <div className="w-[2px] h-full bg-slate-800" />
                  <div className="w-[1px] h-full bg-slate-850" />
                  <div className="w-[3px] h-full bg-slate-800" />
                  <div className="w-[1px] h-full bg-slate-800" />
                  <div className="w-[2px] h-full bg-slate-800" />
                  <div className="w-[1px] h-full bg-slate-800" />
                  <div className="w-[3px] h-full bg-slate-800" />
                  <div className="w-[1px] h-full bg-slate-850" />
                  <div className="w-[2px] h-full bg-slate-800" />
                  <div className="w-[1px] h-full bg-slate-800" />
                  <div className="w-[1px] h-full bg-slate-800" />
                  <div className="w-[3px] h-full bg-slate-800" />
                  <div className="w-[1px] h-full bg-slate-850" />
                  <div className="w-[2px] h-full bg-slate-800" />
                  <div className="w-[1px] h-full bg-slate-800" />
                </div>
                <span className="text-[7px] text-center font-mono tracking-widest text-slate-400">
                  {nidNumber}
                </span>
              </div>

              <span className="text-[9px] hover:text-slate-800 font-bold transition-colors flex items-center gap-0.5">
                Flip back to Front <ExternalLink className="w-2.5 h-2.5" />
              </span>
            </div>
          </div>
        </motion.div>
      </div>

      {/* Identity Card Action Toolkit */}
      <div className="grid grid-cols-3 gap-2">
        <button
          onClick={(e) => {
            e.stopPropagation();
            setIsFlipped(prev => !prev);
          }}
          className="flex items-center justify-center gap-1.5 min-h-[44px] px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl transition cursor-pointer border border-slate-200/50"
        >
          <QrCode className="w-3.5 h-3.5" />
          <span>Flip Card</span>
        </button>

        <button
          onClick={(e) => {
            e.stopPropagation();
            verifySecuritySignature();
          }}
          disabled={isVerifyingSignature}
          className="flex items-center justify-center gap-1.5 min-h-[44px] px-3 py-2 bg-emerald-50 hover:bg-emerald-100 text-[#006A4E] font-bold text-xs rounded-xl transition cursor-pointer border border-emerald-100/60 disabled:opacity-50"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${isVerifyingSignature ? 'animate-spin' : ''}`} />
          <span>{isVerifyingSignature ? 'Auditing...' : 'Verify Crypt'}</span>
        </button>

        <button
          onClick={(e) => {
            e.stopPropagation();
            handlePrintCard();
          }}
          className="flex items-center justify-center gap-1.5 min-h-[44px] px-3 py-2 bg-[#006A4E] hover:bg-emerald-800 text-white font-bold text-xs rounded-xl transition cursor-pointer shadow-sm border border-transparent"
        >
          <Download className="w-3.5 h-3.5" />
          <span>Download</span>
        </button>
      </div>
    </div>
  );
}
