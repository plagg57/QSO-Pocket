import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import fr from "./fr.json";
import en from "./en.json";
import de from "./de.json";
import it from "./it.json";

// Auto-detect: saved > browser > fr
function detectLanguage() {
  const saved = localStorage.getItem("qso_language");
  if (saved) return saved;
  const browserLang = (navigator.language || "").split("-")[0].toLowerCase();
  if (["fr", "en", "de", "it"].includes(browserLang)) return browserLang;
  return "fr";
}

const detectedLang = detectLanguage();
localStorage.setItem("qso_language", detectedLang);

i18n.use(initReactI18next).init({
  resources: {
    fr: { translation: fr },
    en: { translation: en },
    de: { translation: de },
    it: { translation: it },
  },
  lng: detectedLang,
  fallbackLng: "fr",
  interpolation: { escapeValue: false },
});

export default i18n;

export const LANGUAGES = [
  { code: "fr", label: "Français", flag: "https://flagcdn.com/24x18/fr.png" },
  { code: "en", label: "English", flag: "https://flagcdn.com/24x18/gb.png" },
  { code: "de", label: "Deutsch", flag: "https://flagcdn.com/24x18/de.png" },
  { code: "it", label: "Italiano", flag: "https://flagcdn.com/24x18/it.png" },
];

export function changeLanguage(code) {
  i18n.changeLanguage(code);
  localStorage.setItem("qso_language", code);
}
