// chatStorage.ts - FIXED VERSION with base64 audio storage
export interface Message {
  id: string;
  senderId: string;
  senderType: "user" | "mitra";
  recipientId: string;
  text: string;
  timestamp: Date;
  read: boolean;
  isVoiceMessage?: boolean;
  audioUrl?: string;
  audioBase64?: string; // ✅ NEW: Store audio as base64
  duration?: number;
  isImage?: boolean;
  isVideo?: boolean;
  fileUrl?: string;
  fileName?: string;
  fileType?: string;
  fileSize?: number;
  thumbnail?: string;
}

export interface ChatSession {
  id: string;
  userId: string;
  userName: string;
  userAvatar: string;
  mitraId: string;
  mitraName: string;
  mitraAvatar: string;
  mitraPhone?: string;
  messages: Message[];
  lastMessage: string;
  timestamp: Date;
  userUnreadCount: number;
  mitraUnreadCount: number;
  userOnline: boolean;
  mitraOnline: boolean;
}

const CHAT_SESSIONS_KEY = "global_chat_sessions";

// ✅ Helper to convert Blob to base64
export const blobToBase64 = (blob: Blob): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      if (typeof reader.result === 'string') {
        resolve(reader.result);
      } else {
        reject(new Error('Failed to convert blob to base64'));
      }
    };
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
};

// Helper to convert stored data to proper types
const parseSession = (session: any): ChatSession => ({
  ...session,
  timestamp: new Date(session.timestamp),
  messages: (session.messages || []).map((msg: any) => ({
    ...msg,
    timestamp: new Date(msg.timestamp),
    // ✅ Restore audioUrl from base64 if exists
    audioUrl: msg.audioBase64 || msg.audioUrl
  }))
});

export const getChatSessions = (): ChatSession[] => {
  if (typeof window === "undefined") return [];
  const stored = localStorage.getItem(CHAT_SESSIONS_KEY);
  if (!stored) return [];
  
  try {
    const sessions = JSON.parse(stored);
    return sessions.map(parseSession);
  } catch (e) {
    console.error("Error parsing chat sessions:", e);
    return [];
  }
};

export const saveChatSessions = (sessions: ChatSession[]) => {
  if (typeof window === "undefined") return;
  try {
    // ✅ Clean up messages before saving (remove blob URLs, keep base64)
    const sessionsToSave = sessions.map(session => ({
      ...session,
      messages: session.messages.map(msg => ({
        ...msg,
        audioUrl: undefined, // Don't save blob URLs
        // Keep audioBase64
      }))
    }));
    
    localStorage.setItem(CHAT_SESSIONS_KEY, JSON.stringify(sessionsToSave));
    
    // Trigger storage event for cross-tab communication
    window.dispatchEvent(new Event('chat-update'));
    
    // ✅ Also trigger storage event for same-tab updates
    window.dispatchEvent(new StorageEvent('storage', {
      key: CHAT_SESSIONS_KEY,
      newValue: JSON.stringify(sessionsToSave),
      url: window.location.href
    }));
  } catch (e) {
    console.error("Error saving chat sessions:", e);
  }
};

export const getChatSession = (userId: string, mitraId: string): ChatSession | null => {
  const sessions = getChatSessions();
  return sessions.find(s => s.userId === userId && s.mitraId === mitraId) || null;
};

export const createOrUpdateChatSession = (
  userId: string,
  userName: string,
  userAvatar: string,
  mitraId: string,
  mitraName: string,
  mitraAvatar: string,
  mitraPhone?: string
): ChatSession => {
  const sessions = getChatSessions();
  const existingIndex = sessions.findIndex(s => s.userId === userId && s.mitraId === mitraId);
  
  if (existingIndex >= 0) {
    return sessions[existingIndex];
  }
  
  const newSession: ChatSession = {
    id: `chat_${userId}_${mitraId}_${Date.now()}`,
    userId,
    userName,
    userAvatar,
    mitraId,
    mitraName,
    mitraAvatar,
    mitraPhone,
    messages: [],
    lastMessage: "",
    timestamp: new Date(),
    userUnreadCount: 0,
    mitraUnreadCount: 0,
    userOnline: true,
    mitraOnline: false
  };
  
  sessions.push(newSession);
  saveChatSessions(sessions);
  return newSession;
};

export const addMessage = (
  userId: string,
  mitraId: string,
  message: Omit<Message, 'id'>
): void => {
  const sessions = getChatSessions();
  const sessionIndex = sessions.findIndex(s => s.userId === userId && s.mitraId === mitraId);
  
  if (sessionIndex < 0) return;
  
  const newMessage: Message = {
    ...message,
    id: `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  };
  
  sessions[sessionIndex].messages.push(newMessage);
  sessions[sessionIndex].lastMessage = newMessage.text;
  sessions[sessionIndex].timestamp = new Date();
  
  // Update unread count
  if (message.senderType === "user") {
    sessions[sessionIndex].mitraUnreadCount += 1;
  } else {
    sessions[sessionIndex].userUnreadCount += 1;
  }
  
  saveChatSessions(sessions);
};

export const markMessagesAsRead = (
  userId: string,
  mitraId: string,
  readerType: "user" | "mitra"
): void => {
  const sessions = getChatSessions();
  const sessionIndex = sessions.findIndex(s => s.userId === userId && s.mitraId === mitraId);
  
  if (sessionIndex < 0) return;
  
  // ✅ Mark messages from the OTHER sender as read
  sessions[sessionIndex].messages = sessions[sessionIndex].messages.map(msg => {
    // If I'm a user, mark mitra's messages as read
    // If I'm a mitra, mark user's messages as read
    if (msg.senderType !== readerType) {
      return { ...msg, read: true };
    }
    return msg;
  });
  
  // Reset unread count
  if (readerType === "user") {
    sessions[sessionIndex].userUnreadCount = 0;
  } else {
    sessions[sessionIndex].mitraUnreadCount = 0;
  }
  
  saveChatSessions(sessions);
};

export const getUserChatSessions = (userId: string): ChatSession[] => {
  const sessions = getChatSessions();
  return sessions.filter(s => s.userId === userId);
};

export const getMitraChatSessions = (mitraId: string): ChatSession[] => {
  const sessions = getChatSessions();
  return sessions.filter(s => s.mitraId === mitraId);
};

export const updateOnlineStatus = (
  id: string,
  type: "user" | "mitra",
  isOnline: boolean
): void => {
  const sessions = getChatSessions();
  
  sessions.forEach((session, index) => {
    if (type === "user" && session.userId === id) {
      sessions[index].userOnline = isOnline;
    } else if (type === "mitra" && session.mitraId === id) {
      sessions[index].mitraOnline = isOnline;
    }
  });
  
  saveChatSessions(sessions);
};