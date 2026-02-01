"use client";

import React, { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  MessageCircle, X, Send, User, Bot, Clock, Sparkles, 
  Star, MapPin, Phone, ChevronRight, Image as ImageIcon,
  Loader2, XCircle
} from "lucide-react";
import { useRouter } from "next/navigation";

export type ChatMessage = {
  id: number;
  text: string;
  sender: "user" | "bot";
  timestamp: string;
  data?: any;
  image?: {
    base64: string;
    type: string;
    preview: string;
  };
};

type VendorCard = {
  vendor_id: string;
  name: string;
  category: string;
  rating: number;
  review_count: number;
  service_areas: string[];
  specialties: string[];
  phone: string;
  avatar: string;
  description?: string;
};

const MAX_IMAGE_SIZE = 5 * 1024 * 1024; // 5MB
const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];

const Chatbot = () => {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 1,
      text: "Halo! Saya Chatbot MARIJASA 👋\n\nSaya di sini untuk membantu Anda mengajukan pertanyaan mengenai masalah yang terjadi pada rumah tangga.\n\n📸 Anda juga bisa mengirim gambar untuk saya analisis!\n\nAda yang bisa saya bantu hari ini?",
      sender: "bot",
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    },
  ]);
  const [inputText, setInputText] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [currentTooltipText, setCurrentTooltipText] = useState(0);
  const [selectedImage, setSelectedImage] = useState<{
    base64: string;
    type: string;
    preview: string;
    file: File;
  } | null>(null);
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const tooltipTexts = [
    "Marijasa AI",
    "Tanyakan Kendalamu Disini",
    "📸 Kirim Gambar Juga Bisa!"
  ];

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    if (!isOpen) {
      const interval = setInterval(() => {
        setCurrentTooltipText((prev) => (prev + 1) % tooltipTexts.length);
      }, 3000);
      return () => clearInterval(interval);
    }
  }, [isOpen]);

  const handleVendorClick = (vendorId: string) => {
    router.push(`/jasa/detailjasa/${vendorId}`);
    setIsOpen(false);
  };

  const cleanText = (text: string): string => {
    return text
      .replace(/\*\*/g, '')
      .replace(/^- /gm, '')
      .replace(/^## /gm, '')
      .replace(/^### /gm, '')
      .replace(/^#### /gm, '')
      .trim();
  };

  // Handle image selection
  const handleImageSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!ALLOWED_IMAGE_TYPES.includes(file.type)) {
      alert('Format gambar tidak didukung. Gunakan JPG, PNG, GIF, atau WebP.');
      return;
    }

    // Validate file size
    if (file.size > MAX_IMAGE_SIZE) {
      alert('Ukuran gambar terlalu besar. Maksimal 5MB.');
      return;
    }

    setIsUploadingImage(true);

    try {
      // Convert to base64
      const base64 = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => {
          const result = reader.result as string;
          // Remove data URL prefix to get pure base64
          const base64Data = result.split(',')[1];
          resolve(base64Data);
        };
        reader.onerror = reject;
        reader.readAsDataURL(file);
      });

      // Create preview URL
      const preview = URL.createObjectURL(file);

      setSelectedImage({
        base64,
        type: file.type,
        preview,
        file
      });
    } catch (error) {
      console.error('Error processing image:', error);
      alert('Gagal memproses gambar. Silakan coba lagi.');
    } finally {
      setIsUploadingImage(false);
    }

    // Reset input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  // Remove selected image
  const removeSelectedImage = () => {
    if (selectedImage?.preview) {
      URL.revokeObjectURL(selectedImage.preview);
    }
    setSelectedImage(null);
  };

  // Trigger file input click
  const handleImageButtonClick = () => {
    fileInputRef.current?.click();
  };

  const handleSendMessage = async () => {
    if (!inputText.trim() && !selectedImage) return;

    const newUserMessage: ChatMessage = {
      id: messages.length + 1,
      text: inputText || (selectedImage ? "Tolong analisis gambar ini" : ""),
      sender: "user",
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      image: selectedImage ? {
        base64: selectedImage.base64,
        type: selectedImage.type,
        preview: selectedImage.preview
      } : undefined,
    };

    const updatedMessages = [...messages, newUserMessage];
    setMessages(updatedMessages);
    
    // Prepare image data for API
    const imageData = selectedImage ? {
      base64: selectedImage.base64,
      type: selectedImage.type
    } : null;

    // Clear input and image
    setInputText("");
    removeSelectedImage();
    setIsTyping(true);

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          messages: updatedMessages.map(msg => ({
            text: msg.text,
            sender: msg.sender,
          })),
          image: imageData,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to get response from API');
      }

      const data = await response.json();
      let messageText = data.message;
      let messageData = null;

      if (data.data && data.data.type === "vendor_recommendation") {
        messageText = cleanText(data.data.message);
        messageData = data.data;
      } else {
        messageText = cleanText(messageText);
      }

      const newBotMessage: ChatMessage = {
        id: updatedMessages.length + 1,
        text: messageText,
        sender: "bot",
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        data: messageData,
      };

      setMessages(prev => [...prev, newBotMessage]);
    } catch (error) {
      console.error('Error:', error);
      
      const errorMessage: ChatMessage = {
        id: updatedMessages.length + 1,
        text: "Maaf, saya mengalami kesulitan saat ini. Silakan coba lagi atau hubungi support@marijasa.com untuk bantuan lebih lanjut.",
        sender: "bot",
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };

      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsTyping(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const formatTime = (timeString: string) => {
    const [hours, minutes] = timeString.split(':');
    return `${hours}:${minutes}`;
  };

  const VendorCardComponent = ({ vendor }: { vendor: VendorCard }) => (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white dark:bg-neutral-800 rounded-xl border border-emerald-100 dark:border-emerald-900/50 overflow-hidden shadow-sm hover:shadow-md transition-shadow"
    >
      <div className="p-3 sm:p-4">
        <div className="flex gap-3">
          <img
            src={vendor.avatar || "/profile.svg"}
            alt={vendor.name}
            className="w-16 h-16 sm:w-20 sm:h-20 rounded-lg object-cover ring-2 ring-emerald-100 dark:ring-emerald-900/50"
          />
          <div className="flex-1 min-w-0">
            <h4 className="font-semibold text-neutral-900 dark:text-white text-sm sm:text-base truncate">
              {vendor.name}
            </h4>
            <p className="text-xs text-emerald-600 dark:text-emerald-400 mt-0.5">
              {vendor.category}
            </p>
            <div className="flex items-center gap-2 mt-1">
              <div className="flex items-center gap-1">
                <Star className="w-3 h-3 fill-yellow-400 text-yellow-400" />
                <span className="text-xs font-medium text-neutral-700 dark:text-neutral-300">
                  {vendor.rating}
                </span>
              </div>
              <span className="text-xs text-neutral-500 dark:text-neutral-400">
                ({vendor.review_count} ulasan)
              </span>
            </div>
          </div>
        </div>

        <div className="mt-3 space-y-2">
          <div className="flex items-start gap-2">
            <MapPin className="w-3 h-3 text-emerald-600 dark:text-emerald-400 mt-0.5 flex-shrink-0" />
            <p className="text-xs text-neutral-600 dark:text-neutral-400 line-clamp-2">
              {vendor.service_areas.slice(0, 3).join(", ")}
              {vendor.service_areas.length > 3 && ` +${vendor.service_areas.length - 3} lainnya`}
            </p>
          </div>

          {vendor.specialties && vendor.specialties.length > 0 && (
            <div className="flex flex-wrap gap-1">
              {vendor.specialties.slice(0, 3).map((spec, idx) => (
                <span
                  key={idx}
                  className="text-xs px-2 py-0.5 bg-emerald-50 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 rounded-full"
                >
                  {spec}
                </span>
              ))}
            </div>
          )}
        </div>

        <motion.button
          onClick={() => handleVendorClick(vendor.vendor_id)}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          className="mt-3 w-full flex items-center justify-center gap-2 px-4 py-2 bg-gradient-to-r from-emerald-500 to-emerald-600 text-white rounded-lg text-sm font-medium hover:from-emerald-600 hover:to-emerald-700 transition-all shadow-sm"
        >
          Lihat Detail
          <ChevronRight className="w-4 h-4" />
        </motion.button>
      </div>
    </motion.div>
  );

  // Image preview component for messages
  const MessageImage = ({ image }: { image: ChatMessage['image'] }) => {
    if (!image) return null;
    
    return (
      <div className="mt-2 rounded-lg overflow-hidden max-w-[200px]">
        <img 
          src={image.preview} 
          alt="Uploaded" 
          className="w-full h-auto object-cover rounded-lg"
        />
      </div>
    );
  };

  return (
    <>
      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/jpeg,image/png,image/gif,image/webp"
        onChange={handleImageSelect}
        className="hidden"
      />

      <div className="fixed bottom-4 right-4 sm:bottom-6 sm:right-6 z-40 flex flex-col items-end">
        <AnimatePresence>
          {!isOpen && (
            <motion.div
              key="tooltip"
              initial={{ opacity: 0, y: 10, scale: 0.9 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 10, scale: 0.9 }}
              transition={{ duration: 0.3, type: "spring", stiffness: 300 }}
              className="mb-2 px-3 py-2 bg-gradient-to-r from-emerald-500/90 to-[#7CE0A8]/90 backdrop-blur-sm rounded-lg shadow-lg border border-white/20"
            >
              <div className="flex items-center gap-2">
                <Sparkles className="w-3 h-3 text-white/90" />
                <motion.span
                  key={currentTooltipText}
                  initial={{ opacity: 0, y: 5 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -5 }}
                  transition={{ duration: 0.3 }}
                  className="text-xs font-medium text-white whitespace-nowrap"
                >
                  {tooltipTexts[currentTooltipText]}
                </motion.span>
              </div>
              <div className="absolute -bottom-1 right-6 w-2 h-2 bg-emerald-500/90 transform rotate-45" />
            </motion.div>
          )}
        </AnimatePresence>

        <motion.button
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
          onClick={() => setIsOpen(!isOpen)}
          className="relative w-14 h-14 sm:w-16 sm:h-16 md:w-18 md:h-18 rounded-full shadow-2xl group"
        >
          <motion.div
            className="absolute inset-0 rounded-full bg-gradient-to-br from-[#7CE0A8] to-emerald-500"
            animate={{
              scale: [1, 1.2, 1],
              opacity: [0.5, 0.2, 0.5],
            }}
            transition={{
              duration: 2,
              repeat: Infinity,
              ease: "easeInOut",
            }}
          />
          
          <motion.div
            className="absolute inset-0 rounded-full bg-gradient-to-br from-emerald-400 to-[#7CE0A8]"
            animate={{
              scale: [1, 1.3, 1],
              opacity: [0.3, 0.1, 0.3],
            }}
            transition={{
              duration: 2.5,
              repeat: Infinity,
              ease: "easeInOut",
              delay: 0.5,
            }}
          />

          <div className="absolute inset-2 rounded-full bg-gradient-to-br from-[#7CE0A8] to-emerald-500 shadow-inner flex items-center justify-center group-hover:from-emerald-500 group-hover:to-[#7CE0A8] transition-all duration-300">
            {isOpen ? (
              <X className="w-6 h-6 sm:w-7 sm:h-7 md:w-8 md:h-8 text-white transform group-hover:rotate-90 transition-transform duration-300" />
            ) : (
              <MessageCircle className="w-6 h-6 sm:w-7 sm:h-7 md:w-8 md:h-8 text-white transform group-hover:rotate-12 transition-transform duration-300" />
            )}
          </div>

          <div className="absolute inset-0 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-300">
            <div className="absolute inset-0 rounded-full bg-gradient-to-r from-transparent via-white/20 to-transparent animate-shine" />
          </div>
        </motion.button>
      </div>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            transition={{ duration: 0.2, type: "spring", stiffness: 300, damping: 25 }}
            className="fixed bottom-24 right-4 sm:bottom-28 sm:right-6 z-50 w-[calc(100vw-2rem)] max-w-sm sm:max-w-md md:max-w-lg bg-white dark:bg-neutral-900 rounded-xl sm:rounded-2xl shadow-2xl border border-neutral-200 dark:border-neutral-800 overflow-hidden backdrop-blur-sm"
          >
            {/* Header */}
            <div className="relative bg-gradient-to-r from-[#7CE0A8] via-emerald-500 to-emerald-600 p-3 sm:p-4 flex items-center justify-between overflow-hidden">
              <div className="absolute inset-0 opacity-20">
                <div className="absolute -top-10 -right-10 w-40 h-40 rounded-full bg-white/30 blur-xl" />
                <div className="absolute -bottom-10 -left-10 w-40 h-40 rounded-full bg-emerald-300/30 blur-xl" />
              </div>
              
              <div className="relative z-10 flex items-center gap-2 sm:gap-3">
                <div className="relative w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center ring-2 ring-white/30">
                  <MessageCircle className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
                  <div className="absolute -top-1 -right-1 w-3 h-3 bg-emerald-300 rounded-full animate-ping opacity-75" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-white font-bold text-sm sm:text-base bg-white/10 px-2 py-0.5 rounded-lg backdrop-blur-sm">
                      Marijasa AI
                    </h3>
                    <div className="flex items-center gap-1 px-2 py-0.5 bg-emerald-700/30 rounded-full">
                      <div className="w-1.5 h-1.5 sm:w-2 sm:h-2 bg-emerald-300 rounded-full animate-pulse" />
                      <span className="text-xs text-emerald-100">Online</span>
                    </div>
                  </div>
                  <p className="text-white/80 text-xs flex items-center gap-1 mt-1">
                    <Clock className="w-3 h-3" />
                    <span className="animate-pulse">Powered by Groq AI • Vision Enabled</span>
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsOpen(false)}
                className="relative z-10 p-1 sm:p-1.5 rounded-full hover:bg-white/20 transition-colors group"
              >
                <X className="w-4 h-4 sm:w-5 sm:h-5 text-white group-hover:rotate-90 transition-transform duration-300" />
              </button>
            </div>

            {/* Messages */}
            <div className="h-[300px] sm:h-[350px] md:h-[400px] overflow-y-auto p-3 sm:p-4 bg-gradient-to-b from-neutral-50 to-white dark:from-neutral-950 dark:to-neutral-900">
              {messages.map((message) => (
                <motion.div
                  key={message.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={`flex gap-2 sm:gap-3 mb-3 sm:mb-4 ${message.sender === "user" ? "justify-end" : "justify-start"}`}
                >
                  {message.sender === "bot" && (
                    <div className="relative flex-shrink-0">
                      <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-gradient-to-r from-emerald-100 to-emerald-50 dark:from-emerald-900/40 dark:to-emerald-800/40 flex items-center justify-center ring-2 ring-emerald-200/50 dark:ring-emerald-800/50">
                        <Bot className="w-3 h-3 sm:w-4 sm:h-4 text-emerald-600 dark:text-emerald-400" />
                      </div>
                      <div className="absolute -top-0.5 -right-0.5 w-2 h-2 bg-emerald-400 rounded-full animate-pulse" />
                    </div>
                  )}
                  
                  <div className={`max-w-[80%] sm:max-w-[75%] ${message.sender === "user" ? "order-first" : ""}`}>
                    <motion.div
                      initial={{ scale: 0.95 }}
                      animate={{ scale: 1 }}
                      className={`rounded-xl sm:rounded-2xl px-3 py-2 sm:px-4 sm:py-3 relative overflow-hidden ${
                        message.sender === "user"
                          ? "bg-gradient-to-r from-[#7CE0A8] to-emerald-500 text-white rounded-br-none shadow-lg shadow-emerald-500/20"
                          : "bg-white dark:bg-neutral-800 border border-emerald-100 dark:border-emerald-900/50 rounded-bl-none shadow-sm"
                      }`}
                    >
                      {message.sender === "user" && (
                        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent animate-shine" />
                      )}
                      
                      {/* Show image if present */}
                      {message.image && (
                        <MessageImage image={message.image} />
                      )}
                      
                      <p className="text-xs sm:text-sm whitespace-pre-line leading-relaxed relative z-10">
                        {message.text}
                      </p>
                      
                      <div className={`absolute bottom-0 right-0 w-3 h-3 ${
                        message.sender === "user" 
                          ? "bg-emerald-600/50" 
                          : "bg-emerald-100 dark:bg-emerald-900/50"
                      } rounded-tl-lg`} />
                    </motion.div>

                    {message.data?.type === "vendor_recommendation" && message.data.vendors && (
                      <div className="mt-2 space-y-2">
                        {message.data.vendors.map((vendor: VendorCard, idx: number) => (
                          <VendorCardComponent key={idx} vendor={vendor} />
                        ))}
                      </div>
                    )}
                    
                    <motion.div 
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: 0.1 }}
                      className={`flex items-center gap-1 mt-1 text-xs ${message.sender === "user" ? "justify-end" : "justify-start"}`}
                    >
                      <Clock className="w-3 h-3 text-neutral-400" />
                      <span className="text-neutral-500 dark:text-neutral-400 font-medium">
                        {formatTime(message.timestamp)}
                      </span>
                      {message.sender === "bot" && (
                        <span className="text-[10px] px-1.5 py-0.5 bg-emerald-100 dark:bg-emerald-900/50 text-emerald-600 dark:text-emerald-400 rounded-full">
                          AI
                        </span>
                      )}
                      {message.image && (
                        <span className="text-[10px] px-1.5 py-0.5 bg-blue-100 dark:bg-blue-900/50 text-blue-600 dark:text-blue-400 rounded-full flex items-center gap-1">
                          <ImageIcon className="w-2.5 h-2.5" />
                          Gambar
                        </span>
                      )}
                    </motion.div>
                  </div>

                  {message.sender === "user" && (
                    <div className="relative flex-shrink-0">
                      <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-gradient-to-r from-blue-100 to-blue-50 dark:from-blue-900/40 dark:to-blue-800/40 flex items-center justify-center ring-2 ring-blue-200/50 dark:ring-blue-800/50">
                        <User className="w-3 h-3 sm:w-4 sm:h-4 text-blue-600 dark:text-blue-400" />
                      </div>
                    </div>
                  )}
                </motion.div>
              ))}

              {isTyping && (
                <div className="flex gap-2 sm:gap-3 mb-3 sm:mb-4">
                  <div className="relative flex-shrink-0">
                    <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-gradient-to-r from-emerald-100 to-emerald-50 dark:from-emerald-900/40 dark:to-emerald-800/40 flex items-center justify-center ring-2 ring-emerald-200/50 dark:ring-emerald-800/50">
                      <Bot className="w-3 h-3 sm:w-4 sm:h-4 text-emerald-600 dark:text-emerald-400" />
                    </div>
                  </div>
                  <div className="bg-white dark:bg-neutral-800 border border-emerald-100 dark:border-emerald-900/50 rounded-xl sm:rounded-2xl rounded-bl-none px-3 py-2 sm:px-4 sm:py-3 shadow-sm">
                    <div className="flex items-center gap-2">
                      <div className="flex gap-1">
                        <div className="w-1.5 h-1.5 sm:w-2 sm:h-2 bg-emerald-400 rounded-full animate-bounce" style={{ animationDelay: "0ms" }} />
                        <div className="w-1.5 h-1.5 sm:w-2 sm:h-2 bg-emerald-400 rounded-full animate-bounce" style={{ animationDelay: "150ms" }} />
                        <div className="w-1.5 h-1.5 sm:w-2 sm:h-2 bg-emerald-400 rounded-full animate-bounce" style={{ animationDelay: "300ms" }} />
                      </div>
                      <span className="text-xs text-emerald-600 dark:text-emerald-400 font-medium">
                        Sedang menganalisis...
                      </span>
                    </div>
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Image Preview */}
            <AnimatePresence>
              {selectedImage && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="px-3 sm:px-4 py-2 bg-neutral-50 dark:bg-neutral-800/50 border-t border-neutral-200 dark:border-neutral-700"
                >
                  <div className="flex items-center gap-2">
                    <div className="relative">
                      <img 
                        src={selectedImage.preview} 
                        alt="Preview" 
                        className="w-16 h-16 object-cover rounded-lg ring-2 ring-emerald-200 dark:ring-emerald-800"
                      />
                      <button
                        onClick={removeSelectedImage}
                        className="absolute -top-2 -right-2 w-5 h-5 bg-red-500 text-white rounded-full flex items-center justify-center hover:bg-red-600 transition-colors shadow-md"
                      >
                        <XCircle className="w-4 h-4" />
                      </button>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-medium text-neutral-700 dark:text-neutral-300 truncate">
                        {selectedImage.file.name}
                      </p>
                      <p className="text-xs text-neutral-500 dark:text-neutral-400">
                        {(selectedImage.file.size / 1024).toFixed(1)} KB
                      </p>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Input Area */}
            <div className="p-3 sm:p-4 border-t border-neutral-200 dark:border-neutral-800 bg-gradient-to-t from-white to-neutral-50 dark:from-neutral-900 dark:to-neutral-950">
              <div className="flex gap-2 sm:gap-3">
                {/* Image Upload Button */}
                <motion.button
                  onClick={handleImageButtonClick}
                  disabled={isTyping || isUploadingImage}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className="relative px-3 py-2 sm:px-3 sm:py-3 bg-gradient-to-r from-blue-400 to-blue-500 text-white rounded-lg sm:rounded-xl hover:from-blue-500 hover:to-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 flex items-center justify-center shadow-lg shadow-blue-500/30 hover:shadow-blue-500/50 group"
                  title="Upload Gambar"
                >
                  {isUploadingImage ? (
                    <Loader2 className="w-4 h-4 sm:w-5 sm:h-5 animate-spin" />
                  ) : (
                    <ImageIcon className="w-4 h-4 sm:w-5 sm:h-5" />
                  )}
                </motion.button>

                {/* Text Input */}
                <div className="flex-1 relative">
                  <div className="absolute inset-0 bg-gradient-to-r from-emerald-500/10 to-[#7CE0A8]/10 rounded-lg sm:rounded-xl blur-sm" />
                  <input
                    type="text"
                    value={inputText}
                    onChange={(e) => setInputText(e.target.value)}
                    onKeyPress={handleKeyPress}
                    placeholder={selectedImage ? "Tambahkan pesan (opsional)..." : "Tanyakan atau kirim gambar..."}
                    disabled={isTyping}
                    className="relative w-full px-3 py-2 sm:px-4 sm:py-3 text-xs sm:text-sm bg-white/80 dark:bg-neutral-800/80 backdrop-blur-sm border border-emerald-200 dark:border-emerald-800/50 rounded-lg sm:rounded-xl focus:outline-none focus:ring-2 focus:ring-[#7CE0A8] focus:border-transparent placeholder-emerald-600/50 dark:placeholder-emerald-400/50 disabled:opacity-50 disabled:cursor-not-allowed"
                  />
                  {!inputText && !isTyping && !selectedImage && (
                    <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                      <Sparkles className="w-4 h-4 text-emerald-400/50" />
                    </div>
                  )}
                </div>

                {/* Send Button */}
                <motion.button
                  onClick={handleSendMessage}
                  disabled={(!inputText.trim() && !selectedImage) || isTyping}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className="relative px-3 py-2 sm:px-4 sm:py-3 bg-gradient-to-r from-[#7CE0A8] to-emerald-500 text-white rounded-lg sm:rounded-xl hover:from-emerald-500 hover:to-[#7CE0A8] disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 flex items-center justify-center shadow-lg shadow-emerald-500/30 hover:shadow-emerald-500/50 group overflow-hidden"
                >
                  <div className="absolute inset-0 bg-gradient-to-r from-emerald-400 to-[#7CE0A8] opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                  
                  <Send className="w-4 h-4 sm:w-5 sm:h-5 relative z-10 transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
                  
                  {(inputText.trim() || selectedImage) && !isTyping && (
                    <div className="absolute -top-1 -right-1 w-3 h-3 bg-emerald-300 rounded-full animate-ping opacity-75" />
                  )}
                </motion.button>
              </div>
              <p className="text-xs text-emerald-600/70 dark:text-emerald-400/70 mt-2 text-center flex items-center justify-center gap-1">
                <Sparkles className="w-3 h-3" />
                Powered by Groq AI • Vision & Text
                <ImageIcon className="w-3 h-3 ml-1" />
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={() => setIsOpen(false)}
          className="fixed inset-0 z-40 bg-black/20 backdrop-blur-sm"
        />
      )}

      <style jsx global>{`
        @keyframes shine {
          0% {
            transform: translateX(-100%) rotate(45deg);
          }
          100% {
            transform: translateX(100%) rotate(45deg);
          }
        }
        
        .animate-shine {
          animation: shine 2s infinite;
        }
      `}</style>
    </>
  );
};

export default Chatbot;