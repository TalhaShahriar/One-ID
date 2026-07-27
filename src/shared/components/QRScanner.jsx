import React, { useEffect, useRef, useState } from 'react';
import { Html5Qrcode } from 'html5-qrcode';
import { Camera, X, Loader2, RefreshCcw } from 'lucide-react';
import { toast } from 'sonner';

export default function QRScanner({ onScan, onClose }) {
  const [hasCamera, setHasCamera] = useState(true);
  const [isScanning, setIsScanning] = useState(true);
  const scannerRef = useRef(null);
  const html5QrCode = useRef(null);
  const scannerContainerId = "qr-reader-admin";

  useEffect(() => {
    let isMounted = true;

    const startScanner = async () => {
      try {
        const cameras = await Html5Qrcode.getCameras();
        if (cameras && cameras.length > 0 && isMounted) {
          html5QrCode.current = new Html5Qrcode(scannerContainerId);
          
          await html5QrCode.current.start(
            { facingMode: "environment" },
            {
              fps: 10,
              qrbox: { width: 250, height: 250 },
              aspectRatio: 1.0
            },
            (decodedText, decodedResult) => {
              if (isMounted) {
                // Pause scanning briefly after success
                if (html5QrCode.current && html5QrCode.current.isScanning) {
                  html5QrCode.current.pause();
                }
                setIsScanning(false);
                onScan(decodedText);
              }
            },
            (errorMessage) => {
              // Usually ignored, happens when no QR found in frame
            }
          );
        } else {
          if (isMounted) setHasCamera(false);
          toast.error("No camera found on this device.");
        }
      } catch (err) {
        console.error("Camera access error:", err);
        if (isMounted) {
          setHasCamera(false);
          toast.error("Camera access denied or failed to initialize.");
        }
      }
    };

    startScanner();

    return () => {
      isMounted = false;
      if (html5QrCode.current) {
        if (html5QrCode.current.isScanning) {
          html5QrCode.current.stop().then(() => {
            html5QrCode.current.clear();
          }).catch(err => console.error("Error stopping scanner:", err));
        } else {
          html5QrCode.current.clear();
        }
      }
    };
  }, [onScan]);

  const handleResume = () => {
    if (html5QrCode.current) {
      html5QrCode.current.resume();
      setIsScanning(true);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
      <div className="bg-white rounded-2xl w-full max-w-md overflow-hidden shadow-2xl relative flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <div className="bg-[#006a4e]/10 p-2 rounded-lg">
              <Camera className="h-5 w-5 text-[#006a4e]" />
            </div>
            <h3 className="font-bold text-slate-800 font-sans">Scan Citizen NID</h3>
          </div>
          <button 
            onClick={onClose}
            className="p-2 hover:bg-slate-100 rounded-lg transition-colors text-slate-500"
            aria-label="Close Scanner"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Scanner Area */}
        <div className="relative bg-black min-h-[300px] flex items-center justify-center overflow-hidden">
          {!hasCamera ? (
            <div className="text-white text-center p-6 flex flex-col items-center">
              <Camera className="h-12 w-12 text-slate-500 mb-3 opacity-50" />
              <p className="font-medium">Camera not available</p>
              <p className="text-xs text-slate-400 mt-1">Please ensure camera permissions are granted.</p>
            </div>
          ) : (
            <>
              <div 
                id={scannerContainerId} 
                className="w-full h-full object-cover" 
                ref={scannerRef}
              ></div>
              {!isScanning && (
                <div className="absolute inset-0 bg-black/60 flex flex-col items-center justify-center text-white z-10">
                  <div className="bg-white/10 p-4 rounded-full backdrop-blur-md mb-3">
                    <Loader2 className="h-8 w-8 animate-spin" />
                  </div>
                  <p className="font-bold mb-4">Processing Code...</p>
                  <button 
                    onClick={handleResume}
                    className="flex items-center gap-2 bg-[#006a4e] px-4 py-2 rounded-lg font-medium hover:bg-[#00523c] transition-colors"
                  >
                    <RefreshCcw className="h-4 w-4" /> Scan Again
                  </button>
                </div>
              )}
            </>
          )}
          
          {/* Overlay scanning guides */}
          {hasCamera && isScanning && (
            <div className="absolute inset-0 pointer-events-none z-10 hidden border-[40px] border-black/40 md:block">
              {/* Box corners are handled by Html5Qrcode qrbox setting usually, but can style here if needed */}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 bg-slate-50 text-center">
          <p className="text-xs text-slate-500 font-medium">
            Align the QR code on the physical NID card within the frame to verify identity securely.
          </p>
        </div>
      </div>
    </div>
  );
}
