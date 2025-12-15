"use client";
import React, { useState, useCallback } from "react";
import { Sidebar, SidebarBody, SidebarLink } from "@/app/components/ui/mitra-sidebar";
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
    IconChevronRight,
} from "@tabler/icons-react";
import { motion, AnimatePresence } from "motion/react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";

function cn(...classes: (string | boolean | undefined)[]) {
  return classes.filter(Boolean).join(' ');
}

// Komponen Modal Konfirmasi Logout (tetap sama)
function LogoutModal({ isOpen, onClose, onConfirm }: { isOpen: boolean; onClose: () => void; onConfirm: () => void }) {
  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 z-[200]"
            onClick={onClose}
          />
          
          <div className="fixed inset-0 flex items-center justify-center z-[201] p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              transition={{ duration: 0.2 }}
              className="bg-white dark:bg-neutral-800 rounded-lg shadow-xl max-w-md w-full p-6"
            >
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
                  className="px-4 py-2 rounded-md bg-gradient-to-r from-[#7CE0A8] to-[#5DD494] text-white hover:from-[#6bcb96] hover:to-[#4cc383] transition-all shadow-md"
                >
                  Ya, Logout
                </button>
              </div>
            </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>
  );
}

export default function MitraLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();
  
  // ✅ Semua hooks dipanggil di awal TANPA conditional
  const [open, setOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [logoutModalOpen, setLogoutModalOpen] = useState(false);

  // ✅ Cek apakah ini halaman login - TANPA early return
  const isLoginPage = pathname === '/mitra/login';

  const links = [
    {
      label: "Dashboard",
      href: "/mitra/dashboard",
      icon: <IconDashboard />,
    },
    {
      label: "Orders",
      href: "/mitra/orders",
      icon: <IconUsers />,
    },
    {
      label: "Chat",
      href: "/mitra/chat",
      icon: <IconMessage />,
    },
    {
      label: "Ulasan",
      href: "/mitra/ulasan",
      icon: <IconStar />,
    },
  ];

  const toggleSettings = useCallback(() => {
    setSettingsOpen(prev => !prev);
  }, []);

  const handleLogoutClick = (e: React.MouseEvent) => {
    e.preventDefault();
    setLogoutModalOpen(true);
  };

  const handleLogoutConfirm = () => {
    setLogoutModalOpen(false);
    
    if (typeof window !== 'undefined') {
      localStorage.removeItem('mitraToken');
      localStorage.removeItem('mitraUser');
      sessionStorage.clear();
      
      document.cookie.split(";").forEach((c) => {
        document.cookie = c
          .replace(/^ +/, "")
          .replace(/=.*/, "=;expires=" + new Date().toUTCString() + ";path=/");
      });
    }
    
    router.push('/mitra/login');
    router.refresh();
  };

  const isSettingsActive = pathname.startsWith('/mitra/settings');

  // ✅ Kembalikan layout yang berbeda berdasarkan kondisi di dalam JSX
  if (isLoginPage) {
    return <>{children}</>;
  }

  return (
    <>
      <div className="flex h-screen w-full overflow-hidden">
        <Sidebar open={open} setOpen={setOpen}>
          <SidebarBody className="justify-between gap-8">
            <div className="flex flex-1 flex-col overflow-x-hidden overflow-y-auto">
              {open ? <Logo /> : <LogoIcon />}

              {open && (
                <div className="my-2">
                  <div className="h-[2px] w-full bg-gradient-to-r from-[#7CE0A8]/40 via-[#7CE0A8] to-[#7CE0A8]/40"></div>
                </div>
              )}

              <div className="mt-1 flex flex-col gap-2">
                {links.map((link, idx) => (
                  <SidebarLink key={idx} link={link} />
                ))}

                {/* Menu Settings dengan Submenu */}
                <div className="flex flex-col">
                  <button
                    onClick={toggleSettings}
                    className={cn(
                      "flex items-center justify-between gap-2 group/sidebar py-2 rounded-md transition-all duration-300 w-full",
                      open ? "px-2" : "px-0 justify-center",
                      isSettingsActive
                        ? "bg-gradient-to-r from-[#7CE0A8] to-[#5DD494] shadow-md shadow-[#7CE0A8]/30 text-white dark:from-[#7CE0A8] dark:to-[#5DD494] dark:text-white"
                        : "hover:bg-neutral-200 dark:hover:bg-neutral-700"
                    )}
                  >
                    <div className={cn("flex items-center gap-2", !open && "justify-center w-full")}>
                      <IconSettings className={cn(
                        "h-5 w-5 flex-shrink-0 transition-transform duration-300",
                        isSettingsActive 
                          ? "text-white" 
                          : "text-neutral-700 dark:text-neutral-200",
                        settingsOpen && "rotate-180"
                      )} />
                      {open && (
                        <motion.span
                          animate={{
                            display: open ? "inline-block" : "none",
                            opacity: open ? 1 : 0,
                          }}
                          className={cn(
                            "!m-0 inline-block whitespace-pre !p-0 text-sm transition duration-150",
                            isSettingsActive
                              ? "text-white font-medium"
                              : "text-neutral-700 dark:text-neutral-200"
                          )}
                        >
                          Settings
                        </motion.span>
                      )}
                    </div>
                    {open && (
                      <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                      >
                        {settingsOpen ? (
                          <IconChevronDown className={cn(
                            "h-4 w-4 transition-transform duration-200",
                            isSettingsActive
                              ? "text-white"
                              : "text-neutral-700 dark:text-neutral-200"
                          )} />
                        ) : (
                          <IconChevronRight className={cn(
                            "h-4 w-4 transition-transform duration-200",
                            isSettingsActive
                              ? "text-white"
                              : "text-neutral-700 dark:text-neutral-200"
                          )} />
                        )}
                      </motion.div>
                    )}
                  </button>

                  {settingsOpen && open && (
                    <motion.div
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="ml-[16px] mt-1 flex flex-col gap-1"
                    >
                      <Link
                        href="/mitra/settings/profile"
                        prefetch={true}
                        className={cn(
                          "flex items-center gap-2 rounded-md px-2 py-2 text-sm transition-all duration-300",
                          pathname === "/mitra/settings/profile" 
                            ? "bg-gradient-to-r from-[#7CE0A8]/90 to-[#5DD494]/90 text-white font-medium shadow-sm dark:from-[#7CE0A8]/90 dark:to-[#5DD494]/90 dark:text-white" 
                            : "text-neutral-600 hover:bg-gradient-to-r hover:from-neutral-100 hover:to-neutral-50 dark:text-neutral-300 dark:hover:from-neutral-800 dark:hover:to-neutral-750"
                        )}
                      >
                        <IconUser className="h-4 w-4 flex-shrink-0" />
                        <span>Profile</span>
                      </Link>
                      <Link
                        href="/mitra/settings/services"
                        prefetch={true}
                        className={cn(
                          "flex items-center gap-2 rounded-md px-2 py-2 text-sm transition-all duration-300",
                          pathname === "/mitra/settings/services" 
                            ? "bg-gradient-to-r from-[#7CE0A8]/90 to-[#5DD494]/90 text-white font-medium shadow-sm dark:from-[#7CE0A8]/90 dark:to-[#5DD494]/90 dark:text-white" 
                            : "text-neutral-600 hover:bg-gradient-to-r hover:from-neutral-100 hover:to-neutral-50 dark:text-neutral-300 dark:hover:from-neutral-800 dark:hover:to-neutral-750"
                        )}
                      >
                        <IconBriefcase className="h-4 w-4 flex-shrink-0" />
                        <span>Services</span>
                      </Link>
                    </motion.div>
                  )}
                </div>

                {/* Logout Button */}
                <button
                  onClick={handleLogoutClick}
                  className={cn(
                    "flex items-center group/sidebar py-2 rounded-md transition-all duration-300",
                    open ? "justify-start gap-2 px-2" : "justify-center",
                    "hover:bg-neutral-200 dark:hover:bg-neutral-700"
                  )}
                >
                  <div className="flex-shrink-0">
                    <IconArrowLeft className="h-5 w-5 text-neutral-700 dark:text-neutral-200" />
                  </div>
                  <motion.span
                    animate={{
                      display: open ? "inline-block" : "none",
                      opacity: open ? 1 : 0,
                    }}
                    className="text-sm group-hover/sidebar:translate-x-1 transition duration-150 whitespace-pre inline-block !p-0 !m-0 text-neutral-700 dark:text-neutral-200"
                  >
                    Logout
                  </motion.span>
                </button>
              </div>
            </div>
            <div className="mt-auto">
              <Link
                href="/mitra/settings/profile"
                className={cn(
                  "flex items-center rounded-md transition-colors hover:bg-neutral-200 dark:hover:bg-neutral-700",
                  open ? "justify-start gap-2 py-2 px-2" : "justify-center py-2"
                )}
                prefetch={true}
              >
                <img
                  src="https://assets.aceternity.com/manu.png"
                  className="h-7 w-7 shrink-0 rounded-full"
                  width={50}
                  height={50}
                  alt="Avatar"
                />
                {open && (
                  <motion.span
                    animate={{
                      display: open ? "inline-block" : "none",
                      opacity: open ? 1 : 0,
                    }}
                    className="text-sm text-neutral-700 dark:text-neutral-200 whitespace-pre inline-block !p-0 !m-0"
                  >
                    Mitra
                  </motion.span>
                )}
              </Link>
            </div>
          </SidebarBody>
        </Sidebar>
        
        <div className="flex-1 overflow-auto">
          <div className="p-4 md:p-6 rounded-tl-2xl border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-900 flex flex-col gap-4 flex-1 w-full h-full">
            {children}
          </div>
        </div>
      </div>

      <LogoutModal
        isOpen={logoutModalOpen}
        onClose={() => setLogoutModalOpen(false)}
        onConfirm={handleLogoutConfirm}
      />
    </>
  );
}

const Logo = () => {
  return (
    <Link
      href="/mitra/dashboard"
      className="relative z-20 flex items-center space-x-3 py-2 pl-3 text-sm font-normal text-black"
      prefetch={true}
    >
      <div className="relative flex items-center justify-center h-10 w-10 shrink-0">
        <img
          src="/icon512_rounded.png"
          alt="MARIJASA Logo"
          className="h-full w-full object-contain"
        />
      </div>
      <motion.span
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="font-bold whitespace-pre text-[#7CE0A8] dark:text-white text-2xl tracking-wider"
      >
        MARIJASA
      </motion.span>
    </Link>
  );
};

const LogoIcon = () => {
  return (
    <Link
      href="/mitra/dashboard"
      className="relative z-20 flex items-center justify-center py-2 text-sm font-normal text-black"
      prefetch={true}
    >
      <div className="relative h-10 w-10 shrink-0">
        <img
          src="/icon512_rounded.png"
          alt="MARIJASA Logo"
          className="h-full w-full object-contain"
        />
      </div>
    </Link>
  );
};