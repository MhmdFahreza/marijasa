// app/chat/[vendorId]/page.tsx
"use client";

import React, { useState, useRef, useEffect, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import { motion, AnimatePresence } from "motion/react";
import { Avatar, AvatarFallback, AvatarImage } from "@/app/components/ui/avatar";
import { Button } from "@/app/components/ui/button";
import { Input } from "@/app/components/ui/input";
import { Badge } from "@/app/components/ui/badge";
import { Tabs, TabsList, TabsTrigger } from "@/app/components/ui/tabs";
import {
  Send,
  Phone,
  Video,
  Smile,
  Paperclip,
  Mic,
  CheckCheck,
  Check,
  Search,
  Menu,
  X,
  Camera,
  Image as ImageIcon,
  Play,
  Pause,
  Download,
  Video as VideoIcon,
  MessageSquare,
  MoreVertical,
  ZoomIn,
  ZoomOut,
  RotateCw,
} from "lucide-react";
import { format } from "date-fns";
import { id } from "date-fns/locale";
import EmojiPicker3D from "@/app/components/ui/emoji-picker-3d";
import CameraModal from "@/app/components/ui/camera-modal";
import CallModal from "@/app/components/ui/call-modal";
import IncomingCallListener from "@/app/components/ui/incoming-call-listener";
import * as chatService from "@/app/components/lib/services/chatService";
import type { Message, ChatSession } from "@/app/components/lib/services/chatService";
import { useWebRTC } from "@/app/components/lib/hooks/useWebRTC";
import { CallType } from "@/app/components/lib/services/callService";

// Safe fetch helper
async function safeFetch(url: string, options?: RequestInit) {
  try {
    const response = await fetch(url, options);
    const text = await response.text();
    if (text.trim().startsWith('<!DOCTYPE') || text.trim().startsWith('<html')) {
      console.error('API returned HTML:', url);
      return null;
    }
    if (!text || text.trim() === '') return null;
    return JSON.parse(text);
  } catch (error) {
    console.error('Fetch error:', url, error);
    return null;
  }
}

// Image Lightbox Component
const ImageLightbox = ({
  isOpen,
  imageUrl,
  onClose
}: {
  isOpen: boolean;
  imageUrl: string;
  onClose: () => void;
}) => {
  const [scale, setScale] = useState(1);
  const [rotation, setRotation] = useState(0);

  useEffect(() => {
    if (isOpen) {
      setScale(1);
      setRotation(0);
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => { document.body.style.overflow = ''; };
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[100] bg-black/95 flex items-center justify-center"
        onClick={onClose}
      >
        <div className="absolute top-4 right-4 flex items-center gap-2 z-10">
          <Button
            variant="ghost"
            size="icon"
            className="rounded-full bg-white/10 hover:bg-white/20 text-white"
            onClick={(e) => { e.stopPropagation(); setScale(s => Math.min(s + 0.5, 3)); }}
          >
            <ZoomIn className="h-5 w-5" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="rounded-full bg-white/10 hover:bg-white/20 text-white"
            onClick={(e) => { e.stopPropagation(); setScale(s => Math.max(s - 0.5, 0.5)); }}
          >
            <ZoomOut className="h-5 w-5" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="rounded-full bg-white/10 hover:bg-white/20 text-white"
            onClick={(e) => { e.stopPropagation(); setRotation(r => r + 90); }}
          >
            <RotateCw className="h-5 w-5" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="rounded-full bg-white/10 hover:bg-white/20 text-white"
            onClick={onClose}
          >
            <X className="h-5 w-5" />
          </Button>
        </div>
        <motion.img
          src={imageUrl}
          alt="Preview"
          className="max-w-[90vw] max-h-[90vh] object-contain rounded-lg select-none"
          style={{ transform: `scale(${scale}) rotate(${rotation}deg)`, transition: 'transform 0.2s ease' }}
          onClick={(e) => e.stopPropagation()}
          draggable={false}
        />
      </motion.div>
    </AnimatePresence>
  );
};

// VoiceRecorder Component
const VoiceRecorder = ({ onSend, onCancel }: { onSend: (blob: Blob, duration: number) => void; onCancel: () => void }) => {
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  useEffect(() => {
    startRecording();
    return () => cleanup();
  }, []);

  const cleanup = () => {
    if (timerRef.current) clearInterval(timerRef.current);
    if (streamRef.current) streamRef.current.getTracks().forEach(t => t.stop());
  };

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: { echoCancellation: true, noiseSuppression: true } });
      streamRef.current = stream;
      const mediaRecorder = new MediaRecorder(stream, { mimeType: 'audio/webm' });
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (e) => { if (e.data.size > 0) audioChunksRef.current.push(e.data); };
      mediaRecorder.onstop = () => {
        const blob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        setAudioBlob(blob);
        cleanup();
      };

      mediaRecorder.start();
      setIsRecording(true);
      const startTime = Date.now();
      timerRef.current = setInterval(() => {
        setRecordingTime(Math.floor((Date.now() - startTime) / 1000));
      }, 100);
    } catch (error) {
      alert("Tidak dapat mengakses mikrofon");
      onCancel();
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      setIsRecording(false);
      mediaRecorderRef.current.stop();
      if (timerRef.current) clearInterval(timerRef.current);
    }
  };

  const formatTime = (s: number) => `${Math.floor(s / 60)}:${(s % 60).toString().padStart(2, "0")}`;

  return (
    <div className="fixed bottom-24 right-4 bg-white rounded-2xl shadow-2xl border p-4 z-50 w-[90%] max-w-[300px]">
      <div className="flex flex-col items-center gap-3">
        <div className={`h-12 w-12 rounded-full flex items-center justify-center ${isRecording ? "bg-red-500 animate-pulse" : "bg-gray-300"}`}>
          <Mic className="h-6 w-6 text-white" />
        </div>
        <div className="text-center">
          <div className="text-2xl font-mono font-bold">{formatTime(recordingTime)}</div>
          <p className="text-xs text-gray-600">{isRecording ? "Merekam..." : "Siap dikirim"}</p>
        </div>
        <div className="flex gap-2 w-full">
          <Button onClick={onCancel} variant="outline" className="flex-1 rounded-full h-9"><X className="h-4 w-4 mr-1" />Batal</Button>
          {isRecording ? (
            <Button onClick={stopRecording} className="flex-1 rounded-full bg-red-500 hover:bg-red-600 h-9">Stop</Button>
          ) : (
            <Button onClick={() => audioBlob && onSend(audioBlob, recordingTime)} className="flex-1 rounded-full bg-green-500 hover:bg-green-600 h-9" disabled={!audioBlob}>
              <Send className="h-4 w-4 mr-1" />Kirim
            </Button>
          )}
        </div>
      </div>
    </div>
  );
};

