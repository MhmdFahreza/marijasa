"use client";

import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import LanguageDetector from "i18next-browser-languagedetector";

const resources = {
  id: {
    translation: {
      nav: {
        registerProvider: "Daftar sebagai penyedia jasa",
        login: "Masuk / Daftar",
        language: "Bahasa",
        en: "Inggris",
        id: "Indonesia",
      },
    },
  },
  en: {
    translation: {
      nav: {
        registerProvider: "Join as service provider",
        login: "Login / Register",
        language: "Language",
        en: "English",
        id: "Indonesian",
      },
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
