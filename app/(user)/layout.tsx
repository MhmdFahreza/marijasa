"use client";

import { useEffect, useState, useRef, type ReactNode } from "react";
import { useRouter, usePathname } from "next/navigation";
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
  History,
  Heart,
  User,
  LogOut,
  Package,
  Store,
  Bell,
  X,
  CheckCircle,
  Clock,
  PackageCheck,
  AlertCircle
} from "lucide-react";
import { Badge } from "@/app/components/ui/badge";

const LANG_STORAGE_KEY = "appLanguage";
const AUTH_STORAGE_KEY = "authData";
const TOKEN_STORAGE_KEY = "userToken";

interface UserData {
  name: string;
  email: string;
  avatar?: string;
}

interface Notification {
  id: string;
  title: string;
  message: string;
  time: string;
  type: 'order' | 'promo' | 'system' | 'reminder';
  read: boolean;
  orderId?: string;
}

export default function UserLayout({ children }: { children: ReactNode }) {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [selectedLanguage, setSelectedLanguage] = useState("id");
  const [isLoading, setIsLoading] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [userData, setUserData] = useState<UserData | null>(null);
  const [isNotificationOpen, setIsNotificationOpen] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([
    {
      id: "1",
      title: "Pesanan Diproses",
      message: "Pesanan #ORD-2024-001 sedang diproses oleh vendor",
      time: "10 menit yang lalu",
      type: "order",
      read: false,
      orderId: "ORD-2024-001"
    },
    {
      id: "2",
      title: "Promo Spesial",
      message: "Dapatkan diskon 20% untuk pemesanan pertama Anda",
      time: "1 jam yang lalu",
      type: "promo",
      read: false
    },
    {
      id: "3",
      title: "Pesanan Selesai",
      message: "Pesanan #ORD-2023-456 telah selesai",
      time: "2 hari yang lalu",
      type: "order",
      read: true,
      orderId: "ORD-2023-456"
    },
    {
      id: "4",
      title: "Pengingat Pembayaran",
      message: "Lakukan pembayaran untuk pesanan #ORD-2024-002",
      time: "3 hari yang lalu",
      type: "reminder",
      read: true,
      orderId: "ORD-2024-002"
    }
  ]);
  
  const notificationRef = useRef<HTMLDivElement>(null);
  const router = useRouter();
  const pathname = usePathname();

  // Calculate unread notifications
  const unreadCount = notifications.filter(n => !n.read).length;

  useEffect(() => {
    if (typeof window === "undefined") return;

    const savedLang = window.localStorage.getItem(LANG_STORAGE_KEY);
    if (savedLang) {
      setSelectedLanguage(savedLang);
    }

    const checkLoginStatus = () => {
      const token = window.localStorage.getItem(TOKEN_STORAGE_KEY);
      const authData = window.localStorage.getItem(AUTH_STORAGE_KEY);
      
      if (token && authData) {
        try {
          const parsedAuth = JSON.parse(authData);
          setIsLoggedIn(true);
          setUserData(parsedAuth.user);
        } catch (error) {
          console.error("Error parsing auth data:", error);
          localStorage.removeItem(AUTH_STORAGE_KEY);
          localStorage.removeItem(TOKEN_STORAGE_KEY);
        }
      }
    };

    checkLoginStatus();

    const handleUserLoggedIn = () => {
      checkLoginStatus();
    };

    window.addEventListener('userLoggedIn', handleUserLoggedIn);

    return () => {
      window.removeEventListener('userLoggedIn', handleUserLoggedIn);
    };
  }, []);

  useEffect(() => {
    setIsLoading(false);
  }, [pathname]);

  // Close notifications when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (notificationRef.current && !notificationRef.current.contains(event.target as Node)) {
        setIsNotificationOpen(false);
      }
    };

    if (isNotificationOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isNotificationOpen]);

  const handleSelectLanguage = (language: string) => {
    setSelectedLanguage(language);

    if (typeof document !== "undefined") {
      document.cookie = `i18next=${language}; path=/; max-age=${60 * 60 * 24 * 30}`;
      document.documentElement.lang = language;
    }

    if (typeof window !== "undefined") {
      window.localStorage.setItem(LANG_STORAGE_KEY, language);
    }
  };

  const handleLoginClick = () => {
    setIsLoading(true);

    const connection = (navigator as any).connection ||
      (navigator as any).mozConnection ||
      (navigator as any).webkitConnection;

    const networkSpeed = connection ? connection.effectiveType : "4g";
    const delay = networkSpeed === "2g" || networkSpeed === "slow-2g" ? 3000 : 500;

    setTimeout(() => {
      router.push("/login");
    }, delay);
  };

  const handleRegisterClick = () => {
    setIsLoading(true);

    const connection = (navigator as any).connection ||
      (navigator as any).mozConnection ||
      (navigator as any).webkitConnection;

    const networkSpeed = connection ? connection.effectiveType : "4g";
    const delay = networkSpeed === "2g" || networkSpeed === "slow-2g" ? 3000 : 500;

    setTimeout(() => {
      router.push("/register");
    }, delay);
  };

  const handleLogoClick = () => {
    if (pathname === "/") {
      setIsMobileMenuOpen(false);
      return;
    }

    setIsMobileMenuOpen(false);
    setIsLoading(true);
    setTimeout(() => {
      router.push("/");
    }, 300);
  };

  const handleLogout = () => {
    localStorage.removeItem(TOKEN_STORAGE_KEY);
    localStorage.removeItem(AUTH_STORAGE_KEY);
    
    setIsLoggedIn(false);
    setUserData(null);
    setIsMobileMenuOpen(false);
    setIsNotificationOpen(false);
    
    window.dispatchEvent(new Event('userLoggedOut'));
    
    setIsLoading(true);
    setTimeout(() => {
      router.push("/");
    }, 300);
  };

  const handleProfileClick = () => {
    if (pathname === "/profile") {
      setIsMobileMenuOpen(false);
      return;
    }

    setIsMobileMenuOpen(false);
    setIsLoading(true);
    setTimeout(() => {
      router.push("/profile");
    }, 300);
  };

  const handleOrderHistoryClick = () => {
    if (pathname === "/riwayat_pemesanan") {
      setIsMobileMenuOpen(false);
      return;
    }

    setIsMobileMenuOpen(false);
    setIsLoading(true);
    setTimeout(() => {
      router.push("/riwayat_pemesanan");
    }, 300);
  };

  const handleFavoriteVendorsClick = () => {
    if (pathname === "/vendor_favorit") {
      setIsMobileMenuOpen(false);
      return;
    }

    setIsMobileMenuOpen(false);
    setIsLoading(true);
    setTimeout(() => {
      router.push("/vendor_favorit");
    }, 300);
  };

  const toggleNotification = () => {
    setIsNotificationOpen(!isNotificationOpen);
    if (!isNotificationOpen) {
      // Mark all as read when opening notifications
      setNotifications(notifications.map(notif => ({ ...notif, read: true })));
    }
  };

  const getNotificationIcon = (type: Notification['type']) => {
    switch (type) {
      case 'order':
        return <PackageCheck className="w-5 h-5 text-blue-500" />;
      case 'promo':
        return <AlertCircle className="w-5 h-5 text-green-500" />;
      case 'reminder':
        return <Clock className="w-5 h-5 text-amber-500" />;
      default:
        return <Bell className="w-5 h-5 text-gray-500" />;
    }
  };

  const handleNotificationClick = (notification: Notification) => {
    if (notification.orderId) {
      setIsNotificationOpen(false);
      setIsLoading(true);
      setTimeout(() => {
        router.push(`/riwayat_pemesanan?order=${notification.orderId}`);
      }, 300);
    }
  };

  const defaultAvatar = "/profile.svg";

  return (
    <div className="relative w-full min-h-screen">
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
            {isLoggedIn ? (
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
                      <span className="absolute -top-1 -right-1 flex items-center justify-center w-5 h-5 bg-red-500 text-white text-xs font-bold rounded-full">
                        {unreadCount}
                      </span>
                    )}
                  </button>

                  {/* Desktop Notification Dropdown */}
                  {isNotificationOpen && (
                    <div className="absolute right-0 top-full mt-2 w-80 md:w-96 bg-white dark:bg-neutral-800 rounded-lg shadow-xl border border-gray-200 dark:border-neutral-700 z-50">
                      <div className="p-4 border-b border-gray-200 dark:border-neutral-700">
                        <div className="flex items-center justify-between">
                          <h3 className="font-bold text-lg">Notifikasi</h3>
                          <button
                            onClick={() => setIsNotificationOpen(false)}
                            className="p-1 rounded-full hover:bg-gray-100 dark:hover:bg-neutral-700"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                          {notifications.length} notifikasi
                        </p>
                      </div>
                      
                      <div className="max-h-96 overflow-y-auto">
                        {notifications.length > 0 ? (
                          <div className="divide-y divide-gray-100 dark:divide-neutral-700">
                            {notifications.map((notification) => (
                              <div
                                key={notification.id}
                                onClick={() => handleNotificationClick(notification)}
                                className={`p-4 hover:bg-gray-50 dark:hover:bg-neutral-700 cursor-pointer transition-colors ${!notification.read ? 'bg-blue-50 dark:bg-blue-900/10' : ''}`}
                              >
                                <div className="flex gap-3">
                                  <div className="flex-shrink-0 mt-1">
                                    {getNotificationIcon(notification.type)}
                                  </div>
                                  <div className="flex-1 min-w-0">
                                    <div className="flex items-center justify-between gap-2">
                                      <h4 className="font-semibold text-gray-900 dark:text-gray-100">
                                        {notification.title}
                                      </h4>
                                      {!notification.read && (
                                        <span className="w-2 h-2 bg-blue-500 rounded-full"></span>
                                      )}
                                    </div>
                                    <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                                      {notification.message}
                                    </p>
                                    <div className="flex items-center justify-between mt-2">
                                      <span className="text-xs text-gray-500 dark:text-gray-400">
                                        {notification.time}
                                      </span>
                                      {notification.orderId && (
                                        <Badge variant="outline" className="text-xs">
                                          {notification.orderId}
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
                          </div>
                        )}
                      </div>

                      <div className="p-4 border-t border-gray-200 dark:border-neutral-700">
                        <button
                          onClick={() => {
                            setNotifications([]);
                            setIsNotificationOpen(false);
                          }}
                          className="w-full text-sm text-center text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300 py-2"
                        >
                          Hapus Semua Notifikasi
                        </button>
                      </div>
                    </div>
                  )}
                </div>

                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <button className="flex items-center gap-2 p-1.5 rounded-full hover:bg-gray-100 dark:hover:bg-neutral-800 transition-colors">
                      <div className="relative w-9 h-9 rounded-full overflow-hidden border-2 border-[#7CE0A8]">
                        <img
                          src={userData?.avatar || defaultAvatar}
                          alt={userData?.name || "User"}
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            e.currentTarget.src = defaultAvatar;
                          }}
                        />
                      </div>
                      <span className="hidden md:inline text-sm font-medium text-gray-700 dark:text-gray-300">
                        {userData?.name?.split(" ")[0] || "User"}
                      </span>
                    </button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-56 mt-2">
                    <DropdownMenuItem
                      onClick={handleProfileClick}
                      className="flex items-center gap-2 cursor-pointer py-2.5"
                      disabled={pathname === "/profile"}
                    >
                      <User className="w-4 h-4" />
                      <span className={pathname === "/profile" ? "font-semibold text-[#7CE0A8]" : ""}>
                        Profil Saya
                      </span>
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onClick={handleOrderHistoryClick}
                      className="flex items-center gap-2 cursor-pointer py-2.5"
                      disabled={pathname === "/riwayat_pemesanan"}
                    >
                      <Package className="w-4 h-4" />
                      <span className={pathname === "/riwayat_pemesanan" ? "font-semibold text-[#7CE0A8]" : ""}>
                        Riwayat Pesanan
                      </span>
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onClick={handleFavoriteVendorsClick}
                      className="flex items-center gap-2 cursor-pointer py-2.5"
                      disabled={pathname === "/vendor_favorit"}
                    >
                      <Heart className="w-4 h-4" />
                      <span className={pathname === "/vendor_favorit" ? "font-semibold text-[#7CE0A8]" : ""}>
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
                <NavbarButton
                  variant="outline"
                  onClick={handleLoginClick}
                  className="border-[#7CE0A8] text-[#7CE0A8] hover:bg-[#7CE0A8] hover:text-white transition-colors font-medium px-5 py-2.5 min-w-[100px]"
                >
                  Masuk
                </NavbarButton>

                <NavbarButton
                  variant="primary"
                  onClick={handleRegisterClick}
                  className="bg-[#7CE0A8] hover:bg-[#6bd097] text-white font-medium px-5 py-2.5 shadow-sm min-w-[100px]"
                >
                  Daftar
                </NavbarButton>

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
              {/* Mobile Notification Bell in Header */}
              {isLoggedIn && (
                <div className="relative md:hidden" ref={notificationRef}>
                  <button
                    onClick={toggleNotification}
                    className="relative p-2 rounded-full hover:bg-gray-100 dark:hover:bg-neutral-800 transition-colors"
                    aria-label="Notifikasi"
                  >
                    <Bell className="w-5 h-5 text-gray-700 dark:text-gray-300" />
                    {unreadCount > 0 && (
                      <span className="absolute -top-1 -right-1 flex items-center justify-center w-5 h-5 bg-red-500 text-white text-xs font-bold rounded-full">
                        {unreadCount}
                      </span>
                    )}
                  </button>

                  {/* Mobile Notification Panel */}
                  {isNotificationOpen && (
                    <div className="fixed inset-0 top-0 left-0 right-0 bottom-0 bg-black bg-opacity-50 z-[9998]">
                      <div className="absolute top-0 right-0 bottom-0 w-full max-w-sm bg-white dark:bg-neutral-800 shadow-xl overflow-hidden">
                        <div className="flex flex-col h-full">
                          <div className="p-4 border-b border-gray-200 dark:border-neutral-700 bg-white dark:bg-neutral-800">
                            <div className="flex items-center justify-between">
                              <h3 className="font-bold text-lg">Notifikasi</h3>
                              <button
                                onClick={() => setIsNotificationOpen(false)}
                                className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-neutral-700"
                              >
                                <X className="w-5 h-5" />
                              </button>
                            </div>
                            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                              {notifications.length} notifikasi
                            </p>
                          </div>
                          
                          <div className="flex-1 overflow-y-auto">
                            {notifications.length > 0 ? (
                              <div className="divide-y divide-gray-100 dark:divide-neutral-700">
                                {notifications.map((notification) => (
                                  <div
                                    key={notification.id}
                                    onClick={() => handleNotificationClick(notification)}
                                    className={`p-4 hover:bg-gray-50 dark:hover:bg-neutral-700 cursor-pointer transition-colors ${!notification.read ? 'bg-blue-50 dark:bg-blue-900/10' : ''}`}
                                  >
                                    <div className="flex gap-3">
                                      <div className="flex-shrink-0 mt-1">
                                        {getNotificationIcon(notification.type)}
                                      </div>
                                      <div className="flex-1 min-w-0">
                                        <div className="flex items-center justify-between gap-2">
                                          <h4 className="font-semibold text-gray-900 dark:text-gray-100">
                                            {notification.title}
                                          </h4>
                                          {!notification.read && (
                                            <span className="w-2 h-2 bg-blue-500 rounded-full"></span>
                                          )}
                                        </div>
                                        <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                                          {notification.message}
                                        </p>
                                        <div className="flex items-center justify-between mt-2">
                                          <span className="text-xs text-gray-500 dark:text-gray-400">
                                            {notification.time}
                                          </span>
                                          {notification.orderId && (
                                            <Badge variant="outline" className="text-xs">
                                              {notification.orderId}
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
                                <Bell className="w-16 h-16 text-gray-300 dark:text-neutral-600 mx-auto mb-4" />
                                <p className="text-gray-500 dark:text-gray-400">
                                  Tidak ada notifikasi
                                </p>
                              </div>
                            )}
                          </div>

                          <div className="p-4 border-t border-gray-200 dark:border-neutral-700 bg-white dark:bg-neutral-800">
                            <button
                              onClick={() => {
                                setNotifications([]);
                                setIsNotificationOpen(false);
                              }}
                              className="w-full px-4 py-3 text-center text-sm font-medium text-white bg-red-500 hover:bg-red-600 rounded-lg transition-colors"
                            >
                              Hapus Semua Notifikasi
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
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
              {isLoggedIn ? (
                <div className="space-y-6">
                  <div className="flex items-center gap-3 p-3 rounded-lg bg-gray-50 dark:bg-neutral-800">
                    <div className="relative w-12 h-12 rounded-full overflow-hidden border-2 border-[#7CE0A8]">
                      <img
                        src={userData?.avatar || defaultAvatar}
                        alt={userData?.name || "User"}
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          e.currentTarget.src = defaultAvatar;
                        }}
                      />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-gray-900 dark:text-gray-100 truncate">
                        {userData?.name || "User"}
                      </p>
                      <p className="text-sm text-gray-500 dark:text-gray-400 truncate">
                        {userData?.email || ""}
                      </p>
                    </div>
                  </div>

                  <div className="space-y-2">
                    {/* Tablet Notification Button in Menu */}
                    <div className="md:hidden">
                      <button
                        onClick={() => {
                          setIsMobileMenuOpen(false);
                          toggleNotification();
                        }}
                        className="w-full flex items-center justify-between px-4 py-3 text-left rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-neutral-800 transition-colors"
                      >
                        <div className="flex items-center gap-3">
                          <Bell className="w-5 h-5" />
                          <span>Notifikasi</span>
                        </div>
                        {unreadCount > 0 && (
                          <span className="flex items-center justify-center w-6 h-6 bg-red-500 text-white text-xs font-bold rounded-full">
                            {unreadCount}
                          </span>
                        )}
                      </button>
                    </div>

                    <button
                      onClick={handleProfileClick}
                      disabled={pathname === "/profile"}
                      className={`w-full flex items-center gap-3 px-4 py-3 text-left rounded-lg transition-colors ${pathname === "/profile"
                          ? "bg-[#7CE0A8]/10 text-[#7CE0A8] font-semibold"
                          : "text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-neutral-800"
                        }`}
                    >
                      <User className="w-5 h-5" />
                      <span>Profil Saya</span>
                    </button>
                    <button
                      onClick={handleOrderHistoryClick}
                      disabled={pathname === "/riwayat_pemesanan"}
                      className={`w-full flex items-center gap-3 px-4 py-3 text-left rounded-lg transition-colors ${pathname === "/riwayat_pemesanan"
                          ? "bg-[#7CE0A8]/10 text-[#7CE0A8] font-semibold"
                          : "text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-neutral-800"
                        }`}
                    >
                      <Package className="w-5 h-5" />
                      <span>Riwayat Pesanan</span>
                    </button>
                    <button
                      onClick={handleFavoriteVendorsClick}
                      disabled={pathname === "/vendor_favorit"}
                      className={`w-full flex items-center gap-3 px-4 py-3 text-left rounded-lg transition-colors ${pathname === "/vendor_favorit"
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
                    <button
                      onClick={handleRegisterClick}
                      className="w-full px-4 py-3 text-center font-medium text-white bg-[#7CE0A8] rounded-lg hover:bg-[#6bd097] transition-colors"
                    >
                      Daftar
                    </button>
                    <button
                      onClick={handleLoginClick}
                      className="w-full px-4 py-3 text-center font-medium text-[#7CE0A8] border border-[#7CE0A8] rounded-lg hover:bg-[#7CE0A8] hover:text-white transition-colors"
                    >
                      Masuk
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
              )}
            </div>
          </MobileNavMenu>
        </MobileNav>
      </Navbar>

      {children}
    </div>
  );
}