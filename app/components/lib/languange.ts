// app/components/lib/language.ts
"use client";

import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import LanguageDetector from "i18next-browser-languagedetector";

const resources = {
  id: {
    translation: {
      // Navigation
      nav: {
        login: "Masuk",
        register: "Daftar",
        language: "Bahasa",
        en: "Inggris",
        id: "Indonesia",
        profile: "Profil Saya",
        orders: "Riwayat Pesanan",
        favorites: "Vendor Favorit",
        logout: "Keluar",
        notifications: "Notifikasi",
      },
      // Hero
      hero: {
        tagline: "Kami memiliki teknisi penyedia jasa rumah tangga.",
        findService: "Temukan Penyedia Jasa Terpercaya, untuk Kebutuhan Rumah Tangga Anda."
      },
      // Notifications
      notifications: {
        title: "Notifikasi",
        markAllRead: "Tandai semua dibaca",
        noNotifications: "Tidak ada notifikasi",
        emptyMessage: "Semua notifikasi akan muncul di sini",
        deleteAll: "Hapus Semua Notifikasi",
      },
      // User Profile
      profile: {
        welcome: "Selamat datang",
        user: "Pengguna",
        myProfile: "Profil Saya",
        orderHistory: "Riwayat Pesanan",
        favoriteVendors: "Vendor Favorit",
      },
      // Common
      common: {
        loading: "Memuat...",
        error: "Terjadi kesalahan",
        success: "Berhasil",
        cancel: "Batal",
        save: "Simpan",
        delete: "Hapus",
        edit: "Ubah",
        view: "Lihat",
      }
    },
  },
  en: {
    translation: {
      // Navigation
      nav: {
        login: "Login",
        register: "Register",
        language: "Language",
        en: "English",
        id: "Indonesian",
        profile: "My Profile",
        orders: "Order History",
        favorites: "Favorite Vendors",
        logout: "Logout",
        notifications: "Notifications",
      },
      // Hero
      hero: {
        tagline: "We have household service provider technicians.",
        findService: "Find Trusted Service Providers for Your Household Needs."
      },
      // Notifications
      notifications: {
        title: "Notifications",
        markAllRead: "Mark all as read",
        noNotifications: "No notifications",
        emptyMessage: "All notifications will appear here",
        deleteAll: "Delete All Notifications",
      },
      // User Profile
      profile: {
        welcome: "Welcome",
        user: "User",
        myProfile: "My Profile",
        orderHistory: "Order History",
        favoriteVendors: "Favorite Vendors",
      },
      // Common
      common: {
        loading: "Loading...",
        error: "An error occurred",
        success: "Success",
        cancel: "Cancel",
        save: "Save",
        delete: "Delete",
        edit: "Edit",
        view: "View",
      }
    },
  },
};

// Initialize hanya sekali
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
        order: ["localStorage", "htmlTag", "navigator"],
        caches: ["localStorage"],
        lookupLocalStorage: "appLanguage",
      },
      interpolation: { 
        escapeValue: false 
      },
      react: {
        useSuspense: false,
        bindI18n: "languageChanged loaded",
      },
      debug: process.env.NODE_ENV === "development",
    });
}

export { i18n };
export default i18n;