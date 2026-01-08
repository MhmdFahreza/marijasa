// app/components/contexts/LanguageContext.tsx
"use client";

import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  ReactNode,
} from "react";
import i18n from "@/app/components/lib/languange";

const LANG_STORAGE_KEY = "appLanguage";

interface LanguageContextType {
  language: string;
  setLanguage: (lang: string) => void;
  t: (key: string) => string;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [language, setLanguageState] = useState<string>("id");

  // Initialize language from storage
  useEffect(() => {
    if (typeof window === "undefined") return;

    const savedLang = window.localStorage.getItem(LANG_STORAGE_KEY);
    const browserLang = navigator.language.split("-")[0];
    
    const initialLang = savedLang || (["id", "en"].includes(browserLang) ? browserLang : "id");
    
    setLanguageState(initialLang);
    i18n.changeLanguage(initialLang);
    
    // Set HTML lang attribute
    document.documentElement.lang = initialLang;
    
    // Set cookie for server-side
    document.cookie = `i18next=${initialLang}; path=/; max-age=${60 * 60 * 24 * 30}`;
    
    console.log("[Language] Initialized with:", initialLang);
  }, []);

  // Set language function
  const setLanguage = useCallback((lang: string) => {
    if (!["id", "en"].includes(lang)) {
      console.error("[Language] Invalid language:", lang);
      return;
    }

    setLanguageState(lang);
    i18n.changeLanguage(lang);
    
    // Update HTML lang attribute
    document.documentElement.lang = lang;
    
    // Save to localStorage
    if (typeof window !== "undefined") {
      window.localStorage.setItem(LANG_STORAGE_KEY, lang);
    }
    
    // Set cookie for server-side
    document.cookie = `i18next=${lang}; path=/; max-age=${60 * 60 * 24 * 30}`;
    
    console.log("[Language] Language changed to:", lang);
  }, []);

  // Translation helper
  const t = useCallback((key: string): string => {
    return i18n.t(key);
  }, [language]); // Recreate when language changes

  const value: LanguageContextType = {
    language,
    setLanguage,
    t,
  };

  return (
    <LanguageContext.Provider value={value}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (context === undefined) {
    throw new Error("useLanguage must be used within a LanguageProvider");
  }
  return context;
}