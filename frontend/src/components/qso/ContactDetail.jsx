import { useState, useEffect, useCallback } from "react";
import axios from "axios";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import { ArrowLeft, CalendarBlank, Clock, Hash, Pencil, Trash, Plus, X, Check, Broadcast } from "@phosphor-icons/react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { API, MODES, formatApiError } from "@/config";
import { getFlagUrl, getCountryName } from "@/utils/callsignFlags";
import { getBand } from "@/utils/bands";
import AddQSOModal from "@/components/qso/AddQSOModal";

export default function ContactDetail({ callsign, onBack, logbook }) {
  const { t } = useTranslation();
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
      toast.error(t("detail.load_error_text") || t("detail.load_error"));
    }
    finally { setLoading(false); }
  }, [callsign, t]);

  useEffect(() => { fetchHistory(); }, [fetchHistory]);

  const handleDelete = async (id) => {
    if (!window.confirm(t("qso.delete_confirm"))) return;
    try {
      await axios.delete(`${API}/qso/${id}`);
      toast.success(t("qso.deleted"));
      try {
        const res = await axios.get(`${API}/qso/history/${encodeURIComponent(callsign)}`);
        setData(res.data);
      } catch {
        onBack();
      }
    } catch { toast.error(t("qso.delete_error")); }
  };

  const [editingName, setEditingName] = useState(false);
  const [nameValue, setNameValue] = useState("");
  const [editingModeId, setEditingModeId] = useState(null);
  const [editingQsoId, setEditingQsoId] = useState(null);
  const [editQsoData, setEditQsoData] = useState({ date: "", time_utc: "", frequency: "", mode: "", name: "", comment: "", qsl_sent: false, qsl_received: false, rst_sent: "", rst_received: "" });

  const startEditName = () => { setNameValue(data?.name || ""); setEditingName(true); };
  const saveContactName = async () => {
    try {
      await axios.put(`${API}/qso/contact/${encodeURIComponent(callsign)}/name`, { name: nameValue });
      toast.success(t("detail.name_updated"));
      setEditingName(false);
      fetchHistory();
    } catch { toast.error(t("detail.name_update_error")); }
  };

  const updateQsoMode = async (qsoId, newMode) => {
    try {
      await axios.put(`${API}/qso/${qsoId}`, { mode: newMode });
      toast.success(t("detail_extra.mode_updated"));
      setEditingModeId(null);
      fetchHistory();
    } catch { toast.error(t("detail_extra.mode_update_error")); }
  };

  const startEditQso = (qso) => {
    setEditingQsoId(qso.id);
    setEditQsoData({ date: qso.date, time_utc: qso.time_utc || "", frequency: qso.frequency.toString(), mode: qso.mode || "", name: qso.name || "", comment: qso.comment || "", qsl_sent: !!qso.qsl_sent, qsl_received: !!qso.qsl_received, rst_sent: qso.rst_sent || "", rst_received: qso.rst_received || "" });
  };

  const saveEditQso = async (id) => {
    try {
      await axios.put(`${API}/qso/${id}`, { ...editQsoData, frequency: parseFloat(editQsoData.frequency) });
      toast.success(t("qso.edited"));
      setEditingQsoId(null);
      fetchHistory();
    } catch { toast.error(t("qso.edit_error")); }
  };

  const formatDate = (d) => new Date(d).toLocaleDateString(undefined, { day: "2-digit", month: "2-digit", year: "numeric" });

  const sortedHistory = data?.history ? [...data.history].sort((a, b) => b.date.localeCompare(a.date) || (b.time_utc || "").localeCompare(a.time_utc || "")) : [];

  return (
    <div data-testid="contact-detail-panel">
      <button onClick={onBack} className="flex items-center gap-2 text-zinc-400 hover:text-amber-500 transition-colors font-mono text-sm mb-6" data-testid="back-to-list-btn">
        <ArrowLeft size={18} /> {t("detail.back_to_list")}
      </button>

      {loading ? (
        <div className="p-8 text-center">
          <div className="inline-block w-4 h-6 bg-amber-500 animate-pulse"></div>
          <p className="mt-4 text-zinc-500 font-mono text-sm">{t("common.loading")}</p>
        </div>
      ) : error || !data ? (
        <div className="bg-[#121212] border border-zinc-800/80 p-8 text-center">
          <p className="text-zinc-400 font-mono text-sm mb-4">{t("detail.load_error")} {callsign}</p>
          <Button onClick={fetchHistory} className="bg-amber-500 hover:bg-amber-600 text-black font-bold uppercase tracking-wider rounded-none">
            {t("detail.retry")}
          </Button>
        </div>
      ) : (
        <>
          <div className="bg-[#121212] border border-zinc-800/80 p-5 sm:p-6 mb-4">
            <div className="flex items-center gap-3 mb-2">
              {getFlagUrl(data.callsign, 32) && <img src={getFlagUrl(data.callsign, 32)} alt={getCountryName(data.callsign)} className="h-5 shadow-sm" />}
              <div className="text-3xl sm:text-4xl font-bold text-amber-500 font-mono amber-glow" data-testid="detail-callsign">{data.callsign}</div>
            </div>
            {getCountryName(data.callsign) && <div className="text-xs text-zinc-500 font-mono uppercase tracking-wider mb-1">{getCountryName(data.callsign)}</div>}
            <div className="flex items-center gap-2 mb-6">
              {editingName ? (
                <div className="flex items-center gap-2 flex-1">
                  <Input value={nameValue} onChange={(e) => setNameValue(e.target.value)} placeholder={t("detail.name_placeholder")}
                    className="bg-[#09090b] border-zinc-700 text-zinc-100 rounded-none font-mono text-sm h-9 flex-1" autoFocus
                    onKeyDown={(e) => { if (e.key === "Enter") saveContactName(); if (e.key === "Escape") setEditingName(false); }} />
                  <button onClick={saveContactName} className="p-1.5 text-green-500 hover:text-green-400" data-testid="save-name-btn"><Check size={18} /></button>
                  <button onClick={() => setEditingName(false)} className="p-1.5 text-zinc-500 hover:text-zinc-300"><X size={18} /></button>
                </div>
              ) : (
                <>
                  <span className="text-lg text-zinc-300 font-mono">{data.name || t("detail.unknown_name")}</span>
                  <button onClick={startEditName} className="p-1 text-zinc-500 hover:text-amber-500 transition-colors" data-testid="edit-name-btn">
                    <Pencil size={16} />
                  </button>
                </>
              )}
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="bg-[#09090b] border border-zinc-800 p-4">
                <div className="text-xs font-bold uppercase tracking-[0.2em] text-zinc-500 mb-1 flex items-center gap-1"><CalendarBlank size={12} /> {t("detail.first_contact")}</div>
                <div className="text-sm text-zinc-200 font-mono" data-testid="detail-first-contact">{formatDate(data.first_contact)}</div>
              </div>
              <div className="bg-[#09090b] border border-zinc-800 p-4">
                <div className="text-xs font-bold uppercase tracking-[0.2em] text-zinc-500 mb-1 flex items-center gap-1"><Clock size={12} /> {t("detail.last_contact")}</div>
                <div className="text-sm text-zinc-200 font-mono" data-testid="detail-last-contact">{formatDate(data.last_contact)}</div>
              </div>
              <div className="bg-[#09090b] border border-zinc-800 p-4">
                <div className="text-xs font-bold uppercase tracking-[0.2em] text-zinc-500 mb-1 flex items-center gap-1"><Hash size={12} /> {t("detail.total_contacts")}</div>
                <div className="text-2xl font-bold text-amber-500 font-mono" data-testid="detail-total-contacts">{data.total_contacts}</div>
              </div>
            </div>
          </div>

          <Button onClick={() => setShowAddModal(true)} data-testid="add-contact-to-callsign-btn"
            className="w-full mb-4 bg-amber-500/10 hover:bg-amber-500/20 text-amber-500 border border-amber-500/30 font-bold uppercase tracking-wider rounded-none h-11 transition-all duration-200">
            <Plus size={16} className="mr-2" /> {t("qso.add_contact_with")} {data.callsign}
          </Button>

          <div className="bg-[#121212] border border-zinc-800/80">
            <div className="px-5 py-3 border-b border-zinc-800">
              <h3 className="font-display text-sm font-semibold tracking-tight uppercase text-zinc-400">{t("detail.history")}</h3>
            </div>
            <div className="divide-y divide-zinc-800/50">
              {sortedHistory.map((qso) => (
                <div key={qso.id} className="p-4 sm:px-5 hover:bg-[#1a1a1a] transition-colors" data-testid="history-entry">
                  {editingQsoId === qso.id ? (
                    <div className="space-y-3">
                      <div className="grid grid-cols-3 gap-3">
                        <div>
                          <span className="text-zinc-500 text-xs font-mono">{t("qso.date")}</span>
                          <Input type="date" value={editQsoData.date} onChange={(e) => setEditQsoData({ ...editQsoData, date: e.target.value })}
                            className="bg-[#09090b] border-zinc-700 text-zinc-100 rounded-none font-mono text-sm h-8 mt-1" />
                        </div>
                        <div>
                          <span className="text-zinc-500 text-xs font-mono">{t("qso.time_utc")}</span>
                          <Input type="time" value={editQsoData.time_utc} onChange={(e) => setEditQsoData({ ...editQsoData, time_utc: e.target.value })}
                            className="bg-[#09090b] border-zinc-700 text-zinc-100 rounded-none font-mono text-sm h-8 mt-1" />
                        </div>
                        <div>
                          <span className="text-zinc-500 text-xs font-mono">{t("qso.frequency")}</span>
                          <Input type="number" step="0.001" value={editQsoData.frequency} onChange={(e) => setEditQsoData({ ...editQsoData, frequency: e.target.value })}
                            className="bg-[#09090b] border-zinc-700 text-zinc-100 rounded-none font-mono text-sm h-8 mt-1" />
                        </div>
                      </div>
                      <div>
                        <span className="text-zinc-500 text-xs font-mono">{t("qso.mode")}</span>
                        <div className="flex flex-wrap gap-1 mt-1">
                          {MODES.map((m) => (
                            <button key={m} type="button" onClick={() => setEditQsoData({ ...editQsoData, mode: editQsoData.mode === m ? "" : m })}
                              className={`px-2 py-0.5 text-[10px] font-mono uppercase border transition-all ${editQsoData.mode === m ? "bg-amber-500 text-black border-amber-500" : "bg-[#09090b] text-zinc-400 border-zinc-700 hover:border-zinc-500"}`}>
                              {m}
                            </button>
                          ))}
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <span className="text-zinc-500 text-xs font-mono">{t("qso.rst_sent")}</span>
                          <Input value={editQsoData.rst_sent} onChange={(e) => setEditQsoData({ ...editQsoData, rst_sent: e.target.value })}
                            placeholder="59" className="bg-[#09090b] border-zinc-700 text-zinc-100 rounded-none font-mono text-sm h-8 mt-1" />
                        </div>
                        <div>
                          <span className="text-zinc-500 text-xs font-mono">{t("qso.rst_received")}</span>
                          <Input value={editQsoData.rst_received} onChange={(e) => setEditQsoData({ ...editQsoData, rst_received: e.target.value })}
                            placeholder="59" className="bg-[#09090b] border-zinc-700 text-zinc-100 rounded-none font-mono text-sm h-8 mt-1" />
                        </div>
                      </div>
                      <div>
                        <span className="text-zinc-500 text-xs font-mono">{t("qso.comment")}</span>
                        <Input value={editQsoData.comment} onChange={(e) => setEditQsoData({ ...editQsoData, comment: e.target.value })}
                          placeholder={t("qso.comment_placeholder")} className="bg-[#09090b] border-zinc-700 text-zinc-100 rounded-none font-mono text-sm h-8 mt-1" />
                      </div>
                      <div className="flex gap-4 py-1">
                        <label className="flex items-center gap-2 cursor-pointer">
                          <input type="checkbox" checked={editQsoData.qsl_sent} onChange={(e) => setEditQsoData({ ...editQsoData, qsl_sent: e.target.checked })}
                            className="w-3.5 h-3.5 accent-amber-500" />
                          <span className="text-[10px] font-mono text-zinc-400 uppercase">{t("qso.qsl_sent")}</span>
                        </label>
                        <label className="flex items-center gap-2 cursor-pointer">
                          <input type="checkbox" checked={editQsoData.qsl_received} onChange={(e) => setEditQsoData({ ...editQsoData, qsl_received: e.target.checked })}
                            className="w-3.5 h-3.5 accent-amber-500" />
                          <span className="text-[10px] font-mono text-zinc-400 uppercase">{t("qso.qsl_received")}</span>
                        </label>
                      </div>
                      <div className="flex gap-2">
                        <button onClick={() => saveEditQso(qso.id)} className="flex items-center gap-1 px-3 py-1.5 text-xs font-mono uppercase bg-amber-500 text-black font-bold" data-testid="save-qso-edit-btn">
                          <Check size={14} /> {t("qso.save")}
                        </button>
                        <button onClick={() => setEditingQsoId(null)} className="flex items-center gap-1 px-3 py-1.5 text-xs font-mono uppercase text-zinc-400 border border-zinc-700">
                          {t("common.cancel")}
                        </button>
                      </div>
                    </div>
                  ) : (
                    <>
                      <div className="flex items-center justify-between mb-1">
                        <div className="flex-1 grid grid-cols-2 sm:grid-cols-4 gap-x-4 gap-y-1 font-mono text-sm">
                          <div>
                            <span className="text-zinc-500 text-xs">{t("qso.date")}</span>
                            <div className="text-zinc-200">{formatDate(qso.date)}{qso.time_utc ? ` ${qso.time_utc} UTC` : ""}</div>
                          </div>
                          <div>
                            <span className="text-zinc-500 text-xs">{t("qso.frequency")}</span>
                            <div className="text-zinc-200">{qso.frequency.toFixed(3)} MHz{getBand(qso.frequency) ? ` (${getBand(qso.frequency)})` : ""}</div>
                          </div>
                          <div>
                            <span className="text-zinc-500 text-xs">{t("qso.mode")}</span>
                            <div className="text-zinc-200">{qso.mode || "—"}</div>
                          </div>
                          <div>
                            <span className="text-zinc-500 text-xs">RST</span>
                            <div className="text-zinc-200">{qso.rst_sent || "—"} / {qso.rst_received || "—"}</div>
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
                      {(qso.qsl_sent || qso.qsl_received) && (
                        <div className="mt-1 flex gap-3 text-[10px] font-mono uppercase tracking-wider">
                          {qso.qsl_sent && <span className="text-green-500">{t("qso.qsl_sent")}</span>}
                          {qso.qsl_received && <span className="text-green-500">{t("qso.qsl_received")}</span>}
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
      )}
    </div>
  );
}


