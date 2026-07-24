import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { LANGUAGES, changeLanguage } from "@/i18n";
import { WifiSlash, CloudArrowUp } from "@phosphor-icons/react";

export function LanguageSelector() {
  const { i18n } = useTranslation();
  const [open, setOpen] = useState(false);
  const current = LANGUAGES.find(l => l.code === i18n.language) || LANGUAGES[0];

  return (
    <div className="relative" data-testid="language-selector">
      <button onClick={() => setOpen(!open)}
        className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-mono uppercase tracking-wider text-zinc-300 border border-zinc-700 rounded-full hover:border-zinc-500 transition-all duration-200">
        <span className="text-base leading-none">文</span>
        <span>{current.code.toUpperCase()}</span>
        <span className="text-[10px] text-zinc-500">▼</span>
      </button>
      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)}></div>
          <div className="absolute right-0 top-full mt-1 bg-[#121212] border border-zinc-700 z-50 min-w-[160px] shadow-xl shadow-black/50">
            {LANGUAGES.map((lang) => (
              <button key={lang.code} onClick={() => { changeLanguage(lang.code); setOpen(false); }}
                className={`w-full flex items-center gap-2.5 px-4 py-2.5 text-sm font-mono hover:bg-amber-500/10 transition-colors ${lang.code === i18n.language ? "text-amber-500" : "text-zinc-300"}`}>
                <img src={lang.flag} alt="" className="h-3.5" />
                <span>{lang.label}</span>
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

export function useOnlineStatus() {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  useEffect(() => {
    const goOnline = () => setIsOnline(true);
    const goOffline = () => setIsOnline(false);
    window.addEventListener("online", goOnline);
    window.addEventListener("offline", goOffline);
    return () => { window.removeEventListener("online", goOnline); window.removeEventListener("offline", goOffline); };
  }, []);
  return isOnline;
}

export function OfflineBanner({ pendingCount }) {
  const { t } = useTranslation();
  const isOnline = useOnlineStatus();
  if (isOnline && pendingCount === 0) return null;
  return (
    <div className={`fixed top-0 left-0 right-0 z-[100] px-4 py-2 text-center text-xs font-mono uppercase tracking-wider transition-all duration-300 ${isOnline ? "bg-amber-500/90 text-black" : "bg-red-600/90 text-white"}`} data-testid="offline-banner">
      {!isOnline ? (
        <span className="flex items-center justify-center gap-2"><WifiSlash size={14} weight="bold" /> {t("offline.indicator")}</span>
      ) : pendingCount > 0 ? (
        <span className="flex items-center justify-center gap-2"><CloudArrowUp size={14} weight="bold" /> {pendingCount} {t("offline.pending")}</span>
      ) : null}
    </div>
  );
}
