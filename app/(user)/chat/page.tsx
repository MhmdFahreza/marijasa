// app/(user)/chat/page.tsx
import { redirect } from "next/navigation";
import ChatListClient from "@/app/components/ui/ChatListClient";
import * as chatService from "@/app/components/lib/services/chatService";

// Transform ChatSession to Chat format expected by ChatListClient
function transformSessionToChat(session: chatService.ChatSession) {
  return {
    id: session.sessionId,
    vendor: {
      id: session.mitraId || '',
      name: session.mitraName || 'Unknown Vendor',
      avatar: session.mitraAvatar || '/store.svg',
      verified: session.mitraVerified || false,
      rating: 0, // This should be fetched from vendor data if needed
      review_count: 0, // This should be fetched from vendor data if needed
      tags: [], // This should be fetched from vendor data if needed
      is_online: session.mitraOnline || false,
    },
    lastMessage: session.lastMessage || '',
    timestamp: session.timestamp,
    unreadCount: session.userUnreadCount || 0,
    read: (session.userUnreadCount || 0) === 0,
  };
}

async function getCurrentUser() {
  try {
    const response = await fetch(
      `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/auth/me`,
      {
        cache: 'no-store',
      }
    );
    
    if (!response.ok) return null;
    const data = await response.json();
    return data.user || null;
  } catch (error) {
    console.error('Error fetching user:', error);
    return null;
  }
}

export default async function ChatPage() {
  const user = await getCurrentUser();
  
  if (!user) {
    redirect('/login');
  }

  // Fetch initial chat sessions
  const sessions = await chatService.getUserSessions(user.user_id);
  
  // Transform sessions to Chat format
  const initialChats = sessions.map(transformSessionToChat);

  return (
    <ChatListClient 
      initialChats={initialChats} 
      userId={user.user_id}
    />
  );
}