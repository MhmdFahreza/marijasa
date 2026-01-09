// mitra-layout.tsx
"use client";
import React, { useState, useCallback, useMemo, useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import { Sidebar, SidebarBody } from "@/app/components/ui/mitra-sidebar";
import {
    IconArrowLeft,
    IconDashboard,
    IconUsers,
    IconMessage,
    IconStar,
    IconSettings,
    IconUser,
    IconBriefcase,
    IconChevronDown,
} from "@tabler/icons-react";
import { AnimatePresence, motion } from "motion/react";
import { LoaderTwo } from "@/app/components/transition/loader"; 
import { toast } from "sonner";

function cn(...classes: (string | boolean | undefined)[]) {
  return classes.filter(Boolean).join(' ');
}

// Page Navigation Loader Component
const PageNavigationLoader = () => (
  <motion.div
    initial={{ opacity: 0 }}
    animate={{ opacity: 1 }}
    exit={{ opacity: 0 }}
    transition={{ duration: 0.2 }}
    className="fixed inset-0 bg-white/90 dark:bg-neutral-900/90 backdrop-blur-sm z-[150] flex flex-col items-center justify-center gap-6"
  >
    <div className="flex flex-col items-center gap-4">
      <LoaderTwo />
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="text-center"
      >
        <p className="text-base font-medium text-neutral-700 dark:text-neutral-300">
          Memuat halaman...
        </p>
        <p className="text-sm text-neutral-500 dark:text-neutral-400 mt-1">
          Mohon tunggu sebentar
        </p>
      </motion.div>
    </div>
  </motion.div>
);

const LogoutModal = React.memo(({ 
  isOpen, 
  onClose, 
  onConfirm, 
  isLoggingOut 
}: { 
  isOpen: boolean; 
  onClose: () => void; 
  onConfirm: () => void;
  isLoggingOut: boolean;
}) => {
  return (
    <AnimatePresence initial={false}>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 z-[200]"
            onClick={isLoggingOut ? undefined : onClose}
            style={{ willChange: 'opacity' }}
          />
          
          <div className="fixed inset-0 flex items-center justify-center z-[201] p-4 pointer-events-none">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              transition={{ duration: 0.15 }}
              className="bg-white dark:bg-neutral-800 rounded-lg shadow-xl max-w-md w-full p-6 pointer-events-auto"
              style={{ willChange: 'transform, opacity' }}
            >
              {isLoggingOut ? (
                <div className="text-center py-6">
                  <div className="mb-4">
                    <LoaderTwo />
                  </div>
                  <h3 className="text-lg font-semibold text-neutral-900 dark:text-white mb-2">
                    Sedang Logout...
                  </h3>
                  <p className="text-neutral-600 dark:text-neutral-300">
                    Membersihkan sesi dan mengalihkan ke halaman login
                  </p>
                </div>
              ) : (
                <>
                  <h3 className="text-lg font-semibold text-neutral-900 dark:text-white mb-2">
                    Konfirmasi Logout
                  </h3>
                  <p className="text-neutral-600 dark:text-neutral-300 mb-6">
                    Apakah Anda yakin ingin keluar dari akun mitra?
                  </p>
                  
                  <div className="flex gap-3 justify-end">
                    <button
                      onClick={onClose}
                      className="px-4 py-2 rounded-md border border-neutral-300 dark:border-neutral-600 text-neutral-700 dark:text-neutral-200 hover:bg-neutral-100 dark:hover:bg-neutral-700 transition-colors"
                    >
                      Batal
                    </button>
                    <button
                      onClick={onConfirm}
                      className="px-4 py-2 rounded-md bg-gradient-to-r from-[#7CE0A8] to-[#5DD494] text-white hover:from-[#6bcb96] hover:to-[#4cc383] transition-all shadow-md flex items-center justify-center gap-2"
                    >
                      Ya, Logout
                    </button>
                  </div>
                </>
              )}
            </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>
  );
});

LogoutModal.displayName = "LogoutModal";

const Logo = React.memo(({ onClick }: { onClick: () => void }) => {
  return (
    <div
      className="relative z-20 flex items-center space-x-3 py-2 pl-3 text-sm font-normal text-black cursor-pointer"
      onClick={onClick}
    >
      <div className="relative flex items-center justify-center h-10 w-10 shrink-0">
        <img
          src="/icon512_rounded.png"
          alt="MARIJASA Logo"
          className="h-full w-full object-contain"
          loading="eager"
          decoding="async"
        />
      </div>
      <span className="font-bold whitespace-pre text-[#7CE0A8] dark:text-white text-2xl tracking-wider">
        MARIJASA
      </span>
    </div>
  );
});

Logo.displayName = "Logo";

const LogoIcon = React.memo(({ onClick }: { onClick: () => void }) => {
  return (
    <div
      className="relative z-20 flex items-center justify-center py-2 text-sm font-normal text-black cursor-pointer"
      onClick={onClick}
    >
      <div className="relative h-10 w-10 shrink-0">
        <img
          src="/icon512_rounded.png"
          alt="MARIJASA Logo"
          className="h-full w-full object-contain"
          loading="eager"
          decoding="async"
        />
      </div>
    </div>
  );
});

LogoIcon.displayName = "LogoIcon";

export default function DashboardLayout({
  children,
}: {
  children?: React.ReactNode;
}) {
  const [open, setOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [logoutModalOpen, setLogoutModalOpen] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [isNavigating, setIsNavigating] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const pathname = usePathname();
  const router = useRouter();

  // State untuk profile data dari API
  const [mitraProfile, setMitraProfile] = useState<{
    name: string;
    avatar: string;
    verified?: boolean;
    role?: string;
    email?: string;
  }>({
    name: "Nama Mitra",
    avatar: "https://assets.aceternity.com/manu.png"
  });

  // PERBAIKAN: Reset isNavigating ketika pathname berubah
  useEffect(() => {
    setIsNavigating(false);
  }, [pathname]);

  // Fetch mitra profile dari API
  const fetchMitraProfile = async () => {
    try {
      const response = await fetch('/api/mitra/profile', {
        method: 'GET',
        credentials: 'include',
      });

      if (!response.ok) {
        if (response.status === 401) {
          router.push('/mitra/login');
          return;
        }
        throw new Error('Gagal memuat profil');
      }

      const data = await response.json();
      if (data.vendor) {
        setMitraProfile({
          name: data.vendor.name || "Nama Mitra",
          avatar: data.vendor.avatar || "https://assets.aceternity.com/manu.png",
          verified: data.vendor.verified,
          role: 'vendor',
          email: data.vendor.email
        });
      }
    } catch (error) {
      console.error('Error fetching mitra profile:', error);
      router.push('/mitra/login');
    } finally {
      setIsLoading(false);
    }
  };

  // Check authentication on mount
  useEffect(() => {
    const checkAuth = async () => {
      try {
        const response = await fetch('/api/mitra/verify', {
          method: 'GET',
          credentials: 'include',
        });

        if (!response.ok) {
          router.push('/mitra/login');
          return;
        }

        await fetchMitraProfile();
      } catch (error) {
        console.error('Error checking auth:', error);
        router.push('/mitra/login');
      }
    };

    setMounted(true);
    checkAuth();
  }, [router]);

  // Determine active view based on pathname
  const activeView = useMemo(() => {
    if (pathname === '/mitra/dashboard') return 'dashboard';
    if (pathname === '/mitra/orders') return 'orders';
    if (pathname === '/mitra/chat') return 'chat';
    if (pathname === '/mitra/rating') return 'rating';
    if (pathname === '/mitra/settings/profile') return 'profile';
    if (pathname === '/mitra/settings/services') return 'services';
    return 'dashboard';
  }, [pathname]);

  // Auto open settings dropdown if on settings page
  useEffect(() => {
    if (activeView === 'profile' || activeView === 'services') {
      setSettingsOpen(true);
    }
  }, [activeView]);

  const links = useMemo(() => [
    {
      label: "Dashboard",
      id: "dashboard",
      href: "/mitra/dashboard",
      icon: <IconDashboard className="h-5 w-5 flex-shrink-0" />,
    },
    {
      label: "Orders",
      id: "orders",
      href: "/mitra/orders",
      icon: <IconUsers className="h-5 w-5 flex-shrink-0" />,
    },
    {
      label: "Chat",
      id: "chat",
      href: "/mitra/chat",
      icon: <IconMessage className="h-5 w-5 flex-shrink-0" />,
    },
    {
      label: "Rating",
      id: "rating",
      href: "/mitra/rating",
      icon: <IconStar className="h-5 w-5 flex-shrink-0" />,
    },
  ], []);

  const handleNavigation = useCallback((href: string) => {
    // Jangan navigasi jika sudah di halaman yang sama atau sedang navigasi
    if (pathname === href || isNavigating) return;
    
    // Show loading
    setIsNavigating(true);
    
    // PERBAIKAN: Navigasi langsung tanpa timeout
    router.push(href);
  }, [router, pathname, isNavigating]);

  const toggleSettings = useCallback(() => {
    setSettingsOpen(prev => !prev);
  }, []);

  const handleLogoutClick = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    setLogoutModalOpen(true);
  }, []);

  const handleLogoutConfirm = useCallback(async () => {
    setIsLoggingOut(true);
    
    try {
      const response = await fetch('/api/mitra/logout', {
        method: 'POST',
        credentials: 'include',
      });

      if (response.ok) {
        // Langsung redirect setelah logout sukses
        window.location.href = '/mitra/login';
      } else {
        toast.error('Gagal logout');
        setIsLoggingOut(false);
        setLogoutModalOpen(false);
      }
    } catch (error) {
      console.error('Logout error:', error);
      toast.error('Terjadi kesalahan saat logout');
      setIsLoggingOut(false);
      setLogoutModalOpen(false);
    }
  }, []);

  // Show loading state until mounted and profile loaded
  if (!mounted || isLoading) {
    return (
      <div className="flex items-center justify-center h-screen bg-white dark:bg-neutral-900">
        <div className="text-center">
          <LoaderTwo />
          <p className="text-neutral-600 dark:text-neutral-400 mt-6 text-sm">Memuat halaman admin...</p>
        </div>
      </div>
    );
  }

  return (
    <>
      {/* Page Navigation Loader */}
      <AnimatePresence mode="wait">
        {isNavigating && <PageNavigationLoader />}
      </AnimatePresence>

      <div className="flex h-screen w-full overflow-hidden">
        <Sidebar open={open} setOpen={setOpen}>
          <SidebarBody className="justify-between gap-8">
            <div className="flex flex-1 flex-col overflow-x-hidden overflow-y-auto">
              {open ? (
                <Logo onClick={() => handleNavigation('/mitra/dashboard')} />
              ) : (
                <LogoIcon onClick={() => handleNavigation('/mitra/dashboard')} />
              )}

              {open && (
                <div className="my-2">
                  <div className="h-[2px] w-full bg-gradient-to-r from-[#7CE0A8]/40 via-[#7CE0A8] to-[#7CE0A8]/40"></div>
                </div>
              )}

              <div className="mt-1 flex flex-col gap-2">
                {links.map((link) => (
                  <button
                    key={link.id}
                    onClick={() => handleNavigation(link.href)}
                    disabled={isLoggingOut || isNavigating}
                    className={cn(
                      "flex items-center group/sidebar py-2 rounded-md transition-all duration-150",
                      open ? "justify-start gap-2 px-2" : "justify-center",
                      activeView === link.id
                        ? "bg-gradient-to-r from-[#7CE0A8] to-[#5DD494] shadow-md shadow-[#7CE0A8]/30 text-white dark:from-[#7CE0A8] dark:to-[#5DD494] dark:text-white"
                        : "hover:bg-neutral-200 dark:hover:bg-neutral-700 text-neutral-700 dark:text-neutral-200",
                      (isLoggingOut || isNavigating) && "opacity-50 cursor-not-allowed"
                    )}
                  >
                    <div className={cn(
                      "flex-shrink-0",
                      activeView === link.id 
                        ? "text-white" 
                        : "text-neutral-700 dark:text-neutral-200"
                    )}>
                      {link.icon}
                    </div>
                    {open && (
                      <span className="text-sm whitespace-pre inline-block !p-0 !m-0">
                        {link.label}
                      </span>
                    )}
                  </button>
                ))}

                <div className="flex flex-col">
                  <button
                    onClick={toggleSettings}
                    disabled={isLoggingOut || isNavigating}
                    className={cn(
                      "flex items-center justify-between gap-2 group/sidebar py-2 rounded-md transition-all duration-150 w-full",
                      open ? "px-2" : "px-0 justify-center",
                      (activeView === 'profile' || activeView === 'services')
                        ? "bg-gradient-to-r from-[#7CE0A8] to-[#5DD494] shadow-md shadow-[#7CE0A8]/30 text-white dark:from-[#7CE0A8] dark:to-[#5DD494] dark:text-white"
                        : "hover:bg-neutral-200 dark:hover:bg-neutral-700",
                      (isLoggingOut || isNavigating) && "opacity-50 cursor-not-allowed"
                    )}
                  >
                    <div className={cn("flex items-center gap-2", !open && "justify-center w-full")}>
                      <IconSettings className={cn(
                        "h-5 w-5 flex-shrink-0",
                        (activeView === 'profile' || activeView === 'services')
                          ? "text-white" 
                          : "text-neutral-700 dark:text-neutral-200"
                      )} />
                      {open && (
                        <span className={cn(
                          "!m-0 inline-block whitespace-pre !p-0 text-sm",
                          (activeView === 'profile' || activeView === 'services')
                            ? "text-white font-medium"
                            : "text-neutral-700 dark:text-neutral-200"
                        )}>
                          Settings
                        </span>
                      )}
                    </div>
                    {open && (
                      <motion.div
                        animate={{ rotate: settingsOpen ? 0 : -90 }}
                        transition={{ duration: 0.2 }}
                      >
                        <IconChevronDown className={cn(
                          "h-4 w-4",
                          (activeView === 'profile' || activeView === 'services')
                            ? "text-white"
                            : "text-neutral-700 dark:text-neutral-200"
                        )} />
                      </motion.div>
                    )}
                  </button>

                  <AnimatePresence initial={false}>
                    {settingsOpen && open && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.15 }}
                        className="ml-[16px] mt-1 flex flex-col gap-1 overflow-hidden"
                      >
                        <button
                          onClick={() => handleNavigation('/mitra/settings/profile')}
                          disabled={isLoggingOut || isNavigating}
                          className={cn(
                            "flex items-center gap-2 rounded-md px-2 py-2 text-sm transition-all duration-150",
                            activeView === 'profile'
                              ? "bg-gradient-to-r from-[#7CE0A8]/90 to-[#5DD494]/90 text-white font-medium shadow-sm dark:from-[#7CE0A8]/90 dark:to-[#5DD494]/90 dark:text-white" 
                              : "text-neutral-600 hover:bg-gradient-to-r hover:from-neutral-100 hover:to-neutral-50 dark:text-neutral-300 dark:hover:from-neutral-800 dark:hover:to-neutral-750",
                            (isLoggingOut || isNavigating) && "opacity-50 cursor-not-allowed"
                          )}
                        >
                          <IconUser className="h-4 w-4 flex-shrink-0" />
                          <span>Profile</span>
                        </button>
                        <button
                          onClick={() => handleNavigation('/mitra/settings/services')}
                          disabled={isLoggingOut || isNavigating}
                          className={cn(
                            "flex items-center gap-2 rounded-md px-2 py-2 text-sm transition-all duration-150",
                            activeView === 'services'
                              ? "bg-gradient-to-r from-[#7CE0A8]/90 to-[#5DD494]/90 text-white font-medium shadow-sm dark:from-[#7CE0A8]/90 dark:to-[#5DD494]/90 dark:text-white" 
                              : "text-neutral-600 hover:bg-gradient-to-r hover:from-neutral-100 hover:to-neutral-50 dark:text-neutral-300 dark:hover:from-neutral-800 dark:hover:to-neutral-750",
                            (isLoggingOut || isNavigating) && "opacity-50 cursor-not-allowed"
                          )}
                        >
                          <IconBriefcase className="h-4 w-4 flex-shrink-0" />
                          <span>Services</span>
                        </button>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>

                <button
                  onClick={handleLogoutClick}
                  disabled={isLoggingOut || isNavigating}
                  className={cn(
                    "flex items-center group/sidebar py-2 rounded-md transition-all duration-150",
                    open ? "justify-start gap-2 px-2" : "justify-center",
                    "hover:bg-neutral-200 dark:hover:bg-neutral-700 text-neutral-700 dark:text-neutral-200",
                    (isLoggingOut || isNavigating) && "opacity-50 cursor-not-allowed"
                  )}
                >
                  <div className="flex-shrink-0">
                    <IconArrowLeft className="h-5 w-5" />
                  </div>
                  {open && (
                    <span className="text-sm whitespace-pre inline-block !p-0 !m-0">
                      Logout
                    </span>
                  )}
                </button>
              </div>
            </div>
            <div className="mt-auto">
              <button
                onClick={() => handleNavigation('/mitra/settings/profile')}
                disabled={isLoggingOut || isNavigating}
                className={cn(
                  "flex items-center rounded-md transition-all duration-150 hover:bg-neutral-200 dark:hover:bg-neutral-700",
                  open ? "justify-start gap-2 py-2 px-2" : "justify-center py-2",
                  (isLoggingOut || isNavigating) && "opacity-50 cursor-not-allowed"
                )}
              >
                <motion.img
                  key={mitraProfile.avatar}
                  initial={{ scale: 0.8, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ duration: 0.3 }}
                  src={mitraProfile.avatar}
                  className="h-7 w-7 shrink-0 rounded-full object-cover"
                  width={50}
                  height={50}
                  alt="Avatar"
                  loading="lazy"
                  decoding="async"
                />
                {open && (
                  <motion.div
                    key={mitraProfile.name}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.3 }}
                    className="flex flex-col items-start"
                  >
                    <span className="text-sm text-neutral-700 dark:text-neutral-200 whitespace-pre inline-block !p-0 !m-0">
                      {mitraProfile.name}
                    </span>
                    {mitraProfile.verified && (
                      <span className="text-xs text-[#7CE0A8] font-medium">
                        Verified
                      </span>
                    )}
                  </motion.div>
                )}
              </button>
            </div>
          </SidebarBody>
        </Sidebar>
        
        <div className="flex-1 overflow-auto relative">
          <div className="p-4 md:p-6 rounded-tl-2xl border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-900 flex flex-col gap-4 flex-1 w-full h-full">
            {children}
          </div>
        </div>
      </div>

      <LogoutModal
        isOpen={logoutModalOpen}
        onClose={() => !isLoggingOut && setLogoutModalOpen(false)}
        onConfirm={handleLogoutConfirm}
        isLoggingOut={isLoggingOut}
      />
    </>
  );
}