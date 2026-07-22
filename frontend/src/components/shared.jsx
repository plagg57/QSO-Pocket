import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { LANGUAGES, changeLanguage } from "@/i18n";

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
        <span className="flex items-center justify-center gap-2">
          <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" fill="currentColor" viewBox="0 0 256 256"><path d="M213.92,210.62a8,8,0,1,1-11.84,10.76L171.31,188a8,8,0,0,1-1.17-1.63l-22.83-25.12A75.84,75.84,0,0,0,128,164a76,76,0,0,0-53.87,22.32,8,8,0,0,1-11.31-11.32,92,92,0,0,1,63.87-27.12L106.31,125.7a107.49,107.49,0,0,0-39.06,16.93,8,8,0,1,1-9.5-12.88,123.3,123.3,0,0,1,33.55-17.35L74.72,94.62a139.6,139.6,0,0,0-30.84,16.69,8,8,0,1,1-9.76-12.66,155.64,155.64,0,0,1,26.19-15.37L42.08,64.38a8,8,0,0,1,11.84-10.76ZM246.12,111.31a156.16,156.16,0,0,0-195.2-17.35l11.59,12.76A139.83,139.83,0,0,1,236.36,98.65a8,8,0,0,0,9.76,12.66ZM197.75,142.63a108.07,108.07,0,0,0-87.89-20.41l14.12,15.53a91.8,91.8,0,0,1,64.27,17.76,8,8,0,1,0,9.5-12.88ZM128,196a28,28,0,1,0,28,28A28,28,0,0,0,128,196Zm0,40a12,12,0,1,1,12-12A12,12,0,0,1,128,236Z"/></svg>
          {t("offline.indicator")}
        </span>
      ) : pendingCount > 0 ? (
        <span className="flex items-center justify-center gap-2">
          <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" fill="currentColor" viewBox="0 0 256 256"><path d="M248,128a8,8,0,0,1-8,8H200a8,8,0,0,1,0-16h40A8,8,0,0,1,248,128ZM128,72a8,8,0,0,0,8-8V24a8,8,0,0,0-16,0V64A8,8,0,0,0,128,72Zm88,56a88,88,0,0,1-176,0c0-27.92,13-53.59,36.68-72.36a8,8,0,0,1,10.64,11.92C67.26,84.16,56,105.2,56,128a72,72,0,0,0,144,0c0-22.8-11.26-43.84-31.32-60.44a8,8,0,1,1,10.64-11.92C203,74.41,216,100.08,216,128Z"/></svg>
          {pendingCount} {t("offline.pending")}
        </span>
      ) : null}
    </div>
  );
}
