import { useState } from "react";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import { UserPlus, IdentificationCard, Envelope, Lock, Broadcast, Headphones } from "@phosphor-icons/react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/context/AuthContext";
import { LanguageSelector } from "@/components/shared";
import { LOGO_URL, formatApiError } from "@/config";

const USER_TYPES = [
  { id: "radioamateur", icon: "📡", color: "amber" },
  { id: "cibiste", icon: "🚛", color: "green" },
  { id: "swl", icon: "🎧", color: "blue" },
];

export default function RegisterPage({ onSwitch }) {
  const { register } = useAuth();
  const { t } = useTranslation();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [callsign, setCallsign] = useState("");
  const [userType, setUserType] = useState("");
  const [noCallsign, setNoCallsign] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email || !password || !userType) { toast.error(t("auth.fill_all")); return; }
    if (password.length < 6) { toast.error(t("auth.password_min")); return; }
    if (!noCallsign && !callsign) { toast.error(t("auth.fill_all")); return; }
    setLoading(true);
    try {
      await register(email, password, noCallsign ? "" : callsign, userType, noCallsign);
      toast.success(t("auth.register_success"));
    } catch (err) { toast.error(formatApiError(err.response?.data?.detail)); }
    finally { setLoading(false); }
  };

  const colorMap = { radioamateur: "amber", cibiste: "green", swl: "blue" };
  const accent = colorMap[userType] || "amber";

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

          {/* Step 1: User type selector */}
          <div className="mb-6">
            <Label className="text-xs font-bold uppercase tracking-[0.2em] text-zinc-500 mb-3 block">{t("auth.user_type")}</Label>
            <div className="grid grid-cols-3 gap-2" data-testid="user-type-selector">
              {USER_TYPES.map((ut) => (
                <button key={ut.id} type="button" onClick={() => { setUserType(ut.id); setNoCallsign(false); setCallsign(""); }}
                  data-testid={`type-${ut.id}`}
                  className={`flex flex-col items-center gap-1.5 p-3 border text-center transition-all duration-200 ${
                    userType === ut.id
                      ? `border-${ut.color}-500 bg-${ut.color}-500/10 text-${ut.color}-400`
                      : "border-zinc-700 text-zinc-500 hover:border-zinc-500"
                  }`}
                  style={userType === ut.id ? {
                    borderColor: ut.color === "amber" ? "#f59e0b" : ut.color === "green" ? "#22c55e" : "#3b82f6",
                    backgroundColor: ut.color === "amber" ? "rgba(245,158,11,0.1)" : ut.color === "green" ? "rgba(34,197,94,0.1)" : "rgba(59,130,246,0.1)",
                    color: ut.color === "amber" ? "#fbbf24" : ut.color === "green" ? "#4ade80" : "#60a5fa"
                  } : {}}>
                  <span className="text-2xl">{ut.icon}</span>
                  <span className="text-xs font-mono uppercase tracking-wider">{t(`auth.type_${ut.id}`)}</span>
                </button>
              ))}
            </div>
          </div>

          {userType && (
            <form onSubmit={handleSubmit} className="space-y-4 animate-in fade-in duration-200">
              {/* Callsign field - adapts to type */}
              <div className="space-y-2">
                <Label className="text-xs font-bold uppercase tracking-[0.2em] text-zinc-500 flex items-center gap-2">
                  <IdentificationCard size={14} />
                  {userType === "radioamateur" ? t("auth.callsign_radio")
                    : userType === "cibiste" ? t("auth.callsign_cb")
                    : t("auth.callsign_swl")}
                </Label>
                {userType === "swl" && !noCallsign && (
                  <button type="button" onClick={() => setNoCallsign(true)} data-testid="no-callsign-btn"
                    className="w-full text-xs font-mono text-blue-400 border border-blue-500/30 hover:bg-blue-500/10 py-2 px-3 transition-all mb-2">
                    {t("auth.no_callsign_btn")}
                  </button>
                )}
                {userType === "swl" && noCallsign ? (
                  <div className="bg-blue-500/5 border border-blue-500/20 p-3">
                    <p className="text-xs text-blue-400 font-mono mb-2">QSO Pocket générera un identifiant SWL-FR-XXXX pour vous.</p>
                    <button type="button" onClick={() => setNoCallsign(false)} data-testid="has-callsign-btn"
                      className="text-xs text-zinc-500 hover:text-blue-400 font-mono underline">
                      {t("auth.has_callsign_btn")}
                    </button>
                  </div>
                ) : (
                  <Input data-testid="register-callsign-input" type="text" value={callsign}
                    onChange={(e) => setCallsign(e.target.value.toUpperCase())}
                    placeholder={t(`auth.callsign_${userType === "cibiste" ? "cb" : userType === "swl" ? "swl" : "radio"}_placeholder`)}
                    className="bg-[#09090b] border-zinc-700 text-zinc-100 rounded-none font-mono text-sm uppercase" />
                )}
              </div>

              <div className="space-y-2">
                <Label className="text-xs font-bold uppercase tracking-[0.2em] text-zinc-500 flex items-center gap-2"><Envelope size={14} /> {t("auth.email")}</Label>
                <Input data-testid="register-email-input" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="votre@email.com" className="bg-[#09090b] border-zinc-700 text-zinc-100 rounded-none font-mono text-sm" />
              </div>
              <div className="space-y-2">
                <Label className="text-xs font-bold uppercase tracking-[0.2em] text-zinc-500 flex items-center gap-2"><Lock size={14} /> {t("auth.password")}</Label>
                <Input data-testid="register-password-input" type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder={t("auth.password_min")} className="bg-[#09090b] border-zinc-700 text-zinc-100 rounded-none font-mono text-sm" />
              </div>
              <Button data-testid="register-submit-button" type="submit" disabled={loading}
                className="w-full bg-amber-500 hover:bg-amber-600 text-black font-bold uppercase tracking-wider rounded-none h-12 transition-all duration-200 shadow-[0_0_15px_rgba(245,158,11,0.15)] hover:shadow-[0_0_20px_rgba(245,158,11,0.3)]">
                {loading ? t("auth.registering") : t("auth.register_button")}
              </Button>
            </form>
          )}

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
