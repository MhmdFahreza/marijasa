"use client";

import React, { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { motion } from "motion/react";
import { Avatar, AvatarFallback, AvatarImage } from "@/app/components/ui/avatar";
import { Button } from "@/app/components/ui/button";
import { Input } from "@/app/components/ui/input";
import { Card } from "@/app/components/ui/card";
import { Badge } from "@/app/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/app/components/ui/tabs";
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
  Filter,
  Menu,
  X,
  Camera,
  Image as ImageIcon,
  Play,
  Download,
  File,
  Video as VideoIcon,
  PhoneOff,
  MicOff,
  Volume2,
  UserPlus,
  MessageSquare,
  Users,
  Bell,
  MoreVertical,
  MapPin,
  Calendar,
  Shield,
  DollarSign
} from "lucide-react";
import { format } from "date-fns";
import { id } from "date-fns/locale";
import EmojiPicker3D from "@/app/components/ui/emoji-picker-3d";
import CameraModal from "@/app/components/ui/camera-modal";

// Types
interface Message {
  id: number;
  sender: "mitra" | "customer" | "system";
  text: string;
  timestamp: Date;
  read: boolean;
  isVoiceMessage?: boolean;
  audioUrl?: string;
  audioBlob?: Blob;
  duration?: number;
  isImage?: boolean;
  isVideo?: boolean;
  fileUrl?: string;
  fileName?: string;
  fileType?: string;
  fileSize?: number;
  thumbnail?: string;
}

interface ChatSession {
  customerId: string;
  customerName: string;
  customerAvatar: string;
  messages: Message[];
  lastMessage: string;
  timestamp: Date;
  unreadCount: number;
  isOnline: boolean;
}

interface Customer {
  id: string;
  name: string;
  avatar: string;
  phone?: string;
  isOnline: boolean;
  lastSeen?: Date;
}

// Mock data customers
const customers: Customer[] = [
  {
    id: "1",
    name: "Budi Santoso",
    avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Budi",
    phone: "+628123456789",
    isOnline: true,
    lastSeen: new Date()
  },
  {
    id: "2",
    name: "Sari Dewi",
    avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Sari",
    phone: "+628987654321",
    isOnline: false,
    lastSeen: new Date(Date.now() - 3600000)
  },
  {
    id: "3",
    name: "Ahmad Wijaya",
    avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Ahmad",
    isOnline: true,
    lastSeen: new Date()
  },
  {
    id: "4",
    name: "Maya Indah",
    avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Maya",
    isOnline: true,
    lastSeen: new Date()
  },
  {
    id: "5",
    name: "Rudi Hartono",
    avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Rudi",
    isOnline: false,
    lastSeen: new Date(Date.now() - 7200000)
  },
];

// Mock initial messages
const initialMessages: Record<string, Message[]> = {
  "1": [
    {
      id: 1,
      sender: "customer",
      text: "Halo, saya ingin survey lokasi untuk pemasangan AC",
      timestamp: new Date(Date.now() - 3600000),
      read: true,
    },
    {
      id: 2,
      sender: "mitra",
      text: "Halo Pak Budi, baik. Kapan Bapak ada waktu untuk survey?",
      timestamp: new Date(Date.now() - 3500000),
      read: true,
    },
    {
      id: 3,
      sender: "customer",
      text: "Besok jam 10 pagi bisa?",
      timestamp: new Date(Date.now() - 3400000),
      read: true,
    },
  ],
  "2": [
    {
      id: 1,
      sender: "customer",
      text: "Untuk jasa cleaning apartemen 2BR, berapa estimasi biayanya?",
      timestamp: new Date(Date.now() - 86400000),
      read: true,
    },
    {
      id: 2,
      sender: "mitra",
      text: "Untuk apartemen 2BR kira-kira Rp 350.000 - 450.000 tergantung kondisi",
      timestamp: new Date(Date.now() - 86300000),
      read: true,
    },
  ],
  "3": [
    {
      id: 1,
      sender: "customer",
      text: "Ada garansi untuk service AC yang dikerjakan?",
      timestamp: new Date(Date.now() - 172800000),
      read: true,
    },
  ],
};

// Storage key untuk menyimpan chat sessions
const CHAT_SESSIONS_KEY = "mitra_chat_sessions";

