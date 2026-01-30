// app/(user)/layout.tsx
"use client";

import { useEffect, useState, useRef, type ReactNode, useCallback } from "react";
import { useRouter, usePathname } from "next/navigation";
import Link from "next/link";
import {
  Navbar,
  NavBody,
  NavbarLogo,
  NavbarButton,
  MobileNav,
  MobileNavHeader,
  MobileNavToggle,
  MobileNavMenu,
  LanguageSelector,
} from "@/app/components/ui/resizable-navbar";
import { LoaderTwo } from "@/app/components/transition/loader";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/app/components/ui/dropdown-menu";
import {
  Heart,
  User,
  LogOut,
  Package,
  Bell,
  X,
  CheckCircle,
  Clock,
  AlertCircle,
  PlusCircle,
  CreditCard,
  ShoppingBag,
} from "lucide-react";
import { Badge } from "@/app/components/ui/badge";
import { useAuth } from "@/app/components/contexts/AuthContext";
import { useNotification } from "@/app/components/contexts/NotificationContext";
import { useLanguage } from "@/app/components/contexts/LanguageContext";

interface Notification {
  id: string;
  title: string;
  message: string;
  time: string;
  date: string;
  type:
    | "order"
    | "promo"
    | "system"
    | "reminder"
    | "additional_service"
    | "payment"
    | "completion"
    | "cancellation";
  read: boolean;
  orderId?: string;
}

