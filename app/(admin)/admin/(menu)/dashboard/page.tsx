"use client";
import React, { useState, useEffect } from "react";

type DashboardStats = {
  totalUsers: number;
  totalMitra: number;
  pendingApproval: number;
  totalVisitors: number;
  activeVisitors: number;
};

type ActivityData = {
  date: string;
  users: number;
  mitra: number;
  anonymous: number;
};

type RecentActivity = {
  id: string;
  type: 'user' | 'mitra' | 'admin' | 'anonymous';
  action: string;
  actor: string;
  actorEmail?: string;
  timestamp: string;
  details?: any;
};

export default function DashboardPage() {
  const [adminInfo, setAdminInfo] = useState<{email: string; name: string; id: string} | null>(null);
  const [stats, setStats] = useState<DashboardStats>({
    totalUsers: 0,
    totalMitra: 0,
    pendingApproval: 0,
    totalVisitors: 0,
    activeVisitors: 0,
  });
  const [userActivity, setUserActivity] = useState<ActivityData[]>([]);
  const [mitraActivity, setMitraActivity] = useState<ActivityData[]>([]);
  const [recentActivities, setRecentActivities] = useState<RecentActivity[]>([]);
  const [userTimeFilter, setUserTimeFilter] = useState<'today' | 'week' | 'month'>('today');
  const [mitraTimeFilter, setMitraTimeFilter] = useState<'today' | 'week' | 'month'>('today');
  const [animationOffset, setAnimationOffset] = useState(0);
  
  // Generate time slots (current hour ±4 hours = 9 slots)
  const generateTimeSlots = () => {
    const slots = [];
    const now = new Date();
    const currentHour = now.getHours();
    
    for (let i = -4; i <= 4; i++) {
      const hour = (currentHour + i + 24) % 24;
      slots.push({
        hour,
        label: `${hour.toString().padStart(2, '0')}:00`,
        data: Math.floor(Math.random() * 80) + 20 // Random data 20-100
      });
    }
    return slots;
  };

  const [userTimeSlots, setUserTimeSlots] = useState(generateTimeSlots());
  const [mitraTimeSlots, setMitraTimeSlots] = useState(generateTimeSlots());
  
  const fetchDashboardData = async () => {
    try {
      // Fetch admin info
      const adminResponse = await fetch('/api/admin/verify', {
        method: 'GET',
        credentials: 'include',
      });

      if (adminResponse.ok) {
        const adminData = await adminResponse.json();
        setAdminInfo(adminData.admin);
      }

      // Fetch dashboard stats
      const statsResponse = await fetch('/api/admin/dashboard/stats', {
        credentials: 'include',
      });

      if (statsResponse.ok) {
        const statsData = await statsResponse.json();
        setStats(statsData.stats);
      }

      // Fetch activity data for users
      const userActivityResponse = await fetch(`/api/admin/dashboard/activity?period=${userTimeFilter}&type=user`, {
        credentials: 'include',
      });

      if (userActivityResponse.ok) {
        const userActivityData = await userActivityResponse.json();
        setUserActivity(userActivityData.userActivity || []);
      }

      // Fetch activity data for mitra
      const mitraActivityResponse = await fetch(`/api/admin/dashboard/activity?period=${mitraTimeFilter}&type=mitra`, {
        credentials: 'include',
      });

      if (mitraActivityResponse.ok) {
        const mitraActivityData = await mitraActivityResponse.json();
        setMitraActivity(mitraActivityData.mitraActivity || []);
      }

      // Fetch recent activities
      const recentResponse = await fetch('/api/admin/dashboard/recent-activities', {
        credentials: 'include',
      });

      if (recentResponse.ok) {
        const recentData = await recentResponse.json();
        setRecentActivities(recentData.activities);
      }

    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    }
  };

  // Smooth animation loop
  useEffect(() => {
    const animationInterval = setInterval(() => {
      setAnimationOffset(prev => (prev + 1) % 100);
    }, 50); // Update every 50ms for smooth animation

    return () => clearInterval(animationInterval);
  }, []);

  // Update time slots
  const updateTimeSlots = () => {
    setUserTimeSlots(generateTimeSlots());
    setMitraTimeSlots(generateTimeSlots());
  };

  useEffect(() => {
    fetchDashboardData();
    
    // Real-time update setiap 5 detik
    const interval = setInterval(() => {
      fetchDashboardData();
      updateTimeSlots();
    }, 5000);

    return () => clearInterval(interval);
  }, [userTimeFilter, mitraTimeFilter]);

  const getActivityColor = (type: string) => {
    switch(type) {
      case 'user': return 'bg-blue-500';
      case 'mitra': return 'bg-green-500';
      case 'admin': return 'bg-purple-500';
      case 'anonymous': return 'bg-gray-500';
      default: return 'bg-neutral-500';
    }
  };

  const getActivityIcon = (type: string) => {
    switch(type) {
      case 'user': return '👤';
      case 'mitra': return '🤝';
      case 'admin': return '⚙️';
      case 'anonymous': return '👻';
      default: return '📝';
    }
  };

  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (minutes < 1) return 'Baru saja';
    if (minutes < 60) return `${minutes} menit lalu`;
    if (hours < 24) return `${hours} jam lalu`;
    if (days < 7) return `${days} hari lalu`;
    
    return date.toLocaleDateString('id-ID', {
      day: 'numeric',
      month: 'short',
      year: date.getFullYear() !== now.getFullYear() ? 'numeric' : undefined
    });
  };

  const getMaxValue = (slots: any[]) => {
    return Math.max(...slots.map(s => s.data), 1);
  };

  const createLinePath = (timeSlots: any[], width: number, height: number) => {
    const maxVal = getMaxValue(timeSlots);
    const points = timeSlots.map((slot, i) => {
      const x = (i / (timeSlots.length - 1)) * width;
      const y = height - (slot.data / maxVal) * height;
      return { x, y, data: slot.data };
    });

    // Create smooth curve using quadratic bezier
    let path = `M ${points[0].x} ${points[0].y}`;
    
    for (let i = 0; i < points.length - 1; i++) {
      const current = points[i];
      const next = points[i + 1];
      const midX = (current.x + next.x) / 2;
      
      path += ` Q ${current.x} ${current.y}, ${midX} ${(current.y + next.y) / 2}`;
      path += ` Q ${next.x} ${next.y}, ${next.x} ${next.y}`;
    }
    
    return { path, points };
  };

  const renderLineChart = (timeSlots: any[], color: string, strokeColor: string) => {
    const width = 600;
    const height = 180;
    const { path, points } = createLinePath(timeSlots, width, height);
    const offset = (animationOffset / 100) * (width / timeSlots.length);

    return (
      <div className="relative w-full h-48">
        <svg 
          viewBox={`0 0 ${width} ${height}`} 
          className="w-full h-full"
          preserveAspectRatio="none"
        >
          {/* Grid lines */}
          <defs>
            <linearGradient id={`gradient-${color}`} x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor={strokeColor} stopOpacity="0.3" />
              <stop offset="100%" stopColor={strokeColor} stopOpacity="0.05" />
            </linearGradient>
          </defs>
          
          {/* Horizontal grid lines */}
          {[0, 0.25, 0.5, 0.75, 1].map((fraction, i) => (
            <line
              key={i}
              x1="0"
              y1={fraction * height}
              x2={width}
              y2={fraction * height}
              stroke="#e5e7eb"
              strokeWidth="1"
              strokeDasharray="4 4"
              opacity="0.3"
            />
          ))}
          
          {/* Area under line */}
          <path
            d={`${path} L ${width} ${height} L 0 ${height} Z`}
            fill={`url(#gradient-${color})`}
            style={{
              transform: `translateX(-${offset}px)`,
              transition: 'transform 0.05s linear'
            }}
          />
          
          {/* Main line */}
          <path
            d={path}
            fill="none"
            stroke={strokeColor}
            strokeWidth="3"
            strokeLinecap="round"
            strokeLinejoin="round"
            style={{
              transform: `translateX(-${offset}px)`,
              transition: 'transform 0.05s linear'
            }}
          />
          
          {/* Data points */}
          {points.map((point, i) => (
            <g key={i}>
              <circle
                cx={point.x}
                cy={point.y}
                r="4"
                fill="white"
                stroke={strokeColor}
                strokeWidth="2"
                className="cursor-pointer hover:r-6 transition-all"
                style={{
                  transform: `translateX(-${offset}px)`,
                  transition: 'transform 0.05s linear'
                }}
              />
            </g>
          ))}
        </svg>
        
        {/* Time labels */}
        <div className="flex justify-between mt-2 px-2">
          {timeSlots.map((slot, i) => {
            const isCurrent = i === 4;
            return (
              <span
                key={i}
                className={`text-xs transition-all ${
                  isCurrent
                    ? 'text-neutral-900 dark:text-neutral-100 font-bold'
                    : 'text-neutral-400'
                }`}
              >
                {slot.label}
              </span>
            );
          })}
        </div>
      </div>
    );
  };

  return (
    <>
      <div className="mb-6">
        <h1 className="text-2xl font-bold mb-2">Dashboard Admin</h1>
        <p className="text-neutral-600 dark:text-neutral-400">
          Selamat datang kembali, {adminInfo?.name || 'Administrator'}! ({adminInfo?.email || 'admin@example.com'})
        </p>
      </div>
      
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-xl p-6 hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-neutral-500 dark:text-neutral-400 mb-1">Total Users (Registered)</p>
              <p className="text-2xl font-bold mt-2">{stats.totalUsers.toLocaleString('id-ID')}</p>
            </div>
            <div className="h-12 w-12 rounded-xl bg-blue-500 flex items-center justify-center text-white">
              <span className="text-xl">👤</span>
            </div>
          </div>
          <div className="mt-4 pt-4 border-t border-neutral-100 dark:border-neutral-700">
            <div className="flex items-center text-sm text-neutral-600 dark:text-neutral-400">
              <span className="text-xs">Pengguna terdaftar di sistem</span>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-xl p-6 hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-neutral-500 dark:text-neutral-400 mb-1">Total Mitra</p>
              <p className="text-2xl font-bold mt-2">{stats.totalMitra.toLocaleString('id-ID')}</p>
            </div>
            <div className="h-12 w-12 rounded-xl bg-green-500 flex items-center justify-center text-white">
              <span className="text-xl">🤝</span>
            </div>
          </div>
          <div className="mt-4 pt-4 border-t border-neutral-100 dark:border-neutral-700">
            <div className="flex items-center text-sm text-neutral-600 dark:text-neutral-400">
              <span className="text-xs">Mitra aktif & verified</span>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-xl p-6 hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-neutral-500 dark:text-neutral-400 mb-1">Pending Approval</p>
              <p className="text-2xl font-bold mt-2">{stats.pendingApproval}</p>
            </div>
            <div className="h-12 w-12 rounded-xl bg-amber-500 flex items-center justify-center text-white">
              <span className="text-xl">⏳</span>
            </div>
          </div>
          <div className="mt-4 pt-4 border-t border-neutral-100 dark:border-neutral-700">
            <div className="flex items-center text-sm text-neutral-600 dark:text-neutral-400">
              <span className="text-xs">Menunggu persetujuan</span>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-xl p-6 hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-neutral-500 dark:text-neutral-400 mb-1">Total Pengunjung</p>
              <p className="text-2xl font-bold mt-2">{stats.totalVisitors.toLocaleString('id-ID')}</p>
              <p className="text-xs text-green-600 dark:text-green-400 mt-1">
                {stats.activeVisitors} aktif sekarang
              </p>
            </div>
            <div className="h-12 w-12 rounded-xl bg-purple-500 flex items-center justify-center text-white">
              <span className="text-xl">📊</span>
            </div>
          </div>
          <div className="mt-4 pt-4 border-t border-neutral-100 dark:border-neutral-700">
            <div className="flex items-center text-sm text-neutral-600 dark:text-neutral-400">
              <span className="text-xs">Termasuk anonymous users</span>
            </div>
          </div>
        </div>
      </div>
      
      {/* Charts/Graphs */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 flex-1">
        <div className="bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-xl p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold">Aktivitas User (Real-time)</h3>
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-1">
                <div className="h-2 w-2 rounded-full bg-green-500 animate-pulse"></div>
                <span className="text-xs text-neutral-500">Live</span>
              </div>
            </div>
          </div>
          <div className="h-64 flex items-center justify-center">
            <div className="w-full">
              {renderLineChart(userTimeSlots, 'blue', '#3b82f6')}
              <div className="border-t border-neutral-200 dark:border-neutral-700 mt-4 pt-4">
                <div className="flex items-center justify-center gap-4 text-sm text-neutral-500">
                  <div className="flex items-center gap-2">
                    <span className="inline-block w-3 h-3 rounded-full bg-blue-500"></span>
                    <span>User Activity</span>
                  </div>
                  <div className="text-xs text-neutral-400">
                    Rentang ±4 jam dari sekarang
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
        
        <div className="bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-xl p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold">Aktivitas Mitra (Real-time)</h3>
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-1">
                <div className="h-2 w-2 rounded-full bg-green-500 animate-pulse"></div>
                <span className="text-xs text-neutral-500">Live</span>
              </div>
            </div>
          </div>
          <div className="h-64 flex items-center justify-center">
            <div className="w-full">
              {renderLineChart(mitraTimeSlots, 'green', '#22c55e')}
              <div className="border-t border-neutral-200 dark:border-neutral-700 mt-4 pt-4">
                <div className="flex items-center justify-center gap-4 text-sm text-neutral-500">
                  <div className="flex items-center gap-2">
                    <span className="inline-block w-3 h-3 rounded-full bg-green-500"></span>
                    <span>Mitra Activity</span>
                  </div>
                  <div className="text-xs text-neutral-400">
                    Chat, update profil, terima pesanan, dll
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      {/* Recent Activity */}
      <div className="bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-xl p-6">
        <h3 className="font-semibold mb-4">Aktivitas Terkini</h3>
        <div className="space-y-4 max-h-[400px] overflow-y-auto">
          {recentActivities.length === 0 ? (
            <div className="text-center py-8 text-neutral-500">
              Belum ada aktivitas
            </div>
          ) : (
            recentActivities.map((activity) => (
              <div key={activity.id} className="flex items-start gap-3 p-3 rounded-lg hover:bg-neutral-50 dark:hover:bg-neutral-700/50 transition-colors">
                <div className={`h-8 w-8 rounded-full ${getActivityColor(activity.type)} flex items-center justify-center mt-1 flex-shrink-0`}>
                  <span className="text-sm">{getActivityIcon(activity.type)}</span>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm">{activity.action}</p>
                  <div className="flex items-center gap-2 mt-1">
                    <p className="text-xs text-neutral-500">
                      {activity.type === 'anonymous' ? 'Anonymous User' : activity.actor}
                      {activity.actorEmail && (
                        <span className="text-neutral-400"> ({activity.actorEmail})</span>
                      )}
                    </p>
                    {activity.details && (
                      <span className="text-xs px-2 py-0.5 bg-neutral-100 dark:bg-neutral-700 rounded-full">
                        {activity.details.category || activity.details.service || ''}
                      </span>
                    )}
                  </div>
                </div>
                <div className="text-xs text-neutral-500 whitespace-nowrap flex-shrink-0">
                  {formatTimestamp(activity.timestamp)}
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </>
  );
}