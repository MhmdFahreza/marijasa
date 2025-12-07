"use client";

import React, { useState, useRef, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { motion } from "motion/react";
import { Avatar, AvatarFallback, AvatarImage } from "@/app/components/ui/avatar";
import { Button } from "@/app/components/ui/button";
import { Card } from "@/app/components/ui/card";
import { Input } from "@/app/components/ui/input";
import { Badge } from "@/app/components/ui/badge";
import { ArrowLeft, Send, Phone, Video, Info, MoreVertical, Smile, Paperclip, Mic, CheckCheck, Check, Clock, Search, Menu, X } from "lucide-react";
import { format } from "date-fns";
import { id } from "date-fns/locale";

// Types
interface Message {
    id: number;
    sender: "user" | "vendor";
    text: string;
    timestamp: Date;
    read: boolean;
    isVoiceMessage?: boolean;
    audioUrl?: string;
    audioBlob?: Blob;
    duration?: number;
}

interface Vendor {
    id: string;
    name: string;
    avatar: string;
    verified: boolean;
    rating: number;
    tags: string[];
}

// Mock Vendors data
const Vendors: Vendor[] = [
    {
        id: "1",
        name: "AC Service Pro",
        avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=ac-service",
        verified: true,
        rating: 4.8,
        tags: ["AC", "Elektronik"]
    }
];

// Generate mock data function
const generateMockMessages = (): Message[] => {
    const baseTime = new Date('2024-12-07T15:00:00').getTime();
    return [
        {
            id: 1,
            sender: "vendor",
            text: "Halo, ada yang bisa saya bantu?",
            timestamp: new Date(baseTime - 1000 * 60 * 30),
            read: true,
        },
        {
            id: 2,
            sender: "user",
            text: "Saya mau tanya untuk jasa pemasangan AC, berapa harganya untuk ruangan 3x4 meter?",
            timestamp: new Date(baseTime - 1000 * 60 * 25),
            read: true,
        },
        {
            id: 3,
            sender: "vendor",
            text: "Untuk ruangan segitu, AC 1/2 PK cukup. Biaya instalasi + material sekitar Rp 1.200.000 - Rp 1.500.000 tergantung kondisi dinding.",
            timestamp: new Date(baseTime - 1000 * 60 * 20),
            read: true,
        },
        {
            id: 4,
            sender: "vendor",
            text: "Ini sudah termasuk garansi instalasi 30 hari dan test tekanan freon.",
            timestamp: new Date(baseTime - 1000 * 60 * 18),
            read: true,
        },
        {
            id: 5,
            sender: "user",
            text: "Bisa survey lokasi dulu? Saya di daerah Jakarta Barat.",
            timestamp: new Date(baseTime - 1000 * 60 * 15),
            read: true,
        },
        {
            id: 6,
            sender: "vendor",
            text: "Bisa pak. Untuk Jakarta Barat kita ada jadwal besok pagi atau Kamis siang. Mana yang lebih sesuai?",
            timestamp: new Date(baseTime - 1000 * 60 * 10),
            read: true,
        },
        {
            id: 7,
            sender: "user",
            text: "Besok pagi jam 10 bisa?",
            timestamp: new Date(baseTime - 1000 * 60 * 5),
            read: true,
        },
        {
            id: 8,
            sender: "vendor",
            text: "Siap, jam 10 besok. Tolong share alamat lengkapnya ya. Nanti saya kirimkan detail teknisi dan kontak yang akan datang.",
            timestamp: new Date(baseTime - 1000 * 60 * 2),
            read: false,
        },
    ];
};

const generateChatList = () => {
    const baseTime = new Date('2024-12-07T15:00:00').getTime();
    return Vendors.slice(0, 6).map((vendor, index) => ({
        id: vendor.id,
        vendor,
        lastMessage: [
            "Siap, jam 10 besok. Tolong share alamat lengkapnya ya.",
            "Estimasi biaya untuk ruangan segitu sekitar Rp 1.500.000",
            "Bisa survey lokasi besok jam 10?",
            "Terima kasih telah menggunakan jasa kami",
            "Pesanan Anda sedang diproses",
            "Baik pak, nanti saya konfirmasi lagi"
        ][index % 6],
        timestamp: new Date(baseTime - 1000 * 60 * 60 * (index + 1)),
        unreadCount: index === 0 ? 0 : index === 2 ? 1 : 0,
        isOnline: index < 3,
    }));
};

// EmojiPicker Component
const EmojiPicker3D = ({ isOpen, onEmojiSelect, onClose }: any) => {
    if (!isOpen) return null;

    const emojis = ['😀', '😂', '😍', '🥰', '😎', '🤔', '👍', '👌', '🙏', '❤️', '🔥', '✨'];

    return (
        <div className="absolute bottom-20 left-4 bg-white rounded-2xl shadow-2xl border p-4 z-50">
            <div className="grid grid-cols-6 gap-2">
                {emojis.map((emoji, i) => (
                    <button
                        key={i}
                        onClick={() => onEmojiSelect(emoji)}
                        className="text-2xl hover:bg-gray-100 rounded-lg p-2 transition-colors"
                    >
                        {emoji}
                    </button>
                ))}
            </div>
        </div>
    );
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
        <div className="absolute bottom-20 left-1/2 transform -translate-x-1/2 bg-white rounded-2xl shadow-2xl border border-gray-200 p-6 z-50 min-w-[320px]">
            <div className="flex flex-col items-center gap-4">
                <div className="relative">
                    <div className={`h-20 w-20 rounded-full flex items-center justify-center ${isRecording ? 'bg-red-500 animate-pulse' : 'bg-gray-300'
                        }`}>
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

                <div className="flex gap-3 w-full">
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
const VoiceMessagePlayer = ({ msg }: { msg: Message }) => {
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
                                    ? msg.sender === "user"
                                        ? 'bg-white'
                                        : 'bg-blue-500'
                                    : msg.sender === "user"
                                        ? 'bg-blue-300'
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
            <div className={`flex items-center gap-2 p-3 rounded-xl min-w-[280px] max-w-[350px] ${
                msg.sender === "user"
                    ? 'bg-gradient-to-r from-blue-500 to-blue-600'
                    : 'bg-white border border-gray-200'
            }`}>
                <p className={`text-sm ${msg.sender === "user" ? 'text-white' : 'text-gray-600'}`}>
                    ⚠️ Tidak dapat memutar audio
                </p>
            </div>
        );
    }

    return (
        <div className={`flex items-center gap-2 p-2 rounded-xl min-w-[280px] max-w-[350px] ${msg.sender === "user"
                ? 'bg-gradient-to-r from-blue-500 to-blue-600'
                : 'bg-white border border-gray-200'
            }`}>
            <button
                onClick={handlePlayPause}
                disabled={isLoading || hasError}
                className={`h-10 w-10 rounded-full flex items-center justify-center flex-shrink-0 transition-all ${msg.sender === "user"
                        ? 'bg-white/20 hover:bg-white/30'
                        : 'bg-blue-500 hover:bg-blue-600'
                    } ${(isLoading || hasError) ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
                {isLoading ? (
                    <svg className={`h-5 w-5 animate-spin ${msg.sender === "user" ? 'text-white' : 'text-white'}`} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                ) : isPlaying ? (
                    <svg className={`h-5 w-5 ${msg.sender === "user" ? 'text-white' : 'text-white'}`} fill="currentColor" viewBox="0 0 24 24">
                        <path d="M6 4h4v16H6V4zm8 0h4v16h-4V4z" />
                    </svg>
                ) : (
                    <svg className={`h-5 w-5 ${msg.sender === "user" ? 'text-white' : 'text-white'} ml-0.5`} fill="currentColor" viewBox="0 0 24 24">
                        <path d="M8 5v14l11-7z" />
                    </svg>
                )}
            </button>

            <WaveformBars />

            <div className={`text-xs font-medium whitespace-nowrap ${msg.sender === "user" ? 'text-white' : 'text-gray-600'
                }`}>
                {isPlaying ? formatTime(currentTime) : formatTime(duration)}
            </div>
        </div>
    );
};

export default function ChatPage() {
    const params = useParams();
    const router = useRouter();
    const vendorId = (params?.vendorId as string) || "1";
    const vendor = Vendors.find((v) => v.id === vendorId) || Vendors[0];

    const [messages, setMessages] = useState<Message[]>(() => generateMockMessages());
    const [chatList] = useState(() => generateChatList());
    const [newMessage, setNewMessage] = useState("");
    const [isTyping, setIsTyping] = useState(false);
    const [searchQuery, setSearchQuery] = useState("");
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);
    const [showEmojiPicker, setShowEmojiPicker] = useState(false);
    const [showVoiceRecorder, setShowVoiceRecorder] = useState(false);
    const messagesEndRef = useRef<HTMLDivElement>(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    const handleSendMessage = (e: React.FormEvent) => {
        e.preventDefault();
        if (!newMessage.trim()) return;

        const newMsg: Message = {
            id: messages.length + 1,
            sender: "user",
            text: newMessage,
            timestamp: new Date(),
            read: false,
        };

        setMessages([...messages, newMsg]);
        setNewMessage("");

        setIsTyping(true);
        setTimeout(() => {
            const vendorReply: Message = {
                id: messages.length + 2,
                sender: "vendor",
                text: "Terima kasih atas pesannya. Saya akan balas secepatnya.",
                timestamp: new Date(),
                read: false,
            };
            setMessages(prev => [...prev, vendorReply]);
            setIsTyping(false);
        }, 2000);
    };

    const handleEmojiSelect = (emoji: string) => {
        setNewMessage(prev => prev + emoji);
        setShowEmojiPicker(false);
    };

    const handleSendVoiceMessage = (audioBlob: Blob, duration: number) => {
        const audioUrl = URL.createObjectURL(audioBlob);

        const voiceMessage: Message = {
            id: messages.length + 1,
            sender: "user",
            text: "[Pesan Suara]",
            audioUrl: audioUrl,
            audioBlob: audioBlob,
            timestamp: new Date(),
            read: false,
            isVoiceMessage: true,
            duration: duration
        };

        setMessages([...messages, voiceMessage]);
        setShowVoiceRecorder(false);

        setTimeout(() => {
            const vendorReply: Message = {
                id: messages.length + 2,
                sender: "vendor",
                text: "Terima kasih atas pesan suaranya. Saya dengar dan akan proses permintaannya.",
                timestamp: new Date(),
                read: false,
            };
            setMessages(prev => [...prev, vendorReply]);
        }, 3000);
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

    const filteredChats = chatList.filter((chat) =>
        chat.vendor.name.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const renderMessageContent = (msg: Message) => {
        if (msg.isVoiceMessage) {
            return <VoiceMessagePlayer msg={msg} />;
        }
        return <p className="text-sm md:text-base leading-relaxed">{msg.text}</p>;
    };

    return (
        <div className="h-screen bg-gray-50 flex overflow-hidden">
            {/* Sidebar */}
            <div className={`
        ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}
        lg:translate-x-0 fixed lg:relative z-30 w-80 bg-white border-r 
        transition-transform duration-300 h-full flex flex-col
      `}>
                <div className="p-4 border-b bg-white">
                    <div className="flex items-center justify-between mb-4">
                        <h2 className="text-xl font-bold text-gray-800">Pesan</h2>
                        <Button
                            variant="ghost"
                            size="icon"
                            className="lg:hidden"
                            onClick={() => setIsSidebarOpen(false)}
                            suppressHydrationWarning
                        >
                            <X className="h-5 w-5" />
                        </Button>
                    </div>

                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                        <Input
                            placeholder="Cari vendor..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="pl-10 rounded-full border-gray-300"
                            suppressHydrationWarning
                        />
                    </div>
                </div>

                <div className="flex-1 overflow-y-auto">
                    {filteredChats.map((chat) => (
                        <div
                            key={chat.id}
                            onClick={() => {
                                router.replace(`/chat/${chat.id}`);
                                setIsSidebarOpen(false);
                            }}
                            className={`
                p-4 border-b cursor-pointer transition-colors hover:bg-gray-50
                ${chat.id === vendorId ? 'bg-blue-50 border-l-4 border-l-blue-500' : ''}
              `}
                        >
                            <div className="flex items-start gap-3">
                                <div className="relative">
                                    <Avatar className="h-12 w-12 border-2 border-white shadow">
                                        <AvatarImage src={chat.vendor.avatar} alt={chat.vendor.name} />
                                        <AvatarFallback>
                                            {chat.vendor.name.substring(0, 2).toUpperCase()}
                                        </AvatarFallback>
                                    </Avatar>
                                    {chat.isOnline && (
                                        <div className="absolute -bottom-1 -right-1 h-3 w-3 rounded-full bg-green-500 border-2 border-white" />
                                    )}
                                </div>

                                <div className="flex-1 min-w-0">
                                    <div className="flex items-start justify-between mb-1">
                                        <div className="flex items-center gap-2">
                                            <h3 className="font-semibold text-sm text-gray-800 truncate">
                                                {chat.vendor.name}
                                            </h3>
                                            {chat.vendor.verified && (
                                                <Badge className="bg-green-500 hover:bg-green-600 text-xs px-1.5 py-0">
                                                    ✓
                                                </Badge>
                                            )}
                                        </div>
                                        <span className="text-xs text-gray-500 whitespace-nowrap ml-2">
                                            {formatChatTime(chat.timestamp)}
                                        </span>
                                    </div>

                                    <div className="flex items-center justify-between">
                                        <p className="text-sm text-gray-600 truncate pr-2">
                                            {chat.lastMessage}
                                        </p>
                                        {chat.unreadCount > 0 && (
                                            <Badge className="bg-blue-500 hover:bg-blue-600 text-white rounded-full h-5 w-5 p-0 flex items-center justify-center text-xs flex-shrink-0">
                                                {chat.unreadCount}
                                            </Badge>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {isSidebarOpen && (
                <div
                    className="lg:hidden fixed inset-0 bg-black/50 z-20"
                    onClick={() => setIsSidebarOpen(false)}
                />
            )}

            {/* Main Chat Area */}
            <div className="flex-1 flex flex-col h-full relative">
                {/* Header */}
                <motion.header
                    initial={{ y: -20, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    className="bg-white border-b shadow-sm z-20 flex-shrink-0"
                >
                    <div className="px-4 py-3">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    onClick={() => setIsSidebarOpen(true)}
                                    className="lg:hidden rounded-full hover:bg-gray-100"
                                    suppressHydrationWarning
                                >
                                    <Menu className="h-5 w-5" />
                                </Button>

                                <Button
                                    variant="ghost"
                                    size="icon"
                                    onClick={() => router.push(`/jasa/detailjasa/${vendorId}`)}
                                    className="rounded-full hover:bg-gray-100"
                                    suppressHydrationWarning
                                >
                                    <ArrowLeft className="h-5 w-5" />
                                </Button>

                                <Avatar className="h-10 w-10 border-2 border-white shadow">
                                    <AvatarImage src={vendor.avatar} alt={vendor.name} />
                                    <AvatarFallback>
                                        {vendor.name.substring(0, 2).toUpperCase()}
                                    </AvatarFallback>
                                </Avatar>

                                <div>
                                    <div className="flex items-center gap-2">
                                        <h1 className="font-semibold text-gray-800">{vendor.name}</h1>
                                        {vendor.verified && (
                                            <Badge className="bg-green-500 hover:bg-green-600 text-xs">
                                                Verified
                                            </Badge>
                                        )}
                                    </div>
                                    <div className="flex items-center gap-1">
                                        <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                                        <p className="text-xs text-green-600">Online</p>
                                    </div>
                                </div>
                            </div>

                            <div className="flex items-center gap-1">
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    className="rounded-full hover:bg-blue-50 hover:text-blue-600"
                                    suppressHydrationWarning
                                >
                                    <Phone className="h-5 w-5" />
                                </Button>
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    className="rounded-full hover:bg-blue-50 hover:text-blue-600"
                                    suppressHydrationWarning
                                >
                                    <Video className="h-5 w-5" />
                                </Button>
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    className="rounded-full hover:bg-blue-50 hover:text-blue-600"
                                    suppressHydrationWarning
                                >
                                    <Info className="h-5 w-5" />
                                </Button>
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    className="rounded-full hover:bg-blue-50 hover:text-blue-600"
                                    suppressHydrationWarning
                                >
                                    <MoreVertical className="h-5 w-5" />
                                </Button>
                            </div>
                        </div>
                    </div>
                </motion.header>

                {/* Messages */}
                <div className="flex-1 overflow-y-auto p-6 bg-gradient-to-b from-white to-blue-50/30">
                    <div className="max-w-4xl mx-auto space-y-6">
                        {messages.map((msg, idx) => {
                            const showDate = idx === 0 ||
                                formatDate(messages[idx - 1].timestamp) !== formatDate(msg.timestamp);

                            return (
                                <React.Fragment key={msg.id}>
                                    {showDate && (
                                        <div className="flex justify-center">
                                            <Badge variant="secondary" className="rounded-full px-4 py-1">
                                                {formatDate(msg.timestamp)}
                                            </Badge>
                                        </div>
                                    )}

                                    <motion.div
                                        initial={{ opacity: 0, y: 10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ delay: idx * 0.05 }}
                                        className={`flex ${msg.sender === "user" ? "justify-end" : "justify-start"}`}
                                    >
                                        <div className="flex max-w-[85%] gap-2">
                                            {msg.sender === "vendor" && (
                                                <Avatar className="h-8 w-8 mt-1 flex-shrink-0">
                                                    <AvatarImage src={vendor.avatar} />
                                                    <AvatarFallback className="text-xs">
                                                        {vendor.name.substring(0, 2).toUpperCase()}
                                                    </AvatarFallback>
                                                </Avatar>
                                            )}

                                            <div className={`relative rounded-2xl ${msg.isVoiceMessage
                                                    ? msg.sender === "user"
                                                        ? "bg-gradient-to-r from-blue-500 to-blue-600 rounded-br-none shadow-lg"
                                                        : "bg-white border shadow-sm rounded-bl-none"
                                                    : msg.sender === "user"
                                                        ? "bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-br-none shadow-lg px-4 py-3"
                                                        : "bg-white border shadow-sm rounded-bl-none px-4 py-3"
                                                }`}>
                                                {renderMessageContent(msg)}
                                                {!msg.isVoiceMessage && (
                                                    <div className={`flex items-center gap-1 mt-2 ${msg.sender === "user" ? "justify-end" : "justify-start"}`}>
                                                        <span className={`text-xs ${msg.sender === "user" ? "text-blue-100" : "text-gray-400"}`}>
                                                            {formatTime(msg.timestamp)}
                                                        </span>
                                                        {msg.sender === "user" && (
                                                            <span className="text-xs">
                                                                {msg.read ? (
                                                                    <CheckCheck className="h-3 w-3 text-blue-200" />
                                                                ) : msg.id === messages[messages.length - 1].id ? (
                                                                    <Clock className="h-3 w-3 text-blue-200 animate-pulse" />
                                                                ) : (
                                                                    <Check className="h-3 w-3 text-blue-200" />
                                                                )}
                                                            </span>
                                                        )}
                                                    </div>
                                                )}

                                                {msg.isVoiceMessage && (
                                                    <div className={`flex items-center gap-1 mt-1 px-2 pb-1 ${msg.sender === "user" ? "justify-end" : "justify-start"}`}>
                                                        <span className={`text-xs ${msg.sender === "user" ? "text-blue-100" : "text-gray-400"}`}>
                                                            {formatTime(msg.timestamp)}
                                                        </span>
                                                        {msg.sender === "user" && (
                                                            <span className="text-xs">
                                                                {msg.read ? (
                                                                    <CheckCheck className="h-3 w-3 text-blue-200" />
                                                                ) : msg.id === messages[messages.length - 1].id ? (
                                                                    <Clock className="h-3 w-3 text-blue-200 animate-pulse" />
                                                                ) : (
                                                                    <Check className="h-3 w-3 text-blue-200" />
                                                                )}
                                                            </span>
                                                        )}
                                                    </div>
                                                )}

                                                {!msg.isVoiceMessage && (
                                                    <div className={`absolute bottom-0 w-3 h-3 ${msg.sender === "user"
                                                        ? "-right-1 bg-blue-500"
                                                        : "-left-1 bg-white border-l border-b"
                                                        }`} style={{
                                                            clipPath: msg.sender === "user"
                                                                ? "polygon(100% 0, 0 100%, 100% 100%)"
                                                                : "polygon(0 0, 100% 100%, 0 100%)"
                                                        }} />
                                                )}
                                            </div>
                                        </div>
                                    </motion.div>
                                </React.Fragment>
                            );
                        })}

                        {isTyping && (
                            <motion.div
                                initial={{ opacity: 0, scale: 0.9 }}
                                animate={{ opacity: 1, scale: 1 }}
                                className="flex justify-start"
                            >
                                <div className="flex gap-2">
                                    <Avatar className="h-8 w-8 mt-1">
                                        <AvatarImage src={vendor.avatar} />
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

                {(showEmojiPicker || showVoiceRecorder) && (
                    <div
                        className="fixed inset-0 z-40 bg-black/20"
                        onClick={() => {
                            setShowEmojiPicker(false);
                            setShowVoiceRecorder(false);
                        }}
                    />
                )}

                {/* Quick Actions */}
                <div className="px-6 py-3 bg-gradient-to-r from-blue-50 to-indigo-50 border-t flex-shrink-0">
                    <div className="max-w-4xl mx-auto">
                        <div className="flex gap-2 overflow-x-auto pb-2">
                            <Button
                                variant="outline"
                                size="sm"
                                className="rounded-full whitespace-nowrap bg-white"
                                onClick={() => setNewMessage("Bisa survey lokasi dulu?")}
                                suppressHydrationWarning
                            >
                                📍 Survey Lokasi
                            </Button>
                            <Button
                                variant="outline"
                                size="sm"
                                className="rounded-full whitespace-nowrap bg-white"
                                onClick={() => setNewMessage("Berapa estimasi biayanya?")}
                                suppressHydrationWarning
                            >
                                💰 Tanya Harga
                            </Button>
                            <Button
                                variant="outline"
                                size="sm"
                                className="rounded-full whitespace-nowrap bg-white"
                                onClick={() => setNewMessage("Ada jadwal besok?")}
                                suppressHydrationWarning
                            >
                                📅 Jadwal
                            </Button>
                            <Button
                                variant="outline"
                                size="sm"
                                className="rounded-full whitespace-nowrap bg-white"
                                onClick={() => setNewMessage("Apa saja garansinya?")}
                                suppressHydrationWarning
                            >
                                ⚡ Garansi
                            </Button>
                        </div>
                    </div>
                </div>

                {/* Input */}
                <form onSubmit={handleSendMessage} className="p-4 border-t bg-white flex-shrink-0 relative">
                    <div className="max-w-4xl mx-auto">
                        <div className="flex items-center gap-2">
                            <Button
                                type="button"
                                variant="ghost"
                                size="icon"
                                className="rounded-full hover:bg-gray-100 flex-shrink-0"
                                suppressHydrationWarning
                            >
                                <Paperclip className="h-5 w-5" />
                            </Button>

                            <Button
                                type="button"
                                variant="ghost"
                                size="icon"
                                onClick={() => {
                                    setShowEmojiPicker(!showEmojiPicker);
                                    setShowVoiceRecorder(false);
                                }}
                                className="rounded-full hover:bg-gradient-to-r hover:from-yellow-50 hover:to-orange-50 flex-shrink-0"
                                suppressHydrationWarning
                            >
                                <div className="relative">
                                    <Smile className="h-5 w-5" />
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
                                    className="rounded-full px-4 py-6 border-gray-300 focus-visible:ring-blue-500 focus-visible:border-blue-500 shadow-sm pr-24"
                                    suppressHydrationWarning
                                />
                                <div className="absolute right-2 top-1/2 transform -translate-y-1/2 flex items-center gap-1">
                                    <Button
                                        type="button"
                                        variant="ghost"
                                        size="icon"
                                        onClick={() => {
                                            setShowVoiceRecorder(!showVoiceRecorder);
                                            setShowEmojiPicker(false);
                                        }}
                                        className={`rounded-full hover:bg-gradient-to-r hover:from-red-50 hover:to-pink-50 ${showVoiceRecorder ? 'bg-gradient-to-r from-red-50 to-pink-50' : ''
                                            }`}
                                        suppressHydrationWarning
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
                                className={`rounded-full shadow-lg hover:shadow-xl transition-all duration-300 h-12 w-12 flex-shrink-0 ${newMessage.trim()
                                        ? 'bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700'
                                        : 'bg-gray-300'
                                    }`}
                                suppressHydrationWarning
                            >
                                <Send className="h-5 w-5" />
                            </Button>
                        </div>

                        <p className="text-xs text-gray-500 text-center mt-3">
                            Tekan Enter untuk mengirim • Pesan terenkripsi • Jangan bagikan data pribadi
                        </p>
                    </div>
                </form>
            </div>
        </div>
    );
}