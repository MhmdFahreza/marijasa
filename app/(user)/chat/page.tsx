"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "motion/react";
import { Avatar, AvatarFallback, AvatarImage } from "@/app/components/ui/avatar";
import { Card } from "@/app/components/ui/card";
import { Input } from "@/app/components/ui/input";
import { Button } from "@/app/components/ui/button";
import { Badge } from "@/app/components/ui/badge";
import { Vendors } from "@/app/data/dataVendor";
import { Search, Filter, MessageSquare, Clock, CheckCheck, Check } from "lucide-react";
import { format } from "date-fns";
import { id } from "date-fns/locale";

// Mock chat list data
const mockChatList = Vendors.slice(0, 6).map((vendor, index) => ({
  id: vendor.id,
  vendor,
  lastMessage: [
    "Halo, ada yang bisa saya bantu?",
    "Estimasi biaya untuk ruangan segitu sekitar Rp 1.500.000",
    "Bisa survey lokasi besok jam 10?",
    "Terima kasih telah menggunakan jasa kami",
    "Pesanan Anda sedang diproses",
  ][index % 5],
  timestamp: new Date(Date.now() - 1000 * 60 * 60 * (index + 1)),
  unreadCount: index === 0 ? 2 : index === 2 ? 1 : 0,
  read: index !== 0,
}));

