// app/mitra/chat/page.tsx - Fixed Audio Playback
"use client";

import React, { useState, useRef, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { motion } from "motion/react";
import { Avatar, AvatarFallback, AvatarImage } from "@/app/components/ui/avatar";
import { Button } from "@/app/components/ui/button";
import { Input } from "@/app/components/ui/input";
import { Badge } from "@/app/components/ui/badge";
import { Tabs, TabsList, TabsTrigger } from "@/app/components/ui/tabs";
import {
  ArrowLeft, Send, Phone, Video, Smile, Paperclip, Mic,
  CheckCheck, Check, Search, Menu, X, Camera, Image as ImageIcon,
  Play, Download, Video as VideoIcon, MessageSquare, MoreVertical,
} from "lucide-react";
import { format } from "date-fns";
import { id } from "date-fns/locale";
import EmojiPicker3D from "@/app/components/ui/emoji-picker-3d";
import CameraModal from "@/app/components/ui/camera-modal";
import * as chatService from "@/app/components/lib/services/chatService";
import type { Message, ChatSession } from "@/app/components/lib/services/chatService";

// VoiceRecorder Component
const VoiceRecorder = ({ onSend, onCancel }: { onSend: (blob: Blob, duration: number) => void; onCancel: () => void }) => {
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const startTimeRef = useRef<number | null>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  useEffect(() => {
    startRecording();
    return () => cleanup();
  }, []);

  const cleanup = () => {
    if (timerRef.current) clearInterval(timerRef.current);
    if (streamRef.current) streamRef.current.getTracks().forEach((track) => track.stop());
    timerRef.current = null;
    streamRef.current = null;
    mediaRecorderRef.current = null;
    startTimeRef.current = null;
  };

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: { echoCancellation: true, noiseSuppression: true, sampleRate: 44100 },
      });
      streamRef.current = stream;
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) audioChunksRef.current.push(event.data);
      };
      mediaRecorder.onstop = () => {
        const blob = new Blob(audioChunksRef.current, { type: mediaRecorder.mimeType });
        setAudioBlob(blob);
        cleanup();
      };

      mediaRecorder.start();
      setIsRecording(true);
      startTimeRef.current = Date.now();
      timerRef.current = setInterval(() => {
        if (startTimeRef.current) setRecordingTime(Math.floor((Date.now() - startTimeRef.current) / 1000));
      }, 100);
    } catch (error) {
      console.error("Error:", error);
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

  const formatTime = (seconds: number) => `${Math.floor(seconds / 60)}:${(seconds % 60).toString().padStart(2, "0")}`;

  return (
    <div className="fixed bottom-24 right-4 md:right-8 bg-white rounded-2xl shadow-2xl border border-gray-200 p-4 z-50 w-[90%] max-w-[300px]">
      <div className="flex flex-col items-center gap-3">
        <div className={`h-12 w-12 rounded-full flex items-center justify-center ${isRecording ? "bg-red-500 animate-pulse" : "bg-gray-300"}`}>
          <Mic className="h-6 w-6 text-white" />
        </div>
        <div className="text-center">
          <div className="text-2xl font-mono font-bold text-gray-800">{formatTime(recordingTime)}</div>
          <p className="text-xs text-gray-600 mt-1">{isRecording ? "Merekam..." : "Siap dikirim"}</p>
        </div>
        <div className="flex gap-2 w-full">
          <Button onClick={onCancel} variant="outline" className="flex-1 rounded-full text-sm h-9">
            <X className="h-3.5 w-3.5 mr-1" />Batal
          </Button>
          {isRecording ? (
            <Button onClick={stopRecording} className="flex-1 rounded-full bg-red-500 hover:bg-red-600 text-sm h-9">Stop</Button>
          ) : (
            <Button onClick={() => audioBlob && onSend(audioBlob, recordingTime)} className="flex-1 rounded-full bg-green-500 hover:bg-green-600 text-sm h-9" disabled={!audioBlob}>
              <Send className="h-3.5 w-3.5 mr-1" />Kirim
            </Button>
          )}
        </div>
      </div>
    </div>
  );
};