// Voice Message Player
const VoiceMessagePlayer = ({ msg, isUser }: { msg: Message; isUser: boolean }) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(msg.duration || 0);
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const waveformHeights = useRef<number[]>(Array.from({ length: 30 }, () => Math.random() * 20 + 10));

  useEffect(() => {
    if (!msg.fileUrl) {
      setHasError(true);
      setIsLoading(false);
      return;
    }

    const audio = new Audio();
    audioRef.current = audio;

    const handleLoadedMetadata = () => {
      setIsLoading(false);
      if (audio.duration && isFinite(audio.duration)) {
        setDuration(audio.duration);
      }
    };

    const handleCanPlay = () => {
      setIsLoading(false);
    };

    const handleEnded = () => {
      setIsPlaying(false);
      setCurrentTime(0);
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };

    const handleError = () => {
      setHasError(true);
      setIsLoading(false);
    };

    audio.addEventListener('loadedmetadata', handleLoadedMetadata);
    audio.addEventListener('canplay', handleCanPlay);
    audio.addEventListener('ended', handleEnded);
    audio.addEventListener('error', handleError);

    audio.preload = 'metadata';
    audio.src = msg.fileUrl;

    return () => {
      audio.removeEventListener('loadedmetadata', handleLoadedMetadata);
      audio.removeEventListener('canplay', handleCanPlay);
      audio.removeEventListener('ended', handleEnded);
      audio.removeEventListener('error', handleError);
      if (intervalRef.current) clearInterval(intervalRef.current);
      audio.pause();
      audio.src = '';
      audioRef.current = null;
    };
  }, [msg.fileUrl]);

  const togglePlayPause = async () => {
    if (!audioRef.current || hasError || isLoading) return;

    try {
      if (isPlaying) {
        audioRef.current.pause();
        setIsPlaying(false);
        if (intervalRef.current) {
          clearInterval(intervalRef.current);
          intervalRef.current = null;
        }
      } else {
        await audioRef.current.play();
        setIsPlaying(true);
        intervalRef.current = setInterval(() => {
          if (audioRef.current) {
            setCurrentTime(audioRef.current.currentTime);
          }
        }, 50);
      }
    } catch (err) {
      console.error('Audio playback error:', err);
      setHasError(true);
    }
  };

  const formatDuration = (s: number) => `${Math.floor(s / 60)}:${Math.floor(s % 60).toString().padStart(2, "0")}`;
  const progress = duration > 0 ? (currentTime / duration) * 100 : 0;

  if (hasError) {
    return (
      <div className={`rounded-2xl p-3 max-w-[280px] ${isUser ? "bg-gradient-to-r from-green-500 to-green-600 text-white" : "bg-white border text-gray-600"}`}>
        ⚠️ Tidak dapat memutar audio
      </div>
    );
  }

  return (
    <div className={`rounded-2xl shadow-lg max-w-[280px] ${isUser ? "bg-gradient-to-r from-green-500 to-green-600" : "bg-white border border-gray-200"}`}>
      <div className="p-3 flex items-center gap-3">
        <button
          onClick={togglePlayPause}
          disabled={isLoading}
          className={`h-10 w-10 rounded-full flex items-center justify-center transition-all flex-shrink-0 ${isUser ? "bg-white/20 hover:bg-white/30 text-white" : "bg-green-500 hover:bg-green-600 text-white"
            } ${isLoading ? "opacity-50" : ""}`}
        >
          {isLoading ? (
            <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
          ) : isPlaying ? (
            <Pause className="h-4 w-4" fill="currentColor" />
          ) : (
            <Play className="h-4 w-4 ml-0.5" fill="currentColor" />
          )}
        </button>
        <div className="flex-1 min-w-0">
          <div className="flex items-end gap-[2px] h-6 mb-1">
            {waveformHeights.current.map((height, i) => {
              const isActive = (i / waveformHeights.current.length) * 100 <= progress;
              return (
                <div
                  key={i}
                  className={`w-[3px] rounded-full transition-all duration-75 ${isUser ? (isActive ? "bg-white" : "bg-white/40") : (isActive ? "bg-green-500" : "bg-gray-300")
                    }`}
                  style={{ height: `${height}px` }}
                />
              );
            })}
          </div>
          <span className={`text-xs ${isUser ? "text-white/80" : "text-gray-500"}`}>
            {formatDuration(currentTime)} / {formatDuration(duration)}
          </span>
        </div>
      </div>
    </div>
  );
};