// Helper functions untuk localStorage
const getChatSessions = (): ChatSession[] => {
  if (typeof window === "undefined") return [];
  const stored = localStorage.getItem(CHAT_SESSIONS_KEY);
  if (!stored) {
    // Initialize with mock data
    const initialSessions: ChatSession[] = customers.map(customer => ({
      customerId: customer.id,
      customerName: customer.name,
      customerAvatar: customer.avatar,
      messages: initialMessages[customer.id] || [],
      lastMessage: initialMessages[customer.id]?.[initialMessages[customer.id].length - 1]?.text || "Mulai percakapan",
      timestamp: new Date(),
      unreadCount: customer.id === "1" ? 2 : 0,
      isOnline: customer.isOnline,
    }));
    saveChatSessions(initialSessions);
    return initialSessions;
  }
  const sessions = JSON.parse(stored);
  // Convert timestamp strings back to Date objects
  return sessions.map((session: any) => ({
    ...session,
    timestamp: new Date(session.timestamp),
    messages: session.messages.map((msg: any) => ({
      ...msg,
      timestamp: new Date(msg.timestamp)
    }))
  }));
};

const saveChatSessions = (sessions: ChatSession[]) => {
  if (typeof window === "undefined") return;
  localStorage.setItem(CHAT_SESSIONS_KEY, JSON.stringify(sessions));
};

// VoiceRecorder Component
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
    <div className="fixed inset-0 md:absolute md:bottom-24 md:left-1/2 md:transform md:-translate-x-1/2 bg-white md:rounded-2xl shadow-2xl border border-gray-200 p-6 z-50 md:min-w-[320px]">
      <div className="flex flex-col items-center gap-4">
        <div className="relative">
          <div className={`h-20 w-20 rounded-full flex items-center justify-center ${isRecording ? 'bg-red-500 animate-pulse' : 'bg-gray-300'}`}>
            <Mic className="h-10 w-10 text-white" />
          </div>
        </div>

        <div className="text-center">
          <div className="text-3xl font-mono font-bold text-gray-800">
            {formatTime(recordingTime)}
          </div>
          <p className="text-sm text-gray-600 mt-2">
            {isRecording ? 'Merekam...' : 'Siap dikirim'}
          </p>
        </div>

        <div className="flex gap-3 w-full max-w-xs">
          <Button
            onClick={onCancel}
            variant="outline"
            className="flex-1 rounded-full"
          >
            <X className="h-4 w-4 mr-2" />
            Batal
          </Button>

          {isRecording ? (
            <Button
              onClick={stopRecording}
              className="flex-1 rounded-full bg-red-500 hover:bg-red-600"
            >
              Stop
            </Button>
          ) : (
            <Button
              onClick={handleSend}
              className="flex-1 rounded-full bg-green-500 hover:bg-green-600"
              disabled={!audioBlob}
            >
              <Send className="h-4 w-4 mr-2" />
              Kirim
            </Button>
          )}
        </div>
      </div>
    </div>
  );
};

