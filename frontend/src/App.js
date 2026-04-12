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
  Check,
  SignOut,
  Envelope,
  Lock,
  UserPlus,
  SignIn
} from "@phosphor-icons/react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

// Axios defaults for cookies
axios.defaults.withCredentials = true;

// === Auth Context ===
const AuthContext = createContext(null);

function useAuth() {
  return useContext(AuthContext);
}

function formatApiError(detail) {
  if (detail == null) return "Une erreur est survenue";
  if (typeof detail === "string") return detail;
  if (Array.isArray(detail))
    return detail.map((e) => (e && typeof e.msg === "string" ? e.msg : JSON.stringify(e))).filter(Boolean).join(" ");
  if (detail && typeof detail.msg === "string") return detail.msg;
  return String(detail);
}

function AuthProvider({ children }) {
  const [user, setUser] = useState(null); // null = checking, false = not auth
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    axios.get(`${API}/auth/me`)
      .then(res => { setUser(res.data); setChecking(false); })
      .catch(() => { setUser(false); setChecking(false); });
  }, []);

  const login = async (email, password) => {
    const { data } = await axios.post(`${API}/auth/login`, { email, password });
    setUser(data);
    return data;
  };

  const register = async (email, password, callsign) => {
    const { data } = await axios.post(`${API}/auth/register`, { email, password, callsign });
    setUser(data);
    return data;
  };

  const logout = async () => {
    await axios.post(`${API}/auth/logout`);
    setUser(false);
  };

  return (
    <AuthContext.Provider value={{ user, checking, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
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
    try {
      await login(email, password);
      toast.success("Connexion réussie");
    } catch (err) {
      toast.error(formatApiError(err.response?.data?.detail));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#09090b] flex items-center justify-center p-4 relative">
      <div className="radio-bg"></div>
      <div className="relative z-10 w-full max-w-md">
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-3 mb-4">
            <div className="w-3 h-3 rounded-full bg-amber-500 animate-pulse"></div>
            <h1 className="font-display text-4xl sm:text-5xl font-bold tracking-tight uppercase text-zinc-100">
              QSO LOG
            </h1>
          </div>
          <p className="text-zinc-500 font-mono text-sm uppercase tracking-widest">Carnet de Trafic</p>
        </div>

        <div className="bg-[#121212] border border-zinc-800/80 p-6 sm:p-8" data-testid="login-form">
          <h2 className="font-display text-2xl font-semibold tracking-tight uppercase text-zinc-100 mb-6 flex items-center gap-2">
            <SignIn size={24} className="text-amber-500" />
            Connexion
          </h2>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label className="text-xs font-bold uppercase tracking-[0.2em] text-zinc-500 flex items-center gap-2">
                <Envelope size={14} /> Email
              </Label>
              <Input
                data-testid="login-email-input"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="votre@email.com"
                className="bg-[#09090b] border-zinc-700 text-zinc-100 rounded-none font-mono text-sm"
              />
            </div>

            <div className="space-y-2">
              <Label className="text-xs font-bold uppercase tracking-[0.2em] text-zinc-500 flex items-center gap-2">
                <Lock size={14} /> Mot de passe
              </Label>
              <Input
                data-testid="login-password-input"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="********"
                className="bg-[#09090b] border-zinc-700 text-zinc-100 rounded-none font-mono text-sm"
              />
            </div>

            <Button
              data-testid="login-submit-button"
              type="submit"
              disabled={loading}
              className="w-full bg-amber-500 hover:bg-amber-600 text-black font-bold uppercase tracking-wider rounded-none h-12 transition-all duration-200 shadow-[0_0_15px_rgba(245,158,11,0.15)] hover:shadow-[0_0_20px_rgba(245,158,11,0.3)]"
            >
              {loading ? "Connexion..." : "Se connecter"}
            </Button>
          </form>

          <div className="mt-6 text-center">
            <button
              data-testid="switch-to-register"
              onClick={onSwitch}
              className="text-sm text-zinc-500 hover:text-amber-500 font-mono transition-colors"
            >
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
    try {
      await register(email, password, callsign);
      toast.success("Inscription réussie");
    } catch (err) {
      toast.error(formatApiError(err.response?.data?.detail));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#09090b] flex items-center justify-center p-4 relative">
      <div className="radio-bg"></div>
      <div className="relative z-10 w-full max-w-md">
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-3 mb-4">
            <div className="w-3 h-3 rounded-full bg-amber-500 animate-pulse"></div>
            <h1 className="font-display text-4xl sm:text-5xl font-bold tracking-tight uppercase text-zinc-100">
              QSO LOG
            </h1>
          </div>
          <p className="text-zinc-500 font-mono text-sm uppercase tracking-widest">Carnet de Trafic</p>
        </div>

        <div className="bg-[#121212] border border-zinc-800/80 p-6 sm:p-8" data-testid="register-form">
          <h2 className="font-display text-2xl font-semibold tracking-tight uppercase text-zinc-100 mb-6 flex items-center gap-2">
            <UserPlus size={24} className="text-amber-500" />
            Inscription
          </h2>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label className="text-xs font-bold uppercase tracking-[0.2em] text-zinc-500 flex items-center gap-2">
                <IdentificationCard size={14} /> Indicatif Radio
              </Label>
              <Input
                data-testid="register-callsign-input"
                type="text"
                value={callsign}
                onChange={(e) => setCallsign(e.target.value.toUpperCase())}
                placeholder="F4MVD"
                className="bg-[#09090b] border-zinc-700 text-zinc-100 rounded-none font-mono text-sm uppercase"
              />
              <p className="text-xs text-zinc-600 font-mono">Votre indicatif unique (ex: F4MVD)</p>
            </div>

            <div className="space-y-2">
              <Label className="text-xs font-bold uppercase tracking-[0.2em] text-zinc-500 flex items-center gap-2">
                <Envelope size={14} /> Email
              </Label>
              <Input
                data-testid="register-email-input"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="votre@email.com"
                className="bg-[#09090b] border-zinc-700 text-zinc-100 rounded-none font-mono text-sm"
              />
            </div>

            <div className="space-y-2">
              <Label className="text-xs font-bold uppercase tracking-[0.2em] text-zinc-500 flex items-center gap-2">
                <Lock size={14} /> Mot de passe
              </Label>
              <Input
                data-testid="register-password-input"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Min. 6 caractères"
                className="bg-[#09090b] border-zinc-700 text-zinc-100 rounded-none font-mono text-sm"
              />
            </div>

            <Button
              data-testid="register-submit-button"
              type="submit"
              disabled={loading}
              className="w-full bg-amber-500 hover:bg-amber-600 text-black font-bold uppercase tracking-wider rounded-none h-12 transition-all duration-200 shadow-[0_0_15px_rgba(245,158,11,0.15)] hover:shadow-[0_0_20px_rgba(245,158,11,0.3)]"
            >
              {loading ? "Inscription..." : "S'inscrire"}
            </Button>
          </form>

          <div className="mt-6 text-center">
            <button
              data-testid="switch-to-login"
              onClick={onSwitch}
              className="text-sm text-zinc-500 hover:text-amber-500 font-mono transition-colors"
            >
              Déjà un compte ? <span className="text-amber-500 underline">Se connecter</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// === Dashboard (QSO Log) ===
function Dashboard() {
  const { user, logout } = useAuth();
  const [qsos, setQsos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [stats, setStats] = useState({ total: 0 });
  const [editingId, setEditingId] = useState(null);
  const [mobileFormOpen, setMobileFormOpen] = useState(false);

  const [formData, setFormData] = useState({
    callsign: "",
    date: new Date().toISOString().split("T")[0],
    frequency: "",
    name: "",
  });

  const [editFormData, setEditFormData] = useState({
    callsign: "", date: "", frequency: "", name: "",
  });

  const fetchQsos = useCallback(async () => {
    try {
      const params = new URLSearchParams();
      if (searchTerm) params.append("search", searchTerm);
      const response = await axios.get(`${API}/qso?${params.toString()}`);
      setQsos(response.data);
    } catch (error) {
      if (error.response?.status !== 401) toast.error("Erreur lors du chargement");
    } finally {
      setLoading(false);
    }
  }, [searchTerm]);

  const fetchStats = useCallback(async () => {
    try {
      const response = await axios.get(`${API}/qso/stats/total`);
      setStats(response.data);
    } catch {}
  }, []);

  useEffect(() => {
    fetchQsos();
    fetchStats();
  }, [fetchQsos, fetchStats]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.callsign || !formData.date || !formData.frequency || !formData.name) {
      toast.error("Veuillez remplir tous les champs");
      return;
    }
    try {
      await axios.post(`${API}/qso`, {
        ...formData,
        callsign: formData.callsign.toUpperCase(),
        frequency: parseFloat(formData.frequency),
      });
      toast.success("QSO enregistré");
      setFormData({ callsign: "", date: new Date().toISOString().split("T")[0], frequency: "", name: "" });
      fetchQsos();
      fetchStats();
      setMobileFormOpen(false);
    } catch (error) {
      const msg = error.response?.status === 409
        ? "Ce QSO existe déjà (même indicatif et date)"
        : "Erreur lors de l'ajout";
      toast.error(msg);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Supprimer ce QSO ?")) return;
    try {
      await axios.delete(`${API}/qso/${id}`);
      toast.success("QSO supprimé");
      fetchQsos();
      fetchStats();
    } catch {
      toast.error("Erreur lors de la suppression");
    }
  };

  const startEdit = (qso) => {
    setEditingId(qso.id);
    setEditFormData({
      callsign: qso.callsign,
      date: qso.date,
      frequency: qso.frequency.toString(),
      name: qso.name,
    });
  };

  const cancelEdit = () => { setEditingId(null); };

  const saveEdit = async (id) => {
    try {
      await axios.put(`${API}/qso/${id}`, {
        ...editFormData,
        callsign: editFormData.callsign.toUpperCase(),
        frequency: parseFloat(editFormData.frequency),
      });
      toast.success("QSO modifié");
      setEditingId(null);
      fetchQsos();
    } catch {
      toast.error("Erreur lors de la modification");
    }
  };

  const formatDate = (dateStr) => {
    const d = new Date(dateStr);
    return d.toLocaleDateString("fr-FR", { day: "2-digit", month: "2-digit", year: "numeric" });
  };

  const handleLogout = async () => {
    await logout();
    toast.success("Déconnexion réussie");
  };

  return (
    <div className="min-h-screen bg-[#09090b] relative">
      <div className="radio-bg"></div>
      <div className="relative z-10 max-w-[1600px] mx-auto p-3 sm:p-4 md:p-6 lg:p-8">
        {/* Header */}
        <header className="flex flex-col sm:flex-row justify-between items-start sm:items-center border-b border-zinc-800 pb-4 mb-6 gap-3" data-testid="app-header">
          <div className="flex items-center gap-3">
            <div className="w-3 h-3 rounded-full bg-amber-500 animate-pulse shrink-0"></div>
            <h1 className="font-display text-2xl sm:text-3xl lg:text-4xl font-bold tracking-tight uppercase text-zinc-100">
              QSO LOG
            </h1>
          </div>
          <div className="flex items-center gap-3 sm:gap-4 w-full sm:w-auto justify-between sm:justify-end">
            <div className="font-mono text-xs sm:text-sm text-amber-500 tracking-wide" data-testid="user-callsign-display">
              Connecté en tant que <span className="font-bold">{user?.callsign}</span>
            </div>
            <button
              data-testid="logout-button"
              onClick={handleLogout}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-mono uppercase tracking-wider text-zinc-400 hover:text-red-400 border border-zinc-700 hover:border-red-500/50 transition-all duration-200"
            >
              <SignOut size={14} />
              <span className="hidden sm:inline">Déconnexion</span>
            </button>
          </div>
        </header>

        {/* Mobile: Add QSO button */}
        <div className="lg:hidden mb-4">
          <Button
            data-testid="mobile-add-qso-btn"
            onClick={() => setMobileFormOpen(!mobileFormOpen)}
            className="w-full bg-amber-500 hover:bg-amber-600 text-black font-bold uppercase tracking-wider rounded-none h-12"
          >
            <Plus size={18} className="mr-2" />
            {mobileFormOpen ? "Fermer le formulaire" : "Nouveau QSO"}
          </Button>
        </div>

        {/* Mobile: Inline form */}
        {mobileFormOpen && (
          <div className="lg:hidden mb-6 bg-[#121212] border border-zinc-800/80 p-4" data-testid="mobile-qso-form">
            <QSOForm formData={formData} setFormData={setFormData} handleSubmit={handleSubmit} />
          </div>
        )}

        {/* Main Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 sm:gap-6">
          {/* Main Content */}
          <main className="col-span-12 lg:col-span-8 flex flex-col gap-4 sm:gap-6 order-2 lg:order-1">
            {/* Search */}
            <div className="relative">
              <MagnifyingGlass className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" size={20} />
              <Input
                data-testid="qso-search-input"
                type="text"
                placeholder="Rechercher par indicatif ou nom..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 bg-[#09090b] border-zinc-700 text-zinc-100 rounded-none font-mono text-sm h-11 sm:h-12"
              />
            </div>

            {/* QSO Table */}
            <div className="bg-[#121212] border border-zinc-800/80 overflow-hidden">
              {loading ? (
                <div className="p-8 text-center">
                  <div className="inline-block w-4 h-6 bg-amber-500 animate-pulse"></div>
                  <p className="mt-4 text-zinc-500 font-mono text-sm">Chargement...</p>
                </div>
              ) : qsos.length === 0 ? (
                <div className="p-8 sm:p-12 text-center" data-testid="qso-empty-state">
                  <img
                    src="https://static.prod-images.emergentagent.com/jobs/500d8642-2d5d-4297-bd34-3b17f0d02b71/images/0269ce3934d36a628e9a11a54b81dcc1d41264abf64f169ad8fe18dfcd38aa1b.png"
                    alt="Radio"
                    className="w-20 h-20 sm:w-24 sm:h-24 mx-auto opacity-30 mb-4"
                  />
                  <p className="text-zinc-500 font-mono text-sm">Aucun QSO enregistré</p>
                  <p className="text-zinc-600 font-mono text-xs mt-1">Ajoutez votre premier contact</p>
                </div>
              ) : (
                <>
                  {/* Desktop table */}
                  <div className="hidden sm:block overflow-x-auto">
                    <table className="qso-table w-full">
                      <thead>
                        <tr>
                          <th>Indicatif</th>
                          <th>Date</th>
                          <th className="text-right">Fréquence</th>
                          <th>Nom</th>
                          <th className="w-24">Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {qsos.map((qso) => (
                          <tr key={qso.id} data-testid="qso-table-row">
                            {editingId === qso.id ? (
                              <>
                                <td>
                                  <Input value={editFormData.callsign} onChange={(e) => setEditFormData({ ...editFormData, callsign: e.target.value.toUpperCase() })} className="bg-[#09090b] border-zinc-700 text-zinc-100 rounded-none font-mono text-sm h-8 w-28" />
                                </td>
                                <td>
                                  <Input type="date" value={editFormData.date} onChange={(e) => setEditFormData({ ...editFormData, date: e.target.value })} className="bg-[#09090b] border-zinc-700 text-zinc-100 rounded-none font-mono text-sm h-8 w-32" />
                                </td>
                                <td className="text-right">
                                  <Input type="number" step="0.001" value={editFormData.frequency} onChange={(e) => setEditFormData({ ...editFormData, frequency: e.target.value })} className="bg-[#09090b] border-zinc-700 text-zinc-100 rounded-none font-mono text-sm h-8 w-24 text-right" />
                                </td>
                                <td>
                                  <Input value={editFormData.name} onChange={(e) => setEditFormData({ ...editFormData, name: e.target.value })} className="bg-[#09090b] border-zinc-700 text-zinc-100 rounded-none font-mono text-sm h-8 w-28" />
                                </td>
                                <td>
                                  <div className="flex gap-1">
                                    <button onClick={() => saveEdit(qso.id)} className="p-1.5 text-green-500 hover:text-green-400 transition-colors" data-testid="qso-save-edit-btn"><Check size={16} /></button>
                                    <button onClick={cancelEdit} className="p-1.5 text-zinc-500 hover:text-zinc-300 transition-colors" data-testid="qso-cancel-edit-btn"><X size={16} /></button>
                                  </div>
                                </td>
                              </>
                            ) : (
                              <>
                                <td className="font-bold text-amber-500">{qso.callsign}</td>
                                <td className="text-zinc-400">{formatDate(qso.date)}</td>
                                <td className="text-right text-zinc-200 tabular-nums">{qso.frequency.toFixed(3)} MHz</td>
                                <td className="text-zinc-300">{qso.name}</td>
                                <td>
                                  <div className="flex gap-1">
                                    <button onClick={() => startEdit(qso)} className="p-1.5 text-zinc-500 hover:text-amber-500 transition-colors" data-testid="qso-edit-btn"><Pencil size={16} /></button>
                                    <button onClick={() => handleDelete(qso.id)} className="p-1.5 text-zinc-500 hover:text-red-500 transition-colors" data-testid="qso-delete-btn"><Trash size={16} /></button>
                                  </div>
                                </td>
                              </>
                            )}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  {/* Mobile cards */}
                  <div className="sm:hidden divide-y divide-zinc-800/50">
                    {qsos.map((qso) => (
                      <div key={qso.id} className="p-4 hover:bg-[#1a1a1a] transition-colors" data-testid="qso-mobile-card">
                        <div className="flex justify-between items-start mb-2">
                          <span className="font-bold text-amber-500 font-mono text-base">{qso.callsign}</span>
                          <div className="flex gap-2">
                            <button onClick={() => startEdit(qso)} className="p-1 text-zinc-500 hover:text-amber-500" data-testid="qso-edit-btn-mobile"><Pencil size={16} /></button>
                            <button onClick={() => handleDelete(qso.id)} className="p-1 text-zinc-500 hover:text-red-500" data-testid="qso-delete-btn-mobile"><Trash size={16} /></button>
                          </div>
                        </div>
                        <div className="grid grid-cols-2 gap-1 text-xs font-mono">
                          <div className="text-zinc-500">Date</div>
                          <div className="text-zinc-300">{formatDate(qso.date)}</div>
                          <div className="text-zinc-500">Fréquence</div>
                          <div className="text-zinc-200">{qso.frequency.toFixed(3)} MHz</div>
                          <div className="text-zinc-500">Nom</div>
                          <div className="text-zinc-300">{qso.name}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </>
              )}
            </div>
          </main>

          {/* Sidebar */}
          <aside className="col-span-12 lg:col-span-4 flex flex-col gap-4 sm:gap-6 order-1 lg:order-2">
            {/* Stats */}
            <div className="bg-[#121212] border border-zinc-800/80 p-4 sm:p-6" data-testid="qso-total-stats">
              <div className="text-xs font-bold uppercase tracking-[0.2em] text-zinc-500 mb-2">Total QSOs</div>
              <div className="text-4xl sm:text-5xl font-bold tracking-tighter text-amber-500 amber-glow font-mono">{stats.total}</div>
            </div>

            {/* Desktop form */}
            <div className="hidden lg:block bg-[#121212] border border-zinc-800/80 p-6" data-testid="qso-add-form">
              <h2 className="font-display text-xl font-semibold tracking-tight uppercase text-zinc-100 mb-6 flex items-center gap-2">
                <Plus size={20} className="text-amber-500" />
                Nouveau QSO
              </h2>
              <QSOForm formData={formData} setFormData={setFormData} handleSubmit={handleSubmit} />
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
}

// === QSO Form Component ===
function QSOForm({ formData, setFormData, handleSubmit }) {
  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label className="text-xs font-bold uppercase tracking-[0.2em] text-zinc-500 flex items-center gap-2">
          <IdentificationCard size={14} /> Indicatif
        </Label>
        <Input
          data-testid="qso-callsign-input"
          type="text"
          value={formData.callsign}
          onChange={(e) => setFormData({ ...formData, callsign: e.target.value.toUpperCase() })}
          placeholder="F4ABC"
          className="bg-[#09090b] border-zinc-700 text-zinc-100 rounded-none font-mono text-sm uppercase"
        />
      </div>
      <div className="space-y-2">
        <Label className="text-xs font-bold uppercase tracking-[0.2em] text-zinc-500 flex items-center gap-2">
          <CalendarBlank size={14} /> Date
        </Label>
        <Input
          data-testid="qso-date-input"
          type="date"
          value={formData.date}
          onChange={(e) => setFormData({ ...formData, date: e.target.value })}
          className="bg-[#09090b] border-zinc-700 text-zinc-100 rounded-none font-mono text-sm"
        />
      </div>
      <div className="space-y-2">
        <Label className="text-xs font-bold uppercase tracking-[0.2em] text-zinc-500 flex items-center gap-2">
          <Broadcast size={14} /> Fréquence (MHz)
        </Label>
        <Input
          data-testid="qso-freq-input"
          type="number"
          step="0.001"
          value={formData.frequency}
          onChange={(e) => setFormData({ ...formData, frequency: e.target.value })}
          placeholder="145.500"
          className="bg-[#09090b] border-zinc-700 text-zinc-100 rounded-none font-mono text-sm"
        />
      </div>
      <div className="space-y-2">
        <Label className="text-xs font-bold uppercase tracking-[0.2em] text-zinc-500 flex items-center gap-2">
          <User size={14} /> Nom
        </Label>
        <Input
          data-testid="qso-name-input"
          type="text"
          value={formData.name}
          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
          placeholder="Jean"
          className="bg-[#09090b] border-zinc-700 text-zinc-100 rounded-none font-mono text-sm"
        />
      </div>
      <Button
        data-testid="qso-submit-button"
        type="submit"
        className="w-full bg-amber-500 hover:bg-amber-600 text-black font-bold uppercase tracking-wider rounded-none h-12 transition-all duration-200 shadow-[0_0_15px_rgba(245,158,11,0.15)] hover:shadow-[0_0_20px_rgba(245,158,11,0.3)]"
      >
        Enregistrer QSO
      </Button>
    </form>
  );
}

// === App Root ===
function App() {
  return (
    <AuthProvider>
      <Toaster
        position="top-right"
        theme="dark"
        toastOptions={{
          style: { background: "#121212", border: "1px solid #27272a", color: "#FAFAFA" },
        }}
      />
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
