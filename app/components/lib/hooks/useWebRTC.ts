// app/components/lib/hooks/useWebRTC.ts
"use client";

import { useState, useRef, useCallback, useEffect } from 'react';
import * as callService from '@/app/components/lib/services/callService';
import { CallData, CallType, ICE_SERVERS } from '@/app/components/lib/services/callService';

export type CallState = 'idle' | 'calling' | 'ringing' | 'connecting' | 'connected' | 'ended';

export interface UseWebRTCOptions {
  userId: string;
  userType: 'user' | 'mitra';
  userName: string;
  userAvatar: string;
  onCallEnded?: (duration: number) => void;
  onError?: (error: string) => void;
}

export interface UseWebRTCReturn {
  callState: CallState;
  localStream: MediaStream | null;
  remoteStream: MediaStream | null;
  isMuted: boolean;
  isVideoEnabled: boolean;
  callDuration: number;
  callData: CallData | null;
  initiateCall: (targetId: string, targetType: 'user' | 'mitra', callType: CallType) => Promise<void>;
  acceptCall: (callData: CallData) => Promise<void>;
  rejectCall: (callId: string) => Promise<void>;
  endCall: () => Promise<void>;
  toggleMute: () => void;
  toggleVideo: () => void;
}

export function useWebRTC(options: UseWebRTCOptions): UseWebRTCReturn {
  const { userId, userType, userName, userAvatar, onCallEnded, onError } = options;

  const [callState, setCallState] = useState<CallState>('idle');
  const [localStream, setLocalStream] = useState<MediaStream | null>(null);
  const [remoteStream, setRemoteStream] = useState<MediaStream | null>(null);
  const [isMuted, setIsMuted] = useState(false);
  const [isVideoEnabled, setIsVideoEnabled] = useState(true);
  const [callDuration, setCallDuration] = useState(0);
  const [callData, setCallData] = useState<CallData | null>(null);

  const peerConnectionRef = useRef<RTCPeerConnection | null>(null);
  const localStreamRef = useRef<MediaStream | null>(null);
  const pollingIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const durationIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const iceCandidatesQueue = useRef<RTCIceCandidateInit[]>([]);
  const isRemoteDescriptionSet = useRef(false);
  const currentCallIdRef = useRef<string | null>(null);

  // Cleanup function
  const cleanup = useCallback(() => {
    console.log('Cleaning up WebRTC...');
    
    if (pollingIntervalRef.current) {
      clearInterval(pollingIntervalRef.current);
      pollingIntervalRef.current = null;
    }

    if (durationIntervalRef.current) {
      clearInterval(durationIntervalRef.current);
      durationIntervalRef.current = null;
    }

    if (peerConnectionRef.current) {
      peerConnectionRef.current.close();
      peerConnectionRef.current = null;
    }

    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach(track => track.stop());
      localStreamRef.current = null;
    }

    setLocalStream(null);
    setRemoteStream(null);
    setCallState('idle');
    setCallDuration(0);
    setCallData(null);
    currentCallIdRef.current = null;
    iceCandidatesQueue.current = [];
    isRemoteDescriptionSet.current = false;
  }, []);

  // Get user media
  const getUserMedia = useCallback(async (callType: CallType) => {
    try {
      const constraints: MediaStreamConstraints = {
        audio: true,
        video: callType === 'VIDEO' ? { facingMode: 'user' } : false,
      };
      
      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      localStreamRef.current = stream;
      setLocalStream(stream);
      setIsVideoEnabled(callType === 'VIDEO');
      return stream;
    } catch (error) {
      console.error('Error getting user media:', error);
      throw new Error('Tidak dapat mengakses kamera/mikrofon');
    }
  }, []);

  // Process queued ICE candidates
  const processQueuedCandidates = useCallback(async () => {
    if (!peerConnectionRef.current || !isRemoteDescriptionSet.current) return;

    while (iceCandidatesQueue.current.length > 0) {
      const candidate = iceCandidatesQueue.current.shift();
      if (candidate) {
        try {
          await peerConnectionRef.current.addIceCandidate(new RTCIceCandidate(candidate));
        } catch (error) {
          console.error('Error adding queued ICE candidate:', error);
        }
      }
    }
  }, []);

  // Create peer connection
  const createPeerConnection = useCallback((currentCallId: string) => {
    const pc = new RTCPeerConnection({ iceServers: ICE_SERVERS });

    pc.onicecandidate = async (event) => {
      if (event.candidate && currentCallId) {
        await callService.sendIceCandidate(
          currentCallId,
          userId,
          userType,
          event.candidate.toJSON()
        );
      }
    };

    pc.ontrack = (event) => {
      console.log('Remote track received:', event.streams[0]);
      setRemoteStream(event.streams[0]);
    };

    pc.oniceconnectionstatechange = () => {
      console.log('ICE connection state:', pc.iceConnectionState);
      if (pc.iceConnectionState === 'connected') {
        setCallState('connected');
        // Start duration timer
        if (!durationIntervalRef.current) {
          durationIntervalRef.current = setInterval(() => {
            setCallDuration(prev => prev + 1);
          }, 1000);
        }
      } else if (pc.iceConnectionState === 'failed' || pc.iceConnectionState === 'disconnected') {
        onError?.('Koneksi terputus');
        cleanup();
      }
    };

    peerConnectionRef.current = pc;
    return pc;
  }, [userId, userType, cleanup, onError]);

  // Poll for signals
  const pollSignals = useCallback(async () => {
    const currentCallId = currentCallIdRef.current;
    if (!currentCallId || !peerConnectionRef.current) return;

    try {
      const signals = await callService.getPendingSignals(currentCallId, userId, userType);
      
      for (const signal of signals) {
        if (signal.signalType === 'answer' && peerConnectionRef.current.signalingState === 'have-local-offer') {
          console.log('Received answer');
          await peerConnectionRef.current.setRemoteDescription(
            new RTCSessionDescription(signal.signalData)
          );
          isRemoteDescriptionSet.current = true;
          setCallState('connecting');
          await processQueuedCandidates();
        } else if (signal.signalType === 'offer' && peerConnectionRef.current.signalingState === 'stable') {
          console.log('Received offer');
          await peerConnectionRef.current.setRemoteDescription(
            new RTCSessionDescription(signal.signalData)
          );
          isRemoteDescriptionSet.current = true;
          
          const answer = await peerConnectionRef.current.createAnswer();
          await peerConnectionRef.current.setLocalDescription(answer);
          await callService.sendAnswer(currentCallId, userId, userType, answer);
          setCallState('connecting');
          await processQueuedCandidates();
        } else if (signal.signalType === 'ice-candidate') {
          if (isRemoteDescriptionSet.current && peerConnectionRef.current.remoteDescription) {
            try {
              await peerConnectionRef.current.addIceCandidate(
                new RTCIceCandidate(signal.signalData)
              );
            } catch (error) {
              console.error('Error adding ICE candidate:', error);
            }
          } else {
            iceCandidatesQueue.current.push(signal.signalData);
          }
        } else if (signal.signalType === 'hangup' || signal.signalType === 'reject') {
          console.log('Call ended by other party');
          const duration = callDuration;
          cleanup();
          onCallEnded?.(duration);
        }
      }

      // Check call status
      const status = await callService.getCallStatus(currentCallId);
      if (status && (status.status === 'ENDED' || status.status === 'REJECTED' || status.status === 'MISSED')) {
        const duration = callDuration;
        cleanup();
        onCallEnded?.(duration);
      }
    } catch (error) {
      console.error('Error polling signals:', error);
    }
  }, [userId, userType, callDuration, cleanup, onCallEnded, processQueuedCandidates]);

  // Initiate call
  const initiateCall = useCallback(async (
    targetId: string,
    targetType: 'user' | 'mitra',
    callType: CallType
  ) => {
    try {
      setCallState('calling');

      // Get local media first
      const stream = await getUserMedia(callType);

      // Determine userId and vendorId based on who's calling
      let apiUserId: string;
      let apiVendorId: string;

      if (userType === 'user') {
        apiUserId = userId;
        apiVendorId = targetId;
      } else {
        apiUserId = targetId;
        apiVendorId = userId;
      }

      // Initiate call in database
      const call = await callService.initiateCall(
        apiUserId,
        apiVendorId,
        userId,
        userType,
        callType
      );

      if (!call) {
        throw new Error('Gagal memulai panggilan');
      }

      setCallData(call);
      currentCallIdRef.current = call.callId;
      setCallState('ringing');

      // Create peer connection
      const pc = createPeerConnection(call.callId);

      // Add local tracks
      stream.getTracks().forEach(track => {
        pc.addTrack(track, stream);
      });

      // Create and send offer
      const offer = await pc.createOffer();
      await pc.setLocalDescription(offer);
      await callService.sendOffer(call.callId, userId, userType, offer);

      // Start polling for answer
      pollingIntervalRef.current = setInterval(pollSignals, 1000);

    } catch (error: any) {
      console.error('Error initiating call:', error);
      cleanup();
      onError?.(error.message || 'Gagal memulai panggilan');
    }
  }, [userId, userType, getUserMedia, createPeerConnection, pollSignals, cleanup, onError]);

  // Accept incoming call
  const acceptCall = useCallback(async (incomingCallData: CallData) => {
    try {
      setCallState('connecting');
      setCallData(incomingCallData);
      currentCallIdRef.current = incomingCallData.callId;

      // Get local media
      const stream = await getUserMedia(incomingCallData.callType);

      // Answer the call in database
      const answeredCall = await callService.answerCall(
        incomingCallData.callId,
        userId,
        userType
      );

      if (!answeredCall) {
        throw new Error('Gagal menerima panggilan');
      }

      // Create peer connection
      const pc = createPeerConnection(incomingCallData.callId);

      // Add local tracks
      stream.getTracks().forEach(track => {
        pc.addTrack(track, stream);
      });

      // Start polling for offer and ICE candidates
      pollingIntervalRef.current = setInterval(pollSignals, 1000);

    } catch (error: any) {
      console.error('Error accepting call:', error);
      cleanup();
      onError?.(error.message || 'Gagal menerima panggilan');
    }
  }, [userId, userType, getUserMedia, createPeerConnection, pollSignals, cleanup, onError]);

  // Reject call
  const rejectCall = useCallback(async (callId: string) => {
    try {
      await callService.rejectCall(callId, userId, userType);
      cleanup();
    } catch (error) {
      console.error('Error rejecting call:', error);
      cleanup();
    }
  }, [userId, userType, cleanup]);

  // End call
  const endCall = useCallback(async () => {
    const currentCallId = currentCallIdRef.current || callData?.callId;
    if (currentCallId) {
      try {
        await callService.endCall(currentCallId, userId, userType);
      } catch (error) {
        console.error('Error ending call:', error);
      }
    }
    const duration = callDuration;
    cleanup();
    onCallEnded?.(duration);
  }, [callData?.callId, userId, userType, callDuration, cleanup, onCallEnded]);

  // Toggle mute
  const toggleMute = useCallback(() => {
    if (localStreamRef.current) {
      const audioTrack = localStreamRef.current.getAudioTracks()[0];
      if (audioTrack) {
        audioTrack.enabled = !audioTrack.enabled;
        setIsMuted(!audioTrack.enabled);
      }
    }
  }, []);

  // Toggle video
  const toggleVideo = useCallback(() => {
    if (localStreamRef.current) {
      const videoTrack = localStreamRef.current.getVideoTracks()[0];
      if (videoTrack) {
        videoTrack.enabled = !videoTrack.enabled;
        setIsVideoEnabled(videoTrack.enabled);
      }
    }
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      cleanup();
    };
  }, [cleanup]);

  return {
    callState,
    localStream,
    remoteStream,
    isMuted,
    isVideoEnabled,
    callDuration,
    callData,
    initiateCall,
    acceptCall,
    rejectCall,
    endCall,
    toggleMute,
    toggleVideo,
  };
}

export default useWebRTC;