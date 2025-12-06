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
  const [selectedLanguage, setSelectedLanguage] = useState("id");
  const [isLoading, setIsLoading] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [userData, setUserData] = useState<UserData | null>(null);
  const router = useRouter();
  const pathname = usePathname();

  // Cek status login dari localStorage
  useEffect(() => {
    if (typeof window === "undefined") return;

    const savedLang = window.localStorage.getItem(LANG_STORAGE_KEY);
    if (savedLang) {
      setSelectedLanguage(savedLang);
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

  const handleRegisterClick = () => {
    setIsLoading(true);

    // Simulasi delay untuk menampilkan loader
    const connection = (navigator as any).connection ||
      (navigator as any).mozConnection ||
      (navigator as any).webkitConnection;

    const networkSpeed = connection ? connection.effectiveType : "4g";
    const delay = networkSpeed === "2g" || networkSpeed === "slow-2g" ? 3000 : 500;

    setTimeout(() => {
      router.push("/register");
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

  const defaultAvatar = "/profile.svg";

  return (
    <div className="relative w-full min-h-screen">
      {/* Loader Overlay - Tampil di atas semua konten */}
      {isLoading && (
        <div className="fixed inset-0 flex justify-center items-center bg-white dark:bg-neutral-900 z-[9999]">
          <LoaderTwo />
        </div>
      )}

      <Navbar>
        {/* Desktop & Tablet Layout - Tampil dari md (768px) ke atas */}
        <NavBody>
          <NavbarLogo />

          {/* Container untuk tombol-tombol */}
          <div className="flex items-center gap-4">
            {isLoggedIn ? (
              // User sudah login - Desktop & Tablet
              <div className="flex items-center gap-4">
                {/* Tombol bahasa di kiri profil */}
                <LanguageSelector
                  selectedLanguage={selectedLanguage}
                  onSelectLanguage={handleSelectLanguage}
                />

                {/* Profil user */}
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
                  <DropdownMenuContent align="end" className="w-48 mt-2">
                    <DropdownMenuItem onClick={handleProfileClick}>
                      Profil Saya
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={handleLogout} className="text-red-600">
                      Keluar
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            ) : (
              // User belum login - Desktop & Tablet
              <div className="flex items-center gap-4">
                {/* Tombol Masuk */}
                <NavbarButton
                  variant="outline"
                  onClick={handleLoginClick}
                  className="border-[#7CE0A8] text-[#7CE0A8] hover:bg-[#7CE0A8] hover:text-white transition-colors font-medium px-5 py-2.5 min-w-[100px]"
                >
                  Masuk
                </NavbarButton>

                {/* Tombol Daftar */}
                <NavbarButton
                  variant="primary"
                  onClick={handleRegisterClick}
                  className="bg-[#7CE0A8] hover:bg-[#6bd097] text-white font-medium px-5 py-2.5 shadow-sm min-w-[100px]"
                >
                  Daftar
                </NavbarButton>

                {/* Tombol bahasa */}
                <LanguageSelector
                  selectedLanguage={selectedLanguage}
                  onSelectLanguage={handleSelectLanguage}
                />
              </div>
            )}
          </div>
        </NavBody>

        {/* Mobile Layout - Hanya tampil di < 768px */}
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
            <div className="w-full">
              {isLoggedIn ? (
                // Mobile menu untuk user yang sudah login
                <div className="space-y-6">
                  {/* Profile info */}
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

                  <div className="space-y-3">
                    <button
                      onClick={handleProfileClick}
                      className="w-full px-4 py-3 text-left text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-neutral-800 rounded-lg transition-colors"
                    >
                      Profil Saya
                    </button>
                    <button
                      onClick={handleLogout}
                      className="w-full px-4 py-3 text-left text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                    >
                      Keluar
                    </button>
                  </div>

                  {/* Language selector */}
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
                // Mobile menu untuk user belum login
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

                  {/* Language selector */}
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