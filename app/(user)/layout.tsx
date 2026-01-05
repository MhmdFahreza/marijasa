// app/(user)/layout.tsx
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
  AlertCircle,
  PlusCircle,
  FileText,
  CreditCard,
  ShoppingBag,
  MessageSquare,
} from "lucide-react";
import { Badge } from "@/app/components/ui/badge";
import { useAuth } from "@/app/components/contexts/AuthContext";

const LANG_STORAGE_KEY = "appLanguage";

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
  const [selectedLanguage, setSelectedLanguage] = useState("id");
  const [isLoading, setIsLoading] = useState(false);
  const [isNotificationOpen, setIsNotificationOpen] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);

  const notificationRef = useRef<HTMLDivElement>(null);
  const mobileNotificationRef = useRef<HTMLDivElement>(null);
  const router = useRouter();
  const pathname = usePathname();

  // Use AuthContext instead of localStorage
  const { user, isAuthenticated, isLoading: authLoading, logout } = useAuth();

  // Calculate unread notifications
  const unreadCount = notifications.filter((n) => !n.read).length;

  // Load language preference
  useEffect(() => {
    if (typeof window === "undefined") return;

    const savedLang = window.localStorage.getItem(LANG_STORAGE_KEY);
    if (savedLang) {
      setSelectedLanguage(savedLang);
    }
  }, []);

  useEffect(() => {
    setIsLoading(false);
  }, [pathname]);

  // Close notifications when clicking outside
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
    setTimeout(() => {
      router.push("/login");
    }, 300);
  };

  const handleRegisterClick = () => {
    setIsLoading(true);
    setTimeout(() => {
      router.push("/register");
    }, 300);
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

  const handleLogout = async () => {
    setIsMobileMenuOpen(false);
    setIsNotificationOpen(false);

    // Call logout from AuthContext
    await logout();

    // Redirect to home
    setIsLoading(true);
    setTimeout(() => {
      router.push("/");
      router.refresh();
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
    const newState = !isNotificationOpen;
    setIsNotificationOpen(newState);
    if (newState) {
      markAllAsRead();
    }
  };

  const markAllAsRead = () => {
    if (notifications.length === 0) return;

    const updatedNotifications = notifications.map((notif) => ({
      ...notif,
      read: true,
    }));
    setNotifications(updatedNotifications);
  };

  const markAsRead = (notificationId: string) => {
    const updatedNotifications = notifications.map((notif) =>
      notif.id === notificationId ? { ...notif, read: true } : notif
    );
    setNotifications(updatedNotifications);
  };

  const deleteNotification = (notificationId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();

    const updatedNotifications = notifications.filter(
      (notif) => notif.id !== notificationId
    );
    setNotifications(updatedNotifications);
  };

  const deleteAllNotifications = (e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    setNotifications([]);
  };

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

  const handleNotificationClick = (notification: Notification) => {
    markAsRead(notification.id);

    if (notification.orderId) {
      setIsNotificationOpen(false);
      setIsLoading(true);
      setTimeout(() => {
        router.push(`/riwayat_pemesanan`);
      }, 300);
    }
  };

  const defaultAvatar = "/profile.svg";

  // Show loading while checking auth
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
                      <span className="absolute -top-1 -right-1 flex items-center justify-center w-5 h-5 bg-red-500 text-white text-xs font-bold rounded-full">
                        {unreadCount > 9 ? "9+" : unreadCount}
                      </span>
                    )}
                  </button>

                  {/* Desktop Notification Dropdown */}
                  {isNotificationOpen && (
                    <div className="absolute right-0 top-full mt-2 w-80 md:w-96 bg-white dark:bg-neutral-800 rounded-lg shadow-xl border border-gray-200 dark:border-neutral-700 z-50">
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
                                className="text-xs text-blue-500 hover:text-blue-700"
                              >
                                Tandai semua dibaca
                              </button>
                            )}
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                setIsNotificationOpen(false);
                              }}
                              className="p-1 rounded-full hover:bg-gray-100 dark:hover:bg-neutral-700"
                            >
                              <X className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                          {notifications.length} notifikasi • {unreadCount} belum
                          dibaca
                        </p>
                      </div>

                      <div className="max-h-96 overflow-y-auto">
                        {notifications.length > 0 ? (
                          <div className="divide-y divide-gray-100 dark:divide-neutral-700">
                            {notifications.map((notification) => (
                              <div
                                key={notification.id}
                                onClick={() =>
                                  handleNotificationClick(notification)
                                }
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
                                      <h4 className="font-semibold text-gray-900 dark:text-gray-100">
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
                                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                                      {notification.message}
                                    </p>
                                    <div className="flex items-center justify-between">
                                      <span className="text-xs text-gray-500 dark:text-gray-400">
                                        {notification.date} • {notification.time}
                                      </span>
                                      {notification.orderId && (
                                        <Badge
                                          variant="outline"
                                          className="text-xs"
                                        >
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
                          src={user?.avatar || defaultAvatar}
                          alt={user?.name || "User"}
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            e.currentTarget.src = defaultAvatar;
                          }}
                        />
                      </div>
                      <span className="hidden md:inline text-sm font-medium text-gray-700 dark:text-gray-300">
                        {user?.name?.split(" ")[0] || "User"}
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
                      onClick={handleOrderHistoryClick}
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
                      onClick={handleFavoriteVendorsClick}
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
                      <span className="absolute -top-1 -right-1 flex items-center justify-center w-5 h-5 bg-red-500 text-white text-xs font-bold rounded-full">
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
                        src={user?.avatar || defaultAvatar}
                        alt={user?.name || "User"}
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          e.currentTarget.src = defaultAvatar;
                        }}
                      />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-gray-900 dark:text-gray-100 truncate">
                        {user?.name || "User"}
                      </p>
                      <p className="text-sm text-gray-500 dark:text-gray-400 truncate">
                        {user?.email || ""}
                      </p>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <button
                      onClick={handleProfileClick}
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
                      onClick={handleOrderHistoryClick}
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
                      onClick={handleFavoriteVendorsClick}
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