// app/components/ui/call-modal.tsx
"use client";

import React, { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Phone,
  PhoneOff,
  Video,
  VideoOff,
  Mic,
  MicOff,
  Volume2,
  X,
  Maximize,
  Minimize,
  RotateCcw,
  Shield,
} from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/app/components/ui/avatar';
import { Button } from '@/app/components/ui/button';
import { CallType } from '@/app/components/lib/services/callService';
import { CallState } from '@/app/components/lib/hooks/useWebRTC';

export interface CallModalProps {
  callState: CallState;
  isIncoming: boolean;
  callType: CallType;
  callerName: string;
  callerAvatar: string;
  localStream: MediaStream | null;
  remoteStream: MediaStream | null;
  isMuted: boolean;
  isVideoEnabled: boolean;
  callDuration: number;
  onAccept: () => void;
  onReject: () => void;
  onEnd: () => void;
  onToggleMute: () => void;
  onToggleVideo: () => void;
  onClose: () => void;
}

export default function CallModal({
  callState,
  isIncoming,
  callType,
  callerName,
  callerAvatar,
  localStream,
  remoteStream,
  isMuted,
  isVideoEnabled,
  callDuration,
  onAccept,
  onReject,
  onEnd,
  onToggleMute,
  onToggleVideo,
  onClose,
}: CallModalProps) {
  const localVideoRef = useRef<HTMLVideoElement>(null);
  const remoteVideoRef = useRef<HTMLVideoElement>(null);
  const ringtoneRef = useRef<HTMLAudioElement | null>(null);
  
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isSpeakerOn, setIsSpeakerOn] = useState(true);
  const [isFrontCamera, setIsFrontCamera] = useState(true);

  // Set up local video stream
  useEffect(() => {
    if (localVideoRef.current && localStream) {
      localVideoRef.current.srcObject = localStream;
    }
  }, [localStream]);

  // Set up remote video stream
  useEffect(() => {
    if (remoteVideoRef.current && remoteStream) {
      remoteVideoRef.current.srcObject = remoteStream;
    }
  }, [remoteStream]);

  // Play ringtone for incoming calls
  useEffect(() => {
    if (isIncoming && callState === 'ringing') {
      try {
        ringtoneRef.current = new Audio('/sounds/ringtone.mp3');
        ringtoneRef.current.loop = true;
        ringtoneRef.current.play().catch(console.error);
      } catch (error) {
        console.error('Error playing ringtone:', error);
      }
    }

    return () => {
      if (ringtoneRef.current) {
        ringtoneRef.current.pause();
        ringtoneRef.current = null;
      }
    };
  }, [isIncoming, callState]);

  // Stop ringtone when call state changes
  useEffect(() => {
    if (callState !== 'ringing' && ringtoneRef.current) {
      ringtoneRef.current.pause();
      ringtoneRef.current = null;
    }
  }, [callState]);

  // Format duration
  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // Get status text
  const getStatusText = () => {
    switch (callState) {
      case 'calling':
        return 'Memanggil...';
      case 'ringing':
        return isIncoming ? 'Panggilan masuk' : 'Berdering...';
      case 'connecting':
        return 'Menghubungkan...';
      case 'connected':
        return formatDuration(callDuration);
      case 'ended':
        return 'Panggilan berakhir';
      default:
        return '';
    }
  };

  // Toggle fullscreen
  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen();
      setIsFullscreen(true);
    } else {
      document.exitFullscreen();
      setIsFullscreen(false);
    }
  };

  // Switch camera
  const switchCamera = async () => {
    if (!localStream) return;
    
    const videoTrack = localStream.getVideoTracks()[0];
    if (!videoTrack) return;

    try {
      const constraints = {
        video: { facingMode: isFrontCamera ? 'environment' : 'user' }
      };
      
      const newStream = await navigator.mediaDevices.getUserMedia(constraints);
      const newVideoTrack = newStream.getVideoTracks()[0];
      
      // Replace track
      if (localVideoRef.current) {
        const sender = localVideoRef.current.srcObject as MediaStream;
        sender.removeTrack(videoTrack);
        sender.addTrack(newVideoTrack);
        videoTrack.stop();
      }
      
      setIsFrontCamera(!isFrontCamera);
    } catch (error) {
      console.error('Error switching camera:', error);
    }
  };

  // Render video call UI
  const renderVideoCall = () => (
    <div className="relative w-full h-full bg-black">
      {/* Remote video (full screen) */}
      <video
        ref={remoteVideoRef}
        autoPlay
        playsInline
        className="w-full h-full object-cover"
      />

      {/* Local video (picture-in-picture) */}
      <div className="absolute top-4 right-4 w-32 h-44 md:w-40 md:h-56 rounded-2xl overflow-hidden shadow-2xl border-2 border-white/30">
        <video
          ref={localVideoRef}
          autoPlay
          playsInline
          muted
          className="w-full h-full object-cover"
          style={{ transform: 'scaleX(-1)' }}
        />
        {!isVideoEnabled && (
          <div className="absolute inset-0 bg-gray-900 flex items-center justify-center">
            <VideoOff className="w-8 h-8 text-white/50" />
          </div>
        )}
      </div>

      {/* No remote video placeholder */}
      {!remoteStream && (
        <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-gray-900 to-gray-800">
          <div className="text-center">
            <Avatar className="w-32 h-32 mx-auto mb-4 border-4 border-white/20">
              <AvatarImage src={callerAvatar} />
              <AvatarFallback className="text-4xl bg-gradient-to-br from-blue-500 to-purple-600 text-white">
                {callerName.substring(0, 2).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <h2 className="text-2xl font-bold text-white mb-2">{callerName}</h2>
            <p className="text-white/70">{getStatusText()}</p>
          </div>
        </div>
      )}
    </div>
  );

  // Render voice call UI
  const renderVoiceCall = () => (
    <div className="flex-1 flex flex-col items-center justify-center p-8 bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900">
      {/* Animated rings */}
      <div className="relative mb-8">
        {callState === 'ringing' && (
          <>
            <motion.div
              className="absolute inset-0 rounded-full border-2 border-green-400/30"
              initial={{ scale: 1, opacity: 0.5 }}
              animate={{ scale: 2, opacity: 0 }}
              transition={{ duration: 1.5, repeat: Infinity }}
            />
            <motion.div
              className="absolute inset-0 rounded-full border-2 border-green-400/30"
              initial={{ scale: 1, opacity: 0.5 }}
              animate={{ scale: 2, opacity: 0 }}
              transition={{ duration: 1.5, repeat: Infinity, delay: 0.5 }}
            />
          </>
        )}
        
        <Avatar className="w-32 h-32 border-4 border-white/20 shadow-2xl">
          <AvatarImage src={callerAvatar} />
          <AvatarFallback className="text-4xl bg-gradient-to-br from-green-500 to-blue-600 text-white">
            {callerName.substring(0, 2).toUpperCase()}
          </AvatarFallback>
        </Avatar>
      </div>

      <h2 className="text-2xl md:text-3xl font-bold text-white mb-2">{callerName}</h2>
      <p className="text-white/70 text-lg mb-4">{getStatusText()}</p>
      
      {/* Encryption badge */}
      <div className="flex items-center gap-2 text-green-400/80 text-sm">
        <Shield className="w-4 h-4" />
        <span>Terenkripsi end-to-end</span>
      </div>
    </div>
  );

  // Render incoming call buttons
  const renderIncomingCallButtons = () => (
    <div className="flex items-center justify-center gap-8 p-6">
      <motion.button
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.95 }}
        onClick={onReject}
        className="w-16 h-16 rounded-full bg-red-500 flex items-center justify-center shadow-lg shadow-red-500/30"
      >
        <PhoneOff className="w-7 h-7 text-white" />
      </motion.button>
      
      <motion.button
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.95 }}
        onClick={onAccept}
        className="w-16 h-16 rounded-full bg-green-500 flex items-center justify-center shadow-lg shadow-green-500/30"
      >
        {callType === 'VIDEO' ? (
          <Video className="w-7 h-7 text-white" />
        ) : (
          <Phone className="w-7 h-7 text-white" />
        )}
      </motion.button>
    </div>
  );

  // Render call controls
  const renderCallControls = () => (
    <div className="p-6 bg-gray-900/90 backdrop-blur-sm">
      <div className="flex items-center justify-center gap-4 mb-4">
        {/* Mute button */}
        <motion.button
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.95 }}
          onClick={onToggleMute}
          className={`w-14 h-14 rounded-full flex items-center justify-center ${
            isMuted ? 'bg-red-500' : 'bg-white/20'
          }`}
        >
          {isMuted ? (
            <MicOff className="w-6 h-6 text-white" />
          ) : (
            <Mic className="w-6 h-6 text-white" />
          )}
        </motion.button>

        {/* Video toggle (only for video calls) */}
        {callType === 'VIDEO' && (
          <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.95 }}
            onClick={onToggleVideo}
            className={`w-14 h-14 rounded-full flex items-center justify-center ${
              !isVideoEnabled ? 'bg-red-500' : 'bg-white/20'
            }`}
          >
            {isVideoEnabled ? (
              <Video className="w-6 h-6 text-white" />
            ) : (
              <VideoOff className="w-6 h-6 text-white" />
            )}
          </motion.button>
        )}

        {/* Speaker button */}
        <motion.button
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => setIsSpeakerOn(!isSpeakerOn)}
          className={`w-14 h-14 rounded-full flex items-center justify-center ${
            isSpeakerOn ? 'bg-white/20' : 'bg-white/10'
          }`}
        >
          <Volume2 className={`w-6 h-6 ${isSpeakerOn ? 'text-white' : 'text-white/50'}`} />
        </motion.button>

        {/* Camera switch (only for video calls on mobile) */}
        {callType === 'VIDEO' && (
          <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.95 }}
            onClick={switchCamera}
            className="w-14 h-14 rounded-full bg-white/20 flex items-center justify-center"
          >
            <RotateCcw className="w-6 h-6 text-white" />
          </motion.button>
        )}

        {/* End call button */}
        <motion.button
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.95 }}
          onClick={onEnd}
          className="w-14 h-14 rounded-full bg-red-500 flex items-center justify-center shadow-lg shadow-red-500/30"
        >
          <PhoneOff className="w-6 h-6 text-white" />
        </motion.button>
      </div>

      {/* Fullscreen toggle */}
      {callType === 'VIDEO' && (
        <div className="flex justify-center">
          <button
            onClick={toggleFullscreen}
            className="text-white/50 hover:text-white flex items-center gap-2 text-sm"
          >
            {isFullscreen ? (
              <>
                <Minimize className="w-4 h-4" />
                Keluar Fullscreen
              </>
            ) : (
              <>
                <Maximize className="w-4 h-4" />
                Fullscreen
              </>
            )}
          </button>
        </div>
      )}
    </div>
  );

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 bg-black"
      >
        <div className="relative w-full h-full flex flex-col">
          {/* Close button */}
          <button
            onClick={onClose}
            className="absolute top-4 left-4 z-10 w-10 h-10 rounded-full bg-black/50 flex items-center justify-center text-white hover:bg-black/70 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>

          {/* Call content */}
          <div className="flex-1 flex flex-col">
            {callType === 'VIDEO' && callState === 'connected' ? (
              renderVideoCall()
            ) : (
              renderVoiceCall()
            )}
          </div>

          {/* Controls */}
          {isIncoming && callState === 'ringing' ? (
            renderIncomingCallButtons()
          ) : (
            renderCallControls()
          )}
        </div>
      </motion.div>
    </AnimatePresence>
  );
}