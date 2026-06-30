import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import LanguageDetector from "i18next-browser-languagedetector";

import en from "./locales/en.json";
import vi from "./locales/vi.json";

i18n
  .use(LanguageDetector) // Kích hoạt lại bộ phát hiện ngôn ngữ
  .use(initReactI18next)
  .init({
    resources: {
      vi: { translation: vi },
      en: { translation: en }
    },
    
    fallbackLng: "vi", 

    // 3. Cấu hình kiểm tra localStorage
    detection: {
      order: ['localStorage', 'navigator'], // Ưu tiên tìm trong localStorage trước
      lookupLocalStorage: 'app-lang',       // Key lưu dưới localStorage của bạn
      caches: ['localStorage'],             // Tự động lưu lại vào localStorage khi user đổi ngôn ngữ
    },

    interpolation: {
      escapeValue: false,
    },
  });

export default i18n;