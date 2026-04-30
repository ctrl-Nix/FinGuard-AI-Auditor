import React, { useRef, useState, useEffect } from "react";
import { Camera, X, RefreshCw, Zap } from "lucide-react";

/**
 * CameraModal — Phase 2: Snap-to-Audit
 * Premium camera interface for scanning physical documents/screens.
 */
export default function CameraModal({ isOpen, onClose, onCapture }) {
  const videoRef = useRef(null);
  const [stream, setStream] = useState(null);
  const [error, setError] = useState(null);
  const [isCapturing, setIsCapturing] = useState(false);

  useEffect(() => {
    if (isOpen) {
      startCamera();
    } else {
      stopCamera();
    }
    return () => stopCamera();
  }, [isOpen]);

  const startCamera = async () => {
    setError(null);
    try {
      const s = await navigator.mediaDevices.getUserMedia({ 
        video: { facingMode: "environment" }, // Prefer back camera
        audio: false 
      });
      setStream(s);
      if (videoRef.current) {
        videoRef.current.srcObject = s;
      }
    } catch (err) {
      setError("Camera access denied or not available.");
      console.error(err);
    }
  };

  const stopCamera = () => {
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
      setStream(null);
    }
  };

  const handleCapture = () => {
    if (!videoRef.current) return;
    setIsCapturing(true);

    const canvas = document.createElement("canvas");
    canvas.width = videoRef.current.videoWidth;
    canvas.height = videoRef.current.videoHeight;
    const ctx = canvas.getContext("2d");
    ctx.drawImage(videoRef.current, 0, 0);

    canvas.toBlob((blob) => {
      onCapture(blob);
      setIsCapturing(false);
      onClose();
    }, "image/jpeg", 0.9);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
      <div className="relative w-full max-w-[500px] bg-surface-card border border-surface-border rounded-[24px] overflow-hidden shadow-2xl">
        {/* Header */}
        <div className="p-4 border-b border-surface-border flex items-center justify-between bg-surface">
          <div className="flex items-center gap-2">
            <Camera size={18} className="text-risk-blue" />
            <span className="text-[14px] font-bold text-ink-primary uppercase tracking-tight">
              Document Scanner
            </span>
          </div>
          <button 
            onClick={onClose}
            className="p-2 hover:bg-surface-hover rounded-full text-ink-muted transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* Viewport */}
        <div className="relative aspect-[3/4] bg-black overflow-hidden">
          {error ? (
            <div className="absolute inset-0 flex flex-col items-center justify-center p-8 text-center">
              <Camera size={48} className="text-ink-faint mb-4" />
              <p className="text-ink-secondary text-[14px] mb-4">{error}</p>
              <button 
                onClick={startCamera}
                className="bg-risk-blue text-white px-4 py-2 rounded-lg text-[13px] font-medium"
              >
                Try Again
              </button>
            </div>
          ) : (
            <>
              <video 
                ref={videoRef}
                autoPlay 
                playsInline 
                muted
                className="w-full h-full object-cover"
              />
              {/* Corner markers for "scanning" feel */}
              <div className="absolute inset-8 border-2 border-risk-blue/30 rounded-xl pointer-events-none">
                <div className="absolute -top-1 -left-1 w-6 h-6 border-t-4 border-l-4 border-risk-blue rounded-tl-lg" />
                <div className="absolute -top-1 -right-1 w-6 h-6 border-t-4 border-r-4 border-risk-blue rounded-tr-lg" />
                <div className="absolute -bottom-1 -left-1 w-6 h-6 border-b-4 border-l-4 border-risk-blue rounded-bl-lg" />
                <div className="absolute -bottom-1 -right-1 w-6 h-6 border-b-4 border-r-4 border-risk-blue rounded-br-lg" />
              </div>
              
              {/* Scanning line animation */}
              <div className="absolute inset-0 pointer-events-none overflow-hidden">
                <div className="w-full h-[2px] bg-risk-blue/50 shadow-[0_0_15px_rgba(59,130,246,0.8)] animate-scan-move" />
              </div>
            </>
          )}

          {isCapturing && (
            <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
              <RefreshCw size={32} className="text-white animate-spin" />
            </div>
          )}
        </div>

        {/* Controls */}
        <div className="p-6 flex items-center justify-center gap-6 bg-surface">
          <button 
            disabled={!stream || isCapturing}
            onClick={handleCapture}
            className="w-16 h-16 rounded-full border-4 border-white/20 p-1 active:scale-95 transition-transform disabled:opacity-30"
          >
            <div className="w-full h-full bg-white rounded-full flex items-center justify-center shadow-lg">
              <div className="w-6 h-6 border-2 border-risk-blue rounded-full" />
            </div>
          </button>
        </div>

        {/* Info */}
        <div className="p-4 bg-risk-blue/5 border-t border-risk-blue/10 flex items-start gap-3">
          <Zap size={14} className="text-risk-blue mt-0.5" />
          <p className="text-[11px] text-ink-secondary leading-relaxed">
            Position the document inside the frame. <strong>FinGuard AI</strong> will automatically extract text and check for risks.
          </p>
        </div>
      </div>
      
      <style>{`
        @keyframes scan-move {
          0% { transform: translateY(0); }
          50% { transform: translateY(400px); }
          100% { transform: translateY(0); }
        }
        .animate-scan-move {
          animation: scan-move 3s ease-in-out infinite;
        }
      `}</style>
    </div>
  );
}
