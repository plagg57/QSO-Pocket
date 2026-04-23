import { useState, useEffect, useCallback, createContext, useContext } from "react";
import "@/App.css";
import axios from "axios";
import { Toaster, toast } from "sonner";
import {
  Broadcast,
  CalendarBlank,
  User,
  IdentificationCard,
  MagnifyingGlass,
  Pencil,
  Trash,
  Plus,
  X,
  SignOut,
  Envelope,
  Lock,
  UserPlus,
  SignIn,
  CaretRight,
  ArrowLeft,
  Clock,
  Hash,
  Check,
  Export,
  Gear
} from "@phosphor-icons/react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { getFlagUrl, getCountryName } from "@/utils/callsignFlags";
import { getBand } from "@/utils/bands";

const LOGO_URL = "https://customer-assets.emergentagent.com/job_radio-memory/artifacts/gnvrdwzf_1000015588.png";

const MODES = ["FM", "SSB", "CW", "FT8", "FT4", "DMR", "C4FM", "D-STAR", "AM", "RTTY", "PSK31", "SSTV"];
const BANDS = ["2m", "70cm", "20m", "40m", "80m", "10m", "15m", "6m", "160m", "30m", "17m", "12m", "4m", "23cm"];

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;
axios.defaults.withCredentials = true;

// Intercept requests to add token header as fallback for mobile
axios.interceptors.request.use((config) => {
  const token = localStorage.getItem("qso_token");
  if (token && !config.headers.Authorization) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// === Auth Context ===
const AuthContext = createContext(null);
function useAuth() { return useContext(AuthContext); }

function formatApiError(detail) {
  if (detail == null) return "Une erreur est survenue";
  if (typeof detail === "string") return detail;
  if (Array.isArray(detail)) return detail.map((e) => e?.msg || JSON.stringify(e)).filter(Boolean).join(" ");
  return String(detail);
}

function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    axios.get(`${API}/auth/me`)
      .then(res => { setUser(res.data); setChecking(false); })
      .catch(() => { setUser(false); setChecking(false); });
  }, []);

  const login = async (email, password) => {
    const { data } = await axios.post(`${API}/auth/login`, { email, password });
    if (data.access_token) localStorage.setItem("qso_token", data.access_token);
    setUser(data);
  };
  const register = async (email, password, callsign) => {
    const { data } = await axios.post(`${API}/auth/register`, { email, password, callsign });
    if (data.access_token) localStorage.setItem("qso_token", data.access_token);
    setUser(data);
  };
  const logout = async () => {
    await axios.post(`${API}/auth/logout`);
    localStorage.removeItem("qso_token");
    setUser(false);
  };

  return <AuthContext.Provider value={{ user, checking, login, register, logout }}>{children}</AuthContext.Provider>;
}

