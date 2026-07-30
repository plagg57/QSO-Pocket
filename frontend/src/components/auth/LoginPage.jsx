import { useState } from "react";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import { SignIn, Envelope, Lock, Eye, EyeSlash } from "@phosphor-icons/react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/context/AuthContext";
import { LanguageSelector } from "@/components/shared";
import { LOGO_URL, formatApiError } from "@/config";

export default function LoginPage({ onSwitch, onForgot }) {
  const { login } = useAuth();
  const { t } = useTranslation();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPwd, setShowPwd] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email || !password) { toast.error(t("auth.fill_all")); return; }
    setLoading(true);
    try { await login(email, password); toast.success(t("auth.login_success")); }
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
        <div className="bg-[#121212] border border-zinc-800/80 p-6 sm:p-8" data-testid="login-form">
          <h2 className="font-display text-2xl font-semibold tracking-tight uppercase text-zinc-100 mb-6 flex items-center gap-2">
            <SignIn size={24} className="text-amber-500" /> {t("auth.login")}
          </h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label className="text-xs font-bold uppercase tracking-[0.2em] text-zinc-500 flex items-center gap-2"><Envelope size={14} /> {t("auth.email_or_callsign")}</Label>
              <Input data-testid="login-email-input" type="text" value={email} onChange={(e) => setEmail(e.target.value)} placeholder={t("auth.email_or_callsign")} className="bg-[#09090b] border-zinc-700 text-zinc-100 rounded-none font-mono text-sm" />
            </div>
            <div className="space-y-2">
              <Label className="text-xs font-bold uppercase tracking-[0.2em] text-zinc-500 flex items-center gap-2"><Lock size={14} /> {t("auth.password")}</Label>
              <div className="relative">
                <Input data-testid="login-password-input" type={showPwd ? "text" : "password"} value={password} onChange={(e) => setPassword(e.target.value)} placeholder="********" className="bg-[#09090b] border-zinc-700 text-zinc-100 rounded-none font-mono text-sm pr-10" />
                <button type="button" onClick={() => setShowPwd(!showPwd)} data-testid="toggle-password-login"
                  className="absolute right-2 top-1/2 -translate-y-1/2 p-1 text-zinc-500 hover:text-zinc-300 transition-colors">
                  {showPwd ? <EyeSlash size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>
            <Button data-testid="login-submit-button" type="submit" disabled={loading} className="w-full bg-amber-500 hover:bg-amber-600 text-black font-bold uppercase tracking-wider rounded-none h-12 transition-all duration-200 shadow-[0_0_15px_rgba(245,158,11,0.15)] hover:shadow-[0_0_20px_rgba(245,158,11,0.3)]">
              {loading ? t("auth.logging_in") : t("auth.login_button")}
            </Button>
          </form>
          <div className="mt-6 space-y-3">
            <button data-testid="switch-to-forgot" onClick={onForgot}
              className="w-full py-2.5 text-sm font-mono uppercase tracking-wider text-amber-500 border border-amber-500/40 hover:bg-amber-500/10 transition-all duration-200">
              {t("auth.forgot_password")}
            </button>
            <div className="text-center">
              <button data-testid="switch-to-register" onClick={onSwitch} className="text-sm text-zinc-500 hover:text-amber-500 font-mono transition-colors">
                {t("auth.no_account")} <span className="text-amber-500 underline">{t("auth.register_button")}</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
