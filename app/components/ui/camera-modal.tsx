// app/components/ui/camera-modal.tsx
"use client";

import React, { useRef, useState, useEffect } from "react";
import { X, Camera, FlipHorizontal, RotateCw, AlertCircle } from "lucide-react";

interface CameraModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCapture: (photoBlob: Blob) => void;
}

const CameraModal: React.FC<CameraModalProps> = ({ isOpen, onClose, onCapture }) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [facingMode, setFacingMode] = useState<'user' | 'environment'>('environment');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [flash, setFlash] = useState(false);

  useEffect(() => {
    if (isOpen) {
      startCamera();
    } else {
      stopCamera();
    }

    return () => {
      stopCamera();
    };
  }, [isOpen, facingMode]);

  const startCamera = async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      // Hentikan stream yang ada
      if (stream) {
        stopCamera();
      }

      // Konfigurasi kamera berdasarkan perangkat
      const constraints: MediaStreamConstraints = {
        video: {
          facingMode: facingMode,
          width: { ideal: 1920 },
          height: { ideal: 1080 },
          frameRate: { ideal: 30 }
        },
        audio: false
      };

      const mediaStream = await navigator.mediaDevices.getUserMedia(constraints);
      setStream(mediaStream);

      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
        videoRef.current.play();
      }

      setIsLoading(false);
    } catch (err: any) {
      console.error('Error accessing camera:', err);
      setError(err.name === 'NotAllowedError' 
        ? 'Akses kamera ditolak. Mohon izinkan akses kamera di pengaturan browser.'
        : err.name === 'NotFoundError'
        ? 'Tidak ada kamera yang ditemukan pada perangkat ini.'
        : 'Tidak dapat mengakses kamera. Pastikan kamera terhubung dan diizinkan.'
      );
      setIsLoading(false);
    }
  };

  const stopCamera = () => {
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
      setStream(null);
    }
  };

  const takePhoto = () => {
    if (videoRef.current && canvasRef.current) {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      const context = canvas.getContext('2d');

      if (!context) return;

      // Set canvas size sesuai dengan video
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;

      // Simulasikan flash
      setFlash(true);
      setTimeout(() => setFlash(false), 200);

      // Gambar frame video ke canvas
      context.drawImage(video, 0, 0, canvas.width, canvas.height);

      // Konversi canvas ke blob
      canvas.toBlob((blob) => {
        if (blob) {
          onCapture(blob);
          onClose();
        }
      }, 'image/jpeg', 0.95);
    }
  };

  const switchCamera = () => {
    setFacingMode(prev => prev === 'user' ? 'environment' : 'user');
  };

  const handleClose = () => {
    stopCamera();
    onClose();
  };

  if (!isOpen) return null;

  return (
    <>
      <div className="fixed inset-0 z-50 bg-black" onClick={handleClose} />
      <div className="fixed inset-0 z-50 flex flex-col items-center justify-center p-4">
        <div className="relative w-full max-w-4xl h-full max-h-[90vh] flex flex-col">
          {/* Header */}
          <div className="flex items-center justify-between p-4 bg-black/50 backdrop-blur-sm rounded-t-2xl">
            <button
              onClick={handleClose}
              className="p-2 rounded-full bg-black/50 hover:bg-black/70 transition-colors"
            >
              <X className="h-6 w-6 text-white" />
            </button>
            <h2 className="text-lg font-semibold text-white">Kamera</h2>
            <div className="w-10"></div> {/* Spacer untuk alignment */}
          </div>

          {/* Camera Preview */}
          <div className="relative flex-1 bg-black rounded-lg overflow-hidden">
            {isLoading ? (
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="text-center">
                  <div className="w-16 h-16 border-4 border-white/30 border-t-white rounded-full animate-spin mx-auto mb-4" />
                  <p className="text-white">Mengakses kamera...</p>
                </div>
              </div>
            ) : error ? (
              <div className="absolute inset-0 flex items-center justify-center p-8">
                <div className="text-center max-w-md">
                  <AlertCircle className="h-16 w-16 text-red-400 mx-auto mb-4" />
                  <h3 className="text-xl font-semibold text-white mb-2">Gagal Mengakses Kamera</h3>
                  <p className="text-gray-300 mb-6">{error}</p>
                  <button
                    onClick={startCamera}
                    className="px-6 py-3 bg-blue-500 hover:bg-blue-600 text-white rounded-full font-medium transition-colors"
                  >
                    Coba Lagi
                  </button>
                </div>
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
                <canvas ref={canvasRef} className="hidden" />
                
                {/* Flash effect */}
                {flash && (
                  <div className="absolute inset-0 bg-white animate-ping opacity-70" />
                )}
              </>
            )}
          </div>

          {/* Camera Controls */}
          <div className="p-6 bg-black/50 backdrop-blur-sm rounded-b-2xl">
            {!isLoading && !error && (
              <div className="flex items-center justify-center gap-8">
                {/* Switch Camera Button */}
                <button
                  onClick={switchCamera}
                  className="p-4 rounded-full bg-black/50 hover:bg-black/70 transition-colors"
                  title="Ganti Kamera"
                >
                  <FlipHorizontal className="h-6 w-6 text-white" />
                </button>

                {/* Capture Button */}
                <button
                  onClick={takePhoto}
                  className="p-6 rounded-full bg-white hover:bg-gray-100 transition-colors shadow-2xl"
                  disabled={isLoading || !!error}
                >
                  <div className="h-20 w-20 rounded-full border-4 border-gray-200 flex items-center justify-center">
                    <div className="h-16 w-16 rounded-full bg-white" />
                  </div>
                </button>

                {/* Retake/Refresh Button */}
                <button
                  onClick={startCamera}
                  className="p-4 rounded-full bg-black/50 hover:bg-black/70 transition-colors"
                  title="Refresh Kamera"
                >
                  <RotateCw className="h-6 w-6 text-white" />
                </button>
              </div>
            )}

            {/* Camera Info */}
            <div className="mt-4 text-center">
              <p className="text-sm text-gray-300">
                {facingMode === 'user' ? 'Kamera Depan' : 'Kamera Belakang'}
              </p>
              <p className="text-xs text-gray-400 mt-1">
                Sentuh layar untuk fokus • Tekan untuk mengambil foto
              </p>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default CameraModal;