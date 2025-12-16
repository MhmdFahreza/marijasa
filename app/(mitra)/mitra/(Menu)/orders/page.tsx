"use client";
import React from 'react';

export default function OrdersPage() {
  return (
    <div className="animate-fadeIn">
      <h1 className="text-2xl font-bold text-neutral-900 dark:text-white mb-6">Orders</h1>
      <div className="bg-white dark:bg-neutral-800 rounded-lg p-6 shadow-lg border border-neutral-200 dark:border-neutral-700">
        <div className="space-y-4">
          <div className="flex justify-between items-center pb-4 border-b border-neutral-200 dark:border-neutral-700">
            <div>
              <h3 className="font-semibold text-neutral-900 dark:text-white">Order #12345</h3>
              <p className="text-sm text-neutral-600 dark:text-neutral-400">Service: Tukang Ledeng</p>
            </div>
            <span className="px-3 py-1 bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200 rounded-full text-sm">
              Completed
            </span>
          </div>
          
          <div className="flex justify-between items-center pb-4 border-b border-neutral-200 dark:border-neutral-700">
            <div>
              <h3 className="font-semibold text-neutral-900 dark:text-white">Order #12344</h3>
              <p className="text-sm text-neutral-600 dark:text-neutral-400">Service: Tukang Listrik</p>
            </div>
            <span className="px-3 py-1 bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200 rounded-full text-sm">
              In Progress
            </span>
          </div>
          
          <div className="flex justify-between items-center">
            <div>
              <h3 className="font-semibold text-neutral-900 dark:text-white">Order #12343</h3>
              <p className="text-sm text-neutral-600 dark:text-neutral-400">Service: Tukang AC</p>
            </div>
            <span className="px-3 py-1 bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200 rounded-full text-sm">
              Pending
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}