"use client";
import React from 'react';

export default function ProfilePage() {
  return (
    <div className="animate-fadeIn">
      <h1 className="text-2xl font-bold text-neutral-900 dark:text-white mb-6">Profile Settings</h1>
      <div className="bg-white dark:bg-neutral-800 rounded-lg p-6 shadow-lg border border-neutral-200 dark:border-neutral-700">
        <div className="space-y-6">
          <div className="flex items-center gap-4">
            <img src="https://assets.aceternity.com/manu.png" className="h-20 w-20 rounded-full" alt="Profile" />
            <button className="px-4 py-2 bg-gradient-to-r from-[#7CE0A8] to-[#5DD494] text-white rounded-md hover:from-[#6bcb96] hover:to-[#4cc383] transition-all">
              Change Photo
            </button>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">
              Full Name
            </label>
            <input
              type="text"
              defaultValue="Mitra Name"
              className="w-full px-4 py-2 border border-neutral-300 dark:border-neutral-600 rounded-md bg-white dark:bg-neutral-900 text-neutral-900 dark:text-white"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">
              Email
            </label>
            <input
              type="email"
              defaultValue="mitra@example.com"
              className="w-full px-4 py-2 border border-neutral-300 dark:border-neutral-600 rounded-md bg-white dark:bg-neutral-900 text-neutral-900 dark:text-white"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">
              Phone Number
            </label>
            <input
              type="tel"
              defaultValue="+62 812-3456-7890"
              className="w-full px-4 py-2 border border-neutral-300 dark:border-neutral-600 rounded-md bg-white dark:bg-neutral-900 text-neutral-900 dark:text-white"
            />
          </div>
          
          <button className="w-full px-4 py-2 bg-gradient-to-r from-[#7CE0A8] to-[#5DD494] text-white rounded-md hover:from-[#6bcb96] hover:to-[#4cc383] transition-all shadow-md">
            Save Changes
          </button>
        </div>
      </div>
    </div>
  );
}