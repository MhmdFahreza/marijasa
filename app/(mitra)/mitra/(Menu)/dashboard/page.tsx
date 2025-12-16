"use client";
import React from 'react';

export default function DashboardPage() {
  return (
    <div className="animate-fadeIn">
      <h1 className="text-2xl font-bold text-neutral-900 dark:text-white mb-6">Dashboard</h1>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <div className="bg-white dark:bg-neutral-800 rounded-lg p-6 shadow-lg border border-neutral-200 dark:border-neutral-700">
          <h3 className="font-semibold text-neutral-900 dark:text-white mb-2">Total Orders</h3>
          <p className="text-3xl font-bold text-[#7CE0A8]">124</p>
          <p className="text-sm text-neutral-600 dark:text-neutral-400 mt-1">+12% dari bulan lalu</p>
        </div>
        
        <div className="bg-white dark:bg-neutral-800 rounded-lg p-6 shadow-lg border border-neutral-200 dark:border-neutral-700">
          <h3 className="font-semibold text-neutral-900 dark:text-white mb-2">Revenue</h3>
          <p className="text-3xl font-bold text-[#7CE0A8]">Rp 45.2M</p>
          <p className="text-sm text-neutral-600 dark:text-neutral-400 mt-1">+8% dari bulan lalu</p>
        </div>
        
        <div className="bg-white dark:bg-neutral-800 rounded-lg p-6 shadow-lg border border-neutral-200 dark:border-neutral-700">
          <h3 className="font-semibold text-neutral-900 dark:text-white mb-2">Rating</h3>
          <p className="text-3xl font-bold text-[#7CE0A8]">4.8</p>
          <p className="text-sm text-neutral-600 dark:text-neutral-400 mt-1">dari 89 ulasan</p>
        </div>
      </div>
    </div>
  );
}