// Voice Message Player Component - FIXED
const VoiceMessagePlayer = ({ msg, isMitra }: { msg: Message; isMitra: boolean }) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(msg.duration || 0);
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const animationFrameRef = useRef<number | null>(null);
  const waveformHeights = useRef<number[]>(Array.from({ length: 40 }, () => Math.random() * 60 + 40));

  useEffect(() => {
    // Try multiple possible audio URL sources
    const audioUrl = msg.audioUrl || msg.fileUrl;
    
    console.log('VoiceMessagePlayer - Loading audio:', {
      audioUrl,
      messageType: msg.messageType,
      isVoiceMessage: msg.isVoiceMessage,
      fileUrl: msg.fileUrl,
      duration: msg.duration
    });

    if (!audioUrl) {
      console.error('No audio URL found');
      setHasError(true);
      setIsLoading(false);
      return;
    }

    const audio = new Audio();
    audioRef.current = audio;

    audio.onloadedmetadata = () => {
      console.log('Audio loaded successfully:', audio.duration);
      setDuration(msg.duration || Math.floor(audio.duration));
      setIsLoading(false);
      setHasError(false);
    };

    audio.onended = () => {
      setIsPlaying(false);
      setCurrentTime(0);
      if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);
    };

    audio.onerror = (e) => {
      console.error('Audio loading error:', e, audio.error);
      setHasError(true);
      setIsLoading(false);
      setIsPlaying(false);
    };

    audio.oncanplay = () => {
      console.log('Audio can play');
      setIsLoading(false);
    };

    // Set audio source with error handling
    try {
      audio.src = audioUrl;
      audio.load();
    } catch (error) {
      console.error('Error setting audio source:', error);
      setHasError(true);
      setIsLoading(false);
    }

    return () => {
      if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current.src = "";
        audioRef.current = null;
      }
    };
  }, [msg.audioUrl, msg.fileUrl, msg.duration]);

  useEffect(() => {
    if (isPlaying && audioRef.current) {
      const updateProgress = () => {
        if (audioRef.current && !audioRef.current.paused) {
          setCurrentTime(audioRef.current.currentTime);
          animationFrameRef.current = requestAnimationFrame(updateProgress);
        }
      };
      animationFrameRef.current = requestAnimationFrame(updateProgress);
    }
    return () => { if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current); };
  }, [isPlaying]);

  const handlePlayPause = () => {
    if (!audioRef.current || hasError) {
      console.log('Cannot play - audio ref or error:', { hasAudio: !!audioRef.current, hasError });
      return;
    }
    
    if (isPlaying) {
      audioRef.current.pause();
      setIsPlaying(false);
    } else {
      console.log('Attempting to play audio...');
      audioRef.current.play()
        .then(() => {
          console.log('Audio playing successfully');
          setIsPlaying(true);
        })
        .catch((error) => {
          console.error('Play error:', error);
          setHasError(true);
          setIsPlaying(false);
          alert('Tidak dapat memutar audio: ' + error.message);
        });
    }
  };

  const formatTimeDisplay = (seconds: number) => `${Math.floor(seconds / 60)}:${Math.floor(seconds % 60).toString().padStart(2, "0")}`;
  const progressWidth = duration > 0 ? (currentTime / duration) * 100 : 0;

  if (hasError) {
    return (
      <div className={`flex items-center gap-2 p-3 rounded-xl min-w-[200px] max-w-[300px] ${isMitra ? "bg-gradient-to-r from-green-500 to-green-600" : "bg-white border border-gray-200"}`}>
        <p className={`text-sm ${isMitra ? "text-white" : "text-gray-600"}`}>⚠️ Tidak dapat memutar audio</p>
      </div>
    );
  }

  return (
    <div className={`flex items-center gap-3 p-2 rounded-xl min-w-[200px] max-w-[300px] ${isMitra ? "bg-gradient-to-r from-green-500 to-green-600" : "bg-white border border-gray-200"}`}>
      <button onClick={handlePlayPause} disabled={isLoading} className={`h-10 w-10 rounded-full flex items-center justify-center flex-shrink-0 ${isMitra ? "bg-white/20 hover:bg-white/30" : "bg-green-500 hover:bg-green-600"} ${isLoading ? "opacity-50" : ""}`}>
        {isLoading ? (
          <svg className="h-5 w-5 animate-spin text-white" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"/></svg>
        ) : isPlaying ? (
          <svg className="h-5 w-5 text-white" fill="currentColor" viewBox="0 0 24 24"><path d="M6 4h4v16H6V4zm8 0h4v16h-4V4z"/></svg>
        ) : (
          <svg className="h-5 w-5 text-white ml-0.5" fill="currentColor" viewBox="0 0 24 24"><path d="M8 5v14l11-7z"/></svg>
        )}
      </button>
      <div className="relative h-8 flex-1 min-w-[120px] mr-2">
        <div className="absolute inset-0 flex items-center gap-[2px]">
          {waveformHeights.current.map((height, i) => (
            <div key={i} className={`flex-1 rounded-full transition-colors duration-100 ${((i + 1) / 40) * 100 <= progressWidth ? (isMitra ? "bg-white" : "bg-green-500") : (isMitra ? "bg-green-300/50" : "bg-gray-300")}`} style={{ height: `${height}%`, minHeight: "6px", minWidth: "2px" }}/>
          ))}
        </div>
      </div>
      <div className={`text-xs font-medium whitespace-nowrap flex-shrink-0 ${isMitra ? "text-white" : "text-gray-600"}`}>
        {isPlaying ? formatTimeDisplay(currentTime) : formatTimeDisplay(duration)}
      </div>
    </div>
  );
};