// WhatsApp-style Voice Message Player
const VoiceMessagePlayer = ({ msg, isMitra }: { msg: Message, isMitra: boolean }) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(msg.duration || 0);
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);

  const audioRef = useRef<HTMLAudioElement | null>(null);
  const animationFrameRef = useRef<number | null>(null);

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

  const progress = duration > 0 ? (currentTime / duration) * 100 : 0;

  const WaveformBars = () => {
    const bars = 40;
    const heights = Array.from({ length: bars }, () => Math.random() * 100 + 20);

    return (
      <div className="flex items-center gap-[2px] h-8 flex-1 mx-3">
        {heights.map((height, i) => {
          const barProgress = (i / bars) * 100;
          const isActive = barProgress <= progress;

          return (
            <div
              key={i}
              className={`flex-1 rounded-full transition-all duration-100 ${isActive
                  ? isMitra
                    ? 'bg-white'
                    : 'bg-green-500'
                  : isMitra
                    ? 'bg-green-300'
                    : 'bg-gray-300'
                }`}
              style={{
                height: `${height}%`,
                minHeight: '4px',
                maxHeight: '100%'
              }}
            />
          );
        })}
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
    <div className={`flex items-center gap-2 p-2 rounded-xl min-w-[200px] max-w-[300px] ${isMitra
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

      <div className={`text-xs font-medium whitespace-nowrap ${isMitra ? 'text-white' : 'text-gray-600'}`}>
        {isPlaying ? formatTime(currentTime) : formatTime(duration)}
      </div>
    </div>
  );
};

// Media Popup Component
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

// Image/Video Message Component
const MediaMessage = ({ msg, isMitra, onDownload, timestamp }: {
  msg: Message,
  isMitra: boolean,
  onDownload: () => void,
  timestamp: string
}) => {
  const [isHovered, setIsHovered] = useState(false);

  const formatFileSize = (bytes: number | undefined) => {
    if (!bytes) return "0 KB";
    if (bytes < 1024) return bytes + " B";
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + " KB";
    return (bytes / (1024 * 1024)).toFixed(1) + " MB";
  };

  return (
    <div
      className={`relative overflow-hidden rounded-xl border ${isMitra ? "border-green-200" : "border-gray-200"
        } max-w-[240px] md:max-w-[280px] transition-all duration-300 ${isHovered ? "shadow-lg scale-[1.02]" : "shadow-md"}`}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div className="relative">
        {msg.isImage ? (
          <>
            <img
              src={msg.fileUrl}
              alt={msg.fileName || "Gambar"}
              className="w-full h-auto max-h-[200px] md:max-h-[250px] object-cover"
              loading="lazy"
            />

            <div className={`absolute bottom-2 right-2 px-2 py-1 rounded text-xs font-medium ${isMitra ? "bg-black/60 text-white" : "bg-white/90 text-gray-800"
              }`}>
              {timestamp}
            </div>

            {isHovered && (
              <div className="absolute inset-0 bg-black/20 flex items-center justify-center">
                <button
                  onClick={() => window.open(msg.fileUrl, '_blank')}
                  className="bg-white/90 hover:bg-white p-2 rounded-full transition-all"
                >
                  <svg className="w-5 h-5 md:w-6 md:h-6 text-gray-800" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM10 7v3m0 0v3m0-3h3m-3 0H7"></path>
                  </svg>
                </button>
              </div>
            )}
          </>
        ) : msg.isVideo ? (
          <>
            <div className="relative">
              <img
                src={msg.thumbnail}
                alt="Video thumbnail"
                className="w-full h-auto max-h-[200px] md:max-h-[250px] object-cover"
              />

              <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent flex flex-col items-center justify-center">
                <button
                  onClick={() => window.open(msg.fileUrl, '_blank')}
                  className="bg-white/90 hover:bg-white p-3 md:p-4 rounded-full transition-all transform hover:scale-110 mb-2"
                >
                  <Play className="w-6 h-6 md:w-8 md:h-8 text-gray-800 ml-1" fill="currentColor" />
                </button>

                <div className="px-3 py-1 rounded-full bg-black/60 text-white text-xs md:text-sm font-medium">
                  Video
                </div>
              </div>
            </div>
          </>
        ) : null}
      </div>

      <div className={`p-3 ${isMitra ? "bg-gradient-to-r from-green-500 to-green-600" : "bg-white"
        }`}>
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            {msg.isImage ? (
              <div className="p-1.5 bg-white/20 rounded">
                <ImageIcon className="w-4 h-4 text-white" />
              </div>
            ) : msg.isVideo ? (
              <div className="p-1.5 bg-white/20 rounded">
                <VideoIcon className="w-4 h-4 text-white" />
              </div>
            ) : (
              <div className="p-1.5 bg-white/20 rounded">
                <File className="w-4 h-4 text-white" />
              </div>
            )}
            <div>
              <p className={`text-xs font-medium truncate max-w-[120px] md:max-w-[180px] ${isMitra ? "text-white" : "text-gray-700"
                }`}>
                {msg.fileName}
              </p>
              <p className={`text-xs ${isMitra ? "text-green-100" : "text-gray-500"}`}>
                {formatFileSize(msg.fileSize)}
              </p>
            </div>
          </div>

          <button
            onClick={onDownload}
            className={`p-1.5 rounded-full hover:bg-white/20 transition-colors ${isMitra ? "text-white" : "text-gray-600"
              }`}
            title="Download"
          >
            <Download className="w-4 h-4" />
          </button>
        </div>

        {msg.text && msg.text !== "[Gambar]" && msg.text !== "[Video]" && (
          <div className="mt-2 pt-2 border-t border-white/20">
            <p className={`text-sm ${isMitra ? "text-white" : "text-gray-800"}`}>
              {msg.text}
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

// Call Modal Component
const CallModal = ({
  isOpen,
  onClose,
  customer,
  callType
}: {
  isOpen: boolean;
  onClose: () => void;
  customer: Customer;
  callType: 'audio' | 'video';
}) => {
  const [duration, setDuration] = useState(0);
  const [isMuted, setIsMuted] = useState(false);
  const [isSpeakerOn, setIsSpeakerOn] = useState(true);

  useEffect(() => {
    let interval: NodeJS.Timeout;

    if (isOpen) {
      interval = setInterval(() => {
        setDuration(prev => prev + 1);
      }, 1000);
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isOpen]);

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black flex items-center justify-center p-4">
      <div className="relative w-full max-w-md">
        <div className="text-center mb-8">
          <div className="h-24 w-24 md:h-32 md:w-32 rounded-full border-4 border-white/20 mx-auto overflow-hidden mb-4">
            <img
              src={customer.avatar}
              alt={customer.name}
              className="h-full w-full object-cover"
            />
          </div>
          <h2 className="text-xl md:text-2xl font-bold text-white mb-2">{customer.name}</h2>
          <p className="text-white/70 mb-1">
            {callType === 'audio' ? 'Panggilan Telepon' : 'Panggilan Video'}
          </p>
          {customer.phone && (
            <p className="text-white/50 text-sm">Nomor: {customer.phone}</p>
          )}
        </div>

        <div className="text-center mb-8">
          <div className="text-3xl md:text-4xl font-mono text-white mb-2">{formatDuration(duration)}</div>
          <p className="text-white/60 text-sm">
            {callType === 'audio' ? 'Berbicara...' : 'Video call aktif...'}
          </p>
        </div>

        <div className="flex justify-center gap-3 md:gap-4 mb-8">
          <button
            onClick={() => setIsMuted(!isMuted)}
            className={`h-12 w-12 md:h-16 md:w-16 rounded-full flex items-center justify-center ${isMuted ? 'bg-red-500' : 'bg-white/20'
              } hover:bg-white/30 transition-colors`}
          >
            {isMuted ? (
              <MicOff className="h-5 w-5 md:h-6 md:w-6 text-white" />
            ) : (
              <Mic className="h-5 w-5 md:h-6 md:w-6 text-white" />
            )}
          </button>

          <button
            onClick={() => setIsSpeakerOn(!isSpeakerOn)}
            className={`h-12 w-12 md:h-16 md:w-16 rounded-full flex items-center justify-center ${isSpeakerOn ? 'bg-green-500' : 'bg-white/20'
              } hover:bg-white/30 transition-colors`}
          >
            <Volume2 className="h-5 w-5 md:h-6 md:w-6 text-white" />
          </button>

          <button
            onClick={() => alert('Fitur tambah peserta dalam pengembangan')}
            className="h-12 w-12 md:h-16 md:w-16 rounded-full bg-white/20 hover:bg-white/30 flex items-center justify-center transition-colors"
          >
            <UserPlus className="h-5 w-5 md:h-6 md:w-6 text-white" />
          </button>
        </div>

        <div className="text-center">
          <button
            onClick={onClose}
            className="h-12 w-12 md:h-16 md:w-16 rounded-full bg-red-500 hover:bg-red-600 flex items-center justify-center mx-auto transition-colors animate-pulse"
          >
            <PhoneOff className="h-6 w-6 md:h-8 md:w-8 text-white transform rotate-135" />
          </button>
          <p className="text-white/50 text-xs md:text-sm mt-4">Tekan untuk mengakhiri panggilan</p>
        </div>

        {callType === 'video' && (
          <div className="absolute bottom-4 right-4 md:bottom-6 md:right-6 h-16 w-16 md:h-24 md:w-24 rounded-lg border-2 border-white/30 overflow-hidden bg-black">
            <div className="h-full w-full bg-gradient-to-br from-green-500 to-blue-600 flex items-center justify-center">
              <div className="text-white text-xs">Anda</div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

// Incoming Call Modal Component
const IncomingCallModal = ({
  isOpen,
  onClose,
  onAccept,
  customer,
  callType
}: {
  isOpen: boolean;
  onClose: () => void;
  onAccept: () => void;
  customer: Customer;
  callType: 'audio' | 'video';
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center p-4">
      <div className="bg-gradient-to-br from-green-600 to-blue-700 rounded-2xl w-full max-w-md p-6 md:p-8 text-center">
        <div className="animate-pulse mb-6">
          <div className="h-20 w-20 md:h-24 md:w-24 rounded-full border-4 border-white/30 mx-auto overflow-hidden">
            <img
              src={customer.avatar}
              alt={customer.name}
              className="h-full w-full object-cover"
            />
          </div>
        </div>

        <h2 className="text-2xl md:text-3xl font-bold text-white mb-2">{customer.name}</h2>
        <p className="text-white/80 mb-2">
          {callType === 'audio' ? 'Panggilan Telepon Masuk' : 'Panggilan Video Masuk'}
        </p>
        {customer.phone && (
          <p className="text-white/60 text-sm mb-6 md:mb-8">Nomor: {customer.phone}</p>
        )}

        <div className="flex justify-center gap-4 md:gap-6">
          <button
            onClick={onClose}
            className="h-12 w-12 md:h-16 md:w-16 rounded-full bg-red-500 hover:bg-red-600 flex items-center justify-center transition-colors"
          >
            <PhoneOff className="h-6 w-6 md:h-8 md:w-8 text-white" />
          </button>

          <button
            onClick={onAccept}
            className="h-12 w-12 md:h-16 md:w-16 rounded-full bg-green-500 hover:bg-green-600 flex items-center justify-center transition-colors animate-pulse"
          >
            <Phone className="h-6 w-6 md:h-8 md:w-8 text-white" />
          </button>
        </div>

        <div className="mt-6 md:mt-8">
          <p className="text-white/50 text-xs md:text-sm">Geser untuk menerima atau menolak</p>
        </div>
      </div>
    </div>
  );
};

export default function MitraChatPage() {
  const router = useRouter();
  const [chatSessions, setChatSessions] = useState<ChatSession[]>([]);
  const [selectedCustomerId, setSelectedCustomerId] = useState<string | null>("1");
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState("all");
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [showVoiceRecorder, setShowVoiceRecorder] = useState(false);
  const [showMediaPopup, setShowMediaPopup] = useState(false);
  const [showCameraModal, setShowCameraModal] = useState(false);

  const [isCallActive, setIsCallActive] = useState(false);
  const [callType, setCallType] = useState<'audio' | 'video' | null>(null);
  const [incomingCall, setIncomingCall] = useState(false);
  const [incomingCallType, setIncomingCallType] = useState<'audio' | 'video'>('audio');

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  // Get selected customer
  const selectedCustomer = selectedCustomerId
    ? customers.find(c => c.id === selectedCustomerId)
    : null;

  // Get selected chat session
  const selectedSession = selectedCustomerId
    ? chatSessions.find(s => s.customerId === selectedCustomerId)
    : null;

  useEffect(() => {
    const sessions = getChatSessions();
    setChatSessions(sessions);

    if (selectedCustomerId) {
      const session = sessions.find(s => s.customerId === selectedCustomerId);
      if (session) {
        setMessages(session.messages);
      }
    }
  }, [selectedCustomerId]);

  useEffect(() => {
    if (selectedCustomerId && messages.length > 0) {
      const sessions = getChatSessions();
      const sessionIndex = sessions.findIndex(s => s.customerId === selectedCustomerId);

      if (sessionIndex >= 0) {
        const updatedSessions = [...sessions];
        updatedSessions[sessionIndex] = {
          ...updatedSessions[sessionIndex],
          messages,
          lastMessage: messages.length > 0 ? messages[messages.length - 1].text : "",
          timestamp: new Date(),
        };
        setChatSessions(updatedSessions);
        saveChatSessions(updatedSessions);
      }
    }
  }, [messages, selectedCustomerId]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSelectCustomer = (customerId: string) => {
    setSelectedCustomerId(customerId);
    setIsSidebarOpen(false);

    // Mark as read
    const sessions = [...chatSessions];
    const sessionIndex = sessions.findIndex(s => s.customerId === customerId);
    if (sessionIndex >= 0 && sessions[sessionIndex].unreadCount > 0) {
      sessions[sessionIndex].unreadCount = 0;
      setChatSessions(sessions);
      saveChatSessions(sessions);
    }
  };

  const handlePhoneCall = () => {
    if (!selectedCustomer) {
      alert('Silakan pilih customer terlebih dahulu');
      return;
    }

    setCallType('audio');
    setIsCallActive(true);

    const callMessage: Message = {
      id: messages.length + 1,
      sender: "system",
      text: `📞 Memulai panggilan telepon dengan ${selectedCustomer.name}`,
      timestamp: new Date(),
      read: true,
    };
    setMessages([...messages, callMessage]);
  };

  const handleVideoCall = () => {
    if (!selectedCustomer) {
      alert('Silakan pilih customer terlebih dahulu');
      return;
    }

    setCallType('video');
    setIsCallActive(true);

    const callMessage: Message = {
      id: messages.length + 1,
      sender: "system",
      text: `📹 Memulai panggilan video dengan ${selectedCustomer.name}`,
      timestamp: new Date(),
      read: true,
    };
    setMessages([...messages, callMessage]);
  };

  const handleEndCall = () => {
    if (isCallActive && callType && selectedCustomer) {
      const endCallMessage: Message = {
        id: messages.length + 1,
        sender: "system",
        text: `📞 Panggilan ${callType === 'audio' ? 'telepon' : 'video'} dengan ${selectedCustomer.name} telah berakhir`,
        timestamp: new Date(),
        read: true,
      };
      setMessages(prev => [...prev, endCallMessage]);
    }

    setIsCallActive(false);
    setCallType(null);
  };

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !selectedCustomerId) return;

    const newMsg: Message = {
      id: messages.length + 1,
      sender: "mitra",
      text: newMessage,
      timestamp: new Date(),
      read: true,
    };

    setMessages([...messages, newMsg]);
    setNewMessage("");

    // Simulate customer typing and reply
    setIsTyping(true);
    setTimeout(() => {
      const customerReply: Message = {
        id: messages.length + 2,
        sender: "customer",
        text: "Baik, terima kasih atas informasinya.",
        timestamp: new Date(),
        read: true,
      };
      setMessages(prev => [...prev, customerReply]);
      setIsTyping(false);
    }, 1500);
  };

  const handleEmojiSelect = (emoji: string) => {
    setNewMessage(prev => prev + emoji);
    setShowEmojiPicker(false);
  };

  const handleSendVoiceMessage = (audioBlob: Blob, duration: number) => {
    const audioUrl = URL.createObjectURL(audioBlob);

    const voiceMessage: Message = {
      id: messages.length + 1,
      sender: "mitra",
      text: "[Pesan Suara]",
      audioUrl: audioUrl,
      audioBlob: audioBlob,
      timestamp: new Date(),
      read: true,
      isVoiceMessage: true,
      duration: duration
    };

    setMessages([...messages, voiceMessage]);
    setShowVoiceRecorder(false);

    setTimeout(() => {
      const customerReply: Message = {
        id: messages.length + 2,
        sender: "customer",
        text: "Terima kasih atas penjelasannya.",
        timestamp: new Date(),
        read: true,
      };
      setMessages(prev => [...prev, customerReply]);
    }, 2000);
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
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

    const newMsg: Message = {
      id: messages.length + 1,
      sender: "mitra",
      text: isImage ? "[Gambar]" : isVideo ? "[Video]" : "[File]",
      timestamp: new Date(),
      read: true,
      isImage: isImage,
      isVideo: isVideo,
      fileUrl: fileUrl,
      fileName: file.name,
      fileType: file.type,
      fileSize: file.size,
      thumbnail: thumbnail
    };

    setMessages([...messages, newMsg]);

    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }

    setTimeout(() => {
      const customerReply: Message = {
        id: messages.length + 2,
        sender: "customer",
        text: isImage
          ? "Gambar sudah saya terima, terima kasih"
          : isVideo
            ? "Video sudah saya lihat, terima kasih"
            : "File sudah saya terima",
        timestamp: new Date(),
        read: true,
      };
      setMessages(prev => [...prev, customerReply]);
    }, 1500);
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
    const fileUrl = URL.createObjectURL(photoBlob);

    const newMsg: Message = {
      id: messages.length + 1,
      sender: "mitra",
      text: "[Foto dari Kamera]",
      timestamp: new Date(),
      read: true,
      isImage: true,
      fileUrl: fileUrl,
      fileName: `foto_${Date.now()}.jpg`,
      fileType: "image/jpeg",
      fileSize: photoBlob.size
    };

    setMessages([...messages, newMsg]);

    setTimeout(() => {
      const customerReply: Message = {
        id: messages.length + 2,
        sender: "customer",
        text: "Foto sudah saya terima, terima kasih",
        timestamp: new Date(),
        read: true,
      };
      setMessages(prev => [...prev, customerReply]);
    }, 1500);
  };

  const handleSelectImage = () => {
    if (fileInputRef.current) {
      fileInputRef.current.accept = "image/*,video/*";
      fileInputRef.current.click();
      setShowMediaPopup(false);
    }
  };

  const handleDownloadMedia = (msg: Message) => {
    if (msg.fileUrl) {
      const link = document.createElement('a');
      link.href = msg.fileUrl;
      link.download = msg.fileName || 'file';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
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
    const matchesSearch = session.customerName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      session.lastMessage.toLowerCase().includes(searchQuery.toLowerCase());

    if (activeTab === "unread") {
      return matchesSearch && session.unreadCount > 0;
    }
    if (activeTab === "online") {
      return matchesSearch && session.isOnline;
    }
    return matchesSearch;
  });

  const renderMessageContent = (msg: Message) => {
    const isMitra = msg.sender === "mitra";

    if (msg.isVoiceMessage) {
      return <VoiceMessagePlayer msg={msg} isMitra={isMitra} />;
    }

    if (msg.isImage || msg.isVideo) {
      return <MediaMessage
        msg={msg}
        isMitra={isMitra}
        onDownload={() => handleDownloadMedia(msg)}
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
              <Button
                variant="ghost"
                size="icon"
                className="rounded-full hover:bg-gray-100"
              >
                <Bell className="h-5 w-5" />
              </Button>
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
                    {chatSessions.filter(s => s.unreadCount > 0).length} baru
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
                </div>
              ) : (
                filteredChatSessions.map((session) => (
                  <div
                    key={session.customerId}
                    onClick={() => handleSelectCustomer(session.customerId)}
                    className={`
                      p-3 rounded-lg cursor-pointer transition-all mb-2
                      hover:bg-green-50 hover:border-green-200 hover:shadow-sm
                      ${selectedCustomerId === session.customerId
                        ? 'bg-green-50 border border-green-200 shadow-sm'
                        : 'border border-transparent'
                      }
                    `}
                  >
                    <div className="flex items-start gap-3">
                      <div className="relative">
                        <Avatar className="h-10 w-10 border-2 border-white">
                          <AvatarImage src={session.customerAvatar} alt={session.customerName} />
                          <AvatarFallback>
                            {session.customerName.substring(0, 2).toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        {session.isOnline && (
                          <div className="absolute -bottom-1 -right-1 h-3 w-3 rounded-full bg-green-500 border-2 border-white" />
                        )}
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between mb-1">
                          <h3 className="font-semibold text-sm text-gray-800 truncate">
                            {session.customerName}
                          </h3>
                          <span className="text-xs text-gray-500 whitespace-nowrap ml-2">
                            {formatChatTime(session.timestamp)}
                          </span>
                        </div>

                        <div className="flex items-center justify-between">
                          <p className="text-xs text-gray-600 truncate pr-2">
                            {session.lastMessage.length > 30
                              ? session.lastMessage.substring(0, 30) + "..."
                              : session.lastMessage
                            }
                          </p>
                          {session.unreadCount > 0 && (
                            <Badge className="bg-green-500 hover:bg-green-600 text-white rounded-full h-5 w-5 p-0 flex items-center justify-center text-xs">
                              {session.unreadCount}
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
            {!selectedCustomer ? (
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
                        <AvatarImage src={selectedCustomer.avatar} alt={selectedCustomer.name} />
                        <AvatarFallback>
                          {selectedCustomer.name.substring(0, 2).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>

                      <div>
                        <div className="flex items-center gap-2">
                          <h2 className="font-semibold text-gray-800">{selectedCustomer.name}</h2>
                          {selectedCustomer.isOnline ? (
                            <Badge className="bg-green-500 hover:bg-green-600 text-xs px-2 py-0">
                              Online
                            </Badge>
                          ) : (
                            <Badge variant="outline" className="text-xs px-2 py-0">
                              Offline
                            </Badge>
                          )}
                        </div>
                        {selectedCustomer.phone && (
                          <p className="text-xs text-gray-500 mt-1">
                            📞 {selectedCustomer.phone}
                          </p>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="rounded-full hover:bg-green-50 hover:text-green-600"
                        onClick={handlePhoneCall}
                        disabled={isCallActive || incomingCall}
                        title="Telepon"
                      >
                        <Phone className="h-5 w-5" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="rounded-full hover:bg-green-50 hover:text-green-600"
                        onClick={handleVideoCall}
                        disabled={isCallActive || incomingCall}
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
                        <p className="text-sm text-gray-500">Kirim pesan untuk memulai chat dengan {selectedCustomer.name}</p>
                      </div>
                    ) : (
                      messages.map((msg, idx) => {
                        const showDate = idx === 0 ||
                          formatDate(messages[idx - 1].timestamp) !== formatDate(msg.timestamp);
                        const isMitra = msg.sender === "mitra";

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
                              className={`flex ${isMitra
                                  ? "justify-end"
                                  : msg.sender === "customer"
                                    ? "justify-start"
                                    : "justify-center"
                                } items-end`}
                            >
                              {msg.sender === "system" ? (
                                <div className="bg-gray-100 border border-gray-200 rounded-full px-4 py-2 max-w-md">
                                  <p className="text-sm text-gray-600 text-center">{msg.text}</p>
                                  <p className="text-xs text-gray-400 text-center mt-1">
                                    {formatTime(msg.timestamp)}
                                  </p>
                                </div>
                              ) : (
                                <div className="flex max-w-[85%] gap-2">
                                  {!isMitra && !msg.isImage && !msg.isVideo && !msg.isVoiceMessage && (
                                    <Avatar className="h-8 w-8 mt-1 flex-shrink-0">
                                      <AvatarImage src={selectedCustomer?.avatar} />
                                      <AvatarFallback className="text-xs">
                                        {selectedCustomer?.name.substring(0, 2).toUpperCase()}
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
                                      <div className={`flex items-center gap-1 mt-2 ${isMitra ? 'justify-end' : 'justify-start'
                                        }`}>
                                        <span className={`text-xs ${isMitra ? 'text-green-100' : 'text-gray-400'
                                          }`}>
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

                                    {msg.isVoiceMessage && (
                                      <div className={`flex items-center gap-1 mt-2 ${isMitra ? 'justify-end' : 'justify-start'
                                        }`}>
                                        <span className={`text-xs ${isMitra ? 'text-green-100' : 'text-gray-400'
                                          }`}>
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
                              )}
                            </motion.div>
                          </React.Fragment>
                        );
                      })
                    )}

                    {isTyping && (
                      <motion.div
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="flex justify-start"
                      >
                        <div className="flex gap-2">
                          <Avatar className="h-8 w-8 mt-1">
                            <AvatarImage src={selectedCustomer?.avatar} />
                          </Avatar>
                          <div className="bg-white border rounded-2xl rounded-bl-none px-4 py-3 shadow-sm">
                            <div className="flex gap-1">
                              <div className="w-2 h-2 rounded-full bg-gray-300 animate-bounce" style={{ animationDelay: "0ms" }} />
                              <div className="w-2 h-2 rounded-full bg-gray-300 animate-bounce" style={{ animationDelay: "150ms" }} />
                              <div className="w-2 h-2 rounded-full bg-gray-300 animate-bounce" style={{ animationDelay: "300ms" }} />
                            </div>
                          </div>
                        </div>
                      </motion.div>
                    )}

                    <div ref={messagesEndRef} />
                  </div>
                </div>

                {/* Quick Actions */}
                <div className="px-4 py-3 bg-gradient-to-r from-green-50 to-emerald-50 border-t flex-shrink-0">
                  <div className="max-w-3xl mx-auto">
                    <div className="flex gap-2 overflow-x-auto pb-2">
                      <Button
                        variant="outline"
                        size="sm"
                        className="rounded-full whitespace-nowrap bg-white text-xs md:text-sm"
                        onClick={() => setNewMessage("Bisa survey lokasi dulu?")}
                      >
                        <MapPin className="h-3 w-3 md:h-4 md:w-4 mr-1" />
                        Survey Lokasi
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        className="rounded-full whitespace-nowrap bg-white text-xs md:text-sm"
                        onClick={() => setNewMessage("Berapa estimasi biayanya?")}
                      >
                        <DollarSign className="h-3 w-3 md:h-4 md:w-4 mr-1" />
                        Tanya Harga
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        className="rounded-full whitespace-nowrap bg-white text-xs md:text-sm"
                        onClick={() => setNewMessage("Ada jadwal besok?")}
                      >
                        <Calendar className="h-3 w-3 md:h-4 md:w-4 mr-1" />
                        Jadwal
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        className="rounded-full whitespace-nowrap bg-white text-xs md:text-sm"
                        onClick={() => setNewMessage("Apa saja garansinya?")}
                      >
                        <Shield className="h-3 w-3 md:h-4 md:w-4 mr-1" />
                        Garansi
                      </Button>
                    </div>
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
                          className={`rounded-full hover:bg-gray-100 flex-shrink-0 ${showMediaPopup ? 'bg-gray-100' : ''
                            }`}
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
                            className={`rounded-full hover:bg-gradient-to-r hover:from-red-50 hover:to-pink-50 ${showVoiceRecorder ? 'bg-gradient-to-r from-red-50 to-pink-50' : ''
                              }`}
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
      {selectedCustomer && isCallActive && callType && (
        <CallModal
          isOpen={isCallActive}
          onClose={handleEndCall}
          customer={selectedCustomer}
          callType={callType}
        />
      )}

      {selectedCustomer && (
        <IncomingCallModal
          isOpen={incomingCall}
          onClose={() => setIncomingCall(false)}
          onAccept={() => {
            setIncomingCall(false);
            setIsCallActive(true);
            setCallType(incomingCallType);
          }}
          customer={selectedCustomer}
          callType={incomingCallType}
        />
      )}

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