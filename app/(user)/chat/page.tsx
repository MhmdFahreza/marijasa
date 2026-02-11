import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/components/lib/auth.config";
import ChatListClient from "@/app/components/ui/ChatListClient";
import * as chatService from "@/app/components/lib/services/chatService";

// Transform ChatSession ke format ChatListClient
function transformSessionToChat(session: chatService.ChatSession) {
  return {
    id: session.sessionId,
    vendor: {
      id: session.mitraId || '',
      name: session.mitraName || 'Unknown Vendor',
      avatar: session.mitraAvatar || '/store.svg',
      verified: session.mitraVerified || false,
      rating: 0,
      review_count: 0,
      tags: [],
      is_online: session.mitraOnline || false,
    },
    lastMessage: session.lastMessage || '',
    timestamp: session.timestamp,
    unreadCount: session.userUnreadCount || 0,
    read: (session.userUnreadCount || 0) === 0,
  };
}

export default async function ChatPage() {
  // ✅ Ambil session dari NextAuth
  const session = await getServerSession(authOptions);

  if (!session?.user) {
    redirect('/login');
  }

  // ✅ Gunakan session.user.id (ini adalah user_id dari database)
  const userId = session.user.id;

  // ✅ Ambil daftar chat session
  const sessions = await chatService.getUserSessions(userId);
  const initialChats = sessions.map(transformSessionToChat);

  return (
    <ChatListClient
      initialChats={initialChats}
      userId={userId}
    />
  );
}