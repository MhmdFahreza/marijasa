// app/components/lib/services/chatService.ts

export type Message = {
  id: string;
  sessionId: string;
  senderId: string;
  senderType: "user" | "mitra";
  text: string | null;
  messageType: "TEXT" | "IMAGE" | "VIDEO" | "VOICE" | "FILE";
  fileUrl?: string | null;
  fileName?: string | null;
  fileType?: string | null;
  fileSize?: number | null;
  thumbnail?: string | null;
  duration?: number | null;
  isRead: boolean;
  readAt?: Date | null;
  timestamp: Date;
  isVoiceMessage?: boolean;
  isImage?: boolean;
  isVideo?: boolean;
  audioUrl?: string;
};

export type ChatSession = {
  id: string;
  sessionId: string;
  userId: string;
  mitraId?: string;
  mitraName?: string;
  mitraAvatar?: string;
  mitraPhone?: string;
  mitraVerified?: boolean;
  mitraOnline?: boolean;
  userName?: string;
  userAvatar?: string;
  userPhone?: string;
  userOnline?: boolean;
  lastMessage: string;
  timestamp: Date;
  userUnreadCount: number;
  mitraUnreadCount: number;
  messages?: Message[]; // Added messages property
};

// Safe JSON parse helper
async function safeJsonParse(response: Response) {
  const text = await response.text();
  
  if (!text || text.trim() === '') {
    throw new Error('Empty response from server');
  }
  
  try {
    return JSON.parse(text);
  } catch (error) {
    console.error('JSON Parse Error - Response text:', text);
    throw new Error(`Invalid JSON response: ${text.substring(0, 200)}`);
  }
}

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

    if (!response.ok) {
      const errorData = await safeJsonParse(response);
      throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
    }

    return await safeJsonParse(response);
  } catch (error) {
    console.error('Fetch error:', error);
    throw error;
  }
}

// Get user sessions
export async function getUserSessions(userId: string): Promise<ChatSession[]> {
  try {
    const data = await safeFetch(`/api/chat/sessions?userId=${userId}&type=user`);
    
    return (data.data || []).map((session: any) => ({
      ...session,
      timestamp: new Date(session.timestamp),
    }));
  } catch (error) {
    console.error('Error in getUserSessions:', error);
    return [];
  }
}

// Get mitra sessions
export async function getMitraSessions(vendorId: string): Promise<ChatSession[]> {
  try {
    const data = await safeFetch(`/api/chat/sessions?vendorId=${vendorId}&type=mitra`);
    
    return (data.data || []).map((session: any) => ({
      ...session,
      timestamp: new Date(session.timestamp),
    }));
  } catch (error) {
    console.error('Error in getMitraSessions:', error);
    return [];
  }
}

// Get messages
export async function getMessages(
  userId: string,
  vendorId: string,
  limit: number = 50,
  offset: number = 0
): Promise<Message[]> {
  try {
    const data = await safeFetch(
      `/api/chat/messages?userId=${userId}&vendorId=${vendorId}&limit=${limit}&offset=${offset}`
    );
    
    return (data.data || []).map((msg: any) => ({
      ...msg,
      timestamp: new Date(msg.timestamp),
      readAt: msg.readAt ? new Date(msg.readAt) : null,
    }));
  } catch (error) {
    console.error('Error in getMessages:', error);
    return [];
  }
}

// Send text message
export async function sendTextMessage(
  userId: string,
  vendorId: string,
  senderId: string,
  senderType: "user" | "mitra",
  text: string
): Promise<Message | null> {
  try {
    const data = await safeFetch('/api/chat/messages', {
      method: 'POST',
      body: JSON.stringify({
        userId,
        vendorId,
        senderId,
        senderType,
        text,
        messageType: 'TEXT',
      }),
    });
    
    return {
      ...data.data,
      timestamp: new Date(data.data.timestamp),
      readAt: data.data.readAt ? new Date(data.data.readAt) : null,
    };
  } catch (error) {
    console.error('Error in sendTextMessage:', error);
    return null;
  }
}

// Upload file
async function uploadFile(
  file: File | Blob,
  type: 'image' | 'video' | 'voice'
): Promise<{
  fileUrl: string;
  fileName: string;
  fileType: string;
  fileSize: number;
  thumbnail?: string;
} | null> {
  try {
    const formData = new FormData();
    
    if (file instanceof File) {
      formData.append('file', file);
    } else {
      const fileName = `${type}_${Date.now()}.${
        type === 'voice' ? 'webm' : type === 'image' ? 'jpg' : 'mp4'
      }`;
      formData.append('file', file, fileName);
    }
    
    formData.append('type', type);

    const response = await fetch('/api/chat/upload', {
      method: 'POST',
      body: formData,
    });

    if (!response.ok) {
      const errorData = await safeJsonParse(response);
      throw new Error(errorData.error || 'Failed to upload file');
    }

    const data = await safeJsonParse(response);
    return data.data;
  } catch (error) {
    console.error('Error in uploadFile:', error);
    return null;
  }
}

