import { useState } from "react";
import axios from "axios";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import { Lock, Check } from "@phosphor-icons/react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { LanguageSelector } from "@/components/shared";
import { LOGO_URL, API, formatApiError } from "@/config";

export default function ResetPasswordPage({ token, onDone }) {
  const { t } = useTranslation();
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!password || !confirmPassword) { toast.error(t("reset.fill_both")); return; }
    if (password.length < 6) { toast.error(t("auth.password_min")); return; }
    if (password !== confirmPassword) { toast.error(t("reset.passwords_no_match")); return; }
    setLoading(true);
    try {
      await axios.post(`${API}/auth/reset-password`, { token, password });
      toast.success(t("reset.success_title"));
      setSuccess(true);
    } catch (err) { toast.error(formatApiError(err.response?.data?.detail)); }
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
        <div className="bg-[#121212] border border-zinc-800/80 p-6 sm:p-8" data-testid="reset-password-form">
          {success ? (
            <div className="text-center space-y-4">
              <div className="text-amber-500 text-4xl font-mono mb-2"><Check size={48} className="mx-auto" /></div>
              <h2 className="font-display text-xl font-semibold tracking-tight uppercase text-zinc-100">{t("reset.success_title")}</h2>
              <p className="text-sm text-zinc-400 font-mono">{t("reset.success_message")}</p>
              <Button onClick={onDone} data-testid="back-to-login-after-reset"
                className="w-full bg-amber-500 hover:bg-amber-600 text-black font-bold uppercase tracking-wider rounded-none h-12">
                {t("reset.back_to_login")}
              </Button>
            </div>
          ) : (
            <>
              <h2 className="font-display text-2xl font-semibold tracking-tight uppercase text-zinc-100 mb-6 flex items-center gap-2">
                <Lock size={24} className="text-amber-500" /> {t("reset.title")}
              </h2>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label className="text-xs font-bold uppercase tracking-[0.2em] text-zinc-500 flex items-center gap-2"><Lock size={14} /> {t("reset.new_password")}</Label>
                  <Input data-testid="new-password-input" type="password" value={password} onChange={(e) => setPassword(e.target.value)}
                    placeholder={t("auth.password_min")} className="bg-[#09090b] border-zinc-700 text-zinc-100 rounded-none font-mono text-sm" />
                </div>
                <div className="space-y-2">
                  <Label className="text-xs font-bold uppercase tracking-[0.2em] text-zinc-500 flex items-center gap-2"><Lock size={14} /> {t("reset.confirm_password")}</Label>
                  <Input data-testid="confirm-password-input" type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder={t("reset.confirm_password")} className="bg-[#09090b] border-zinc-700 text-zinc-100 rounded-none font-mono text-sm" />
                </div>
                <Button data-testid="reset-submit-button" type="submit" disabled={loading}
                  className="w-full bg-amber-500 hover:bg-amber-600 text-black font-bold uppercase tracking-wider rounded-none h-12 transition-all duration-200 shadow-[0_0_15px_rgba(245,158,11,0.15)] hover:shadow-[0_0_20px_rgba(245,158,11,0.3)]">
                  {loading ? t("reset.submitting") : t("reset.submit")}
                </Button>
              </form>
              <div className="mt-6 text-center">
                <button onClick={onDone} className="text-sm text-zinc-500 hover:text-amber-500 font-mono transition-colors">
                  {t("forgot.back_to_login")} <span className="text-amber-500 underline">{t("forgot.login_link")}</span>
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
