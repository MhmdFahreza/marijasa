"use client";

import React, { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Smile, Search, X, Clock, TrendingUp } from "lucide-react";
import { Button } from "@/app/components/ui/button";

const EMOJI_CATEGORIES = [
  { name: "Populer", icon: "🔥" },
  { name: "Ekspresi", icon: "😀" },
  { name: "Gesture", icon: "👍" },
  { name: "Hewan", icon: "🐶" },
  { name: "Makanan", icon: "🍕" },
  { name: "Aktivitas", icon: "⚽" },
  { name: "Travel", icon: "✈️" },
  { name: "Objek", icon: "💡" },
  { name: "Simbol", icon: "❤️" },
];

// Emoji data dengan efek 3D/shadow
const EMOJI_DATA = {
  populer: ["😂", "❤️", "🔥", "🥰", "😍", "✨", "🙏", "👍", "🎉", "💯", "👑", "⭐"],
  ekspresi: ["😀", "😄", "😁", "😆", "😅", "🤣", "😂", "🙂", "🙃", "😉", "😊", "😇"],
  gesture: ["👍", "👎", "👌", "✌️", "🤞", "🤟", "🤘", "👆", "👇", "👈", "👉", "🙌"],
  hewan: ["🐶", "🐱", "🐭", "🐹", "🐰", "🦊", "🐻", "🐼", "🐨", "🐯", "🦁", "🐮"],
  makanan: ["🍎", "🍕", "🍔", "🍟", "🌭", "🍿", "🧁", "🍰", "🍫", "🍩", "🍦", "🍻"],
  aktivitas: ["⚽", "🏀", "🏈", "⚾", "🎾", "🏐", "🏓", "🎯", "🎮", "🎲", "🎸", "🎤"],
  travel: ["🚗", "✈️", "🚀", "🚁", "🚢", "⛵", "🏠", "🏖️", "🗽", "🗼", "🏔️", "🌋"],
  objek: ["💡", "📱", "💻", "⌚", "📷", "🎥", "📺", "🔑", "💰", "💎", "🎁", "🎈"],
  simbol: ["❤️", "✨", "🌟", "💫", "🔥", "💧", "☀️", "⭐", "🌈", "☁️", "❄️", "🌸"],
};

const RECENT_EMOJIS = ["😂", "❤️", "👍", "🔥", "🥰", "🎉", "👌", "💯"];

