// app/components/lib/services/callService.ts

export type CallType = 'VOICE' | 'VIDEO';
export type CallStatus = 'INITIATING' | 'RINGING' | 'ANSWERED' | 'ENDED' | 'MISSED' | 'REJECTED' | 'BUSY' | 'FAILED';

export interface CallData {
  callId: string;
  sessionId: string;
  callerId: string;
  callerType: 'user' | 'mitra';
  callerName?: string;
  callerAvatar?: string;
  receiverId: string;
  receiverType: 'user' | 'mitra';
  receiverName?: string;
  receiverAvatar?: string;
  callType: CallType;
  status: CallStatus;
  offer?: RTCSessionDescriptionInit;
  answer?: RTCSessionDescriptionInit;
  iceCandidates?: RTCIceCandidateInit[];
  startedAt?: Date;
  answeredAt?: Date;
  endedAt?: Date;
  duration?: number;
}

export interface SignalData {
  signalId: string;
  callId: string;
  senderId: string;
  senderType: 'user' | 'mitra';
  signalType: 'offer' | 'answer' | 'ice-candidate' | 'hangup' | 'reject' | 'busy';
  signalData: any;
  isProcessed: boolean;
  createdAt: Date;
}

// STUN/TURN servers configuration
export const ICE_SERVERS: RTCIceServer[] = [
  { urls: 'stun:stun.l.google.com:19302' },
  { urls: 'stun:stun1.l.google.com:19302' },
  { urls: 'stun:stun2.l.google.com:19302' },
  { urls: 'stun:stun3.l.google.com:19302' },
  { urls: 'stun:stun4.l.google.com:19302' },
  // Free TURN servers for testing (you should use your own TURN server in production)
  {
    urls: 'turn:openrelay.metered.ca:80',
    username: 'openrelayproject',
    credential: 'openrelayproject',
  },
  {
    urls: 'turn:openrelay.metered.ca:443',
    username: 'openrelayproject',
    credential: 'openrelayproject',
  },
];

// Safe fetch helper
async function safeFetch(url: string, options?: RequestInit) {
  try {
    const response = await fetch(url, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...options?.headers,
      },
    });

    const text = await response.text();
    if (!text || text.trim() === '') {
      throw new Error('Empty response from server');
    }

    // Check if response is HTML (error page)
    if (text.trim().startsWith('<!DOCTYPE') || text.trim().startsWith('<html')) {
      throw new Error('Server returned HTML instead of JSON - API endpoint may not exist');
    }

    const data = JSON.parse(text);

    if (!response.ok) {
      throw new Error(data.error || `HTTP error! status: ${response.status}`);
    }

    return data;
  } catch (error) {
    console.error('Fetch error:', error);
    throw error;
  }
}

// Initialize a call
export async function initiateCall(
  userId: string,
  vendorId: string,
  callerId: string,
  callerType: 'user' | 'mitra',
  callType: CallType
): Promise<CallData | null> {
  try {
    const data = await safeFetch('/api/call/initiate', {
      method: 'POST',
      body: JSON.stringify({
        userId,
        vendorId,
        callerId,
        callerType,
        callType,
      }),
    });

    return data.data;
  } catch (error) {
    console.error('Error initiating call:', error);
    return null;
  }
}

// Send offer
export async function sendOffer(
  callId: string,
  senderId: string,
  senderType: 'user' | 'mitra',
  offer: RTCSessionDescriptionInit
): Promise<boolean> {
  try {
    await safeFetch('/api/call/signal', {
      method: 'POST',
      body: JSON.stringify({
        callId,
        senderId,
        senderType,
        signalType: 'offer',
        signalData: offer,
      }),
    });
    return true;
  } catch (error) {
    console.error('Error sending offer:', error);
    return false;
  }
}

