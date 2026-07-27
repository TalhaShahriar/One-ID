import React, { useRef, useState } from 'react';
import { 
  QrCode, 
  ShieldCheck, 
  ShieldAlert 
} from 'lucide-react';

export default function DrivingLicense({ license }) {
  const cardRef = useRef(null);
  const [coords, setCoords] = useState({ x: 0.5, y: 0.5 });
  const [isHovered, setIsHovered] = useState(false);

  if (!license) return null;

  // Handle custom holographic mouse tracking
  const handleMouseMove = (e) => {
    if (!cardRef.current) return;
    const rect = cardRef.current.getBoundingClientRect();
    
    // Calculate mouse coordinates as a percentage of the card dimensions [0, 1]
    const x = (e.clientX - rect.left) / rect.width;
    const y = (e.clientY - rect.top) / rect.height;
    
    setCoords({ x, y });
    setIsHovered(true);

    // Set CSS custom properties on the container
    cardRef.current.style.setProperty('--mx', x.toString());
    cardRef.current.style.setProperty('--my', y.toString());
  };

  const handleMouseLeave = () => {
    setIsHovered(false);
    if (!cardRef.current) return;
    cardRef.current.style.setProperty('--mx', '0.5');
    cardRef.current.style.setProperty('--my', '0.5');
  };

  const status = (license.status || '').toUpperCase();
  const isSuspended = status === 'SUSPENDED';

  // Extract initials for the portrait circle
  const initials = 'BD';

  return (
    <div className="space-y-4">
      {/* 
        Genuine visual representation of Bangladesh Driving License 
        with holographic shimmer overlay 
      */}
      <div 
        ref={cardRef}
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
        className={`relative rounded-3xl border-4 overflow-hidden shadow-2xl aspect-[1.58/1] flex flex-col justify-between font-sans transition-all duration-300 transform ${
          isHovered ? 'scale-[1.02] -rotate-1 shadow-emerald-500/10' : 'scale-100 rotate-0'
        } ${
          isSuspended 
            ? 'border-red-650 bg-gradient-to-br from-red-50 to-rose-100 text-red-950' 
            : 'border-[#006A4E] bg-gradient-to-br from-emerald-50/40 via-white to-emerald-50/10 text-slate-900'
        }`}
        style={{
          '--mx': '0.5',
          '--my': '0.5',
          perspective: '1000px'
        }}
        id="holographic-driving-license"
      >
        {/* HOLOGRAPHIC EFFECT OVERLAY */}
        <div 
          className="absolute inset-0 pointer-events-none mix-blend-color-dodge transition-opacity duration-300 z-10"
          style={{
            opacity: isHovered ? 0.85 : 0,
            background: `linear-gradient(calc(var(--mx) * 360deg), rgba(255, 255, 255, 0.28) 0%, rgba(200, 255, 220, 0.15) 35%, rgba(255, 220, 220, 0.15) 60%, transparent 100%)`,
            backgroundPosition: `calc(var(--mx) * 100%) calc(var(--my) * 100%)`
          }}
        />

        {/* Green Header Area */}
        <div className="bg-[#006A4E] text-white py-3 px-4 flex justify-between items-center relative overflow-hidden shrink-0">
          <div className="absolute right-[-15px] top-[-10px] bottom-[-10px] w-24 bg-[#F42A41] skew-x-12 opacity-95 transform translate-x-2 flex items-center justify-center font-bold text-[10px] shadow-sm">
            <span className="text-white font-sans font-black tracking-widest text-[9px] select-none">OneID</span>
          </div>
          <div className="text-left space-y-0.5">
            <div className="text-[8px] font-black uppercase tracking-widest text-emerald-150 leading-none">
              People's Republic of Bangladesh • BRTA
            </div>
            <div className="text-[12px] font-black tracking-tight flex items-center gap-1.5 leading-none">
              🇧🇩 DRIVING LICENSE 
              <span className="text-[8.5px] bg-white text-[#006A4E] py-0.5 px-1.5 rounded-md font-black font-mono shadow-3xs uppercase">
                CLASS {license.category}
              </span>
            </div>
          </div>
        </div>

        {/* Body Content */}
        <div className="p-4 flex-1 flex justify-between gap-4 relative">
          
          {/* Portrait area (initials) */}
          <div className="flex flex-col items-center justify-center space-y-1 shrink-0">
            <div className="w-16 h-16 rounded-2xl bg-emerald-50 border-2 border-emerald-600/30 flex items-center justify-center font-extrabold text-[#006A4E] shadow-inner text-lg tracking-wider">
              {initials}
            </div>
            <div className="text-[7.5px] uppercase font-bold text-[#006A4E] font-mono tracking-wider p-0.5 bg-[#E8F5F1] rounded">
              VERIFIED PHOTO
            </div>
          </div>

          {/* Fields in 2 columns */}
          <div className="space-y-2 text-left flex-1 min-w-0">
            <div>
              <span className="text-[7.5px] uppercase font-bold text-gray-400 font-mono block tracking-wider leading-none">Licenseholder Name</span>
              <div className="text-xs font-black uppercase text-gray-950 truncate leading-tight">Sovereign Citizen OneID</div>
              <span className="text-[8px] font-mono font-bold text-gray-500 tracking-tight leading-none block mt-0.5">{license.citizenOneId}</span>
            </div>

            {/* Grid 2-columns */}
            <div className="grid grid-cols-2 gap-x-2 gap-y-1.5 text-[8.5px] pt-1">
              <div>
                <span className="text-[6.5px] uppercase font-bold text-gray-400 font-mono block leading-none">License Code</span>
                <span className="font-mono font-black text-gray-900">{license.licenseNumber}</span>
              </div>
              <div>
                <span className="text-[6.5px] uppercase font-bold text-gray-400 font-mono block leading-none">Vehicle Class</span>
                <span className="font-extrabold text-emerald-800 uppercase">{license.category?.replace(/_/g, ' ')}</span>
              </div>
              <div>
                <span className="text-[6.5px] uppercase font-bold text-gray-400 font-mono block leading-none">Blood Group</span>
                <span className="font-mono font-black text-[#F42A41] text-[9px] bg-red-50 border border-red-100 rounded-md px-1.5 inline-block leading-none mt-0.5">
                  {license.bloodGroup}
                </span>
              </div>
              <div>
                <span className="text-[6.5px] uppercase font-bold text-gray-400 font-mono block leading-none">Validity Bounds</span>
                <span className="font-mono font-bold text-gray-700 block mt-0.5 truncate leading-none">
                  {license.expiryDate ? new Date(license.expiryDate).toLocaleDateString(undefined, {year: 'numeric', month: 'short', day: 'numeric'}) : 'N/A'}
                </span>
              </div>
            </div>
          </div>

          {/* QR Code section */}
          <div className="flex flex-col items-center justify-center text-center space-y-1 p-2 bg-white rounded-xl border border-gray-150 shrink-0 select-none shadow-3xs">
            <QrCode className="w-10 h-10 text-[#006A4E]" aria-hidden="true" />
            <span className="text-[6.5px] font-mono font-black tracking-widest text-[#006A4E]">SECURE TRACE</span>
          </div>
        </div>

        {/* Barcode-stripe CSS at bottom (repeating-linear-gradient thin stripes) */}
        <div 
          className="h-3 w-full shrink-0 border-t border-gray-150" 
          style={{
            backgroundImage: 'repeating-linear-gradient(90deg, #111827 0px, #111827 1px, transparent 1px, transparent 3px, #111827 3px, #111827 5px, transparent 5px, transparent 7px)'
          }}
          aria-hidden="true"
        />

        {/* Hologram or Status Overlay */}
        {isSuspended && (
          <div className="absolute inset-0 bg-gradient-to-tr from-red-950 via-red-900/95 to-red-950/98 backdrop-blur-[1px] flex flex-col justify-center items-center text-center p-4 text-white space-y-2.5 z-20">
            <ShieldAlert className="w-10 h-10 text-[#F42A41] animate-bounce" aria-hidden="true" />
            <div className="space-y-1">
              <span className="bg-white text-red-950 px-3 py-1 rounded-md text-[10px] font-black uppercase tracking-widest leading-none shadow">
                ⚠️ LICENSE SUSPENDED
              </span>
              <p className="text-[10px] text-red-100 leading-relaxed max-w-xs font-semibold">
                Disenfranchised from driving power due to exceeding speed controls or safety violations. Pay dues to restore license.
              </p>
            </div>
          </div>
        )}
      </div>
      
      {/* Dynamic Instruction tip */}
      {!isSuspended && (
        <p className="text-[10px] text-gray-400 text-center font-medium font-mono select-none">
          ✨ Hover & move cursor over driving license smart card to shine hologram.
        </p>
      )}
    </div>
  );
}