// Media Popup
const MediaPopup = ({ isOpen, onClose, onTakePhoto, onSelectImage }: { isOpen: boolean; onClose: () => void; onTakePhoto: () => void; onSelectImage: () => void }) => {
  if (!isOpen) return null;
  return (
    <div className="fixed bottom-24 left-4 z-50 bg-white rounded-2xl shadow-2xl border p-2 w-48">
      <button onClick={onTakePhoto} className="flex items-center gap-3 px-4 py-3 hover:bg-gray-100 rounded-lg w-full">
        <div className="h-9 w-9 rounded-full bg-gradient-to-r from-purple-500 to-pink-500 flex items-center justify-center"><Camera className="h-5 w-5 text-white" /></div>
        <div className="text-left"><p className="font-medium text-gray-800">Ambil Foto</p><p className="text-xs text-gray-500">Gunakan kamera</p></div>
      </button>
      <div className="h-px bg-gray-200 my-1" />
      <button onClick={onSelectImage} className="flex items-center gap-3 px-4 py-3 hover:bg-gray-100 rounded-lg w-full">
        <div className="h-9 w-9 rounded-full bg-gradient-to-r from-green-500 to-blue-500 flex items-center justify-center"><ImageIcon className="h-5 w-5 text-white" /></div>
        <div className="text-left"><p className="font-medium text-gray-800">Gambar & Video</p><p className="text-xs text-gray-500">Pilih dari galeri</p></div>
      </button>
    </div>
  );
};

