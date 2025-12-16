"use client";
import React from 'react';

export default function ChatPage() {
  return (
    <div className="animate-fadeIn h-full flex flex-col">
      <h1 className="text-2xl font-bold text-neutral-900 dark:text-white mb-6">Chat</h1>
      <div className="flex-1 bg-white dark:bg-neutral-800 rounded-lg shadow-lg border border-neutral-200 dark:border-neutral-700 flex">
        <div className="w-1/3 border-r border-neutral-200 dark:border-neutral-700 overflow-y-auto">
          <div className="p-4 space-y-2">
            <div className="p-3 hover:bg-neutral-100 dark:hover:bg-neutral-700 rounded-lg cursor-pointer">
              <h4 className="font-semibold text-neutral-900 dark:text-white">John Doe</h4>
              <p className="text-sm text-neutral-600 dark:text-neutral-400 truncate">Halo, kapan bisa datang?</p>
            </div>
            <div className="p-3 hover:bg-neutral-100 dark:hover:bg-neutral-700 rounded-lg cursor-pointer">
              <h4 className="font-semibold text-neutral-900 dark:text-white">Jane Smith</h4>
              <p className="text-sm text-neutral-600 dark:text-neutral-400 truncate">Terima kasih atas layanannya</p>
            </div>
          </div>
        </div>
        <div className="flex-1 flex flex-col">
          <div className="flex-1 p-6 overflow-y-auto">
            <p className="text-center text-neutral-500 dark:text-neutral-400">Pilih chat untuk memulai percakapan</p>
          </div>
        </div>
      </div>
    </div>
  );
}