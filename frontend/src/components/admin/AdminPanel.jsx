import { useState, useEffect, useCallback } from "react";
import axios from "axios";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import { ArrowLeft, MagnifyingGlass, Trash, CaretRight } from "@phosphor-icons/react";
import { Input } from "@/components/ui/input";
import { API, formatApiError } from "@/config";
import { getFlagUrl, getCountryName } from "@/utils/callsignFlags";
import { getBand } from "@/utils/bands";

export default function AdminPanel({ onBack }) {
  const { t } = useTranslation();
  const [users, setUsers] = useState([]);
  const [stats, setStats] = useState({ total_users: 0, total_qsos: 0 });
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedUser, setSelectedUser] = useState(null);
  const [groupedQsos, setGroupedQsos] = useState([]);
  const [selectedCallsign, setSelectedCallsign] = useState(null);
  const [detailData, setDetailData] = useState(null);
  const [loadingDetail, setLoadingDetail] = useState(false);

  const fetchUsers = useCallback(async () => {
    try {
      const params = new URLSearchParams();
      if (searchTerm) params.append("search", searchTerm);
      const res = await axios.get(`${API}/admin/users?${params.toString()}`);
      setUsers(res.data);
    } catch { toast.error(t("admin.load_error_users")); }
    finally { setLoading(false); }
  }, [searchTerm, t]);

  const fetchStats = useCallback(async () => {
    try {
      const res = await axios.get(`${API}/admin/stats`);
      setStats(res.data);
    } catch {}
  }, []);

  useEffect(() => { fetchUsers(); fetchStats(); }, [fetchUsers, fetchStats]);

  const viewUser = async (u) => {
    setSelectedUser(u);
    setSelectedCallsign(null);
    setDetailData(null);
    try {
      const res = await axios.get(`${API}/admin/users/${u.id}/grouped`);
      setGroupedQsos(res.data);
    } catch { toast.error(t("admin.load_error_qsos")); }
  };

  const viewCallsignDetail = async (cs) => {
    setSelectedCallsign(cs);
    setLoadingDetail(true);
    try {
      const res = await axios.get(`${API}/admin/users/${selectedUser.id}/history/${encodeURIComponent(cs)}`);
      setDetailData(res.data);
    } catch { toast.error(t("admin.load_error_history")); }
    finally { setLoadingDetail(false); }
  };

  const deleteQso = async (qsoId) => {
    if (!window.confirm(t("admin.delete_qso_confirm"))) return;
    try {
      await axios.delete(`${API}/admin/qso/${qsoId}`);
      toast.success(t("admin.qso_deleted"));
      viewCallsignDetail(selectedCallsign);
      fetchStats();
    } catch { toast.error(t("admin.delete_error")); }
  };

  const deleteUser = async (u) => {
    if (!window.confirm(t("admin.delete_confirm", { callsign: u.callsign, email: u.email }))) return;
    try {
      await axios.delete(`${API}/admin/users/${u.id}`);
      toast.success(t("admin.deleted", { callsign: u.callsign }));
      setSelectedUser(null);
      fetchUsers();
      fetchStats();
    } catch (err) { toast.error(formatApiError(err.response?.data?.detail)); }
  };

  const formatDate = (d) => {
    if (!d) return "—";
    return new Date(d).toLocaleDateString(undefined, { day: "2-digit", month: "2-digit", year: "numeric" });
  };

  const sortedHistory = detailData?.history ? [...detailData.history].sort((a, b) => b.date.localeCompare(a.date) || (b.time_utc || "").localeCompare(a.time_utc || "")) : [];

  return (
    <div data-testid="admin-panel">
      <button onClick={onBack} className="flex items-center gap-2 text-zinc-400 hover:text-amber-500 transition-colors font-mono text-sm mb-6" data-testid="admin-back-btn">
        <ArrowLeft size={18} /> {t("admin.back")}
      </button>

      <h2 className="font-display text-2xl font-bold tracking-tight uppercase text-zinc-100 mb-6">{t("admin.title")}</h2>

      <div className="grid grid-cols-2 gap-3 mb-6">
        <div className="bg-[#121212] border border-zinc-800/80 p-4">
          <div className="text-xs font-bold uppercase tracking-[0.2em] text-zinc-500 mb-1">{t("admin.users")}</div>
          <div className="text-3xl font-bold text-amber-500 font-mono" data-testid="admin-total-users">{stats.total_users}</div>
        </div>
        <div className="bg-[#121212] border border-zinc-800/80 p-4">
          <div className="text-xs font-bold uppercase tracking-[0.2em] text-zinc-500 mb-1">{t("admin.total_qsos")}</div>
          <div className="text-3xl font-bold text-amber-500 font-mono" data-testid="admin-total-qsos">{stats.total_qsos}</div>
        </div>
      </div>

      {selectedUser && selectedCallsign && detailData ? (
        <div data-testid="admin-callsign-detail">
          <button onClick={() => { setSelectedCallsign(null); setDetailData(null); viewUser(selectedUser); }}
            className="flex items-center gap-2 text-zinc-400 hover:text-amber-500 transition-colors font-mono text-sm mb-4">
            <ArrowLeft size={16} /> {t("admin.qsos_of")} {selectedUser.callsign}
          </button>

          <div className="bg-[#121212] border border-zinc-800/80 p-5 mb-4">
            <div className="flex items-center gap-3 mb-2">
              {getFlagUrl(detailData.callsign, 32) && <img src={getFlagUrl(detailData.callsign, 32)} alt="" className="h-5 shadow-sm" />}
              <div className="text-2xl font-bold text-amber-500 font-mono">{detailData.callsign}</div>
            </div>
            {getCountryName(detailData.callsign) && <div className="text-xs text-zinc-500 font-mono uppercase tracking-wider mb-1">{getCountryName(detailData.callsign)}</div>}
            <div className="text-base text-zinc-300 font-mono mb-4">{detailData.name || "—"}</div>
            <div className="grid grid-cols-3 gap-3">
              <div className="bg-[#09090b] border border-zinc-800 p-3">
                <div className="text-[10px] font-bold uppercase tracking-[0.15em] text-zinc-500 mb-1">{t("admin.first")}</div>
                <div className="text-xs text-zinc-200 font-mono">{formatDate(detailData.first_contact)}</div>
              </div>
              <div className="bg-[#09090b] border border-zinc-800 p-3">
                <div className="text-[10px] font-bold uppercase tracking-[0.15em] text-zinc-500 mb-1">{t("admin.last")}</div>
                <div className="text-xs text-zinc-200 font-mono">{formatDate(detailData.last_contact)}</div>
              </div>
              <div className="bg-[#09090b] border border-zinc-800 p-3">
                <div className="text-[10px] font-bold uppercase tracking-[0.15em] text-zinc-500 mb-1">{t("admin.total")}</div>
                <div className="text-xl font-bold text-amber-500 font-mono">{detailData.total_contacts}</div>
              </div>
            </div>
          </div>

          <div className="bg-[#121212] border border-zinc-800/80">
            <div className="px-5 py-3 border-b border-zinc-800">
              <h3 className="font-display text-sm font-semibold tracking-tight uppercase text-zinc-400">{t("admin.history")}</h3>
            </div>
            <div className="divide-y divide-zinc-800/50">
              {sortedHistory.map((qso) => (
                <div key={qso.id} className="p-4 sm:px-5 hover:bg-[#1a1a1a] transition-colors" data-testid="admin-history-entry">
                  <div className="flex items-center justify-between">
                    <div className="flex-1 grid grid-cols-2 sm:grid-cols-4 gap-x-3 gap-y-1 font-mono text-sm">
                      <div>
                        <span className="text-zinc-500 text-xs">{t("qso.date")}</span>
                        <div className="text-zinc-200">{formatDate(qso.date)}{qso.time_utc ? ` ${qso.time_utc}` : ""}</div>
                      </div>
                      <div>
                        <span className="text-zinc-500 text-xs">{t("qso.frequency")}</span>
                        <div className="text-zinc-200">{qso.frequency?.toFixed(3)} MHz{getBand(qso.frequency) ? ` (${getBand(qso.frequency)})` : ""}</div>
                      </div>
                      <div>
                        <span className="text-zinc-500 text-xs">{t("qso.mode")}</span>
                        <div className="text-zinc-200">{qso.mode || "—"}</div>
                      </div>
                      <div>
                        <span className="text-zinc-500 text-xs">{t("qso.name")}</span>
                        <div className="text-zinc-300">{qso.name || "—"}</div>
                      </div>
                    </div>
                    <button onClick={() => deleteQso(qso.id)} className="ml-2 p-1.5 text-zinc-600 hover:text-red-500 transition-colors" data-testid="admin-delete-qso-btn">
                      <Trash size={14} />
                    </button>
                  </div>
                  {qso.comment && <div className="mt-2 text-xs text-zinc-400 font-mono italic border-l-2 border-zinc-700 pl-3">{qso.comment}</div>}
                </div>
              ))}
            </div>
          </div>
        </div>

      ) : selectedUser ? (
        <div data-testid="admin-user-detail">
          <button onClick={() => setSelectedUser(null)} className="flex items-center gap-2 text-zinc-400 hover:text-amber-500 transition-colors font-mono text-sm mb-4">
            <ArrowLeft size={16} /> {t("admin.user_list")}
          </button>

          <div className="bg-[#121212] border border-zinc-800/80 p-5 mb-4">
            <div className="flex items-center justify-between">
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-xl font-bold text-amber-500 font-mono">{selectedUser.callsign}</span>
                  {selectedUser.user_type === "radioamateur" && <span className="text-xs px-2 py-0.5 bg-amber-500/10 text-amber-400 font-mono">📡 Radioamateur</span>}
                  {selectedUser.user_type === "cibiste" && <span className="text-xs px-2 py-0.5 bg-green-500/10 text-green-400 font-mono">🚛 CB</span>}
                  {selectedUser.user_type === "swl" && <span className="text-xs px-2 py-0.5 bg-blue-500/10 text-blue-400 font-mono">🎧 SWL</span>}
                </div>
                <div className="text-sm text-zinc-400 font-mono">{selectedUser.email}</div>
                <div className="text-xs text-zinc-500 font-mono mt-1">{t("admin.registered_on")} {formatDate(selectedUser.created_at)}</div>
              </div>
              {selectedUser.role !== "admin" && (
                <button onClick={() => deleteUser(selectedUser)} data-testid="admin-delete-user-btn"
                  className="px-3 py-1.5 text-xs font-mono uppercase tracking-wider text-red-400 border border-red-500/30 hover:bg-red-500/10 transition-all">
                  <Trash size={14} className="inline mr-1" /> {t("admin.delete")}
                </button>
              )}
            </div>
          </div>

          <div className="bg-[#121212] border border-zinc-800/80">
            <div className="px-5 py-3 border-b border-zinc-800">
              <h3 className="font-display text-sm font-semibold tracking-tight uppercase text-zinc-400">
                {t("admin.callsigns_of")} {selectedUser.callsign} ({groupedQsos.length})
              </h3>
            </div>
            {groupedQsos.length === 0 ? (
              <div className="p-6 text-center text-zinc-500 font-mono text-sm">{t("admin.no_qso")}</div>
            ) : (
              <div className="divide-y divide-zinc-800/50">
                {groupedQsos.map((entry) => {
                  const flagUrl = getFlagUrl(entry.callsign, 24);
                  return (
                    <button key={entry.callsign} onClick={() => viewCallsignDetail(entry.callsign)}
                      className="w-full text-left p-4 sm:px-5 hover:bg-[#1a1a1a] transition-colors flex items-center justify-between group" data-testid="admin-callsign-row">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          {flagUrl && <img src={flagUrl} alt="" className="h-3.5 shadow-sm shrink-0" />}
                          <span className="font-bold text-amber-500 font-mono">{entry.callsign}</span>
                          <span className="text-zinc-400 font-mono text-sm truncate">{entry.name}</span>
                        </div>
                        <div className="flex flex-col sm:flex-row sm:items-center gap-0.5 sm:gap-3 text-xs font-mono text-zinc-500">
                          <span>{t("admin.first")} : {formatDate(entry.first_contact)}</span>
                          <span>{t("admin.last")} : {formatDate(entry.last_contact)}</span>
                          <span>{entry.total_contacts} {entry.total_contacts > 1 ? t("dashboard.contacts") : t("dashboard.contact")}</span>
                        </div>
                      </div>
                      <CaretRight size={18} className="text-zinc-600 group-hover:text-amber-500 transition-colors shrink-0" />
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        </div>

      ) : (
        <>
          <div className="relative mb-4">
            <MagnifyingGlass className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" size={20} />
            <Input data-testid="admin-search-input" type="text" placeholder={t("admin.search_placeholder")}
              value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 bg-[#09090b] border-zinc-700 text-zinc-100 rounded-none font-mono text-sm h-12" />
          </div>

          <div className="bg-[#121212] border border-zinc-800/80 overflow-hidden">
            {loading ? (
              <div className="p-6 text-center">
                <div className="inline-block w-4 h-6 bg-amber-500 animate-pulse"></div>
              </div>
            ) : users.length === 0 ? (
              <div className="p-6 text-center text-zinc-500 font-mono text-sm">{t("admin.no_users")}</div>
            ) : (
              <div className="divide-y divide-zinc-800/50">
                {users.map((u) => (
                  <div key={u.id} className="p-4 sm:px-5 hover:bg-[#1a1a1a] transition-colors flex items-center justify-between" data-testid="admin-user-row">
                    <button onClick={() => viewUser(u)} className="flex-1 text-left min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-bold text-amber-500 font-mono">{u.callsign}</span>
                        {u.user_type === "radioamateur" && <span className="text-[10px] px-1.5 py-0.5 bg-amber-500/10 text-amber-400 font-mono" data-testid="user-type-badge">📡</span>}
                        {u.user_type === "cibiste" && <span className="text-[10px] px-1.5 py-0.5 bg-green-500/10 text-green-400 font-mono" data-testid="user-type-badge">🚛 CB</span>}
                        {u.user_type === "swl" && <span className="text-[10px] px-1.5 py-0.5 bg-blue-500/10 text-blue-400 font-mono" data-testid="user-type-badge">🎧 SWL</span>}
                        {u.role === "admin" && <span className="text-[10px] px-1.5 py-0.5 bg-amber-500/20 text-amber-500 font-mono uppercase">Admin</span>}
                      </div>
                      <div className="text-xs text-zinc-400 font-mono">{u.email}</div>
                      <div className="flex gap-3 text-xs text-zinc-500 font-mono mt-1">
                        <span>{t("admin.registered")} : {formatDate(u.created_at)}</span>
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
  );
}