// Media Message with Lightbox
const MediaMessage = ({
  msg,
  isUser,
  timestamp,
  onImageClick
}: {
  msg: Message;
  isUser: boolean;
  timestamp: string;
  onImageClick: (url: string) => void;
}) => {
  const [isVideoPlaying, setIsVideoPlaying] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);

  const formatFileSize = (bytes?: number | null) => {
    if (!bytes) return "0 KB";
    if (bytes < 1024) return bytes + " B";
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + " KB";
    return (bytes / (1024 * 1024)).toFixed(1) + " MB";
  };

  const handleDownload = () => {
    if (!msg.fileUrl) return;
    const link = document.createElement("a");
    link.href = msg.fileUrl;
    link.download = msg.fileName || "file";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const safeFileUrl = msg.fileUrl || "";
  const isImage = msg.messageType === "IMAGE";
  const isVideo = msg.messageType === "VIDEO";

  if (!safeFileUrl) {
    return <div className="p-3 rounded-xl border bg-white text-sm text-gray-600">⚠️ Media tidak tersedia</div>;
  }

  return (
    <div className={`rounded-xl border overflow-hidden max-w-[280px] shadow-md ${isUser ? "border-green-200" : "border-gray-200"}`}>
      <div className="relative">
        {isImage && (
          <>
            <img
              src={safeFileUrl}
              alt={msg.fileName || "Gambar"}
              className="w-full h-auto max-h-[200px] object-cover cursor-pointer hover:opacity-90 transition-opacity"
              onClick={() => onImageClick(safeFileUrl)}
            />
            <div className={`absolute bottom-2 right-2 px-2 py-1 rounded text-xs font-medium ${isUser ? "bg-black/60 text-white" : "bg-white/90 text-gray-800"}`}>
              {timestamp}
            </div>
            <button
              onClick={() => onImageClick(safeFileUrl)}
              className="absolute top-2 right-2 p-1.5 rounded-full bg-black/40 hover:bg-black/60 text-white transition-colors"
            >
              <ZoomIn className="w-4 h-4" />
            </button>
          </>
        )}
        {isVideo && (
          <div className="relative">
            <video
              ref={videoRef}
              src={safeFileUrl}
              className="w-full h-auto max-h-[200px] object-cover"
              controls={isVideoPlaying}
              onEnded={() => setIsVideoPlaying(false)}
              onPlay={() => setIsVideoPlaying(true)}
              onPause={() => setIsVideoPlaying(false)}
            />
            {!isVideoPlaying && (
              <div className="absolute inset-0 flex items-center justify-center bg-black/20">
                <button onClick={() => videoRef.current?.play()} className="bg-white/90 hover:bg-white p-4 rounded-full">
                  <Play className="w-8 h-8 text-gray-800" fill="currentColor" />
                </button>
              </div>
            )}
          </div>
        )}
      </div>
      <div className={`p-2 ${isUser ? "bg-gradient-to-r from-green-500 to-green-600" : "bg-white"}`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            {isImage ? <ImageIcon className={`w-4 h-4 ${isUser ? "text-white" : "text-gray-600"}`} /> : <VideoIcon className={`w-4 h-4 ${isUser ? "text-white" : "text-gray-600"}`} />}
            <div>
              <p className={`text-xs font-medium truncate max-w-[140px] ${isUser ? "text-white" : "text-gray-700"}`}>{msg.fileName}</p>
              <p className={`text-xs ${isUser ? "text-green-100" : "text-gray-500"}`}>{formatFileSize(msg.fileSize)}</p>
            </div>
          </div>
          <button onClick={handleDownload} className={`p-1.5 rounded-full hover:bg-white/20 ${isUser ? "text-white" : "text-gray-600"}`}>
            <Download className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};

// Main Component
export default function UserChatPage() {
  const params = useParams();
  const router = useRouter();
  const [selectedVendorId, setSelectedVendorId] = useState<string | null>((params?.vendorId as string) || null);

  const [currentUser, setCurrentUser] = useState<{ id: string; name: string; avatar: string } | null>(null);
  const [currentSession, setCurrentSession] = useState<ChatSession | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [chatList, setChatList] = useState<ChatSession[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [authLoading, setAuthLoading] = useState(true);

  const [newMessage, setNewMessage] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState("all");
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [showVoiceRecorder, setShowVoiceRecorder] = useState(false);
  const [showMediaPopup, setShowMediaPopup] = useState(false);
  const [showCameraModal, setShowCameraModal] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [showCallModal, setShowCallModal] = useState(false);
  const [outgoingCallType, setOutgoingCallType] = useState<CallType>('VOICE');
  const [lightboxImage, setLightboxImage] = useState<string | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const pollingRef = useRef<NodeJS.Timeout | null>(null);
  const hasMarkedAsReadRef = useRef(false);

  const vendorName = currentSession?.mitraName || "Vendor";
  const vendorAvatar = currentSession?.mitraAvatar || "/store.svg";
  const vendorOnline = currentSession?.mitraOnline || false;

  const webRTC = useWebRTC({
    userId: currentUser?.id || '',
    userType: 'user',
    userName: currentUser?.name || '',
    userAvatar: currentUser?.avatar || '',
    onCallEnded: () => setShowCallModal(false),
    onError: (error) => { alert(error); setShowCallModal(false); },
  });

  // Load user
  useEffect(() => {
    const load = async () => {
      setAuthLoading(true);
      const data = await safeFetch("/api/auth/me");
      if (data?.user) {
        setCurrentUser({ id: data.user.user_id, name: data.user.name, avatar: data.user.avatar || "/profile.svg" });
      }
      setAuthLoading(false);
    };
    load();
  }, []);

  // Load chat list
  useEffect(() => {
    if (!currentUser?.id) {
      if (!authLoading) setIsLoading(false);
      return;
    }
    const load = async () => {
      setIsLoading(true);
      const sessions = await chatService.getUserSessions(currentUser.id);
      setChatList(sessions || []);
      setIsLoading(false);
    };
    load();
  }, [currentUser?.id, authLoading]);

  // Load messages and mark as read
  useEffect(() => {
    if (!currentUser?.id || !selectedVendorId) {
      setCurrentSession(null);
      setMessages([]);
      hasMarkedAsReadRef.current = false;
      return;
    }
    
    const load = async () => {
      const session = await chatService.getOrCreateSession(currentUser.id, selectedVendorId);
      if (session) {
        setCurrentSession(session);
        setMessages(session.messages || []);
        
        // Mark as read immediately when opening chat
        if (!hasMarkedAsReadRef.current) {
          await chatService.markAsRead(currentUser.id, selectedVendorId, "user");
          hasMarkedAsReadRef.current = true;
          
          // Refresh chat list to update unread count
          const sessions = await chatService.getUserSessions(currentUser.id);
          setChatList(sessions || []);
        }
      }
    };
    load();
  }, [currentUser?.id, selectedVendorId]);

  // Polling with auto mark as read
  useEffect(() => {
    if (!currentUser?.id || !selectedVendorId) return;
    
    const poll = async () => {
      const msgs = await chatService.getMessages(currentUser.id, selectedVendorId);
      if (msgs && msgs.length > messages.length) {
        setMessages(msgs);
        
        // Auto mark as read when new messages arrive
        await chatService.markAsRead(currentUser.id, selectedVendorId, "user");
        
        // Refresh chat list to update unread count
        const sessions = await chatService.getUserSessions(currentUser.id);
        setChatList(sessions || []);
      }
    };
    
    pollingRef.current = setInterval(poll, 3000);
    return () => { 
      if (pollingRef.current) clearInterval(pollingRef.current); 
    };
  }, [currentUser?.id, selectedVendorId, messages.length]);

  // Reset mark as read flag when changing chat
  useEffect(() => {
    hasMarkedAsReadRef.current = false;
  }, [selectedVendorId]);

  const scrollToBottom = useCallback(() => messagesEndRef.current?.scrollIntoView({ behavior: "smooth" }), []);
  useEffect(() => { scrollToBottom(); }, [messages, scrollToBottom]);

  const handleSelectChat = async (vendorId: string) => {
    setSelectedVendorId(vendorId);
    router.push(`/chat/${vendorId}`);
    setIsSidebarOpen(false);
    
    // Mark as read when selecting chat
    if (currentUser?.id) {
      await chatService.markAsRead(currentUser.id, vendorId, "user");
      const sessions = await chatService.getUserSessions(currentUser.id);
      setChatList(sessions || []);
    }
  };

  const handleVoiceCall = async () => {
    if (!currentSession || !currentUser || !selectedVendorId) return;
    setOutgoingCallType('VOICE');
    setShowCallModal(true);
    await webRTC.initiateCall(selectedVendorId, 'mitra', 'VOICE');
  };

  const handleVideoCall = async () => {
    if (!currentSession || !currentUser || !selectedVendorId) return;
    setOutgoingCallType('VIDEO');
    setShowCallModal(true);
    await webRTC.initiateCall(selectedVendorId, 'mitra', 'VIDEO');
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !currentUser?.id || !selectedVendorId || isSending) return;
    setIsSending(true);
    const sent = await chatService.sendTextMessage(currentUser.id, selectedVendorId, currentUser.id, "user", newMessage.trim());
    if (sent) { 
      setMessages(prev => [...prev, sent]); 
      setNewMessage(""); 
      
      // Refresh chat list after sending
      const sessions = await chatService.getUserSessions(currentUser.id);
      setChatList(sessions || []);
    }
    setIsSending(false);
  };

  const handleSendVoiceMessage = async (blob: Blob, duration: number) => {
    if (!currentUser?.id || !selectedVendorId) return;
    setShowVoiceRecorder(false);
    const sent = await chatService.sendVoiceMessage(currentUser.id, selectedVendorId, currentUser.id, "user", blob, duration);
    if (sent) {
      setMessages(prev => [...prev, sent]);
      
      // Refresh chat list after sending
      const sessions = await chatService.getUserSessions(currentUser.id);
      setChatList(sessions || []);
    }
  };

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !currentUser?.id || !selectedVendorId) return;
    let sent: Message | null = null;
    if (file.type.startsWith("image/")) sent = await chatService.sendImageMessage(currentUser.id, selectedVendorId, currentUser.id, "user", file);
    else if (file.type.startsWith("video/")) sent = await chatService.sendVideoMessage(currentUser.id, selectedVendorId, currentUser.id, "user", file);
    if (sent) {
      setMessages(prev => [...prev, sent!]);
      
      // Refresh chat list after sending
      const sessions = await chatService.getUserSessions(currentUser.id);
      setChatList(sessions || []);
    }
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleCameraCapture = async (blob: Blob) => {
    if (!currentUser?.id || !selectedVendorId) return;
    setShowCameraModal(false);
    const file = new File([blob], `camera_${Date.now()}.jpg`, { type: "image/jpeg" });
    const sent = await chatService.sendImageMessage(currentUser.id, selectedVendorId, currentUser.id, "user", file);
    if (sent) {
      setMessages(prev => [...prev, sent]);
      
      // Refresh chat list after sending
      const sessions = await chatService.getUserSessions(currentUser.id);
      setChatList(sessions || []);
    }
  };

  const handleEmojiSelect = (emoji: string) => { setNewMessage(prev => prev + emoji); setShowEmojiPicker(false); };

  const formatTime = (t: string | Date) => { try { return format(new Date(t), "HH:mm", { locale: id }); } catch { return ""; } };
  const formatDate = (t: string | Date) => {
    try {
      const d = new Date(t), today = new Date(), yesterday = new Date(today);
      yesterday.setDate(yesterday.getDate() - 1);
      if (d.toDateString() === today.toDateString()) return "Hari ini";
      if (d.toDateString() === yesterday.toDateString()) return "Kemarin";
      return format(d, "dd MMMM yyyy", { locale: id });
    } catch { return ""; }
  };
  const formatChatTime = (t: string | Date) => {
    try {
      const d = new Date(t), days = Math.floor((Date.now() - d.getTime()) / 86400000);
      if (days === 0) return format(d, "HH:mm");
      if (days === 1) return "Kemarin";
      if (days < 7) return format(d, "EEEE", { locale: id });
      return format(d, "dd/MM/yy");
    } catch { return ""; }
  };

  const filteredChats = chatList.filter(c => {
    const match = (c.mitraName || "").toLowerCase().includes(searchQuery.toLowerCase());
    if (activeTab === "unread") return match && c.userUnreadCount > 0;
    if (activeTab === "online") return match && c.mitraOnline;
    return match;
  });

  const renderMessageContent = (msg: Message) => {
    const isUser = msg.senderType === "user";
    if (msg.messageType === "VOICE") return <VoiceMessagePlayer msg={msg} isUser={isUser} />;
    if (msg.messageType === "IMAGE" || msg.messageType === "VIDEO")
      return <MediaMessage msg={msg} isUser={isUser} timestamp={formatTime(msg.timestamp)} onImageClick={setLightboxImage} />;
    return <p className="text-sm break-words whitespace-pre-wrap">{msg.text}</p>;
  };

  if (isLoading || authLoading) {
    return (
      <div className="flex items-center justify-center h-full min-h-screen">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-green-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-gray-600">Memuat chat...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full min-h-screen bg-gradient-to-br from-gray-50 to-green-50 flex flex-col">
      {currentUser && <IncomingCallListener participantId={currentUser.id} participantType="user" />}

      <ImageLightbox isOpen={!!lightboxImage} imageUrl={lightboxImage || ''} onClose={() => setLightboxImage(null)} />

      {showCallModal && (
        <CallModal
          callState={webRTC.callState} isIncoming={false} callType={outgoingCallType}
          callerName={vendorName} callerAvatar={vendorAvatar}
          localStream={webRTC.localStream} remoteStream={webRTC.remoteStream}
          isMuted={webRTC.isMuted} isVideoEnabled={webRTC.isVideoEnabled} callDuration={webRTC.callDuration}
          onAccept={() => { }} onReject={() => { }} onEnd={webRTC.endCall}
          onToggleMute={webRTC.toggleMute} onToggleVideo={webRTC.toggleVideo}
          onClose={() => { webRTC.endCall(); setShowCallModal(false); }}
        />
      )}

      <div className="flex flex-1 gap-4 p-4 h-full overflow-hidden max-w-7xl mx-auto w-full">
        {/* Sidebar */}
        <div className={`${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'} lg:translate-x-0 fixed lg:relative z-30 lg:z-0 w-full lg:w-80 bg-white rounded-xl shadow-lg border transition-transform duration-300 h-[calc(100vh-2rem)] flex flex-col`}>
          <div className="p-4 border-b">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold text-gray-800">Percakapan</h2>
              <div className="flex items-center gap-2">
                <Button variant="ghost" size="icon" className="lg:hidden rounded-full" onClick={() => setIsSidebarOpen(false)}><X className="h-5 w-5" /></Button>
                <Badge className="bg-green-500">{chatList.filter(s => s.userUnreadCount > 0).length} baru</Badge>
              </div>
            </div>
            <div className="relative mb-4">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input placeholder="Cari vendor..." value={searchQuery} onChange={e => setSearchQuery(e.target.value)} className="pl-10 rounded-full" />
            </div>
            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <TabsList className="grid grid-cols-3 w-full">
                <TabsTrigger value="all" className="text-xs">Semua</TabsTrigger>
                <TabsTrigger value="unread" className="text-xs">Belum Dibaca</TabsTrigger>
                <TabsTrigger value="online" className="text-xs">Online</TabsTrigger>
              </TabsList>
            </Tabs>
          </div>
          <div className="flex-1 overflow-y-auto p-2">
            {filteredChats.length === 0 ? (
              <div className="p-4 text-center"><MessageSquare className="h-12 w-12 text-gray-300 mx-auto mb-3" /><p className="text-gray-500 text-sm">Belum ada percakapan</p></div>
            ) : filteredChats.map(chat => (
              <div key={chat.id}
                onClick={() => chat.mitraId && handleSelectChat(chat.mitraId)}
                className={`p-3 rounded-lg cursor-pointer mb-2 hover:bg-green-50 ${chat.mitraId === selectedVendorId ? 'bg-green-50 border border-green-200' : ''}`}>
                <div className="flex items-start gap-3">
                  <div className="relative">
                    <Avatar className="h-10 w-10">
                      <AvatarImage src={chat.mitraAvatar || undefined} />
                      <AvatarFallback>{(chat.mitraName || "V").substring(0, 2).toUpperCase()}</AvatarFallback>
                    </Avatar>
                    {chat.mitraOnline && <div className="absolute -bottom-1 -right-1 h-3 w-3 rounded-full bg-green-500 border-2 border-white" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-1">
                      <h3 className="font-semibold text-sm truncate">{chat.mitraName}</h3>
                      <span className="text-xs text-gray-500 ml-2">{formatChatTime(chat.timestamp)}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <p className="text-xs text-gray-600 truncate pr-2">{(chat.lastMessage || "").substring(0, 30) || "Mulai percakapan"}</p>
                      {chat.userUnreadCount > 0 && <Badge className="bg-green-500 rounded-full h-5 w-5 p-0 flex items-center justify-center text-xs">{chat.userUnreadCount}</Badge>}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {isSidebarOpen && <div className="lg:hidden fixed inset-0 bg-black/50 z-20" onClick={() => setIsSidebarOpen(false)} />}

        {/* Main Chat */}
        <div className="flex-1 flex flex-col bg-white rounded-xl shadow-lg border h-[calc(100vh-2rem)] overflow-hidden">
          {!selectedVendorId ? (
            <div className="flex-1 flex flex-col items-center justify-center p-6 text-center">
              <MessageSquare className="h-16 w-16 text-gray-300 mb-4" />
              <h3 className="text-lg font-semibold text-gray-700 mb-2">Pilih Percakapan</h3>
              <p className="text-gray-500 mb-6">Pilih vendor dari daftar untuk memulai</p>
              <Button onClick={() => setIsSidebarOpen(true)} className="lg:hidden bg-gradient-to-r from-green-500 to-green-600"><Menu className="h-4 w-4 mr-2" />Buka Daftar Chat</Button>
            </div>
          ) : (
            <>
              <div className="p-4 border-b flex-shrink-0">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Button variant="ghost" size="icon" onClick={() => setIsSidebarOpen(true)} className="lg:hidden rounded-full"><Menu className="h-5 w-5" /></Button>
                    <Avatar className="h-10 w-10 border-2 border-white shadow"><AvatarImage src={vendorAvatar} /><AvatarFallback>{vendorName.substring(0, 2).toUpperCase()}</AvatarFallback></Avatar>
                    <div>
                      <div className="flex items-center gap-2">
                        <h2 className="font-semibold text-gray-800">{vendorName}</h2>
                        {vendorOnline ? <Badge className="bg-green-500 text-xs px-2 py-0">Online</Badge> : <Badge variant="outline" className="text-xs px-2 py-0">Offline</Badge>}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-1">
                    <Button variant="ghost" size="icon" className="rounded-full hover:bg-green-50" onClick={handleVoiceCall} disabled={webRTC.callState !== 'idle'}><Phone className="h-5 w-5" /></Button>
                    <Button variant="ghost" size="icon" className="rounded-full hover:bg-green-50" onClick={handleVideoCall} disabled={webRTC.callState !== 'idle'}><Video className="h-5 w-5" /></Button>
                    <Button variant="ghost" size="icon" className="rounded-full"><MoreVertical className="h-5 w-5" /></Button>
                  </div>
                </div>
              </div>

              <div className="flex-1 overflow-y-auto p-4 bg-gradient-to-b from-white to-green-50/30">
                <div className="max-w-3xl mx-auto space-y-4">
                  {messages.length === 0 ? (
                    <div className="text-center py-8"><MessageSquare className="w-12 h-12 mx-auto text-gray-300 mb-4" /><h3 className="text-lg font-semibold text-gray-700 mb-2">Mulai Percakapan</h3><p className="text-sm text-gray-500">Kirim pesan untuk memulai chat</p></div>
                  ) : messages.map((msg, idx) => {
                    const showDate = idx === 0 || formatDate(messages[idx - 1].timestamp) !== formatDate(msg.timestamp);
                    const isUser = msg.senderType === "user";
                    const isVoice = msg.messageType === "VOICE";
                    const isMedia = msg.messageType === "IMAGE" || msg.messageType === "VIDEO";
                    return (
                      <React.Fragment key={msg.id}>
                        {showDate && <div className="flex justify-center"><Badge variant="secondary" className="rounded-full px-4 py-1 text-xs">{formatDate(msg.timestamp)}</Badge></div>}
                        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className={`flex ${isUser ? "justify-end" : "justify-start"} items-end`}>
                          <div className="flex max-w-[85%] gap-2">
                            {!isUser && !isMedia && !isVoice && <Avatar className="h-8 w-8 mt-1 flex-shrink-0"><AvatarImage src={vendorAvatar} /><AvatarFallback className="text-xs">{vendorName.substring(0, 2).toUpperCase()}</AvatarFallback></Avatar>}
                            <div className={`relative ${isMedia || isVoice ? "" : isUser ? 'bg-gradient-to-r from-green-500 to-green-600 text-white rounded-2xl rounded-br-none shadow-lg px-4 py-3' : 'bg-white border shadow-sm rounded-2xl rounded-bl-none px-4 py-3'}`}>
                              {renderMessageContent(msg)}
                              {!isMedia && !isVoice && (
                                <div className={`flex items-center gap-1 mt-2 ${isUser ? 'justify-end' : 'justify-start'}`}>
                                  <span className={`text-xs ${isUser ? 'text-green-100' : 'text-gray-400'}`}>{formatTime(msg.timestamp)}</span>
                                  {isUser && <span className="text-xs">{msg.isRead ? <CheckCheck className="h-3 w-3 text-green-200" /> : <Check className="h-3 w-3 text-green-200" />}</span>}
                                </div>
                              )}
                            </div>
                          </div>
                        </motion.div>
                      </React.Fragment>
                    );
                  })}
                  <div ref={messagesEndRef} />
                </div>
              </div>

              <form onSubmit={handleSendMessage} className="p-4 border-t flex-shrink-0">
                <div className="max-w-3xl mx-auto flex items-center gap-2">
                  <Button type="button" variant="ghost" size="icon" onClick={() => { setShowMediaPopup(!showMediaPopup); setShowEmojiPicker(false); setShowVoiceRecorder(false); }} className="rounded-full"><Paperclip className={`h-5 w-5 ${showMediaPopup ? 'text-green-500' : ''}`} /></Button>
                  <Button type="button" variant="ghost" size="icon" onClick={() => { setShowEmojiPicker(!showEmojiPicker); setShowVoiceRecorder(false); setShowMediaPopup(false); }} className="rounded-full"><Smile className={`h-5 w-5 ${showEmojiPicker ? 'text-orange-500' : ''}`} /></Button>
                  <div className="flex-1 relative">
                    <Input value={newMessage} onChange={e => setNewMessage(e.target.value)} placeholder="Ketik pesan..." className="rounded-full px-4 py-5 pr-12" disabled={isSending} />
                    <Button type="button" variant="ghost" size="icon" onClick={() => { setShowVoiceRecorder(!showVoiceRecorder); setShowEmojiPicker(false); setShowMediaPopup(false); }} className="absolute right-2 top-1/2 -translate-y-1/2 rounded-full"><Mic className={`h-5 w-5 ${showVoiceRecorder ? 'text-red-500' : ''}`} /></Button>
                  </div>
                  <Button type="submit" size="icon" disabled={!newMessage.trim() || isSending} className={`rounded-full shadow-lg h-10 w-10 ${newMessage.trim() && !isSending ? 'bg-gradient-to-r from-green-500 to-green-600' : 'bg-gray-300'}`}>
                    {isSending ? <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" /> : <Send className="h-5 w-5" />}
                  </Button>
                </div>
              </form>
            </>
          )}
        </div>
      </div>

      <EmojiPicker3D isOpen={showEmojiPicker} onEmojiSelect={handleEmojiSelect} onClose={() => setShowEmojiPicker(false)} />
      {showVoiceRecorder && <VoiceRecorder onSend={handleSendVoiceMessage} onCancel={() => setShowVoiceRecorder(false)} />}
      <CameraModal isOpen={showCameraModal} onClose={() => setShowCameraModal(false)} onCapture={handleCameraCapture} />
      <MediaPopup isOpen={showMediaPopup} onClose={() => setShowMediaPopup(false)} onTakePhoto={() => { setShowCameraModal(true); setShowMediaPopup(false); }} onSelectImage={() => { fileInputRef.current?.click(); setShowMediaPopup(false); }} />
      <input type="file" ref={fileInputRef} className="hidden" accept="image/*,video/*" onChange={handleFileSelect} />
    </div>
  );
}