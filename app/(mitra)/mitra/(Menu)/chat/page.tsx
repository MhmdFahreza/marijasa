"use client";

import React, { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { motion } from "motion/react";
import { Avatar, AvatarFallback, AvatarImage } from "@/app/components/ui/avatar";
import { Button } from "@/app/components/ui/button";
import { Input } from "@/app/components/ui/input";
import { Badge } from "@/app/components/ui/badge";
import { Tabs, TabsList, TabsTrigger } from "@/app/components/ui/tabs";
import {
  ArrowLeft,
  Send,
  Phone,
  Video,
  Smile,
  Paperclip,
  Mic,
  CheckCheck,
  Check,
  Clock,
  Search,
  Menu,
  X,
  Camera,
  Image as ImageIcon,
  Play,
  Download,
  File,
  Video as VideoIcon,
  MessageSquare,
  MoreVertical
} from "lucide-react";
import { format } from "date-fns";
import { id } from "date-fns/locale";
import EmojiPicker3D from "@/app/components/ui/emoji-picker-3d";
import CameraModal from "@/app/components/ui/camera-modal";
import {
  getChatSession,
  addMessage,
  markMessagesAsRead,
  getMitraChatSessions,
  type Message,
  type ChatSession
} from "@/app/data/chatStorage";

// VoiceRecorder Component (sama seperti sebelumnya - tidak berubah)
const VoiceRecorder = ({ onSend, onCancel }: any) => {
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
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    if (mediaRecorderRef.current) {
      mediaRecorderRef.current = null;
    }
    startTimeRef.current = null;
  };

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          sampleRate: 44100
        }
      });

      streamRef.current = stream;
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = () => {
        const blob = new Blob(audioChunksRef.current, {
          type: mediaRecorder.mimeType
        });
        setAudioBlob(blob);
        cleanup();
      };

      mediaRecorder.start();
      setIsRecording(true);

      startTimeRef.current = Date.now();
      timerRef.current = setInterval(() => {
        if (startTimeRef.current) {
          const elapsed = Math.floor((Date.now() - startTimeRef.current) / 1000);
          setRecordingTime(elapsed);
        }
      }, 100);
    } catch (error) {
      console.error('Error:', error);
      alert('Tidak dapat mengakses mikrofon');
      onCancel();
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      setIsRecording(false);
      mediaRecorderRef.current.stop();
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    }
  };

  const handleSend = () => {
    if (audioBlob) {
      onSend(audioBlob, recordingTime);
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="fixed bottom-24 right-4 md:right-8 bg-white rounded-2xl shadow-2xl border border-gray-200 p-4 z-50 w-[90%] max-w-[300px]">
      <div className="flex flex-col items-center gap-3">
        <div className="relative">
          <div className={`h-12 w-12 rounded-full flex items-center justify-center ${isRecording ? 'bg-red-500 animate-pulse' : 'bg-gray-300'}`}>
            <Mic className="h-6 w-6 text-white" />
          </div>
        </div>

        <div className="text-center">
          <div className="text-2xl font-mono font-bold text-gray-800">
            {formatTime(recordingTime)}
          </div>
          <p className="text-xs text-gray-600 mt-1">
            {isRecording ? 'Merekam...' : 'Siap dikirim'}
          </p>
        </div>

        <div className="flex gap-2 w-full">
          <Button
            onClick={onCancel}
            variant="outline"
            className="flex-1 rounded-full text-sm h-9"
          >
            <X className="h-3.5 w-3.5 mr-1" />
            Batal
          </Button>

          {isRecording ? (
            <Button
              onClick={stopRecording}
              className="flex-1 rounded-full bg-red-500 hover:bg-red-600 text-sm h-9"
            >
              Stop
            </Button>
          ) : (
            <Button
              onClick={handleSend}
              className="flex-1 rounded-full bg-green-500 hover:bg-green-600 text-sm h-9"
              disabled={!audioBlob}
            >
              <Send className="h-3.5 w-3.5 mr-1" />
              Kirim
            </Button>
          )}
        </div>
      </div>
    </div>
  );
};

