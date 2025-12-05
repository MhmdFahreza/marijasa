"use client";

import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import LanguageDetector from "i18next-browser-languagedetector";

const resources = {
  id: {
    translation: {
      nav: {
        login: "Masuk",
        register: "Daftar",
        language: "Bahasa",
        en: "Inggris",
        id: "Indonesia",
      },
      hero: {
        tagline: "Kami memiliki teknisi penyedia jasa rumah tangga.",
        findService: "Temukan Penyedia Jasa Terpercaya, untuk Kebutuhan Rumah Tangga Anda."
      }
    },
  },
  en: {
    translation: {
      nav: {
        login: "Login",
        register: "Register",
        language: "Language",
        en: "English",
        id: "Indonesian",
      },
      hero: {
        tagline: "We have household service provider technicians.",
        findService: "Find Trusted Service Providers for Your Household Needs."
      }
    },
  },
};

if (!i18n.isInitialized) {
  i18n
    .use(LanguageDetector)
    .use(initReactI18next)
    .init({
      resources,
      fallbackLng: "id",
      supportedLngs: ["id", "en"],
      load: "languageOnly",
      detection: {
        order: ["htmlTag", "navigator"],
        caches: [], 
      },
      interpolation: { escapeValue: false },
    });
}

export default i18n;