// === Login Page ===
function LoginPage({ onSwitch, onForgot }) {
  const { login } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email || !password) { toast.error("Veuillez remplir tous les champs"); return; }
    setLoading(true);
    try { await login(email, password); toast.success("Connexion réussie"); }
    catch (err) { toast.error(formatApiError(err.response?.data?.detail)); }
    finally { setLoading(false); }
  };

  return (
    <div className="min-h-screen bg-[#09090b] flex items-center justify-center p-4 relative">
      <div className="radio-bg"></div>
      <div className="relative z-10 w-full max-w-md">
        <div className="text-center mb-6">
          <img src={LOGO_URL} alt="QSO Pocket" className="h-24 sm:h-28 mx-auto" />
        </div>
        <div className="bg-[#121212] border border-zinc-800/80 p-6 sm:p-8" data-testid="login-form">
          <h2 className="font-display text-2xl font-semibold tracking-tight uppercase text-zinc-100 mb-6 flex items-center gap-2">
            <SignIn size={24} className="text-amber-500" /> Connexion
          </h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label className="text-xs font-bold uppercase tracking-[0.2em] text-zinc-500 flex items-center gap-2"><Envelope size={14} /> Email ou indicatif</Label>
              <Input data-testid="login-email-input" type="text" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="votre@email.com ou indicatif" className="bg-[#09090b] border-zinc-700 text-zinc-100 rounded-none font-mono text-sm" />
            </div>
            <div className="space-y-2">
              <Label className="text-xs font-bold uppercase tracking-[0.2em] text-zinc-500 flex items-center gap-2"><Lock size={14} /> Mot de passe</Label>
              <Input data-testid="login-password-input" type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="********" className="bg-[#09090b] border-zinc-700 text-zinc-100 rounded-none font-mono text-sm" />
            </div>
            <Button data-testid="login-submit-button" type="submit" disabled={loading} className="w-full bg-amber-500 hover:bg-amber-600 text-black font-bold uppercase tracking-wider rounded-none h-12 transition-all duration-200 shadow-[0_0_15px_rgba(245,158,11,0.15)] hover:shadow-[0_0_20px_rgba(245,158,11,0.3)]">
              {loading ? "Connexion..." : "Se connecter"}
            </Button>
          </form>
          <div className="mt-6 space-y-3">
            <button data-testid="switch-to-forgot" onClick={onForgot}
              className="w-full py-2.5 text-sm font-mono uppercase tracking-wider text-amber-500 border border-amber-500/40 hover:bg-amber-500/10 transition-all duration-200">
              Mot de passe oublié ?
            </button>
            <div className="text-center">
              <button data-testid="switch-to-register" onClick={onSwitch} className="text-sm text-zinc-500 hover:text-amber-500 font-mono transition-colors">
                Pas de compte ? <span className="text-amber-500 underline">S'inscrire</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// === Register Page ===
function RegisterPage({ onSwitch }) {
  const { register } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [callsign, setCallsign] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email || !password || !callsign) { toast.error("Veuillez remplir tous les champs"); return; }
    if (password.length < 6) { toast.error("Le mot de passe doit faire au moins 6 caractères"); return; }
    setLoading(true);
    try { await register(email, password, callsign); toast.success("Inscription réussie"); }
    catch (err) { toast.error(formatApiError(err.response?.data?.detail)); }
    finally { setLoading(false); }
  };

  return (
    <div className="min-h-screen bg-[#09090b] flex items-center justify-center p-4 relative">
      <div className="radio-bg"></div>
      <div className="relative z-10 w-full max-w-md">
        <div className="text-center mb-6">
          <img src={LOGO_URL} alt="QSO Pocket" className="h-24 sm:h-28 mx-auto" />
        </div>
        <div className="bg-[#121212] border border-zinc-800/80 p-6 sm:p-8" data-testid="register-form">
          <h2 className="font-display text-2xl font-semibold tracking-tight uppercase text-zinc-100 mb-6 flex items-center gap-2">
            <UserPlus size={24} className="text-amber-500" /> Inscription
          </h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label className="text-xs font-bold uppercase tracking-[0.2em] text-zinc-500 flex items-center gap-2"><IdentificationCard size={14} /> Indicatif Radio</Label>
              <Input data-testid="register-callsign-input" type="text" value={callsign} onChange={(e) => setCallsign(e.target.value.toUpperCase())} placeholder="Votre indicatif" className="bg-[#09090b] border-zinc-700 text-zinc-100 rounded-none font-mono text-sm uppercase" />
              <p className="text-xs text-zinc-600 font-mono">Votre indicatif unique</p>
            </div>
            <div className="space-y-2">
              <Label className="text-xs font-bold uppercase tracking-[0.2em] text-zinc-500 flex items-center gap-2"><Envelope size={14} /> Email</Label>
              <Input data-testid="register-email-input" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="votre@email.com" className="bg-[#09090b] border-zinc-700 text-zinc-100 rounded-none font-mono text-sm" />
            </div>
            <div className="space-y-2">
              <Label className="text-xs font-bold uppercase tracking-[0.2em] text-zinc-500 flex items-center gap-2"><Lock size={14} /> Mot de passe</Label>
              <Input data-testid="register-password-input" type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Min. 6 caractères" className="bg-[#09090b] border-zinc-700 text-zinc-100 rounded-none font-mono text-sm" />
            </div>
            <Button data-testid="register-submit-button" type="submit" disabled={loading} className="w-full bg-amber-500 hover:bg-amber-600 text-black font-bold uppercase tracking-wider rounded-none h-12 transition-all duration-200 shadow-[0_0_15px_rgba(245,158,11,0.15)] hover:shadow-[0_0_20px_rgba(245,158,11,0.3)]">
              {loading ? "Inscription..." : "S'inscrire"}
            </Button>
          </form>
          <div className="mt-6 text-center">
            <button data-testid="switch-to-login" onClick={onSwitch} className="text-sm text-zinc-500 hover:text-amber-500 font-mono transition-colors">
              Déjà un compte ? <span className="text-amber-500 underline">Se connecter</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// === Forgot Password Page ===
function ForgotPasswordPage({ onBack }) {
  const [identifier, setIdentifier] = useState("");
  const [loading, setLoading] = useState(false);
  const [resetLink, setResetLink] = useState(null);
  const [resetCallsign, setResetCallsign] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!identifier) { toast.error("Veuillez entrer votre email ou indicatif"); return; }
    setLoading(true);
    try {
      const { data } = await axios.post(`${API}/auth/forgot-password`, { email: identifier });
      if (data.reset_link) {
        setResetLink(data.reset_link);
        setResetCallsign(data.callsign || "");
        toast.success("Lien de réinitialisation généré");
      } else {
        toast.info("Si ce compte existe, un lien a été généré.");
      }
    } catch (err) { toast.error(formatApiError(err.response?.data?.detail)); }
    finally { setLoading(false); }
  };

  return (
    <div className="min-h-screen bg-[#09090b] flex items-center justify-center p-4 relative">
      <div className="radio-bg"></div>
      <div className="relative z-10 w-full max-w-md">
        <div className="text-center mb-6">
          <img src={LOGO_URL} alt="QSO Pocket" className="h-24 sm:h-28 mx-auto" />
        </div>
        <div className="bg-[#121212] border border-zinc-800/80 p-6 sm:p-8" data-testid="forgot-password-form">
          <h2 className="font-display text-2xl font-semibold tracking-tight uppercase text-zinc-100 mb-2 flex items-center gap-2">
            <Lock size={24} className="text-amber-500" /> Mot de passe oublié
          </h2>
          <p className="text-xs text-zinc-500 font-mono mb-6">Entrez votre email ou indicatif pour recevoir un lien de réinitialisation.</p>

          {resetLink ? (
            <div className="space-y-4">
              <div className="bg-[#09090b] border border-amber-500/30 p-4">
                <div className="text-xs font-bold uppercase tracking-[0.2em] text-amber-500 mb-2">Lien de réinitialisation{resetCallsign ? ` pour ${resetCallsign}` : ""}</div>
                <p className="text-xs text-zinc-400 font-mono mb-3">En mode simulation, copiez ce lien :</p>
                <div className="bg-[#121212] border border-zinc-700 p-3 break-all">
                  <a href={resetLink} className="text-xs text-amber-500 font-mono underline hover:text-amber-400" data-testid="reset-link">{resetLink}</a>
                </div>
              </div>
              <Button onClick={() => { setResetLink(null); setIdentifier(""); }}
                className="w-full bg-zinc-800 hover:bg-zinc-700 text-zinc-300 font-mono uppercase tracking-wider rounded-none h-10 text-xs">
                Nouveau lien
              </Button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label className="text-xs font-bold uppercase tracking-[0.2em] text-zinc-500 flex items-center gap-2"><Envelope size={14} /> Email ou indicatif</Label>
                <Input data-testid="forgot-email-input" type="text" value={identifier} onChange={(e) => setIdentifier(e.target.value)}
                  placeholder="votre@email.com ou indicatif" className="bg-[#09090b] border-zinc-700 text-zinc-100 rounded-none font-mono text-sm" />
              </div>
              <Button data-testid="forgot-submit-button" type="submit" disabled={loading}
                className="w-full bg-amber-500 hover:bg-amber-600 text-black font-bold uppercase tracking-wider rounded-none h-12 transition-all duration-200 shadow-[0_0_15px_rgba(245,158,11,0.15)] hover:shadow-[0_0_20px_rgba(245,158,11,0.3)]">
                {loading ? "Envoi..." : "Réinitialiser le mot de passe"}
              </Button>
            </form>
          )}

          <div className="mt-6 text-center">
            <button data-testid="back-to-login-from-forgot" onClick={onBack} className="text-sm text-zinc-500 hover:text-amber-500 font-mono transition-colors">
              Retour à la <span className="text-amber-500 underline">connexion</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// === Reset Password Page ===
function ResetPasswordPage({ token, onDone }) {
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!password || !confirmPassword) { toast.error("Veuillez remplir les deux champs"); return; }
    if (password.length < 6) { toast.error("Le mot de passe doit faire au moins 6 caractères"); return; }
    if (password !== confirmPassword) { toast.error("Les mots de passe ne correspondent pas"); return; }
    setLoading(true);
    try {
      await axios.post(`${API}/auth/reset-password`, { token, password });
      toast.success("Mot de passe modifié avec succès");
      setSuccess(true);
    } catch (err) { toast.error(formatApiError(err.response?.data?.detail)); }
    finally { setLoading(false); }
  };

  return (
    <div className="min-h-screen bg-[#09090b] flex items-center justify-center p-4 relative">
      <div className="radio-bg"></div>
      <div className="relative z-10 w-full max-w-md">
        <div className="text-center mb-6">
          <img src={LOGO_URL} alt="QSO Pocket" className="h-24 sm:h-28 mx-auto" />
        </div>
        <div className="bg-[#121212] border border-zinc-800/80 p-6 sm:p-8" data-testid="reset-password-form">
          {success ? (
            <div className="text-center space-y-4">
              <div className="text-amber-500 text-4xl font-mono mb-2"><Check size={48} className="mx-auto" /></div>
              <h2 className="font-display text-xl font-semibold tracking-tight uppercase text-zinc-100">Mot de passe modifié</h2>
              <p className="text-sm text-zinc-400 font-mono">Vous pouvez maintenant vous connecter avec votre nouveau mot de passe.</p>
              <Button onClick={onDone} data-testid="back-to-login-after-reset"
                className="w-full bg-amber-500 hover:bg-amber-600 text-black font-bold uppercase tracking-wider rounded-none h-12">
                Se connecter
              </Button>
            </div>
          ) : (
            <>
              <h2 className="font-display text-2xl font-semibold tracking-tight uppercase text-zinc-100 mb-6 flex items-center gap-2">
                <Lock size={24} className="text-amber-500" /> Nouveau mot de passe
              </h2>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label className="text-xs font-bold uppercase tracking-[0.2em] text-zinc-500 flex items-center gap-2"><Lock size={14} /> Nouveau mot de passe</Label>
                  <Input data-testid="new-password-input" type="password" value={password} onChange={(e) => setPassword(e.target.value)}
                    placeholder="Min. 6 caractères" className="bg-[#09090b] border-zinc-700 text-zinc-100 rounded-none font-mono text-sm" />
                </div>
                <div className="space-y-2">
                  <Label className="text-xs font-bold uppercase tracking-[0.2em] text-zinc-500 flex items-center gap-2"><Lock size={14} /> Confirmer</Label>
                  <Input data-testid="confirm-password-input" type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Retapez le mot de passe" className="bg-[#09090b] border-zinc-700 text-zinc-100 rounded-none font-mono text-sm" />
                </div>
                <Button data-testid="reset-submit-button" type="submit" disabled={loading}
                  className="w-full bg-amber-500 hover:bg-amber-600 text-black font-bold uppercase tracking-wider rounded-none h-12 transition-all duration-200 shadow-[0_0_15px_rgba(245,158,11,0.15)] hover:shadow-[0_0_20px_rgba(245,158,11,0.3)]">
                  {loading ? "Modification..." : "Modifier le mot de passe"}
                </Button>
              </form>
              <div className="mt-6 text-center">
                <button onClick={onDone} className="text-sm text-zinc-500 hover:text-amber-500 font-mono transition-colors">
                  Retour à la <span className="text-amber-500 underline">connexion</span>
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

// === Add QSO Modal ===
function AddQSOModal({ callsign, prefillName, onClose, onAdded }) {
  const now = new Date();
  const utcHH = String(now.getUTCHours()).padStart(2, "0");
  const utcMM = String(now.getUTCMinutes()).padStart(2, "0");

  const [formData, setFormData] = useState({
    callsign: callsign || "",
    date: now.toISOString().split("T")[0],
    time_utc: `${utcHH}:${utcMM}`,
    frequency: "",
    mode: "",
    name: prefillName || "",
    comment: "",
  });
  const [dupInfo, setDupInfo] = useState(null);

  useEffect(() => {
    const handleEscape = (e) => { if (e.key === "Escape") onClose(); };
    document.addEventListener("keydown", handleEscape);
    return () => document.removeEventListener("keydown", handleEscape);
  }, [onClose]);

  // Anti-doublon check
  useEffect(() => {
    if (formData.callsign.length < 2) { setDupInfo(null); return; }
    const timer = setTimeout(async () => {
      try {
        const res = await axios.get(`${API}/qso/check/${encodeURIComponent(formData.callsign.toUpperCase())}`);
        setDupInfo(res.data.exists ? res.data : null);
      } catch { setDupInfo(null); }
    }, 300);
    return () => clearTimeout(timer);
  }, [formData.callsign]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.callsign || !formData.date || !formData.frequency) {
      toast.error("Veuillez remplir l'indicatif, la date et la fréquence"); return;
    }
    try {
      await axios.post(`${API}/qso`, {
        ...formData,
        callsign: formData.callsign.toUpperCase(),
        frequency: parseFloat(formData.frequency),
      });
      toast.success("QSO enregistré");
      onAdded();
      onClose();
    } catch (error) {
      toast.error(formatApiError(error.response?.data?.detail));
    }
  };

  const flagUrl = getFlagUrl(formData.callsign, 32);
  const countryName = getCountryName(formData.callsign);

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm" onClick={onClose}>
      <div className="bg-[#121212] border border-zinc-800 w-full max-w-md p-6 max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()} data-testid="add-qso-modal">
        <div className="flex items-center justify-between mb-6">
          <h2 className="font-display text-xl font-semibold tracking-tight uppercase text-zinc-100 flex items-center gap-2">
            <Plus size={20} className="text-amber-500" /> Nouveau QSO
          </h2>
          <button onClick={onClose} className="text-zinc-500 hover:text-zinc-300 transition-colors" data-testid="close-modal-btn"><X size={20} /></button>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label className="text-xs font-bold uppercase tracking-[0.2em] text-zinc-500 flex items-center gap-2"><IdentificationCard size={14} /> Indicatif</Label>
            <div className="relative">
              <Input data-testid="qso-callsign-input" type="text" value={formData.callsign} onChange={(e) => setFormData({ ...formData, callsign: e.target.value.toUpperCase() })}
                placeholder="F4ABC" className="bg-[#09090b] border-zinc-700 text-zinc-100 rounded-none font-mono text-sm uppercase pr-16" />
              {flagUrl && (
                <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-2">
                  <img src={flagUrl} alt={countryName} className="h-4 shadow-sm" />
                  <span className="text-xs text-zinc-500 font-mono">{countryName}</span>
                </div>
              )}
            </div>
            {dupInfo && (
              <div className="text-xs font-mono text-amber-500 bg-amber-500/10 border border-amber-500/20 px-3 py-2" data-testid="dup-warning">
                Déjà contacté ({dupInfo.count}x) — dernier : {new Date(dupInfo.last_date).toLocaleDateString("fr-FR")}
              </div>
            )}
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label className="text-xs font-bold uppercase tracking-[0.2em] text-zinc-500 flex items-center gap-2"><CalendarBlank size={14} /> Date</Label>
              <Input data-testid="qso-date-input" type="date" value={formData.date} onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                className="bg-[#09090b] border-zinc-700 text-zinc-100 rounded-none font-mono text-sm" />
            </div>
            <div className="space-y-2">
              <Label className="text-xs font-bold uppercase tracking-[0.2em] text-zinc-500 flex items-center gap-2"><Clock size={14} /> Heure UTC</Label>
              <Input data-testid="qso-time-input" type="time" value={formData.time_utc} onChange={(e) => setFormData({ ...formData, time_utc: e.target.value })}
                className="bg-[#09090b] border-zinc-700 text-zinc-100 rounded-none font-mono text-sm" />
            </div>
          </div>
          <div className="space-y-2">
            <Label className="text-xs font-bold uppercase tracking-[0.2em] text-zinc-500 flex items-center gap-2"><Broadcast size={14} /> Fréquence (MHz)</Label>
            <Input data-testid="qso-freq-input" type="number" step="0.001" value={formData.frequency} onChange={(e) => setFormData({ ...formData, frequency: e.target.value })}
              placeholder="145.500" className="bg-[#09090b] border-zinc-700 text-zinc-100 rounded-none font-mono text-sm" />
            {formData.frequency && getBand(formData.frequency) && (
              <span className="text-xs text-amber-500 font-mono">Bande : {getBand(formData.frequency)}</span>
            )}
          </div>
          <div className="space-y-2">
            <Label className="text-xs font-bold uppercase tracking-[0.2em] text-zinc-500 flex items-center gap-2"><Broadcast size={14} weight="bold" /> Mode</Label>
            <div className="flex flex-wrap gap-2" data-testid="qso-mode-select">
              {MODES.map((m) => (
                <button key={m} type="button" onClick={() => setFormData({ ...formData, mode: formData.mode === m ? "" : m })}
                  className={`px-3 py-1.5 text-xs font-mono uppercase tracking-wider border transition-all duration-150 ${formData.mode === m ? "bg-amber-500 text-black border-amber-500 font-bold" : "bg-[#09090b] text-zinc-400 border-zinc-700 hover:border-zinc-500"}`}>
                  {m}
                </button>
              ))}
            </div>
          </div>
          <div className="space-y-2">
            <Label className="text-xs font-bold uppercase tracking-[0.2em] text-zinc-500 flex items-center gap-2"><User size={14} /> Nom</Label>
            <Input data-testid="qso-name-input" type="text" value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="Nom (optionnel)" className="bg-[#09090b] border-zinc-700 text-zinc-100 rounded-none font-mono text-sm" />
          </div>
          <div className="space-y-2">
            <Label className="text-xs font-bold uppercase tracking-[0.2em] text-zinc-500 flex items-center gap-2"><Pencil size={14} /> Commentaire</Label>
            <textarea data-testid="qso-comment-input" value={formData.comment} onChange={(e) => setFormData({ ...formData, comment: e.target.value })}
              placeholder="Notes sur le contact (optionnel)"
              rows={2}
              className="flex w-full bg-[#09090b] border border-zinc-700 focus:border-amber-500 focus:ring-1 focus:ring-amber-500 text-zinc-100 rounded-none font-mono text-sm px-3 py-2 placeholder:text-zinc-600 resize-none" />
          </div>
          <Button data-testid="qso-submit-button" type="submit"
            className="w-full bg-amber-500 hover:bg-amber-600 text-black font-bold uppercase tracking-wider rounded-none h-12 transition-all duration-200 shadow-[0_0_15px_rgba(245,158,11,0.15)] hover:shadow-[0_0_20px_rgba(245,158,11,0.3)]">
            Enregistrer QSO
          </Button>
        </form>
      </div>
    </div>
  );
}

// === Contact Detail Panel ===
function ContactDetail({ callsign, onBack }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);

  const fetchHistory = useCallback(async () => {
    setError(false);
    try {
      const res = await axios.get(`${API}/qso/history/${encodeURIComponent(callsign)}`);
      setData(res.data);
    } catch (err) {
      console.error("History fetch error:", err.response?.status, err.response?.data);
      setError(true);
      toast.error("Erreur chargement historique");
    }
    finally { setLoading(false); }
  }, [callsign]);

  useEffect(() => { fetchHistory(); }, [fetchHistory]);

  const handleDelete = async (id) => {
    if (!window.confirm("Supprimer ce contact ?")) return;
    try {
      await axios.delete(`${API}/qso/${id}`);
      toast.success("Contact supprimé");
      onBack();
    } catch { toast.error("Erreur suppression"); }
  };

  const [editingName, setEditingName] = useState(false);
  const [nameValue, setNameValue] = useState("");
  const [editingModeId, setEditingModeId] = useState(null);
  const [editingQsoId, setEditingQsoId] = useState(null);
  const [editQsoData, setEditQsoData] = useState({ date: "", time_utc: "", frequency: "", mode: "", name: "", comment: "" });

  const startEditName = () => { setNameValue(data?.name || ""); setEditingName(true); };
  const saveContactName = async () => {
    try {
      await axios.put(`${API}/qso/contact/${encodeURIComponent(callsign)}/name`, { name: nameValue });
      toast.success("Nom mis à jour");
      setEditingName(false);
      fetchHistory();
    } catch { toast.error("Erreur mise à jour du nom"); }
  };

  const updateQsoMode = async (qsoId, newMode) => {
    try {
      await axios.put(`${API}/qso/${qsoId}`, { mode: newMode });
      toast.success("Mode mis à jour");
      setEditingModeId(null);
      fetchHistory();
    } catch { toast.error("Erreur mise à jour du mode"); }
  };

  const startEditQso = (qso) => {
    setEditingQsoId(qso.id);
    setEditQsoData({ date: qso.date, time_utc: qso.time_utc || "", frequency: qso.frequency.toString(), mode: qso.mode || "", name: qso.name || "", comment: qso.comment || "" });
  };

  const saveEditQso = async (id) => {
    try {
      await axios.put(`${API}/qso/${id}`, { ...editQsoData, frequency: parseFloat(editQsoData.frequency) });
      toast.success("QSO modifié");
      setEditingQsoId(null);
      fetchHistory();
    } catch { toast.error("Erreur modification"); }
  };

  const formatDate = (d) => new Date(d).toLocaleDateString("fr-FR", { day: "2-digit", month: "2-digit", year: "numeric" });

  // Sort history: oldest first
  const sortedHistory = data?.history ? [...data.history].sort((a, b) => b.date.localeCompare(a.date) || (b.time_utc || "").localeCompare(a.time_utc || "")) : [];


  return (
    <div data-testid="contact-detail-panel">
      {/* Header - ALWAYS visible */}
      <button onClick={onBack} className="flex items-center gap-2 text-zinc-400 hover:text-amber-500 transition-colors font-mono text-sm mb-6" data-testid="back-to-list-btn">
        <ArrowLeft size={18} /> Retour à la liste
      </button>

      {loading ? (
        <div className="p-8 text-center">
          <div className="inline-block w-4 h-6 bg-amber-500 animate-pulse"></div>
          <p className="mt-4 text-zinc-500 font-mono text-sm">Chargement...</p>
        </div>
      ) : error || !data ? (
        <div className="bg-[#121212] border border-zinc-800/80 p-8 text-center">
          <p className="text-zinc-400 font-mono text-sm mb-4">Impossible de charger l'historique de {callsign}</p>
          <Button onClick={fetchHistory} className="bg-amber-500 hover:bg-amber-600 text-black font-bold uppercase tracking-wider rounded-none">
            Réessayer
          </Button>
        </div>
      ) : (
        <>
          {/* Info Card */}
          <div className="bg-[#121212] border border-zinc-800/80 p-5 sm:p-6 mb-4">
            <div className="flex items-center gap-3 mb-2">
              {getFlagUrl(data.callsign, 32) && <img src={getFlagUrl(data.callsign, 32)} alt={getCountryName(data.callsign)} className="h-5 shadow-sm" />}
              <div className="text-3xl sm:text-4xl font-bold text-amber-500 font-mono amber-glow" data-testid="detail-callsign">{data.callsign}</div>
            </div>
            {getCountryName(data.callsign) && <div className="text-xs text-zinc-500 font-mono uppercase tracking-wider mb-1">{getCountryName(data.callsign)}</div>}
            <div className="flex items-center gap-2 mb-6">
              {editingName ? (
                <div className="flex items-center gap-2 flex-1">
                  <Input value={nameValue} onChange={(e) => setNameValue(e.target.value)} placeholder="Nom du contact"
                    className="bg-[#09090b] border-zinc-700 text-zinc-100 rounded-none font-mono text-sm h-9 flex-1" autoFocus
                    onKeyDown={(e) => { if (e.key === "Enter") saveContactName(); if (e.key === "Escape") setEditingName(false); }} />
                  <button onClick={saveContactName} className="p-1.5 text-green-500 hover:text-green-400" data-testid="save-name-btn"><Check size={18} /></button>
                  <button onClick={() => setEditingName(false)} className="p-1.5 text-zinc-500 hover:text-zinc-300"><X size={18} /></button>
                </div>
              ) : (
                <>
                  <span className="text-lg text-zinc-300 font-mono">{data.name || "Nom inconnu"}</span>
                  <button onClick={startEditName} className="p-1 text-zinc-500 hover:text-amber-500 transition-colors" data-testid="edit-name-btn">
                    <Pencil size={16} />
                  </button>
                </>
              )}
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="bg-[#09090b] border border-zinc-800 p-4">
                <div className="text-xs font-bold uppercase tracking-[0.2em] text-zinc-500 mb-1 flex items-center gap-1"><CalendarBlank size={12} /> Premier contact</div>
                <div className="text-sm text-zinc-200 font-mono" data-testid="detail-first-contact">{formatDate(data.first_contact)}</div>
              </div>
              <div className="bg-[#09090b] border border-zinc-800 p-4">
                <div className="text-xs font-bold uppercase tracking-[0.2em] text-zinc-500 mb-1 flex items-center gap-1"><Clock size={12} /> Dernier contact</div>
                <div className="text-sm text-zinc-200 font-mono" data-testid="detail-last-contact">{formatDate(data.last_contact)}</div>
              </div>
              <div className="bg-[#09090b] border border-zinc-800 p-4">
                <div className="text-xs font-bold uppercase tracking-[0.2em] text-zinc-500 mb-1 flex items-center gap-1"><Hash size={12} /> Total contacts</div>
                <div className="text-2xl font-bold text-amber-500 font-mono" data-testid="detail-total-contacts">{data.total_contacts}</div>
              </div>
            </div>
          </div>

          {/* Add new contact button */}
          <Button onClick={() => setShowAddModal(true)} data-testid="add-contact-to-callsign-btn"
            className="w-full mb-4 bg-amber-500/10 hover:bg-amber-500/20 text-amber-500 border border-amber-500/30 font-bold uppercase tracking-wider rounded-none h-11 transition-all duration-200">
            <Plus size={16} className="mr-2" /> Ajouter un contact avec {data.callsign}
          </Button>

          {/* History */}
          <div className="bg-[#121212] border border-zinc-800/80">
            <div className="px-5 py-3 border-b border-zinc-800">
              <h3 className="font-display text-sm font-semibold tracking-tight uppercase text-zinc-400">Historique des contacts</h3>
            </div>
            <div className="divide-y divide-zinc-800/50">
              {sortedHistory.map((qso) => (
                <div key={qso.id} className="p-4 sm:px-5 hover:bg-[#1a1a1a] transition-colors" data-testid="history-entry">
                  {editingQsoId === qso.id ? (
                    /* Inline edit form */
                    <div className="space-y-3">
                      <div className="grid grid-cols-3 gap-3">
                        <div>
                          <span className="text-zinc-500 text-xs font-mono">Date</span>
                          <Input type="date" value={editQsoData.date} onChange={(e) => setEditQsoData({ ...editQsoData, date: e.target.value })}
                            className="bg-[#09090b] border-zinc-700 text-zinc-100 rounded-none font-mono text-sm h-8 mt-1" />
                        </div>
                        <div>
                          <span className="text-zinc-500 text-xs font-mono">Heure UTC</span>
                          <Input type="time" value={editQsoData.time_utc} onChange={(e) => setEditQsoData({ ...editQsoData, time_utc: e.target.value })}
                            className="bg-[#09090b] border-zinc-700 text-zinc-100 rounded-none font-mono text-sm h-8 mt-1" />
                        </div>
                        <div>
                          <span className="text-zinc-500 text-xs font-mono">Fréquence</span>
                          <Input type="number" step="0.001" value={editQsoData.frequency} onChange={(e) => setEditQsoData({ ...editQsoData, frequency: e.target.value })}
                            className="bg-[#09090b] border-zinc-700 text-zinc-100 rounded-none font-mono text-sm h-8 mt-1" />
                        </div>
                      </div>
                      <div>
                        <span className="text-zinc-500 text-xs font-mono">Mode</span>
                        <div className="flex flex-wrap gap-1 mt-1">
                          {MODES.map((m) => (
                            <button key={m} type="button" onClick={() => setEditQsoData({ ...editQsoData, mode: editQsoData.mode === m ? "" : m })}
                              className={`px-2 py-0.5 text-[10px] font-mono uppercase border transition-all ${editQsoData.mode === m ? "bg-amber-500 text-black border-amber-500" : "bg-[#09090b] text-zinc-400 border-zinc-700 hover:border-zinc-500"}`}>
                              {m}
                            </button>
                          ))}
                        </div>
                      </div>
                      <div>
                        <span className="text-zinc-500 text-xs font-mono">Commentaire</span>
                        <Input value={editQsoData.comment} onChange={(e) => setEditQsoData({ ...editQsoData, comment: e.target.value })}
                          placeholder="Optionnel" className="bg-[#09090b] border-zinc-700 text-zinc-100 rounded-none font-mono text-sm h-8 mt-1" />
                      </div>
                      <div className="flex gap-2">
                        <button onClick={() => saveEditQso(qso.id)} className="flex items-center gap-1 px-3 py-1.5 text-xs font-mono uppercase bg-amber-500 text-black font-bold" data-testid="save-qso-edit-btn">
                          <Check size={14} /> Enregistrer
                        </button>
                        <button onClick={() => setEditingQsoId(null)} className="flex items-center gap-1 px-3 py-1.5 text-xs font-mono uppercase text-zinc-400 border border-zinc-700">
                          Annuler
                        </button>
                      </div>
                    </div>
                  ) : (
                    /* Normal display */
                    <>
                      <div className="flex items-center justify-between mb-1">
                        <div className="flex-1 grid grid-cols-2 sm:grid-cols-4 gap-x-4 gap-y-1 font-mono text-sm">
                          <div>
                            <span className="text-zinc-500 text-xs">Date</span>
                            <div className="text-zinc-200">{formatDate(qso.date)}{qso.time_utc ? ` ${qso.time_utc} UTC` : ""}</div>
                          </div>
                          <div>
                            <span className="text-zinc-500 text-xs">Fréquence</span>
                            <div className="text-zinc-200">{qso.frequency.toFixed(3)} MHz{getBand(qso.frequency) ? ` (${getBand(qso.frequency)})` : ""}</div>
                          </div>
                          <div>
                            <span className="text-zinc-500 text-xs">Mode</span>
                            <div className="text-zinc-200">{qso.mode || "—"}</div>
                          </div>
                          <div>
                            <span className="text-zinc-500 text-xs">Nom</span>
                            <div className="text-zinc-300">{qso.name || "—"}</div>
                          </div>
                        </div>
                        <div className="flex flex-col gap-1 ml-2 shrink-0">
                          <button onClick={() => startEditQso(qso)} className="p-1.5 text-zinc-600 hover:text-amber-500 transition-colors" data-testid="edit-qso-btn">
                            <Pencil size={14} />
                          </button>
                          <button onClick={() => handleDelete(qso.id)} className="p-1.5 text-zinc-600 hover:text-red-500 transition-colors" data-testid="delete-history-entry-btn">
                            <Trash size={14} />
                          </button>
                        </div>
                      </div>
                      {qso.comment && (
                        <div className="mt-2 text-xs text-zinc-400 font-mono italic border-l-2 border-zinc-700 pl-3" data-testid="history-comment">
                          {qso.comment}
                        </div>
                      )}
                    </>
                  )}
                </div>
              ))}
            </div>
          </div>

          {showAddModal && (
            <AddQSOModal callsign={data.callsign} prefillName={data.name} onClose={() => setShowAddModal(false)} onAdded={fetchHistory} />
          )}
        </>
      )}}
    </div>
  );
}

// === Profile Page ===
function ProfilePage({ onBack }) {
  const { user } = useAuth();
  const [currentPwd, setCurrentPwd] = useState("");
  const [newPwd, setNewPwd] = useState("");
  const [confirmPwd, setConfirmPwd] = useState("");
  const [newEmail, setNewEmail] = useState("");
  const [emailPwd, setEmailPwd] = useState("");
  const [pwdLoading, setPwdLoading] = useState(false);
  const [emailLoading, setEmailLoading] = useState(false);

  const handleChangePwd = async (e) => {
    e.preventDefault();
    if (!currentPwd || !newPwd) { toast.error("Remplissez tous les champs"); return; }
    if (newPwd.length < 6) { toast.error("Min. 6 caractères"); return; }
    if (newPwd !== confirmPwd) { toast.error("Les mots de passe ne correspondent pas"); return; }
    setPwdLoading(true);
    try {
      await axios.put(`${API}/auth/change-password`, { current_password: currentPwd, new_password: newPwd });
      toast.success("Mot de passe modifié");
      setCurrentPwd(""); setNewPwd(""); setConfirmPwd("");
    } catch (err) { toast.error(formatApiError(err.response?.data?.detail)); }
    finally { setPwdLoading(false); }
  };

  const handleChangeEmail = async (e) => {
    e.preventDefault();
    if (!newEmail || !emailPwd) { toast.error("Remplissez tous les champs"); return; }
    setEmailLoading(true);
    try {
      const { data } = await axios.put(`${API}/auth/change-email`, { new_email: newEmail, password: emailPwd });
      toast.success(`Email modifié : ${data.email}`);
      setNewEmail(""); setEmailPwd("");
    } catch (err) { toast.error(formatApiError(err.response?.data?.detail)); }
    finally { setEmailLoading(false); }
  };

  return (
    <div data-testid="profile-page">
      <button onClick={onBack} className="flex items-center gap-2 text-zinc-400 hover:text-amber-500 transition-colors font-mono text-sm mb-6" data-testid="profile-back-btn">
        <ArrowLeft size={18} /> Retour
      </button>

      <h2 className="font-display text-2xl font-bold tracking-tight uppercase text-zinc-100 mb-2">Mon profil</h2>
      <p className="text-sm text-zinc-500 font-mono mb-6">{user?.callsign} — {user?.email}</p>

      {/* Change password */}
      <div className="bg-[#121212] border border-zinc-800/80 p-5 mb-4">
        <h3 className="font-display text-sm font-semibold tracking-tight uppercase text-zinc-400 mb-4">Changer le mot de passe</h3>
        <form onSubmit={handleChangePwd} className="space-y-3">
          <Input type="password" value={currentPwd} onChange={(e) => setCurrentPwd(e.target.value)} placeholder="Mot de passe actuel" data-testid="current-password-input"
            className="bg-[#09090b] border-zinc-700 text-zinc-100 rounded-none font-mono text-sm" />
          <Input type="password" value={newPwd} onChange={(e) => setNewPwd(e.target.value)} placeholder="Nouveau mot de passe" data-testid="new-password-profile-input"
            className="bg-[#09090b] border-zinc-700 text-zinc-100 rounded-none font-mono text-sm" />
          <Input type="password" value={confirmPwd} onChange={(e) => setConfirmPwd(e.target.value)} placeholder="Confirmer le nouveau" data-testid="confirm-password-profile-input"
            className="bg-[#09090b] border-zinc-700 text-zinc-100 rounded-none font-mono text-sm" />
          <Button type="submit" disabled={pwdLoading} data-testid="change-password-btn"
            className="w-full bg-amber-500 hover:bg-amber-600 text-black font-bold uppercase tracking-wider rounded-none h-10 text-xs">
            {pwdLoading ? "..." : "Modifier le mot de passe"}
          </Button>
        </form>
      </div>

      {/* Change email */}
      <div className="bg-[#121212] border border-zinc-800/80 p-5">
        <h3 className="font-display text-sm font-semibold tracking-tight uppercase text-zinc-400 mb-4">Changer l'email</h3>
        <form onSubmit={handleChangeEmail} className="space-y-3">
          <Input type="email" value={newEmail} onChange={(e) => setNewEmail(e.target.value)} placeholder="Nouvel email" data-testid="new-email-input"
            className="bg-[#09090b] border-zinc-700 text-zinc-100 rounded-none font-mono text-sm" />
          <Input type="password" value={emailPwd} onChange={(e) => setEmailPwd(e.target.value)} placeholder="Mot de passe (confirmation)" data-testid="email-password-input"
            className="bg-[#09090b] border-zinc-700 text-zinc-100 rounded-none font-mono text-sm" />
          <Button type="submit" disabled={emailLoading} data-testid="change-email-btn"
            className="w-full bg-amber-500 hover:bg-amber-600 text-black font-bold uppercase tracking-wider rounded-none h-10 text-xs">
            {emailLoading ? "..." : "Modifier l'email"}
          </Button>
        </form>
      </div>
    </div>
  );
}


// === Admin Panel ===
function AdminPanel({ onBack }) {
  const [users, setUsers] = useState([]);
  const [stats, setStats] = useState({ total_users: 0, total_qsos: 0 });
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedUser, setSelectedUser] = useState(null);
  const [userQsos, setUserQsos] = useState([]);
  const [loadingQsos, setLoadingQsos] = useState(false);

// regroupement des QSOs
const groupedContacts = Object.values(
  userQsos.reduce((acc, qso) => {
    if (!acc[qso.callsign]) {
      acc[qso.callsign] = {
        callsign: qso.callsign,
        name: qso.name,
        total_contacts: 0,
        first_contact: qso.date,
        last_contact: qso.date,
      };
    }

    acc[qso.callsign].total_contacts++;

    if (qso.date < acc[qso.callsign].first_contact) {
      acc[qso.callsign].first_contact = qso.date;
    }

    if (qso.date > acc[qso.callsign].last_contact) {
      acc[qso.callsign].last_contact = qso.date;
    }

    return acc;
  }, {})
);

  const fetchUsers = useCallback(async () => {
    try {
      const params = new URLSearchParams();
      if (searchTerm) params.append("search", searchTerm);
      const res = await axios.get(`${API}/admin/users?${params.toString()}`);
      setUsers(res.data);
    } catch { toast.error("Erreur chargement utilisateurs"); }
    finally { setLoading(false); }
  }, [searchTerm]);

  const fetchStats = useCallback(async () => {
    try {
      const res = await axios.get(`${API}/admin/stats`);
      setStats(res.data);
    } catch {}
  }, []);

  useEffect(() => { fetchUsers(); fetchStats(); }, [fetchUsers, fetchStats]);

  const viewUserQsos = async (u) => {
    setSelectedUser(u);
    setLoadingQsos(true);
    try {
      const res = await axios.get(`${API}/admin/users/${u.id}/qsos`);
      setUserQsos(res.data.qsos);
    } catch { toast.error("Erreur chargement QSOs"); }
    finally { setLoadingQsos(false); }
  };

  const deleteUser = async (u) => {
    if (!window.confirm(`Supprimer ${u.callsign} (${u.email}) et tous ses QSOs ?`)) return;
    try {
      await axios.delete(`${API}/admin/users/${u.id}`);
      toast.success(`${u.callsign} supprimé`);
      setSelectedUser(null);
      fetchUsers();
      fetchStats();
    } catch (err) { toast.error(formatApiError(err.response?.data?.detail)); }
  };

  const formatDate = (d) => {
    if (!d) return "—";
    return new Date(d).toLocaleDateString("fr-FR", { day: "2-digit", month: "2-digit", year: "numeric" });
  };

  return (
    <div data-testid="admin-panel">
      <button onClick={onBack} className="flex items-center gap-2 text-zinc-400 hover:text-amber-500 transition-colors font-mono text-sm mb-6" data-testid="admin-back-btn">
        <ArrowLeft size={18} /> Retour
      </button>

      <h2 className="font-display text-2xl font-bold tracking-tight uppercase text-zinc-100 mb-6">Administration</h2>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-3 mb-6">
        <div className="bg-[#121212] border border-zinc-800/80 p-4">
          <div className="text-xs font-bold uppercase tracking-[0.2em] text-zinc-500 mb-1">Utilisateurs</div>
          <div className="text-3xl font-bold text-amber-500 font-mono" data-testid="admin-total-users">{stats.total_users}</div>
        </div>
        <div className="bg-[#121212] border border-zinc-800/80 p-4">
          <div className="text-xs font-bold uppercase tracking-[0.2em] text-zinc-500 mb-1">Total QSOs</div>
          <div className="text-3xl font-bold text-amber-500 font-mono" data-testid="admin-total-qsos">{stats.total_qsos}</div>
        </div>
      </div>

      {selectedUser ? (
        <div data-testid="admin-user-detail">
          <button onClick={() => setSelectedUser(null)} className="flex items-center gap-2 text-zinc-400 hover:text-amber-500 transition-colors font-mono text-sm mb-4">
            <ArrowLeft size={16} /> Liste des utilisateurs
          </button>

          <div className="bg-[#121212] border border-zinc-800/80 p-5 mb-4">
            <div className="flex items-center justify-between mb-3">
              <div>
                <div className="text-xl font-bold text-amber-500 font-mono">{selectedUser.callsign}</div>
                <div className="text-sm text-zinc-400 font-mono">{selectedUser.email}</div>
                <div className="text-xs text-zinc-500 font-mono mt-1">Inscrit le {formatDate(selectedUser.created_at)}</div>
              </div>
              {selectedUser.role !== "admin" && (
                <button onClick={() => deleteUser(selectedUser)} data-testid="admin-delete-user-btn"
                  className="px-3 py-1.5 text-xs font-mono uppercase tracking-wider text-red-400 border border-red-500/30 hover:bg-red-500/10 transition-all">
                  <Trash size={14} className="inline mr-1" /> Supprimer
                </button>
              )}
            </div>
          </div>

          <div className="bg-[#121212] border border-zinc-800/80">
            <div className="px-5 py-3 border-b border-zinc-800">
              <h3 className="font-display text-sm font-semibold tracking-tight uppercase text-zinc-400">
                QSOs de {selectedUser.callsign} ({userQsos.length})
              </h3>
            </div>
            {loadingQsos ? (
              <div className="p-6 text-center">
                <div className="inline-block w-4 h-6 bg-amber-500 animate-pulse"></div>
              </div>
          ) : groupedContacts.length === 0 ? (
  <div className="p-6 text-center text-zinc-500 font-mono text-sm">Aucun contact</div>
) : (
  <div className="divide-y divide-zinc-800/50">
    {groupedContacts.map((contact) => (
      <button
        key={contact.callsign}
        onClick={() => viewAdminContactHistory(contact.callsign)}
        className="w-full text-left p-4 sm:px-5 hover:bg-[#1a1a1a] transition-colors font-mono text-sm"
      >
        <div className="flex items-center justify-between mb-1">
          <div className="flex items-center gap-3">
            <span className="font-bold text-amber-500">{contact.callsign}</span>
            <span className="text-zinc-400">{formatDate(contact.first_contact)}</span>
            <span className="text-zinc-500">→</span>
            <span className="text-zinc-400">{formatDate(contact.last_contact)}</span>
          </div>
          <span className="text-zinc-300">
            {contact.total_contacts} contact{contact.total_contacts > 1 ? "s" : ""}
          </span>
        </div>

        {contact.name && (
          <div className="text-xs text-zinc-500">{contact.name}</div>
        )}
      </button>
   ))}
</div>
)}
</div>
) : (
        <>
          {/* Search */}
          <div className="relative mb-4">
            <MagnifyingGlass className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" size={20} />
            <Input data-testid="admin-search-input" type="text" placeholder="Rechercher par indicatif ou email..."
              value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 bg-[#09090b] border-zinc-700 text-zinc-100 rounded-none font-mono text-sm h-12" />
          </div>

          {/* Users list */}
          <div className="bg-[#121212] border border-zinc-800/80 overflow-hidden">
            {loading ? (
              <div className="p-6 text-center">
                <div className="inline-block w-4 h-6 bg-amber-500 animate-pulse"></div>
              </div>
            ) : users.length === 0 ? (
              <div className="p-6 text-center text-zinc-500 font-mono text-sm">Aucun utilisateur trouvé</div>
            ) : (
              <div className="divide-y divide-zinc-800/50">
                {users.map((u) => (
                  <div key={u.id} className="p-4 sm:px-5 hover:bg-[#1a1a1a] transition-colors flex items-center justify-between" data-testid="admin-user-row">
                    <button onClick={() => viewUserQsos(u)} className="flex-1 text-left min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-bold text-amber-500 font-mono">{u.callsign}</span>
                        {u.role === "admin" && <span className="text-[10px] px-1.5 py-0.5 bg-amber-500/20 text-amber-500 font-mono uppercase">Admin</span>}
                      </div>
                      <div className="text-xs text-zinc-400 font-mono">{u.email}</div>
                      <div className="flex gap-3 text-xs text-zinc-500 font-mono mt-1">
                        <span>Inscrit : {formatDate(u.created_at)}</span>
                        <span>{u.qso_count} QSO{u.qso_count > 1 ? "s" : ""}</span>
                      </div>
                    </button>
                    <div className="flex items-center gap-2 shrink-0">
                      {u.role !== "admin" && (
                        <button onClick={() => deleteUser(u)} className="p-2 text-zinc-600 hover:text-red-500 transition-colors" data-testid="admin-delete-btn">
                          <Trash size={16} />
                        </button>
                      )}
                      <CaretRight size={18} className="text-zinc-600" />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </>
      )}
    </div>
  ) : (
    <>

// === Dashboard ===
    </>
</>
)}
</div>
  );
}
function Dashboard() {
  const { user, logout } = useAuth();
  const [grouped, setGrouped] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [stats, setStats] = useState({ total_qsos: 0, total_callsigns: 0 });
  const [selectedCallsign, setSelectedCallsign] = useState(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [addCallsign, setAddCallsign] = useState("");
  const [showAdmin, setShowAdmin] = useState(false);
  const [showProfile, setShowProfile] = useState(false);
  const [bandFilter, setBandFilter] = useState("");

  const fetchGrouped = useCallback(async () => {
    try {
      const params = new URLSearchParams();
      if (searchTerm) params.append("search", searchTerm);
      if (bandFilter) params.append("band", bandFilter);
      const res = await axios.get(`${API}/qso/grouped?${params.toString()}`);
     setGrouped(Array.isArray(res.data) ? res.data : []);
    } catch (error) {
      if (error.response?.status !== 401) toast.error("Erreur chargement");
    } finally { setLoading(false); }
  }, [searchTerm, bandFilter]);

  const fetchStats = useCallback(async () => {
    try {
      const res = await axios.get(`${API}/qso/stats/total`);
      setStats(res.data);
    } catch {}
  }, []);

  useEffect(() => { fetchGrouped(); fetchStats(); }, [fetchGrouped, fetchStats]);

  const formatDate = (d) => new Date(d).toLocaleDateString("fr-FR", { day: "2-digit", month: "2-digit", year: "numeric" });

  const handleLogout = async () => { await logout(); toast.success("Déconnexion réussie"); };

  const handleAddFromSearch = () => {
    setAddCallsign(searchTerm.toUpperCase());
    setShowAddModal(true);
  };

  const handleAdded = () => {
    fetchGrouped();
    fetchStats();
  };

  // Vérifier si la recherche correspond exactement à un indicatif existant
  console.log("grouped =", grouped);

const searchUpper = (searchTerm || "").toUpperCase().trim();

const exactMatch = Array.isArray(grouped)
  ? grouped.find(g => g.callsign === searchUpper)
  : null;

const showAddButton = (searchTerm || "").length >= 2 && !exactMatch;

  return (
    <div className="min-h-screen bg-[#09090b] relative">
      <div className="radio-bg"></div>
      <div className="relative z-10 max-w-[1100px] mx-auto p-3 sm:p-4 md:p-6 lg:p-8">
        {/* Header */}
        <header className="flex flex-col sm:flex-row justify-between items-start sm:items-center border-b border-zinc-800 pb-4 mb-6 gap-3" data-testid="app-header">
          <div className="flex items-center gap-2">
            <img src={LOGO_URL} alt="QSO Pocket" className="h-8 sm:h-10" />
          </div>
          <div className="flex items-center gap-2 sm:gap-3 w-full sm:w-auto justify-between sm:justify-end">
            <div className="font-mono text-xs sm:text-sm text-amber-500 tracking-wide" data-testid="user-callsign-display">
              Connecté en tant que <span className="font-bold">{user?.callsign}</span>
            </div>
            <div className="flex items-center gap-2">
              <button data-testid="profile-button" onClick={() => { setShowProfile(true); setShowAdmin(false); setSelectedCallsign(null); }}
                className="p-1.5 text-zinc-400 hover:text-amber-500 border border-zinc-700 hover:border-amber-500/30 transition-all duration-200">
                <Gear size={16} />
              </button>
              {user?.role === "admin" && (
                <button data-testid="admin-button" onClick={() => { setShowAdmin(true); setSelectedCallsign(null); }}
                  className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-mono uppercase tracking-wider text-amber-500 border border-amber-500/30 hover:bg-amber-500/10 transition-all duration-200">
                  Admin
                </button>
              )}
              <button data-testid="logout-button" onClick={handleLogout}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-mono uppercase tracking-wider text-zinc-400 hover:text-red-400 border border-zinc-700 hover:border-red-500/50 transition-all duration-200">
                <SignOut size={14} /> <span className="hidden sm:inline">Déconnexion</span>
              </button>
            </div>
          </div>
        </header>

        {/* Content routing */}
        {showProfile ? (
          <ProfilePage onBack={() => setShowProfile(false)} />
        ) : showAdmin && user?.role === "admin" ? (
          <AdminPanel onBack={() => setShowAdmin(false)} />
        ) : selectedCallsign ? (
          <ContactDetail callsign={selectedCallsign} onBack={() => { setSelectedCallsign(null); fetchGrouped(); fetchStats(); }} />
        ) : (
          <>
            {/* Stats row */}
            <div className="grid grid-cols-2 gap-3 sm:gap-4 mb-6">
              <div className="bg-[#121212] border border-zinc-800/80 p-4 sm:p-5" data-testid="qso-total-stats">
                <div className="text-xs font-bold uppercase tracking-[0.2em] text-zinc-500 mb-1">Indicatifs</div>
                <div className="text-3xl sm:text-4xl font-bold tracking-tighter text-amber-500 amber-glow font-mono">{stats.total_callsigns}</div>
              </div>
              <div className="bg-[#121212] border border-zinc-800/80 p-4 sm:p-5">
                <div className="text-xs font-bold uppercase tracking-[0.2em] text-zinc-500 mb-1">Total QSOs</div>
                <div className="text-3xl sm:text-4xl font-bold tracking-tighter text-amber-500 amber-glow font-mono">{stats.total_qsos}</div>
              </div>
            </div>

            {/* Search bar */}
            <div className="mb-4">
              <div className="relative">
                <MagnifyingGlass className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" size={20} />
                <Input data-testid="qso-search-input" type="text" placeholder="Rechercher un indicatif ou un nom..."
                  value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 bg-[#09090b] border-zinc-700 text-zinc-100 rounded-none font-mono text-sm h-12" />
              </div>

              {/* Add callsign button when not found */}
              {showAddButton && (
                <button onClick={handleAddFromSearch} data-testid="add-callsign-from-search-btn"
                  className="mt-3 w-full flex items-center justify-center gap-2 px-4 py-3 bg-amber-500/10 hover:bg-amber-500/20 text-amber-500 border border-amber-500/30 font-mono text-sm uppercase tracking-wider transition-all duration-200">
                  <Plus size={16} /> Ajouter l'indicatif {searchUpper}
                </button>
              )}

              {/* Band filter */}
              <div className="mt-3 flex flex-wrap gap-1.5" data-testid="band-filter">
                <button onClick={() => setBandFilter("")}
                  className={`px-2.5 py-1 text-[10px] font-mono uppercase tracking-wider border transition-all ${!bandFilter ? "bg-amber-500 text-black border-amber-500 font-bold" : "bg-[#09090b] text-zinc-400 border-zinc-700 hover:border-zinc-500"}`}>
                  Toutes
                </button>
                {BANDS.map((b) => (
                  <button key={b} onClick={() => setBandFilter(bandFilter === b ? "" : b)}
                    className={`px-2.5 py-1 text-[10px] font-mono uppercase tracking-wider border transition-all ${bandFilter === b ? "bg-amber-500 text-black border-amber-500 font-bold" : "bg-[#09090b] text-zinc-400 border-zinc-700 hover:border-zinc-500"}`}>
                    {b}
                  </button>
                ))}
              </div>
            </div>

            {/* Callsign list */}
            <div className="bg-[#121212] border border-zinc-800/80 overflow-hidden">
              {loading ? (
                <div className="p-8 text-center">
                  <div className="inline-block w-4 h-6 bg-amber-500 animate-pulse"></div>
                  <p className="mt-4 text-zinc-500 font-mono text-sm">Chargement...</p>
                </div>
              ) : grouped.length === 0 && !searchTerm ? (
                <div className="p-8 sm:p-12 text-center" data-testid="qso-empty-state">
                  <img src="https://static.prod-images.emergentagent.com/jobs/500d8642-2d5d-4297-bd34-3b17f0d02b71/images/0269ce3934d36a628e9a11a54b81dcc1d41264abf64f169ad8fe18dfcd38aa1b.png"
                    alt="Radio" className="w-20 h-20 sm:w-24 sm:h-24 mx-auto opacity-30 mb-4" />
                  <p className="text-zinc-500 font-mono text-sm">Aucun indicatif enregistré</p>
                  <p className="text-zinc-600 font-mono text-xs mt-1">Recherchez un indicatif pour l'ajouter</p>
                </div>
              ) : grouped.length === 0 && searchTerm ? (
                <div className="p-8 text-center" data-testid="qso-no-results">
                  <p className="text-zinc-500 font-mono text-sm">Aucun résultat pour "{searchTerm}"</p>
                </div>
              ) : (
                <div className="divide-y divide-zinc-800/50">
                  {grouped.map((entry) => {
                    const flagUrl = getFlagUrl(entry.callsign, 24);
                    const country = getCountryName(entry.callsign);
                    return (
                    <button key={entry.callsign} onClick={() => setSelectedCallsign(entry.callsign)}
                      className="w-full text-left p-4 sm:px-5 hover:bg-[#1a1a1a] transition-colors flex items-center justify-between group" data-testid="callsign-row">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 sm:gap-3 mb-1.5">
                          {flagUrl && <img src={flagUrl} alt={country} className="h-3.5 sm:h-4 shadow-sm shrink-0" data-testid="callsign-flag" />}
                          <span className="font-bold text-amber-500 font-mono text-base sm:text-lg">{entry.callsign}</span>
                          <span className="text-zinc-400 font-mono text-sm truncate">{entry.name}</span>
                        </div>
                        <div className="flex flex-col sm:flex-row sm:items-center gap-0.5 sm:gap-4 text-xs font-mono text-zinc-500">
                          <span>Premier contact : {formatDate(entry.first_contact)}</span>
                          <span>Dernier contact : {formatDate(entry.last_contact)}</span>
                          <span className="hidden sm:inline">{entry.total_contacts} contact{entry.total_contacts > 1 ? "s" : ""}</span>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <span className="text-xs text-zinc-600 font-mono">{entry.total_contacts}</span>
                        <CaretRight size={18} className="text-zinc-600 group-hover:text-amber-500 transition-colors" />
                      </div>
                    </button>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Export ADIF - en bas */}
            {stats.total_qsos > 0 && (
              <button onClick={() => {
                const link = document.createElement("a");
                const token = localStorage.getItem("qso_token");
                fetch(`${API}/qso/export/adif`, { credentials: "include", headers: token ? { Authorization: `Bearer ${token}` } : {} })
                  .then(r => r.blob())
                  .then(blob => { link.href = URL.createObjectURL(blob); link.download = "qso_log.adi"; link.click(); })
                  .catch(() => toast.error("Erreur export ADIF"));
              }} data-testid="export-adif-btn"
                className="w-full mt-6 mb-20 flex items-center justify-center gap-2 px-4 py-2.5 bg-[#121212] hover:bg-[#1a1a1a] text-zinc-300 border border-zinc-800 font-mono text-xs uppercase tracking-wider transition-all duration-200">
                <Export size={16} className="text-amber-500" /> Exporter en ADIF
              </button>
            )}

            {/* Floating add button (mobile) */}
            <button onClick={() => { setAddCallsign(""); setShowAddModal(true); }} data-testid="fab-add-qso"
              className="fixed bottom-6 right-6 w-14 h-14 bg-amber-500 hover:bg-amber-600 text-black flex items-center justify-center shadow-lg shadow-amber-500/20 transition-all duration-200 z-20">
              <Plus size={24} weight="bold" />
            </button>
          </>
        )}

        {/* Add QSO Modal */}
        {showAddModal && (
          <AddQSOModal callsign={addCallsign} onClose={() => setShowAddModal(false)} onAdded={handleAdded} />
        )}
      </div>
    </div>
  );
}

// === App Root ===
function App() {
  return (
    <AuthProvider>
      <Toaster position="top-right" theme="dark" toastOptions={{ style: { background: "#121212", border: "1px solid #27272a", color: "#FAFAFA" } }} />
      <AppContent />
    </AuthProvider>
  );
}

function AppContent() {
  const { user, checking } = useAuth();
  const [authMode, setAuthMode] = useState("login");

  // Check for reset token in URL
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get("token") && window.location.pathname === "/reset-password") {
      setAuthMode("reset");
    }
  }, []);

  if (checking) {
    return (
      <div className="min-h-screen bg-[#09090b] flex items-center justify-center">
        <div className="radio-bg"></div>
        <div className="relative z-10 text-center">
          <div className="inline-block w-4 h-6 bg-amber-500 animate-pulse"></div>
          <p className="mt-4 text-zinc-500 font-mono text-sm">Chargement...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    if (authMode === "forgot") {
      return <ForgotPasswordPage onBack={() => setAuthMode("login")} />;
    }
    if (authMode === "reset") {
      const params = new URLSearchParams(window.location.search);
      const token = params.get("token") || "";
      return <ResetPasswordPage token={token} onDone={() => { window.history.replaceState({}, "", "/"); setAuthMode("login"); }} />;
    }
    if (authMode === "register") {
      return <RegisterPage onSwitch={() => setAuthMode("login")} />;
    }
    return <LoginPage onSwitch={() => setAuthMode("register")} onForgot={() => setAuthMode("forgot")} />;
  }

  return <Dashboard />;
}

export default App;
