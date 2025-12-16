"use client";
import React from 'react';

export default function UlasanPage() {
  return (
    <div className="animate-fadeIn">
      <h1 className="text-2xl font-bold text-neutral-900 dark:text-white mb-6">Ulasan</h1>
      <div className="grid grid-cols-1 gap-4">
        <div className="bg-white dark:bg-neutral-800 rounded-lg p-6 shadow-lg border border-neutral-200 dark:border-neutral-700">
          <div className="flex items-start gap-4">
            <img src="https://assets.aceternity.com/manu.png" className="h-12 w-12 rounded-full" alt="User" />
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-2">
                <h4 className="font-semibold text-neutral-900 dark:text-white">John Doe</h4>
                <div className="flex items-center gap-1">
                  {[1,2,3,4,5].map((star) => (
                    <span key={star} className="text-yellow-500">★</span>
                  ))}
                </div>
              </div>
              <p className="text-neutral-600 dark:text-neutral-400">
                Pelayanan sangat memuaskan! Tukang ledeng datang tepat waktu dan menyelesaikan masalah dengan cepat.
              </p>
              <p className="text-sm text-neutral-500 dark:text-neutral-500 mt-2">2 hari yang lalu</p>
            </div>
          </div>
        </div>
        
        <div className="bg-white dark:bg-neutral-800 rounded-lg p-6 shadow-lg border border-neutral-200 dark:border-neutral-700">
          <div className="flex items-start gap-4">
            <img src="https://assets.aceternity.com/manu.png" className="h-12 w-12 rounded-full" alt="User" />
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-2">
                <h4 className="font-semibold text-neutral-900 dark:text-white">Jane Smith</h4>
                <div className="flex items-center gap-1">
                  {[1,2,3,4].map((star) => (
                    <span key={star} className="text-yellow-500">★</span>
                  ))}
                  <span className="text-neutral-300">★</span>
                </div>
              </div>
              <p className="text-neutral-600 dark:text-neutral-400">
                Bagus, tapi ada sedikit keterlambatan. Overall satisfied with the service.
              </p>
              <p className="text-sm text-neutral-500 dark:text-neutral-500 mt-2">5 hari yang lalu</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}