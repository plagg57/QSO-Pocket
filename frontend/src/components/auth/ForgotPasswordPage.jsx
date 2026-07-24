import { useState } from "react";
import axios from "axios";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import { Lock, Envelope, Check } from "@phosphor-icons/react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { LanguageSelector } from "@/components/shared";
import { LOGO_URL, API, formatApiError } from "@/config";

export default function ForgotPasswordPage({ onBack }) {
  const { t } = useTranslation();
  const [identifier, setIdentifier] = useState("");
  const [loading, setLoading] = useState(false);
  const [resetLink, setResetLink] = useState(null);
  const [emailSent, setEmailSent] = useState(false);
  const [resetCallsign, setResetCallsign] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!identifier) { toast.error(t("forgot.fill_field")); return; }
    setLoading(true);
    try {
      const { data } = await axios.post(`${API}/auth/forgot-password`, { email: identifier, frontend_origin: window.location.origin });
      setResetCallsign(data.callsign || "");
      if (data.email_sent) {
        setEmailSent(true);
        toast.success(t("forgot.email_sent"));
      } else if (data.reset_link) {
        setResetLink(data.reset_link);
        toast.success(t("forgot.link_generated"));
      } else {
        setEmailSent(true);
        toast.info(t("forgot.link_generated"));
      }
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
        <div className="bg-[#121212] border border-zinc-800/80 p-6 sm:p-8" data-testid="forgot-password-form">
          <h2 className="font-display text-2xl font-semibold tracking-tight uppercase text-zinc-100 mb-2 flex items-center gap-2">
            <Lock size={24} className="text-amber-500" /> {t("forgot.title")}
          </h2>
          <p className="text-xs text-zinc-500 font-mono mb-6">{t("forgot.description")}</p>

          {emailSent ? (
            <div className="space-y-4">
              <div className="bg-[#09090b] border border-green-500/30 p-4">
                <div className="text-xs font-bold uppercase tracking-[0.2em] text-green-500 mb-2 flex items-center gap-2">
                  <Check size={14} /> {t("forgot.email_sent_title")}{resetCallsign ? ` — ${resetCallsign}` : ""}
                </div>
                <p className="text-xs text-zinc-400 font-mono">{t("forgot.email_sent_desc")}</p>
              </div>
              <Button onClick={() => { setEmailSent(false); setIdentifier(""); }}
                className="w-full bg-zinc-800 hover:bg-zinc-700 text-zinc-300 font-mono uppercase tracking-wider rounded-none h-10 text-xs">
                {t("forgot.new_link")}
              </Button>
            </div>
          ) : resetLink ? (
            <div className="space-y-4">
              <div className="bg-[#09090b] border border-amber-500/30 p-4">
                <div className="text-xs font-bold uppercase tracking-[0.2em] text-amber-500 mb-2">{t("forgot.reset_link_for")}{resetCallsign ? ` ${resetCallsign}` : ""}</div>
                <p className="text-xs text-zinc-400 font-mono mb-3">{t("forgot.simulation_copy")}</p>
                <div className="bg-[#121212] border border-zinc-700 p-3 break-all">
                  <a href={resetLink} className="text-xs text-amber-500 font-mono underline hover:text-amber-400" data-testid="reset-link">{resetLink}</a>
                </div>
              </div>
              <Button onClick={() => { setResetLink(null); setIdentifier(""); }}
                className="w-full bg-zinc-800 hover:bg-zinc-700 text-zinc-300 font-mono uppercase tracking-wider rounded-none h-10 text-xs">
                {t("forgot.new_link")}
              </Button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label className="text-xs font-bold uppercase tracking-[0.2em] text-zinc-500 flex items-center gap-2"><Envelope size={14} /> {t("auth.email_or_callsign")}</Label>
                <Input data-testid="forgot-email-input" type="text" value={identifier} onChange={(e) => setIdentifier(e.target.value)}
                  placeholder={t("auth.email_or_callsign")} className="bg-[#09090b] border-zinc-700 text-zinc-100 rounded-none font-mono text-sm" />
              </div>
              <Button data-testid="forgot-submit-button" type="submit" disabled={loading}
                className="w-full bg-amber-500 hover:bg-amber-600 text-black font-bold uppercase tracking-wider rounded-none h-12 transition-all duration-200 shadow-[0_0_15px_rgba(245,158,11,0.15)] hover:shadow-[0_0_20px_rgba(245,158,11,0.3)]">
                {loading ? t("forgot.sending") : t("forgot.submit")}
              </Button>
            </form>
          )}

          <div className="mt-6 text-center">
            <button data-testid="back-to-login-from-forgot" onClick={onBack} className="text-sm text-zinc-500 hover:text-amber-500 font-mono transition-colors">
              {t("forgot.back_to_login")} <span className="text-amber-500 underline">{t("forgot.login_link")}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