export default function EmojiPicker3D({
  onEmojiSelect,
  isOpen,
  onClose,
}: {
  onEmojiSelect: (emoji: string) => void;
  isOpen: boolean;
  onClose: () => void;
}) {
  const [activeCategory, setActiveCategory] = useState("populer");
  const [searchTerm, setSearchTerm] = useState("");

  // Filter emoji berdasarkan search
  const filteredEmojis = Object.values(EMOJI_DATA)
    .flat()
    .filter(emoji => 
      searchTerm === "" || 
      emoji.toLowerCase().includes(searchTerm.toLowerCase())
    );

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Overlay */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50"
            onClick={onClose}
          />
          
          {/* Emoji Picker Container */}
          <motion.div
            initial={{ scale: 0.95, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.95, opacity: 0, y: 20 }}
            className="fixed bottom-24 left-4 right-4 md:absolute md:bottom-16 md:left-0 md:right-auto md:w-96 bg-white rounded-2xl shadow-2xl border border-gray-200 z-50 overflow-hidden"
          >
            {/* Header */}
            <div className="p-4 border-b bg-gradient-to-r from-pink-50 to-purple-50">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <div className="p-2 bg-gradient-to-br from-pink-400 to-purple-500 rounded-xl">
                    <Smile className="h-5 w-5 text-white" />
                  </div>
                  <h3 className="font-bold text-gray-800">Sticker & Emoji</h3>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={onClose}
                  className="rounded-full hover:bg-white/50"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
              
              {/* Search */}
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Cari emoji..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 bg-white border border-gray-300 rounded-full text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
              </div>
            </div>

            {/* Recent Section */}
            {searchTerm === "" && (
              <div className="p-4 border-b">
                <div className="flex items-center gap-2 mb-3">
                  <Clock className="h-4 w-4 text-gray-500" />
                  <h4 className="text-sm font-semibold text-gray-700">Baru Dipakai</h4>
                </div>
                <div className="grid grid-cols-8 gap-2">
                  {RECENT_EMOJIS.map((emoji, idx) => (
                    <button
                      key={idx}
                      onClick={() => onEmojiSelect(emoji)}
                      className="text-2xl p-2 hover:bg-gray-100 rounded-xl transition-all duration-200 hover:scale-110 active:scale-95 transform hover:shadow-lg hover:-translate-y-1"
                      style={{
                        textShadow: '0 4px 8px rgba(0,0,0,0.1)',
                        filter: 'drop-shadow(0 4px 6px rgba(0,0,0,0.1))'
                      }}
                    >
                      {emoji}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Categories */}
            {searchTerm === "" && (
              <div className="px-4 py-3 border-b bg-gray-50 overflow-x-auto">
                <div className="flex gap-1">
                  {EMOJI_CATEGORIES.map((category) => (
                    <button
                      key={category.name}
                      onClick={() => setActiveCategory(category.name.toLowerCase())}
                      className={`flex items-center gap-2 px-3 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-all ${
                        activeCategory === category.name.toLowerCase()
                          ? 'bg-gradient-to-r from-purple-500 to-pink-500 text-white shadow-lg'
                          : 'bg-white text-gray-700 hover:bg-gray-100'
                      }`}
                    >
                      <span className="text-base">{category.icon}</span>
                      {category.name}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Emoji Grid */}
            <div className="p-4 h-64 overflow-y-auto">
              {searchTerm === "" ? (
                <>
                  <div className="flex items-center gap-2 mb-3">
                    <TrendingUp className="h-4 w-4 text-purple-500" />
                    <h4 className="text-sm font-semibold text-gray-700">
                      {EMOJI_CATEGORIES.find(c => c.name.toLowerCase() === activeCategory)?.name}
                    </h4>
                  </div>
                  <div className="grid grid-cols-8 gap-3">
                    {EMOJI_DATA[activeCategory as keyof typeof EMOJI_DATA]?.map((emoji, idx) => (
                      <motion.button
                        key={idx}
                        whileHover={{ scale: 1.2, rotate: [0, -5, 5, 0] }}
                        whileTap={{ scale: 0.9 }}
                        onClick={() => onEmojiSelect(emoji)}
                        className="text-2xl p-2 hover:bg-gradient-to-br from-blue-50 to-purple-50 rounded-xl transition-all duration-300"
                        style={{
                          textShadow: '0 4px 12px rgba(0,0,0,0.15)',
                          filter: 'drop-shadow(0 6px 8px rgba(0,0,0,0.12))',
                          transformStyle: 'preserve-3d',
                          transform: 'perspective(500px)'
                        }}
                      >
                        {emoji}
                      </motion.button>
                    ))}
                  </div>
                </>
              ) : (
                <>
                  <h4 className="text-sm font-semibold text-gray-700 mb-3">
                    Hasil Pencarian
                  </h4>
                  {filteredEmojis.length > 0 ? (
                    <div className="grid grid-cols-8 gap-3">
                      {filteredEmojis.slice(0, 48).map((emoji, idx) => (
                        <button
                          key={idx}
                          onClick={() => onEmojiSelect(emoji)}
                          className="text-2xl p-2 hover:bg-gray-100 rounded-xl transition-all duration-200 hover:scale-110"
                          style={{
                            textShadow: '0 4px 8px rgba(0,0,0,0.1)'
                          }}
                        >
                          {emoji}
                        </button>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8 text-gray-500">
                      Tidak ditemukan emoji
                    </div>
                  )}
                </>
              )}
            </div>

            {/* Footer */}
            <div className="p-3 border-t bg-gray-50 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="h-8 w-8 rounded-full bg-gradient-to-r from-yellow-400 to-orange-500 flex items-center justify-center">
                  <span className="text-sm">✨</span>
                </div>
                <div>
                  <p className="text-xs font-semibold">Sticker Premium</p>
                  <p className="text-xs text-gray-500">Unlock 1000+ stickers</p>
                </div>
              </div>
              <Button
                size="sm"
                className="rounded-full bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white"
              >
                Upgrade
              </Button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}