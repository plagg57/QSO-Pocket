import { useState } from "react";
import axios from "axios";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import { ArrowLeft, IdentificationCard, Check } from "@phosphor-icons/react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/context/AuthContext";
import { API, formatApiError } from "@/config";
import WavelogSection from "@/components/profile/WavelogSection";

export default function ProfilePage({ onBack }) {
  const { user } = useAuth();
  const { t } = useTranslation();
  const [currentPwd, setCurrentPwd] = useState("");
  const [newPwd, setNewPwd] = useState("");
  const [confirmPwd, setConfirmPwd] = useState("");
  const [newEmail, setNewEmail] = useState("");
  const [emailPwd, setEmailPwd] = useState("");
  const [pwdLoading, setPwdLoading] = useState(false);
  const [emailLoading, setEmailLoading] = useState(false);

  // Callsign management
  const callsigns = user?.callsigns || { radioamateur: "", cb: "", swl: "" };
  const [csRadio, setCsRadio] = useState(callsigns.radioamateur || "");
  const [csCb, setCsCb] = useState(callsigns.cb || "");
  const [csSwl, setCsSwl] = useState(callsigns.swl || "");
  const [csLoading, setCsLoading] = useState(false);

  const handleChangePwd = async (e) => {
    e.preventDefault();
    if (!currentPwd || !newPwd) { toast.error(t("profile.fill_all")); return; }
    if (newPwd.length < 6) { toast.error(t("auth.password_min")); return; }
    if (newPwd !== confirmPwd) { toast.error(t("reset.passwords_no_match")); return; }
    setPwdLoading(true);
    try {
      await axios.put(`${API}/auth/change-password`, { current_password: currentPwd, new_password: newPwd });
      toast.success(t("profile.password_changed"));
      setCurrentPwd(""); setNewPwd(""); setConfirmPwd("");
    } catch (err) { toast.error(formatApiError(err.response?.data?.detail)); }
    finally { setPwdLoading(false); }
  };

  const handleChangeEmail = async (e) => {
    e.preventDefault();
    if (!newEmail || !emailPwd) { toast.error(t("profile.fill_all")); return; }
    setEmailLoading(true);
    try {
      const { data } = await axios.put(`${API}/auth/change-email`, { new_email: newEmail, password: emailPwd });
      toast.success(`${t("profile.email_changed")} : ${data.email}`);
      setNewEmail(""); setEmailPwd("");
    } catch (err) { toast.error(formatApiError(err.response?.data?.detail)); }
    finally { setEmailLoading(false); }
  };

  const handleSaveCallsigns = async () => {
    setCsLoading(true);
    try {
      await axios.put(`${API}/auth/callsigns`, {
        radioamateur: csRadio.toUpperCase().trim(),
        cb: csCb.toUpperCase().trim(),
        swl: csSwl.toUpperCase().trim()
      });
      toast.success(t("profile.callsigns_updated"));
    } catch (err) { toast.error(formatApiError(err.response?.data?.detail)); }
    finally { setCsLoading(false); }
  };

  return (
    <div data-testid="profile-page">
      <button onClick={onBack} className="flex items-center gap-2 text-zinc-400 hover:text-amber-500 transition-colors font-mono text-sm mb-6" data-testid="profile-back-btn">
        <ArrowLeft size={18} /> {t("profile.back")}
      </button>

      <h2 className="font-display text-2xl font-bold tracking-tight uppercase text-zinc-100 mb-2">{t("profile.title")}</h2>
      <p className="text-sm text-zinc-500 font-mono mb-6">{user?.callsign} — {user?.email}</p>

      {/* Callsigns management */}
      <div className="bg-[#121212] border border-zinc-800/80 p-5 mb-4" data-testid="callsigns-section">
        <h3 className="font-display text-sm font-semibold tracking-tight uppercase text-zinc-400 mb-4 flex items-center gap-2">
          <IdentificationCard size={16} /> {t("profile.my_callsigns")}
        </h3>
        <div className="space-y-3">
          <div>
            <Label className="text-xs font-bold uppercase tracking-[0.15em] text-zinc-500 font-mono mb-1 block">📡 {t("auth.callsign_radio")}</Label>
            <Input value={csRadio} onChange={(e) => setCsRadio(e.target.value.toUpperCase())} data-testid="callsign-radio-input"
              placeholder={t("auth.callsign_radio_placeholder")} className="bg-[#09090b] border-zinc-700 text-zinc-100 rounded-none font-mono text-sm uppercase" />
          </div>
          <div>
            <Label className="text-xs font-bold uppercase tracking-[0.15em] text-zinc-500 font-mono mb-1 block">🚛 {t("auth.callsign_cb")}</Label>
            <Input value={csCb} onChange={(e) => setCsCb(e.target.value.toUpperCase())} data-testid="callsign-cb-input"
              placeholder={t("auth.callsign_cb_placeholder")} className="bg-[#09090b] border-zinc-700 text-zinc-100 rounded-none font-mono text-sm uppercase" />
          </div>
          <div>
            <Label className="text-xs font-bold uppercase tracking-[0.15em] text-zinc-500 font-mono mb-1 block">🎧 {t("auth.callsign_swl")}</Label>
            <Input value={csSwl} onChange={(e) => setCsSwl(e.target.value.toUpperCase())} data-testid="callsign-swl-input"
              placeholder={t("auth.callsign_swl_placeholder")} className="bg-[#09090b] border-zinc-700 text-zinc-100 rounded-none font-mono text-sm uppercase" />
          </div>
          <Button onClick={handleSaveCallsigns} disabled={csLoading} data-testid="save-callsigns-btn"
            className="w-full bg-amber-500 hover:bg-amber-600 text-black font-bold uppercase tracking-wider rounded-none h-10 text-xs">
            {csLoading ? "..." : t("profile.save_callsigns")}
          </Button>
        </div>
      </div>

      <div className="bg-[#121212] border border-zinc-800/80 p-5 mb-4">
        <h3 className="font-display text-sm font-semibold tracking-tight uppercase text-zinc-400 mb-4">{t("profile.change_password")}</h3>
        <form onSubmit={handleChangePwd} className="space-y-3">
          <Input type="password" value={currentPwd} onChange={(e) => setCurrentPwd(e.target.value)} placeholder={t("profile.current_password")} data-testid="current-password-input"
            className="bg-[#09090b] border-zinc-700 text-zinc-100 rounded-none font-mono text-sm" />
          <Input type="password" value={newPwd} onChange={(e) => setNewPwd(e.target.value)} placeholder={t("profile.new_password")} data-testid="new-password-profile-input"
            className="bg-[#09090b] border-zinc-700 text-zinc-100 rounded-none font-mono text-sm" />
          <Input type="password" value={confirmPwd} onChange={(e) => setConfirmPwd(e.target.value)} placeholder={t("profile.confirm_new")} data-testid="confirm-password-profile-input"
            className="bg-[#09090b] border-zinc-700 text-zinc-100 rounded-none font-mono text-sm" />
          <Button type="submit" disabled={pwdLoading} data-testid="change-password-btn"
            className="w-full bg-amber-500 hover:bg-amber-600 text-black font-bold uppercase tracking-wider rounded-none h-10 text-xs">
            {pwdLoading ? "..." : t("profile.change_password_btn")}
          </Button>
        </form>
      </div>

      <div className="bg-[#121212] border border-zinc-800/80 p-5">
        <h3 className="font-display text-sm font-semibold tracking-tight uppercase text-zinc-400 mb-4">{t("profile.change_email")}</h3>
        <form onSubmit={handleChangeEmail} className="space-y-3">
          <Input type="email" value={newEmail} onChange={(e) => setNewEmail(e.target.value)} placeholder={t("profile.new_email")} data-testid="new-email-input"
            className="bg-[#09090b] border-zinc-700 text-zinc-100 rounded-none font-mono text-sm" />
          <Input type="password" value={emailPwd} onChange={(e) => setEmailPwd(e.target.value)} placeholder={t("profile.password_confirm")} data-testid="email-password-input"
            className="bg-[#09090b] border-zinc-700 text-zinc-100 rounded-none font-mono text-sm" />
          <Button type="submit" disabled={emailLoading} data-testid="change-email-btn"
            className="w-full bg-amber-500 hover:bg-amber-600 text-black font-bold uppercase tracking-wider rounded-none h-10 text-xs">
            {emailLoading ? "..." : t("profile.change_email_btn")}
          </Button>
        </form>
      </div>

      <WavelogSection />
    </div>
  );
}
