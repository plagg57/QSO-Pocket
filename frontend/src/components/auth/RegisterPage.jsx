import { useState } from "react";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import { UserPlus, IdentificationCard, Envelope, Lock } from "@phosphor-icons/react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/context/AuthContext";
import { LanguageSelector } from "@/components/shared";
import { LOGO_URL, formatApiError } from "@/config";

export default function RegisterPage({ onSwitch }) {
  const { register } = useAuth();
  const { t } = useTranslation();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [callsign, setCallsign] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email || !password || !callsign) { toast.error(t("auth.fill_all")); return; }
    if (password.length < 6) { toast.error(t("auth.password_min")); return; }
    setLoading(true);
    try { await register(email, password, callsign); toast.success(t("auth.register_success")); }
    catch (err) { toast.error(formatApiError(err.response?.data?.detail)); }
    finally { setLoading(false); }
  };

  return (
    <div className="min-h-screen bg-[#09090b] flex items-center justify-center p-4 relative">
      <div className="radio-bg"></div>
      <div className="absolute top-4 right-4 z-20"><LanguageSelector /></div>
      <div className="relative z-10 w-full max-w-md">
        <div className="text-center mb-6">
          <img src={LOGO_URL} alt="QSO Pocket" className="h-24 sm:h-28 mx-auto" />
        </div>
        <div className="bg-[#121212] border border-zinc-800/80 p-6 sm:p-8" data-testid="register-form">
          <h2 className="font-display text-2xl font-semibold tracking-tight uppercase text-zinc-100 mb-6 flex items-center gap-2">
            <UserPlus size={24} className="text-amber-500" /> {t("auth.register")}
          </h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label className="text-xs font-bold uppercase tracking-[0.2em] text-zinc-500 flex items-center gap-2"><IdentificationCard size={14} /> {t("auth.callsign")}</Label>
              <Input data-testid="register-callsign-input" type="text" value={callsign} onChange={(e) => setCallsign(e.target.value.toUpperCase())} placeholder={t("auth.callsign_placeholder")} className="bg-[#09090b] border-zinc-700 text-zinc-100 rounded-none font-mono text-sm uppercase" />
              <p className="text-xs text-zinc-600 font-mono">{t("auth.callsign_hint")}</p>
            </div>
            <div className="space-y-2">
              <Label className="text-xs font-bold uppercase tracking-[0.2em] text-zinc-500 flex items-center gap-2"><Envelope size={14} /> {t("auth.email")}</Label>
              <Input data-testid="register-email-input" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="votre@email.com" className="bg-[#09090b] border-zinc-700 text-zinc-100 rounded-none font-mono text-sm" />
            </div>
            <div className="space-y-2">
              <Label className="text-xs font-bold uppercase tracking-[0.2em] text-zinc-500 flex items-center gap-2"><Lock size={14} /> {t("auth.password")}</Label>
              <Input data-testid="register-password-input" type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder={t("auth.password_min")} className="bg-[#09090b] border-zinc-700 text-zinc-100 rounded-none font-mono text-sm" />
            </div>
            <Button data-testid="register-submit-button" type="submit" disabled={loading} className="w-full bg-amber-500 hover:bg-amber-600 text-black font-bold uppercase tracking-wider rounded-none h-12 transition-all duration-200 shadow-[0_0_15px_rgba(245,158,11,0.15)] hover:shadow-[0_0_20px_rgba(245,158,11,0.3)]">
              {loading ? t("auth.registering") : t("auth.register_button")}
            </Button>
          </form>
          <div className="mt-6 text-center">
            <button data-testid="switch-to-login" onClick={onSwitch} className="text-sm text-zinc-500 hover:text-amber-500 font-mono transition-colors">
              {t("auth.has_account")} <span className="text-amber-500 underline">{t("auth.login_button")}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