// Send voice message
export async function sendVoiceMessage(
  userId: string,
  vendorId: string,
  senderId: string,
  senderType: "user" | "mitra",
  audioBlob: Blob,
  duration: number
): Promise<Message | null> {
  try {
    const uploadResult = await uploadFile(audioBlob, 'voice');
    if (!uploadResult) {
      throw new Error('Failed to upload voice message');
    }

    const data = await safeFetch('/api/chat/messages', {
      method: 'POST',
      body: JSON.stringify({
        userId,
        vendorId,
        senderId,
        senderType,
        text: null,
        messageType: 'VOICE',
        fileUrl: uploadResult.fileUrl,
        fileName: uploadResult.fileName,
        fileType: uploadResult.fileType,
        fileSize: uploadResult.fileSize,
        duration,
      }),
    });
    
    return {
      ...data.data,
      timestamp: new Date(data.data.timestamp),
      readAt: data.data.readAt ? new Date(data.data.readAt) : null,
    };
  } catch (error) {
    console.error('Error in sendVoiceMessage:', error);
    return null;
  }
}

// Send image message
export async function sendImageMessage(
  userId: string,
  vendorId: string,
  senderId: string,
  senderType: "user" | "mitra",
  imageFile: File | Blob
): Promise<Message | null> {
  try {
    const uploadResult = await uploadFile(imageFile, 'image');
    if (!uploadResult) {
      throw new Error('Failed to upload image');
    }

    const data = await safeFetch('/api/chat/messages', {
      method: 'POST',
      body: JSON.stringify({
        userId,
        vendorId,
        senderId,
        senderType,
        text: null,
        messageType: 'IMAGE',
        fileUrl: uploadResult.fileUrl,
        fileName: uploadResult.fileName,
        fileType: uploadResult.fileType,
        fileSize: uploadResult.fileSize,
      }),
    });
    
    return {
      ...data.data,
      timestamp: new Date(data.data.timestamp),
      readAt: data.data.readAt ? new Date(data.data.readAt) : null,
    };
  } catch (error) {
    console.error('Error in sendImageMessage:', error);
    return null;
  }
}

// Send video message
export async function sendVideoMessage(
  userId: string,
  vendorId: string,
  senderId: string,
  senderType: "user" | "mitra",
  videoFile: File | Blob
): Promise<Message | null> {
  try {
    const uploadResult = await uploadFile(videoFile, 'video');
    if (!uploadResult) {
      throw new Error('Failed to upload video');
    }

    const data = await safeFetch('/api/chat/messages', {
      method: 'POST',
      body: JSON.stringify({
        userId,
        vendorId,
        senderId,
        senderType,
        text: null,
        messageType: 'VIDEO',
        fileUrl: uploadResult.fileUrl,
        fileName: uploadResult.fileName,
        fileType: uploadResult.fileType,
        fileSize: uploadResult.fileSize,
        thumbnail: uploadResult.thumbnail,
      }),
    });
    
    return {
      ...data.data,
      timestamp: new Date(data.data.timestamp),
      readAt: data.data.readAt ? new Date(data.data.readAt) : null,
    };
  } catch (error) {
    console.error('Error in sendVideoMessage:', error);
    return null;
  }
}

// Mark messages as read
export async function markAsRead(
  userId: string,
  vendorId: string,
  readerType: "user" | "mitra"
): Promise<boolean> {
  try {
    await safeFetch('/api/chat/read', {
      method: 'POST',
      body: JSON.stringify({ userId, vendorId, readerType }),
    });
    
    return true;
  } catch (error) {
    console.error('Error in markAsRead:', error);
    return false;
  }
}

// Get or create session with messages
export async function getOrCreateSession(
  userId: string,
  vendorId: string
): Promise<ChatSession | null> {
  try {
    const data = await safeFetch('/api/chat/sessions', {
      method: 'POST',
      body: JSON.stringify({ userId, vendorId }),
    });
    
    // Map the response data with proper date conversion
    const session: ChatSession = {
      ...data.data,
      timestamp: new Date(data.data.timestamp),
      messages: data.data.messages 
        ? data.data.messages.map((msg: any) => ({
            ...msg,
            timestamp: new Date(msg.timestamp),
            readAt: msg.readAt ? new Date(msg.readAt) : null,
          }))
        : [],
    };
    
    return session;
  } catch (error) {
    console.error('Error in getOrCreateSession:', error);
    return null;
  }
}