// Voice Message Player Component (sama seperti sebelumnya)
const VoiceMessagePlayer = ({ msg, isMitra }: { msg: Message, isMitra: boolean }) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(msg.duration || 0);
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);

  const audioRef = useRef<HTMLAudioElement | null>(null);
  const animationFrameRef = useRef<number | null>(null);

  const waveformHeights = useRef<number[]>(
    Array.from({ length: 40 }, () => Math.random() * 60 + 40)
  );

  useEffect(() => {
    if (!msg.audioUrl) {
      setHasError(true);
      setIsLoading(false);
      return;
    }

    const audio = new Audio();
    audioRef.current = audio;

    audio.onloadedmetadata = () => {
      setDuration(Math.floor(audio.duration));
      setIsLoading(false);
      setHasError(false);
    };

    audio.onended = () => {
      setIsPlaying(false);
      setCurrentTime(0);
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
        animationFrameRef.current = null;
      }
    };

    audio.onerror = () => {
      setHasError(true);
      setIsLoading(false);
      setIsPlaying(false);
    };

    audio.src = msg.audioUrl;
    audio.load();

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
        animationFrameRef.current = null;
      }
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current.src = '';
        audioRef.current = null;
      }
    };
  }, [msg.audioUrl]);

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

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
        animationFrameRef.current = null;
      }
    };
  }, [isPlaying]);

  const handlePlayPause = () => {
    if (!audioRef.current || hasError) return;

    if (isPlaying) {
      audioRef.current.pause();
      setIsPlaying(false);
    } else {
      audioRef.current.play()
        .then(() => {
          setIsPlaying(true);
        })
        .catch(() => {
          setHasError(true);
          setIsPlaying(false);
        });
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const WaveformBars = () => {
    const heights = waveformHeights.current;
    const progressWidth = duration > 0 ? (currentTime / duration) * 100 : 0;

    return (
      <div className="relative h-8 flex-1 min-w-[120px] mr-2">
        <div className="absolute inset-0 flex items-center gap-[2px]">
          {heights.map((height, i) => {
            const barPosition = ((i + 1) / heights.length) * 100;
            const isActive = barPosition <= progressWidth;

            return (
              <div
                key={i}
                className={`flex-1 rounded-full transition-colors duration-100 ${isActive
                  ? (isMitra ? 'bg-white' : 'bg-green-500')
                  : (isMitra ? 'bg-green-300/50' : 'bg-gray-300')
                  }`}
                style={{
                  height: `${height}%`,
                  minHeight: '6px',
                  maxHeight: '100%',
                  minWidth: '2px'
                }}
              />
            );
          })}
        </div>
      </div>
    );
  };

  if (hasError) {
    return (
      <div className={`flex items-center gap-2 p-3 rounded-xl min-w-[200px] max-w-[300px] ${isMitra
        ? 'bg-gradient-to-r from-green-500 to-green-600'
        : 'bg-white border border-gray-200'
        }`}>
        <p className={`text-sm ${isMitra ? 'text-white' : 'text-gray-600'}`}>
          ⚠️ Tidak dapat memutar audio
        </p>
      </div>
    );
  }

  return (
    <div className={`flex items-center gap-3 p-2 rounded-xl min-w-[200px] max-w-[300px] ${isMitra
      ? 'bg-gradient-to-r from-green-500 to-green-600'
      : 'bg-white border border-gray-200'
      }`}>
      <button
        onClick={handlePlayPause}
        disabled={isLoading || hasError}
        className={`h-10 w-10 rounded-full flex items-center justify-center flex-shrink-0 transition-all ${isMitra
          ? 'bg-white/20 hover:bg-white/30'
          : 'bg-green-500 hover:bg-green-600'
          } ${(isLoading || hasError) ? 'opacity-50 cursor-not-allowed' : ''}`}
      >
        {isLoading ? (
          <svg className={`h-5 w-5 animate-spin ${isMitra ? 'text-white' : 'text-white'}`} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
        ) : isPlaying ? (
          <svg className={`h-5 w-5 ${isMitra ? 'text-white' : 'text-white'}`} fill="currentColor" viewBox="0 0 24 24">
            <path d="M6 4h4v16H6V4zm8 0h4v16h-4V4z" />
          </svg>
        ) : (
          <svg className={`h-5 w-5 ${isMitra ? 'text-white' : 'text-white'} ml-0.5`} fill="currentColor" viewBox="0 0 24 24">
            <path d="M8 5v14l11-7z" />
          </svg>
        )}
      </button>

      <WaveformBars />

      <div className={`text-xs font-medium whitespace-nowrap flex-shrink-0 ${isMitra ? 'text-white' : 'text-gray-600'}`}>
        {isPlaying ? formatTime(currentTime) : formatTime(duration)}
      </div>
    </div>
  );
};

// Media Popup & Media Message Components (sama seperti sebelumnya - simplified version)
const MediaPopup = ({
  isOpen,
  onClose,
  onTakePhoto,
  onSelectImage
}: {
  isOpen: boolean;
  onClose: () => void;
  onTakePhoto: () => void;
  onSelectImage: () => void;
}) => {
  if (!isOpen) return null;

  return (
    <>
      <div className="fixed inset-0 z-40 md:hidden" onClick={onClose} />
      <div className="fixed md:absolute bottom-24 left-4 md:left-6 bg-white rounded-xl shadow-2xl border border-gray-200 p-3 z-50 min-w-[180px]">
        <div className="flex flex-col gap-1">
          <button
            onClick={onTakePhoto}
            className="flex items-center gap-3 px-4 py-3 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <div className="h-9 w-9 rounded-full bg-gradient-to-r from-purple-500 to-pink-500 flex items-center justify-center">
              <Camera className="h-5 w-5 text-white" />
            </div>
            <div className="text-left">
              <p className="font-medium text-gray-800">Ambil Foto</p>
              <p className="text-xs text-gray-500">Gunakan kamera</p>
            </div>
          </button>

          <div className="h-px bg-gray-200 my-1" />

          <button
            onClick={onSelectImage}
            className="flex items-center gap-3 px-4 py-3 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <div className="h-9 w-9 rounded-full bg-gradient-to-r from-green-500 to-blue-500 flex items-center justify-center">
              <ImageIcon className="h-5 w-5 text-white" />
            </div>
            <div className="text-left">
              <p className="font-medium text-gray-800">Gambar & Video</p>
              <p className="text-xs text-gray-500">Pilih dari galeri</p>
            </div>
          </button>
        </div>

        <div className="absolute -bottom-2 left-6 w-4 h-4 bg-white border-r border-b border-gray-200 transform rotate-45" />
      </div>
    </>
  );
};

const MediaMessage = ({ msg, isMitra, timestamp }: {
  msg: Message,
  isMitra: boolean,
  timestamp: string
}) => {
  return (
    <div className={`relative overflow-hidden rounded-xl border ${isMitra ? "border-green-200" : "border-gray-200"} max-w-[240px] md:max-w-[280px]`}>
      <div className="relative">
        {msg.isImage && msg.fileUrl && (
          <img src={msg.fileUrl} alt={msg.fileName || "Gambar"} className="w-full h-auto max-h-[200px] object-cover" />
        )}
        {msg.isVideo && msg.thumbnail && (
          <img src={msg.thumbnail} alt="Video" className="w-full h-auto max-h-[200px] object-cover" />
        )}
      </div>
      <div className={`p-2 ${isMitra ? "bg-gradient-to-r from-green-500 to-green-600" : "bg-white"}`}>
        <p className={`text-xs ${isMitra ? "text-white" : "text-gray-700"}`}>{msg.fileName}</p>
      </div>
    </div>
  );
};

export default function MitraChatPage() {
  const router = useRouter();
  const [chatSessions, setChatSessions] = useState<ChatSession[]>([]);
  const [selectedSession, setSelectedSession] = useState<ChatSession | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState("all");
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [showVoiceRecorder, setShowVoiceRecorder] = useState(false);
  const [showMediaPopup, setShowMediaPopup] = useState(false);
  const [showCameraModal, setShowCameraModal] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  // Get mitra ID from localStorage
  const [mitraId, setMitraId] = useState<string | null>(null);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const mitraUser = localStorage.getItem("mitraUser");
      if (mitraUser) {
        const parsed = JSON.parse(mitraUser);
        setMitraId(parsed.id);
      }
    }
  }, []);

  // Load chat sessions for this mitra
  useEffect(() => {
    if (!mitraId) return;

    const loadSessions = () => {
      const sessions = getMitraChatSessions(mitraId);
      setChatSessions(sessions);
    };

    loadSessions();

    // Listen for chat updates
    const handleChatUpdate = () => {
      loadSessions();
      
      // Refresh current chat if one is selected
      if (selectedSession) {
        const updatedSession = getChatSession(selectedSession.userId, mitraId);
        if (updatedSession) {
          setSelectedSession(updatedSession);
          setMessages(updatedSession.messages);
          
          // Mark messages as read
          markMessagesAsRead(selectedSession.userId, mitraId, "mitra");
        }
      }
    };

    window.addEventListener('chat-update', handleChatUpdate);
    window.addEventListener('storage', handleChatUpdate);

    return () => {
      window.removeEventListener('chat-update', handleChatUpdate);
      window.removeEventListener('storage', handleChatUpdate);
    };
  }, [mitraId, selectedSession]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSelectCustomer = (session: ChatSession) => {
    if (!mitraId) return;
    
    setSelectedSession(session);
    setMessages(session.messages);
    setIsSidebarOpen(false);

    // Mark messages as read
    markMessagesAsRead(session.userId, mitraId, "mitra");
    
    // Refresh sessions to update unread count
    const sessions = getMitraChatSessions(mitraId);
    setChatSessions(sessions);
  };

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !selectedSession || !mitraId) return;

    addMessage(selectedSession.userId, mitraId, {
      senderId: mitraId,
      senderType: "mitra",
      recipientId: selectedSession.userId,
      text: newMessage,
      timestamp: new Date(),
      read: false,
    });

    setNewMessage("");
    
    // Refresh messages
    const updatedSession = getChatSession(selectedSession.userId, mitraId);
    if (updatedSession) {
      setMessages(updatedSession.messages);
      setSelectedSession(updatedSession);
    }
  };

  const handleEmojiSelect = (emoji: string) => {
    setNewMessage(prev => prev + emoji);
    setShowEmojiPicker(false);
  };

  const handleSendVoiceMessage = (audioBlob: Blob, duration: number) => {
    if (!selectedSession || !mitraId) return;

    const audioUrl = URL.createObjectURL(audioBlob);

    addMessage(selectedSession.userId, mitraId, {
      senderId: mitraId,
      senderType: "mitra",
      recipientId: selectedSession.userId,
      text: "[Pesan Suara]",
      audioUrl: audioUrl,
      timestamp: new Date(),
      read: false,
      isVoiceMessage: true,
      duration: duration
    });

    setShowVoiceRecorder(false);
    
    const updatedSession = getChatSession(selectedSession.userId, mitraId);
    if (updatedSession) {
      setMessages(updatedSession.messages);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!selectedSession || !mitraId) return;

    const files = e.target.files;
    if (!files || files.length === 0) return;

    const file = files[0];
    const fileUrl = URL.createObjectURL(file);

    const isImage = file.type.startsWith('image/');
    const isVideo = file.type.startsWith('video/');

    let thumbnail = undefined;
    if (isVideo) {
      thumbnail = "https://images.unsplash.com/photo-1563298723-dcfebaa392e3?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80";
    }

    addMessage(selectedSession.userId, mitraId, {
      senderId: mitraId,
      senderType: "mitra",
      recipientId: selectedSession.userId,
      text: isImage ? "[Gambar]" : isVideo ? "[Video]" : "[File]",
      timestamp: new Date(),
      read: false,
      isImage: isImage,
      isVideo: isVideo,
      fileUrl: fileUrl,
      fileName: file.name,
      fileType: file.type,
      fileSize: file.size,
      thumbnail: thumbnail
    });

    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
    
    const updatedSession = getChatSession(selectedSession.userId, mitraId);
    if (updatedSession) {
      setMessages(updatedSession.messages);
    }
  };

  const handlePaperclipClick = () => {
    setShowMediaPopup(!showMediaPopup);
    setShowEmojiPicker(false);
    setShowVoiceRecorder(false);
    setShowCameraModal(false);
  };

  const handleTakePhoto = () => {
    setShowCameraModal(true);
    setShowMediaPopup(false);
  };

  const handleCameraCapture = (photoBlob: Blob) => {
    if (!selectedSession || !mitraId) return;

    const fileUrl = URL.createObjectURL(photoBlob);

    addMessage(selectedSession.userId, mitraId, {
      senderId: mitraId,
      senderType: "mitra",
      recipientId: selectedSession.userId,
      text: "[Foto dari Kamera]",
      timestamp: new Date(),
      read: false,
      isImage: true,
      fileUrl: fileUrl,
      fileName: `foto_${Date.now()}.jpg`,
      fileType: "image/jpeg",
      fileSize: photoBlob.size
    });
    
    const updatedSession = getChatSession(selectedSession.userId, mitraId);
    if (updatedSession) {
      setMessages(updatedSession.messages);
    }
  };

  const handleSelectImage = () => {
    if (fileInputRef.current) {
      fileInputRef.current.accept = "image/*,video/*";
      fileInputRef.current.click();
      setShowMediaPopup(false);
    }
  };

  const formatTime = (date: Date) => {
    return format(date, "HH:mm", { locale: id });
  };

  const formatDate = (date: Date) => {
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    if (date.toDateString() === today.toDateString()) {
      return "Hari ini";
    } else if (date.toDateString() === yesterday.toDateString()) {
      return "Kemarin";
    } else {
      return format(date, "dd/MM/yyyy", { locale: id });
    }
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
    const matchesSearch = session.userName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      session.lastMessage.toLowerCase().includes(searchQuery.toLowerCase());

    if (activeTab === "unread") {
      return matchesSearch && session.mitraUnreadCount > 0;
    }
    if (activeTab === "online") {
      return matchesSearch && session.userOnline;
    }
    return matchesSearch;
  });

  const renderMessageContent = (msg: Message) => {
    const isMitra = msg.senderType === "mitra";

    if (msg.isVoiceMessage) {
      return <VoiceMessagePlayer msg={msg} isMitra={isMitra} />;
    }

    if (msg.isImage || msg.isVideo) {
      return <MediaMessage
        msg={msg}
        isMitra={isMitra}
        timestamp={formatTime(msg.timestamp)}
      />;
    }

    return <p className="text-sm md:text-base leading-relaxed break-words">{msg.text}</p>;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-green-50">
      {/* Header */}
      <motion.header
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b shadow-sm"
      >
        <div className="max-w-7xl mx-auto px-4 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => router.push("/mitra")}
                className="rounded-full hover:bg-gray-100"
              >
                <ArrowLeft className="h-5 w-5" />
              </Button>
              <div>
                <h1 className="text-xl font-bold text-gray-800">Chat Mitra</h1>
                <p className="text-sm text-gray-600">Kelola percakapan dengan pelanggan</p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Avatar className="h-8 w-8">
                <AvatarImage src="https://api.dicebear.com/7.x/avataaars/svg?seed=Mitra" />
                <AvatarFallback>MT</AvatarFallback>
              </Avatar>
            </div>
          </div>
        </div>
      </motion.header>

      <div className="max-w-7xl mx-auto px-4 py-4 md:py-6">
        <div className="flex flex-col lg:flex-row gap-4 md:gap-6">
          {/* Sidebar Chat List */}
          <div className={`
            ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}
            lg:translate-x-0 fixed lg:relative z-30 lg:z-0 w-full lg:w-1/3 xl:w-1/4
            bg-white rounded-xl shadow-lg border border-gray-200
            transition-transform duration-300 h-[calc(100vh-120px)] lg:h-[calc(100vh-180px)]
            flex flex-col
          `}>
            <div className="p-4 border-b bg-white">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-bold text-gray-800">Percakapan</h2>
                <div className="flex items-center gap-2">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="lg:hidden rounded-full hover:bg-gray-100"
                    onClick={() => setIsSidebarOpen(false)}
                  >
                    <X className="h-5 w-5" />
                  </Button>
                  <Badge className="bg-green-500 hover:bg-green-600">
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

              <Tabs defaultValue="all" value={activeTab} onValueChange={setActiveTab} className="w-full">
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
                  <p className="text-gray-400 text-xs mt-1">Menunggu pelanggan menghubungi Anda</p>
                </div>
              ) : (
                filteredChatSessions.map((session) => (
                  <div
                    key={session.id}
                    onClick={() => handleSelectCustomer(session)}
                    className={`
                      p-3 rounded-lg cursor-pointer transition-all mb-2
                      hover:bg-green-50 hover:border-green-200 hover:shadow-sm
                      ${selectedSession?.id === session.id
                        ? 'bg-green-50 border border-green-200 shadow-sm'
                        : 'border border-transparent'
                      }
                    `}
                  >
                    <div className="flex items-start gap-3">
                      <div className="relative">
                        <Avatar className="h-10 w-10 border-2 border-white">
                          <AvatarImage src={session.userAvatar} alt={session.userName} />
                          <AvatarFallback>
                            {session.userName.substring(0, 2).toUpperCase()}
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
                            {session.lastMessage.length > 30
                              ? session.lastMessage.substring(0, 30) + "..."
                              : session.lastMessage || "Mulai percakapan"
                            }
                          </p>
                          {session.mitraUnreadCount > 0 && (
                            <Badge className="bg-green-500 hover:bg-green-600 text-white rounded-full h-5 w-5 p-0 flex items-center justify-center text-xs">
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

          {/* Overlay for mobile sidebar */}
          {isSidebarOpen && (
            <div
              className="lg:hidden fixed inset-0 bg-black/50 z-20"
              onClick={() => setIsSidebarOpen(false)}
            />
          )}

          {/* Main Chat Area */}
          <div className="flex-1 flex flex-col bg-white rounded-xl shadow-lg border border-gray-200 h-[calc(100vh-120px)] lg:h-[calc(100vh-180px)]">
            {!selectedSession ? (
              <div className="flex-1 flex flex-col items-center justify-center p-6 text-center">
                <MessageSquare className="h-16 w-16 text-gray-300 mb-4" />
                <h3 className="text-lg font-semibold text-gray-700 mb-2">Pilih Percakapan</h3>
                <p className="text-gray-500 mb-6">Pilih pelanggan dari daftar untuk memulai percakapan</p>
                <Button
                  onClick={() => setIsSidebarOpen(true)}
                  className="lg:hidden bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700"
                >
                  <Menu className="h-4 w-4 mr-2" />
                  Buka Daftar Chat
                </Button>
              </div>
            ) : (
              <>
                {/* Chat Header */}
                <div className="p-4 border-b bg-white rounded-t-xl">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => setIsSidebarOpen(true)}
                        className="lg:hidden rounded-full hover:bg-gray-100"
                      >
                        <Menu className="h-5 w-5" />
                      </Button>

                      <Avatar className="h-10 w-10 border-2 border-white shadow">
                        <AvatarImage src={selectedSession.userAvatar} alt={selectedSession.userName} />
                        <AvatarFallback>
                          {selectedSession.userName.substring(0, 2).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>

                      <div>
                        <div className="flex items-center gap-2">
                          <h2 className="font-semibold text-gray-800">{selectedSession.userName}</h2>
                          {selectedSession.userOnline ? (
                            <Badge className="bg-green-500 hover:bg-green-600 text-xs px-2 py-0">
                              Online
                            </Badge>
                          ) : (
                            <Badge variant="outline" className="text-xs px-2 py-0">
                              Offline
                            </Badge>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="rounded-full hover:bg-green-50 hover:text-green-600"
                        title="Telepon"
                      >
                        <Phone className="h-5 w-5" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="rounded-full hover:bg-green-50 hover:text-green-600"
                        title="Video Call"
                      >
                        <Video className="h-5 w-5" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="rounded-full hover:bg-gray-100"
                      >
                        <MoreVertical className="h-5 w-5" />
                      </Button>
                    </div>
                  </div>
                </div>

                {/* Messages */}
                <div className="flex-1 overflow-y-auto p-4 bg-gradient-to-b from-white to-green-50/30">
                  <div className="max-w-3xl mx-auto space-y-4">
                    {messages.length === 0 ? (
                      <div className="text-center py-8">
                        <div className="text-gray-400 mb-4">
                          <MessageSquare className="w-12 h-12 mx-auto" />
                        </div>
                        <h3 className="text-lg font-semibold text-gray-700 mb-2">Mulai Percakapan</h3>
                        <p className="text-sm text-gray-500">Kirim pesan untuk memulai chat dengan {selectedSession.userName}</p>
                      </div>
                    ) : (
                      messages.map((msg, idx) => {
                        const showDate = idx === 0 ||
                          formatDate(messages[idx - 1].timestamp) !== formatDate(msg.timestamp);
                        const isMitra = msg.senderType === "mitra";

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
                              transition={{ delay: idx * 0.05 }}
                              className={`flex ${isMitra ? "justify-end" : "justify-start"} items-end`}
                            >
                              <div className="flex max-w-[85%] gap-2">
                                {!isMitra && !msg.isImage && !msg.isVideo && !msg.isVoiceMessage && (
                                  <Avatar className="h-8 w-8 mt-1 flex-shrink-0">
                                    <AvatarImage src={selectedSession.userAvatar} />
                                    <AvatarFallback className="text-xs">
                                      {selectedSession.userName.substring(0, 2).toUpperCase()}
                                    </AvatarFallback>
                                  </Avatar>
                                )}

                                <div className={`relative ${msg.isImage || msg.isVideo ? "" :
                                  isMitra
                                    ? 'bg-gradient-to-r from-green-500 to-green-600 text-white rounded-2xl rounded-br-none shadow-lg px-4 py-3'
                                    : 'bg-white border shadow-sm rounded-2xl rounded-bl-none px-4 py-3'
                                  }`}>
                                  {renderMessageContent(msg)}

                                  {(!msg.isVoiceMessage && !msg.isImage && !msg.isVideo) && (
                                    <div className={`flex items-center gap-1 mt-2 ${isMitra ? 'justify-end' : 'justify-start'}`}>
                                      <span className={`text-xs ${isMitra ? 'text-green-100' : 'text-gray-400'}`}>
                                        {formatTime(msg.timestamp)}
                                      </span>
                                      {isMitra && (
                                        <span className="text-xs">
                                          {msg.read ? (
                                            <CheckCheck className="h-3 w-3 text-green-200" />
                                          ) : msg.id === messages[messages.length - 1].id ? (
                                            <Clock className="h-3 w-3 text-green-200 animate-pulse" />
                                          ) : (
                                            <Check className="h-3 w-3 text-green-200" />
                                          )}
                                        </span>
                                      )}
                                    </div>
                                  )}

                                  {(!msg.isVoiceMessage && !msg.isImage && !msg.isVideo) && (
                                    <div className={`absolute bottom-0 w-3 h-3 ${isMitra
                                      ? '-right-1 bg-green-500'
                                      : '-left-1 bg-white border-l border-b'
                                      }`} style={{
                                        clipPath: isMitra
                                          ? "polygon(100% 0, 0 100%, 100% 100%)"
                                          : "polygon(0 0, 100% 100%, 0 100%)"
                                      }} />
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

                {/* Input */}
                <form onSubmit={handleSendMessage} className="p-4 border-t bg-white flex-shrink-0 relative">
                  <div className="max-w-3xl mx-auto">
                    <div className="flex items-center gap-2">
                      <div className="relative">
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          onClick={handlePaperclipClick}
                          className={`rounded-full hover:bg-gray-100 flex-shrink-0 ${showMediaPopup ? 'bg-gray-100' : ''}`}
                        >
                          <div className="relative">
                            <Paperclip className={`h-5 w-5 ${showMediaPopup ? 'text-green-500' : ''}`} />
                            {showMediaPopup && (
                              <div className="absolute -top-1 -right-1 h-2 w-2 rounded-full bg-green-500 animate-pulse" />
                            )}
                          </div>
                        </Button>
                      </div>

                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        onClick={() => {
                          setShowEmojiPicker(!showEmojiPicker);
                          setShowVoiceRecorder(false);
                          setShowMediaPopup(false);
                          setShowCameraModal(false);
                        }}
                        className="rounded-full hover:bg-gradient-to-r hover:from-yellow-50 hover:to-orange-50 flex-shrink-0"
                      >
                        <div className="relative">
                          <Smile className={`h-5 w-5 ${showEmojiPicker ? 'text-orange-500' : ''}`} />
                          {showEmojiPicker && (
                            <div className="absolute -top-1 -right-1 h-2 w-2 rounded-full bg-gradient-to-r from-pink-500 to-purple-500 animate-pulse" />
                          )}
                        </div>
                      </Button>

                      <div className="flex-1 relative">
                        <Input
                          value={newMessage}
                          onChange={(e) => setNewMessage(e.target.value)}
                          placeholder="Ketik pesan..."
                          className="rounded-full px-4 py-5 md:py-6 border-gray-300 focus-visible:ring-green-500 focus-visible:border-green-500 shadow-sm pr-20"
                        />
                        <div className="absolute right-2 top-1/2 transform -translate-y-1/2 flex items-center gap-1">
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            onClick={() => {
                              setShowVoiceRecorder(!showVoiceRecorder);
                              setShowEmojiPicker(false);
                              setShowMediaPopup(false);
                              setShowCameraModal(false);
                            }}
                            className={`rounded-full hover:bg-gradient-to-r hover:from-red-50 hover:to-pink-50 ${showVoiceRecorder ? 'bg-gradient-to-r from-red-50 to-pink-50' : ''}`}
                          >
                            <div className="relative">
                              <Mic className={`h-5 w-5 ${showVoiceRecorder ? 'text-red-500' : ''}`} />
                              {showVoiceRecorder && (
                                <div className="absolute -top-1 -right-1 h-2 w-2 rounded-full bg-red-500 animate-pulse" />
                              )}
                            </div>
                          </Button>
                        </div>
                      </div>

                      <Button
                        type="submit"
                        size="icon"
                        disabled={!newMessage.trim()}
                        className={`rounded-full shadow-lg hover:shadow-xl transition-all duration-300 h-10 w-10 md:h-12 md:w-12 flex-shrink-0 ${newMessage.trim()
                          ? 'bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700'
                          : 'bg-gray-300'
                          }`}
                      >
                        <Send className="h-5 w-5" />
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

      {/* Modals */}
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
        onTakePhoto={handleTakePhoto}
        onSelectImage={handleSelectImage}
      />

      <input
        type="file"
        ref={fileInputRef}
        className="hidden"
        accept="image/*,video/*"
        onChange={handleFileSelect}
        multiple={false}
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