// Media Popup Component
const MediaPopup = ({ isOpen, onClose, onTakePhoto, onSelectImage }: { isOpen: boolean; onClose: () => void; onTakePhoto: () => void; onSelectImage: () => void; }) => {
  if (!isOpen) return null;
  return (
    <>
      <div className="fixed inset-0 z-40 md:hidden" onClick={onClose} />
      <div className="fixed md:absolute bottom-24 left-4 md:left-6 bg-white rounded-xl shadow-2xl border border-gray-200 p-3 z-50 min-w-[180px]">
        <div className="flex flex-col gap-1">
          <button onClick={onTakePhoto} className="flex items-center gap-3 px-4 py-3 hover:bg-gray-100 rounded-lg">
            <div className="h-9 w-9 rounded-full bg-gradient-to-r from-purple-500 to-pink-500 flex items-center justify-center"><Camera className="h-5 w-5 text-white"/></div>
            <div className="text-left"><p className="font-medium text-gray-800">Ambil Foto</p><p className="text-xs text-gray-500">Gunakan kamera</p></div>
          </button>
          <div className="h-px bg-gray-200 my-1" />
          <button onClick={onSelectImage} className="flex items-center gap-3 px-4 py-3 hover:bg-gray-100 rounded-lg">
            <div className="h-9 w-9 rounded-full bg-gradient-to-r from-green-500 to-blue-500 flex items-center justify-center"><ImageIcon className="h-5 w-5 text-white"/></div>
            <div className="text-left"><p className="font-medium text-gray-800">Gambar & Video</p><p className="text-xs text-gray-500">Pilih dari galeri</p></div>
          </button>
        </div>
        <div className="absolute -bottom-2 left-6 w-4 h-4 bg-white border-r border-b border-gray-200 transform rotate-45" />
      </div>
    </>
  );
};