export default function ChatListPage() {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState("");
  const [activeFilter, setActiveFilter] = useState("all");

  const filteredChats = mockChatList.filter((chat) => {
    const matchesSearch = chat.vendor.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         chat.lastMessage.toLowerCase().includes(searchQuery.toLowerCase());
    
    if (activeFilter === "unread") {
      return matchesSearch && chat.unreadCount > 0;
    }
    return matchesSearch;
  });

  const formatTime = (date: Date) => {
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

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50">
      {/* Header */}
      <motion.header
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className="sticky top-0 z-50 bg-white/95 backdrop-blur-md border-b shadow-sm"
      >
        <div className="max-w-4xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-2xl font-bold text-gray-800">Pesan</h1>
              <p className="text-sm text-gray-600">Chat dengan vendor favorit Anda</p>
            </div>
            <Button
              variant="ghost"
              size="icon"
              className="rounded-full hover:bg-gray-100"
            >
              <Filter className="h-5 w-5" />
            </Button>
          </div>

          {/* Search Bar */}
          <div className="relative">
            <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
            <Input
              placeholder="Cari percakapan..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-12 pr-4 py-6 rounded-full border-gray-300 focus-visible:ring-blue-500 shadow-sm"
            />
          </div>

          {/* Filter Tabs */}
          <div className="flex gap-2 mt-4 overflow-x-auto pb-2">
            <Button
              variant={activeFilter === "all" ? "default" : "outline"}
              size="sm"
              className="rounded-full"
              onClick={() => setActiveFilter("all")}
            >
              Semua
            </Button>
            <Button
              variant={activeFilter === "unread" ? "default" : "outline"}
              size="sm"
              className="rounded-full"
              onClick={() => setActiveFilter("unread")}
            >
              Belum Dibaca
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="rounded-full"
            >
              Paling Aktif
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="rounded-full"
            >
              Terbaru
            </Button>
          </div>
        </div>
      </motion.header>

      {/* Chat List */}
      <div className="max-w-4xl mx-auto px-4 py-6">
        {filteredChats.length === 0 ? (
          <Card className="p-8 text-center border-0 shadow-lg">
            <MessageSquare className="h-12 w-12 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-700 mb-2">
              {searchQuery ? "Percakapan tidak ditemukan" : "Belum ada percakapan"}
            </h3>
            <p className="text-gray-500 mb-6">
              {searchQuery 
                ? "Coba cari dengan kata kunci lain" 
                : "Mulai chat dengan vendor untuk mendapatkan penawaran terbaik"}
            </p>
            <Button
              onClick={() => router.push("/jasa")}
              className="bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700"
            >
              Cari Vendor
            </Button>
          </Card>
        ) : (
          <div className="space-y-3">
            {filteredChats.map((chat, index) => (
              <motion.div
                key={chat.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.05 }}
              >
                <Card
                  className="p-4 border-0 shadow-sm hover:shadow-lg transition-all duration-300 cursor-pointer hover:bg-blue-50/50"
                  onClick={() => router.push(`/chat/${chat.id}`)}
                >
                  <div className="flex items-start gap-3">
                    {/* Avatar with Status */}
                    <div className="relative">
                      <Avatar className="h-12 w-12 border-2 border-white shadow">
                        <AvatarImage src={chat.vendor.avatar} alt={chat.vendor.name} />
                        <AvatarFallback>
                          {chat.vendor.name.substring(0, 2).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <div className="absolute -bottom-1 -right-1">
                        <div className={`h-3 w-3 rounded-full border-2 border-white ${index < 2 ? "bg-green-500" : "bg-gray-400"}`} />
                      </div>
                    </div>

                    {/* Chat Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between mb-1">
                        <h3 className="font-semibold text-gray-800 truncate">
                          {chat.vendor.name}
                        </h3>
                        <span className="text-xs text-gray-500 whitespace-nowrap">
                          {formatTime(chat.timestamp)}
                        </span>
                      </div>

                      <div className="flex items-center gap-2 mb-1">
                        {chat.vendor.verified && (
                          <Badge className="bg-green-500 hover:bg-green-600 text-xs px-2 py-0">
                            Verified
                          </Badge>
                        )}
                        <div className="flex items-center text-xs">
                          {[...Array(5)].map((_, i) => (
                            <svg
                              key={i}
                              className={`w-3 h-3 ${i < Math.floor(chat.vendor.rating) ? "text-yellow-400 fill-yellow-400" : "text-gray-300"}`}
                              xmlns="http://www.w3.org/2000/svg"
                              viewBox="0 0 24 24"
                            >
                              <path d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z" />
                            </svg>
                          ))}
                          <span className="ml-1 font-semibold">{chat.vendor.rating.toFixed(1)}</span>
                        </div>
                      </div>

                      <div className="flex items-center justify-between">
                        <p className="text-sm text-gray-600 truncate">
                          {chat.lastMessage}
                        </p>
                        <div className="flex items-center gap-1 ml-2">
                          {chat.read ? (
                            <CheckCheck className="h-4 w-4 text-blue-500" />
                          ) : (
                            <Check className="h-4 w-4 text-gray-400" />
                          )}
                        </div>
                      </div>

                      {/* Tags */}
                      <div className="flex flex-wrap gap-1 mt-2">
                        {chat.vendor.tags.slice(0, 2).map((tag) => (
                          <Badge key={tag} variant="outline" className="text-xs rounded-full">
                            {tag}
                          </Badge>
                        ))}
                      </div>
                    </div>

                    {/* Unread Badge */}
                    {chat.unreadCount > 0 && (
                      <Badge className="ml-2 bg-blue-500 hover:bg-blue-600 text-white rounded-full h-6 w-6 p-0 flex items-center justify-center">
                        {chat.unreadCount}
                      </Badge>
                    )}
                  </div>
                </Card>
              </motion.div>
            ))}
          </div>
        )}

        {/* Tips Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="mt-8"
        >
          <Card className="p-6 border-0 shadow-lg bg-gradient-to-r from-blue-500 to-blue-600 text-white">
            <div className="flex items-start gap-4">
              <MessageSquare className="h-8 w-8 flex-shrink-0" />
              <div>
                <h3 className="font-bold text-lg mb-2">Tips Chat Aman</h3>
                <ul className="text-sm space-y-1">
                  <li className="flex items-center gap-2">
                    <div className="h-1.5 w-1.5 rounded-full bg-white" />
                    Jangan bagikan data pribadi seperti nomor KTP atau password
                  </li>
                  <li className="flex items-center gap-2">
                    <div className="h-1.5 w-1.5 rounded-full bg-white" />
                    Transaksi hanya melalui platform resmi
                  </li>
                  <li className="flex items-center gap-2">
                    <div className="h-1.5 w-1.5 rounded-full bg-white" />
                    Simpan semua bukti transaksi dan percakapan
                  </li>
                </ul>
              </div>
            </div>
          </Card>
        </motion.div>
      </div>
    </div>
  );
}