import { useState, useEffect } from "react";
import axios from "axios";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import { Plus, X, IdentificationCard, CalendarBlank, Clock, Broadcast, User, Pencil, ArrowsLeftRight } from "@phosphor-icons/react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { API, MODES, formatApiError } from "@/config";
import { getFlagUrl, getCountryName } from "@/utils/callsignFlags";
import { getBand } from "@/utils/bands";
import { addPendingQSO } from "@/utils/offlineQueue";

const CB_MODES = ["FM", "SSB", "AM"];

// ITU amateur radio format: 1-2 letters + 1 digit + 1-4 letters (with optional /portable)
const AMATEUR_REGEX = /^([A-Z]{1,2}[0-9]|[0-9][A-Z]{1,2}[0-9])[A-Z]{1,4}(\/[A-Z0-9]{1,4})?$/;
// CB format: starts with digits (country code) + mix of letters/digits
const CB_REGEX = /^[0-9]{1,3}[A-Z]{1,4}[0-9]{1,5}$/;

function detectCallsignType(cs) {
  if (!cs || cs.length < 3) return null;
  const upper = cs.toUpperCase().trim();
  if (AMATEUR_REGEX.test(upper)) return "radioamateur";
  if (CB_REGEX.test(upper)) return "cb";
  return null;
}