// Send answer
export async function sendAnswer(
  callId: string,
  senderId: string,
  senderType: 'user' | 'mitra',
  answer: RTCSessionDescriptionInit
): Promise<boolean> {
  try {
    await safeFetch('/api/call/signal', {
      method: 'POST',
      body: JSON.stringify({
        callId,
        senderId,
        senderType,
        signalType: 'answer',
        signalData: answer,
      }),
    });
    return true;
  } catch (error) {
    console.error('Error sending answer:', error);
    return false;
  }
}

// Send ICE candidate
export async function sendIceCandidate(
  callId: string,
  senderId: string,
  senderType: 'user' | 'mitra',
  candidate: RTCIceCandidateInit
): Promise<boolean> {
  try {
    await safeFetch('/api/call/signal', {
      method: 'POST',
      body: JSON.stringify({
        callId,
        senderId,
        senderType,
        signalType: 'ice-candidate',
        signalData: candidate,
      }),
    });
    return true;
  } catch (error) {
    console.error('Error sending ICE candidate:', error);
    return false;
  }
}

// Answer call
export async function answerCall(
  callId: string,
  receiverId: string,
  receiverType: 'user' | 'mitra'
): Promise<CallData | null> {
  try {
    const data = await safeFetch('/api/call/answer', {
      method: 'POST',
      body: JSON.stringify({
        callId,
        receiverId,
        receiverType,
      }),
    });
    return data.data;
  } catch (error) {
    console.error('Error answering call:', error);
    return null;
  }
}

// Reject call
export async function rejectCall(
  callId: string,
  receiverId: string,
  receiverType: 'user' | 'mitra'
): Promise<boolean> {
  try {
    await safeFetch('/api/call/reject', {
      method: 'POST',
      body: JSON.stringify({
        callId,
        receiverId,
        receiverType,
      }),
    });
    return true;
  } catch (error) {
    console.error('Error rejecting call:', error);
    return false;
  }
}

// End call
export async function endCall(
  callId: string,
  enderId: string,
  enderType: 'user' | 'mitra'
): Promise<boolean> {
  try {
    await safeFetch('/api/call/end', {
      method: 'POST',
      body: JSON.stringify({
        callId,
        enderId,
        enderType,
      }),
    });
    return true;
  } catch (error) {
    console.error('Error ending call:', error);
    return false;
  }
}

// Get call status
export async function getCallStatus(callId: string): Promise<CallData | null> {
  try {
    const data = await safeFetch(`/api/call/status?callId=${callId}`);
    return data.data;
  } catch (error) {
    console.error('Error getting call status:', error);
    return null;
  }
}

// Get pending signals for a user
export async function getPendingSignals(
  callId: string,
  receiverId: string,
  receiverType: 'user' | 'mitra'
): Promise<SignalData[]> {
  try {
    const data = await safeFetch(
      `/api/call/signal?callId=${callId}&receiverId=${receiverId}&receiverType=${receiverType}`
    );
    return data.data || [];
  } catch (error) {
    console.error('Error getting pending signals:', error);
    return [];
  }
}

// Check for incoming calls
// FIXED: Changed parameter names from participantId/participantType to receiverId/receiverType
// to match what the API expects
export async function checkIncomingCalls(
  receiverId: string,
  receiverType: 'user' | 'mitra'
): Promise<CallData | null> {
  try {
    const data = await safeFetch(
      `/api/call/incoming?receiverId=${receiverId}&receiverType=${receiverType}`
    );
    return data.data;
  } catch (error) {
    // Silently handle errors during polling to avoid console spam
    // Only log if it's not a "no incoming calls" situation
    if (error instanceof Error && !error.message.includes('No incoming calls')) {
      console.error('Error checking incoming calls:', error);
    }
    return null;
  }
}

// Get active call
export async function getActiveCall(
  participantId: string,
  participantType: 'user' | 'mitra'
): Promise<CallData | null> {
  try {
    const data = await safeFetch(
      `/api/call/active?participantId=${participantId}&participantType=${participantType}`
    );
    return data.data;
  } catch (error) {
    console.error('Error getting active call:', error);
    return null;
  }
}