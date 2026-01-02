"use client";

import { useEffect, useState, type ReactNode } from "react";
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
  Store
} from "lucide-react";

const LANG_STORAGE_KEY = "appLanguage";
const AUTH_STORAGE_KEY = "authData";
const TOKEN_STORAGE_KEY = "userToken"; // ⭐ Key untuk token

interface UserData {
  name: string;
  email: string;
  avatar?: string;
}

export default function UserLayout({ children }: { children: ReactNode }) {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [selectedLanguage, setSelectedLanguage] = useState("id");
  const [isLoading, setIsLoading] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [userData, setUserData] = useState<UserData | null>(null);
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (typeof window === "undefined") return;

    const savedLang = window.localStorage.getItem(LANG_STORAGE_KEY);
    if (savedLang) {
      setSelectedLanguage(savedLang);
    }

    // ⭐ Function untuk check login status
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

    // Check initial login status
    checkLoginStatus();

    // ⭐ Listen untuk event login berhasil dari OTP
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

  // ⭐ Fungsi logout yang diperbaiki - hapus semua data terkait auth
  const handleLogout = () => {
    // Hapus token dan auth data
    localStorage.removeItem(TOKEN_STORAGE_KEY);
    localStorage.removeItem(AUTH_STORAGE_KEY);
    
    // ⭐ Optional: Hapus data lain yang terkait user jika perlu
    // localStorage.removeItem('userOrders');
    // localStorage.removeItem('favoriteVendors');
    
    // Update state
    setIsLoggedIn(false);
    setUserData(null);
    
    // Tutup mobile menu jika terbuka
    setIsMobileMenuOpen(false);
    
    // ⭐ Dispatch event untuk memberitahu komponen lain
    window.dispatchEvent(new Event('userLoggedOut'));
    
    // Redirect ke home
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
            <MobileNavToggle
              isOpen={isMobileMenuOpen}
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            />
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