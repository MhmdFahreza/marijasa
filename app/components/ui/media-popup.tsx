// app/components/ui/media-popup.tsx
"use client";

import React from "react";
import { Camera, ImageIcon, X } from "lucide-react";

interface MediaPopupProps {
  isOpen: boolean;
  onClose: () => void;
  onTakePhoto: () => void;
  onSelectImage: () => void;
}

const MediaPopup: React.FC<MediaPopupProps> = ({ 
  isOpen, 
  onClose, 
  onTakePhoto, 
  onSelectImage 
}) => {
  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div 
        className="fixed inset-0 z-40 bg-transparent" 
        onClick={onClose}
      />
      
      {/* Popup positioned relative to paperclip icon */}
      <div className="absolute bottom-16 left-0 z-50 bg-white rounded-2xl shadow-2xl border border-gray-200 overflow-hidden min-w-[240px]">
        {/* Header with close button */}
        <div className="flex items-center justify-between px-4 py-2 border-b border-gray-100 bg-gray-50">
          <h3 className="text-sm font-semibold text-gray-700">Kirim Media</h3>
          <button
            onClick={onClose}
            className="p-1 rounded-full hover:bg-gray-200 transition-colors"
            aria-label="Close"
          >
            <X className="h-4 w-4 text-gray-500" />
          </button>
        </div>

        {/* Options */}
        <div className="p-2">
          {/* Take Photo Option */}
          <button
            onClick={() => {
              onTakePhoto();
              onClose();
            }}
            className="flex items-center gap-3 w-full px-3 py-3 hover:bg-purple-50 rounded-xl transition-colors group"
          >
            <div className="h-10 w-10 rounded-full bg-gradient-to-r from-purple-500 to-pink-500 flex items-center justify-center flex-shrink-0 group-hover:shadow-lg transition-shadow">
              <Camera className="h-5 w-5 text-white" />
            </div>
            <div className="text-left flex-1">
              <p className="font-medium text-gray-800 text-sm">Ambil Foto</p>
              <p className="text-xs text-gray-500">Gunakan kamera</p>
            </div>
          </button>

          {/* Select from Gallery Option */}
          <button
            onClick={() => {
              onSelectImage();
              onClose();
            }}
            className="flex items-center gap-3 w-full px-3 py-3 hover:bg-green-50 rounded-xl transition-colors group mt-1"
          >
            <div className="h-10 w-10 rounded-full bg-gradient-to-r from-green-500 to-blue-500 flex items-center justify-center flex-shrink-0 group-hover:shadow-lg transition-shadow">
              <ImageIcon className="h-5 w-5 text-white" />
            </div>
            <div className="text-left flex-1">
              <p className="font-medium text-gray-800 text-sm">Gambar & Video</p>
              <p className="text-xs text-gray-500">Pilih dari galeri</p>
            </div>
          </button>
        </div>

        {/* Footer tip */}
        <div className="px-4 py-2 bg-gray-50 border-t border-gray-100">
          <p className="text-xs text-gray-500 text-center">
            Ukuran maks: 10MB
          </p>
        </div>
      </div>
    </>
  );
};

export default MediaPopup;