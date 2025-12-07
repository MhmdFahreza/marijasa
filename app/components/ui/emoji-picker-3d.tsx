"use client";

import React from "react";

interface EmojiPicker3DProps {
  isOpen: boolean;
  onEmojiSelect: (emoji: string) => void;
  onClose: () => void;
}

const EmojiPicker3D = ({ isOpen, onEmojiSelect, onClose }: EmojiPicker3DProps) => {
  if (!isOpen) return null;

  const emojiCategories = [
    {
      name: "Wajah",
      emojis: ["😀", "😂", "😍", "🥰", "😎", "🤔", "😴", "🥺", "😭", "😡", "🤯", "😱"]
    },
    {
      name: "Gestur",
      emojis: ["👍", "👌", "✌️", "🤞", "🤘", "👏", "🙏", "💪", "🤝", "👋", "🫰", "🫶"]
    },
    {
      name: "Simbol",
      emojis: ["❤️", "🔥", "✨", "🌟", "💯", "✅", "❌", "⭐", "💡", "🎯", "💎", "🪄"]
    },
    {
      name: "Objek",
      emojis: ["📱", "💻", "🔧", "🔨", "🚗", "🏠", "💰", "📅", "📝", "📎", "📌", "📍"]
    }
  ];

  const handleClickOutside = (e: React.MouseEvent) => {
    if ((e.target as HTMLElement).classList.contains("emoji-picker-overlay")) {
      onClose();
    }
  };

  return (
    <>
      {/* Overlay */}
      <div
        className="emoji-picker-overlay fixed inset-0 z-40 bg-black/20"
        onClick={handleClickOutside}
      />
      
      {/* Picker */}
      <div className="absolute bottom-20 left-4 bg-white rounded-2xl shadow-2xl border border-gray-200 p-4 z-50 min-w-[320px] max-w-xs">
        <div className="flex justify-between items-center mb-3 pb-2 border-b">
          <h3 className="font-semibold text-gray-700">Pilih Emoji</h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 p-1 rounded-full hover:bg-gray-100"
          >
            ✕
          </button>
        </div>

        <div className="max-h-60 overflow-y-auto">
          {emojiCategories.map((category, categoryIndex) => (
            <div key={categoryIndex} className="mb-4">
              <h4 className="text-xs font-medium text-gray-500 mb-2 px-1">{category.name}</h4>
              <div className="grid grid-cols-6 gap-2 mb-3">
                {category.emojis.map((emoji, emojiIndex) => (
                  <button
                    key={emojiIndex}
                    onClick={() => onEmojiSelect(emoji)}
                    className="text-2xl hover:bg-gray-100 rounded-lg p-2 transition-colors duration-150 active:scale-95 transform"
                    title={`Emoji ${emoji}`}
                  >
                    {emoji}
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>

        <div className="pt-3 border-t">
          <div className="flex items-center justify-between text-xs text-gray-500">
            <span>Klik emoji untuk menambahkan</span>
            <span className="text-blue-500">😊</span>
          </div>
        </div>
      </div>
    </>
  );
};

export default EmojiPicker3D;