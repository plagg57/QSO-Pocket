import { useState, useEffect, useCallback } from "react";
import axios from "axios";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import { MagnifyingGlass, Plus, SignOut, CaretRight, ArrowLeft, Export, Gear } from "@phosphor-icons/react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/context/AuthContext";
import { LanguageSelector, useOnlineStatus, OfflineBanner } from "@/components/shared";
import { API, LOGO_URL, BANDS, formatApiError } from "@/config";
import { getFlagUrl, getCountryName } from "@/utils/callsignFlags";
import { getBand } from "@/utils/bands";
import { exportAdifFile } from "@/utils/exportAdif";
import { getPendingQSOs, removePendingQSO, getPendingCount } from "@/utils/offlineQueue";
import ProfilePage from "@/components/profile/ProfilePage";
import AdminPanel from "@/components/admin/AdminPanel";
import ContactDetail from "@/components/qso/ContactDetail";
import AddQSOModal from "@/components/qso/AddQSOModal";

export default function Dashboard() {
  const { user, logout } = useAuth();
  const { t } = useTranslation();
  const isOnline = useOnlineStatus();
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
  const [pendingCount, setPendingCount] = useState(0);
  const [activeLogbook, setActiveLogbook] = useState(() => {
    const saved = localStorage.getItem("qso_active_logbook");
    if (saved && ["radioamateur", "cb", "swl"].includes(saved)) return saved;
    // Default to user's type for new users
    const userType = user?.user_type;
    if (userType === "cibiste") return "cb";
    if (userType === "swl") return "swl";
    return "radioamateur";
  });

  const switchLogbook = (lb) => {
    setActiveLogbook(lb);
    localStorage.setItem("qso_active_logbook", lb);
    setSelectedCallsign(null);
    setSearchTerm("");
    setBandFilter("");
  };

  const refreshPendingCount = useCallback(async () => {
    try { setPendingCount(await getPendingCount()); } catch {}
  }, []);

  // Sync pending QSOs when back online
  const syncPendingQSOs = useCallback(async () => {
    const pending = await getPendingQSOs();
    if (pending.length === 0) return;
    let synced = 0;
    for (const qso of pending) {
      try {
        const { localId, createdAt, ...payload } = qso;
        await axios.post(`${API}/qso`, payload);
        await removePendingQSO(localId);
        synced++;
      } catch { break; }
    }
    if (synced > 0) {
      toast.success(`${synced} ${t("offline.synced")}`);
      fetchGrouped();
      fetchStats();
    }
    refreshPendingCount();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [t, refreshPendingCount]);

  useEffect(() => {
    refreshPendingCount();
  }, [refreshPendingCount]);

  // Auto-sync when coming back online
  useEffect(() => {
    if (isOnline) {
      syncPendingQSOs();
    }
  }, [isOnline, syncPendingQSOs]);

  const fetchGrouped = useCallback(async () => {
    try {
      const params = new URLSearchParams();
      if (searchTerm) params.append("search", searchTerm);
      if (bandFilter) params.append("band", bandFilter);
      params.append("logbook", activeLogbook);
      const res = await axios.get(`${API}/qso/grouped?${params.toString()}`);
      setGrouped(res.data);
    } catch (error) {
      if (error.response?.status !== 401) toast.error(t("common.error"));
    } finally { setLoading(false); }
  }, [searchTerm, bandFilter, activeLogbook, t]);

  const fetchStats = useCallback(async () => {
    try {
      const res = await axios.get(`${API}/qso/stats/total?logbook=${activeLogbook}`);
      setStats(res.data);
    } catch {}
  }, [activeLogbook]);

  useEffect(() => { fetchGrouped(); fetchStats(); }, [fetchGrouped, fetchStats]);

  const formatDate = (d) => new Date(d).toLocaleDateString(undefined, { day: "2-digit", month: "2-digit", year: "numeric" });

  const handleLogout = async () => { await logout(); toast.success(t("auth.logout_success")); };

  const handleAddFromSearch = () => {
    setAddCallsign(searchTerm.toUpperCase());
    setShowAddModal(true);
  };

  const handleAdded = () => {
    fetchGrouped();
    fetchStats();
    refreshPendingCount();
  };

  const searchUpper = searchTerm.toUpperCase().trim();
  const exactMatch = grouped.find(g => g.callsign === searchUpper);
  const showAddButton = searchTerm.length >= 2 && !exactMatch;

  return (
    <div className="min-h-screen bg-[#09090b] relative">
      <div className="radio-bg"></div>
      <OfflineBanner pendingCount={pendingCount} />
      <div className={`relative z-10 max-w-[1100px] mx-auto p-3 sm:p-4 md:p-6 lg:p-8 ${(!isOnline || pendingCount > 0) ? "pt-12" : ""}`}>
        <header className="flex flex-col sm:flex-row justify-between items-start sm:items-center border-b border-zinc-800 pb-4 mb-6 gap-3" data-testid="app-header">
          <div className="flex items-center gap-3">
            <img src={LOGO_URL} alt="QSO Pocket" className="h-8 sm:h-10" />
            <select value={activeLogbook} onChange={(e) => switchLogbook(e.target.value)} data-testid="logbook-selector"
              className="bg-[#121212] border border-zinc-700 text-zinc-100 font-mono text-xs sm:text-sm px-3 py-1.5 focus:border-amber-500 focus:ring-1 focus:ring-amber-500 appearance-none cursor-pointer"
              style={{ backgroundImage: "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 12 12'%3E%3Cpath fill='%23a1a1aa' d='M6 8L1 3h10z'/%3E%3C/svg%3E\")", backgroundRepeat: "no-repeat", backgroundPosition: "right 8px center", paddingRight: "28px" }}>
              <option value="radioamateur">{t("logbook.radioamateur")}</option>
              <option value="cb">{t("logbook.cb")}</option>
              <option value="swl">{t("logbook.swl")}</option>
            </select>
          </div>
          <div className="flex items-center gap-2 sm:gap-3 w-full sm:w-auto justify-between sm:justify-end">
            <div className="font-mono text-xs sm:text-sm text-amber-500 tracking-wide" data-testid="user-callsign-display">
              {t("auth.connected_as")} <span className="font-bold">{user?.callsign}</span>
            </div>
            <div className="flex items-center gap-2">
              <LanguageSelector />
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
                <SignOut size={14} /> <span className="hidden sm:inline">{t("auth.logout")}</span>
              </button>
            </div>
          </div>
        </header>

        {showProfile ? (
          <ProfilePage onBack={() => setShowProfile(false)} />
        ) : showAdmin && user?.role === "admin" ? (
          <AdminPanel onBack={() => setShowAdmin(false)} />
        ) : selectedCallsign ? (
          <ContactDetail callsign={selectedCallsign} logbook={activeLogbook} onBack={() => { setSelectedCallsign(null); fetchGrouped(); fetchStats(); }} />
        ) : (
          <>
            <div className="grid grid-cols-2 gap-3 sm:gap-4 mb-6">
              <div className="bg-[#121212] border border-zinc-800/80 p-4 sm:p-5" data-testid="qso-total-stats">
                <div className="text-xs font-bold uppercase tracking-[0.2em] text-zinc-500 mb-1">{t("dashboard.callsigns")}</div>
                <div className="text-3xl sm:text-4xl font-bold tracking-tighter text-amber-500 amber-glow font-mono">{stats.total_callsigns}</div>
              </div>
              <div className="bg-[#121212] border border-zinc-800/80 p-4 sm:p-5">
                <div className="text-xs font-bold uppercase tracking-[0.2em] text-zinc-500 mb-1">{t("dashboard.total_qsos")}</div>
                <div className="text-3xl sm:text-4xl font-bold tracking-tighter text-amber-500 amber-glow font-mono">{stats.total_qsos}</div>
              </div>
            </div>

            <div className="mb-4">
              <div className="relative">
                <MagnifyingGlass className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" size={20} />
                <Input data-testid="qso-search-input" type="text" placeholder={t("dashboard.search_placeholder")}
                  value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 bg-[#09090b] border-zinc-700 text-zinc-100 rounded-none font-mono text-sm h-12" />
              </div>

              {showAddButton && (
                <button onClick={handleAddFromSearch} data-testid="add-callsign-from-search-btn"
                  className="mt-3 w-full flex items-center justify-center gap-2 px-4 py-3 bg-amber-500/10 hover:bg-amber-500/20 text-amber-500 border border-amber-500/30 font-mono text-sm uppercase tracking-wider transition-all duration-200">
                  <Plus size={16} /> {t("dashboard.add_callsign")} {searchUpper}
                </button>
              )}

              <div className="mt-3">
                <select value={bandFilter} onChange={(e) => setBandFilter(e.target.value)} data-testid="band-filter"
                  className="w-full bg-[#09090b] border border-zinc-700 text-zinc-100 font-mono text-sm h-10 px-3 focus:border-amber-500 focus:ring-1 focus:ring-amber-500 appearance-none"
                  style={{ backgroundImage: "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 12 12'%3E%3Cpath fill='%23a1a1aa' d='M6 8L1 3h10z'/%3E%3C/svg%3E\")", backgroundRepeat: "no-repeat", backgroundPosition: "right 12px center" }}>
                  <option value="">{t("dashboard.all_bands")}</option>
                  {BANDS.map((b) => <option key={b} value={b}>{b.toUpperCase()}</option>)}
                </select>
              </div>
            </div>

            <div className="bg-[#121212] border border-zinc-800/80 overflow-hidden">
              {loading ? (
                <div className="p-8 text-center">
                  <div className="inline-block w-4 h-6 bg-amber-500 animate-pulse"></div>
                  <p className="mt-4 text-zinc-500 font-mono text-sm">{t("common.loading")}</p>
                </div>
              ) : grouped.length === 0 && !searchTerm ? (
                <div className="p-8 sm:p-12 text-center" data-testid="qso-empty-state">
                  <img src="https://static.prod-images.emergentagent.com/jobs/500d8642-2d5d-4297-bd34-3b17f0d02b71/images/0269ce3934d36a628e9a11a54b81dcc1d41264abf64f169ad8fe18dfcd38aa1b.png"
                    alt="Radio" className="w-20 h-20 sm:w-24 sm:h-24 mx-auto opacity-30 mb-4" />
                  <p className="text-zinc-500 font-mono text-sm">{t("dashboard.no_callsigns")}</p>
                  <p className="text-zinc-600 font-mono text-xs mt-1">{t("dashboard.search_to_add")}</p>
                </div>
              ) : grouped.length === 0 && searchTerm ? (
                <div className="p-8 text-center" data-testid="qso-no-results">
                  <p className="text-zinc-500 font-mono text-sm">{t("dashboard.no_results")} "{searchTerm}"</p>
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
                          <span>{t("dashboard.first_contact")} : {formatDate(entry.first_contact)}</span>
                          <span>{t("dashboard.last_contact")} : {formatDate(entry.last_contact)}</span>
                          <span className="hidden sm:inline">{entry.total_contacts} {entry.total_contacts > 1 ? t("dashboard.contacts") : t("dashboard.contact")}</span>
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

            {stats.total_qsos > 0 && (
              <button onClick={async () => {
                try {
                  const res = await axios.get(`${API}/qso?logbook=${activeLogbook}`);
                  const qsos = res.data;
                  
                  let adif = "ADIF Export from QSO Pocket\n";
                  adif += "<ADIF_VER:5>3.1.4\n<PROGRAMID:10>QSO_POCKET\n<PROGRAMVERSION:3>1.0\n<EOH>\n\n";
                  
                  for (const qso of qsos) {
                    const af = (name, val) => { if (!val) return ""; const v = String(val); return `<${name}:${v.length}>${v}`; };
                    let rec = "";
                    rec += af("CALL", qso.callsign);
                    if (qso.date) rec += af("QSO_DATE", qso.date.replace(/-/g, ""));
                    if (qso.time_utc) rec += af("TIME_ON", qso.time_utc.replace(":", ""));
                    if (qso.frequency) rec += af("FREQ", qso.frequency.toFixed(6));
                    const band = getBand(qso.frequency);
                    if (band) rec += af("BAND", band);
                    if (qso.mode) rec += af("MODE", qso.mode);
                    if (qso.name) rec += af("NAME", qso.name);
                    if (qso.comment) rec += af("COMMENT", qso.comment);
                    rec += af("MY_CALLSIGN", user?.callsign || "");
                    if (qso.qsl_sent) rec += af("QSL_SENT", "Y");
                    if (qso.qsl_received) rec += af("QSL_RCVD", "Y");
                    if (qso.rst_sent) rec += af("RST_SENT", qso.rst_sent);
                    if (qso.rst_received) rec += af("RST_RCVD", qso.rst_received);
                    rec += "<EOR>\n";
                    adif += rec + "\n";
                  }
                  
                  const filename = `${(user?.callsign || "qso").replace("/", "_")}_log.adi`;
                  const result = await exportAdifFile(adif, filename);
                  
                  if (result.success) {
                    toast.success(`${qsos.length} ${t("dashboard.exported")} — ${result.message}`);
                  } else {
                    toast.error(result.message);
                  }
                } catch {
                  toast.error(t("dashboard.export_error"));
                }
              }} data-testid="export-adif-btn"
                className="w-full mt-6 mb-20 flex items-center justify-center gap-2 px-4 py-2.5 bg-[#121212] hover:bg-[#1a1a1a] text-zinc-300 border border-zinc-800 font-mono text-xs uppercase tracking-wider transition-all duration-200">
                <Export size={16} className="text-amber-500" /> {t("dashboard.export_adif")}
              </button>
            )}

            <div className="mt-3 mb-20">
              <input type="file" accept=".adi,.adif,.ADI,.ADIF" id="adif-import-input" className="hidden"
                onChange={async (e) => {
                  const file = e.target.files?.[0];
                  if (!file) return;
                  try {
                    const text = await file.text();
                    const { data } = await axios.post(`${API}/qso/import/adif-text`, { content: text, logbook: activeLogbook });
                    toast.success(`${data.imported} ${t("dashboard.imported")}${data.skipped ? `, ${data.skipped} ${t("dashboard.skipped")}` : ""}`);
                    fetchGrouped();
                    fetchStats();
                  } catch (err) {
                    const status = err.response?.status || "réseau";
                    const detail = err.response?.data?.detail;
                    const msg = typeof detail === "string" ? detail : JSON.stringify(err.response?.data || err.message);
                    toast.error(`${t("dashboard.import_error")} ${status} — ${msg}`);
                  }
                  e.target.value = "";
                }} />
              <button onClick={() => document.getElementById("adif-import-input")?.click()} data-testid="import-adif-btn"
                className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-[#121212] hover:bg-[#1a1a1a] text-zinc-300 border border-zinc-800 font-mono text-xs uppercase tracking-wider transition-all duration-200">
                <ArrowLeft size={16} className="text-amber-500 -rotate-90" /> {t("dashboard.import_adif")}
              </button>
            </div>

            <button onClick={() => { setAddCallsign(""); setShowAddModal(true); }} data-testid="fab-add-qso"
              className="fixed bottom-6 right-6 w-14 h-14 bg-amber-500 hover:bg-amber-600 text-black flex items-center justify-center shadow-lg shadow-amber-500/20 transition-all duration-200 z-20">
              <Plus size={24} weight="bold" />
            </button>

            <div className="mt-8 mb-24 space-y-4">
              <button onClick={() => {
                if (window.confirm(t("dashboard.support_message"))) {
                  window.open("https://paypal.me/JonathanZils", "_blank");
                }
              }} data-testid="support-btn"
                className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-[#121212] hover:bg-[#1a1a1a] text-zinc-300 border border-zinc-800 font-mono text-xs uppercase tracking-wider transition-all duration-200">
                <span className="text-red-500">&#9829;</span> {t("dashboard.support_qso_pocket")}
              </button>
              <p className="text-center text-xs text-zinc-600 font-mono">{t("dashboard.created_by")}</p>
            </div>
          </>
        )}

        {showAddModal && (
          <AddQSOModal callsign={addCallsign} logbook={activeLogbook} onClose={() => setShowAddModal(false)} onAdded={handleAdded} />
        )}
      </div>
    </div>
  );
}


