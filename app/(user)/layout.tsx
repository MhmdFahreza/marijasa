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

const LANG_STORAGE_KEY = "appLanguage";

export default function UserLayout({ children }: { children: ReactNode }) {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const { t, i18n } = useTranslation();
  const router = useRouter();
  const pathname = usePathname();

  const initialLang =
    i18n.resolvedLanguage || i18n.language || "id";
  const [selectedLanguage, setSelectedLanguage] = useState(initialLang);
  const [isLoading, setIsLoading] = useState(false); 

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
            <div className="hidden lg:flex items-center gap-4">
              <NavbarButton variant="primary" onClick={handleLoginClick}>
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
              <NavbarButton
                onClick={handleLoginClick} 
                variant="primary"
                className="w-full text-center"
              >
                {t("nav.login")}
              </NavbarButton>
              <NavbarButton
                onClick={handleLoginClick} 
                variant="primary"
                className="w-full text-center"
              >
                {t("nav.registerProvider")}
              </NavbarButton>
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