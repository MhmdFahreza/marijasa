"use client";

import { useEffect, useState, type ReactNode } from "react";
import { useTranslation } from "react-i18next";
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

const LANG_STORAGE_KEY = "appLanguage";
const AUTH_STORAGE_KEY = "authData";

// Type untuk data user
interface UserData {
  name: string;
  email: string;
  avatar?: string;
}

export default function UserLayout({ children }: { children: ReactNode }) {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const { t, i18n } = useTranslation();
  const router = useRouter();
  const pathname = usePathname();

  const initialLang =
    i18n.resolvedLanguage || i18n.language || "id";
  const [selectedLanguage, setSelectedLanguage] = useState(initialLang);
  const [isLoading, setIsLoading] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [userData, setUserData] = useState<UserData | null>(null);

  // Cek status login dari localStorage
  useEffect(() => {
    if (typeof window === "undefined") return;
    
    const saved = window.localStorage.getItem(LANG_STORAGE_KEY);
    const lang = saved || selectedLanguage;

    if (lang !== i18n.language) {
      i18n.changeLanguage(lang);
    }
    document.documentElement.lang = lang;

    if (!saved) {
      window.localStorage.setItem(LANG_STORAGE_KEY, lang);
    }

    // Cek status login
    const authData = window.localStorage.getItem(AUTH_STORAGE_KEY);
    if (authData) {
      try {
        const parsedAuth = JSON.parse(authData);
        setIsLoggedIn(true);
        setUserData(parsedAuth.user);
      } catch (error) {
        console.error("Error parsing auth data:", error);
        localStorage.removeItem(AUTH_STORAGE_KEY);
      }
    }
  }, []);

  // Reset loading state ketika pathname berubah
  useEffect(() => {
    setIsLoading(false);
  }, [pathname]);

  useEffect(() => {
    document.documentElement.lang = selectedLanguage;
  }, [selectedLanguage]);

  const handleSelectLanguage = (language: string) => {
    setSelectedLanguage(language);
    i18n.changeLanguage(language);

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
    
    // Simulasi delay untuk menampilkan loader
    const connection = (navigator as any).connection || 
                      (navigator as any).mozConnection || 
                      (navigator as any).webkitConnection;

    const networkSpeed = connection ? connection.effectiveType : "4g";
    const delay = networkSpeed === "2g" || networkSpeed === "slow-2g" ? 3000 : 500;

    setTimeout(() => {
      router.push("/login");
    }, delay);
  };

  const handleRegisterProviderClick = () => {
    setIsLoading(true);
    
    // Simulasi delay untuk menampilkan loader
    const connection = (navigator as any).connection || 
                      (navigator as any).mozConnection || 
                      (navigator as any).webkitConnection;

    const networkSpeed = connection ? connection.effectiveType : "4g";
    const delay = networkSpeed === "2g" || networkSpeed === "slow-2g" ? 3000 : 500;

    setTimeout(() => {
      router.push("/mitra/daftar");
    }, delay);
  };

  const handleLogout = () => {
    // Hapus data auth dari localStorage
    localStorage.removeItem(AUTH_STORAGE_KEY);
    setIsLoggedIn(false);
    setUserData(null);
    router.push("/");
  };

  const handleProfileClick = () => {
    router.push("/profile");
  };

  // Gambar profil default seperti Tokopedia (tersimpan di public folder)
  const defaultAvatar = "/default-avatar.png";

  return (
    <div className="relative w-full min-h-screen">
      {/* Loader Overlay - Tampil di atas semua konten */}
      {isLoading && (
        <div className="fixed inset-0 flex justify-center items-center bg-white dark:bg-neutral-900 z-[9999]">
          <LoaderTwo /> 
        </div>
      )}

      <Navbar>
        <NavBody>
          <NavbarLogo />
          <div className="flex items-center gap-4 lg:gap-6">
            {isLoggedIn ? (
              // Tampilkan foto profil user jika sudah login
              <div className="flex items-center gap-4">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <button className="flex items-center gap-2 p-2 rounded-full hover:bg-gray-100 dark:hover:bg-neutral-800 transition-colors">
                      <div className="relative w-10 h-10 rounded-full overflow-hidden border-2 border-[#7CE0A8]">
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
                  <DropdownMenuContent align="end" className="w-48">
                    <DropdownMenuItem onClick={handleProfileClick}>
                      Profil Saya
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={handleLogout} className="text-red-600">
                      Keluar
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
                <div className="hidden lg:flex items-center gap-4">
                  <LanguageSelector
                    selectedLanguage={selectedLanguage}
                    onSelectLanguage={handleSelectLanguage}
                  />
                </div>
              </div>
            ) : (
              // Tampilkan tombol login/daftar jika belum login
              <>
                <div className="hidden lg:flex items-center gap-4">
                  <NavbarButton variant="primary" onClick={handleRegisterProviderClick}>
                    {t("nav.registerProvider")}
                  </NavbarButton>
                  <NavbarButton variant="primary" onClick={handleLoginClick}>
                    {t("nav.login")}
                  </NavbarButton>
                  <LanguageSelector
                    selectedLanguage={selectedLanguage}
                    onSelectLanguage={handleSelectLanguage}
                  />
                </div>
                <div className="lg:hidden flex items-center gap-4">
                  <NavbarButton
                    variant="primary"
                    className="block w-full text-center"
                    onClick={handleLoginClick}
                  >
                    {t("nav.login")}
                  </NavbarButton>
                </div>
              </>
            )}
          </div>
        </NavBody>

        <MobileNav>
          <MobileNavHeader>
            <NavbarLogo />
            <MobileNavToggle
              isOpen={isMobileMenuOpen}
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            />
          </MobileNavHeader>

          <MobileNavMenu
            isOpen={isMobileMenuOpen}
            onClose={() => setIsMobileMenuOpen(false)}
          >
            <div className="flex w-full flex-col gap-4">
              {isLoggedIn ? (
                // Menu untuk user yang sudah login (mobile)
                <>
                  <div className="flex items-center gap-3 p-3 border-b border-gray-200 dark:border-neutral-700">
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
                    <div>
                      <p className="font-medium text-gray-900 dark:text-gray-100">
                        {userData?.name || "User"}
                      </p>
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        {userData?.email || ""}
                      </p>
                    </div>
                  </div>
                  <NavbarButton
                    onClick={handleProfileClick}
                    variant="secondary"
                    className="w-full text-center"
                  >
                    Profil Saya
                  </NavbarButton>
                  <NavbarButton
                    onClick={handleLogout}
                    variant="ghost"
                    className="w-full text-center text-red-600 hover:text-red-700 hover:bg-red-50"
                  >
                    Keluar
                  </NavbarButton>
                </>
              ) : (
                // Menu untuk user belum login (mobile)
                <>
                  <NavbarButton
                    onClick={handleLoginClick} 
                    variant="primary"
                    className="w-full text-center"
                  >
                    {t("nav.login")}
                  </NavbarButton>
                  <NavbarButton
                    onClick={handleRegisterProviderClick} 
                    variant="primary"
                    className="w-full text-center"
                  >
                    {t("nav.registerProvider")}
                  </NavbarButton>
                </>
              )}
              <div className="mt-2">
                <LanguageSelector
                  selectedLanguage={selectedLanguage}
                  onSelectLanguage={handleSelectLanguage}
                />
              </div>
            </div>
          </MobileNavMenu>
        </MobileNav>
      </Navbar>

      {children}
    </div>
  );
}