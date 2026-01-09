"use client";
import React, { useState, useEffect } from "react";
import { Sidebar, SidebarBody, SidebarLink } from "@/app/components/ui/admin-sidebar";
import {
  IconDashboard,
  IconUsers,
  IconFileText,
  IconUserCheck,
  IconUserPlus,
  IconLogout,
  IconChevronDown,
  IconChartBar,
} from "@tabler/icons-react";
import { motion, AnimatePresence } from "framer-motion";
import { useRouter, usePathname } from "next/navigation";
import { useSidebar } from "@/app/components/ui/admin-sidebar";

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [open, setOpen] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const [mitraOpen, setMitraOpen] = useState(true);
  const [mounted, setMounted] = useState(false);
  const [adminData, setAdminData] = useState<any>(null);
  const router = useRouter();
  const pathname = usePathname();

  // Handle hydration - must be first useEffect
  useEffect(() => {
    setMounted(true);
  }, []);

  // Verify session and handle token refresh
  useEffect(() => {
    if (!mounted) return;
    
    let refreshInterval: NodeJS.Timeout;

    const verifySession = async () => {
      try {
        const response = await fetch('/api/admin/verify', {
          method: 'GET',
          credentials: 'include',
        });

        const data = await response.json();

        if (response.ok) {
          setIsAuthenticated(true);
          setAdminData(data.admin);
          setLoading(false);
          return true;
        } else if (data.shouldRefresh) {
          // Try to refresh token
          const refreshed = await refreshToken();
          if (refreshed) {
            return true;
          }
        }

        // If verification failed and refresh failed, redirect to login
        router.push('/admin/login');
        return false;
      } catch (error) {
        console.error('[Admin Layout] Verification error:', error);
        router.push('/admin/login');
        return false;
      }
    };

    const refreshToken = async () => {
      try {
        console.log('[Admin Layout] Refreshing access token...');
        const response = await fetch('/api/admin/refresh', {
          method: 'POST',
          credentials: 'include',
        });

        if (response.ok) {
          console.log('[Admin Layout] Token refreshed successfully');
          setIsAuthenticated(true);
          
          // Verify again to get admin data
          const verifyResponse = await fetch('/api/admin/verify', {
            method: 'GET',
            credentials: 'include',
          });

          if (verifyResponse.ok) {
            const verifyData = await verifyResponse.json();
            setAdminData(verifyData.admin);
          }

          setLoading(false);
          return true;
        } else {
          console.log('[Admin Layout] Token refresh failed');
          return false;
        }
      } catch (error) {
        console.error('[Admin Layout] Refresh error:', error);
        return false;
      }
    };

    // Initial verification
    verifySession();

    // Set up auto-refresh every 50 minutes (before 1 hour expiry)
    refreshInterval = setInterval(() => {
      console.log('[Admin Layout] Auto-refreshing token...');
      refreshToken();
    }, 50 * 60 * 1000); // 50 minutes

    return () => {
      if (refreshInterval) {
        clearInterval(refreshInterval);
      }
    };
  }, [mounted, router]);

  const handleLogout = () => {
    setShowLogoutConfirm(true);
  };

  const confirmLogout = async () => {
    try {
      await fetch('/api/admin/logout', {
        method: 'POST',
        credentials: 'include',
      });
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      router.push('/admin/login');
      router.refresh();
    }
  };

  const cancelLogout = () => {
    setShowLogoutConfirm(false);
  };

  const toggleMitraMenu = () => {
    setMitraOpen(!mitraOpen);
  };

  const mainLinks = [
    {
      label: "Dashboard",
      href: "/admin/dashboard",
      icon: (
        <IconDashboard className="text-neutral-700 dark:text-neutral-200 h-5 w-5 flex-shrink-0" />
      ),
    },
    {
      label: "User",
      href: "/admin/user",
      icon: (
        <IconUsers className="text-neutral-700 dark:text-neutral-200 h-5 w-5 flex-shrink-0" />
      ),
    },
    {
      label: "Transaksi",
      href: "/admin/transaksi",
      icon: (
        <IconFileText className="text-neutral-700 dark:text-neutral-200 h-5 w-5 flex-shrink-0" />
      ),
    },
    {
      label: "Reports",
      href: "/admin/reports",
      icon: (
        <IconChartBar className="text-neutral-700 dark:text-neutral-200 h-5 w-5 flex-shrink-0" />
      ),
    },
  ];

  const mitraSubmenu = [
    {
      label: "Approval",
      href: "/admin/mitra/approval",
      icon: <IconUserCheck className="h-4 w-4 text-neutral-500" />,
    },
    {
      label: "Member",
      href: "/admin/mitra/member",
      icon: <IconUserPlus className="h-4 w-4 text-neutral-500" />,
    },
  ];

  // Show loading state until mounted and auth check is complete
  if (!mounted || loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <div className="h-8 w-8 border-4 border-[#7CE0A8] border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-neutral-600">Loading...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return null;
  }

  return (
    <div className="flex h-screen w-full overflow-hidden relative">
      {/* Logout Confirmation Modal */}
      {showLogoutConfirm && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-neutral-800 rounded-xl p-6 max-w-sm w-full">
            <h3 className="text-lg font-semibold mb-2">Konfirmasi Logout</h3>
            <p className="text-neutral-600 dark:text-neutral-300 mb-6">
              Apakah Anda yakin ingin logout dari akun admin?
            </p>
            <div className="flex gap-3">
              <button
                onClick={cancelLogout}
                className="flex-1 py-2 px-4 border border-neutral-300 dark:border-neutral-600 rounded-lg hover:bg-neutral-50 dark:hover:bg-neutral-700 transition-colors"
              >
                Batal
              </button>
              <button
                onClick={confirmLogout}
                className="flex-1 py-2 px-4 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors"
              >
                Ya, Logout
              </button>
            </div>
          </div>
        </div>
      )}

      <Sidebar open={open} setOpen={setOpen}>
        <SidebarBody className="justify-between gap-10">
          <div className="flex flex-1 flex-col overflow-x-hidden overflow-y-auto">
            {open ? <Logo /> : <LogoIcon />}
            
            <div className="mt-8 flex flex-col gap-1">
              {/* Main Links */}
              {mainLinks.map((link, idx) => (
                <SidebarLink 
                  key={idx} 
                  link={link} 
                  className={`px-4 py-3 hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded-lg transition-colors ${
                    pathname === link.href ? 'bg-[#7CE0A8]/10 border-l-4 border-[#7CE0A8]' : ''
                  }`}
                />
              ))}
              
              {/* Mitra Dropdown */}
              <div className="mt-1">
                <MitraDropdown 
                  isOpen={mitraOpen}
                  onToggle={toggleMitraMenu}
                  submenu={mitraSubmenu}
                  pathname={pathname}
                />
              </div>
              
              {/* Logout Button */}
              <LogoutButton onClick={handleLogout} />
            </div>
          </div>
          
          {/* Admin Info */}
          {open && <AdminInfo adminData={adminData} />}
        </SidebarBody>
      </Sidebar>
      
      {/* Main Content Area */}
      <div className="flex-1 overflow-auto">
        <div className="p-6 md:p-10 rounded-tl-2xl border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-900 flex flex-col gap-6 flex-1 w-full h-full">
          {children}
        </div>
      </div>
    </div>
  );
}

