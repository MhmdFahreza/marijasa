"use client";

import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
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
import Beranda from "@/app/user/beranda"; 
const LANG_STORAGE_KEY = "appLanguage";

export default function Home() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const { t, i18n } = useTranslation();

  const [selectedLanguage, setSelectedLanguage] = useState(
    i18n.resolvedLanguage || i18n.language || "id"
  );

  useEffect(() => {
    if (typeof window === "undefined") return;
    const saved = window.localStorage.getItem(LANG_STORAGE_KEY);
    if (saved && saved !== selectedLanguage) {
      i18n.changeLanguage(saved);
      setSelectedLanguage(saved);
      document.documentElement.lang = saved;
    } else {
      document.documentElement.lang = selectedLanguage;
    }
  }, [i18n, selectedLanguage]);

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

  return (
    <div className="relative w-full">
      <Navbar>
        <NavBody>
          <NavbarLogo />
          <div className="flex items-center gap-4 lg:gap-6">
            <div className="hidden lg:flex items-center gap-4">
              <NavbarButton variant="primary">
                {t("nav.registerProvider")}
              </NavbarButton>
              <NavbarButton variant="primary">
                {t("nav.login")}
              </NavbarButton>
              <LanguageSelector
                selectedLanguage={selectedLanguage}
                onSelectLanguage={handleSelectLanguage}
              />
            </div>
            <div className="lg:hidden flex items-center gap-4">
              <NavbarButton variant="primary" className="block w-full text-center">
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
                onClick={() => setIsMobileMenuOpen(false)}
                variant="primary"
                className="w-full text-center"
              >
                {t("nav.login")}
              </NavbarButton>
              <NavbarButton
                onClick={() => setIsMobileMenuOpen(false)}
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

      <Beranda />
    </div>
  );
}
