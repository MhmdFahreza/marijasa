"use client";
import React, { useState, useEffect } from "react";

export default function DashboardPage() {
  const [adminInfo, setAdminInfo] = useState<{email: string; name: string; id: string} | null>(null);
  const [loading, setLoading] = useState(true);
  
  useEffect(() => {
    const fetchAdminInfo = async () => {
      try {
        const response = await fetch('/api/admin/verify', {
          method: 'GET',
          credentials: 'include',
        });

        if (response.ok) {
          const data = await response.json();
          setAdminInfo(data.admin);
        }
      } catch (error) {
        console.error('Error fetching admin info:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchAdminInfo();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <div className="h-8 w-8 border-4 border-[#7CE0A8] border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-neutral-600">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <>
      <div>
        <h1 className="text-2xl font-bold mb-2">Dashboard Admin</h1>
        <p className="text-neutral-600 dark:text-neutral-400">
          Selamat datang kembali, {adminInfo?.name || 'Administrator'}! ({adminInfo?.email || 'admin@example.com'})
        </p>
      </div>
      
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { title: "Total Users", value: "1,234", color: "bg-blue-500", icon: "👤" },
          { title: "Total Mitra", value: "89", color: "bg-green-500", icon: "🤝" },
          { title: "Pending Approval", value: "12", color: "bg-amber-500", icon: "⏳" },
          { title: "User Mengakses Web", value: "8,932", color: "bg-purple-500", icon: "📊" },
        ].map((stat, i) => (
          <div
            key={i}
            className="bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-xl p-6 hover:shadow-md transition-shadow"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-neutral-500 dark:text-neutral-400 mb-1">{stat.title}</p>
                <p className="text-2xl font-bold mt-2">{stat.value}</p>
              </div>
              <div className={`h-12 w-12 rounded-xl ${stat.color} flex items-center justify-center text-white`}>
                <span className="text-xl">{stat.icon}</span>
              </div>
            </div>
            <div className="mt-4 pt-4 border-t border-neutral-100 dark:border-neutral-700">
              <div className="flex items-center text-sm text-neutral-600 dark:text-neutral-400">
                <span className="inline-block w-3 h-3 rounded-full bg-green-500 mr-2"></span>
                <span>+12% dari bulan lalu</span>
              </div>
            </div>
          </div>
        ))}
      </div>
      
      {/* Charts/Graphs */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 flex-1">
        <div className="bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-xl p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold">Aktivitas User</h3>
            <select className="text-sm border border-neutral-300 dark:border-neutral-600 rounded-lg px-3 py-1 bg-transparent">
              <option>Hari ini</option>
              <option>Minggu ini</option>
              <option>Bulan ini</option>
            </select>
          </div>
          <div className="h-64 flex items-center justify-center">
            <div className="w-full">
              <div className="flex items-end h-48 gap-2">
                {[40, 60, 80, 65, 90, 75, 50].map((height, i) => (
                  <div key={i} className="flex-1 flex flex-col items-center">
                    <div 
                      className="w-8 rounded-t-lg bg-gradient-to-t from-blue-500 to-blue-300"
                      style={{ height: `${height}%` }}
                    ></div>
                    <span className="text-xs text-neutral-500 mt-2">H-{i+1}</span>
                  </div>
                ))}
              </div>
              <div className="border-t border-neutral-200 dark:border-neutral-700 mt-4 pt-4 text-center text-sm text-neutral-500">
                Aktivitas user dalam 7 hari terakhir
              </div>
            </div>
          </div>
        </div>
        
        <div className="bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-xl p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold">Aktivitas Mitra</h3>
            <select className="text-sm border border-neutral-300 dark:border-neutral-600 rounded-lg px-3 py-1 bg-transparent">
              <option>Hari ini</option>
              <option>Minggu ini</option>
              <option>Bulan ini</option>
            </select>
          </div>
          <div className="h-64 flex items-center justify-center">
            <div className="w-full">
              <div className="flex items-end h-48 gap-2">
                {[55, 45, 70, 50, 85, 60, 65].map((height, i) => (
                  <div key={i} className="flex-1 flex flex-col items-center">
                    <div 
                      className="w-8 rounded-t-lg bg-gradient-to-t from-green-500 to-green-300"
                      style={{ height: `${height}%` }}
                    ></div>
                    <span className="text-xs text-neutral-500 mt-2">H-{i+1}</span>
                  </div>
                ))}
              </div>
              <div className="border-t border-neutral-200 dark:border-neutral-700 mt-4 pt-4 text-center text-sm text-neutral-500">
                Aktivitas mitra dalam 7 hari terakhir
              </div>
            </div>
          </div>
        </div>
      </div>
      
      {/* Recent Activity */}
      <div className="bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-xl p-6">
        <h3 className="font-semibold mb-4">Aktivitas Terkini</h3>
        <div className="space-y-4">
          {[
            { time: "2 menit lalu", action: "Admin menambahkan user baru", user: "John Doe" },
            { time: "1 jam lalu", action: "Mitra baru diapprove", user: "Mitra Sejahtera" },
            { time: "3 jam lalu", action: "Transaksi berhasil diproses", amount: "Rp 450.000" },
            { time: "5 jam lalu", action: "Laporan bulanan di-generate" },
            { time: "1 hari lalu", action: "Update sistem selesai", version: "v2.1.0" },
          ].map((activity, i) => (
            <div key={i} className="flex items-start gap-3">
              <div className="h-8 w-8 rounded-full bg-neutral-100 dark:bg-neutral-700 flex items-center justify-center mt-1">
                <span className="text-sm">📝</span>
              </div>
              <div className="flex-1">
                <p className="text-sm">{activity.action}</p>
                {activity.user && <p className="text-xs text-neutral-500 mt-1">User: {activity.user}</p>}
                {activity.amount && <p className="text-xs text-neutral-500 mt-1">Jumlah: {activity.amount}</p>}
                {activity.version && <p className="text-xs text-neutral-500 mt-1">Versi: {activity.version}</p>}
              </div>
              <div className="text-xs text-neutral-500">{activity.time}</div>
            </div>
          ))}
        </div>
      </div>
    </>
  );
}