// Custom Mitra Dropdown Component
const MitraDropdown = ({ 
  isOpen, 
  onToggle, 
  submenu,
  pathname
}: { 
  isOpen: boolean; 
  onToggle: () => void;
  submenu: Array<{label: string; href: string; icon: React.ReactNode}>;
  pathname: string;
}) => {
  const { open: sidebarOpen, animate } = useSidebar();
  const isActive = pathname.startsWith('/admin/mitra');

  return (
    <div>
      <button
        onClick={onToggle}
        className={`flex items-center gap-2 group/sidebar py-2 relative w-full px-4 hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded-lg transition-colors ${
          isActive ? 'bg-[#7CE0A8]/10 border-l-4 border-[#7CE0A8]' : ''
        }`}
        style={{
          justifyContent: animate ? (sidebarOpen ? "start" : "center") : "start",
        }}
      >
        <div className="flex-shrink-0 w-6 h-6 flex items-center justify-center">
          <IconUsers className="text-neutral-700 dark:text-neutral-200 h-5 w-5" />
        </div>

        <motion.span
          animate={{
            display: animate ? (sidebarOpen ? "flex" : "none") : "flex",
            opacity: animate ? (sidebarOpen ? 1 : 0) : 1,
          }}
          className="text-neutral-700 dark:text-neutral-200 text-sm transition duration-150 whitespace-pre flex-1 flex items-center justify-between"
        >
          <span>Mitra</span>
          <motion.div
            animate={{ rotate: isOpen ? 0 : -90 }}
            transition={{ duration: 0.2 }}
          >
            <IconChevronDown className="h-4 w-4" />
          </motion.div>
        </motion.span>
      </button>
      
      <AnimatePresence>
        {sidebarOpen && isOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="ml-8 mt-1 flex flex-col gap-1 border-l border-neutral-200 dark:border-neutral-700 pl-4">
              {submenu.map((subItem, subIdx) => (
                <SidebarLink 
                  key={subIdx} 
                  link={subItem} 
                  className={`pl-3 py-2.5 text-sm hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded-lg transition-colors ${
                    pathname === subItem.href ? 'bg-[#7CE0A8]/20 font-medium' : ''
                  }`}
                />
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

// Custom Logout Button Component
const LogoutButton = ({ onClick }: { onClick: () => void }) => {
  const { open: sidebarOpen, animate } = useSidebar();

  return (
    <button
      onClick={onClick}
      className="flex items-center gap-2 group/sidebar py-2 relative mt-4 px-4 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
      style={{
        justifyContent: animate ? (sidebarOpen ? "start" : "center") : "start",
      }}
    >
      <div className="flex-shrink-0 w-6 h-6 flex items-center justify-center">
        <IconLogout className="text-neutral-700 dark:text-neutral-200 group-hover/sidebar:text-red-600 dark:group-hover/sidebar:text-red-400 h-5 w-5 transition-colors" />
      </div>

      <motion.span
        animate={{
          display: animate ? (sidebarOpen ? "inline-block" : "none") : "inline-block",
          opacity: animate ? (sidebarOpen ? 1 : 0) : 1,
        }}
        className="text-neutral-700 dark:text-neutral-200 group-hover/sidebar:text-red-600 dark:group-hover/sidebar:text-red-400 text-sm transition duration-150 whitespace-pre"
      >
        Logout
      </motion.span>
    </button>
  );
};

const AdminInfo = ({ adminData }: { adminData: any }) => {
  return (
    <div className="border-t border-neutral-200 dark:border-neutral-700 pt-4">
      <div className="flex items-center gap-3 px-4 py-3">
        <div className="h-9 w-9 rounded-full bg-gradient-to-br from-[#7CE0A8] to-emerald-400 flex items-center justify-center text-white font-semibold shadow-sm">
          <span className="text-lg">{adminData?.name?.charAt(0) || 'A'}</span>
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-medium text-sm truncate">{adminData?.name || 'Administrator'}</p>
          <p className="text-xs text-neutral-500 truncate">{adminData?.email || 'admin@example.com'}</p>
        </div>
      </div>
    </div>
  );
};

export const Logo = () => {
  return (
    <a
      href="/admin/dashboard"
      className="relative z-20 flex items-center space-x-2 py-1 text-sm font-normal text-black"
    >
      <div className="h-8 w-8 shrink-0 rounded-tl-lg rounded-tr-sm rounded-br-lg rounded-bl-sm bg-gradient-to-br from-[#7CE0A8] to-emerald-400 flex items-center justify-center">
        <div className="h-4 w-4 bg-white/20 rounded-sm"></div>
      </div>
      <motion.span
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="font-semibold whitespace-pre text-black dark:text-white text-base"
      >
        Admin Panel
      </motion.span>
    </a>
  );
};

export const LogoIcon = () => {
  return (
    <a
      href="/admin/dashboard"
      className="relative z-20 flex items-center justify-center py-1 text-sm font-normal text-black"
    >
      <div className="h-8 w-8 shrink-0 rounded-tl-lg rounded-tr-sm rounded-br-lg rounded-bl-sm bg-gradient-to-br from-[#7CE0A8] to-emerald-400 flex items-center justify-center">
        <div className="h-4 w-4 bg-white/20 rounded-sm"></div>
      </div>
    </a>
  );
};