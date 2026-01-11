// app/components/ui/incoming-call-listener.tsx
"use client";

import React, { useEffect, useRef, useState, useCallback } from 'react';
import * as callService from '@/app/components/lib/services/callService';
import { CallData } from '@/app/components/lib/services/callService';
import { useWebRTC } from '@/app/components/lib/hooks/useWebRTC';
import CallModal from './call-modal';

export interface IncomingCallListenerProps {
  participantId: string;
  participantType: 'user' | 'mitra';
}

export default function IncomingCallListener({
  participantId,
  participantType,
}: IncomingCallListenerProps) {
  const [incomingCall, setIncomingCall] = useState<CallData | null>(null);
  const pollingRef = useRef<NodeJS.Timeout | null>(null);
  const lastCheckedCallIdRef = useRef<string | null>(null);

  const webRTC = useWebRTC({
    userId: participantId,
    userType: participantType,
    userName: '',
    userAvatar: '',
    onCallEnded: (duration) => {
      console.log('Call ended, duration:', duration);
      setIncomingCall(null);
      lastCheckedCallIdRef.current = null;
    },
    onError: (error) => {
      console.error('Call error:', error);
      alert(error);
      setIncomingCall(null);
      lastCheckedCallIdRef.current = null;
    },
  });

  // Check for incoming calls - FIXED parameter names
  const checkIncomingCalls = useCallback(async () => {
    try {
      // Don't check if already in a call
      if (webRTC.callState !== 'idle') return;

      // FIXED: Use receiverId and receiverType instead of participantId and participantType
      const call = await callService.checkIncomingCalls(participantId, participantType);
      
      if (call && call.callId !== lastCheckedCallIdRef.current) {
        console.log('Incoming call detected:', call);
        lastCheckedCallIdRef.current = call.callId;
        setIncomingCall(call);
      }
    } catch (error) {
      // Silently handle errors during polling to avoid console spam
      if (error instanceof Error && !error.message.includes('No incoming calls')) {
        console.error('Error checking incoming calls:', error);
      }
    }
  }, [participantId, participantType, webRTC.callState]);

  // Start polling for incoming calls
  useEffect(() => {
    if (!participantId) return;

    // Initial check
    checkIncomingCalls();

    // Set up polling
    pollingRef.current = setInterval(checkIncomingCalls, 2000);

    return () => {
      if (pollingRef.current) {
        clearInterval(pollingRef.current);
        pollingRef.current = null;
      }
    };
  }, [participantId, checkIncomingCalls]);

  // Handle accept
  const handleAccept = async () => {
    if (!incomingCall) return;
    await webRTC.acceptCall(incomingCall);
  };

  // Handle reject
  const handleReject = async () => {
    if (!incomingCall) return;
    await webRTC.rejectCall(incomingCall.callId);
    setIncomingCall(null);
    lastCheckedCallIdRef.current = null;
  };

  // Handle close
  const handleClose = () => {
    webRTC.endCall();
    setIncomingCall(null);
    lastCheckedCallIdRef.current = null;
  };

  // Show modal for incoming call or active call
  const showModal = incomingCall || webRTC.callState !== 'idle';

  if (!showModal) return null;

  // Get caller info from incoming call
  const callerName = incomingCall?.callerName || 'Penelepon';
  const callerAvatar = incomingCall?.callerAvatar || '';

  return (
    <CallModal
      callState={webRTC.callState === 'idle' && incomingCall ? 'ringing' : webRTC.callState}
      isIncoming={true}
      callType={incomingCall?.callType || webRTC.callData?.callType || 'VOICE'}
      callerName={callerName}
      callerAvatar={callerAvatar}
      localStream={webRTC.localStream}
      remoteStream={webRTC.remoteStream}
      isMuted={webRTC.isMuted}
      isVideoEnabled={webRTC.isVideoEnabled}
      callDuration={webRTC.callDuration}
      onAccept={handleAccept}
      onReject={handleReject}
      onEnd={webRTC.endCall}
      onToggleMute={webRTC.toggleMute}
      onToggleVideo={webRTC.toggleVideo}
      onClose={handleClose}
    />
  );
}