export default function AddQSOModal({ callsign, prefillName, onClose, onAdded, logbook = "radioamateur", onSwitchLogbook }) {
  const { t } = useTranslation();
  const now = new Date();
  const utcHH = String(now.getUTCHours()).padStart(2, "0");
  const utcMM = String(now.getUTCMinutes()).padStart(2, "0");
  const isSWL = logbook === "swl";
  const isCB = logbook === "cb";
  const activeModes = isCB ? CB_MODES : MODES;

  const [formData, setFormData] = useState({
    callsign: callsign || "",
    date: now.toISOString().split("T")[0],
    time_utc: `${utcHH}:${utcMM}`,
    frequency: "",
    mode: "",
    name: prefillName || "",
    comment: "",
    qsl_sent: false,
    qsl_received: false,
    rst_sent: "",
    rst_received: "",
  });
  const [dupInfo, setDupInfo] = useState(null);
  const [suggestedLogbook, setSuggestedLogbook] = useState(null);

  // Detect if callsign belongs to a different logbook
  useEffect(() => {
    const cs = formData.callsign.toUpperCase().trim();
    if (cs.length < 3 || logbook === "swl") { setSuggestedLogbook(null); return; }
    const detected = detectCallsignType(cs);
    if (detected && detected !== logbook) {
      setSuggestedLogbook(detected);
    } else {
      setSuggestedLogbook(null);
    }
  }, [formData.callsign, logbook]);

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
      toast.error(t("qso.fill_required")); return;
    }
    // If there's a suggested logbook and user hasn't dismissed it, ask confirmation
    if (suggestedLogbook && onSwitchLogbook) {
      const targetLabel = suggestedLogbook === "radioamateur" ? t("logbook.radioamateur") : t("logbook.cb");
      if (window.confirm(t("qso.wrong_logbook_confirm", { logbook: targetLabel }))) {
        // Save in the suggested logbook instead
        const payload = {
          ...formData,
          callsign: formData.callsign.toUpperCase(),
          frequency: parseFloat(formData.frequency),
          logbook: suggestedLogbook,
        };
        try {
          await axios.post(`${API}/qso`, payload);
          toast.success(t("qso.saved"));
          onSwitchLogbook(suggestedLogbook);
          onAdded();
          onClose();
        } catch (error) {
          if (!error.response || error.response.status === 503) {
            try { await addPendingQSO(payload); toast.success(t("offline.qso_queued")); onAdded(); onClose(); }
            catch { toast.error(t("common.error")); }
          } else { toast.error(formatApiError(error.response?.data?.detail)); }
        }
        return;
      }
    }
    const payload = {
      ...formData,
      callsign: formData.callsign.toUpperCase(),
      frequency: parseFloat(formData.frequency),
      logbook: logbook,
    };
    try {
      await axios.post(`${API}/qso`, payload);
      toast.success(t("qso.saved"));
      onAdded();
      onClose();
    } catch (error) {
      // If network error (offline), queue for later sync
      if (!error.response || error.response.status === 503) {
        try {
          await addPendingQSO(payload);
          toast.success(t("offline.qso_queued"));
          onAdded();
          onClose();
        } catch { toast.error(t("common.error")); }
      } else {
        toast.error(formatApiError(error.response?.data?.detail));
      }
    }
  };

  const flagUrl = getFlagUrl(formData.callsign, 32);
  const countryName = getCountryName(formData.callsign);

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm" onClick={onClose}>
      <div className="bg-[#121212] border border-zinc-800 w-full max-w-md p-6 max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()} data-testid="add-qso-modal">
        <div className="flex items-center justify-between mb-6">
          <h2 className="font-display text-xl font-semibold tracking-tight uppercase text-zinc-100 flex items-center gap-2">
            <Plus size={20} className="text-amber-500" /> {t("qso.new_qso")}
          </h2>
          <button onClick={onClose} className="text-zinc-500 hover:text-zinc-300 transition-colors" data-testid="close-modal-btn"><X size={20} /></button>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label className="text-xs font-bold uppercase tracking-[0.2em] text-zinc-500 flex items-center gap-2"><IdentificationCard size={14} /> {t("qso.callsign")}</Label>
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
                {t("qso.already_contacted")} ({dupInfo.count}x) — {t("qso.last_on")} : {new Date(dupInfo.last_date).toLocaleDateString()}
              </div>
            )}
            {suggestedLogbook && (
              <div className="text-xs font-mono bg-blue-500/10 border border-blue-500/30 px-3 py-2 flex items-center gap-2" data-testid="logbook-suggestion">
                <ArrowsLeftRight size={14} className="text-blue-400 shrink-0" />
                <span className="text-blue-400">
                  {suggestedLogbook === "radioamateur" ? t("qso.looks_like_ham") : t("qso.looks_like_cb")}
                </span>
              </div>
            )}
          </div>
          <div className="grid grid-cols-5 gap-3">
            <div className="col-span-3 space-y-2">
              <Label className="text-xs font-bold uppercase tracking-[0.2em] text-zinc-500 flex items-center gap-2"><CalendarBlank size={14} /> {t("qso.date")}</Label>
              <Input data-testid="qso-date-input" type="date" value={formData.date} onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                className="bg-[#09090b] border-zinc-700 text-zinc-100 rounded-none font-mono text-sm" />
            </div>
            <div className="col-span-2 space-y-2">
              <Label className="text-xs font-bold uppercase tracking-[0.2em] text-zinc-500 flex items-center gap-2"><Clock size={14} /> {t("qso.time_utc")}</Label>
              <Input data-testid="qso-time-input" type="time" value={formData.time_utc} onChange={(e) => setFormData({ ...formData, time_utc: e.target.value })}
                className="bg-[#09090b] border-zinc-700 text-zinc-100 rounded-none font-mono text-sm" />
            </div>
          </div>
          <div className="space-y-2">
            <Label className="text-xs font-bold uppercase tracking-[0.2em] text-zinc-500 flex items-center gap-2"><Broadcast size={14} /> {t("qso.frequency")}</Label>
            <Input data-testid="qso-freq-input" type="number" step="0.001" value={formData.frequency} onChange={(e) => setFormData({ ...formData, frequency: e.target.value })}
              placeholder="145.500" className="bg-[#09090b] border-zinc-700 text-zinc-100 rounded-none font-mono text-sm" />
            {formData.frequency && getBand(formData.frequency) && (
              <span className="text-xs text-amber-500 font-mono">{t("common.band_label")} : {getBand(formData.frequency)}</span>
            )}
          </div>
          <div className="space-y-2">
            <Label className="text-xs font-bold uppercase tracking-[0.2em] text-zinc-500 flex items-center gap-2"><Broadcast size={14} weight="bold" /> {t("qso.mode")}</Label>
            <div className="flex flex-wrap gap-2" data-testid="qso-mode-select">
              {activeModes.map((m) => (
                <button key={m} type="button" onClick={() => setFormData({ ...formData, mode: formData.mode === m ? "" : m })}
                  className={`px-3 py-1.5 text-xs font-mono uppercase tracking-wider border transition-all duration-150 ${formData.mode === m ? "bg-amber-500 text-black border-amber-500 font-bold" : "bg-[#09090b] text-zinc-400 border-zinc-700 hover:border-zinc-500"}`}>
                  {m}
                </button>
              ))}
            </div>
          </div>
          <div className="space-y-2">
            <Label className="text-xs font-bold uppercase tracking-[0.2em] text-zinc-500 flex items-center gap-2"><User size={14} /> {t("qso.name")}</Label>
            <Input data-testid="qso-name-input" type="text" value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder={t("qso.name_placeholder")} className="bg-[#09090b] border-zinc-700 text-zinc-100 rounded-none font-mono text-sm" />
          </div>
          <div className={`grid ${isSWL ? "grid-cols-1" : "grid-cols-2"} gap-3`}>
            {!isSWL && (
              <div className="space-y-2">
                <Label className="text-xs font-bold uppercase tracking-[0.2em] text-zinc-500">{t("qso.rst_sent")}</Label>
                <Input data-testid="qso-rst-sent-input" value={formData.rst_sent} onChange={(e) => setFormData({ ...formData, rst_sent: e.target.value })}
                  placeholder="59" className="bg-[#09090b] border-zinc-700 text-zinc-100 rounded-none font-mono text-sm" />
              </div>
            )}
            <div className="space-y-2">
              <Label className="text-xs font-bold uppercase tracking-[0.2em] text-zinc-500">{t("qso.rst_received")}</Label>
              <Input data-testid="qso-rst-received-input" value={formData.rst_received} onChange={(e) => setFormData({ ...formData, rst_received: e.target.value })}
                placeholder="59" className="bg-[#09090b] border-zinc-700 text-zinc-100 rounded-none font-mono text-sm" />
            </div>
          </div>
          <div className="space-y-2">
            <Label className="text-xs font-bold uppercase tracking-[0.2em] text-zinc-500 flex items-center gap-2"><Pencil size={14} /> {t("qso.comment")}</Label>
            <textarea data-testid="qso-comment-input" value={formData.comment} onChange={(e) => setFormData({ ...formData, comment: e.target.value })}
              placeholder={t("qso.comment_placeholder")}
              rows={2}
              className="flex w-full bg-[#09090b] border border-zinc-700 focus:border-amber-500 focus:ring-1 focus:ring-amber-500 text-zinc-100 rounded-none font-mono text-sm px-3 py-2 placeholder:text-zinc-600 resize-none" />
          </div>
          <div className="flex gap-4 py-1">
            {!isSWL && (
              <label className="flex items-center gap-2 cursor-pointer" data-testid="qsl-sent-toggle">
                <input type="checkbox" checked={formData.qsl_sent} onChange={(e) => setFormData({ ...formData, qsl_sent: e.target.checked })}
                  className="w-4 h-4 accent-amber-500 bg-[#09090b] border-zinc-700 rounded-none" />
                <span className="text-xs font-mono text-zinc-400 uppercase tracking-wider">{t("qso.qsl_sent")}</span>
              </label>
            )}
            <label className="flex items-center gap-2 cursor-pointer" data-testid="qsl-received-toggle">
              <input type="checkbox" checked={formData.qsl_received} onChange={(e) => setFormData({ ...formData, qsl_received: e.target.checked })}
                className="w-4 h-4 accent-amber-500 bg-[#09090b] border-zinc-700 rounded-none" />
              <span className="text-xs font-mono text-zinc-400 uppercase tracking-wider">{t("qso.qsl_received")}</span>
            </label>
          </div>
          <Button data-testid="qso-submit-button" type="submit"
            className="w-full bg-amber-500 hover:bg-amber-600 text-black font-bold uppercase tracking-wider rounded-none h-12 transition-all duration-200 shadow-[0_0_15px_rgba(245,158,11,0.15)] hover:shadow-[0_0_20px_rgba(245,158,11,0.3)]">
            {t("qso.save")}
          </Button>
        </form>
      </div>
    </div>
  );
}