export default function UserLayout({ children }: { children: ReactNode }) {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isNotificationOpen, setIsNotificationOpen] = useState(false);
  
  const notificationRef = useRef<HTMLDivElement>(null);
  const mobileNotificationRef = useRef<HTMLDivElement>(null);
  const router = useRouter();
  const pathname = usePathname();

  // Contexts
  const authContext = useAuth();
  const notificationContext = useNotification();
  const languageContext = useLanguage();
  
  // Auth
  const user = authContext.user;
  const isAuthenticated = authContext.isAuthenticated;
  const authLoading = authContext.isLoading;
  const logout = authContext.logout;
  
  // Notifications
  const notifications = notificationContext.notifications;
  const unreadCount = notificationContext.unreadCount;
  const markAllAsRead = notificationContext.markAllAsRead;
  const markAsRead = notificationContext.markAsRead;
  const deleteNotification = notificationContext.deleteNotification;
  const deleteAllNotifications = notificationContext.deleteAllNotifications;
  
  // Language
  const selectedLanguage = languageContext.language;
  const setLanguage = languageContext.setLanguage;

  // ============================================
  // EFFECTS
  // ============================================

  // Close notification dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Node;

      const isOutsideDesktop =
        notificationRef.current && !notificationRef.current.contains(target);
      const isOutsideMobile =
        mobileNotificationRef.current &&
        !mobileNotificationRef.current.contains(target);

      if (isOutsideDesktop && isOutsideMobile) {
        setIsNotificationOpen(false);
      }
    };

    if (isNotificationOpen) {
      setTimeout(() => {
        document.addEventListener("mousedown", handleClickOutside);
      }, 0);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isNotificationOpen]);

  // Close mobile menu on route change
  useEffect(() => {
    setIsMobileMenuOpen(false);
  }, [pathname]);

  // ============================================
  // HANDLERS
  // ============================================

  const handleSelectLanguage = useCallback(async (language: string) => {
    try {
      await setLanguage(language);
    } catch (error) {
      console.error("[Layout] Language change error:", error);
    }
  }, [setLanguage]);

  // Simple navigation - NO loading state for regular page transitions
  const handleSimpleNavigation = useCallback((path: string) => {
    if (pathname === path) {
      setIsMobileMenuOpen(false);
      return;
    }
    setIsMobileMenuOpen(false);
    router.push(path);
  }, [pathname, router]);

  const handleLogoClick = useCallback(() => {
    setIsMobileMenuOpen(false);
    if (pathname !== "/") {
      router.push("/");
    }
  }, [pathname, router]);

  // Logout needs loading state because it's an async operation
  const handleLogout = useCallback(async () => {
    setIsMobileMenuOpen(false);
    setIsNotificationOpen(false);
    setIsLoading(true);
    
    try {
      await logout();
      await notificationContext.resetNotifications();
    } catch (error) {
      console.error("[Layout] Logout error:", error);
    } finally {
      setIsLoading(false);
    }
  }, [logout, notificationContext]);

  const toggleNotification = useCallback(async () => {
    const newState = !isNotificationOpen;
    setIsNotificationOpen(newState);
    
    if (newState) {
      try {
        await markAllAsRead();
      } catch (error) {
        console.error("[Layout] Mark all read error:", error);
      }
    }
  }, [isNotificationOpen, markAllAsRead]);

  const getNotificationIcon = (type: Notification["type"]) => {
    switch (type) {
      case "order":
        return <ShoppingBag className="w-5 h-5 text-blue-500" />;
      case "payment":
        return <CreditCard className="w-5 h-5 text-green-500" />;
      case "additional_service":
        return <PlusCircle className="w-5 h-5 text-purple-500" />;
      case "completion":
        return <CheckCircle className="w-5 h-5 text-green-600" />;
      case "cancellation":
        return <AlertCircle className="w-5 h-5 text-red-500" />;
      case "promo":
        return <AlertCircle className="w-5 h-5 text-amber-500" />;
      case "reminder":
        return <Clock className="w-5 h-5 text-amber-500" />;
      default:
        return <Bell className="w-5 h-5 text-gray-500" />;
    }
  };

  const handleNotificationClick = useCallback(async (notification: Notification) => {
    try {
      await markAsRead(notification.id);

      if (notification.orderId) {
        setIsNotificationOpen(false);
        router.push("/riwayat_pemesanan");
      }
    } catch (error) {
      console.error("[Layout] Notification click error:", error);
    }
  }, [markAsRead, router]);

  const defaultAvatar = "/profile.svg";
  const userName = user?.name || "User";
  const userAvatar = user?.avatar || defaultAvatar;
  const userEmail = user?.email || "";

  // Loading screen during auth check
  if (authLoading) {
    return (
      <div className="relative w-full min-h-screen">
        <div className="fixed inset-0 flex justify-center items-center bg-white dark:bg-neutral-900 z-[9999]">
          <LoaderTwo />
        </div>
      </div>
    );
  }

  return (
    <div className="relative w-full min-h-screen">
      {/* Only show loader for actual async operations like logout */}
      {isLoading && (
        <div className="fixed inset-0 flex justify-center items-center bg-white dark:bg-neutral-900 z-[9999]">
          <LoaderTwo />
        </div>
      )}

      <Navbar>
        <NavBody>
          <div onClick={handleLogoClick} className="cursor-pointer">
            <NavbarLogo />
          </div>

          <div className="flex items-center gap-4">
            {isAuthenticated && user ? (
              <div className="flex items-center gap-4">
                <LanguageSelector
                  selectedLanguage={selectedLanguage}
                  onSelectLanguage={handleSelectLanguage}
                />

                {/* Desktop Notification Bell */}
                <div className="relative hidden md:block" ref={notificationRef}>
                  <button
                    onClick={toggleNotification}
                    className="relative p-2 rounded-full hover:bg-gray-100 dark:hover:bg-neutral-800 transition-colors"
                    aria-label="Notifikasi"
                  >
                    <Bell className="w-5 h-5 text-gray-700 dark:text-gray-300" />
                    {unreadCount > 0 && (
                      <span className="absolute -top-1 -right-1 flex items-center justify-center w-5 h-5 bg-red-500 text-white text-xs font-bold rounded-full animate-pulse">
                        {unreadCount > 9 ? "9+" : unreadCount}
                      </span>
                    )}
                  </button>

                  {/* Desktop Notification Dropdown */}
                  {isNotificationOpen && (
                    <div className="absolute right-0 top-full mt-2 w-80 md:w-96 bg-white dark:bg-neutral-800 rounded-lg shadow-xl border border-gray-200 dark:border-neutral-700 z-50 animate-in fade-in slide-in-from-top-2 duration-200">
                      <div className="p-4 border-b border-gray-200 dark:border-neutral-700">
                        <div className="flex items-center justify-between">
                          <h3 className="font-bold text-lg">Notifikasi</h3>
                          <div className="flex items-center gap-2">
                            {unreadCount > 0 && (
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  markAllAsRead();
                                }}
                                className="text-xs text-blue-500 hover:text-blue-700 transition-colors"
                              >
                                Tandai semua dibaca
                              </button>
                            )}
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                setIsNotificationOpen(false);
                              }}
                              className="p-1 rounded-full hover:bg-gray-100 dark:hover:bg-neutral-700 transition-colors"
                            >
                              <X className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                          {notifications.length} notifikasi • {unreadCount} belum dibaca
                        </p>
                      </div>

                      <div className="max-h-96 overflow-y-auto">
                        {notifications.length > 0 ? (
                          <div className="divide-y divide-gray-100 dark:divide-neutral-700">
                            {notifications.map((notification) => (
                              <div
                                key={notification.id}
                                onClick={() => handleNotificationClick(notification)}
                                className={`p-4 hover:bg-gray-50 dark:hover:bg-neutral-700 cursor-pointer transition-colors ${
                                  !notification.read
                                    ? "bg-blue-50 dark:bg-blue-900/10"
                                    : ""
                                }`}
                              >
                                <div className="flex gap-3">
                                  <div className="flex-shrink-0 mt-1">
                                    {getNotificationIcon(notification.type)}
                                  </div>
                                  <div className="flex-1 min-w-0">
                                    <div className="flex items-center justify-between gap-2 mb-1">
                                      <h4 className="font-semibold text-gray-900 dark:text-gray-100 truncate">
                                        {notification.title}
                                      </h4>
                                      <div className="flex items-center gap-1">
                                        {!notification.read && (
                                          <span className="w-2 h-2 bg-blue-500 rounded-full"></span>
                                        )}
                                        <button
                                          onClick={(e) =>
                                            deleteNotification(notification.id, e)
                                          }
                                          className="p-1 hover:bg-gray-200 dark:hover:bg-neutral-600 rounded transition-colors"
                                          title="Hapus notifikasi"
                                        >
                                          <X className="w-3 h-3 text-gray-500" />
                                        </button>
                                      </div>
                                    </div>
                                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-2 line-clamp-2">
                                      {notification.message}
                                    </p>
                                    <div className="flex items-center justify-between">
                                      <span className="text-xs text-gray-500 dark:text-gray-400">
                                        {notification.date} • {notification.time}
                                      </span>
                                      {notification.orderId && (
                                        <Badge variant="outline" className="text-xs">
                                          #{notification.orderId}
                                        </Badge>
                                      )}
                                    </div>
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <div className="p-8 text-center">
                            <Bell className="w-12 h-12 text-gray-300 dark:text-neutral-600 mx-auto mb-4" />
                            <p className="text-gray-500 dark:text-gray-400">
                              Tidak ada notifikasi
                            </p>
                            <p className="text-sm text-gray-400 dark:text-gray-500 mt-1">
                              Semua notifikasi akan muncul di sini
                            </p>
                          </div>
                        )}
                      </div>

                      {notifications.length > 0 && (
                        <div className="p-4 border-t border-gray-200 dark:border-neutral-700">
                          <button
                            onClick={(e) => deleteAllNotifications(e)}
                            className="w-full text-sm text-center text-red-500 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300 py-2 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                          >
                            Hapus Semua Notifikasi
                          </button>
                        </div>
                      )}
                    </div>
                  )}
                </div>

                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <button className="flex items-center gap-2 p-1.5 rounded-full hover:bg-gray-100 dark:hover:bg-neutral-800 transition-colors">
                      <div className="relative w-9 h-9 rounded-full overflow-hidden border-2 border-[#7CE0A8]">
                        <img
                          src={userAvatar}
                          alt={userName}
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            e.currentTarget.src = defaultAvatar;
                          }}
                        />
                      </div>
                      <span className="hidden md:inline text-sm font-medium text-gray-700 dark:text-gray-300">
                        {userName.split(" ")[0]}
                      </span>
                    </button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-56 mt-2">
                    <DropdownMenuItem
                      onClick={() => handleSimpleNavigation("/profile")}
                      className="flex items-center gap-2 cursor-pointer py-2.5"
                      disabled={pathname === "/profile"}
                    >
                      <User className="w-4 h-4" />
                      <span
                        className={
                          pathname === "/profile"
                            ? "font-semibold text-[#7CE0A8]"
                            : ""
                        }
                      >
                        Profil Saya
                      </span>
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onClick={() => handleSimpleNavigation("/riwayat_pemesanan")}
                      className="flex items-center gap-2 cursor-pointer py-2.5"
                      disabled={pathname === "/riwayat_pemesanan"}
                    >
                      <Package className="w-4 h-4" />
                      <span
                        className={
                          pathname === "/riwayat_pemesanan"
                            ? "font-semibold text-[#7CE0A8]"
                            : ""
                        }
                      >
                        Riwayat Pesanan
                      </span>
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onClick={() => handleSimpleNavigation("/vendor_favorit")}
                      className="flex items-center gap-2 cursor-pointer py-2.5"
                      disabled={pathname === "/vendor_favorit"}
                    >
                      <Heart className="w-4 h-4" />
                      <span
                        className={
                          pathname === "/vendor_favorit"
                            ? "font-semibold text-[#7CE0A8]"
                            : ""
                        }
                      >
                        Vendor Favorit
                      </span>
                    </DropdownMenuItem>
                    <div className="border-t border-gray-200 dark:border-neutral-700 my-1"></div>
                    <DropdownMenuItem
                      onClick={handleLogout}
                      className="flex items-center gap-2 text-red-600 cursor-pointer py-2.5 hover:bg-red-50 dark:hover:bg-red-900/20"
                    >
                      <LogOut className="w-4 h-4" />
                      Keluar
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            ) : (
              <div className="flex items-center gap-4">
                {/* Use Link for instant navigation without flash */}
                <Link href="/login" prefetch={true}>
                  <NavbarButton
                    as="span"
                    variant="outline"
                    className="border-[#7CE0A8] text-[#7CE0A8] hover:bg-[#7CE0A8] hover:text-white transition-colors font-medium px-5 py-2.5 min-w-[100px]"
                  >
                    Masuk
                  </NavbarButton>
                </Link>

                <Link href="/register" prefetch={true}>
                  <NavbarButton
                    as="span"
                    variant="primary"
                    className="bg-[#7CE0A8] hover:bg-[#6bd097] text-white font-medium px-5 py-2.5 shadow-sm min-w-[100px]"
                  >
                    Daftar
                  </NavbarButton>
                </Link>

                <LanguageSelector
                  selectedLanguage={selectedLanguage}
                  onSelectLanguage={handleSelectLanguage}
                />
              </div>
            )}
          </div>
        </NavBody>

        <MobileNav>
          <MobileNavHeader>
            <div onClick={handleLogoClick} className="cursor-pointer">
              <NavbarLogo />
            </div>
            <div className="flex items-center gap-2">
              {/* Mobile Notification Bell */}
              {isAuthenticated && user && (
                <div className="relative md:hidden" ref={mobileNotificationRef}>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      toggleNotification();
                    }}
                    className="relative p-2 rounded-full hover:bg-gray-100 dark:hover:bg-neutral-800 transition-colors"
                    aria-label="Notifikasi"
                  >
                    <Bell className="w-5 h-5 text-gray-700 dark:text-gray-300" />
                    {unreadCount > 0 && (
                      <span className="absolute -top-1 -right-1 flex items-center justify-center w-5 h-5 bg-red-500 text-white text-xs font-bold rounded-full animate-pulse">
                        {unreadCount > 9 ? "9+" : unreadCount}
                      </span>
                    )}
                  </button>
                </div>
              )}

              <MobileNavToggle
                isOpen={isMobileMenuOpen}
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              />
            </div>
          </MobileNavHeader>

          <MobileNavMenu
            isOpen={isMobileMenuOpen}
            onClose={() => setIsMobileMenuOpen(false)}
          >
            <div className="w-full">
              {isAuthenticated && user ? (
                <div className="space-y-6">
                  <div className="flex items-center gap-3 p-3 rounded-lg bg-gray-50 dark:bg-neutral-800">
                    <div className="relative w-12 h-12 rounded-full overflow-hidden border-2 border-[#7CE0A8]">
                      <img
                        src={userAvatar}
                        alt={userName}
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          e.currentTarget.src = defaultAvatar;
                        }}
                      />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-gray-900 dark:text-gray-100 truncate">
                        {userName}
                      </p>
                      <p className="text-sm text-gray-500 dark:text-gray-400 truncate">
                        {userEmail}
                      </p>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <button
                      onClick={() => handleSimpleNavigation("/profile")}
                      disabled={pathname === "/profile"}
                      className={`w-full flex items-center gap-3 px-4 py-3 text-left rounded-lg transition-colors ${
                        pathname === "/profile"
                          ? "bg-[#7CE0A8]/10 text-[#7CE0A8] font-semibold"
                          : "text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-neutral-800"
                      }`}
                    >
                      <User className="w-5 h-5" />
                      <span>Profil Saya</span>
                    </button>
                    <button
                      onClick={() => handleSimpleNavigation("/riwayat_pemesanan")}
                      disabled={pathname === "/riwayat_pemesanan"}
                      className={`w-full flex items-center gap-3 px-4 py-3 text-left rounded-lg transition-colors ${
                        pathname === "/riwayat_pemesanan"
                          ? "bg-[#7CE0A8]/10 text-[#7CE0A8] font-semibold"
                          : "text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-neutral-800"
                      }`}
                    >
                      <Package className="w-5 h-5" />
                      <span>Riwayat Pesanan</span>
                    </button>
                    <button
                      onClick={() => handleSimpleNavigation("/vendor_favorit")}
                      disabled={pathname === "/vendor_favorit"}
                      className={`w-full flex items-center gap-3 px-4 py-3 text-left rounded-lg transition-colors ${
                        pathname === "/vendor_favorit"
                          ? "bg-[#7CE0A8]/10 text-[#7CE0A8] font-semibold"
                          : "text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-neutral-800"
                      }`}
                    >
                      <Heart className="w-5 h-5" />
                      <span>Vendor Favorit</span>
                    </button>
                    <div className="border-t border-gray-200 dark:border-neutral-700 my-2"></div>
                    <button
                      onClick={handleLogout}
                      className="w-full flex items-center gap-3 px-4 py-3 text-left text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                    >
                      <LogOut className="w-5 h-5" />
                      <span>Keluar</span>
                    </button>
                  </div>

                  <div className="pt-4 border-t border-gray-200 dark:border-neutral-700">
                    <div className="flex justify-start">
                      <LanguageSelector
                        selectedLanguage={selectedLanguage}
                        onSelectLanguage={handleSelectLanguage}
                      />
                    </div>
                  </div>
                </div>
              ) : (
                <div className="space-y-6">
                  <div className="space-y-3">
                    {/* Use Link for mobile too */}
                    <Link 
                      href="/register" 
                      prefetch={true}
                      onClick={() => setIsMobileMenuOpen(false)}
                      className="block w-full px-4 py-3 text-center font-medium text-white bg-[#7CE0A8] rounded-lg hover:bg-[#6bd097] transition-colors"
                    >
                      Daftar
                    </Link>
                    <Link 
                      href="/login" 
                      prefetch={true}
                      onClick={() => setIsMobileMenuOpen(false)}
                      className="block w-full px-4 py-3 text-center font-medium text-[#7CE0A8] border border-[#7CE0A8] rounded-lg hover:bg-[#7CE0A8] hover:text-white transition-colors"
                    >
                      Masuk
                    </Link>
                  </div>

                  <div className="pt-4 border-t border-gray-200 dark:border-neutral-700">
                    <div className="flex justify-start">
                      <LanguageSelector
                        selectedLanguage={selectedLanguage}
                        onSelectLanguage={handleSelectLanguage}
                      />
                    </div>
                  </div>
                </div>
              )}
            </div>
          </MobileNavMenu>
        </MobileNav>
      </Navbar>

      {children}
    </div>
  );
}