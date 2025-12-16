"use client";
import React from 'react';

export default function ServicesPage() {
  return (
    <div className="animate-fadeIn">
      <h1 className="text-2xl font-bold text-neutral-900 dark:text-white mb-6">Services Settings</h1>
      <div className="bg-white dark:bg-neutral-800 rounded-lg p-6 shadow-lg border border-neutral-200 dark:border-neutral-700">
        <div className="space-y-6">
          <div>
            <h3 className="text-lg font-semibold text-neutral-900 dark:text-white mb-4">My Services</h3>
                          <div className="space-y-3">
              <div className="flex items-center justify-between p-4 border border-neutral-200 dark:border-neutral-700 rounded-lg">
                <div>
                  <h4 className="font-medium text-neutral-900 dark:text-white">Tukang Ledeng</h4>
                  <p className="text-sm text-neutral-600 dark:text-neutral-400">Rp 150.000/jam</p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input type="checkbox" defaultChecked className="sr-only peer" />
                  <div className="w-11 h-6 bg-neutral-300 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-[#7CE0A8]/20 rounded-full peer dark:bg-neutral-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-neutral-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-neutral-600 peer-checked:bg-[#7CE0A8]"></div>
                </label>
              </div>
              
              <div className="flex items-center justify-between p-4 border border-neutral-200 dark:border-neutral-700 rounded-lg">
                <div>
                  <h4 className="font-medium text-neutral-900 dark:text-white">Tukang Listrik</h4>
                  <p className="text-sm text-neutral-600 dark:text-neutral-400">Rp 200.000/jam</p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input type="checkbox" defaultChecked className="sr-only peer" />
                  <div className="w-11 h-6 bg-neutral-300 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-[#7CE0A8]/20 rounded-full peer dark:bg-neutral-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-neutral-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-neutral-600 peer-checked:bg-[#7CE0A8]"></div>
                </label>
              </div>
              
              <div className="flex items-center justify-between p-4 border border-neutral-200 dark:border-neutral-700 rounded-lg">
                <div>
                  <h4 className="font-medium text-neutral-900 dark:text-white">Service AC</h4>
                  <p className="text-sm text-neutral-600 dark:text-neutral-400">Rp 175.000/unit</p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input type="checkbox" className="sr-only peer" />
                  <div className="w-11 h-6 bg-neutral-300 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-[#7CE0A8]/20 rounded-full peer dark:bg-neutral-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-neutral-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-neutral-600 peer-checked:bg-[#7CE0A8]"></div>
                </label>
              </div>
            </div>
          </div>
          
          <button className="w-full px-4 py-2 bg-gradient-to-r from-[#7CE0A8] to-[#5DD494] text-white rounded-md hover:from-[#6bcb96] hover:to-[#4cc383] transition-all shadow-md">
            Add New Service
          </button>
        </div>
      </div>
    </div>
  );
}