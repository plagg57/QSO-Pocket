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
  Export
} from "@phosphor-icons/react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { getFlagUrl, getCountryName } from "@/utils/callsignFlags";
import { getBand } from "@/utils/bands";

const MODES = ["FM", "SSB", "CW", "FT8", "FT4", "DMR", "C4FM", "D-STAR", "AM", "RTTY", "PSK31", "SSTV"];

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
function LoginPage({ onSwitch }) {
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
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-3 mb-4">
            <div className="w-3 h-3 rounded-full bg-amber-500 animate-pulse"></div>
            <h1 className="font-display text-4xl sm:text-5xl font-bold tracking-tight uppercase text-zinc-100">QSO POCKET</h1>
          </div>
          <p className="text-zinc-500 font-mono text-sm uppercase tracking-widest">Carnet de Trafic</p>
        </div>
        <div className="bg-[#121212] border border-zinc-800/80 p-6 sm:p-8" data-testid="login-form">
          <h2 className="font-display text-2xl font-semibold tracking-tight uppercase text-zinc-100 mb-6 flex items-center gap-2">
            <SignIn size={24} className="text-amber-500" /> Connexion
          </h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label className="text-xs font-bold uppercase tracking-[0.2em] text-zinc-500 flex items-center gap-2"><Envelope size={14} /> Email ou indicatif</Label>
              <Input data-testid="login-email-input" type="text" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="votre@email.com ou F4MVD" className="bg-[#09090b] border-zinc-700 text-zinc-100 rounded-none font-mono text-sm" />
            </div>
            <div className="space-y-2">
              <Label className="text-xs font-bold uppercase tracking-[0.2em] text-zinc-500 flex items-center gap-2"><Lock size={14} /> Mot de passe</Label>
              <Input data-testid="login-password-input" type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="********" className="bg-[#09090b] border-zinc-700 text-zinc-100 rounded-none font-mono text-sm" />
            </div>
            <Button data-testid="login-submit-button" type="submit" disabled={loading} className="w-full bg-amber-500 hover:bg-amber-600 text-black font-bold uppercase tracking-wider rounded-none h-12 transition-all duration-200 shadow-[0_0_15px_rgba(245,158,11,0.15)] hover:shadow-[0_0_20px_rgba(245,158,11,0.3)]">
              {loading ? "Connexion..." : "Se connecter"}
            </Button>
          </form>
          <div className="mt-6 text-center">
            <button data-testid="switch-to-register" onClick={onSwitch} className="text-sm text-zinc-500 hover:text-amber-500 font-mono transition-colors">
              Pas de compte ? <span className="text-amber-500 underline">S'inscrire</span>
            </button>
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
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-3 mb-4">
            <div className="w-3 h-3 rounded-full bg-amber-500 animate-pulse"></div>
            <h1 className="font-display text-4xl sm:text-5xl font-bold tracking-tight uppercase text-zinc-100">QSO POCKET</h1>
          </div>
          <p className="text-zinc-500 font-mono text-sm uppercase tracking-widest">Carnet de Trafic</p>
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

// === Add QSO Modal ===
function AddQSOModal({ callsign, prefillName, onClose, onAdded }) {
  const [formData, setFormData] = useState({
    callsign: callsign || "",
    date: new Date().toISOString().split("T")[0],
    frequency: "",
    mode: "",
    name: prefillName || "",
    comment: "",
  });

  useEffect(() => {
    const handleEscape = (e) => { if (e.key === "Escape") onClose(); };
    document.addEventListener("keydown", handleEscape);
    return () => document.removeEventListener("keydown", handleEscape);
  }, [onClose]);

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
          </div>
          <div className="space-y-2">
            <Label className="text-xs font-bold uppercase tracking-[0.2em] text-zinc-500 flex items-center gap-2"><CalendarBlank size={14} /> Date</Label>
            <Input data-testid="qso-date-input" type="date" value={formData.date} onChange={(e) => setFormData({ ...formData, date: e.target.value })}
              className="bg-[#09090b] border-zinc-700 text-zinc-100 rounded-none font-mono text-sm" />
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
      fetchHistory();
    } catch { toast.error("Erreur suppression"); }
  };

  const [editingName, setEditingName] = useState(false);
  const [nameValue, setNameValue] = useState("");
  const [editingModeId, setEditingModeId] = useState(null);

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

  const formatDate = (d) => new Date(d).toLocaleDateString("fr-FR", { day: "2-digit", month: "2-digit", year: "numeric" });

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
              {data.history.map((qso) => (
                <div key={qso.id} className="p-4 sm:px-5 hover:bg-[#1a1a1a] transition-colors" data-testid="history-entry">
                  <div className="flex items-center justify-between mb-1">
                    <div className="flex-1 grid grid-cols-2 sm:grid-cols-4 gap-x-4 gap-y-1 font-mono text-sm">
                      <div>
                        <span className="text-zinc-500 text-xs">Date</span>
                        <div className="text-zinc-200">{formatDate(qso.date)}</div>
                      </div>
                      <div>
                        <span className="text-zinc-500 text-xs">Fréquence</span>
                        <div className="text-zinc-200">{qso.frequency.toFixed(3)} MHz{getBand(qso.frequency) ? ` (${getBand(qso.frequency)})` : ""}</div>
                      </div>
                      <div>
                        <span className="text-zinc-500 text-xs">Mode</span>
                        {editingModeId === qso.id ? (
                          <div className="flex flex-wrap gap-1 mt-1">
                            {MODES.map((m) => (
                              <button key={m} type="button" onClick={() => updateQsoMode(qso.id, m)}
                                className={`px-2 py-0.5 text-[10px] font-mono uppercase border transition-all ${qso.mode === m ? "bg-amber-500 text-black border-amber-500" : "bg-[#09090b] text-zinc-400 border-zinc-700 hover:border-zinc-500"}`}>
                                {m}
                              </button>
                            ))}
                            <button onClick={() => setEditingModeId(null)} className="px-2 py-0.5 text-[10px] text-zinc-500 hover:text-zinc-300"><X size={12} /></button>
                          </div>
                        ) : (
                          <div className="text-zinc-200 cursor-pointer hover:text-amber-500 transition-colors" onClick={() => setEditingModeId(qso.id)} data-testid="edit-mode-btn">
                            {qso.mode || "—"} <Pencil size={10} className="inline ml-1 opacity-50" />
                          </div>
                        )}
                      </div>
                      <div>
                        <span className="text-zinc-500 text-xs">Nom</span>
                        <div className="text-zinc-300">{qso.name || "—"}</div>
                      </div>
                    </div>
                    <button onClick={() => handleDelete(qso.id)} className="ml-3 p-2 text-zinc-600 hover:text-red-500 transition-colors shrink-0" data-testid="delete-history-entry-btn">
                      <Trash size={16} />
                    </button>
                  </div>
                  {qso.comment && (
                    <div className="mt-2 text-xs text-zinc-400 font-mono italic border-l-2 border-zinc-700 pl-3" data-testid="history-comment">
                      {qso.comment}
                    </div>
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

// === Dashboard ===
function Dashboard() {
  const { user, logout } = useAuth();
  const [grouped, setGrouped] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [stats, setStats] = useState({ total_qsos: 0, total_callsigns: 0 });
  const [selectedCallsign, setSelectedCallsign] = useState(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [addCallsign, setAddCallsign] = useState("");

  const fetchGrouped = useCallback(async () => {
    try {
      const params = new URLSearchParams();
      if (searchTerm) params.append("search", searchTerm);
      const res = await axios.get(`${API}/qso/grouped?${params.toString()}`);
      setGrouped(res.data);
    } catch (error) {
      if (error.response?.status !== 401) toast.error("Erreur chargement");
    } finally { setLoading(false); }
  }, [searchTerm]);

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
  const searchUpper = searchTerm.toUpperCase().trim();
  const exactMatch = grouped.find(g => g.callsign === searchUpper);
  const showAddButton = searchTerm.length >= 2 && !exactMatch;

  return (
    <div className="min-h-screen bg-[#09090b] relative">
      <div className="radio-bg"></div>
      <div className="relative z-10 max-w-[1100px] mx-auto p-3 sm:p-4 md:p-6 lg:p-8">
        {/* Header */}
        <header className="flex flex-col sm:flex-row justify-between items-start sm:items-center border-b border-zinc-800 pb-4 mb-6 gap-3" data-testid="app-header">
          <div className="flex items-center gap-3">
            <div className="w-3 h-3 rounded-full bg-amber-500 animate-pulse shrink-0"></div>
            <h1 className="font-display text-2xl sm:text-3xl lg:text-4xl font-bold tracking-tight uppercase text-zinc-100">QSO POCKET</h1>
          </div>
          <div className="flex items-center gap-3 sm:gap-4 w-full sm:w-auto justify-between sm:justify-end">
            <div className="font-mono text-xs sm:text-sm text-amber-500 tracking-wide" data-testid="user-callsign-display">
              Connecté en tant que <span className="font-bold">{user?.callsign}</span>
            </div>
            <button data-testid="logout-button" onClick={handleLogout}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-mono uppercase tracking-wider text-zinc-400 hover:text-red-400 border border-zinc-700 hover:border-red-500/50 transition-all duration-200">
              <SignOut size={14} /> <span className="hidden sm:inline">Déconnexion</span>
            </button>
          </div>
        </header>

        {/* If viewing detail */}
        {selectedCallsign ? (
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

            {/* Export ADIF */}
            {stats.total_qsos > 0 && (
              <button onClick={() => {
                const link = document.createElement("a");
                const token = localStorage.getItem("qso_token");
                fetch(`${API}/qso/export/adif`, { credentials: "include", headers: token ? { Authorization: `Bearer ${token}` } : {} })
                  .then(r => r.blob())
                  .then(blob => { link.href = URL.createObjectURL(blob); link.download = "qso_log.adi"; link.click(); })
                  .catch(() => toast.error("Erreur export ADIF"));
              }} data-testid="export-adif-btn"
                className="w-full mb-6 flex items-center justify-center gap-2 px-4 py-2.5 bg-[#121212] hover:bg-[#1a1a1a] text-zinc-300 border border-zinc-800 font-mono text-xs uppercase tracking-wider transition-all duration-200">
                <Export size={16} className="text-amber-500" /> Exporter en ADIF
              </button>
            )}

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
    return authMode === "login"
      ? <LoginPage onSwitch={() => setAuthMode("register")} />
      : <RegisterPage onSwitch={() => setAuthMode("login")} />;
  }

  return <Dashboard />;
}

export default App;