// Media Message Component
const MediaMessage = ({ msg, isMitra, timestamp }: { msg: Message; isMitra: boolean; timestamp: string }) => {
  const safeFileUrl = msg.fileUrl || "";
  const isImage = msg.isImage || msg.messageType === "IMAGE";
  const isVideo = msg.isVideo || msg.messageType === "VIDEO";
  const [isVideoPlaying, setIsVideoPlaying] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);

  const handleDownload = () => {
    if (!msg.fileUrl) return;
    const link = document.createElement("a");
    link.href = msg.fileUrl;
    link.download = msg.fileName || "file";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const formatFileSize = (bytes: number | undefined | null) => {
    if (!bytes) return "0 KB";
    if (bytes < 1024) return bytes + " B";
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + " KB";
    return (bytes / (1024 * 1024)).toFixed(1) + " MB";
  };

  if ((isImage || isVideo) && !safeFileUrl) {
    return <div className="p-3 rounded-xl border border-gray-200 bg-white text-sm text-gray-600">⚠️ Media tidak tersedia</div>;
  }

  return (
    <div 
      className={`relative overflow-hidden rounded-xl border ${isMitra ? "border-green-200" : "border-gray-200"} max-w-[240px] md:max-w-[280px] transition-all duration-300 ${isHovered ? "shadow-lg scale-[1.02]" : "shadow-md"}`}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div className="relative">
        {isImage && (
          <>
            <img src={safeFileUrl} alt={msg.fileName || "Gambar"} className="w-full h-auto max-h-[200px] object-cover" loading="lazy"/>
            <div className={`absolute bottom-2 right-2 px-2 py-1 rounded text-xs font-medium ${isMitra ? "bg-black/60 text-white" : "bg-white/90 text-gray-800"}`}>
              {timestamp}
            </div>
            {isHovered && (
              <div className="absolute inset-0 bg-black/20 flex items-center justify-center">
                <button
                  onClick={() => window.open(safeFileUrl, "_blank")}
                  className="bg-white/90 hover:bg-white p-2 rounded-full transition-all"
                >
                  <svg className="w-6 h-6 text-gray-800" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM10 7v3m0 0v3m0-3h3m-3 0H7" />
                  </svg>
                </button>
              </div>
            )}
          </>
        )}
        {isVideo && (
          <div className="relative">
            {!isVideoPlaying && msg.thumbnail && <img src={msg.thumbnail} alt="Video" className="w-full h-auto max-h-[200px] object-cover"/>}
            <video ref={videoRef} src={safeFileUrl} className={`w-full h-auto max-h-[200px] object-cover ${!isVideoPlaying ? "hidden" : ""}`} controls={isVideoPlaying} onEnded={() => setIsVideoPlaying(false)}/>
            {!isVideoPlaying && (
              <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent flex items-center justify-center">
                <button onClick={() => { videoRef.current?.play(); setIsVideoPlaying(true); }} className="bg-white/90 hover:bg-white p-4 rounded-full transform hover:scale-110 transition-all">
                  <Play className="w-8 h-8 text-gray-800 ml-1" fill="currentColor"/>
                </button>
              </div>
            )}
          </div>
        )}
      </div>
      <div className={`p-2 ${isMitra ? "bg-gradient-to-r from-green-500 to-green-600" : "bg-white"}`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            {isImage ? <ImageIcon className={`w-4 h-4 ${isMitra ? "text-white" : "text-gray-600"}`}/> : <VideoIcon className={`w-4 h-4 ${isMitra ? "text-white" : "text-gray-600"}`}/>}
            <div>
              <p className={`text-xs font-medium truncate max-w-[140px] ${isMitra ? "text-white" : "text-gray-700"}`}>{msg.fileName}</p>
              <p className={`text-xs ${isMitra ? "text-green-100" : "text-gray-500"}`}>{formatFileSize(msg.fileSize)}</p>
            </div>
          </div>
          <button onClick={handleDownload} className={`p-1.5 rounded-full hover:bg-white/20 transition-colors ${isMitra ? "text-white" : "text-gray-600"}`}><Download className="w-4 h-4"/></button>
        </div>
      </div>
    </div>
  );
};

// Main Mitra Chat Page Component
export default function MitraChatPage() {
  const router = useRouter();
  const [currentVendor, setCurrentVendor] = useState<{ id: string; name: string; avatar: string } | null>(null);
  const [chatSessions, setChatSessions] = useState<ChatSession[]>([]);
  const [selectedSession, setSelectedSession] = useState<ChatSession | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [newMessage, setNewMessage] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState("all");
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [showVoiceRecorder, setShowVoiceRecorder] = useState(false);
  const [showMediaPopup, setShowMediaPopup] = useState(false);
  const [showCameraModal, setShowCameraModal] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isSending, setIsSending] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const pollingRef = useRef<NodeJS.Timeout | null>(null);
  const isPollingRef = useRef(false);

  // Load current vendor
  useEffect(() => {
    let isMounted = true;

    const loadCurrentVendor = async () => {
      try {
        const response = await fetch("/api/mitra/me");
        if (!response.ok) {
          console.error("Failed to load vendor");
          if (isMounted) setIsLoading(false);
          return;
        }
        const data = await response.json();
        if (data.vendor && isMounted) {
          setCurrentVendor({ 
            id: data.vendor.vendor_id || data.vendor.id, 
            name: data.vendor.name, 
            avatar: data.vendor.avatar || "https://i.pravatar.cc/120" 
          });
        }
      } catch (error) {
        console.error("Error loading vendor:", error);
      } finally {
        if (isMounted) setIsLoading(false);
      }
    };

    loadCurrentVendor();
    return () => { isMounted = false; };
  }, []);

  // Load initial chat sessions
  useEffect(() => {
    if (!currentVendor?.id) return;
    
    let isMounted = true;
    
    const loadInitialSessions = async () => {
      try {
        const sessions = await chatService.getMitraSessions(currentVendor.id);
        if (isMounted) setChatSessions(sessions);
      } catch (error) {
        console.error("Error loading sessions:", error);
      }
    };
    
    loadInitialSessions();
    return () => { isMounted = false; };
  }, [currentVendor?.id]);

  // Polling for updates
  useEffect(() => {
    if (!currentVendor?.id || isPollingRef.current) return;
    
    isPollingRef.current = true;
    
    const pollData = async () => {
      try {
        const sessions = await chatService.getMitraSessions(currentVendor.id);
        setChatSessions(prevSessions => {
          if (JSON.stringify(prevSessions) !== JSON.stringify(sessions)) return sessions;
          return prevSessions;
        });
        
        if (selectedSession?.userId) {
          const newMessages = await chatService.getMessages(selectedSession.userId, currentVendor.id);
          
          setMessages(prevMessages => {
            if (prevMessages.length !== newMessages.length || 
                JSON.stringify(prevMessages) !== JSON.stringify(newMessages)) {
              chatService.markAsRead(selectedSession.userId, currentVendor.id, "mitra");
              return newMessages;
            }
            return prevMessages;
          });
        }
      } catch (error) {
        console.error("Polling error:", error);
      }
    };

    const initialTimeout = setTimeout(pollData, 1000);
    pollingRef.current = setInterval(pollData, 3000);
    
    return () => {
      clearTimeout(initialTimeout);
      if (pollingRef.current) {
        clearInterval(pollingRef.current);
        pollingRef.current = null;
      }
      isPollingRef.current = false;
    };
  }, [currentVendor?.id, selectedSession?.userId]);

  const scrollToBottom = useCallback(() => { 
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" }); 
  }, []);
  
  useEffect(() => { 
    if (messages.length > 0) scrollToBottom(); 
  }, [messages.length, scrollToBottom]);

  const handleSelectCustomer = useCallback(async (session: ChatSession) => {
    if (!currentVendor?.id) return;
    
    setSelectedSession(session);
    setIsSidebarOpen(false);
    
    try {
      const msgs = await chatService.getMessages(session.userId, currentVendor.id);
      console.log('Loaded messages:', msgs);
      setMessages(msgs);
      
      await chatService.markAsRead(session.userId, currentVendor.id, "mitra");
      
      const sessions = await chatService.getMitraSessions(currentVendor.id);
      setChatSessions(sessions);
    } catch (error) {
      console.error("Error loading messages:", error);
    }
  }, [currentVendor?.id]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !currentVendor?.id || !selectedSession || isSending) return;
    
    const messageToSend = newMessage.trim();
    setNewMessage("");
    setIsSending(true);
    
    try {
      const sentMessage = await chatService.sendTextMessage(
        selectedSession.userId, 
        currentVendor.id, 
        currentVendor.id, 
        "mitra", 
        messageToSend
      );
      
      if (sentMessage) setMessages((prev) => [...prev, sentMessage]); 
    } catch (error) {
      console.error("Error sending message:", error);
      alert("Gagal mengirim pesan");
      setNewMessage(messageToSend);
    } finally {
      setIsSending(false);
    }
  };

  const handleSendVoiceMessage = async (audioBlob: Blob, duration: number) => {
    if (!currentVendor?.id || !selectedSession || isSending) return;
    
    setIsSending(true);
    setShowVoiceRecorder(false);
    
    try {
      const sentMessage = await chatService.sendVoiceMessage(
        selectedSession.userId, 
        currentVendor.id, 
        currentVendor.id, 
        "mitra", 
        audioBlob, 
        duration
      );
      
      if (sentMessage) {
        console.log('Voice message sent:', sentMessage);
        setMessages((prev) => [...prev, sentMessage]);
      }
    } catch (error) {
      console.error("Error sending voice:", error);
      alert("Gagal mengirim pesan suara");
    } finally {
      setIsSending(false);
    }
  };

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!currentVendor?.id || !selectedSession || isSending) return;
    
    const files = e.target.files;
    if (!files || files.length === 0) return;
    
    const file = files[0];
    const isImage = file.type.startsWith("image/");
    const isVideo = file.type.startsWith("video/");
    
    setIsSending(true);
    
    try {
      let sentMessage: Message | null = null;
      
      if (isImage) {
        sentMessage = await chatService.sendImageMessage(
          selectedSession.userId, 
          currentVendor.id, 
          currentVendor.id, 
          "mitra", 
          file
        );
      } else if (isVideo) {
        sentMessage = await chatService.sendVideoMessage(
          selectedSession.userId, 
          currentVendor.id, 
          currentVendor.id, 
          "mitra", 
          file
        );
      }
      
      if (sentMessage) {
        setMessages((prev) => [...prev, sentMessage!]);
      }
    } catch (error) {
      console.error("Error sending file:", error);
      alert("Gagal mengirim file");
    } finally {
      setIsSending(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const handleCameraCapture = async (photoBlob: Blob) => {
    if (!currentVendor?.id || !selectedSession || isSending) return;
    
    setShowCameraModal(false);
    setIsSending(true);
    
    try {
      const sentMessage = await chatService.sendImageMessage(
        selectedSession.userId, 
        currentVendor.id, 
        currentVendor.id, 
        "mitra", 
        photoBlob
      );
      
      if (sentMessage) {
        setMessages((prev) => [...prev, sentMessage]);
      }
    } catch (error) {
      console.error("Error sending photo:", error);
      alert("Gagal mengirim foto");
    } finally {
      setIsSending(false);
    }
  };

  const handleEmojiSelect = (emoji: string) => { 
    setNewMessage((prev) => prev + emoji); 
    setShowEmojiPicker(false); 
  };

  const formatTime = (date: Date) => format(date, "HH:mm", { locale: id });
  
  const formatDate = (date: Date) => {
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    if (date.toDateString() === today.toDateString()) return "Hari ini";
    if (date.toDateString() === yesterday.toDateString()) return "Kemarin";
    return format(date, "dd/MM/yyyy", { locale: id });
  };
  
  const formatChatTime = (date: Date) => {
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);
    if (diffMins < 1) return "Baru saja";
    if (diffMins < 60) return `${diffMins} menit`;
    if (diffHours < 24) return `${diffHours} jam`;
    if (diffDays === 1) return "Kemarin";
    return format(date, "dd/MM/yy", { locale: id });
  };

  const filteredChatSessions = chatSessions.filter((session) => {
    const matchesSearch = (session.userName || "").toLowerCase().includes(searchQuery.toLowerCase());
    if (activeTab === "unread") return matchesSearch && session.mitraUnreadCount > 0;
    if (activeTab === "online") return matchesSearch && session.userOnline;
    return matchesSearch;
  });

  const renderMessageContent = (msg: Message) => {
    const isMitra = msg.senderType === "mitra";
    const isVoice = msg.isVoiceMessage || msg.messageType === "VOICE";
    const isMedia = msg.isImage || msg.isVideo || msg.messageType === "IMAGE" || msg.messageType === "VIDEO";
    
    console.log('Rendering message:', { 
      id: msg.id, 
      type: msg.messageType, 
      isVoice, 
      isMedia,
      audioUrl: msg.audioUrl,
      fileUrl: msg.fileUrl 
    });
    
    if (isVoice) return <VoiceMessagePlayer msg={msg} isMitra={isMitra} />;
    if (isMedia) return <MediaMessage msg={msg} isMitra={isMitra} timestamp={formatTime(msg.timestamp)} />;
    return <p className="text-sm md:text-base leading-relaxed break-words">{msg.text}</p>;
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 to-green-50">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-green-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-gray-600">Memuat chat...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-green-50">
      <motion.header initial={{ y: -20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b shadow-sm">
        <div className="max-w-7xl mx-auto px-4 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Button variant="ghost" size="icon" onClick={() => router.push("/mitra/dashboard")} className="rounded-full hover:bg-gray-100">
                <ArrowLeft className="h-5 w-5" />
              </Button>
              <div>
                <h1 className="text-xl font-bold text-gray-800">Chat Mitra</h1>
                <p className="text-sm text-gray-600">Kelola percakapan dengan pelanggan</p>
              </div>
            </div>
            <Avatar className="h-8 w-8">
              <AvatarImage src={currentVendor?.avatar} />
              <AvatarFallback>MT</AvatarFallback>
            </Avatar>
          </div>
        </div>
      </motion.header>

      <div className="max-w-7xl mx-auto px-4 py-4 md:py-6">
        <div className="flex flex-col lg:flex-row gap-4 md:gap-6">
          <div className={`${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'} lg:translate-x-0 fixed lg:relative z-30 lg:z-0 w-full lg:w-1/3 xl:w-1/4 bg-white rounded-xl shadow-lg border border-gray-200 transition-transform duration-300 h-[calc(100vh-120px)] lg:h-[calc(100vh-180px)] flex flex-col`}>
            <div className="p-4 border-b bg-white">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-bold text-gray-800">Percakapan</h2>
                <div className="flex items-center gap-2">
                  <Button variant="ghost" size="icon" className="lg:hidden rounded-full" onClick={() => setIsSidebarOpen(false)}>
                    <X className="h-5 w-5" />
                  </Button>
                  <Badge className="bg-green-500">
                    {chatSessions.filter(s => s.mitraUnreadCount > 0).length} baru
                  </Badge>
                </div>
              </div>
              <div className="relative mb-4">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input 
                  placeholder="Cari pelanggan..." 
                  value={searchQuery} 
                  onChange={(e) => setSearchQuery(e.target.value)} 
                  className="pl-10 rounded-full border-gray-300" 
                />
              </div>
              <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                <TabsList className="grid grid-cols-3 w-full">
                  <TabsTrigger value="all" className="text-xs">Semua</TabsTrigger>
                  <TabsTrigger value="unread" className="text-xs">Belum Dibaca</TabsTrigger>
                  <TabsTrigger value="online" className="text-xs">Online</TabsTrigger>
                </TabsList>
              </Tabs>
            </div>

            <div className="flex-1 overflow-y-auto p-2">
              {filteredChatSessions.length === 0 ? (
                <div className="p-4 text-center">
                  <MessageSquare className="h-12 w-12 text-gray-300 mx-auto mb-3" />
                  <p className="text-gray-500 text-sm">Belum ada percakapan</p>
                </div>
              ) : (
                filteredChatSessions.map((session) => (
                  <div 
                    key={session.id} 
                    onClick={() => handleSelectCustomer(session)} 
                    className={`p-3 rounded-lg cursor-pointer transition-all mb-2 hover:bg-green-50 ${
                      selectedSession?.id === session.id 
                        ? 'bg-green-50 border border-green-200' 
                        : 'border border-transparent'
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <div className="relative">
                        <Avatar className="h-10 w-10">
                          <AvatarImage src={session.userAvatar} />
                          <AvatarFallback>
                            {(session.userName || "U").substring(0, 2).toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        {session.userOnline && (
                          <div className="absolute -bottom-1 -right-1 h-3 w-3 rounded-full bg-green-500 border-2 border-white" />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between mb-1">
                          <h3 className="font-semibold text-sm text-gray-800 truncate">
                            {session.userName}
                          </h3>
                          <span className="text-xs text-gray-500 whitespace-nowrap ml-2">
                            {formatChatTime(session.timestamp)}
                          </span>
                        </div>
                        <div className="flex items-center justify-between">
                          <p className="text-xs text-gray-600 truncate pr-2">
                            {(session.lastMessage || "").substring(0, 30) || "Mulai percakapan"}
                          </p>
                          {session.mitraUnreadCount > 0 && (
                            <Badge className="bg-green-500 text-white rounded-full h-5 w-5 p-0 flex items-center justify-center text-xs">
                              {session.mitraUnreadCount}
                            </Badge>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {isSidebarOpen && (
            <div 
              className="lg:hidden fixed inset-0 bg-black/50 z-20" 
              onClick={() => setIsSidebarOpen(false)} 
            />
          )}

          <div className="flex-1 flex flex-col bg-white rounded-xl shadow-lg border border-gray-200 h-[calc(100vh-120px)] lg:h-[calc(100vh-180px)]">
            {!selectedSession ? (
              <div className="flex-1 flex flex-col items-center justify-center p-6 text-center">
                <MessageSquare className="h-16 w-16 text-gray-300 mb-4" />
                <h3 className="text-lg font-semibold text-gray-700 mb-2">Pilih Percakapan</h3>
                <p className="text-gray-500 mb-6">
                  Pilih pelanggan dari daftar untuk memulai percakapan
                </p>
                <Button 
                  onClick={() => setIsSidebarOpen(true)} 
                  className="lg:hidden bg-gradient-to-r from-green-500 to-green-600"
                >
                  <Menu className="h-4 w-4 mr-2" />
                  Buka Daftar Chat
                </Button>
              </div>
            ) : (
              <>
                <div className="p-4 border-b bg-white rounded-t-xl">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        onClick={() => setIsSidebarOpen(true)} 
                        className="lg:hidden rounded-full"
                      >
                        <Menu className="h-5 w-5" />
                      </Button>
                      <Avatar className="h-10 w-10 border-2 border-white shadow">
                        <AvatarImage src={selectedSession.userAvatar} />
                        <AvatarFallback>
                          {(selectedSession.userName || "U").substring(0, 2).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <div className="flex items-center gap-2">
                          <h2 className="font-semibold text-gray-800">
                            {selectedSession.userName}
                          </h2>
                          {selectedSession.userOnline ? (
                            <Badge className="bg-green-500 text-xs px-2 py-0">Online</Badge>
                          ) : (
                            <Badge variant="outline" className="text-xs px-2 py-0">Offline</Badge>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-1">
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        className="rounded-full hover:bg-green-50 hover:text-green-600" 
                        onClick={() => selectedSession.userPhone && (window.location.href = `tel:${selectedSession.userPhone}`)}
                      >
                        <Phone className="h-5 w-5" />
                      </Button>
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        className="rounded-full hover:bg-green-50 hover:text-green-600" 
                        onClick={() => alert("Video call akan segera tersedia")}
                      >
                        <Video className="h-5 w-5" />
                      </Button>
                      <Button variant="ghost" size="icon" className="rounded-full hover:bg-gray-100">
                        <MoreVertical className="h-5 w-5" />
                      </Button>
                    </div>
                  </div>
                </div>

                <div className="flex-1 overflow-y-auto p-4 bg-gradient-to-b from-white to-green-50/30">
                  <div className="max-w-3xl mx-auto space-y-4">
                    {messages.length === 0 ? (
                      <div className="text-center py-8">
                        <MessageSquare className="w-12 h-12 mx-auto text-gray-300 mb-4" />
                        <h3 className="text-lg font-semibold text-gray-700 mb-2">Mulai Percakapan</h3>
                        <p className="text-sm text-gray-500">
                          Kirim pesan untuk memulai chat dengan {selectedSession.userName}
                        </p>
                      </div>
                    ) : (
                      messages.map((msg, idx) => {
                        const showDate = idx === 0 || formatDate(messages[idx - 1].timestamp) !== formatDate(msg.timestamp);
                        const isMitra = msg.senderType === "mitra";
                        const isVoice = msg.isVoiceMessage || msg.messageType === "VOICE";
                        const isMedia = msg.isImage || msg.isVideo || msg.messageType === "IMAGE" || msg.messageType === "VIDEO";

                        return (
                          <React.Fragment key={msg.id}>
                            {showDate && (
                              <div className="flex justify-center">
                                <Badge variant="secondary" className="rounded-full px-4 py-1 text-xs">
                                  {formatDate(msg.timestamp)}
                                </Badge>
                              </div>
                            )}
                            <motion.div 
                              initial={{ opacity: 0, y: 10 }} 
                              animate={{ opacity: 1, y: 0 }} 
                              transition={{ delay: idx * 0.02 }} 
                              className={`flex ${isMitra ? "justify-end" : "justify-start"} items-end`}
                            >
                              <div className="flex max-w-[85%] gap-2">
                                {!isMitra && !isMedia && !isVoice && (
                                  <Avatar className="h-8 w-8 mt-1 flex-shrink-0">
                                    <AvatarImage src={selectedSession.userAvatar} />
                                    <AvatarFallback className="text-xs">
                                      {(selectedSession.userName || "U").substring(0, 2).toUpperCase()}
                                    </AvatarFallback>
                                  </Avatar>
                                )}
                                <div className={`relative ${isMedia || isVoice ? "" : isMitra ? 'bg-gradient-to-r from-green-500 to-green-600 text-white rounded-2xl rounded-br-none shadow-lg px-4 py-3' : 'bg-white border shadow-sm rounded-2xl rounded-bl-none px-4 py-3'}`}>
                                  {renderMessageContent(msg)}
                                  {!isMedia && !isVoice && (
                                    <div className={`flex items-center gap-1 mt-2 ${isMitra ? 'justify-end' : 'justify-start'}`}>
                                      <span className={`text-xs ${isMitra ? 'text-green-100' : 'text-gray-400'}`}>
                                        {formatTime(msg.timestamp)}
                                      </span>
                                      {isMitra && (
                                        <span className="text-xs">
                                          {msg.isRead ? (
                                            <CheckCheck className="h-3 w-3 text-green-200" />
                                          ) : (
                                            <Check className="h-3 w-3 text-green-200" />
                                          )}
                                        </span>
                                      )}
                                    </div>
                                  )}
                                  {!isMedia && !isVoice && (
                                    <div 
                                      className={`absolute bottom-0 w-3 h-3 ${isMitra ? '-right-1 bg-green-500' : '-left-1 bg-white border-l border-b'}`} 
                                      style={{ 
                                        clipPath: isMitra 
                                          ? "polygon(100% 0, 0 100%, 100% 100%)" 
                                          : "polygon(0 0, 100% 100%, 0 100%)" 
                                      }} 
                                    />
                                  )}
                                </div>
                              </div>
                            </motion.div>
                          </React.Fragment>
                        );
                      })
                    )}
                    <div ref={messagesEndRef} />
                  </div>
                </div>

                <form onSubmit={handleSendMessage} className="p-4 border-t bg-white flex-shrink-0 relative">
                  <div className="max-w-3xl mx-auto">
                    <div className="flex items-center gap-2">
                      <Button 
                        type="button" 
                        variant="ghost" 
                        size="icon" 
                        onClick={() => { 
                          setShowMediaPopup(!showMediaPopup); 
                          setShowEmojiPicker(false); 
                          setShowVoiceRecorder(false); 
                        }} 
                        className={`rounded-full ${showMediaPopup ? 'bg-gray-100' : ''}`}
                      >
                        <Paperclip className={`h-5 w-5 ${showMediaPopup ? 'text-green-500' : ''}`} />
                      </Button>
                      <Button 
                        type="button" 
                        variant="ghost" 
                        size="icon" 
                        onClick={() => { 
                          setShowEmojiPicker(!showEmojiPicker); 
                          setShowVoiceRecorder(false); 
                          setShowMediaPopup(false); 
                        }} 
                        className="rounded-full"
                      >
                        <Smile className={`h-5 w-5 ${showEmojiPicker ? 'text-orange-500' : ''}`} />
                      </Button>
                      <div className="flex-1 relative">
                        <Input 
                          value={newMessage} 
                          onChange={(e) => setNewMessage(e.target.value)} 
                          placeholder="Ketik pesan..." 
                          className="rounded-full px-4 py-5 md:py-6 border-gray-300 focus-visible:ring-green-500 shadow-sm pr-20" 
                          disabled={isSending} 
                        />
                        <div className="absolute right-2 top-1/2 transform -translate-y-1/2">
                          <Button 
                            type="button" 
                            variant="ghost" 
                            size="icon" 
                            onClick={() => { 
                              setShowVoiceRecorder(!showVoiceRecorder); 
                              setShowEmojiPicker(false); 
                              setShowMediaPopup(false); 
                            }} 
                            className={`rounded-full ${showVoiceRecorder ? 'bg-gradient-to-r from-red-50 to-pink-50' : ''}`}
                          >
                            <Mic className={`h-5 w-5 ${showVoiceRecorder ? 'text-red-500' : ''}`} />
                          </Button>
                        </div>
                      </div>
                      <Button 
                        type="submit" 
                        size="icon" 
                        disabled={!newMessage.trim() || isSending} 
                        className={`rounded-full shadow-lg h-10 w-10 md:h-12 md:w-12 ${newMessage.trim() && !isSending ? 'bg-gradient-to-r from-green-500 to-green-600' : 'bg-gray-300'}`}
                      >
                        {isSending ? (
                          <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        ) : (
                          <Send className="h-5 w-5" />
                        )}
                      </Button>
                    </div>
                    <p className="text-xs text-gray-500 text-center mt-3">
                      Tekan Enter untuk mengirim • Pesan terenkripsi
                    </p>
                  </div>
                </form>
              </>
            )}
          </div>
        </div>
      </div>

      <EmojiPicker3D 
        isOpen={showEmojiPicker} 
        onEmojiSelect={handleEmojiSelect} 
        onClose={() => setShowEmojiPicker(false)} 
      />
      {showVoiceRecorder && (
        <VoiceRecorder 
          onSend={handleSendVoiceMessage} 
          onCancel={() => setShowVoiceRecorder(false)} 
        />
      )}
      <CameraModal 
        isOpen={showCameraModal} 
        onClose={() => setShowCameraModal(false)} 
        onCapture={handleCameraCapture} 
      />
      <MediaPopup 
        isOpen={showMediaPopup} 
        onClose={() => setShowMediaPopup(false)} 
        onTakePhoto={() => { 
          setShowCameraModal(true); 
          setShowMediaPopup(false); 
        }} 
        onSelectImage={() => { 
          if (fileInputRef.current) { 
            fileInputRef.current.accept = "image/*,video/*"; 
            fileInputRef.current.click(); 
            setShowMediaPopup(false); 
          } 
        }} 
      />
      <input 
        type="file" 
        ref={fileInputRef} 
        className="hidden" 
        accept="image/*,video/*" 
        onChange={handleFileSelect} 
      />
      {(showEmojiPicker || showVoiceRecorder || showMediaPopup || showCameraModal) && (
        <div 
          className="fixed inset-0 z-40 bg-black/20" 
          onClick={() => { 
            setShowEmojiPicker(false); 
            setShowVoiceRecorder(false); 
            setShowMediaPopup(false); 
            setShowCameraModal(false); 
          }} 
        />
      )}
    </div>
  );
}